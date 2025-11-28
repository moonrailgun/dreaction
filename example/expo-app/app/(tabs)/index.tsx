import { StyleSheet, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useState } from 'react';
import {
  useDebugCounter,
  useDebugList,
  useDebugObject,
} from '@/utils/dreaction';
import { DReactionProfiler } from 'dreaction-react-native';

export default function TabOneScreen() {
  const [counter, setCounter] = useState(0);
  const [arr, setArr] = useState<number[]>([]);

  useDebugCounter(counter);
  useDebugList(arr);
  useDebugObject({ foo: 'bar' });

  const handleRandomArray = () => {
    const randomArray = Array.from(
      { length: Math.round(Math.random() * 100) },
      () => Math.floor(Math.random() * 100)
    );
    setArr(randomArray);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tab One</Text>
      <View
        style={styles.separator}
        lightColor="#eee"
        darkColor="rgba(255,255,255,0.1)"
      />
      <TouchableOpacity
        style={styles.button}
        onPress={() => console.log('Foooooo')}
      >
        <Text>Click here to console string</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => console.log(Math.random())}
      >
        <Text>Click here to console number</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => console.log({ foo: 'bar' })}
      >
        <Text>Click here to console object</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => console.log('1', 2, {}, [])}
      >
        <Text>Click here to console misc</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => console.info('Here is a console.info')}
      >
        <Text>Click here to call console.info</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          fetch('https://github.com/moonrailgun/dreaction')
            .then((response) => response.text())
            .then((data) => console.log(data))
            .catch((error) => console.error(error));
        }}
      >
        <Text>Click here to send network request</Text>
      </TouchableOpacity>

      <DReactionProfiler id="tab-one">
        <View>
          <Text>Counter: {counter}</Text>
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setCounter(counter + 1)}
        >
          <Text>Click here to increase counter</Text>
        </TouchableOpacity>
      </DReactionProfiler>

      <TouchableOpacity style={styles.button} onPress={handleRandomArray}>
        <Text>Click here to set random array</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
  button: {
    height: 40,
  },
});
