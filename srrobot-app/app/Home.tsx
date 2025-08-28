import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Platform, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import io from 'socket.io-client';

const Home = () => {
  const [data, setData] = useState([]);
  const [isActive, setIsActive] = useState(false);
  const [horasTotal, setHorasTotal] = useState(0);
  const [eventosTotales, setEventosTotales] = useState(0);
  const [eventosCriticos, setEventosCriticos] = useState(0);
  const [tiempoRespuesta, setTiempoRespuesta] = useState(0.0);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    fetchData();
    const socket = io('https://api-app-android-studio-tesis.onrender.com');
    socket.on('nuevoDato', (nuevoDato) => {
      setData((prevData) => [nuevoDato, ...prevData]);
      actualizarMetricas(nuevoDato);
    });
    return () => socket.disconnect();
  }, []);

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'No se encontró el token. Inicia sesión nuevamente.');
        navigation.navigate('Login');
        return;
      }
      const response = await axios.get('https://api-app-android-studio-tesis.onrender.com/datos', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(response.data);
      calcularMetricas(response.data);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los datos');
    }
  };

  const calcularMetricas = (datos) => {
    const horas = datos.reduce((sum, item) => sum + item.horasMonitoreadas, 0);
    const totales = datos.reduce((sum, item) => sum + item.eventosTotales, 0);
    const criticos = datos.reduce((sum, item) => sum + (item.eventosCriticos || 0), 0);
    const promedioTiempo = datos.length > 0 ? datos.reduce((sum, item) => sum + (item.promedio || 0), 0) / datos.length : 0;
    setHorasTotal(horas);
    setEventosTotales(totales);
    setEventosCriticos(criticos);
    setTiempoRespuesta(promedioTiempo.toFixed(1));
  };

  const actualizarMetricas = (nuevoDato) => {
    setHorasTotal((prev) => prev + nuevoDato.horasMonitoreadas);
    setEventosTotales((prev) => prev + nuevoDato.eventosTotales);
    setEventosCriticos((prev) => prev + nuevoDato.eventosCriticos);
    setTiempoRespuesta((prev) => (prev + nuevoDato.promedio) / (data.length + 1));
  };

  const toggleSystem = () => {
    setIsActive((prev) => !prev);
  };

  const refreshHome = () => {
    fetchData();
  };

  const swipeGestureSystem = Gesture.Pan()
    .onEnd((event) => {
      if (Math.abs(event.translationX) > 100) {
        toggleSystem();
      }
    })
    .minDistance(50);

  const swipeGestureHome = Gesture.Pan()
    .onEnd((event) => {
      if (event.translationY < -50) {
        refreshHome();
      }
    })
    .minDistance(50);

  const swipeGestureRegistros = Gesture.Pan()
    .onEnd((event) => {
      if (event.translationX > 100) {
        navigation.navigate('Registros');
      }
    })
    .minDistance(50);

  const swipeGesturePerfil = Gesture.Pan()
    .onEnd((event) => {
      if (event.translationX > 100) {
        navigation.navigate('Perfil');
      }
    })
    .minDistance(50);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1F2937', position: 'relative' }}>
        {/* Fondo con círculos difuminados */}
        <View style={{
          position: 'absolute',
          width: wp(64),
          height: wp(64),
          backgroundColor: '#1E40AF',
          borderRadius: wp(32),
          opacity: 0.4,
          top: -hp(8),
          left: -wp(16),
          ...(Platform.OS === 'ios' ? { shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 0 }, shadowRadius: 10 } : { elevation: 5 }),
        }} />
        <View style={{
          position: 'absolute',
          width: wp(80),
          height: wp(80),
          backgroundColor: '#4C1D95',
          borderRadius: wp(40),
          opacity: 0.3,
          bottom: -hp(20),
          right: -wp(20),
          ...(Platform.OS === 'ios' ? { shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 0 }, shadowRadius: 10 } : { elevation: 5 }),
        }} />

        {/* Contenedor principal */}
        <View style={{ flex: 1, paddingHorizontal: wp(5), paddingVertical: hp(2), paddingBottom: hp(8) + insets.bottom, maxWidth: wp(100) }}>
          {/* Título con switch */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: hp(2),
            marginBottom: hp(1.5),
          }}>
            <Text style={{
              color: '#FFFFFF',
              fontSize: wp(5.5),
              fontWeight: 'bold',
            }}>
              Panel de Seguridad Sr. Robot
            </Text>
            <Switch
              trackColor={{ false: '#DC2626', true: '#22C55E' }}
              thumbColor="#FFFFFF"
              onValueChange={toggleSystem}
              value={isActive}
            />
          </View>

          {/* Botón activar sistema con gesto */}
          <GestureDetector gesture={swipeGestureSystem}>
            <TouchableOpacity style={{
              backgroundColor: isActive ? '#22C55E' : '#4B5563',
              padding: wp(3.5),
              borderRadius: wp(2),
              marginBottom: hp(3),
            }}>
              <Text style={{
                color: '#FFFFFF',
                textAlign: 'center',
                fontSize: wp(4.2),
                fontWeight: 'bold',
              }}>
                {isActive ? 'DESACTIVAR SISTEMA' : 'ACTIVAR SISTEMA'}
              </Text>
            </TouchableOpacity>
          </GestureDetector>

          {/* Métricas de seguridad */}
          <Text style={{
            color: '#FFFFFF',
            fontSize: wp(4.2),
            fontWeight: 'bold',
            marginBottom: hp(1.5),
          }}>
            MÉTRICAS DE SEGURIDAD
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <View style={{
              width: wp(45),
              backgroundColor: '#374151',
              padding: wp(3.5),
              borderRadius: wp(2),
              marginBottom: hp(1.5),
            }}>
              <Text style={{ color: '#9CA3AF', fontSize: wp(3.2) }}>Horas de Monitoreo</Text>
              <Text style={{ color: '#FFFFFF', fontSize: wp(5.5), fontWeight: 'bold' }}>{horasTotal} h</Text>
            </View>
            <View style={{
              width: wp(45),
              backgroundColor: '#374151',
              padding: wp(3.5),
              borderRadius: wp(2),
              marginBottom: hp(1.5),
            }}>
              <Text style={{ color: '#9CA3AF', fontSize: wp(3.2) }}>Eventos Totales</Text>
              <Text style={{ color: '#FFFFFF', fontSize: wp(5.5), fontWeight: 'bold' }}>{eventosTotales}</Text>
            </View>
            <View style={{
              width: wp(45),
              backgroundColor: '#374151',
              padding: wp(3.5),
              borderRadius: wp(2),
            }}>
              <Text style={{ color: '#9CA3AF', fontSize: wp(3.2) }}>Eventos Críticos</Text>
              <Text style={{ color: '#FFFFFF', fontSize: wp(5.5), fontWeight: 'bold' }}>{eventosCriticos}</Text>
            </View>
            <View style={{
              width: wp(45),
              backgroundColor: '#374151',
              padding: wp(3.5),
              borderRadius: wp(2),
            }}>
              <Text style={{ color: '#9CA3AF', fontSize: wp(3.2) }}>Tiempo Respuesta</Text>
              <Text style={{ color: '#FFFFFF', fontSize: wp(5.5), fontWeight: 'bold' }}>{tiempoRespuesta} s</Text>
            </View>
          </View>

          {/* Actividad en tiempo real */}
          <Text style={{
            color: '#FFFFFF',
            fontSize: wp(4.2),
            fontWeight: 'bold',
            marginBottom: hp(1.5),
            marginTop: hp(1.5),
          }}>
            ACTIVIDAD EN TIEMPO REAL
          </Text>
          <ScrollView style={{ flex: 1, marginBottom: hp(1.5) }}>
            {data.map((item) => (
              <View key={item.id} style={{
                backgroundColor: '#374151',
                padding: wp(3.5),
                borderRadius: wp(2),
                marginBottom: hp(1),
              }}>
                <Text style={{ color: '#FFFFFF', fontSize: wp(3.8) }}>Evento ID: {item.id}</Text>
                <Text style={{ color: '#9CA3AF', fontSize: wp(3.2) }}>Horas: {item.horasMonitoreadas}</Text>
                <Text style={{ color: '#9CA3AF', fontSize: wp(3.2) }}>Eventos Totales: {item.eventosTotales}</Text>
                <Text style={{ color: '#9CA3AF', fontSize: wp(3.2) }}>Eventos Críticos: {item.eventosCriticos}</Text>
                <Text style={{ color: '#9CA3AF', fontSize: wp(3.2) }}>Movimiento: {item.movimiento}</Text>
                <Text style={{ color: '#9CA3AF', fontSize: wp(3.2) }}>Promedio: {item.promedio}%</Text>
                <Text style={{ color: '#9CA3AF', fontSize: wp(3.2) }}>Fecha: {new Date(item.marcaTiempo).toLocaleString()}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Barra inferior */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          backgroundColor: '#1F2937',
          paddingVertical: hp(1.5),
          paddingHorizontal: wp(4),
          paddingBottom: hp(1.5) + insets.bottom,
          borderTopWidth: 1,
          borderTopColor: '#4B5563',
          zIndex: 1000,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          ...(Platform.OS === 'ios' ? { shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: -2 }, shadowRadius: 5 } : { elevation: 8 }),
        }}>
          <TouchableOpacity style={{ alignItems: 'center', padding: wp(2) }} onPress={refreshHome}>
            <Image
              source={require('../assets/images/home-icon.png')}
              style={{ width: wp(6), height: wp(6), marginBottom: hp(0.4) }}
              resizeMode="contain"
            />
            <Text style={{ color: '#FFFFFF', fontSize: wp(3.2), fontWeight: '600' }}>Inicio</Text>
          </TouchableOpacity>
          <GestureDetector gesture={swipeGestureRegistros}>
            <TouchableOpacity style={{ alignItems: 'center', padding: wp(2) }} onPress={() => navigation.navigate('Registros')}>
              <Image
                source={require('../assets/images/logs-icon.png')}
                style={{ width: wp(6), height: wp(6), marginBottom: hp(0.4) }}
                resizeMode="contain"
              />
              <Text style={{ color: '#9CA3AF', fontSize: wp(3.2) }}>Registros</Text>
            </TouchableOpacity>
          </GestureDetector>
          <GestureDetector gesture={swipeGesturePerfil}>
            <TouchableOpacity style={{ alignItems: 'center', padding: wp(2) }} onPress={() => navigation.navigate('Perfil')}>
              <Image
                source={require('../assets/images/profile-icon.png')}
                style={{ width: wp(6), height: wp(6), marginBottom: hp(0.4) }}
                resizeMode="contain"
              />
              <Text style={{ color: '#9CA3AF', fontSize: wp(3.2) }}>Perfil</Text>
            </TouchableOpacity>
          </GestureDetector>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default Home;