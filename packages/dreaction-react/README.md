# DReaction React

DReaction client library for React web applications with plugin support for debugging and monitoring.

## Installation

```bash
npm install dreaction-react
# or
yarn add dreaction-react
# or
pnpm add dreaction-react
```

## Quick Start

```typescript
import { dreaction } from 'dreaction-react';

// Configure and enable plugins
dreaction
  .configure({
    host: 'localhost',
    port: 9600,
    name: 'My React App',
  })
  .useReact() // Enable all plugins
  .connect();  // Connect to DReaction server
```

## Usage with ConfigPanel

For a better user experience, you can use the built-in `ConfigPanel` component:

```tsx
import { ConfigPanel } from 'dreaction-react';

function App() {
  return (
    <div>
      <YourApp />
      <ConfigPanel />
    </div>
  );
}
```

### Auto-Reconnect Feature

The `ConfigPanel` automatically remembers your connection settings and status. When you refresh the page:
- **Host and Port** settings are saved to localStorage
- **Connection state** is remembered
- If you were connected before refresh, it will **automatically reconnect**

This means you only need to configure and connect once, and all future page loads will automatically restore your connection!

**Important**: Make sure to call `.useReact()` to enable plugins before connecting:

```typescript
// In your initialization file (e.g., utils/dreaction.ts)
import { dreaction } from 'dreaction-react';

dreaction
  .configure({
    info: {
      appName: 'My App',
    },
  })
  .useReact(); // This is required to enable plugins!

export { dreaction };
```

## Plugins

DReaction React comes with built-in plugins for debugging:

### 1. **Networking Plugin**
Intercepts and monitors network requests (fetch and XMLHttpRequest).

### 2. **localStorage Plugin**
Tracks all localStorage operations (setItem, removeItem, clear).

### 3. **Console Logs Plugin**
Captures console.log, console.warn, console.debug, and console.info calls.

### 4. **Global Errors Plugin**
Catches unhandled errors and promise rejections.

## Plugin Configuration

You can customize plugin behavior:

```typescript
dreaction.useReact({
  // Enable/disable error tracking
  errors: true, // or provide options: { veto: (frame) => boolean }
  
  // Enable/disable console logging
  log: true,
  
  // Configure localStorage monitoring
  localStorage: {
    ignore: ['SOME_KEY_TO_IGNORE'] // Keys to ignore
  },
  
  // Configure network monitoring
  networking: {
    ignoreUrls: /analytics|tracking/, // URLs to ignore
    ignoreContentTypes: /image/, // Content types to ignore
  }
});
```

### Disable Specific Plugins

```typescript
dreaction.useReact({
  errors: false,      // Disable error tracking
  log: false,         // Disable console logging
  localStorage: false, // Disable localStorage monitoring
  networking: false,  // Disable network monitoring
});
```

## Data Watchers

Monitor React state in real-time:

```typescript
import { dreaction } from 'dreaction-react';

// Register a data watcher
export const { useDebugDataWatch: useDebugCounter } = 
  dreaction.registerDataWatcher('counter', 'text');

// Use in your component
function Counter() {
  const [count, setCount] = useState(0);
  
  // This will send updates to DReaction server
  useDebugCounter(count);
  
  return <div>Count: {count}</div>;
}
```

### Data Watch Types

- `'text'` - Display as text
- `'json'` - Display as formatted JSON
- `'list'` - Display as a list

## Custom Commands

Register custom commands that can be triggered from the DReaction app:

```typescript
dreaction.registerCustomCommand({
  title: 'Clear Cache',
  command: 'clearCache',
  description: 'Clear application cache',
  handler: async () => {
    localStorage.clear();
    return 'Cache cleared successfully';
  }
});

// Commands with arguments
dreaction.registerCustomCommand({
  title: 'Set User',
  command: 'setUser',
  description: 'Set current user',
  args: [
    {
      name: 'userId',
      type: 'string',
    }
  ],
  handler: async (args) => {
    console.log('Setting user:', args.userId);
    return `User set to: ${args.userId}`;
  }
});
```

## API Reference

### `dreaction.useReact(options?)`

Enable React plugins with optional configuration.

**Parameters:**
- `options.errors` - Error tracking options or boolean
- `options.log` - Enable console logging (boolean)
- `options.localStorage` - localStorage monitoring options or boolean
- `options.networking` - Network monitoring options or boolean

**Returns:** `dreaction` instance (chainable)

### `dreaction.configure(options)`

Configure DReaction client settings.

**Parameters:**
- `options.host` - Server host (default: 'localhost')
- `options.port` - Server port (default: 9600)
- `options.name` - Application name
- `options.info` - Additional info object

**Returns:** `dreaction` instance (chainable)

### `dreaction.connect()`

Connect to DReaction server and activate all plugins.

**Returns:** `dreaction` instance (chainable)

### `dreaction.close()`

Disconnect from server and deactivate plugins.

**Returns:** `dreaction` instance (chainable)

### `dreaction.registerDataWatcher(name, type, options?)`

Register a data watcher for monitoring React state.

**Parameters:**
- `name` - Watcher identifier
- `type` - Display type ('text' | 'json' | 'list')
- `options.enabled` - Enable/disable watcher (default: true in development)

**Returns:** Object with `useDebugDataWatch` hook

### `dreaction.registerCustomCommand(config)`

Register a custom command.

**Parameters:**
- `config.title` - Command title
- `config.command` - Command identifier
- `config.description` - Command description
- `config.args` - Array of argument definitions
- `config.handler` - Command handler function

**Returns:** Unregister function

## Example

Check out the complete example in `example/nextjs/` directory.

## License

MIT
