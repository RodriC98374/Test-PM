import React, { useState } from 'react';
import {
  View, Text, TextInput, Button, ScrollView, Alert, Pressable, StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRoute } from '@react-navigation/native';

const DiasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const tiposDisponibles = ['regar', 'fertilizar', 'podar', 'trasplantar', 'otros'];
const frecuenciasDisponibles = ['once', 'daily', 'weekly'];

const añadirmanual = ({ navigation }) => {
    const route = useRoute();
  const { plant, garden } = route.params || {};

  const [alarm, setAlarm] = useState({
    id: Date.now(),
    title: '',
    description: '',
    type: 'regar',
    frequency: 'once',
    days: [],
    date: new Date(),
    hour: new Date().getHours(),
    minute: new Date().getMinutes(),
     plantId: plant?.id,
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const toggleDay = (index) => {
    setAlarm((prev) => {
      const days = prev.days.includes(index)
        ? prev.days.filter((d) => d !== index)
        : [...prev.days, index];
      return { ...prev, days };
    });
  };

  const selectTipo = (tipo) => setAlarm((prev) => ({ ...prev, type: tipo }));
  const selectFrecuencia = (freq) =>
    setAlarm((prev) => ({ ...prev, frequency: freq, days: freq === 'weekly' ? prev.days : [] }));

  const onTimeChange = (_, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setAlarm((prev) => ({
        ...prev,
        hour: selectedTime.getHours(),
        minute: selectedTime.getMinutes(),
      }));
    }
  };

  const onDateChange = (_, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setAlarm((prev) => ({ ...prev, date: selectedDate }));
    }
  };

  const handleSave = async () => {
    try {
      const stored = await AsyncStorage.getItem('alarms');
      const alarms = stored ? JSON.parse(stored) : [];

      const newAlarm = {
        ...alarm,
        date: alarm.date instanceof Date ? alarm.date.toISOString() : alarm.date,
      };

      alarms.push(newAlarm);
      await AsyncStorage.setItem('alarms', JSON.stringify(alarms));
      Alert.alert('Éxito', 'Alarma guardada');
      navigation.navigate('GestionAlarmas');
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar la alarma');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Nueva Alarma</Text>

      <Text style={styles.label}>Título:</Text>
      <TextInput
        style={styles.input}
        value={alarm.title}
        onChangeText={(text) => setAlarm({ ...alarm, title: text })}
        placeholder="Título"
        placeholderTextColor="#A5D6A7"
      />

      <Text style={styles.label}>Descripción:</Text>
      <TextInput
        style={styles.input}
        value={alarm.description}
        onChangeText={(text) => setAlarm({ ...alarm, description: text })}
        placeholder="Descripción"
        placeholderTextColor="#A5D6A7"
      />

      <Text style={styles.label}>Tipo:</Text>
      <View style={styles.selectionContainer}>
        {tiposDisponibles.map((tipo) => (
          <Pressable
            key={tipo}
            onPress={() => selectTipo(tipo)}
            style={[
              styles.selectButton,
              alarm.type === tipo ? styles.selectedButton : styles.unselectedButton,
            ]}
          >
            <Text style={{ color: alarm.type === tipo ? 'white' : '#4CAF50' }}>
              {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Frecuencia:</Text>
      <View style={styles.selectionContainer}>
        {frecuenciasDisponibles.map((freq) => (
          <Pressable
            key={freq}
            onPress={() => selectFrecuencia(freq)}
            style={[
              styles.selectButton,
              alarm.frequency === freq ? styles.selectedButton : styles.unselectedButton,
            ]}
          >
            <Text style={{ color: alarm.frequency === freq ? 'white' : '#4CAF50' }}>
              {freq === 'once' ? 'Una vez' : freq === 'daily' ? 'Diario' : 'Semanal'}
            </Text>
          </Pressable>
        ))}
      </View>

      {alarm.frequency === 'weekly' && (
        <>
          <Text style={styles.label}>Días:</Text>
          <View style={styles.daysContainer}>
            {DiasSemana.map((dia, i) => (
              <Pressable
                key={i}
                onPress={() => toggleDay(i)}
                style={[
                  styles.dayButton,
                  alarm.days.includes(i) ? styles.daySelected : styles.dayUnselected,
                ]}
              >
                <Text style={{ color: alarm.days.includes(i) ? 'white' : '#4CAF50' }}>
                  {dia}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {alarm.frequency === 'once' && (
        <>
          <Text style={styles.label}>Fecha:</Text>
          <Button
            title={alarm.date.toLocaleDateString()}
            onPress={() => setShowDatePicker(true)}
            color="#4CAF50"
          />
          {showDatePicker && (
            <DateTimePicker
              value={alarm.date}
              mode="date"
              display="default"
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}
        </>
      )}

      <Text style={styles.label}>Hora:</Text>
      <Button
        title={`${alarm.hour.toString().padStart(2, '0')}:${alarm.minute
          .toString()
          .padStart(2, '0')}`}
        onPress={() => setShowTimePicker(true)}
        color="#4CAF50"
      />
      {showTimePicker && (
        <DateTimePicker
          value={new Date(0, 0, 0, alarm.hour, alarm.minute)}
          mode="time"
          display="default"
          onChange={onTimeChange}
          is24Hour={true}
        />
      )}

      <View style={{ marginTop: 30 }}>
        <Button title="Guardar Alarma" onPress={handleSave} color="#4CAF50" />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#4CAF50',
    textAlign: 'center',
  },
  label: {
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 5,
    color: '#4CAF50',
  },
  input: {
    borderWidth: 1,
    borderColor: '#A5D6A7',
    padding: 10,
    borderRadius: 6,
    color: '#4CAF50',
    backgroundColor: 'white',
  },
  selectionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  selectButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#4CAF50',
    marginBottom: 5,
  },
  selectedButton: {
    backgroundColor: '#4CAF50',
  },
  unselectedButton: {
    backgroundColor: '#E8F5E9',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayButton: {
    padding: 10,
    marginRight: 6,
    marginBottom: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4CAF50',
    minWidth: 40,
    alignItems: 'center',
  },
  daySelected: {
    backgroundColor: '#4CAF50',
  },
  dayUnselected: {
    backgroundColor: 'white',
  },
});

export default añadirmanual;
