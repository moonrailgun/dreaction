import { StyleSheet, TouchableOpacity } from 'react-native';
import { DReactionProfiler } from 'dreaction-react-native';
import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';
import { useState } from 'react';

export default function TabTwoScreen() {
  const [counter, setCounter] = useState(0);

  return (
    <DReactionProfiler id="tab-two">
      <View style={styles.container}>
        <Text style={styles.title}>Tab Two</Text>
        <View
          style={styles.separator}
          lightColor="#eee"
          darkColor="rgba(255,255,255,0.1)"
        />
        <Text>Counter: {counter}</Text>
        <TouchableOpacity onPress={() => setCounter((s) => s + 1)}>
          <Text>Inc</Text>
        </TouchableOpacity>
        <EditScreenInfo path="app/(tabs)/two.tsx" />
      </View>
    </DReactionProfiler>
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
});
