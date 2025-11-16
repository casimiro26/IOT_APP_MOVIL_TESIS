import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Switch, 
  Image,
  Dimensions,
  Platform,
  StatusBar,
  SafeAreaView
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { router } from 'expo-router';
import { User, Mail, Shield, Moon, Sun, LogOut } from 'lucide-react-native';

// Dimensiones y funciones responsive
const { width, height } = Dimensions.get('window');
const scale = (size: number) => (width / 375) * size;
const verticalScale = (size: number) => (height / 812) * size;

export default function ProfileScreen() {
  const { colors, theme, toggleTheme } = useTheme();
  const { profile, signOut, refreshProfile } = useAuth();

  useEffect(() => {
    if (!profile) {
      // Intenta refrescar el perfil si no está cargado
      refreshProfile().catch(() => {
        router.replace('/(auth)/login');
      });
    }
  }, [profile, refreshProfile]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  if (!profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>Cargando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <View style={[styles.avatarContainer, { backgroundColor: colors.primary + '20' }]}>
            <Image
              source={require("../../assets/images/s-r.png")}
              style={styles.avatarImage}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.name, { color: colors.text }]}>{profile?.full_name || 'Usuario'}</Text>
          <Text style={[styles.username, { color: colors.textSecondary }]}>@{profile?.username || 'sin_usuario'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Información Personal</Text>

          <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <User size={scale(20)} color="#FF0000" />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Nombre Completo</Text>
                <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>
                  {profile?.full_name || 'No disponible'}
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <User size={scale(20)} color="#FF0000" />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Usuario</Text>
                <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>
                  {profile?.username || 'No disponible'}
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Mail size={scale(20)} color="#FF0000" />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Email</Text>
                <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={1}>
                  {profile?.email || 'No disponible'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferencias</Text>

          <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                {theme === 'light' ? (
                  <Sun size={scale(20)} color="#FF0000" />
                ) : (
                  <Moon size={scale(20)} color="#FF0000" />
                )}
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.text }]}>Modo Oscuro</Text>
                <Text style={[styles.infoSubtext, { color: colors.textSecondary }]}>
                  {theme === 'dark' ? 'Activado' : 'Desactivado'}
                </Text>
              </View>
              <Switch
                value={theme === 'dark'}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Cuenta</Text>

          <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Shield size={scale(20)} color="#FF0000" />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Miembro desde</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'No disponible'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.signOutButton, { backgroundColor: colors.error }]}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <LogOut size={scale(20)} color="#FFFFFF" />
          <Text style={styles.signOutText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    paddingTop: verticalScale(50),
    paddingBottom: verticalScale(25),
    paddingHorizontal: scale(20),
  },
  avatarContainer: {
    width: scale(100),
    height: scale(100),
    borderRadius: scale(50),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  avatarImage: {
    width: scale(48),
    height: scale(48),
  },
  name: {
    fontSize: scale(24),
    fontWeight: 'bold',
    marginBottom: verticalScale(4),
    textAlign: 'center',
  },
  username: {
    fontSize: scale(16),
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: scale(15),
    marginBottom: verticalScale(20),
  },
  sectionTitle: {
    fontSize: scale(18),
    fontWeight: 'bold',
    marginBottom: verticalScale(12),
  },
  infoCard: {
    borderRadius: scale(12),
    padding: scale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(8),
  },
  infoIconContainer: {
    width: scale(40),
    height: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
    marginLeft: scale(12),
  },
  infoLabel: {
    fontSize: scale(14),
    marginBottom: verticalScale(4),
  },
  infoValue: {
    fontSize: scale(16),
    fontWeight: '600',
  },
  infoSubtext: {
    fontSize: scale(14),
    marginTop: verticalScale(2),
  },
  divider: {
    height: 1,
    marginVertical: verticalScale(8),
  },
  errorText: {
    fontSize: scale(16),
    textAlign: 'center',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: scale(15),
    paddingVertical: verticalScale(16),
    borderRadius: scale(12),
    gap: scale(12),
    marginTop: verticalScale(10),
  },
  signOutText: {
    color: '#FFFFFF',
    fontSize: scale(16),
    fontWeight: '600',
  },
  bottomPadding: {
    height: verticalScale(30),
  },
});