import React, { useLayoutEffect, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AlarmCard from '../components/AlarmCard'; 

const STORAGE_KEY = 'alarms';

const GestionAlarmasScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const { plant, garden } = route.params || {};

  const [alarms, setAlarms] = useState([]);
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('añadirmanual', {
              plant: { id: plant?.id, alias: plant?.alias },
              garden: { id: garden?.id, name: garden?.name },
            })
          }

            
          style={{ marginRight: 16 }}
        >
          <Ionicons name="add" size={28} color="4CAF50" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, plant, garden]);

  useEffect(() => {
    const loadAlarms = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
        const allAlarms = jsonValue ? JSON.parse(jsonValue) : [];
        const filtered = allAlarms.filter(a => a.plantId === plant?.id);
        setAlarms(filtered);
      } catch (e) {
        console.error('Error cargando alarmas:', e);
      } finally {
        setLoading(false);
      }
    };

    if (plant?.id) {
      loadAlarms();
    }
  }, [plant]);

  if (!plant || !garden) {
    return (
      <View style={{ padding: 16 }}>
        <Text>Error: Faltan datos de la planta o el jardín.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={{ padding: 16 }}>
        <Text>Cargando alarmas...</Text>
      </View>
    );
  }
  console.log('Alarmas cargadas:', alarms);
  return (
    <View style={{ flex: 1, padding: 16 }}>
      {alarms.length === 0 ? (
        <Text>No hay alarmas configuradas para esta planta.</Text>
      ) : (
        <FlatList
          data={alarms}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => navigation.navigate('DetalleAlarma', { alarmId: item.id })}
            >
              <AlarmCard
                alarm={item}
                plantAlias={plant.alias}
                gardenName={garden.name}
                reviewed={item.reviewed}
              />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

export default GestionAlarmasScreen;
