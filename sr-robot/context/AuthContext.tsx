import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  username: string;
  theme?: string;
}

interface AuthContextType {
  user: { id: string; nombreUsuario: string } | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, username: string) => Promise<{ error: any }>;
  signIn: (userOrEmail: string, token: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; nombreUsuario: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('user');
        if (token && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          await loadProfile();
        }
      } catch (error) {
        console.error('Error al cargar datos de autenticación:', error);
        await AsyncStorage.multiRemove(['token', 'user']);
      } finally {
        setLoading(false);
      }
    };
    loadStoredAuth();
  }, []);

  const loadProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setProfile(null);
        return;
      }

      console.log('Token enviado al backend:', token); // Para debug

      const response = await fetch('https://api-app-android-studio-tesis.onrender.com/user/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log('Respuesta del perfil:', data); // Para debug

      if (!response.ok) {
        if (response.status === 401) {
          await AsyncStorage.multiRemove(['token', 'user']);
          setUser(null);
          setProfile(null);
          throw new Error('Token inválido o expirado');
        }
        throw new Error(data.mensaje || 'Error al cargar el perfil');
      }

      // Actualizar el usuario con los datos reales del backend
      const realUser = { 
        id: data._id || data.id, 
        nombreUsuario: data.nombreUsuario 
      };
      setUser(realUser);
      await AsyncStorage.setItem('user', JSON.stringify(realUser));

      setProfile({
        id: realUser.id,
        email: data.correo || '',
        full_name: data.nombreCompleto || '',
        username: data.nombreUsuario || '',
        theme: data.theme || 'light',
      });
    } catch (error: any) {
      console.error('Error loading profile:', error);
      
      if (
        error.message?.toLowerCase().includes('token') ||
        error.message?.toLowerCase().includes('unauthorized') ||
        error.message?.toLowerCase().includes('401') ||
        error.message?.toLowerCase().includes('inválido')
      ) {
        await AsyncStorage.multiRemove(['token', 'user']);
        setUser(null);
      }
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    await loadProfile();
  };

  const signUp = async (email: string, password: string, fullName: string, username: string) => {
    try {
      const response = await fetch('https://api-app-android-studio-tesis.onrender.com/registrar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombreCompleto: fullName,
          correo: email,
          nombreUsuario: username,
          contrasena: password,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.mensaje || 'Error al registrar usuario');
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signIn = async (userOrEmail: string, token: string) => {
    try {
      // GUARDAR DIRECTAMENTE el token sin decodificar
      console.log('Token recibido en signIn:', token); // Para debug
      
      await AsyncStorage.setItem('token', token);
      
      // Crear usuario temporal hasta que loadProfile obtenga los datos reales
      const tempUser = { id: 'temp', nombreUsuario: userOrEmail };
      await AsyncStorage.setItem('user', JSON.stringify(tempUser));
      setUser(tempUser);
      
      // loadProfile obtendrá los datos reales del backend y actualizará el usuario
      await loadProfile();
      
      return { error: null };
    } catch (error: any) {
      console.error('Error en signIn:', error);
      await AsyncStorage.multiRemove(['token', 'user']);
      setUser(null);
      setProfile(null);
      return { error: error.message || error };
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.multiRemove(['token', 'user']);
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}