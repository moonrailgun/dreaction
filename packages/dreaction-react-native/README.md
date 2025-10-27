# DReaction React Native

DReaction client library for React Native applications with powerful debugging tools and built-in UI components.

## ✨ Features

- 🟠 **Draggable Debug Ball** - Visual debug interface that can be moved anywhere on screen
- 📜 **Logs & Network Monitoring** - Track console logs and network requests in real-time
- 🔍 **Data Watcher** - Monitor React state changes in real-time
- ⚡ **Custom Commands** - Execute custom debugging commands remotely
- 📈 **Performance Monitor** - Track app performance metrics
- 💾 **AsyncStorage Tracking** - Monitor all AsyncStorage operations
- 🎯 **Error Tracking** - Capture unhandled errors and promise rejections
- 📱 **Platform Agnostic** - Works on both iOS and Android

## Installation

```bash
npm install dreaction-react-native @react-native-async-storage/async-storage
# or
yarn add dreaction-react-native @react-native-async-storage/async-storage
# or
pnpm add dreaction-react-native @react-native-async-storage/async-storage
```

### Prerequisites

DReaction requires the DReaction desktop application to be running. Download it from:

[https://github.com/moonrailgun/dreaction/releases](https://github.com/moonrailgun/dreaction/releases)

## Quick Start

### 1. Setup DReaction

```typescript
import { dreaction } from 'dreaction-react-native';

dreaction
  .configure({
    host: 'YOUR_COMPUTER_IP', // e.g., '192.168.1.100'
    port: 9600,
    name: 'My React Native App',
  })
  .useReactNative() // Enable all plugins
  .connect();
```

### 2. Add the Draggable Debug Ball

The draggable ball provides quick access to connection settings and debug features:

```tsx
import { DraggableBall } from 'dreaction-react-native';

export default function App() {
  return (
    <>
      <YourApp />
      {__DEV__ && <DraggableBall />}
    </>
  );
}
```

The draggable ball can be moved anywhere on screen and provides:
- Quick connection status indicator
- Access to configuration dialog
- One-tap connect/disconnect

## Components

### DraggableBall

A floating button that can be dragged anywhere on the screen. Perfect for production testing and QA.

```tsx
import { DraggableBall } from 'dreaction-react-native';

<DraggableBall />
```

**Features:**
- Draggable to any position on screen
- Visual connection status indicator
- Opens configuration dialog on tap
- Automatically saves position

### ConfigDialog

A configuration dialog for connection settings. Usually opened via DraggableBall.

```tsx
import { ConfigDialog } from 'dreaction-react-native';

<ConfigDialog
  visible={visible}
  onClose={() => setVisible(false)}
/>
```

## Plugins

DReaction React Native comes with comprehensive built-in plugins:

### 1. **Networking Plugin**
Intercepts and monitors all network requests including fetch and XMLHttpRequest.

```typescript
dreaction.useReactNative({
  networking: {
    ignoreUrls: /analytics|tracking/,
    ignoreContentTypes: /image|video/,
  }
});
```

### 2. **AsyncStorage Plugin**
Tracks all AsyncStorage operations (getItem, setItem, removeItem, clear).

```typescript
dreaction.useReactNative({
  asyncStorage: {
    ignore: ['some-key-to-ignore']
  }
});
```

### 3. **Console Logs Plugin**
Captures all console methods (log, warn, error, debug, info).

### 4. **Global Errors Plugin**
Catches unhandled errors and promise rejections with stack traces.

```typescript
dreaction.useReactNative({
  errors: {
    veto: (frame) => {
      // Return true to ignore this error
      return frame.file?.includes('node_modules');
    }
  }
});
```

### 5. **DevTools Plugin**
Enables React DevTools integration and debugging features.

### 6. **Open In Editor Plugin**
Allows opening files directly in your code editor from error stacks.

## Plugin Configuration

### Enable All Plugins (Recommended)

```typescript
dreaction.useReactNative(); // Uses default settings for all plugins
```

### Customize Plugin Settings

```typescript
dreaction.useReactNative({
  // Enable/disable error tracking
  errors: true, // or provide options
  
  // Enable/disable console logging
  log: true,
  
  // Configure AsyncStorage monitoring
  asyncStorage: {
    ignore: ['IGNORED_KEY']
  },
  
  // Configure network monitoring
  networking: {
    ignoreUrls: /analytics/,
    ignoreContentTypes: /image/,
  },
  
  // DevTools integration
  devTools: true,
  
  // Open in editor support
  openInEditor: true,
});
```

### Disable Specific Plugins

```typescript
dreaction.useReactNative({
  errors: false,        // Disable error tracking
  log: false,           // Disable console logging
  asyncStorage: false,  // Disable AsyncStorage monitoring
  networking: false,    // Disable network monitoring
});
```

## Data Watchers

Monitor React Native state in real-time:

```typescript
import { dreaction } from 'dreaction-react-native';

// Register a data watcher
export const { useDebugDataWatch: useDebugUserInfo } = 
  dreaction.registerDataWatcher('userInfo', 'json');

// Use in your component
function UserProfile() {
  const [user, setUser] = useState({ name: 'John', age: 30 });
  
  // This will send updates to DReaction desktop app
  useDebugUserInfo(user);
  
  return <Text>{user.name}</Text>;
}
```

### Data Watch Types

- `'text'` - Display as plain text
- `'json'` - Display as formatted JSON (best for objects)
- `'list'` - Display as a list

### Example: Watching Multiple Values

```typescript
// Register multiple watchers
const { useDebugDataWatch: useDebugCounter } = 
  dreaction.registerDataWatcher('counter', 'text');

const { useDebugDataWatch: useDebugState } = 
  dreaction.registerDataWatcher('appState', 'json');

function MyComponent() {
  const [count, setCount] = useState(0);
  const [state, setState] = useState({ loading: false, data: [] });
  
  useDebugCounter(count);
  useDebugState(state);
  
  // Your component logic...
}
```

## Custom Commands

Register commands that can be triggered remotely from the DReaction desktop app:

```typescript
// Simple command
dreaction.registerCustomCommand({
  title: 'Clear Cache',
  command: 'clearCache',
  description: 'Clear all cached data',
  handler: async () => {
    await AsyncStorage.clear();
    return 'Cache cleared successfully!';
  }
});

// Command with arguments
dreaction.registerCustomCommand({
  title: 'Set Environment',
  command: 'setEnv',
  description: 'Switch environment',
  args: [
    {
      name: 'environment',
      type: 'string',
    }
  ],
  handler: async (args) => {
    console.log('Switching to:', args.environment);
    // Switch environment logic...
    return `Environment set to: ${args.environment}`;
  }
});

// Command with multiple arguments
dreaction.registerCustomCommand({
  title: 'Mock User Login',
  command: 'mockLogin',
  description: 'Login as a test user',
  args: [
    { name: 'userId', type: 'string' },
    { name: 'role', type: 'string' },
  ],
  handler: async (args) => {
    // Mock login logic...
    return `Logged in as ${args.userId} with role ${args.role}`;
  }
});
```

## Performance Monitoring

DReaction automatically tracks performance metrics when connected:

- JavaScript thread FPS
- UI thread FPS
- Memory usage
- Bridge calls

Access these metrics in real-time through the DReaction desktop app.

## Connection Setup

### Finding Your Computer's IP Address

**macOS/Linux:**
```bash
ifconfig | grep "inet "
```

**Windows:**
```bash
ipconfig
```

Look for your local network IP (usually starts with `192.168.` or `10.`).

### Example Setup

```typescript
// utils/dreaction.ts
import { dreaction } from 'dreaction-react-native';

dreaction
  .configure({
    host: '192.168.1.100', // Your computer's IP
    port: 9600,            // Default DReaction port
    info: {
      appName: 'My App',
      version: '1.0.0',
    },
  })
  .useReactNative();

export { dreaction };
```

```tsx
// App.tsx
import { DraggableBall } from 'dreaction-react-native';
import './utils/dreaction'; // Initialize DReaction

export default function App() {
  return (
    <>
      <YourAppContent />
      {__DEV__ && <DraggableBall />}
    </>
  );
}
```

## API Reference

### `dreaction.useReactNative(options?)`

Enable React Native plugins with optional configuration.

**Parameters:**
- `options.errors` - Error tracking options or boolean
- `options.log` - Enable console logging (boolean)
- `options.asyncStorage` - AsyncStorage monitoring options or boolean
- `options.networking` - Network monitoring options or boolean
- `options.devTools` - Enable DevTools integration (boolean)
- `options.openInEditor` - Enable open in editor feature (boolean)

**Returns:** `dreaction` instance (chainable)

### `dreaction.configure(options)`

Configure DReaction client settings.

**Parameters:**
- `options.host` - Server host (e.g., '192.168.1.100')
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

Register a data watcher for monitoring React Native state.

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
- `config.handler` - Async handler function

**Returns:** Unregister function

## Best Practices

1. **Only Enable in Development**
   ```tsx
   {__DEV__ && <DraggableBall />}
   ```

2. **Use Descriptive Watcher Names**
   ```typescript
   dreaction.registerDataWatcher('user-profile', 'json');
   dreaction.registerDataWatcher('cart-items-count', 'text');
   ```

3. **Filter Sensitive Data**
   ```typescript
   dreaction.useReactNative({
     asyncStorage: {
       ignore: ['auth-token', 'user-password']
     }
   });
   ```

4. **Optimize Network Monitoring**
   ```typescript
   dreaction.useReactNative({
     networking: {
       ignoreUrls: /\.jpg|\.png|\.gif/,
       ignoreContentTypes: /^image\//,
     }
   });
   ```

## Troubleshooting

### Cannot Connect to Server

1. Ensure DReaction desktop app is running
2. Verify your computer's IP address is correct
3. Check that your device and computer are on the same network
4. For Android, ensure port 9600 is not blocked

### Draggable Ball Not Showing

1. Make sure it's only rendered in development: `{__DEV__ && <DraggableBall />}`
2. Check that it's not hidden behind other components (it has `zIndex: 999999`)
3. Verify DReaction is properly configured before rendering the ball

### Network Requests Not Showing

1. Ensure networking plugin is enabled
2. Check if URLs are being filtered by `ignoreUrls` pattern
3. Verify the connection is established before making requests

## Example

Check out the complete example in the `example/expo-app/` directory of the DReaction repository.

## License

MIT

## Links

- [GitHub Repository](https://github.com/moonrailgun/dreaction)
- [DReaction Desktop App Releases](https://github.com/moonrailgun/dreaction/releases)
- [Report Issues](https://github.com/moonrailgun/dreaction/issues)
