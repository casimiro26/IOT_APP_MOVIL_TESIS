import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

const Registros = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState('Hoy');
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ totalEvents: 0, criticalEvents: 0, average: '0%' });

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'No se encontró el token. Inicia sesión nuevamente.');
        navigation.navigate('Login');
        return;
      }
      const response = await axios.get(`https://api-app-android-studio-tesis.onrender.com/datos?filtro=${filter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data;
      setEvents(data);

      const totalEvents = data.reduce((sum, item) => sum + item.eventosTotales, 0);
      const criticalEvents = data.reduce((sum, item) => sum + item.eventosCriticos, 0);
      const average = data.length > 0 ? ((criticalEvents / totalEvents) * 100 || 0).toFixed(2) + '%' : '0%';
      setStats({ totalEvents, criticalEvents, average });
    } catch (error) {
      console.log(error.response?.data || error.message);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    }
  };

  const handleFilter = (period) => setFilter(period);

  const swipeGestureHome = Gesture.Pan()
    .onEnd((event) => {
      if (event.translationX < -100) {
        navigation.navigate('Home');
      }
    })
    .minDistance(50);

  const swipeGestureRegistros = Gesture.Pan()
    .onEnd((event) => {
      if (event.translationY < -50) {
        fetchData();
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
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1F2937', position: 'relative', paddingTop: insets.top }}>
        {/* Fondos difuminados */}
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
        <View style={{ flex: 1, paddingHorizontal: wp(5), paddingVertical: hp(1.5), paddingBottom: hp(8) + insets.bottom, maxWidth: wp(100) }}>
          {/* Título */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: hp(1.5) }}>
            <Text style={{ color: '#FFFFFF', fontSize: wp(5.5), fontWeight: 'bold' }}>Panel de Seguridad Sr. Robot</Text>
            <TouchableOpacity style={{ padding: wp(1.5) }} onPress={() => navigation.navigate('Login')}>
              <Icon name="power-settings-new" size={wp(5.5)} color="#DC2626" />
            </TouchableOpacity>
          </View>

          {/* Historial de Eventos */}
          <Text style={{ color: '#FFFFFF', fontSize: wp(4.2), fontWeight: 'bold', marginBottom: hp(0.8) }}>HISTORIAL DE EVENTOS</Text>
          <Text style={{ color: '#9CA3AF', fontSize: wp(3.2), marginBottom: hp(1.5) }}>Filtra los eventos por período de tiempo</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: hp(2.5), flexWrap: 'wrap' }}>
            {['Hoy', 'Semana', 'Mes', 'Todo'].map((period) => (
              <TouchableOpacity
                key={period}
                style={{
                  backgroundColor: filter === period ? '#DC2626' : '#374151',
                  paddingVertical: hp(0.8),
                  paddingHorizontal: wp(3.5),
                  borderRadius: wp(2),
                  width: wp(22),
                  marginBottom: hp(1),
                }}
                onPress={() => handleFilter(period)}
              >
                <Text style={{ color: '#FFFFFF', fontSize: wp(3.2), textAlign: 'center' }}>{period}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Estadísticas */}
          <Text style={{ color: '#FFFFFF', fontSize: wp(4.2), fontWeight: 'bold', marginBottom: hp(1.5) }}>ESTADÍSTICAS DEL PERÍODO</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: hp(1.5) }}>
            <View style={{ alignItems: 'center', width: wp(30) }}>
              <Icon name="notifications" size={wp(5.5)} color="#60A5FA" />
              <Text style={{ color: '#FFFFFF', fontSize: wp(4.2) }}>{stats.totalEvents}</Text>
              <Text style={{ color: '#9CA3AF', fontSize: wp(2.8) }}>Total Eventos</Text>
            </View>
            <View style={{ alignItems: 'center', width: wp(30) }}>
              <Icon name="warning" size={wp(5.5)} color="#EF4444" />
              <Text style={{ color: '#FFFFFF', fontSize: wp(4.2) }}>{stats.criticalEvents}</Text>
              <Text style={{ color: '#9CA3AF', fontSize: wp(2.8) }}>Críticos</Text>
            </View>
            <View style={{ alignItems: 'center', width: wp(30) }}>
              <Icon name="trending-up" size={wp(5.5)} color="#22C55E" />
              <Text style={{ color: '#FFFFFF', fontSize: wp(4.2) }}>{stats.average}</Text>
              <Text style={{ color: '#9CA3AF', fontSize: wp(2.8) }}>Promedio</Text>
            </View>
          </View>

          {/* Lista de Eventos */}
          <ScrollView style={{ flex: 1 }}>
            {events.map((event) => (
              <View key={event.id} style={{ flexDirection: 'row', justifyContent: 'space-between', padding: wp(2.5), backgroundColor: '#374151', borderRadius: wp(2), marginBottom: hp(1) }}>
                <View>
                  <Text style={{ color: '#9CA3AF', fontSize: wp(3.2) }}>{new Date(event.marcaTiempo).toLocaleString()}</Text>
                  <Text style={{ color: '#9CA3AF', fontSize: wp(3.2) }}>Intensidad: {(event.promedio || 0).toFixed(2)}%</Text>
                </View>
                <Text style={{ color: event.movimiento === 'sí' ? '#EF4444' : '#22C55E', fontSize: wp(3.2) }}>
                  {event.movimiento === 'sí' ? 'CRÍTICO' : 'NORMAL'}
                </Text>
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
          <GestureDetector gesture={swipeGestureHome}>
            <TouchableOpacity style={{ alignItems: 'center', padding: wp(2) }} onPress={() => navigation.navigate('Home')}>
              <Image source={require('../assets/images/home-icon.png')} style={{ width: wp(6), height: wp(6), marginBottom: hp(0.4) }} resizeMode="contain" />
              <Text style={{ color: '#FFFFFF', fontSize: wp(3.2), fontWeight: '600' }}>Inicio</Text>
            </TouchableOpacity>
          </GestureDetector>
          <TouchableOpacity style={{ alignItems: 'center', padding: wp(2) }}>
            <Image source={require('../assets/images/logs-icon.png')} style={{ width: wp(6), height: wp(6), marginBottom: hp(0.4) }} resizeMode="contain" />
            <Text style={{ color: '#9CA3AF', fontSize: wp(3.2) }}>Registros</Text>
          </TouchableOpacity>
          <GestureDetector gesture={swipeGesturePerfil}>
            <TouchableOpacity style={{ alignItems: 'center', padding: wp(2) }} onPress={() => navigation.navigate('Perfil')}>
              <Image source={require('../assets/images/profile-icon.png')} style={{ width: wp(6), height: wp(6), marginBottom: hp(0.4) }} resizeMode="contain" />
              <Text style={{ color: '#9CA3AF', fontSize: wp(3.2) }}>Perfil</Text>
            </TouchableOpacity>
          </GestureDetector>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default Registros;