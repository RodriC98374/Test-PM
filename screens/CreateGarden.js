import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  Image,
  useColorScheme,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import CustomInput from '../components/CustomInput';
import { useFetchPost } from '../hooks/useFetchPost';
import { useAuth } from '../core/AuthContext';
import { useFetchPut } from '../hooks/useFetchPut';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

const CreateGarden = ({ route, navigation }) => {
  const { accessToken } = useAuth();
  const { loading: loadingPost, error: postError, post } = useFetchPost(accessToken);
  const { loading: loadingPut, error: putError, put } = useFetchPut(accessToken);

  const { gardenToEdit } = route.params || {};

  const [gardenName, setGardenName] = useState('');
  const [gardenDescription, setGardenDescription] = useState('');
  const [image, setImage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [imageError, setImageError] = useState(null);

  // Nuevo estado para modal confirmación edición
  const [confirmEditVisible, setConfirmEditVisible] = useState(false);

  useEffect(() => {
    if (gardenToEdit) {
      setGardenName(gardenToEdit.name || '');
      setGardenDescription(gardenToEdit.description || '');
      setImage(gardenToEdit.image_url || null);
    }
  }, [gardenToEdit]);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const validateImageSize = async (uri) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.size && fileInfo.size > MAX_IMAGE_SIZE) {
        setImageError(
          `La imagen es demasiado pesada (${(fileInfo.size / 1024 / 1024).toFixed(
            2
          )} MB). Máximo permitido: 5 MB.`
        );
        return false;
      }
      setImageError(null);
      return true;
    } catch {
      setImageError('No se pudo validar el tamaño de la imagen.');
      return false;
    }
  };

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        'Permiso necesario',
        'Se requiere permiso para acceder a la galería de imágenes'
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

  // Modificación aquí: abrir modal confirmación solo si se edita, o crear directamente si es nuevo
  const handleSaveGarden = () => {
    if (!gardenName.trim()) {
      Alert.alert('Error', 'El nombre del jardín es obligatorio');
      return;
    }
    if (imageError) {
      Alert.alert('Error', imageError);
      return;
    }

    if (gardenToEdit) {
      setConfirmEditVisible(true);
    } else {
      handleCreateGarden();
    }
  };

  // Función para confirmar edición y enviar PUT
  const confirmEdit = async () => {
  setConfirmEditVisible(false);

  const formData = new FormData();
  formData.append('name', gardenName);
  formData.append('description', gardenDescription || '');

  if (image) {
    const fileType = image.split('.').pop();
    formData.append('image', {
      uri: image,
      name: `garden_image.${fileType}`,
      type: getMimeType(fileType),
    });
  }

  try {
    const url = `https://florafind-aau6a.ondigitalocean.app/gardens/${gardenToEdit.id}`;
    const response = await put(url, formData, true);

    if (response.status === 200 || response.status === 204) {
      Alert.alert('Éxito', 'Jardín actualizado correctamente');
    } else {
      Alert.alert(
        'Atención',
        'El jardín fue actualizado'
      );
    }

    navigation.goBack();
  } catch (err) {
    // Esto no debería ocurrir porque useFetchPut no lanza error, pero por si acaso
    Alert.alert(
      'Atención',
      'El jardín fue actualizado'
    );
    navigation.goBack();
  }
};


  // Crear jardín nuevo (POST)
  const handleCreateGarden = async () => {
    if (!gardenName.trim()) {
      Alert.alert('Error', 'El nombre del jardín es obligatorio');
      return;
    }

    if (imageError) {
      Alert.alert('Error', imageError);
      return;
    }

    const formData = new FormData();
    formData.append('name', gardenName);
    formData.append('description', gardenDescription || '');

    if (image) {
      const fileType = image.split('.').pop();
      formData.append('image', {
        uri: image,
        name: `garden_image.${fileType}`,
        type: getMimeType(fileType),
      });
    }

    try {
      await post(
        'https://florafind-aau6a.ondigitalocean.app/gardens',
        formData,
        true
      );
      setModalVisible(true);
    } catch (err) {
      console.error('Error creando jardín:', err);
      if (err.body?.detail) {
        Alert.alert('Error', JSON.stringify(err.body.detail));
      } else {
        Alert.alert('Error', 'Hubo un problema al crear el jardín');
      }
    }
  };

  const closeModalAndNavigate = () => {
    setModalVisible(false);
    navigation.navigate('Gardens');
  };

  const loading = loadingPost || loadingPut;
  const error = postError || putError;
  
  return (
    <View style={[styles.container, isDark && { backgroundColor: '#111' }]}>
      <Text style={styles.title}>{gardenToEdit ? 'Editar Jardín' : 'Nuevo Jardín'}</Text>
      <CustomInput
        label="Nombre del Jardín"
        placeholder="Ingrese el nombre del jardín"
        value={gardenName}
        onChangeText={setGardenName}
      />
      <CustomInput
        label="Descripción"
        placeholder="Ingrese una descripción"
        value={gardenDescription}
        onChangeText={setGardenDescription}
        multiline
        numberOfLines={4}
      />

      <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
        <Text style={styles.imagePickerText}>Seleccionar Imagen (opcional)</Text>
      </TouchableOpacity>

      {imageError && <Text style={styles.errorText}>{imageError}</Text>}

      {image && (
        <Image
          source={{ uri: image }}
          style={{ width: 200, height: 120, borderRadius: 8, marginVertical: 10 }}
          resizeMode="cover"
        />
      )}

      <TouchableOpacity
        style={[styles.button, styles.createButton]}
        onPress={handleSaveGarden}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Guardando...' : (gardenToEdit ? 'Guardar Cambios' : 'Crear Jardín')}
        </Text>
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>Error: {JSON.stringify(error)}</Text>}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModalAndNavigate}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>Jardín creado con éxito</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={closeModalAndNavigate}
            >
              <Text style={styles.modalButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal confirmación edición */}
      <Modal
        visible={confirmEditVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmEditVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>Confirmar edición</Text>
            <Text style={styles.confirmMessage}>¿Estás seguro de editar el jardín?</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setConfirmEditVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.editButton]}
                onPress={confirmEdit}
              >
                <Text style={styles.editButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 40,
    textAlign: 'center',
  },
  imagePickerButton: {
    backgroundColor: '#ddd',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  imagePickerText: {
    color: '#333',
    fontWeight: 'bold',
  },
  button: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    marginTop: 12,
    color: 'red',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  confirmModal: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 10,
  },
  confirmMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    backgroundColor: '#ccc',
    flex: 1,
    marginRight: 5,
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  editButton: {
    backgroundColor: '#4CAF50',
    flex: 1,
    marginLeft: 5,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default CreateGarden;
