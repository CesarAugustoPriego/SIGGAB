import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-gifted-charts';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/src/features/auth/auth-context';
import {
  canCreateAnimal,
  canCreateEventoReproductivo,
  canViewEventosReproductivos,
  canViewProductivo,
} from '@/src/features/auth/role-permissions';
import { productivoApi } from '../productivo-api';
import type { RegistroPeso, ProduccionLeche, EventoReproductivo } from '../productivo-types';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W - 64;

type Tab = 'peso' | 'leche' | 'reproductivo';

// ── Helpers ────────────────────────────────────────────────────────────────────

function toNum(v: number | string): number {
  return typeof v === 'string' ? parseFloat(v) : v;
}

function formatDate(d: string): string {
  const date = new Date(d.includes('T') ? d : d + 'T00:00:00');
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
}

function formatDateLong(d: string): string {
  const date = new Date(d.includes('T') ? d : d + 'T00:00:00');
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getTrend(values: number[]): { pct: string; positive: boolean } | null {
  if (values.length < 2) return null;
  const first = values[0];
  const last = values[values.length - 1];
  if (!first) return null;
  const pct = (((last - first) / first) * 100).toFixed(0);
  return { pct: `${Number(pct) >= 0 ? '+' : ''}${pct}%`, positive: Number(pct) >= 0 };
}

function estadoBadgeColor(estado: string): string {
  if (estado === 'APROBADO') return '#2F9B47';
  if (estado === 'RECHAZADO') return '#C0392B';
  return '#F39C12';
}

const TIPO_LABELS: Record<string, string> = {
  CELO: 'Celo', MONTA: 'Monta', 'PREÑEZ': 'Preñez', PARTO: 'Parto', ABORTO: 'Aborto',
};
const TIPO_ICON: Record<string, string> = {
  CELO: 'heart', MONTA: 'link', 'PREÑEZ': 'baby-carriage', PARTO: 'star', ABORTO: 'alert-circle',
};

// ── Aggregate: peso promedio del HATO por fecha ────────────────────────────────

function buildHerdWeightPoints(registros: RegistroPeso[]): { value: number; label?: string }[] {
  // Group by date → average weight
  const byDate = new Map<string, number[]>();
  for (const r of registros) {
    const date = r.fechaRegistro.slice(0, 10);
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date)!.push(toNum(r.peso));
  }
  const sorted = [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b));
  return sorted.map(([date, pesos], i) => ({
    value: parseFloat((pesos.reduce((s, v) => s + v, 0) / pesos.length).toFixed(1)),
    // Show label only every ~4 points to avoid crowding
    label: i % Math.max(1, Math.floor(sorted.length / 5)) === 0 ? formatDate(date) : undefined,
  }));
}

function buildMilkPoints(registros: ProduccionLeche[]): { value: number; label?: string }[] {
  const byDate = new Map<string, number[]>();
  for (const r of registros) {
    const date = r.fechaRegistro.slice(0, 10);
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date)!.push(toNum(r.litrosProducidos));
  }
  const sorted = [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b));
  return sorted.map(([date, litros], i) => ({
    value: parseFloat((litros.reduce((s, v) => s + v, 0)).toFixed(1)),
    label: i % Math.max(1, Math.floor(sorted.length / 5)) === 0 ? formatDate(date) : undefined,
  }));
}

// ── Main Screen ────────────────────────────────────────────────────────────────

export function ProductivoHomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [tab, setTab] = useState<Tab>('peso');
  const [registrosPeso, setRegistrosPeso] = useState<RegistroPeso[]>([]);
  const [registrosLeche, setRegistrosLeche] = useState<ProduccionLeche[]>([]);
  const [eventosRepro, setEventosRepro] = useState<EventoReproductivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canViewFullProductivo = useMemo(() => canViewProductivo(user?.rol), [user?.rol]);
  const canViewReproductivo = useMemo(() => canViewEventosReproductivos(user?.rol), [user?.rol]);
  const canCreateFullRegistros = useMemo(() => canCreateAnimal(user?.rol), [user?.rol]);
  const canCreateReproductivo = useMemo(() => canCreateEventoReproductivo(user?.rol), [user?.rol]);
  const canView = canViewFullProductivo || canViewReproductivo;
  const visibleTabs = useMemo(
    () => (canViewFullProductivo ? (['peso', 'leche', 'reproductivo'] as Tab[]) : (['reproductivo'] as Tab[])),
    [canViewFullProductivo]
  );

  useEffect(() => {
    if (!visibleTabs.includes(tab)) {
      setTab(visibleTabs[0]);
    }
  }, [tab, visibleTabs]);

  const loadData = useCallback(async () => {
    if (!canView) { setLoading(false); return; }
    setError(null);
    try {
      const [peso, leche, repro] = await Promise.all([
        canViewFullProductivo ? productivoApi.getRegistrosPeso() : Promise.resolve([] as RegistroPeso[]),
        canViewFullProductivo ? productivoApi.getProduccionLeche() : Promise.resolve([] as ProduccionLeche[]),
        canViewReproductivo ? productivoApi.getEventosReproductivos() : Promise.resolve([] as EventoReproductivo[]),
      ]);
      setRegistrosPeso(peso);
      setRegistrosLeche(leche);
      setEventosRepro(repro);
    } catch (err: unknown) {
      const e = err as { status?: number };
      if (e?.status === 401) { await logout(); return; }
      setError('Error al cargar datos productivos.');
    } finally {
      setLoading(false);
    }
  }, [canView, canViewFullProductivo, canViewReproductivo, logout]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    void loadData();
  }, [loadData]));

  // ── Chart data ─────────────────────────────────────────────────────────────

  const herdWeightPoints = useMemo(() => buildHerdWeightPoints(registrosPeso), [registrosPeso]);
  const milkPoints = useMemo(() => buildMilkPoints(registrosLeche), [registrosLeche]);

  const chartPoints = tab === 'peso' ? herdWeightPoints : tab === 'leche' ? milkPoints : [];
  const chartValues = chartPoints.map(p => p.value);
  const trend = getTrend(chartValues);
  const chartColor = tab === 'peso' ? '#2F9B47' : '#1A8FC0';

  const pesoActual = herdWeightPoints.length > 0
    ? herdWeightPoints[herdWeightPoints.length - 1].value
    : null;
  const totalLecheHoy = milkPoints.length > 0
    ? milkPoints[milkPoints.length - 1].value
    : null;

  // ── Guards ─────────────────────────────────────────────────────────────────

  if (!canView) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.centerBox}>
          <MaterialCommunityIcons name="lock-outline" size={40} color="#A0A8A0" />
          <Text style={styles.centerTitle}>Acceso restringido</Text>
          <Text style={styles.centerText}>Tu rol no tiene permisos para el módulo Productivo.</Text>
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

        {/* ── Header card ── */}
        <View style={styles.headerCard}>
          <View style={styles.headerCardLeft}>
            <MaterialCommunityIcons name="scale-balance" size={20} color="#FFFFFF" />
            <Text style={styles.headerCardLabel}>PRODUCCIÓN</Text>
          </View>
          <Text style={styles.headerCardSub}>Rancho Los Alpes</Text>
        </View>

        {/* ── Summary chips ── */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryChip, { backgroundColor: '#EBF7EE' }]}>
            <MaterialCommunityIcons name="scale" size={16} color="#2A7A43" />
            <Text style={styles.summaryChipLabel}>Peso promedio</Text>
            <Text style={styles.summaryChipValue}>
              {pesoActual !== null ? `${pesoActual} kg` : '—'}
            </Text>
          </View>
          <View style={[styles.summaryChip, { backgroundColor: '#EAF4FB' }]}>
            <MaterialCommunityIcons name="water" size={16} color="#1A6FA0" />
            <Text style={styles.summaryChipLabel}>Leche total</Text>
            <Text style={[styles.summaryChipValue, { color: '#1A5F8A' }]}>
              {totalLecheHoy !== null ? `${totalLecheHoy} L` : '—'}
            </Text>
          </View>
          <View style={[styles.summaryChip, { backgroundColor: '#F8F0FB' }]}>
            <MaterialCommunityIcons name="heart-pulse" size={16} color="#8E44AD" />
            <Text style={styles.summaryChipLabel}>Reprod.</Text>
            <Text style={[styles.summaryChipValue, { color: '#7D3C98' }]}>
              {eventosRepro.length}
            </Text>
          </View>
        </View>

        {/* ── Tabs ── */}
        <View style={styles.tabBar}>
          {visibleTabs.map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={[styles.tabItem, tab === t && styles.tabItemActive]}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'peso' ? '⚖️ Peso' : t === 'leche' ? '🥛 Leche' : '🐄 Reprod.'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── Chart ── */}
        {canViewFullProductivo && (tab === 'peso' || tab === 'leche') && (
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <View>
                <Text style={styles.chartTitle}>
                  {tab === 'peso' ? 'Peso promedio del hato' : 'Producción total de leche'}
                </Text>
                <Text style={styles.chartSub}>
                  {tab === 'peso' ? 'Promedio por fecha · todos los animales' : 'Litros totales por fecha'}
                </Text>
              </View>
              {trend && (
                <Text style={[styles.trendBadge, trend.positive ? styles.trendPos : styles.trendNeg]}>
                  {trend.pct}
                </Text>
              )}
            </View>

            {loading ? (
              <View style={styles.chartLoader}>
                <ActivityIndicator color={chartColor} />
              </View>
            ) : chartPoints.length < 2 ? (
              <View style={styles.chartLoader}>
                <MaterialCommunityIcons name="chart-line" size={32} color="#C8D4C8" />
                <Text style={styles.centerText}>Sin suficientes datos para graficar.</Text>
              </View>
            ) : (
              <View style={{ paddingTop: 8 }}>
                <LineChart
                  data={chartPoints}
                  width={CHART_W}
                  height={130}
                  color={chartColor}
                  thickness={2.5}
                  startFillColor={chartColor}
                  endFillColor={`${chartColor}08`}
                  startOpacity={0.25}
                  endOpacity={0}
                  areaChart
                  curved
                  hideDataPoints={chartPoints.length > 10}
                  dataPointsColor={chartColor}
                  dataPointsRadius={4}
                  xAxisLabelTextStyle={{ color: '#8A9A8A', fontSize: 9 }}
                  yAxisTextStyle={{ color: '#8A9A8A', fontSize: 9 }}
                  yAxisColor="transparent"
                  xAxisColor="#E0E8E0"
                  rulesColor="#F0F4F0"
                  rulesType="solid"
                  hideRules={false}
                  noOfSections={3}
                  initialSpacing={8}
                  endSpacing={8}
                  backgroundColor="transparent"
                  hideYAxisText={false}
                  showVerticalLines={false}
                  pointerConfig={{
                    pointerStripColor: chartColor,
                    pointerStripWidth: 1.5,
                    pointerColor: chartColor,
                    radius: 5,
                    pointerLabelWidth: 80,
                    pointerLabelHeight: 38,
                    activatePointersOnLongPress: true,
                    autoAdjustPointerLabelPosition: true,
                    pointerLabelComponent: (items: { value: number }[]) => (
                      <View style={[styles.pointerLabel, { borderColor: chartColor }]}>
                        <Text style={[styles.pointerValue, { color: chartColor }]}>
                          {items[0]?.value}{tab === 'peso' ? ' kg' : ' L'}
                        </Text>
                      </View>
                    ),
                  }}
                />
              </View>
            )}
          </View>
        )}

        {/* ── FAB ── */}
        {(canCreateFullRegistros || canCreateReproductivo) && (
          <View style={styles.actionsRow}>
            {canCreateFullRegistros && tab === 'peso' && (
              <Pressable
                style={styles.primaryFab}
                onPress={() => router.push('/(app)/productivo/registro-peso' as any)}
              >
                <Feather name="plus" size={16} color="#FFF" />
                <Text style={styles.primaryFabText}>Registrar peso</Text>
              </Pressable>
            )}
            {canCreateFullRegistros && tab === 'leche' && (
              <Pressable
                style={[styles.primaryFab, { backgroundColor: '#1A8FC0' }]}
                onPress={() => router.push('/(app)/productivo/registro-leche' as any)}
              >
                <Feather name="plus" size={16} color="#FFF" />
                <Text style={styles.primaryFabText}>Registrar leche</Text>
              </Pressable>
            )}
            {canCreateReproductivo && tab === 'reproductivo' && (
              <Pressable
                style={[styles.primaryFab, { backgroundColor: '#8E44AD' }]}
                onPress={() => router.push('/(app)/productivo/registro-reproductivo' as any)}
              >
                <Feather name="plus" size={16} color="#FFF" />
                <Text style={styles.primaryFabText}>Registrar evento</Text>
              </Pressable>
            )}
          </View>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* ── Historial list ── */}
        <Text style={styles.listTitle}>
          {canViewFullProductivo ? 'Historial de registros' : 'Historial de eventos reproductivos'}
        </Text>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color="#2F9B47" size="large" />
          </View>
        ) : tab === 'peso' ? (
          <PesoList records={registrosPeso} />
        ) : tab === 'leche' ? (
          <LecheList records={registrosLeche} />
        ) : (
          <ReproductivoList records={eventosRepro} />
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-lists ──────────────────────────────────────────────────────────────────

function PesoList({ records }: { records: RegistroPeso[] }) {
  const sorted = [...records].sort((a, b) => b.fechaRegistro.localeCompare(a.fechaRegistro));
  if (sorted.length === 0) return <EmptyState msg="No hay registros de peso aún." />;

  const asc = [...records]
    .sort((a, b) => a.fechaRegistro.localeCompare(b.fechaRegistro))
    .map(r => toNum(r.peso));

  return (
    <View style={styles.list}>
      {sorted.map((r, idx) => {
        const peso = toNum(r.peso);
        const prevIdx = asc.length - 1 - idx - 1;
        const prev = prevIdx >= 0 ? asc[prevIdx] : null;
        const delta = prev !== null ? peso - prev : null;
        return (
          <View key={r.idRegistroPeso} style={styles.recordCard}>
            <View style={styles.recordLeft}>
              <MaterialCommunityIcons name="scale" size={20} color="#2A7A43" />
              <View>
                <Text style={styles.recordMain}>{peso} kg</Text>
                <Text style={styles.recordSub}>
                  {formatDateLong(r.fechaRegistro)} · {r.animal?.numeroArete ?? `Animal #${r.idAnimal}`}
                </Text>
              </View>
            </View>
            <View style={styles.recordRight}>
              {delta !== null && (
                <Text style={[styles.deltaText, delta >= 0 ? styles.deltaPos : styles.deltaNeg]}>
                  {delta >= 0 ? '+' : ''}{delta.toFixed(1)} kg
                </Text>
              )}
              <View style={[styles.estadoBadge, { backgroundColor: estadoBadgeColor(r.estadoValidacion) }]}>
                <Text style={styles.estadoBadgeText}>{r.estadoValidacion}</Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function LecheList({ records }: { records: ProduccionLeche[] }) {
  const sorted = [...records].sort((a, b) => b.fechaRegistro.localeCompare(a.fechaRegistro));
  if (sorted.length === 0) return <EmptyState msg="No hay registros de leche aún." />;
  return (
    <View style={styles.list}>
      {sorted.map((r) => (
        <View key={r.idProduccion} style={styles.recordCard}>
          <View style={styles.recordLeft}>
            <MaterialCommunityIcons name="water" size={20} color="#1A8FC0" />
            <View>
              <Text style={[styles.recordMain, { color: '#1A5F8A' }]}>{toNum(r.litrosProducidos)} L</Text>
              <Text style={styles.recordSub}>
                {formatDateLong(r.fechaRegistro)} · {r.animal?.numeroArete ?? `Animal #${r.idAnimal}`}
              </Text>
            </View>
          </View>
          <View style={[styles.estadoBadge, { backgroundColor: estadoBadgeColor(r.estadoValidacion) }]}>
            <Text style={styles.estadoBadgeText}>{r.estadoValidacion}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function ReproductivoList({ records }: { records: EventoReproductivo[] }) {
  const sorted = [...records].sort((a, b) => b.fechaEvento.localeCompare(a.fechaEvento));
  if (sorted.length === 0) return <EmptyState msg="No hay eventos reproductivos aún." />;
  return (
    <View style={styles.list}>
      {sorted.map((r) => {
        const iconName = TIPO_ICON[r.tipoEvento] ?? 'circle';
        return (
          <View key={r.idEventoReproductivo} style={styles.recordCard}>
            <View style={styles.recordLeft}>
              <Feather name={iconName as never} size={19} color="#8E44AD" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.recordMain, { color: '#5B2579' }]}>
                  {TIPO_LABELS[r.tipoEvento] ?? r.tipoEvento}
                </Text>
                <Text style={styles.recordSub}>
                  {formatDateLong(r.fechaEvento)} · {r.animal?.numeroArete ?? `Animal #${r.idAnimal}`}
                </Text>
                {r.observaciones ? (
                  <Text style={styles.recordObs} numberOfLines={2}>{r.observaciones}</Text>
                ) : null}
              </View>
            </View>
            <View style={[styles.estadoBadge, { backgroundColor: estadoBadgeColor(r.estadoValidacion) }]}>
              <Text style={styles.estadoBadgeText}>{r.estadoValidacion}</Text>
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
      <MaterialCommunityIcons name="inbox-outline" size={32} color="#B0BAB0" />
      <Text style={styles.emptyTitle}>Sin registros</Text>
      <Text style={styles.emptyText}>{msg}</Text>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F3F0' },
  content: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },

  topBar: {
    minHeight: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, backgroundColor: '#F0F3F0', borderBottomWidth: 1, borderBottomColor: '#DDE3DD',
  },
  iconButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EBEBEB', alignItems: 'center', justifyContent: 'center' },
  logo: { width: 68, height: 36, resizeMode: 'contain' },

  headerCard: {
    backgroundColor: '#1E5F36', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12,
  },
  headerCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerCardLabel: { color: '#FFFFFF', fontWeight: '800', fontSize: 18, letterSpacing: 1 },
  headerCardSub: { color: '#A8D8B8', fontSize: 12, fontWeight: '500' },

  summaryRow: { flexDirection: 'row', gap: 8 },
  summaryChip: { flex: 1, borderRadius: 12, padding: 10, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#E0E8E0' },
  summaryChipLabel: { fontSize: 10, color: '#60726A', fontWeight: '600' },
  summaryChipValue: { fontSize: 15, fontWeight: '800', color: '#1E5F36' },

  tabBar: { flexDirection: 'row', backgroundColor: '#E4EAE4', borderRadius: 12, padding: 4, gap: 4 },
  tabItem: { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center' },
  tabItemActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 12, fontWeight: '600', color: '#5E6E5E' },
  tabTextActive: { color: '#1A3D25', fontWeight: '800' },

  chartCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#DDE3DD', gap: 4, overflow: 'hidden',
  },
  chartHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  chartTitle: { fontSize: 15, fontWeight: '700', color: '#1A2D1A' },
  chartSub: { fontSize: 10, color: '#8A9A8A', marginTop: 2 },
  trendBadge: { fontSize: 12, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  trendPos: { backgroundColor: '#E6F4EA', color: '#1E6F38' },
  trendNeg: { backgroundColor: '#FDECEA', color: '#C0392B' },
  chartLoader: { height: 130, alignItems: 'center', justifyContent: 'center', gap: 8 },

  // Pointer tooltip
  pointerLabel: {
    backgroundColor: '#FFF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
  },
  pointerValue: { fontSize: 12, fontWeight: '800' },

  actionsRow: { flexDirection: 'row', gap: 8 },
  primaryFab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: '#2F9B47', borderRadius: 12, minHeight: 46,
  },
  primaryFabText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },

  listTitle: { fontSize: 14, fontWeight: '700', color: '#2D3D2D', marginTop: 4 },
  list: { gap: 8 },
  recordCard: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#DDE3DD', gap: 10,
  },
  recordLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  recordRight: { alignItems: 'flex-end', gap: 4 },
  recordMain: { fontSize: 15, fontWeight: '800', color: '#1A3D1A' },
  recordSub: { fontSize: 11, color: '#7A8A7A', marginTop: 1 },
  recordObs: { fontSize: 11, color: '#8A7A8A', marginTop: 2, fontStyle: 'italic' },
  deltaText: { fontSize: 12, fontWeight: '700' },
  deltaPos: { color: '#2F9B47' },
  deltaNeg: { color: '#C0392B' },
  estadoBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  estadoBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  emptyCard: {
    backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E0E7E0',
    padding: 24, alignItems: 'center', gap: 8,
  },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: '#3A4A3A' },
  emptyText: { fontSize: 12, color: '#7A8A7A', textAlign: 'center' },
  errorText: { color: '#C0392B', fontSize: 12, fontWeight: '600' },

  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 28 },
  centerTitle: { fontSize: 18, fontWeight: '800', color: '#1A261A', textAlign: 'center' },
  centerText: { fontSize: 13, color: '#667266', textAlign: 'center' },
  backButton: { marginTop: 8, backgroundColor: '#2F9B47', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28 },
  backButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});
