import { Stack } from "expo-router"

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: "#1F2937" },
      }}
    >
      <Stack.Screen
        name="Login"
        options={{
          headerShown: false,
          animation: "fade",
        }}
      />
      <Stack.Screen name="Register" options={{ headerShown: false }} />
      <Stack.Screen name="Home" options={{ headerShown: false }} />
      <Stack.Screen name="Registros" options={{ headerShown: false }} />
      <Stack.Screen name="Perfil" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  )
}
