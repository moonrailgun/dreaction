import React, { useState } from 'react';
import { View, Text, TextInput, Button, Modal, StyleSheet } from 'react-native';
import { getHost } from '../helpers/getHost';

interface ConfigDialogProps {
  visible: boolean;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}
export const ConfigDialog: React.FC<ConfigDialogProps> = React.memo((props) => {
  const { visible, onConfirm, onCancel } = props;
  const [inputValue, setInputValue] = useState(getHost());

  const handleConfirm = () => {
    onConfirm(inputValue);
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={() => onCancel()}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>DReaction Desktop Application Url</Text>
          <TextInput
            style={styles.input}
            value={inputValue}
            keyboardType="url"
            onChangeText={setInputValue}
            placeholder={getHost()}
          />
          <View style={styles.buttonContainer}>
            <Button title="Cancel" onPress={onCancel} />
            <Button title="Confirm" onPress={handleConfirm} />
          </View>
        </View>
      </View>
    </Modal>
  );
});
ConfigDialog.displayName = 'ConfigDialog';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 10,
    padding: 20,
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});
