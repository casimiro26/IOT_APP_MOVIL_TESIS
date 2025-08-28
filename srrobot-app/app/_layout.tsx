import { Stack } from 'expo-router';
import React from "react";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="Login" options={{ headerShown: false }} />
      <Stack.Screen name="Register" options={{ headerShown: false }} />
      <Stack.Screen name="Home" options={{ headerShown: false }} />
      <Stack.Screen name="Registros" options={{ headerShown: false }} />
      <Stack.Screen name="Perfil" options={{ headerShown: false }} />
    </Stack>
  );
}