import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

const iconMap = {
  regar: require('../assets/water-drop.png'),
  fertilizar: require('../assets/fertilizer.png'),
  podar: require('../assets/scissors.png'),
  trasplantar: require('../assets/trasplant.png'),
  otros: require('../assets/otros.png'),
};

const colorMap = {
  regar: '#2196F3',        // azul
  fertilizar: '#4CAF50',  // verde
  podar: '#FF9800',         // naranja
  trasplantar: '#674C08',  // café
  otros: '#9E9E9E',        // gris
};

function normalizeType(type) {
  return type?.toLowerCase().trim() || '';
}

export default function AlarmCard({ alarm, plantAlias, gardenName, reviewed }) {
  const alarmDate = alarm.date ? new Date(alarm.date) : null;

  const hourFormatted = alarmDate
    ? `${alarmDate.getHours().toString().padStart(2, '0')}:${alarmDate.getMinutes().toString().padStart(2, '0')}`
    : '00:00';

  const dateFormatted = alarmDate ? alarmDate.toLocaleDateString() : 'Sin fecha';

  const normalizedType = normalizeType(alarm.type);
  const iconSource = iconMap[normalizedType] || iconMap.otros;
  const color = colorMap[normalizedType] || colorMap.otros;

  return (
    <View style={[styles.card, reviewed && styles.reviewed, { borderColor: color }]}>
      <View style={styles.row}>
        <Image
          source={iconSource}
          style={[styles.icon, { tintColor: color }]}
        />
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color }]}>{alarm.title || 'Sin título'}</Text>
          <Text>Planta: {plantAlias}</Text>
          <Text>Tipo: <Text style={{ color }}>{alarm.type || 'Tipo'}</Text></Text>
          <Text>Hora: {hourFormatted}</Text>
          <Text>Fecha: {dateFormatted}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewed: {
    opacity: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 70,
    height: 70,
    marginRight: 16,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
});
