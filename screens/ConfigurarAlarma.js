import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform, Vibration, useColorScheme } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import CustomInput from '../components/CustomInput';
import * as AlarmModule from 'expo-alarm-module';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const daysOfWeek = [
  { label: 'Lun', value: 1 },
  { label: 'Mar', value: 2 },
  { label: 'Mié', value: 3 },
  { label: 'Jue', value: 4 },
  { label: 'Vie', value: 5 },
  { label: 'Sáb', value: 6 },
  { label: 'Dom', value: 7 },
];
const frequencies = [
  { label: 'Una vez', value: 'once' },
  { label: 'Diario', value: 'daily' },
  { label: 'Semanal', value: 'weekly' },
];
const reminderTypes = [
  { label: 'Regar', value: 'regar', icon: 'watering-can', color: '#2196F3' },
  { label: 'Podar', value: 'podar', icon: 'scissors-cutting', color: '#43A047' },
  { label: 'Fertilizar', value: 'fertilizar', icon: 'leaf', color: '#FFB300' },
  { label: 'Trasplantar', value: 'trasplantar', icon: 'flower', color: '#8D6E63' },
  { label: 'Otros', value: 'otros', icon: 'bell', color: '#607D8B' },
];

const ConfigurarAlarma = ({ route, navigation }) => {
  console.log('AlarmModule:', AlarmModule);
  console.log('Platform.OS:', Platform.OS);
  
  const { garden, plant } = route.params;
  const gardens = Array.isArray(garden) ? garden : garden ? [garden] : [];
  const plants = Array.isArray(plant) ? plant : plant ? [plant] : [];
  console.log('planta', plant);
  console.log('garden', gardens);
  const getNextHour = () => {
    const now = new Date();
    let nextHour = now.getHours() + 1;
    if (nextHour > 23) nextHour = 23;
    return nextHour;
  };

  const [alarmTitle, setAlarmTitle] = useState('');
  const [alarmHour, setAlarmHour] = useState(getNextHour());
  const [alarmMinute, setAlarmMinute] = useState(0);
  const [alarmDays, setAlarmDays] = useState([]);
  const [alarmFrequency, setAlarmFrequency] = useState('once');
  const [alarmDate, setAlarmDate] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reminderType, setReminderType] = useState('regar');
  const [invalidDateTime, setInvalidDateTime] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const pedirPermisos = async () => {
    let notifStatus = 'granted';
    if (Platform.OS === 'android') {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const ask = await Notifications.requestPermissionsAsync();
        notifStatus = ask.status;
      }
      if (Platform.Version >= 31 && AlarmModule.requestExactAlarmPermissionAsync) {
        try { await AlarmModule.requestExactAlarmPermissionAsync(); } catch {};
      }
    }
    return notifStatus === 'granted';
  };

  if (Platform.OS === 'android' && typeof AlarmModule.addListener === 'function') {
    AlarmModule.addListener(() => Vibration.vibrate(2000));
  }

  useEffect(() => { pedirPermisos(); }, []);

  useEffect(() => {
    if (alarmFrequency === 'once') {
      const dt = new Date(alarmDate);
      dt.setHours(alarmHour, alarmMinute, 0, 0);
      setInvalidDateTime(dt <= new Date());
    } else {
      setInvalidDateTime(false);
    }
  }, [alarmDate, alarmHour, alarmMinute, alarmFrequency]);

  const getAsociadosLabel = () => {
    if (plants.length) return plants.map(p => p.alias || p.scientific_name_without_author).join(', ');
    if (gardens.length) return gardens.map(g => g.name).join(', ');
    return 'Sin asociación';
  };

  const getAsociadosDescripcion = () => {
    const plantas = plants.length ? `Plantas: ${plants.map(p => p.alias || p.scientific_name_without_author).join(', ')}` : '';
    const jard = gardens.length ? `Jardines: ${gardens.map(g => g.name).join(', ')}` : '';
    return [plantas, jard].filter(Boolean).join(' | ');
  };

  const scheduleOne = async (opts) => {
    if (typeof AlarmModule.scheduleAlarm !== 'function') {
      throw new Error('expo-alarm-module no disponible');
    }
    await AlarmModule.scheduleAlarm(opts);
  };

  const nextDaily = (hour, minute) => {
    const now = new Date();
    const next = new Date(now);
    next.setHours(hour, minute, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    return next;
  };

  const nextForDay = (dow, hour, minute) => {
    const today = new Date();
    const todayDow = today.getDay() || 7;
    let offset = (dow - todayDow + 7) % 7;
    if (offset === 0) {
      const candidate = new Date(today);
      candidate.setHours(hour, minute, 0, 0);
      if (candidate > today) return candidate;
      offset = 7;
    }
    const next = new Date(today);
    next.setDate(today.getDate() + offset);
    next.setHours(hour, minute, 0, 0);
    return next;
  };

  const handleCreateAlarm = async () => {
    setSaving(true);
    try {
      if (!await pedirPermisos()) {
        Alert.alert('Permiso requerido', 'Debes otorgar permisos de notificación.');
        setSaving(false);
        return;
      }
      const uidBase = Date.now().toString();
      const title = alarmTitle || `${reminderTypes.find(t => t.value === reminderType)?.label} para ${getAsociadosLabel()}`;
      const description = getAsociadosDescripcion();

      if (alarmFrequency === 'once') {
        const dt = new Date(alarmDate);
        dt.setHours(alarmHour, alarmMinute, 0, 0);
        await scheduleOne({ uid: uidBase, day: dt, title, description, repeating: false, showDismiss: true, showSnooze: true, snoozeInterval: 5, active: true });
      } else if (alarmFrequency === 'daily') {
        const next = nextDaily(alarmHour, alarmMinute);
        await scheduleOne({ uid: uidBase, day: next, title, description, repeating: true, showDismiss: true, showSnooze: true, snoozeInterval: 5, active: true });
      } else if (alarmFrequency === 'weekly') {
        const promises = alarmDays.map(dow => {
          const dt = nextForDay(dow, alarmHour, alarmMinute);
          return scheduleOne({ uid: `${uidBase}-${dow}`, day: dt, title, description, repeating: true, showDismiss: true, showSnooze: true, snoozeInterval: 5, active: true });
        });
        await Promise.all(promises);
      }

      const newAlarm = {
          id: uidBase,
          title,
          description,
          hour: alarmHour,
          minute: alarmMinute,
          days: alarmDays,
          frequency: alarmFrequency,
          date: alarmFrequency === 'once' ? alarmDate.toISOString().split('T')[0] : null,
          gardens,
          plants,
          plantId: plants?.[0]?.id || null,
          type: reminderType,
        };
      const stored = await AsyncStorage.getItem('alarms');
      const arr = stored ? JSON.parse(stored) : [];
      arr.push(newAlarm);
      await AsyncStorage.setItem('alarms', JSON.stringify(arr));

      Alert.alert('Éxito', 'Recordatorio programado', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      console.error('ERROR scheduleAlarm:', e);
      Alert.alert('Error', `No se pudo programar: ${e.message || e}`);
    } finally {
      setSaving(false);
    }
  };

  const handleFrequencyChange = (freq) => {
    setAlarmFrequency(freq);
    setAlarmDays(freq === 'daily' ? [1,2,3,4,5,6,7] : []);
  };

  return (
    <View style={[styles.container, isDark && { backgroundColor: '#111', alignItems: 'center' }]}> 
      <Text style={styles.title}>Configurar recordatorio para {getAsociadosLabel()}</Text>
      <Text style={styles.sectionLabel}>Tipo de recordatorio</Text>
      <View style={styles.reminderTypeRow}>
        {reminderTypes.map(type => (
          <TouchableOpacity key={type.value} style={[styles.reminderTypeButton, reminderType === type.value && { backgroundColor: type.color + '22', borderColor: type.color }]} onPress={() => setReminderType(type.value)}>
            <MaterialCommunityIcons name={type.icon} size={24} color={type.color} />
            <Text style={[styles.reminderTypeText, reminderType === type.value && { color: type.color }]}>{type.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <CustomInput label="Título del recordatorio" placeholder="Ej: Regar plantas del jardín" value={alarmTitle} onChangeText={setAlarmTitle} multiline numberOfLines={2} style={{ fontSize: 18, minHeight: 48, padding: 12, borderColor: '#4CAF50', borderWidth: 2, backgroundColor: '#f6fff6' }} />
      <TouchableOpacity style={styles.timePickerButton} onPress={() => setShowTimePicker(true)}>
        <Text style={styles.timePickerText}>Hora: {alarmHour}:{alarmMinute.toString().padStart(2, '0')}</Text>
      </TouchableOpacity>
      {showTimePicker && (
        <DateTimePicker
          value={new Date(2025, 0, 1, alarmHour, alarmMinute)}
          mode="time"
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={alarmFrequency === 'once' && alarmDate.toDateString() === new Date().toDateString() ? new Date() : undefined}
          onChange={(e, date) => {
            setShowTimePicker(false);
            if (date) {
              if (
                alarmFrequency === 'once' &&
                alarmDate.toDateString() === new Date().toDateString() &&
                (date.getHours() < new Date().getHours() || (date.getHours() === new Date().getHours() && date.getMinutes() <= new Date().getMinutes()))
              ) {
                setAlarmHour(getNextHour());
                setAlarmMinute(0);
              } else {
                setAlarmHour(date.getHours());
                setAlarmMinute(date.getMinutes());
              }
            }
          }}
        />
      )}
      <Text style={styles.sectionLabel}>Frecuencia</Text>
      <View style={styles.freqRow}>
        {frequencies.map(freq => (
          <TouchableOpacity key={freq.value} style={[styles.freqButton, alarmFrequency === freq.value && styles.freqButtonSelected]} onPress={() => handleFrequencyChange(freq.value)}>
            <Text style={[styles.freqButtonText, alarmFrequency === freq.value && styles.freqButtonTextSelected]}>{freq.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Weekly days picker */}
      {alarmFrequency === 'weekly' && (
        <>
          <Text style={styles.sectionLabel}>Días de la semana</Text>
          <View style={styles.daysRow}>
            {daysOfWeek.map(day => (
              <TouchableOpacity key={day.value} style={[styles.dayButton, alarmDays.includes(day.value) && styles.dayButtonSelected]} onPress={() => setAlarmDays(prev => prev.includes(day.value) ? prev.filter(d => d !== day.value) : [...prev, day.value])}>
                <Text style={[styles.dayButtonText, alarmDays.includes(day.value) && styles.dayButtonTextSelected]}>{day.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
      {/* Date picker for once */}
      {alarmFrequency === 'once' && (
        <>
          <Text style={styles.sectionLabel}>Fecha específica</Text>
          <TouchableOpacity style={styles.timePickerButton} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.timePickerText}>Fecha: {alarmDate.toISOString().split('T')[0]}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={alarmDate}
              mode="date"
              minimumDate={new Date()}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(e, date) => {
                setShowDatePicker(false);
                if (date) setAlarmDate(date);
              }}
            />
          )}
        </>
      )}
      <TouchableOpacity style={styles.saveButton} onPress={handleCreateAlarm} disabled={saving || invalidDateTime}>
        <Text style={styles.saveButtonText}>
          {invalidDateTime ? 'Selecciona una fecha y hora futura' : (saving ? 'Guardando...' : 'Guardar alarma')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelButtonText}>Cancelar</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, /* padding: 16, */ backgroundColor: '#fff', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#4CAF50', textAlign: 'center' },
  sectionLabel: { fontWeight: 'bold', fontSize: 16, marginTop: 18, marginBottom: 8, color: '#4CAF50' },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 10 },
  dayButton: { padding: 8, borderRadius: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#4CAF50', marginHorizontal: 2 },
  dayButtonSelected: { backgroundColor: '#4CAF50' },
  dayButtonText: { color: '#4CAF50', fontWeight: 'bold' },
  dayButtonTextSelected: { color: '#fff' },
  freqRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 10 },
  freqButton: { padding: 8, borderRadius: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#4CAF50', marginHorizontal: 4 },
  freqButtonSelected: { backgroundColor: '#4CAF50' },
  freqButtonText: { color: '#4CAF50', fontWeight: 'bold' },
  freqButtonTextSelected: { color: '#fff' },
  timePickerButton: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#4CAF50', padding: 10, marginVertical: 10, width: '100%' },
  timePickerText: { color: '#4CAF50', fontWeight: 'bold', fontSize: 16, textAlign: 'center' },
  saveButton: { backgroundColor: '#4CAF50', padding: 12, borderRadius: 8, marginTop: 20, width: '100%' },
  saveButtonText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  cancelButton: { marginTop: 10 },
  cancelButtonText: { color: '#4CAF50', fontWeight: 'bold' },
  reminderTypeRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 10, marginTop: 4 },
  reminderTypeButton: { flex: 1, flexDirection: 'column', alignItems: 'center', padding: 10, marginHorizontal: 4, borderRadius: 10, borderWidth: 2, borderColor: '#e0e0e0', backgroundColor: '#f7f7f7' },
  reminderTypeText: { marginTop: 4, fontWeight: 'bold', color: '#333', fontSize: 14 },
});

export default ConfigurarAlarma;
