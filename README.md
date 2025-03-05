# DReaction

Your best debug tool in `react-native`

**feature**:
- show logs
- network interceptor
- data watcher
- custom command


## Get start

### Install Client

Download binary client in release page.

[https://github.com/moonrailgun/dreaction/releases](https://github.com/moonrailgun/dreaction/releases)

### React Native

```bash
npm install dreaction-react-native
```

Auto connect in dev

```typescript
import { dreaction } from 'dreaction-react-native';

if(__DEV__) {
  dreaction
    .configure()
    .setAsyncStorageHandler(AsyncStorage)
    .useReactNative()
    .connect();
}
```

or use a ball which can custom ip in mobile, its very helpful for your application is running in a non-developer's phone.

```tsx
import { DReactionDraggableBall } from 'dreaction-react-native';

function AppContainer() {
  return (
    <>
      <App />
      <DReactionDraggableBall />
    </>
  );
}
```
