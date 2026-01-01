import WebSocket from 'ws';
import type {
  CommandMap,
  CommandTypeKey,
  CustomCommandArg,
} from 'dreaction-protocol';
import type { ClientOptions } from './client-options';
import type {
  CustomCommand,
  DisplayConfig,
  DReactionCore,
  InferFeatures,
  Plugin,
  PluginCreator,
} from './types';
import validate from './validate';
import serialize from './serialize';
import { start } from './stopwatch';
import { corePlugins } from './plugins';

const RESERVED_FEATURES = [
  'configure',
  'connect',
  'connected',
  'options',
  'plugins',
  'send',
  'socket',
  'startTimer',
  'use',
] as const;

type ReservedKeys = (typeof RESERVED_FEATURES)[number];

const isReservedFeature = (value: string): value is ReservedKeys =>
  RESERVED_FEATURES.includes(value as ReservedKeys);

function emptyPromise() {
  return Promise.resolve('');
}

export class DReactionImpl
  implements
    Omit<
      DReactionCore,
      'options' | 'plugins' | 'configure' | 'connect' | 'use' | 'close'
    >
{
  options!: ClientOptions<DReactionCore>;
  connected = false;
  socket: WebSocket = null as never;
  plugins: Plugin<this>[] = [];
  sendQueue: string[] = [];
  isReady = false;
  lastMessageDate = new Date();
  customCommands: CustomCommand[] = [];
  customCommandLatestId = 1;

  private connectPromiseResolve: (() => void) | null = null;
  private connectPromiseReject: ((error: Error) => void) | null = null;
  private connectPromise: Promise<void> | null = null;

  startTimer = () => start();

  configure(
    options: ClientOptions<this> = {}
  ): ClientOptions<this>['plugins'] extends PluginCreator<this>[]
    ? this & InferFeatures<ClientOptions<this>['plugins']>
    : this {
    const newOptions = {
      createSocket: null as never,
      host: 'localhost',
      port: 9600,
      name: 'dreaction-core-client',
      secure: false,
      plugins: corePlugins as any,
      safeRecursion: true,
      onCommand: () => null,
      onConnect: () => null,
      onDisconnect: () => null,
      ...this.options,
      ...options,
    } satisfies ClientOptions<DReactionCore>;

    validate(newOptions);
    this.options = newOptions;

    if (Array.isArray(this.options.plugins)) {
      this.options.plugins.forEach((p) => this.use(p as never));
    }

    return this as this &
      InferFeatures<Exclude<ClientOptions<this>['plugins'], undefined>>;
  }

  close() {
    this.connected = false;
    this.socket?.close?.();

    if (this.connectPromiseReject) {
      this.connectPromiseReject(new Error('Connection closed'));
      this.connectPromiseResolve = null;
      this.connectPromiseReject = null;
    }

    return this;
  }

  connect() {
    this.connected = true;

    this.connectPromise = new Promise<void>((resolve, reject) => {
      this.connectPromiseResolve = resolve;
      this.connectPromiseReject = reject;
    });

    const {
      createSocket,
      secure,
      host,
      environment,
      port,
      name,
      client = {},
      info = {},
      getClientId,
      onCommand,
      onConnect,
      onDisconnect,
    } = this.options;

    if (!host) {
      console.log('host is not config, skip connect.');
      if (this.connectPromiseReject) {
        this.connectPromiseReject(new Error('Host is not configured'));
        this.connectPromiseResolve = null;
        this.connectPromiseReject = null;
      }
      return this;
    }

    const protocol = secure ? 'wss' : 'ws';
    const socket = createSocket!(`${protocol}://${host}:${port}`);

    const onOpen = () => {
      onConnect?.();
      this.plugins.forEach((p) => p.onConnect?.());

      if (this.connectPromiseResolve) {
        this.connectPromiseResolve();
        this.connectPromiseResolve = null;
        this.connectPromiseReject = null;
      }

      const getClientIdPromise = getClientId || emptyPromise;
      getClientIdPromise(name!).then((clientId) => {
        this.isReady = true;
        this.send('client.intro', {
          environment,
          ...client,
          ...info,
          name,
          clientId,
          dreactionCoreClientVersion: 'DREACTION_CORE_CLIENT_VERSION',
        });

        while (this.sendQueue.length > 0) {
          const h = this.sendQueue.shift()!;
          this.socket.send(h);
        }
      });
    };

    const onClose = () => {
      this.isReady = false;

      if (this.connectPromiseReject) {
        this.connectPromiseReject(new Error('Connection failed or closed'));
        this.connectPromiseResolve = null;
        this.connectPromiseReject = null;
      }

      onDisconnect?.();
      this.plugins.forEach((p) => p.onDisconnect?.());
    };

    const decodeCommandData = (data: unknown) => {
      if (typeof data === 'string') return JSON.parse(data);
      if (Buffer.isBuffer(data)) return JSON.parse(data.toString());
      return data;
    };

    const onMessage = (data: any) => {
      const command = decodeCommandData(data);
      onCommand?.(command);
      this.plugins.forEach((p) => p.onCommand?.(command));

      if (command.type === 'custom') {
        this.customCommands
          .filter((cc) =>
            typeof command.payload === 'string'
              ? cc.command === command.payload
              : cc.command === command.payload.command
          )
          .forEach(async (cc) => {
            const res = await cc.handler(
              typeof command.payload === 'object' ? command.payload.args : {}
            );
            if (res) {
              this.send('customCommand.response', {
                command: cc.command,
                payload: res,
              });
            }
          });
      } else if (command.type === 'setClientId') {
        this.options.setClientId?.(command.payload);
      }
    };

    if ('on' in socket && typeof socket.on === 'function') {
      const nodeWebSocket = socket as WebSocket;
      nodeWebSocket.on('open', onOpen);
      nodeWebSocket.on('close', onClose);
      nodeWebSocket.on('message', onMessage);
      this.socket = socket;
    } else {
      const browserWebSocket = socket as WebSocket;
      socket.onopen = onOpen;
      socket.onclose = onClose;
      socket.onmessage = (evt: WebSocket.MessageEvent) => onMessage(evt.data);
      this.socket = browserWebSocket;
    }

    return this;
  }

  send = <Type extends CommandTypeKey>(
    type: Type,
    payload?: CommandMap[Type]['payload'],
    important?: boolean
  ) => {
    const date = new Date();
    let deltaTime = date.getTime() - this.lastMessageDate.getTime();
    if (deltaTime < 0) deltaTime = 0;
    this.lastMessageDate = date;

    const fullMessage = {
      type,
      payload,
      important: !!important,
      date: date.toISOString(),
      deltaTime,
    };

    const serializedMessage = serialize(fullMessage, this.options.proxyHack);

    if (this.isReady) {
      try {
        this.socket.send(serializedMessage);
      } catch {
        this.isReady = false;
        console.log(
          'An error occurred communicating with dreaction. Please reload your app'
        );
      }
    } else {
      this.sendQueue.push(serializedMessage);
    }
  };

  display(config: DisplayConfig) {
    const { name, value, preview, image: img, important = false } = config;
    this.send(
      'display',
      {
        name,
        value: value || null,
        preview: preview || null,
        image: img || null,
      },
      important
    );
  }

  reportError(this: any, error: Error) {
    this.error(error);
  }

  use<P extends PluginCreator<this>>(
    pluginCreator: P
  ): this & InferFeatures<P> {
    if (typeof pluginCreator !== 'function') {
      throw new Error('plugins must be a function');
    }

    const plugin = pluginCreator.bind(this)(this) as ReturnType<P>;

    if (typeof plugin !== 'object') {
      throw new Error('plugins must return an object');
    }

    if (plugin.features) {
      if (typeof plugin.features !== 'object') {
        throw new Error('features must be an object');
      }

      Object.keys(plugin.features).forEach((key) => {
        const featureFunction = plugin.features![key];

        if (typeof featureFunction !== 'function') {
          throw new Error(`feature ${key} is not a function`);
        }

        if (isReservedFeature(key)) {
          throw new Error(`feature ${key} is a reserved name`);
        }

        (this as any)[key] = featureFunction;
      });
    }

    this.plugins.push(plugin);
    plugin.onPlugin?.bind(this)(this);

    return this as this & InferFeatures<P>;
  }

  registerCustomCommand(
    config: CustomCommand,
    optHandler?: () => void
  ): () => void {
    let command: string;
    let handler: (args: Record<string, any>) => void;
    let title!: string;
    let description!: string;
    let args!: CustomCommandArg[];

    if (typeof config === 'string') {
      command = config;
      handler = optHandler!;
    } else {
      command = config.command;
      handler = config.handler;
      title = config.title!;
      description = config.description!;
      args = config.args!;
    }

    if (!command) throw new Error('A command is required');
    if (!handler)
      throw new Error(`A handler is required for command "${command}"`);

    const existingCommands = this.customCommands.filter(
      (cc) => cc.command === command
    );
    existingCommands.forEach((cmd) => {
      this.customCommands = this.customCommands.filter(
        (cc) => cc.id !== cmd.id
      );
      this.send('customCommand.unregister', {
        id: cmd.id,
        command: cmd.command,
      });
    });

    if (args) {
      const argNames: string[] = [];
      args.forEach((arg) => {
        if (!arg.name) {
          throw new Error(
            `A arg on the command "${command}" is missing a name`
          );
        }
        if (argNames.includes(arg.name)) {
          throw new Error(
            `A arg with the name "${arg.name}" already exists in the command "${command}"`
          );
        }
        argNames.push(arg.name);
      });
    }

    const customHandler: CustomCommand = {
      id: this.customCommandLatestId++,
      command,
      handler,
      title,
      description,
      args,
      responseViewType: config.responseViewType,
    };

    this.customCommands.push(customHandler);

    this.send('customCommand.register', {
      id: customHandler.id,
      command: customHandler.command,
      title: customHandler.title,
      description: customHandler.description,
      args: customHandler.args,
      responseViewType: customHandler.responseViewType,
    });

    return () => {
      this.customCommands = this.customCommands.filter(
        (cc) => cc.id !== customHandler.id
      );
      this.send('customCommand.unregister', {
        id: customHandler.id,
        command: customHandler.command,
      });
    };
  }

  waitForConnect(): Promise<void> {
    if (this.isReady) return Promise.resolve();
    if (this.connectPromise) return this.connectPromise;
    return Promise.reject(new Error('Not connected. Call connect() first.'));
  }
}

export function createClient<Client extends DReactionCore = DReactionCore>(
  options?: ClientOptions<Client>
) {
  const client = new DReactionImpl();
  return client.configure(options as never) as unknown as Client;
}
