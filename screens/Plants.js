import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFetch } from '../hooks/useFetch';
import { useAuth } from '../core/AuthContext';
import CardPlants from '../components/CardPlants';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const Plants = ({ route, navigation }) => {
  const { gardenId: gardenIdParam, gardenName: gardenNameParam, refresh } = route.params || {};
  const { accessToken } = useAuth();

  const [gardenId, setGardenId] = useState(gardenIdParam);
  const [gardenName, setGardenName] = useState(gardenNameParam);
  const [reloadFlag, setReloadFlag] = useState(false);

  useFocusEffect(
  React.useCallback(() => {
    if (route.params?.refresh) {
      console.log('[Plants] Se recibió refresh, forzando recarga de datos...');
      setReloadFlag(prev => !prev); // Fuerza la recarga de datos
      navigation.setParams({ refresh: false }); // Limpia el flag para evitar recargas innecesarias
    }
  }, [route.params?.refresh])
);

  useEffect(() => {
    // Al montar o cambiar params iniciales, guarda gardenId y gardenName en estado local
    if (gardenIdParam) setGardenId(gardenIdParam);
    if (gardenNameParam) setGardenName(gardenNameParam);
  }, [gardenIdParam, gardenNameParam]);

  if (!gardenId) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No se encontró el ID del jardín.</Text>
      </View>
    );
  }

  const url = `https://florafind-aau6a.ondigitalocean.app/gardens/${gardenId}/plants?limit=50&skip=0`;
  const { data, loading, error } = useFetch(url, accessToken, reloadFlag);

  const plants = data?.items || [];

  const handleIdentifyPress = () => {
    if (!accessToken) {
      alert('No autorizado. Por favor, inicia sesión.');
      return;
    }
    navigation.replace('AddPlant', { gardenId});
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Plantas de {gardenName}</Text>
      <ScrollView
        contentContainerStyle={styles.plantsContainer}
        showsVerticalScrollIndicator={false}
      >
        {plants.length === 0 ? (
          <Text style={styles.noPlantsText}>No hay plantas en este jardín.</Text>
        ) : (
          plants.map((plant) => {
            const imageUri = plant.image_url && plant.image_url !== "null" ? plant.image_url : null;
            const plantName = plant.alias || "Sin nombre";
            const scientificName = plant.scientific_name_without_author || "Nombre científico desconocido";

            return (
              <CardPlants
                key={plant.id}
                imageUri={imageUri}
                name={plantName}
                scientificName={scientificName}
                plantProps={plant}
                gardenName={gardenName}
              />
            );
          })
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.floatingButton}
        onPress={handleIdentifyPress}
        activeOpacity={0.7}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 8, backgroundColor: '#f9f9f9' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#4CAF50', marginBottom: 20, textAlign: 'center', paddingHorizontal: 8 },
  plantsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    paddingBottom: 20,
  },
  noPlantsText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    marginTop: 40,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: 'red', fontSize: 16, textAlign: 'center' },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 32,
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default Plants;
