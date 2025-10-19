import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { getHost } from '../helpers/getHost';
import { dreaction } from '../dreaction';
import { parseHostAndPort } from '../helpers/parseURL';

const LOCAL_CACHE_HOST_NAME = '__dreaction-react-native-host';

interface ConfigDialogProps {
  visible: boolean;
  onConfirm: (config: { host: string; port?: number }) => void;
  onCancel: () => void;
}
export const ConfigDialog: React.FC<ConfigDialogProps> = React.memo((props) => {
  const { visible, onConfirm, onCancel } = props;
  const defaultValue = getHost();
  const [inputValue, setInputValue] = useState(defaultValue);

  const selectTextOnFocus = inputValue === defaultValue;

  useEffect(() => {
    dreaction.asyncStorageHandler
      ?.getItem(LOCAL_CACHE_HOST_NAME)
      .then((host) => {
        if (host) {
          setInputValue(host);
        }
      });
  }, []);

  const handleConfirm = () => {
    const config = parseHostAndPort(inputValue);
    dreaction.asyncStorageHandler?.setItem(LOCAL_CACHE_HOST_NAME, inputValue);
    onConfirm(config);
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
          <Text style={styles.title}>DReaction Desktop Application Host</Text>
          <TextInput
            style={styles.input}
            selectTextOnFocus={selectTextOnFocus}
            value={inputValue}
            keyboardType="url"
            onChangeText={setInputValue}
            placeholder={getHost()}
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.buttonView} onPress={onCancel}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonView} onPress={handleConfirm}>
              <Text style={styles.buttonText}>Confirm</Text>
            </TouchableOpacity>
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
    color: 'black',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    color: 'black',
    padding: 10,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  buttonView: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  buttonText: {
    color: '#2563eb',
  },
});
