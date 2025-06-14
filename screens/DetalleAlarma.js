import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  Button,
  ScrollView,
  StyleSheet,
  Alert,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

const DiasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const tiposDisponibles = ['regar', 'fertilizar', 'podar', 'trasplantar', 'otros'];
const frecuenciasDisponibles = ['once', 'daily', 'weekly'];

const DetalleAlarma = ({ route, navigation }) => {
  const { alarmId } = route.params;
  const [alarm, setAlarm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const loadAlarm = async () => {
      try {
        const stored = await AsyncStorage.getItem('alarms');
        const alarms = stored ? JSON.parse(stored) : [];
        const found = alarms.find(a => a.id === alarmId);
        if (!found) {
          alert('Alarma no encontrada');
          navigation.goBack();
          return;
        }
        if (found.date) {
          found.date = new Date(found.date);
          found.hour = found.date.getHours();
          found.minute = found.date.getMinutes();
        } else {
          found.date = new Date();
          found.hour = found.date.getHours();
          found.minute = found.date.getMinutes();
        }
        if (!Array.isArray(found.days)) {
          found.days = [];
        }
        setAlarm(found);
      } catch (e) {
        alert('Error al cargar la alarma');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    loadAlarm();
  }, [alarmId]);

  if (loading) return <ActivityIndicator size="large" color="#4CAF50" />;
  if (!alarm) return null;

  const toggleDay = (index) => {
    if (!editMode) return;
    setAlarm(prev => {
      const days = prev.days.includes(index)
        ? prev.days.filter(d => d !== index)
        : [...prev.days, index];
      return { ...prev, days };
    });
  };

  const selectTipo = (tipo) => {
    if (!editMode) return;
    setAlarm(prev => ({ ...prev, type: tipo }));
  };

  const selectFrecuencia = (freq) => {
    if (!editMode) return;
    setAlarm(prev => ({
      ...prev,
      frequency: freq,
      days: freq === 'weekly' ? prev.days : [],
    }));
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setAlarm(prev => ({
        ...prev,
        hour: selectedTime.getHours(),
        minute: selectedTime.getMinutes(),
      }));
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setAlarm(prev => ({
        ...prev,
        date: selectedDate,
      }));
    }
  };

  const handleSave = async () => {
    try {
      const stored = await AsyncStorage.getItem('alarms');
      const alarms = stored ? JSON.parse(stored) : [];

      const alarmToSave = {
        ...alarm,
        date: alarm.date instanceof Date ? alarm.date.toISOString() : alarm.date,
      };

      const updated = alarms.map(a => (a.id === alarmToSave.id ? alarmToSave : a));
      await AsyncStorage.setItem('alarms', JSON.stringify(updated));

      Alert.alert('Guardado', 'Alarma actualizada correctamente');
      setEditMode(false);
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar la alarma');
    }
  };

  const handleDelete = async () => {
    Alert.alert('¿Eliminar?', '¿Estás seguro que deseas eliminar esta alarma?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            const stored = await AsyncStorage.getItem('alarms');
            const alarms = stored ? JSON.parse(stored) : [];
            const filtered = alarms.filter(a => a.id !== alarm.id);
            await AsyncStorage.setItem('alarms', JSON.stringify(filtered));
            Alert.alert('Eliminado', 'La alarma ha sido eliminada');
            navigation.navigate('GestionAlarmas');
          } catch (e) {
            Alert.alert('Error', 'No se pudo eliminar la alarma');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{editMode ? 'Editar Alarma' : 'Detalles de Alarma'}</Text>

      <Text style={styles.label}>Título:</Text>
      <TextInput
        style={[styles.input, !editMode && styles.readOnly]}
        editable={editMode}
        value={alarm.title}
        onChangeText={(text) => setAlarm({ ...alarm, title: text })}
        placeholder="Título"
        placeholderTextColor="#A5D6A7"
      />

      <Text style={styles.label}>Descripción:</Text>
      <TextInput
        style={[styles.input, !editMode && styles.readOnly]}
        editable={editMode}
        value={alarm.description || ''}
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
              !editMode && styles.disabledButton,
            ]}
            disabled={!editMode}
          >
            <Text
              style={{
                color: alarm.type === tipo ? 'white' : '#4CAF50',
                fontWeight: '600',
              }}
            >
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
              !editMode && styles.disabledButton,
            ]}
            disabled={!editMode}
          >
            <Text
              style={{
                color: alarm.frequency === freq ? 'white' : '#4CAF50',
                fontWeight: '600',
              }}
            >
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
                  !editMode && styles.disabledButton,
                ]}
                disabled={!editMode}
              >
                <Text style={{ color: alarm.days.includes(i) ? 'white' : '#4CAF50' }}>
                  {dia.slice(0, 3)}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {alarm.frequency === 'once' && (
        <>
          <Text style={styles.label}>Fecha:</Text>
          {editMode ? (
            <>
              <Button
                title={
                  alarm.date instanceof Date
                    ? alarm.date.toLocaleDateString()
                    : alarm.date
                }
                onPress={() => setShowDatePicker(true)}
                color="#4CAF50"
              />
              {showDatePicker && (
                <DateTimePicker
                  value={alarm.date instanceof Date ? alarm.date : new Date()}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                  minimumDate={new Date()}
                />
              )}
            </>
          ) : (
            <Text style={[styles.value, { color: '#4CAF50' }]}>
              {alarm.date instanceof Date
                ? alarm.date.toLocaleDateString()
                : alarm.date}
            </Text>
          )}
        </>
      )}

      <Text style={styles.label}>Hora:</Text>
      {editMode ? (
        <>
          <Button
            title={`${alarm.hour.toString().padStart(2, '0')}:${alarm.minute
              .toString()
              .padStart(2, '0')}`}
            onPress={() => setShowTimePicker(true)}
            color="#4CAF50"
          />
          {showTimePicker && (
            <DateTimePicker
              value={new Date(
                0,
                0,
                0,
                typeof alarm.hour === 'number' ? alarm.hour : 12,
                typeof alarm.minute === 'number' ? alarm.minute : 0
              )}
              mode="time"
              display="default"
              onChange={onTimeChange}
              is24Hour={true}
            />
          )}
        </>
      ) : (
        <Text style={[styles.value, { color: '#4CAF50' }]}>
          {`${alarm.hour.toString().padStart(2, '0')}:${alarm.minute
            .toString()
            .padStart(2, '0')}`}
        </Text>
      )}

      <View style={styles.buttonContainer}>
        {editMode ? (
          <>
            <View style={styles.buttonWrapper}>
              <Button title="Guardar" onPress={handleSave} color="#4CAF50" />
            </View>
            <View style={styles.buttonWrapper}>
              <Button title="Cancelar" onPress={() => setEditMode(false)} color="#f44336" />
            </View>
          </>
        ) : (
          <>
            <View style={styles.buttonWrapper}>
              <Button title="Editar" onPress={() => setEditMode(true)} color="#4CAF50" />
            </View>
            <View style={styles.buttonWrapper}>
              <Button title="Eliminar" onPress={handleDelete} color="#81C784" />
            </View>
          </>
        )}
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
  readOnly: {
    backgroundColor: '#C8E6C9',
    color: '#2E7D32',
  },
  selectionContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
  },
  selectButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  selectedButton: {
    backgroundColor: '#4CAF50',
  },
  unselectedButton: {
    backgroundColor: '#E8F5E9',
  },
  disabledButton: {
    opacity: 0.6,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayButton: {
    padding: 10,
    marginRight: 6,
    marginBottom: 0,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4CAF50',
    minWidth: 40,
    alignItems: 'center',
  },
  daySelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  dayUnselected: {
    backgroundColor: 'white',
  },
  value: {
    fontSize: 16,
    paddingVertical: 6,
    color: '#4CAF50',
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  buttonWrapper: {
    flex: 1,
    minWidth: 140,
    marginHorizontal: 8,
  },
});

export default DetalleAlarma;
