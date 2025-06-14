import React, { useCallback, useContext, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image, View, useColorScheme, Text, Platform } from 'react-native';
import { AuthProvider, AuthContext, useAuth } from './core/AuthContext';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { DefaultTheme, DarkTheme } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import NetworkCheck from './components/NetworkCheck';


import Login from './screens/Login';
import Register from './screens/Register';
import Home from './screens/Home';
import Gardens from './screens/Gardens';
import CreateGarden from './screens/CreateGarden';
import Profile from './screens/Profile';
//Identificacion
import Identify from './screens/Identify';
import ResultPlantIdentify from './screens/ResultPlantIdentify';

// Recordatorios
import Alarms from './screens/Alarms';
import PlantasDelJardin from './screens/PlantasDelJardin';
import ConfigurarAlarma from './screens/ConfigurarAlarma';
import GestionAlarmas from './screens/GestionAlarmas';
import NotificationsScreen from './screens/NotificationsScreen';
import DetalleAlarmaScreen from './screens/DetalleAlarma';
import añadirmanual from './screens/añadirmanual';


// Recuperación de contraseña
import PasswordRecoveryScreen from './screens/PasswordRecoveryScreen';
import Plants from './screens/Plants';
import PlantDetails from './screens/PlantDetails';
import EditPlant from './screens/EditPlant';

import AddPlant from './screens/AddPlant';

// Perfil de usuario
import EditProfile from './screens/EditProfile';

import GestionarAlarmas from './screens/GestionAlarmas';


import WeatherDetails from './components/WeatherDetails';
import ChangePassW from './screens/ChangePassW';
import PlantNotes from './screens/PlantNotes';
import CreateNotes from './screens/CreateNotes';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconSource;
          if (route.name === 'Inicio') iconSource = require('./assets/home.png');
          else if (route.name === 'Identificar') iconSource = require('./assets/search.png');
          else if (route.name === 'Jardín') iconSource = require('./assets/garden.png');
          else if (route.name === 'Perfil') iconSource = require('./assets/profile.png');
          else if (route.name === 'Notificaciones') iconSource = require('./assets/notifications.png');
          return <Image source={iconSource} style={{ width: size, height: size, tintColor: color }} />;
        },
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: 'gray',
        headerShown: false, // OCULTAR HEADER EN TODAS LAS TABS PRINCIPALES
       
        
      })}
    >
      <Tab.Screen name="Inicio" component={Home} />
      <Tab.Screen name="Identificar" component={Identify} />
      <Tab.Screen name="Jardín" component={Gardens} />
      <Tab.Screen name="Notificaciones" component={NotificationsScreen} options= {{tabBarLabelStyle: { fontSize: 9, marginBottom: 4,}, tabBarIconStyle: { marginBottom: 1,  }, tabBarItemStyle: { paddingTop: 2, },}} />
      <Tab.Screen name="Perfil" component={Profile} />
      
    </Tab.Navigator>
  );
}

function AppContent() {
  const colorScheme = useColorScheme();
  const { loading, accessToken } = useAuth();
  console.log(accessToken);
  console.log(loading)
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#111' : '#fff', justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Image source={require('./assets/icon.png')} style={{ width: 80, height: 80, marginBottom: 24 }} />
        <Text style={{ color: colorScheme === 'dark' ? '#fff' : '#333', fontSize: 18 }}>Cargando...</Text>
      </View>
    );
  }
  return (
    <NetworkCheck>
      <NavigationContainer theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: colorScheme === 'dark' ? '#111' : '#fff', elevation: 0, shadowOpacity: 0 },
            headerTitleAlign: 'left',
            headerTransparent: false,
            headerSafeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
          }}
        >
          {!accessToken ? (
            <>
              <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
              <Stack.Screen name="Register" component={Register} options={{ headerShown: false }} />
              <Stack.Screen name="PasswordRecovery" component={PasswordRecoveryScreen} options={{ headerShown: false }} />
            </>
          ) : (
            <>
              <Stack.Screen name="Home" component={HomeTabs} options={{ headerShown: false, gestureEnabled: false }} />
              <Stack.Screen name="Gardens" component={Gardens} options={{ title: 'Mis Jardines' }} />
              <Stack.Screen name="CreateGarden" component={CreateGarden} options={{ title: 'Crear Jardín' }} />
              <Stack.Screen name="Alarms" component={Alarms} options={{ title: 'Alarmas' }} />
              <Stack.Screen name="PlantasDelJardin" component={PlantasDelJardin} options={{ title: 'Plantas del Jardín' }} />
              <Stack.Screen name="ConfigurarAlarma" component={ConfigurarAlarma} options={{ title: 'Configurar Alarma' }} />
              <Stack.Screen name="PlantResult" component={ResultPlantIdentify} options={{ title: '' }} />
              <Stack.Screen name="Plants" component={Plants} options={{ title: 'Plantas del Jardín' }} />
              <Stack.Screen name="PlantDetails" component={PlantDetails} options={{ title: 'Detalle de Planta' }} />

              <Stack.Screen name="AddPlant" component={AddPlant} options={{ title: '' }} />

              <Stack.Screen name="EditPlant" component={EditPlant} />
              <Stack.Screen name="EditProfile" component={EditProfile} options={{ title: 'Editar Perfil' }} />
              <Stack.Screen name="ChangePassW" component={ChangePassW} options={{ title: 'Cambiar contraseña' }} />
              <Stack.Screen name="PlantNotes" component={PlantNotes} options={{title: ' '}} />
              <Stack.Screen name="CreateNotes" component={CreateNotes} options={{title: ' '}} />
              <Stack.Screen name="WeatherDetails" component={WeatherDetails} options={{ title: 'Detalles del Clima' }} />

              <Stack.Screen name="GestionAlarmas" component={GestionAlarmas} />
              <Stack.Screen name="añadirmanual" component={añadirmanual} options={{ title: 'Añadir Alarma Manualmente' }} />
              <Stack.Screen name="DetalleAlarma" component={DetalleAlarmaScreen} options={{ title: '' }} />
            </>
          )}
        </Stack.Navigator>
        <Toast />
      </NavigationContainer>
    </NetworkCheck>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}> 
          <AppContent />
        </SafeAreaView>
      </SafeAreaProvider>
    </AuthProvider>
  );
}
