import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Image,
    Alert,
    Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useAuth } from '../core/AuthContext';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const defaultImgPlant = require('../assets/defaultPlant.png');

const EditPlant = ({ route, navigation }) => {
  const { plant, gardenId, gardenName } = route.params;  
  const { accessToken } = useAuth();

  const [alias, setAlias] = useState(plant.alias || '');
  const [image, setImage] = useState(
    plant.image_url && plant.image_url !== 'null' ? plant.image_url : null
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const validateImageSize = async (uri) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.size && fileInfo.size > MAX_IMAGE_SIZE) {
        Alert.alert(
          'Error',
          `La imagen es demasiado pesada (${(fileInfo.size / 1024 / 1024).toFixed(
            2
          )} MB). Máximo permitido: 5 MB.`
        );
        return false;
      }
      return true;
    } catch {
      Alert.alert('Error', 'No se pudo validar el tamaño de la imagen.');
      return false;
    }
  };

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        'Permiso necesario',
        'Se requiere permiso para acceder a la galería de imágenes.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: false,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      const isValid = await validateImageSize(uri);
      if (isValid) {
        setImage(uri);
      }
    }
  };

  const getMimeType = (ext) => {
    switch (ext.toLowerCase()) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      default:
        return 'image/jpeg';
    }
  };

  const onPressSave = () => {
    if (!alias.trim()) {
      Alert.alert('Error', 'El alias es obligatorio');
      return;
    }
    setModalVisible(true);
  };

  const handleSaveChanges = async () => {
    setModalVisible(false);
    setLoading(true);

    const formData = new FormData();
    formData.append('alias', alias.trim());
    formData.append('garden_id', gardenId);  

    if (image && !image.startsWith('http')) {
      const fileType = image.split('.').pop();
      let localUri = image;
      if (!localUri.startsWith('file://')) {
        localUri = 'file://' + localUri;
      }
      formData.append('image', {
        uri: localUri,
        name: `plant_image.${fileType}`,
        type: getMimeType(fileType),
      });
    }

    try {
      const response = await fetch(
        `https://florafind-aau6a.ondigitalocean.app/gardens/plants/${plant.id}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
          body: formData,
        }
      );

      if (!response.ok) {
        let errorMsg = 'Error en la actualización';
        try {
          const errorData = await response.json();
          errorMsg = errorData.detail || JSON.stringify(errorData);
        } catch {
          try {
            errorMsg = await response.text();
          } catch {}
        }
        throw new Error(errorMsg);
      }

      Alert.alert('Éxito', 'Planta actualizada correctamente', [
        {
          text: 'Aceptar',
          onPress: () => {
            console.log('Navegando a Plants después de guardar, gardenId:', gardenId, ' gardenName:', gardenName);
            navigation.navigate('Plants', {
              refresh: true,
              gardenId,
              gardenName,
            });
          },
        },
      ]);
    } catch (error) {
      console.warn('Error en handleSaveChanges:', error.message || error);
      navigation.navigate('Plants', { refresh: true, gardenId, gardenName });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Editar Planta</Text>

      <Text style={styles.label}>Alias</Text>
      <TextInput
        style={styles.input}
        value={alias}
        onChangeText={setAlias}
        placeholder="Ingrese alias"
      />

      <Text style={[styles.label, { marginTop: 24 }]}>Imagen</Text>
      <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
        <Text style={styles.imagePickerText}>Seleccionar Imagen</Text>
      </TouchableOpacity>

      {image ? (
        <Image source={{ uri: image }} style={styles.imagePreview} />
      ) : (
        <Image source={defaultImgPlant} style={styles.imagePreview} />
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={onPressSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
      </View>

      {/* Modal confirmación */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>Confirmar cambios</Text>
            <Text style={styles.confirmMessage}>¿Deseas guardar los cambios?</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButtonModal]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButtonModal]}
                onPress={handleSaveChanges}
              >
                <Text style={styles.saveButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#4CAF50' },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  imagePickerButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  imagePickerText: { color: '#fff', fontWeight: '600' },
  imagePreview: { width: '100%', height: 200, marginTop: 12, borderRadius: 12 },
  errorText: { color: 'red', marginTop: 10, textAlign: 'center' },
  buttonsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 },
  button: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: { backgroundColor: '#4CAF50' },
  cancelButton: { backgroundColor: '#ddd' },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cancelButtonText: { fontWeight: '700', fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmModal: {
    backgroundColor: '#fff',
    width: '80%',
    borderRadius: 12,
    padding: 20,
  },
  confirmTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#4CAF50' },
  confirmMessage: { fontSize: 16, marginBottom: 20 },
  confirmButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  cancelButtonModal: { flex: 1, marginRight: 10, backgroundColor: '#ddd' },
  saveButtonModal: { flex: 1, backgroundColor: '#4CAF50' },
});

export default EditPlant;
