import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../core/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import WeatherWidget from '../components/WeatherWidget';

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const TITLE_COLOR = '#4CAF50';

const Home = () => {
  const { accessToken } = useAuth();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    if (accessToken) {
      console.log("Access Token en Home:", accessToken);
    }
  }, [accessToken]);

  const { data, loading, error, cancelRequest } = useFetch('/gardens', accessToken);

  // Animación de entrada para la card
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) });
    translateY.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.ease) });
  }, []);

  const animatedCardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <LinearGradient
      colors={isDark ? ['#0d2600', '#111'] : ['#eafaf1', '#fff']}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageContainer}>
          <Image
            source={
              isDark
                ? require('../assets/homePlantDark.png')
                : require('../assets/homePlantLight.png')
            }
            style={styles.headerImage}
            resizeMode="contain"
          />
        </View>

        <Text style={[styles.title, isDark && { color: '#aed581' }]}>
          Bienvenido a <Text style={styles.highlight}>FloraFind</Text>
        </Text>

        <Animated.View style={[styles.card, isDark && { backgroundColor: '#1c1c1c' }, animatedCardStyle]}>
          <Text style={[styles.subtitle, isDark && { color: '#bbb' }]}>
            Gestiona tus jardines, plantas y recordatorios de riego fácilmente.
          </Text>

          <WeatherWidget />

          <TouchableOpacity
            style={styles.alarmButton}
            onPress={() => navigation.navigate('Alarms')}
          >
            <Ionicons name="alarm-outline" size={28} color="#fff" style={{ marginRight: 10 }} />
            <Text style={styles.alarmButtonText}>Crear alarmas</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 50,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  imageContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  headerImage: {
    width: 140,
    height: 140,
  },
  title: {
    fontSize: 28,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 10,
    color: '#4CAF50',
  },
  highlight: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 17,
    color: '#444',
    marginBottom: 24,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 20,
  },
  alarmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    justifyContent: 'center',
    marginTop: 20,
  },
  alarmButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 17,
  },
});

export default Home;
