import { Tabs } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { LayoutDashboard, Calendar, User } from 'lucide-react-native';
import { Dimensions, Platform } from 'react-native';

// Dimensiones para responsive
const { width, height } = Dimensions.get('window');
const scale = (size: number) => (width / 375) * size;
const verticalScale = (size: number) => (height / 812) * size;

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF0000',
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: verticalScale(Platform.OS === 'android' ? 90 : 70), // ✅ Aumentado para compensar
          paddingBottom: Platform.OS === 'android' ? verticalScale(39) : verticalScale(8), // ✅ 37 PADDING
          paddingTop: verticalScale(8),
          // ESPACIO EXTRA PARA BOTONES DE ANDROID:
          marginBottom: Platform.OS === 'android' ? verticalScale(29) : 0, // ✅ 27 MARGIN
        },
        tabBarLabelStyle: {
          fontSize: scale(12),
          fontWeight: '600',
          marginBottom: Platform.OS === 'android' ? verticalScale(0) : 0, // ✅ CERO para texto arriba
          marginTop: Platform.OS === 'android' ? verticalScale(-5) : 0, // ✅ Negativo para subir más
        },
        tabBarIconStyle: {
          marginBottom: Platform.OS === 'android' ? verticalScale(5) : 0, // ✅ Iconos más abajo
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ size, color, focused }: { size: number; color: string; focused: boolean }) => (
            <LayoutDashboard 
              size={scale(Platform.OS === 'android' ? 20 : size)}
              color={focused ? '#FF0000' : color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Histórico',
          tabBarIcon: ({ size, color, focused }: { size: number; color: string; focused: boolean }) => (
            <Calendar 
              size={scale(Platform.OS === 'android' ? 20 : size)}
              color={focused ? '#FF0000' : color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ size, color, focused }: { size: number; color: string; focused: boolean }) => (
            <User 
              size={scale(Platform.OS === 'android' ? 20 : size)}
              color={focused ? '#FF0000' : color}
            />
          ),
        }}
      />
    </Tabs>
  );
}