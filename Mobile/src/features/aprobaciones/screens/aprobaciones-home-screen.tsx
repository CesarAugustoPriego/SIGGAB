import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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

import { useAuth } from '@/src/features/auth/auth-context';
import { canViewAprobaciones } from '@/src/features/auth/role-permissions';
import { aprobacionesApi } from '../aprobaciones-api';
import type { ApprovalStatus, InboxItem } from '../aprobaciones-types';

function formatDateIntl(d: string): string {
  const dateStr = d.includes('T') ? d : d + 'T12:00:00';
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function AprobacionesHomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const canView = canViewAprobaciones(user?.rol);

  const loadInbox = useCallback(async () => {
    if (!canView) { setLoading(false); return; }
    try {
      const pending = await aprobacionesApi.getPendingInbox();
      setInbox(pending);
    } catch (err: any) {
      if (err?.status === 401) { await logout(); }
    } finally {
      setLoading(false);
    }
  }, [canView, logout]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    void loadInbox();
  }, [loadInbox]));

  const processItem = async (item: InboxItem, status: ApprovalStatus) => {
    if (processingId) return;
    
    // Si se va a rechazar, pedimos confirmación simple
    if (status === 'RECHAZADO') {
      Alert.alert(
        '¿Rechazar registro?',
        `Estás a punto de descartar este ${item.title}.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Rechazar', 
            style: 'destructive',
            onPress: () => executeProcess(item, status)
          }
        ]
      );
    } else {
      await executeProcess(item, status);
    }
  };

  const executeProcess = async (item: InboxItem, status: ApprovalStatus) => {
    setProcessingId(item.id);
    try {
      await aprobacionesApi.approveItem(item, status);
      // Remove it from the local state list immediately
      setInbox(prev => prev.filter(i => i.id !== item.id));
    } catch (err: any) {
      Alert.alert('Error', err?.data?.error || 'No se pudo procesar el registro.');
    } finally {
      setProcessingId(null);
    }
  };

  if (!canView) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.centerBox}>
          <MaterialCommunityIcons name="lock-outline" size={40} color="#A0A8A0" />
          <Text style={styles.centerTitle}>Acceso restringido</Text>
          <Text style={styles.centerText}>Tu rol ({user?.rol || 'N/A'}) no tiene permisos para realizar aprobaciones operativas.</Text>
          <Pressable style={styles.backButton} onPress={() => router.replace('/(app)/home')}>
            <Text style={styles.backButtonText}>Volver al inicio</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => router.replace('/(app)/home')}>
          <Feather name="arrow-left" size={19} color="#1A1A1A" />
        </Pressable>
        <Image
          source={require('../../../../assets/images/logo-rancho-los-alpes.png')}
          style={styles.logo}
        />
        <Pressable style={styles.iconButton} onPress={() => { setLoading(true); void loadInbox(); }}>
          <Feather name="refresh-cw" size={17} color="#1A1A1A" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Header Block */}
        <View style={styles.headerBlock}>
          <View>
            <Text style={styles.greeting}>Bandeja de Entrada</Text>
            <Text style={styles.subtitle}>Supervisión Administrativa</Text>
          </View>
          <View style={styles.badgeWrap}>
            <Text style={styles.badgeText}>{inbox.length}</Text>
          </View>
        </View>

        <Text style={styles.listLabel}>TUS PENDIENTES</Text>

        {loading ? (
          <View style={[styles.centerBox, { marginTop: 40 }]}>
            <ActivityIndicator color="#5DADE2" size="large" />
          </View>
        ) : inbox.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="check-all" size={48} color="#27AE60" />
            <Text style={styles.emptyTitle}>¡Todo al día!</Text>
            <Text style={styles.emptyText}>No hay registros pendientes por validar tu autorización.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {inbox.map(item => {
              const isSanitario = item.type === 'SANITARIO';
              const isProcessing = processingId === item.id;
              
              return (
                <View key={item.id} style={styles.card}>
                  <View style={[styles.cardAccentLine, { backgroundColor: isSanitario ? '#8E44AD' : '#2F9B47' }]} />
                  <View style={styles.cardContent}>
                    
                    {/* Head */}
                    <View style={styles.cardHead}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        <Text style={styles.cardSubtitle}>{item.subtitle} · {formatDateIntl(item.date)}</Text>
                      </View>
                      <View style={[styles.iconBox, { backgroundColor: isSanitario ? '#F4ECF7' : '#EAFAF1' }]}>
                        <MaterialCommunityIcons 
                          name={isSanitario ? 'pill' : (item.type === 'PESO' ? 'scale' : 'water')} 
                          size={20} 
                          color={isSanitario ? '#8E44AD' : '#2F9B47'} 
                        />
                      </View>
                    </View>
                    
                    <Text style={styles.cardDetails}>{item.details}</Text>

                    {/* Actions */}
                    <View style={styles.actionsRow}>
                      <Pressable 
                        style={[styles.btnReject, isProcessing && styles.btnDisabled]} 
                        onPress={() => processItem(item, 'RECHAZADO')}
                        disabled={!!processingId}
                      >
                        <Feather name="x" size={16} color="#7B7D7D" />
                        <Text style={styles.btnRejectText}>Descartar</Text>
                      </Pressable>
                      
                      <Pressable 
                        style={[styles.btnApprove, isProcessing && styles.btnDisabled]} 
                        onPress={() => processItem(item, 'APROBADO')}
                        disabled={!!processingId}
                      >
                        {isProcessing ? (
                          <ActivityIndicator color="#FFF" size="small" />
                        ) : (
                          <>
                            <Feather name="check-circle" size={16} color="#FFF" />
                            <Text style={styles.btnApproveText}>Autorizar</Text>
                          </>
                        )}
                      </Pressable>
                    </View>

                  </View>
                </View>
              );
            })}
          </View>
        )}
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3F4F3' },
  
  topBar: {
    minHeight: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, backgroundColor: '#F3F4F3', borderBottomWidth: 1, borderBottomColor: '#E6E8E6',
  },
  iconButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#EBEDEB', alignItems: 'center', justifyContent: 'center' },
  logo: { width: 68, height: 36, resizeMode: 'contain' },

  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, gap: 12 },

  headerBlock: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingHorizontal: 4 },
  greeting: { fontSize: 24, fontWeight: '800', color: '#1A2D1A', letterSpacing: 0.5 },
  subtitle: { fontSize: 13, color: '#7A8A7A', marginTop: 4, fontWeight: '500' },
  badgeWrap: { backgroundColor: '#C0392B', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  badgeText: { color: '#FFF', fontWeight: '800', fontSize: 16 },

  listLabel: { fontSize: 12, fontWeight: '700', color: '#5A6A5A', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginLeft: 4 },

  list: { gap: 12 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, flexDirection: 'row', overflow: 'hidden',
    borderWidth: 1, borderColor: '#EBDFD8', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 3,
  },
  cardAccentLine: { width: 6, backgroundColor: '#3498DB' },
  cardContent: { flex: 1, padding: 16 },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#1B241B' },
  cardSubtitle: { fontSize: 12, color: '#5A7A5A', marginTop: 4, fontWeight: '700' },
  iconBox: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  
  cardDetails: { fontSize: 13, color: '#8A7A71', marginTop: 10, paddingVertical: 10, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F5F5F5' },

  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btnReject: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FDECEA', borderRadius: 12, minHeight: 44, borderWidth: 1, borderColor: '#F5B7B1' },
  btnRejectText: { color: '#C0392B', fontWeight: '700', fontSize: 14 },
  
  btnApprove: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#1A2D1A', borderRadius: 12, minHeight: 44 },
  btnApproveText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  btnDisabled: { opacity: 0.6 },

  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 32, alignItems: 'center', gap: 12, marginTop: 20, borderWidth: 1, borderColor: '#EBDFD8' },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1B241B' },
  emptyText: { fontSize: 13, color: '#8A7A71', textAlign: 'center', paddingHorizontal: 10 },

  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 28 },
  centerTitle: { fontSize: 18, fontWeight: '800', color: '#1B241B', textAlign: 'center' },
  centerText: { fontSize: 13, color: '#8A7A71', textAlign: 'center' },
  backButton: { marginTop: 8, backgroundColor: '#1A2D1A', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28 },
  backButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});
