import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/src/features/auth/auth-context';
import {
  canViewReporteComparativo,
  canViewReporteInventario,
  canViewReportePerdidas,
  canViewReporteProductivo,
  canViewReporteSanitario,
  canViewReportes,
} from '@/src/features/auth/role-permissions';
import { downloadAndShareReport } from '@/src/lib/download-service';

import { reportEndpoint, reportesApi, type PeriodoFilters } from '../reportes-api';
import type {
  DownloadFormat,
  ModuloComparativoFechas,
  ReporteComparativoFechas,
  ReporteInventario,
  ReportePerdidas,
  ReportePerdidasComparativo,
  ReporteProductividad,
  ReporteSanitarioHato,
} from '../reportes-types';

type TabKey = 'inventario' | 'sanitario' | 'productividad' | 'comparativo' | 'perdidas';

interface TabConfig {
  key: TabKey;
  label: string;
}

const COLORS = {
  blue: '#2563EB',
  green: '#15803D',
  amber: '#D97706',
  red: '#B91C1C',
  purple: '#6D28D9',
  teal: '#0F766E',
  text: '#142014',
  muted: '#6B756B',
  border: '#DDE4DD',
  panel: '#F5F7F5',
};

const today = new Date();
const todayIso = today.toISOString().slice(0, 10);
const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
};

function formatNumber(value: number | string | null | undefined, digits = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return digits ? `0.${'0'.repeat(digits)}` : '0';
  return numeric.toLocaleString('es-MX', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function isValidPeriod(period: PeriodoFilters) {
  return period.periodoAInicio <= period.periodoAFin && period.periodoBInicio <= period.periodoBFin;
}

function Kpi({ label, value, tone = COLORS.blue }: { label: string; value: string; tone?: string }) {
  return (
    <View style={[styles.kpi, { borderColor: `${tone}55`, backgroundColor: `${tone}12` }]}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiValue, { color: tone }]}>{value}</Text>
    </View>
  );
}

function Field({ label, value, onChangeText, keyboardType = 'default' }: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'numeric';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholderTextColor="#9AA39A"
        style={styles.input}
      />
    </View>
  );
}

function DateRange({ start, end, onStart, onEnd }: {
  start: string;
  end: string;
  onStart: (value: string) => void;
  onEnd: (value: string) => void;
}) {
  return (
    <View style={styles.fieldRow}>
      <Field label="Inicio" value={start} onChangeText={onStart} />
      <Field label="Fin" value={end} onChangeText={onEnd} />
    </View>
  );
}

function PeriodFields({ value, onChange }: {
  value: PeriodoFilters;
  onChange: (next: Partial<PeriodoFilters>) => void;
}) {
  return (
    <View style={styles.periodBox}>
      <Text style={styles.periodTitle}>Periodo 1</Text>
      <DateRange
        start={value.periodoAInicio}
        end={value.periodoAFin}
        onStart={(text) => onChange({ periodoAInicio: text })}
        onEnd={(text) => onChange({ periodoAFin: text })}
      />
      <Text style={styles.periodTitle}>Periodo 2</Text>
      <DateRange
        start={value.periodoBInicio}
        end={value.periodoBFin}
        onStart={(text) => onChange({ periodoBInicio: text })}
        onEnd={(text) => onChange({ periodoBFin: text })}
      />
    </View>
  );
}

function Segmented<T extends string>({ options, value, onChange }: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.segmented}>
      {options.map((option) => (
        <Pressable
          key={option.value}
          onPress={() => onChange(option.value)}
          style={[styles.segment, value === option.value ? styles.segmentActive : null]}
        >
          <Text style={[styles.segmentText, value === option.value ? styles.segmentTextActive : null]}>{option.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function EmptyState({ text = 'Genera el reporte para ver resultados.' }: { text?: string }) {
  return <Text style={styles.emptyText}>{text}</Text>;
}

export function ReportesHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const role = user?.rol;

  const canView = canViewReportes(role);
  const canInventario = canViewReporteInventario(role);
  const canSanitario = canViewReporteSanitario(role);
  const canProductivo = canViewReporteProductivo(role);
  const canComparativo = canViewReporteComparativo(role);
  const canPerdidas = canViewReportePerdidas(role);

  const tabs = useMemo<TabConfig[]>(() => {
    const next: TabConfig[] = [];
    if (canInventario) next.push({ key: 'inventario', label: 'Inventario' });
    if (canSanitario) next.push({ key: 'sanitario', label: 'Sanitario' });
    if (canProductivo) next.push({ key: 'productividad', label: 'Productividad' });
    if (canComparativo) next.push({ key: 'comparativo', label: 'Comparativo' });
    if (canPerdidas) next.push({ key: 'perdidas', label: 'Perdidas' });
    return next;
  }, [canInventario, canSanitario, canProductivo, canComparativo, canPerdidas]);

  const [activeTab, setActiveTab] = useState<TabKey>(tabs[0]?.key || 'inventario');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [downloadKey, setDownloadKey] = useState<string | null>(null);

  const [dateFilters, setDateFilters] = useState({ fechaInicio: daysAgo(30), fechaFin: todayIso });
  const [edadMinima, setEdadMinima] = useState('0');
  const [estadoSanitario, setEstadoSanitario] = useState<'TODOS' | 'SANO' | 'EN_TRATAMIENTO' | 'ENFERMO'>('TODOS');
  const [motivo, setMotivo] = useState('');
  const [comparativoModulo, setComparativoModulo] = useState<ModuloComparativoFechas>('productividad');
  const [periodFilters, setPeriodFilters] = useState<PeriodoFilters>({
    periodoAInicio: daysAgo(60),
    periodoAFin: daysAgo(31),
    periodoBInicio: daysAgo(30),
    periodoBFin: todayIso,
  });

  const [inventario, setInventario] = useState<ReporteInventario | null>(null);
  const [sanitario, setSanitario] = useState<ReporteSanitarioHato | null>(null);
  const [productividad, setProductividad] = useState<ReporteProductividad | null>(null);
  const [comparativo, setComparativo] = useState<ReporteComparativoFechas | ReportePerdidasComparativo | null>(null);
  const [perdidas, setPerdidas] = useState<ReportePerdidas | null>(null);

  const runAction = async (action: () => Promise<void>) => {
    try {
      setBusy(true);
      setMessage(null);
      await action();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible generar el reporte.');
    } finally {
      setBusy(false);
    }
  };

  const download = async (key: string, endpoint: string, format: DownloadFormat) => {
    try {
      setDownloadKey(key);
      await downloadAndShareReport(endpoint, format);
    } catch (error) {
      Alert.alert('Reportes', error instanceof Error ? error.message : 'No fue posible exportar el reporte.');
    } finally {
      setDownloadKey(null);
    }
  };

  const runInventario = () => runAction(async () => {
    setInventario(await reportesApi.getInventario(dateFilters));
  });

  const runSanitario = () => runAction(async () => {
    setSanitario(await reportesApi.getSanitarioHato({
      ...dateFilters,
      estado: estadoSanitario === 'TODOS' ? undefined : estadoSanitario,
    }));
  });

  const runProductividad = () => runAction(async () => {
    setProductividad(await reportesApi.getProductividad({
      ...dateFilters,
      edadMinimaMeses: Number(edadMinima || 0),
    }));
  });

  const runComparativo = () => {
    if (!isValidPeriod(periodFilters)) {
      setMessage('Valida las fechas de ambos periodos.');
      return;
    }
    void runAction(async () => {
      setComparativo(await reportesApi.getComparativoFechas({
        ...periodFilters,
        modulo: comparativoModulo,
        edadMinimaMeses: Number(edadMinima || 0),
      }));
    });
  };

  const runPerdidas = () => runAction(async () => {
    setPerdidas(await reportesApi.getPerdidas({
      ...dateFilters,
      motivo: motivo || undefined,
    }));
  });

  if (!canView) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.centerBox}>
          <Text style={styles.title}>Sin permisos</Text>
          <Text style={styles.emptyText}>Tu rol actual no puede consultar reportes.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => router.replace('/(app)/home')}>
          <Feather name="menu" size={24} color="#1A1A1A" />
        </Pressable>
        <Image source={require('../../../../assets/images/logo-rancho-los-alpes.png')} style={styles.logo} />
        <View style={[styles.iconButton, { opacity: 0 }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Reportes SIGGAB</Text>
        <Text style={styles.subtitle}>Rancho Los Alpes</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {tabs.map((tab) => (
            <Pressable key={tab.key} onPress={() => setActiveTab(tab.key)} style={[styles.tab, activeTab === tab.key ? styles.tabActive : null]}>
              <Text style={[styles.tabText, activeTab === tab.key ? styles.tabTextActive : null]}>{tab.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {message ? <Text style={styles.message}>{message}</Text> : null}

        {activeTab !== 'comparativo' ? (
          <View style={styles.card}>
            <DateRange
              start={dateFilters.fechaInicio}
              end={dateFilters.fechaFin}
              onStart={(value) => setDateFilters((prev) => ({ ...prev, fechaInicio: value }))}
              onEnd={(value) => setDateFilters((prev) => ({ ...prev, fechaFin: value }))}
            />
            {activeTab === 'sanitario' ? (
              <Segmented
                value={estadoSanitario}
                onChange={setEstadoSanitario}
                options={[
                  { label: 'Todos', value: 'TODOS' },
                  { label: 'Sanos', value: 'SANO' },
                  { label: 'Tratamiento', value: 'EN_TRATAMIENTO' },
                  { label: 'Enfermos', value: 'ENFERMO' },
                ]}
              />
            ) : null}
            {activeTab === 'productividad' ? (
              <Field label="Edad minima (meses)" value={edadMinima} onChangeText={setEdadMinima} keyboardType="numeric" />
            ) : null}
            {activeTab === 'perdidas' ? (
              <Segmented
                value={motivo || 'TODOS'}
                onChange={(value) => setMotivo(value === 'TODOS' ? '' : value)}
                options={[
                  { label: 'Todos', value: 'TODOS' },
                  { label: 'Enfermedad', value: 'Enfermedad' },
                  { label: 'Accidente', value: 'Accidente' },
                  { label: 'Venta', value: 'Venta' },
                  { label: 'Muerte', value: 'Muerte' },
                ]}
              />
            ) : null}
            <View style={styles.actions}>
              <Pressable
                style={styles.primaryButton}
                onPress={
                  activeTab === 'inventario' ? runInventario
                    : activeTab === 'sanitario' ? runSanitario
                      : activeTab === 'productividad' ? runProductividad
                        : runPerdidas
                }
                disabled={busy}
              >
                {busy ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>Generar</Text>}
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <Segmented
              value={comparativoModulo}
              onChange={setComparativoModulo}
              options={[
                { label: 'Productivo', value: 'productividad' },
                ...(canPerdidas ? [{ label: 'Sanitario', value: 'sanitario' as const }, { label: 'Perdidas', value: 'perdidas' as const }] : []),
              ]}
            />
            <PeriodFields value={periodFilters} onChange={(next) => setPeriodFilters((prev) => ({ ...prev, ...next }))} />
            {comparativoModulo === 'productividad' ? (
              <Field label="Edad minima (meses)" value={edadMinima} onChangeText={setEdadMinima} keyboardType="numeric" />
            ) : null}
            <Pressable style={styles.primaryButton} onPress={runComparativo} disabled={busy}>
              {busy ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryButtonText}>Generar comparativo</Text>}
            </Pressable>
          </View>
        )}

        {activeTab === 'inventario' ? (
          <View style={styles.card}>
            {inventario ? (
              <>
                <View style={styles.kpiGrid}>
                  <Kpi label="Total" value={formatNumber(inventario.resumen.totalInsumos)} />
                  <Kpi label="Optimos" value={formatNumber(inventario.resumen.optimos)} tone={COLORS.green} />
                  <Kpi label="Bajos" value={formatNumber(inventario.resumen.bajos)} tone={COLORS.amber} />
                  <Kpi label="Criticos" value={formatNumber(inventario.resumen.criticos)} tone={COLORS.red} />
                </View>
                <ReportDownloads
                  busyKey={downloadKey}
                  baseKey="inventario"
                  onPdf={() => download('inventario-pdf', reportEndpoint('/reportes/inventario', dateFilters), 'pdf')}
                />
              </>
            ) : <EmptyState />}
          </View>
        ) : null}

        {activeTab === 'sanitario' ? (
          <View style={styles.card}>
            {sanitario ? (
              <>
                <View style={styles.kpiGrid}>
                  <Kpi label="Total" value={formatNumber(sanitario.resumen.totalEvaluados)} />
                  <Kpi label="Sanos" value={formatNumber(sanitario.resumen.sanos)} tone={COLORS.green} />
                  <Kpi label="Tratamiento" value={formatNumber(sanitario.resumen.enTratamiento)} tone={COLORS.amber} />
                  <Kpi label="Enfermos" value={formatNumber(sanitario.resumen.enfermos)} tone={COLORS.red} />
                </View>
                <ReportDownloads
                  busyKey={downloadKey}
                  baseKey="sanitario"
                  onPdf={() => download('sanitario-pdf', reportEndpoint('/reportes/sanitario-hato', { ...dateFilters, estado: estadoSanitario === 'TODOS' ? undefined : estadoSanitario }), 'pdf')}
                />
              </>
            ) : <EmptyState />}
          </View>
        ) : null}

        {activeTab === 'productividad' ? (
          <View style={styles.card}>
            {productividad ? (
              <>
                <View style={styles.kpiGrid}>
                  <Kpi label="Animales" value={formatNumber(productividad.resumen.totalAnimales)} />
                  <Kpi label="Peso total" value={`${formatNumber(productividad.resumen.pesoTotalKg, 1)} kg`} tone={COLORS.green} />
                  <Kpi label="Promedio" value={`${formatNumber(productividad.resumen.pesoPromedioKg, 1)} kg`} />
                  <Kpi label="GPD" value={`${formatNumber(productividad.resumen.gpdPromedioKgDia, 2)} kg/dia`} tone={COLORS.green} />
                </View>
                <ReportDownloads
                  busyKey={downloadKey}
                  baseKey="productividad"
                  onPdf={() => download('productividad-pdf', reportEndpoint('/reportes/productividad', { ...dateFilters, edadMinimaMeses: Number(edadMinima || 0) }), 'pdf')}
                />
              </>
            ) : <EmptyState />}
          </View>
        ) : null}

        {activeTab === 'comparativo' ? (
          <View style={styles.card}>
            {comparativo ? (
              <>
                <ReportDownloads
                  busyKey={downloadKey}
                  baseKey="comparativo"
                  onPdf={() => download('comparativo-pdf', reportEndpoint('/reportes/comparativo-fechas', { ...periodFilters, modulo: comparativoModulo, edadMinimaMeses: Number(edadMinima || 0) }), 'pdf')}
                />
              </>
            ) : <EmptyState text="Genera el comparativo para ver dos periodos." />}
          </View>
        ) : null}

        {activeTab === 'perdidas' ? (
          <View style={styles.card}>
            {perdidas ? (
              <>
                <View style={styles.kpiGrid}>
                  <Kpi label="Bajas" value={formatNumber(perdidas.resumen.bajasTotales)} tone={COLORS.red} />
                  <Kpi label="Peso perdido" value={`${formatNumber(perdidas.resumen.pesoTotalPerdidoKg, 1)} kg`} tone={COLORS.amber} />
                </View>
                <ReportDownloads
                  busyKey={downloadKey}
                  baseKey="perdidas"
                  onPdf={() => download('perdidas-pdf', reportEndpoint('/reportes/perdidas', { ...dateFilters, motivo: motivo || undefined }), 'pdf')}
                />
              </>
            ) : <EmptyState />}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function ReportDownloads({ busyKey, baseKey, onPdf }: {
  busyKey: string | null;
  baseKey: string;
  onPdf: () => void;
}) {
  return (
    <View style={styles.downloadRow}>
      <Pressable style={styles.secondaryButton} onPress={onPdf} disabled={busyKey !== null}>
        {busyKey === `${baseKey}-pdf` ? <ActivityIndicator color={COLORS.blue} /> : <Text style={styles.secondaryButtonText}>PDF</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EEF2EE' },
  topBar: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E7E1',
  },
  iconButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 86, height: 46, resizeMode: 'contain' },
  content: { padding: 14, paddingBottom: 36, gap: 12 },
  title: { color: COLORS.text, fontSize: 22, fontWeight: '900' },
  subtitle: { color: COLORS.muted, fontSize: 12, fontWeight: '700', marginTop: -8 },
  tabs: { gap: 8, paddingVertical: 4 },
  tab: {
    minHeight: 34,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: { backgroundColor: COLORS.blue, borderColor: COLORS.blue },
  tabText: { color: COLORS.text, fontSize: 12, fontWeight: '800' },
  tabTextActive: { color: '#FFFFFF' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    gap: 12,
  },
  fieldRow: { flexDirection: 'row', gap: 10 },
  field: { flex: 1, gap: 4 },
  fieldLabel: { color: COLORS.muted, fontSize: 11, fontWeight: '800' },
  input: {
    minHeight: 40,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    color: COLORS.text,
    backgroundColor: COLORS.panel,
    fontWeight: '700',
  },
  segmented: { gap: 8, paddingVertical: 2 },
  segment: {
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  segmentText: { color: COLORS.text, fontSize: 11, fontWeight: '800' },
  segmentTextActive: { color: '#FFFFFF' },
  actions: { flexDirection: 'row', gap: 8 },
  primaryButton: {
    minHeight: 42,
    borderRadius: 9,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  secondaryButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#BFD0EA',
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: { color: COLORS.blue, fontSize: 12, fontWeight: '900' },
  downloadRow: { flexDirection: 'row', gap: 8 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kpi: {
    width: '48%',
    minHeight: 66,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    justifyContent: 'center',
  },
  kpiLabel: { color: COLORS.muted, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  kpiValue: { fontSize: 17, fontWeight: '900', marginTop: 2 },
  emptyText: {
    color: COLORS.muted,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    paddingVertical: 18,
  },
  message: {
    color: COLORS.red,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 10,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: '700',
  },
  periodBox: { gap: 8 },
  periodTitle: { color: COLORS.text, fontSize: 12, fontWeight: '900' },
  centerBox: { flex: 1, justifyContent: 'center', padding: 24 },
});
