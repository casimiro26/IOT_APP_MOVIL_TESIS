import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { LucideIcon } from 'lucide-react-native';

// Dimensiones y funciones responsive
const { width, height } = Dimensions.get('window');
const scale = (size: number) => (width / 375) * size;
const verticalScale = (size: number) => (height / 812) * size;

interface MonitoringCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  color: string;
  subtitle?: string;
}

export function MonitoringCard({ title, value, icon: Icon, color, subtitle }: MonitoringCardProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <Icon size={scale(24)} color={color} />
        </View>
      </View>
      <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: scale(16),
    padding: scale(20),
    marginBottom: verticalScale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  iconContainer: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: scale(14),
    fontWeight: '500',
    marginBottom: verticalScale(4),
  },
  value: {
    fontSize: scale(28),
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: scale(12),
    marginTop: verticalScale(4),
  },
});