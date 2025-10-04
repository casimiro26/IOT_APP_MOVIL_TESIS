"use client"

import AsyncStorage from "@react-native-async-storage/async-storage"
import { useRouter } from "expo-router"
import axios from "axios"
import { useEffect, useState } from "react"
import { Alert, Image, Platform, Text, TouchableOpacity, View } from "react-native"
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler"
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from "react-native-responsive-screen"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import Icon from "react-native-vector-icons/MaterialIcons"

interface UserData {
  nombreCompleto: string
  nombreUsuario: string
  correo: string
}

const Perfil = () => {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [user, setUser] = useState<UserData | null>(null)

  const refreshHome = () => {
    router.push("/Home")
  }

  const swipeGestureRegistros = Gesture.Pan()
    .onEnd((event) => {
      if (event.translationX > 100) {
        router.push("/Registros")
      }
    })
    .minDistance(50)

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken")
      if (!token) {
        Alert.alert("Error", "No se encontró el token. Inicia sesión nuevamente.")
        router.push("/Login")
        return
      }
      const response = await axios.get("https://api-app-android-studio-tesis.onrender.com/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setUser(response.data)
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar los datos del usuario")
    }
  }

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("userToken")
      router.push("/Login")
    } catch (error) {
      Alert.alert("Error", "No se pudo cerrar sesión")
    }
  }

  const swipeGestureHome = Gesture.Pan()
    .onEnd((event) => {
      if (event.translationX < -100) {
        refreshHome()
      }
    })
    .minDistance(50)

  const swipeGesturePerfil = Gesture.Pan()
    .onEnd(() => {
      // No hace nada, ya estamos en Perfil
    })
    .minDistance(50)

  const swipeGestureLogout = Gesture.Pan()
    .onEnd((event) => {
      if (event.translationY > 150) {
        handleLogout()
      }
    })
    .minDistance(50)

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#1F2937", position: "relative" }}>
        {/* Fondo con círculos difuminados */}
        <View
          style={{
            position: "absolute",
            width: wp(64),
            height: wp(64),
            backgroundColor: "#1E40AF",
            borderRadius: wp(32),
            opacity: 0.4,
            top: -hp(8),
            left: -wp(16),
            ...(Platform.OS === "ios"
              ? { shadowColor: "#000", shadowOpacity: 0.1, shadowOffset: { width: 0, height: 0 }, shadowRadius: 10 }
              : { elevation: 5 }),
          }}
        />
        <View
          style={{
            position: "absolute",
            width: wp(80),
            height: wp(80),
            backgroundColor: "#4C1D95",
            borderRadius: wp(40),
            opacity: 0.3,
            bottom: -hp(20),
            right: -wp(20),
            ...(Platform.OS === "ios"
              ? { shadowColor: "#000", shadowOpacity: 0.1, shadowOffset: { width: 0, height: 0 }, shadowRadius: 10 }
              : { elevation: 5 }),
          }}
        />

        {/* Contenedor principal */}
        <View
          style={{
            flex: 1,
            paddingHorizontal: wp(6),
            paddingVertical: hp(2),
            paddingBottom: hp(8),
            alignItems: "center",
            maxWidth: wp(100),
          }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: wp(6), fontWeight: "bold", marginBottom: hp(3) }}>Perfil</Text>
          {user ? (
            <View
              style={{
                width: wp(90),
                backgroundColor: "#374151",
                padding: wp(4),
                borderRadius: wp(2),
                alignItems: "center",
              }}
            >
              <Icon name="person" size={wp(12)} color="#60A5FA" style={{ marginBottom: hp(1.5) }} />
              <Text style={{ color: "#FFFFFF", fontSize: wp(4.2), fontWeight: "600", marginBottom: hp(0.8) }}>
                Nombre: {user.nombreCompleto}
              </Text>
              <Text style={{ color: "#9CA3AF", fontSize: wp(3.8), marginBottom: hp(0.8) }}>
                Usuario: {user.nombreUsuario}
              </Text>
              <Text style={{ color: "#9CA3AF", fontSize: wp(3.8) }}>Correo: {user.correo}</Text>
            </View>
          ) : (
            <Text style={{ color: "#9CA3AF", fontSize: wp(3.8) }}>Cargando datos...</Text>
          )}

          {/* Botón Cerrar Sesión */}
          <GestureDetector gesture={swipeGestureLogout}>
            <TouchableOpacity
              style={{
                backgroundColor: "#EF4444",
                paddingVertical: hp(1.8),
                paddingHorizontal: wp(6),
                borderRadius: wp(2),
                marginTop: hp(3),
                width: wp(80),
              }}
              onPress={handleLogout}
            >
              <Text style={{ color: "#FFFFFF", fontSize: wp(4.2), fontWeight: "bold", textAlign: "center" }}>
                Cerrar Sesión
              </Text>
            </TouchableOpacity>
          </GestureDetector>
        </View>

        {/* Barra inferior */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-around",
            backgroundColor: "#1F2937",
            paddingVertical: hp(1.5),
            paddingHorizontal: wp(4),
            paddingBottom: hp(1.5) + insets.bottom,
            borderTopWidth: 1,
            borderTopColor: "#4B5563",
            zIndex: 1000,
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            ...(Platform.OS === "ios"
              ? { shadowColor: "#000", shadowOpacity: 0.1, shadowOffset: { width: 0, height: -2 }, shadowRadius: 5 }
              : { elevation: 8 }),
          }}
        >
          <GestureDetector gesture={swipeGestureHome}>
            <TouchableOpacity style={{ alignItems: "center", padding: wp(2) }} onPress={refreshHome}>
              <Image
                source={require("../assets/images/home-icon.png")}
                style={{ width: wp(6), height: wp(6), marginBottom: hp(0.4) }}
                resizeMode="contain"
              />
              <Text style={{ color: "#FFFFFF", fontSize: wp(3.2), fontWeight: "600" }}>Inicio</Text>
            </TouchableOpacity>
          </GestureDetector>
          <GestureDetector gesture={swipeGestureRegistros}>
            <TouchableOpacity
              style={{ alignItems: "center", padding: wp(2) }}
              onPress={() => router.push("/Registros")}
            >
              <Image
                source={require("../assets/images/logs-icon.png")}
                style={{ width: wp(6), height: wp(6), marginBottom: hp(0.4) }}
                resizeMode="contain"
              />
              <Text style={{ color: "#9CA3AF", fontSize: wp(3.2) }}>Registros</Text>
            </TouchableOpacity>
          </GestureDetector>
          <TouchableOpacity style={{ alignItems: "center", padding: wp(2) }} onPress={() => router.push("/Perfil")}>
            <Image
              source={require("../assets/images/profile-icon.png")}
              style={{ width: wp(6), height: wp(6), marginBottom: hp(0.4) }}
              resizeMode="contain"
            />
            <Text style={{ color: "#9CA3AF", fontSize: wp(3.2) }}>Perfil</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  )
}

export default Perfil
