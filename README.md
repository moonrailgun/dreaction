# DReaction

Your best debug tool in `react-native`

**Highlight**:

- 🟠 Debug Ball (Suuuuuper useful for QA!) 👀
- 📜 Logs/Network (Easily track logs and network requests) 🌐
- 🔍 Data Watcher (Keep an eye on your data in real-time) 📊
- ⚡ Custom Command (Run your own custom commands to make debugging even smoother) 🖥️
- 📈 Performance Monitor (Monitor your app’s performance and optimize like a pro) 💪

## Screenshot

![](./docs/demo.gif)

#### Draggable ball

This is a draggable ball, you can drag it to anywhere you want. useful for your application is running in a non-developer's phone.

![](./docs/1.png)

#### Summary

This is a summary of current connections.

![](./docs/2.png)

#### Logs and Network
![](./docs/3.png)

#### Data Watcher
![](./docs/4.png)

#### Custom Command
![](./docs/5.png)

#### Performance Monitor
![](./docs/6.png)



## Get start

### Install Client in your Desktop

Download binary client in release page.

[https://github.com/moonrailgun/dreaction/releases](https://github.com/moonrailgun/dreaction/releases)

### Install package for React Native

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

## Example

Check here to learn how to use those feature in code

[https://github.com/moonrailgun/dreaction/blob/master/example/expo-app/utils/dreaction.ts](https://github.com/moonrailgun/dreaction/blob/master/example/expo-app/utils/dreaction.ts) 


## Special Thanks

This Project is quick start from [reactotron](https://github.com/infinitered/reactotron), most protocol is same. thanks for provide so easy to use tools. This project just add more easy to use feature and improve UI.

## License

This project is licensed under the MIT License.
