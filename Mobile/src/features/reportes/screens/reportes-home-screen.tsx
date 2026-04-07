import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { downloadAndShareReport } from '@/src/lib/download-service';

export function ReportesHomeScreen() {
  const router = useRouter();
  
  // Simulated loading state for UX
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (endpoint: string, cardId: string) => {
    if (downloading) return;
    setDownloading(cardId);
    
    try {
      await downloadAndShareReport(endpoint, 'pdf');
      // No alert needed since Sharing UI pops up automatically on success
    } catch (e: unknown) {
      if (e instanceof Error) {
        Alert.alert('Error', e.message);
      } else {
        Alert.alert('Error', 'Hubo un error inesperado al descargar');
      }
    } finally {
      setDownloading(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* ── Top Bar matching mockup ── */}
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => router.replace('/(app)/home')}>
           <Feather name="menu" size={24} color="#1A1A1A" />
        </Pressable>
        <Image
          source={require('../../../../assets/images/logo-rancho-los-alpes.png')}
          style={styles.logo}
        />
        <View style={[styles.iconButton, { opacity: 0 }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <Text style={styles.screenTitle}>Reportes</Text>

        {/* ── Cards List ── */}
        
        {/* Card: Reporte de Hato (Blue) */}
        <Pressable style={styles.card} onPress={() => handleDownload('/reportes/administrativo', 'Reporte_General_Hato')}>
          <View style={styles.cardContent}>
            <View style={[styles.iconBox, { backgroundColor: '#4285F4' }]}>
              <MaterialCommunityIcons name="cow" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.textStack}>
              <Text style={styles.cardTitle}>Reporte de Hato</Text>
              <Text style={styles.cardSubtitle}>Resumen de hato, razas y edades</Text>
            </View>
            <View style={styles.actionIconBox}>
              {downloading === 'Reporte_General_Hato' ? (
                 <ActivityIndicator size="small" color="#7A8A7A" />
              ) : (
                 <Feather name="download" size={20} color="#5C6C5C" />
              )}
            </View>
          </View>
        </Pressable>

        {/* Card: Reporte Sanitario (Red) */}
        <Pressable style={styles.card} onPress={() => handleDownload('/reportes/sanitario', 'Reporte_Sanitario_Tratamientos')}>
          <View style={styles.cardContent}>
            <View style={[styles.iconBox, { backgroundColor: '#EA4335' }]}>
              <MaterialCommunityIcons name="heart-pulse" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.textStack}>
              <Text style={styles.cardTitle}>Reporte Sanitario</Text>
              <Text style={styles.cardSubtitle}>Animales enfermos y tratamientos</Text>
            </View>
            <View style={styles.actionIconBox}>
              {downloading === 'Reporte_Sanitario_Tratamientos' ? (
                 <ActivityIndicator size="small" color="#7A8A7A" />
              ) : (
                 <Feather name="download" size={20} color="#5C6C5C" />
              )}
            </View>
          </View>
        </Pressable>

        {/* Card: Control de Peso (Green) */}
        <Pressable style={styles.card} onPress={() => handleDownload('/reportes/productivo', 'Reporte_Evolucion_Peso')}>
          <View style={styles.cardContent}>
            <View style={[styles.iconBox, { backgroundColor: '#34A853' }]}>
              <MaterialCommunityIcons name="scale-bathroom" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.textStack}>
              <Text style={styles.cardTitle}>Control de Peso</Text>
              <Text style={styles.cardSubtitle}>Evolución y ganancia diaria</Text>
            </View>
            <View style={styles.actionIconBox}>
              {downloading === 'Reporte_Evolucion_Peso' ? (
                 <ActivityIndicator size="small" color="#7A8A7A" />
              ) : (
                 <Feather name="download" size={20} color="#5C6C5C" />
              )}
            </View>
          </View>
        </Pressable>

        {/* Card: Inventario Valorado (Orange) */}
        <Pressable style={styles.card} onPress={() => handleDownload('/reportes/administrativo', 'Reporte_Inventario_Valorado')}>
          <View style={styles.cardContent}>
            <View style={[styles.iconBox, { backgroundColor: '#FBBC05' }]}>
              <MaterialCommunityIcons name="package-variant-closed" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.textStack}>
              <Text style={styles.cardTitle}>Reporte de Inventario</Text>
              <Text style={styles.cardSubtitle}>Stock actual, ingresos y salidas</Text>
            </View>
            <View style={styles.actionIconBox}>
              {downloading === 'Reporte_Inventario_Valorado' ? (
                 <ActivityIndicator size="small" color="#7A8A7A" />
              ) : (
                 <Feather name="download" size={20} color="#5C6C5C" />
              )}
            </View>
          </View>
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' }, // Pure white background based on mockup
  
  topBar: {
    minHeight: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, backgroundColor: '#FFFFFF',
  },
  iconButton: { padding: 4 },
  logo: { width: 80, height: 44, resizeMode: 'contain' },

  content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 },

  screenTitle: { fontSize: 22, fontWeight: '900', color: '#1B241B', marginBottom: 24, marginTop: 10, letterSpacing: -0.5 },

  card: {
    backgroundColor: '#FFFFFF', 
    borderRadius: 20, 
    marginBottom: 20,
    borderWidth: 1, 
    borderColor: '#F0F0F0',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 10, 
    elevation: 4,
  },
  cardContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16,
  },
  iconBox: { 
    width: 52, 
    height: 52, 
    borderRadius: 14, 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 4, 
    elevation: 3,
  },
  textStack: { 
    flex: 1, 
    marginLeft: 16,
    justifyContent: 'center',
  },
  cardTitle: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: '#1B241B', 
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  cardSubtitle: { 
    fontSize: 12, 
    color: '#7A8A7A',
    fontWeight: '500', 
  },
  actionIconBox: { 
    padding: 8,
  },
});
