import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/src/features/auth/auth-context';
import { canViewInventario } from '@/src/features/auth/role-permissions';
import { inventarioApi } from '../inventario-api';
import type { Insumo, MovimientoInventario, TipoInsumo } from '../inventario-types';

type Tab = 'insumos' | 'movimientos';

function formatDateLong(d: string): string {
  const rawDate = d;
  const date = new Date(rawDate.includes('T') ? rawDate : rawDate + 'T00:00:00');
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function toNum(val: number | string): number {
  return typeof val === 'string' ? parseFloat(val) : val;
}

export function InventarioHomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  
  const [tab, setTab] = useState<Tab>('insumos');
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([]);
  const [tipos, setTipos] = useState<TipoInsumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canView = useMemo(() => canViewInventario(user?.rol), [user?.rol]);

  const loadData = useCallback(async () => {
    if (!canView) { setLoading(false); return; }
    setError(null);
    try {
      const [ins, mov, ts] = await Promise.all([
        inventarioApi.getInsumos(),
        inventarioApi.getMovimientos(),
        inventarioApi.getTipos(),
      ]);
      setInsumos(ins);
      setMovimientos(mov);
      setTipos(ts);
    } catch (err: unknown) {
      const e = err as { status?: number };
      if (e?.status === 401) { await logout(); return; }
      setError('Error al cargar transacciones del almacén.');
    } finally {
      setLoading(false);
    }
  }, [canView, logout]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    void loadData();
  }, [loadData]));

  // ── Metrics ─────────────────────────────────────────────────────────────
  
  const lowStockCount = insumos.filter(i => toNum(i.stockActual) <= 5).length;
  // Let's get "Movimientos hoy"
  const today = new Date().toISOString().slice(0, 10);
  const todaysMovs = movimientos.filter(m => m.fechaMovimiento.slice(0, 10) === today).length;

  if (!canView) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.centerBox}>
          <MaterialCommunityIcons name="lock-outline" size={40} color="#A0A8A0" />
          <Text style={styles.centerTitle}>Acceso restringido</Text>
          <Text style={styles.centerText}>Tu rol no tiene permisos para el módulo Almacén e Inventario.</Text>
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
        <Pressable style={styles.iconButton} onPress={() => void loadData()}>
          <Feather name="refresh-cw" size={17} color="#1A1A1A" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* ── Header card amber ── */}
        <View style={styles.headerCard}>
          <View style={styles.headerCardLeft}>
            <Feather name="package" size={20} color="#FFFFFF" />
            <Text style={styles.headerCardLabel}>INVENTARIO</Text>
          </View>
          <Text style={styles.headerCardSub}>Almacén y Recursos</Text>
        </View>

        {/* ── Summary chips ── */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryChip, { backgroundColor: '#FFF5F0' }]}>
            <Feather name="archive" size={16} color="#D35400" />
            <Text style={styles.summaryChipLabel}>Tipos Insumo</Text>
            <Text style={styles.summaryChipValue}>
              {tipos.length}
            </Text>
          </View>
          <View style={[styles.summaryChip, { backgroundColor: '#FDF1E7' }]}>
            <Feather name="alert-triangle" size={16} color="#E67E22" />
            <Text style={styles.summaryChipLabel}>Stock Bajo</Text>
            <Text style={[styles.summaryChipValue, { color: lowStockCount > 0 ? '#C0392B' : '#D35400' }]}>
              {lowStockCount} ítems
            </Text>
          </View>
          <View style={[styles.summaryChip, { backgroundColor: '#F8F0EC' }]}>
            <Feather name="activity" size={16} color="#8E44AD" />
            <Text style={styles.summaryChipLabel}>Movs. hoy</Text>
            <Text style={[styles.summaryChipValue, { color: '#7D3C98' }]}>
              {todaysMovs} 
            </Text>
          </View>
        </View>

        {/* ── Tabs ── */}
        <View style={styles.tabBar}>
          <Pressable onPress={() => setTab('insumos')} style={[styles.tabItem, tab === 'insumos' && styles.tabItemActive]}>
            <Text style={[styles.tabText, tab === 'insumos' && styles.tabTextActive]}>
              📦 Stock (Catálogo)
            </Text>
          </Pressable>
          <Pressable onPress={() => setTab('movimientos')} style={[styles.tabItem, tab === 'movimientos' && styles.tabItemActive]}>
            <Text style={[styles.tabText, tab === 'movimientos' && styles.tabTextActive]}>
              📋 Movimientos
            </Text>
          </Pressable>
        </View>

        {/* ── FAB ── */}
        <View style={styles.actionsRow}>
          <Pressable
            style={styles.primaryFab}
            onPress={() => router.push('/(app)/inventario/registro-movimiento' as any)}
          >
            <Feather name="file-text" size={16} color="#FFF" />
            <Text style={styles.primaryFabText}>Reportar movimiento</Text>
          </Pressable>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Text style={styles.listTitle}>
          {tab === 'insumos' ? 'Catálogo de existencias' : 'Historial de movimientos'}
        </Text>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color="#D35400" size="large" />
          </View>
        ) : tab === 'insumos' ? (
          <InsumosList items={insumos} />
        ) : (
          <MovimientosList items={movimientos} />
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function InsumosList({ items }: { items: Insumo[] }) {
  if (items.length === 0) return <EmptyState msg="No hay insumos registrados en el catálogo." />;
  return (
    <View style={styles.list}>
      {items.map(m => {
        const stock = toNum(m.stockActual);
        const low = stock <= 5;
        return (
          <View key={m.idInsumo} style={styles.recordCard}>
            <View style={styles.recordLeft}>
              <View style={[styles.iconBox, { backgroundColor: low ? '#FDECEA' : '#FFF0E5' }]}>
                <Feather name="box" size={17} color={low ? '#C0392B' : '#D35400'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.recordMain} numberOfLines={1}>{m.nombreInsumo}</Text>
                <Text style={styles.recordSub}>
                  {m.tipoInsumo?.nombreTipo || 'Sin categoría'}
                </Text>
              </View>
            </View>
            <View style={styles.recordRight}>
              <Text style={[styles.stockText, low && { color: '#C0392B' }]}>
                {stock} <Text style={styles.unitText}>{m.unidadMedida}</Text>
              </Text>
              {low && <Text style={styles.lowStockWarn}>Stock Bajo</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function MovimientosList({ items }: { items: MovimientoInventario[] }) {
  const sorted = [...items].sort((a, b) => b.fechaMovimiento.localeCompare(a.fechaMovimiento));
  if (sorted.length === 0) return <EmptyState msg="No hay movimientos recientes en el historial." />;
  
  return (
    <View style={styles.list}>
      {sorted.map(m => {
        const isEntrada = m.tipoMovimiento === 'ENTRADA';
        const color = isEntrada ? '#2F9B47' : '#C0392B';
        const bg = isEntrada ? '#EBF7EE' : '#FDECEA';
        return (
          <View key={m.idMovimiento} style={styles.recordCard}>
            <View style={styles.recordLeft}>
              <View style={[styles.iconBox, { backgroundColor: bg }]}>
                <Feather name={isEntrada ? "arrow-down-left" : "arrow-up-right"} size={17} color={color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.recordMain} numberOfLines={1}>{m.insumo?.nombreInsumo || 'Insumo #' + m.idInsumo}</Text>
                <Text style={styles.recordSub}>
                  {formatDateLong(m.fechaMovimiento)} · {m.registrador?.nombreCompleto || 'Sistema'}
                </Text>
              </View>
            </View>
            <View style={styles.recordRight}>
              <Text style={[styles.amountText, { color }]}>
                {isEntrada ? '+' : '-'}{toNum(m.cantidad)} {m.insumo?.unidadMedida}
              </Text>
              <View style={[styles.estadoBadge, { backgroundColor: color }]}>
                <Text style={styles.estadoBadgeText}>{m.tipoMovimiento}</Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function EmptyState({ msg }: { msg: string }) {
  return (
    <View style={styles.emptyCard}>
      <MaterialCommunityIcons name="inbox-outline" size={32} color="#DCDCDC" />
      <Text style={styles.emptyTitle}>Sin registros</Text>
      <Text style={styles.emptyText}>{msg}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3F4F3' },
  content: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },

  topBar: {
    minHeight: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, backgroundColor: '#F3F4F3', borderBottomWidth: 1, borderBottomColor: '#E6E8E6',
  },
  iconButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EBEDEB', alignItems: 'center', justifyContent: 'center' },
  logo: { width: 68, height: 36, resizeMode: 'contain' },

  headerCard: {
    backgroundColor: '#D35400', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12,
  },
  headerCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerCardLabel: { color: '#FFFFFF', fontWeight: '800', fontSize: 18, letterSpacing: 1 },
  headerCardSub: { color: '#FAD7A1', fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },

  summaryRow: { flexDirection: 'row', gap: 8 },
  summaryChip: { flex: 1, borderRadius: 12, padding: 10, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#F0E5DE' },
  summaryChipLabel: { fontSize: 10, color: '#7E6B5D', fontWeight: '600' },
  summaryChipValue: { fontSize: 15, fontWeight: '800', color: '#D35400' },

  tabBar: { flexDirection: 'row', backgroundColor: '#E4DFDC', borderRadius: 12, padding: 4, gap: 4 },
  tabItem: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  tabItemActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 12, fontWeight: '600', color: '#7A6D65' },
  tabTextActive: { color: '#A04000', fontWeight: '800' },

  actionsRow: { flexDirection: 'row', gap: 8 },
  primaryFab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#D35400', borderRadius: 12, minHeight: 48,
    shadowColor: '#D35400', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
  },
  primaryFabText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },

  listTitle: { fontSize: 14, fontWeight: '700', color: '#3A2E26', marginTop: 4 },
  list: { gap: 8 },
  recordCard: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#EBDFD8', gap: 10,
  },
  recordLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  recordRight: { alignItems: 'flex-end', gap: 4 },
  recordMain: { fontSize: 15, fontWeight: '800', color: '#3A2E26' },
  recordSub: { fontSize: 11, color: '#8A7A71', marginTop: 2 },
  
  stockText: { fontSize: 16, fontWeight: '800', color: '#A04000' },
  unitText: { fontSize: 11, fontWeight: '600', color: '#A04000' },
  lowStockWarn: { fontSize: 9, color: '#C0392B', fontWeight: '700', letterSpacing: 0.5 },
  amountText: { fontSize: 14, fontWeight: '800' },
  estadoBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  estadoBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  emptyCard: {
    backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#EBEBEB',
    padding: 24, alignItems: 'center', gap: 8,
  },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: '#5A4A4A' },
  emptyText: { fontSize: 12, color: '#9A8A8A', textAlign: 'center' },
  errorText: { color: '#C0392B', fontSize: 12, fontWeight: '600' },

  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 28 },
  centerTitle: { fontSize: 18, fontWeight: '800', color: '#2A1A1A', textAlign: 'center' },
  centerText: { fontSize: 13, color: '#77625A', textAlign: 'center' },
  backButton: { marginTop: 8, backgroundColor: '#D35400', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28 },
  backButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});
