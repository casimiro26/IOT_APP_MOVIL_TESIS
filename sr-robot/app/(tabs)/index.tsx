import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  Dimensions,
  Platform,
  StatusBar,
  SafeAreaView 
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MonitoringCard } from '../../components/MonitoringCard';
import { Activity, Shield, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react-native';
import { LineChart } from 'react-native-chart-kit';

// Interface que coincide con tu backend
interface BackendData {
  id: number;
  idUsuario: string;
  marcaTiempo: string;
  horasMonitoreadas: number;
  eventosTotales: number;
  eventosCriticos: number;
  movimiento: string;
  promedio: number;
}

// Dimensiones y funciones responsive
const { width, height } = Dimensions.get('window');
const scale = (size: number) => (width / 375) * size;
const verticalScale = (size: number) => (height / 812) * size;

export default function DashboardScreen() {
  const theme = useTheme();
  const colors = theme.colors || {};
  const { user, profile } = useAuth();
  const [events, setEvents] = useState<BackendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = async () => {
    if (!user) {
      setError('Usuario no autenticado');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('No se encontró el token');

      const response = await fetch('https://api-app-android-studio-tesis.onrender.com/datos', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // El backend devuelve un array directo, no data.eventos
      if (Array.isArray(data)) {
        setEvents(data);
      } else {
        // Si por alguna razón no es array, intentamos extraer datos
        setEvents(data.datos || data.eventos || []);
      }
      setError(null);
    } catch (err) {
      const error = err as Error;
      console.error('Error al cargar eventos:', error);
      setError(error.message || 'Error al cargar eventos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadEvents();
    }, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadEvents();
  };

  // Adaptar los cálculos para usar los campos del backend
  const chartData = useMemo(() => {
    const last7Days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dayStr = date.toISOString().split('T')[0];
      const dayEvents = events.filter(e => 
        new Date(e.marcaTiempo).toISOString().split('T')[0] === dayStr
      );
      last7Days.push(dayEvents.length);
    }
    return {
      labels: ['-6', '-5', '-4', '-3', '-2', '-1', 'Hoy'],
      datasets: [{
        data: last7Days,
      }],
    };
  }, [events]);

  const todayEvents = events.filter(e => {
    const today = new Date();
    const eventDate = new Date(e.marcaTiempo);
    return eventDate.toDateString() === today.toDateString();
  });

  // Usar eventosCriticos del backend
  const criticalEvents = events.reduce((sum, e) => sum + e.eventosCriticos, 0);
  const totalEvents = events.reduce((sum, e) => sum + e.eventosTotales, 0);
  const normalEvents = totalEvents - criticalEvents;
  
  // Calcular promedio basado en los datos del backend
  const averageValue = events.length > 0
    ? (events.reduce((sum, e) => sum + e.promedio, 0) / events.length).toFixed(1)
    : '0';

  // Función para determinar el tipo de evento basado en movimiento
  const getEventType = (movimiento: string) => {
    return movimiento === 'sí' ? 'DETECCIÓN DE MOVIMIENTO' : 'SIN MOVIMIENTO';
  };

  // Función para determinar el estado basado en eventos críticos
  const getStatus = (eventosCriticos: number, eventosTotales: number) => {
    const porcentajeCritico = eventosTotales > 0 ? (eventosCriticos / eventosTotales) * 100 : 0;
    if (porcentajeCritico > 50) return 'critical';
    if (porcentajeCritico > 20) return 'warning';
    return 'normal';
  };

  const getStatusInSpanish = (status: string) => {
    switch (status) {
      case 'critical': return 'Crítico';
      case 'warning': return 'Advertencia';
      case 'normal': return 'Normal';
      default: return status;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background || '#FFFFFF' }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary || '#666' }]}>Bienvenido</Text>
            <Text style={[styles.name, { color: colors.text || '#000' }]}>{profile?.full_name || 'Usuario'}</Text>
          </View>
        </View>
        
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.error || '#FF0000' }]}>{error}</Text>
          </View>
        ) : null}
        
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <View style={styles.statHalf}>
              <MonitoringCard
                title="Total de Sesiones"
                value={events.length.toString()}
                icon={Activity}
                color={colors.primary || '#007AFF'}
                subtitle="Sesiones de monitoreo"
              />
            </View>
            <View style={styles.statHalf}>
              <MonitoringCard
                title="Hoy"
                value={todayEvents.length.toString()}
                icon={TrendingUp}
                color={colors.success || '#34C759'}
                subtitle="Sesiones de hoy"
              />
            </View>
          </View>
          
          <View style={[styles.chartCard, { backgroundColor: colors.card || '#F2F2F7' }]}>
            <Text style={[styles.chartTitle, { color: colors.text || '#000' }]}>Actividad de Monitoreo</Text>
            <Text style={[styles.chartSubtitle, { color: colors.textSecondary || '#666' }]}>Sesiones (Últimos 7 días)</Text>
            <LineChart
              data={chartData}
              width={width * 0.85} // ✅ CORREGIDO - 85% del ancho
              height={verticalScale(190)} // ✅ CORREGIDO - Menos alto
              yAxisLabel=""
              chartConfig={{
                backgroundColor: colors.card || '#F2F2F7',
                backgroundGradientFrom: colors.card || '#F2F2F7',
                backgroundGradientTo: colors.card || '#F2F2F7',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`,
                labelColor: (opacity = 1) => colors.text || `rgba(0, 0, 0, ${opacity})`,
                style: {},
                propsForDots: {
                  r: "4", // ✅ CORREGIDO - Puntos más pequeños
                  strokeWidth: "1.5",
                  stroke: "#FF0000"
                }
              }}
              bezier
              style={{
                marginVertical: scale(4), // ✅ CORREGIDO - Menos margen
                borderRadius: scale(16),
                alignSelf: 'center', // ✅ CORREGIDO - Centrado
              }}
            />
            <Text style={[styles.chartStatus, { 
              color: criticalEvents === 0 ? (colors.success || '#34C759') : (colors.error || '#FF0000') 
            }]}>
              {criticalEvents === 0 ? 'Óptimo' : 'Alerta'}
            </Text>
            <Text style={[styles.chartSubtitle, { color: colors.textSecondary || '#666' }]}>
              {`${normalEvents} normales, ${criticalEvents} críticos`}
            </Text>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statHalf}>
              <MonitoringCard
                title="Eventos Críticos"
                value={criticalEvents.toString()}
                icon={AlertTriangle}
                color={colors.error || '#FF0000'}
              />
            </View>
            <View style={styles.statHalf}>
              <MonitoringCard
                title="Eventos Totales"
                value={totalEvents.toString()}
                icon={CheckCircle}
                color={colors.success || '#34C759'}
              />
            </View>
          </View>
          
          <MonitoringCard
            title="Promedio de Criticidad"
            value={`${averageValue}%`}
            icon={TrendingUp}
            color={colors.primary || '#007AFF'}
            subtitle="Porcentaje promedio de eventos críticos"
          />
        </View>

        <View style={styles.recentSection}>
          <Text style={[styles.sectionTitle, { color: colors.text || '#000' }]}>Sesiones Recientes</Text>
          {loading ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.loadingText, { color: colors.textSecondary || '#666' }]}>Cargando sesiones...</Text>
            </View>
          ) : events.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary || '#666' }]}>No hay sesiones disponibles</Text>
            </View>
          ) : (
            events.slice(0, 5).map((event, index) => {
              const status = getStatus(event.eventosCriticos, event.eventosTotales);
              const statusColor = status === 'critical' 
                ? colors.error || '#FF0000'
                : status === 'warning' 
                ? colors.warning || '#FF9500'
                : colors.success || '#34C759';
                
              return (
                <View key={event.id || `event-${index}`} style={[styles.eventCard, { backgroundColor: colors.card || '#F2F2F7' }]}>
                  <View style={styles.eventHeader}>
                    <Text style={[styles.eventType, { color: colors.text || '#000' }]}>
                      {getEventType(event.movimiento)}
                    </Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: statusColor + '20' }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: statusColor }
                      ]}>
                        {getStatusInSpanish(status)}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.eventDescription, { color: colors.textSecondary || '#666' }]}>
                    {`Horas monitoreadas: ${event.horasMonitoreadas}h | Eventos: ${event.eventosTotales} | Críticos: ${event.eventosCriticos}`}
                  </Text>
                  <View style={styles.eventFooter}>
                    <Text style={[styles.eventValue, { color: colors.text || '#000' }]}>
                      Criticidad: {event.promedio}%
                    </Text>
                    <Text style={[styles.eventDate, { color: colors.textSecondary || '#666' }]}>
                      {new Date(event.marcaTiempo).toLocaleString('es-ES')}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(50),
    paddingBottom: verticalScale(20),
  },
  greeting: { 
    fontSize: scale(14),
  },
  name: { 
    fontSize: scale(24), 
    fontWeight: 'bold', 
    marginTop: verticalScale(4),
  },
  statsGrid: { 
    paddingHorizontal: scale(15),
  },
  statsRow: { 
    flexDirection: 'row', 
    marginHorizontal: scale(-5),
    marginBottom: verticalScale(12),
  },
  statHalf: { 
    flex: 1, 
    paddingHorizontal: scale(5),
  },
  chartCard: {
    borderRadius: scale(12),
    padding: scale(16),
    marginBottom: verticalScale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    alignItems: 'center',
  },
  chartTitle: { 
    fontSize: scale(18), 
    fontWeight: 'bold', 
    marginBottom: verticalScale(4),
    textAlign: 'center',
  },
  chartSubtitle: { 
    fontSize: scale(14), 
    marginBottom: verticalScale(8), 
    textAlign: 'center',
  },
  chartStatus: { 
    fontSize: scale(16), 
    fontWeight: 'bold', 
    marginTop: verticalScale(8), 
    marginBottom: verticalScale(4),
  },
  recentSection: { 
    paddingHorizontal: scale(15), 
    paddingTop: verticalScale(20), 
    paddingBottom: verticalScale(20),
  },
  sectionTitle: { 
    fontSize: scale(20), 
    fontWeight: 'bold', 
    marginBottom: verticalScale(16),
  },
  eventCard: {
    borderRadius: scale(12),
    padding: scale(16),
    marginBottom: verticalScale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(8),
    flexWrap: 'wrap',
  },
  eventType: { 
    fontSize: scale(16), 
    fontWeight: '600',
    flex: 1,
    marginRight: scale(8),
  },
  statusBadge: { 
    paddingHorizontal: scale(12), 
    paddingVertical: verticalScale(4), 
    borderRadius: scale(12),
  },
  statusText: { 
    fontSize: scale(12), 
    fontWeight: '600', 
    textTransform: 'uppercase',
  },
  eventDescription: { 
    fontSize: scale(14), 
    marginBottom: verticalScale(8),
    lineHeight: scale(20),
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  eventValue: { 
    fontSize: scale(14), 
    fontWeight: '600',
    marginRight: scale(8),
  },
  eventDate: { 
    fontSize: scale(12),
  },
  errorContainer: {
    paddingHorizontal: scale(20),
    marginBottom: verticalScale(10),
  },
  errorText: { 
    fontSize: scale(16), 
    textAlign: 'center', 
    marginVertical: verticalScale(10),
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: verticalScale(20),
  },
  loadingText: { 
    fontSize: scale(16), 
    textAlign: 'center',
  },
  emptyText: { 
    fontSize: scale(16), 
    textAlign: 'center',
  },
  bottomPadding: { 
    height: verticalScale(30),
  },
});