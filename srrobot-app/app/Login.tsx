import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleLogin = async () => {
    try {
      const response = await axios.post('https://api-app-android-studio-tesis.onrender.com/iniciar-sesion', {
        nombreUsuario: username,
        contrasena: password,
      });

      const { token } = response.data;

      if (!token) {
        Alert.alert('Error', 'No se recibió token del servidor');
        return;
      }

      await AsyncStorage.setItem('userToken', token);
      Alert.alert('Éxito', 'Inicio de sesión exitoso');
      router.replace('/Home');
    } catch (error) {
      console.log(error.response?.data || error.message);
      Alert.alert('Error', 'Credenciales inválidas o problema con la API');
    }
  };

  const swipeGesture = Gesture.Pan()
    .onEnd((event) => {
      if (event.translationX > 150) {
        handleLogin();
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
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: wp(5), paddingVertical: hp(1.5), maxWidth: wp(100) }}>
          <Image source={require('../assets/images/logo2.png')} style={{ width: wp(35), height: wp(35), marginBottom: hp(2) }} resizeMode="contain" />
          <Text style={{ color: '#FFFFFF', fontSize: wp(8), fontWeight: 'bold', marginBottom: hp(0.8), textAlign: 'center' }}>Sr. Robot Security</Text>
          <Text style={{ color: '#9CA3AF', fontSize: wp(3.8), textAlign: 'center', marginBottom: hp(3) }}>Inicia sesión en tu cuenta</Text>

          {/* Botones superiores */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: wp(90), marginBottom: hp(3), paddingHorizontal: wp(2) }}>
            <TouchableOpacity style={{ backgroundColor: '#DC2626', paddingHorizontal: wp(7), paddingVertical: hp(1.2), borderRadius: wp(2), flex: 1, marginRight: wp(1.5) }}>
              <Text style={{ color: '#FFFFFF', fontSize: wp(4.2), fontWeight: '600', textAlign: 'center' }}>Iniciar Sesión</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ backgroundColor: '#4B5563', paddingHorizontal: wp(7), paddingVertical: hp(1.2), borderRadius: wp(2), flex: 1, marginLeft: wp(1.5) }}
              onPress={() => router.replace('/Register')}
            >
              <Text style={{ color: '#FFFFFF', fontSize: wp(4.2), textAlign: 'center' }}>Registrarse</Text>
            </TouchableOpacity>
          </View>

          {/* Campos de entrada */}
          <View style={{ width: wp(90), marginBottom: hp(2.5) }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#374151', padding: wp(3.5), borderRadius: wp(2), marginBottom: hp(1.5), borderWidth: 1, borderColor: '#4B5563' }}>
              <Image source={require('../assets/images/user-icon.png')} style={{ width: wp(4.5), height: wp(4.5), marginRight: wp(2.5) }} resizeMode="contain" />
              <TextInput style={{ flex: 1, color: '#FFFFFF', fontSize: wp(3.8) }} placeholder="Usuario" placeholderTextColor="#9CA3AF" value={username} onChangeText={setUsername} autoCapitalize="none" />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#374151', padding: wp(3.5), borderRadius: wp(2), borderWidth: 1, borderColor: '#4B5563' }}>
              <Image source={require('../assets/images/lock-icon.png')} style={{ width: wp(4.5), height: wp(4.5), marginRight: wp(2.5) }} resizeMode="contain" />
              <TextInput style={{ flex: 1, color: '#FFFFFF', fontSize: wp(3.8) }} placeholder="Contraseña" placeholderTextColor="#9CA3AF" secureTextEntry value={password} onChangeText={setPassword} />
            </View>
          </View>

          {/* Botón de login */}
          <GestureDetector gesture={swipeGesture}>
            <TouchableOpacity style={{ width: wp(90), backgroundColor: '#B91C1C', padding: wp(3.5), borderRadius: wp(2), marginBottom: hp(2.5) }} onPress={handleLogin}>
              <Text style={{ color: '#FFFFFF', textAlign: 'center', fontSize: wp(5.5), fontWeight: 'bold' }}>→ INICIAR SESIÓN</Text>
            </TouchableOpacity>
          </GestureDetector>

          <Text style={{ color: '#9CA3AF', fontSize: wp(3.2), textAlign: 'center', marginTop: hp(2) }}>Sistema de monitoreo de seguridad avanzado</Text>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default Login;