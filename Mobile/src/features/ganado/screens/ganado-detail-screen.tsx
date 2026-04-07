import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
  canBajaAnimal,
  canEditAnimal,
  canViewAnimalHistorial,
  canViewGanado,
} from '@/src/features/auth/role-permissions';

import { ganadoApi } from '../ganado-api';
import type { Animal, HistorialAnimalResponse } from '../ganado-types';
import { formatEstadoAnimal, getEstadoColor, getGanadoErrorMessage, toInputDate, toNumeric } from '../ganado-utils';

type DetailTab = 'general' | 'produccion' | 'sanidad';

export function GanadoDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const animalId = Number(params.id || 0);

  const { user } = useAuth();
  const canView = useMemo(() => canViewGanado(user?.rol), [user?.rol]);
  const canHistorial = useMemo(() => canViewAnimalHistorial(user?.rol), [user?.rol]);
  const canEdit = useMemo(() => canEditAnimal(user?.rol), [user?.rol]);
  const canBaja = useMemo(() => canBajaAnimal(user?.rol), [user?.rol]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('general');
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [historial, setHistorial] = useState<HistorialAnimalResponse | null>(null);

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }

    if (!Number.isFinite(animalId) || animalId <= 0) {
      setLoading(false);
      setError('Identificador de animal invalido.');
      return;
    }

    let mounted = true;

    void (async () => {
      try {
        const animalData = await ganadoApi.getAnimalById(animalId);
        if (!mounted) return;

        setAnimal(animalData);

        if (canHistorial) {
          const historialData = await ganadoApi.getHistorialByArete(animalData.numeroArete);
          if (!mounted) return;
          setHistorial(historialData);
        }
      } catch (fetchError) {
        if (mounted) setError(getGanadoErrorMessage(fetchError));
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [animalId, canView, canHistorial]);

  if (!canView) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.centerBox}>
          <Text style={styles.centerTitle}>Acceso restringido</Text>
          <Text style={styles.centerText}>Tu rol no puede ver detalle de ganado.</Text>
          <Pressable style={styles.mainButton} onPress={() => router.replace('/(app)/home')}>
            <Text style={styles.mainButtonText}>Volver al inicio</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.centerBox}>
          <ActivityIndicator color="#2F9B47" />
          <Text style={styles.centerText}>Cargando detalle del animal...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !animal) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.centerBox}>
          <Text style={styles.centerTitle}>No fue posible abrir el registro</Text>
          <Text style={styles.centerText}>{error || 'Animal no encontrado.'}</Text>
          <Pressable style={styles.mainButton} onPress={() => router.back()}>
            <Text style={styles.mainButtonText}>Regresar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const pesoUltimo = historial?.historial.productivo.registrosPeso[0];
  const lecheUltima = historial?.historial.productivo.produccionesLeche[0];
  const reproUltimo = historial?.historial.productivo.eventosReproductivos[0];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Pressable style={styles.iconButton} onPress={() => router.back()}>
            <Feather name="menu" size={20} color="#0E0E0E" />
          </Pressable>

          <Image source={require('../../../../assets/images/logo-rancho-los-alpes.png')} style={styles.logo} />

          <Pressable style={styles.iconButton}>
            <Feather name="bell" size={18} color="#0E0E0E" />
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroLabel}>Arete:</Text>
            <Text style={styles.heroArete} numberOfLines={2}>
              {animal.numeroArete}
            </Text>
            <Text style={[styles.heroStatusChip, { color: getEstadoColor(animal.estadoActual) }]}>
              {formatEstadoAnimal(animal.estadoActual)}
            </Text>
          </View>

          <Image source={require('../../../../assets/images/auth-hero-register.jpg')} style={styles.heroAnimal} />
        </View>

        {(canEdit || canBaja) ? (
          <View style={styles.actionsRow}>
            {canEdit ? (
              <Pressable
                style={[styles.actionBtn, animal.estadoActual !== 'ACTIVO' ? styles.actionBtnDisabled : null]}
                disabled={animal.estadoActual !== 'ACTIVO'}
                onPress={() => router.push({
                  pathname: '/(app)/ganado/editar',
                  params: { id: String(animal.idAnimal) },
                })}>
                <Text style={styles.actionBtnText}>Editar</Text>
              </Pressable>
            ) : null}

            {canBaja ? (
              <Pressable
                style={[styles.actionBtnDanger, animal.estadoActual !== 'ACTIVO' ? styles.actionBtnDisabled : null]}
                disabled={animal.estadoActual !== 'ACTIVO'}
                onPress={() => router.push({
                  pathname: '/(app)/ganado/baja',
                  params: { id: String(animal.idAnimal) },
                })}>
                <Text style={styles.actionBtnDangerText}>Dar de baja</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <View style={styles.tabsWrap}>
          <TabButton label="GENERAL" active={activeTab === 'general'} onPress={() => setActiveTab('general')} />
          <TabButton label="PRODUCCION" active={activeTab === 'produccion'} onPress={() => setActiveTab('produccion')} />
          <TabButton label="SANIDAD" active={activeTab === 'sanidad'} onPress={() => setActiveTab('sanidad')} />
        </View>

        {activeTab === 'general' ? (
          <View style={styles.sectionCard}>
            <InfoRow label="Raza" value={animal.raza?.nombreRaza || 'Sin raza'} />
            <InfoRow label="Procedencia" value={animal.procedencia} />
            <InfoRow label="Ingreso" value={toInputDate(animal.fechaIngreso)} />
            <InfoRow label="Peso inicial" value={`${toNumeric(animal.pesoInicial)} kg`} />
            <InfoRow label="Edad estimada" value={`${animal.edadEstimada} meses`} />
            <InfoRow label="Estado" value={formatEstadoAnimal(animal.estadoActual)} statusColor={getEstadoColor(animal.estadoActual)} />
            <InfoRow label="Observaciones" value={animal.estadoSanitarioInicial} multiline />
          </View>
        ) : null}

        {activeTab === 'produccion' ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Últimos registros</Text>

            <RecordCard
              icon={<MaterialCommunityIcons name="weight-kilogram" size={17} color="#3171E0" />}
              title="Peso del animal"
              detail={pesoUltimo ? `${toNumeric(pesoUltimo.peso)} kg` : 'Sin registro'}
              subtitle={pesoUltimo?.fechaRegistro ? `Ultimo: ${toInputDate(pesoUltimo.fechaRegistro)}` : 'Sin fecha'}
              status={pesoUltimo?.estadoValidacion}
            />

            <RecordCard
              icon={<MaterialCommunityIcons name="cup-water" size={17} color="#2E8D48" />}
              title="Litros producidos"
              detail={lecheUltima ? `${toNumeric(lecheUltima.litrosProducidos)} L` : 'Sin registro'}
              subtitle={lecheUltima?.fechaRegistro ? `Ultimo: ${toInputDate(lecheUltima.fechaRegistro)}` : 'Sin fecha'}
              status={lecheUltima?.estadoValidacion}
            />

            <RecordCard
              icon={<MaterialCommunityIcons name="heart-pulse" size={17} color="#D12C2C" />}
              title="Evento reproductivo"
              detail={reproUltimo?.tipoEvento || 'Sin registro'}
              subtitle={reproUltimo?.fechaEvento ? `Ultimo: ${toInputDate(reproUltimo.fechaEvento)}` : 'Sin fecha'}
              status={reproUltimo?.estadoValidacion}
            />

            {/* ── Gráfica de historial de peso individual ── */}
            <WeightHistoryChart
              registros={historial?.historial.productivo.registrosPeso ?? []}
            />
          </View>
        ) : null}

        {activeTab === 'sanidad' ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Resumen sanitario</Text>

            <View style={styles.sanidadActionsRow}>
              <Pressable
                style={styles.sanidadActionBtn}
                onPress={() => router.push({
                  pathname: '/(app)/sanitario',
                  params: { idAnimal: String(animal.idAnimal) },
                })}>
                <Text style={styles.sanidadActionBtnText}>Registrar evento</Text>
              </Pressable>

              <Pressable
                style={styles.sanidadActionBtn}
                onPress={() => router.push({
                  pathname: '/(app)/sanitario/calendario',
                  params: { idAnimal: String(animal.idAnimal) },
                })}>
                <Text style={styles.sanidadActionBtnText}>Calendario</Text>
              </Pressable>
            </View>

            <InfoRow label="Eventos sanitarios" value={String(historial?.historial.resumen.totalEventosSanitarios || 0)} />
            <InfoRow label="Calendario" value={String(historial?.historial.sanitario.calendario.length || 0)} />

            <Text style={styles.smallTitle}>Ultimos eventos</Text>
            {(historial?.historial.sanitario.eventos || []).slice(0, 4).map((item) => (
              <View key={item.idEvento} style={styles.historyItem}>
                <Text style={styles.historyTitle}>{item.tipoEvento?.nombreTipo || 'Evento sanitario'}</Text>
                <Text style={styles.historyText}>{item.diagnostico || 'Sin diagnostico'}</Text>
                <Text style={styles.historyMeta}>{toInputDate(item.fechaEvento)} - {item.estadoAprobacion}</Text>
              </View>
            ))}

            {(historial?.historial.sanitario.eventos || []).length === 0 ? (
              <Text style={styles.centerText}>No hay eventos sanitarios para este arete.</Text>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}


const DETAIL_CHART_W = Dimensions.get('window').width - 88;

function WeightHistoryChart({ registros }: { registros: { peso: number | string; fechaRegistro: string; estadoValidacion: string }[] }) {
  const sorted = [...registros]
    .sort((a, b) => a.fechaRegistro.localeCompare(b.fechaRegistro));

  if (sorted.length < 2) {
    return (
      <View style={chartStyles.emptyWrap}>
        <MaterialCommunityIcons name="chart-line" size={24} color="#C0C8C0" />
        <Text style={chartStyles.emptyText}>Sin suficientes registros para graficar.</Text>
      </View>
    );
  }

  const data = sorted.map((r, i) => {
    const rawDate = r.fechaRegistro;
    const date = new Date(rawDate.includes('T') ? rawDate : rawDate + 'T00:00:00');
    const label = date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
    return {
      value: typeof r.peso === 'string' ? parseFloat(r.peso) : r.peso,
      label: i % Math.max(1, Math.floor(sorted.length / 4)) === 0 ? label : undefined,
    };
  });

  const lastValue = data[data.length - 1].value;
  const firstValue = data[0].value;
  const deltaTotal = lastValue - firstValue;
  const deltaPct = firstValue > 0 ? ((deltaTotal / firstValue) * 100).toFixed(0) : '0';
  const positive = deltaTotal >= 0;

  return (
    <View style={chartStyles.card}>
      <View style={chartStyles.header}>
        <View>
          <Text style={chartStyles.title}>Evolución de peso</Text>
          <Text style={chartStyles.sub}>{sorted.length} medición{sorted.length !== 1 ? 'es' : ''}</Text>
        </View>
        <View style={[chartStyles.badge, positive ? chartStyles.badgePos : chartStyles.badgeNeg]}>
          <Text style={[chartStyles.badgeText, positive ? chartStyles.badgeTextPos : chartStyles.badgeTextNeg]}>
            {positive ? '+' : ''}{deltaPct}%
          </Text>
        </View>
      </View>
      <LineChart
        data={data}
        width={DETAIL_CHART_W}
        height={120}
        color="#2F9B47"
        thickness={2.5}
        startFillColor="#2F9B47"
        endFillColor="#2F9B4708"
        startOpacity={0.22}
        endOpacity={0}
        areaChart
        curved
        hideDataPoints={data.length > 8}
        dataPointsColor="#2F9B47"
        dataPointsRadius={4}
        xAxisLabelTextStyle={{ color: '#8A938A', fontSize: 8 }}
        yAxisTextStyle={{ color: '#8A938A', fontSize: 8 }}
        yAxisColor="transparent"
        xAxisColor="#E0E8E0"
        rulesColor="#F0F4F0"
        noOfSections={3}
        initialSpacing={6}
        endSpacing={6}
        backgroundColor="transparent"
        pointerConfig={{
          pointerStripColor: '#2F9B47',
          pointerStripWidth: 1.5,
          pointerColor: '#2F9B47',
          radius: 5,
          pointerLabelWidth: 72,
          pointerLabelHeight: 36,
          activatePointersOnLongPress: true,
          autoAdjustPointerLabelPosition: true,
          pointerLabelComponent: (items: { value: number }[]) => (
            <View style={chartStyles.tooltip}>
              <Text style={chartStyles.tooltipText}>{items[0]?.value} kg</Text>
            </View>
          ),
        }}
      />
    </View>
  );
}

const chartStyles = StyleSheet.create({
  card: {
    backgroundColor: '#F7FAF7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D4DAD4',
    padding: 12,
    gap: 8,
    overflow: 'hidden',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 13, fontWeight: '700', color: '#1B251B' },
  sub: { fontSize: 10, color: '#8A938A', marginTop: 1 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgePos: { backgroundColor: '#E6F4EA' },
  badgeNeg: { backgroundColor: '#FDECEA' },
  badgeText: { fontSize: 11, fontWeight: '800' },
  badgeTextPos: { color: '#1E6F38' },
  badgeTextNeg: { color: '#C0392B' },
  tooltip: {
    backgroundColor: '#FFF', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: '#2F9B47',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
  },
  tooltipText: { fontSize: 11, fontWeight: '800', color: '#2F9B47' },
  emptyWrap: { alignItems: 'center', gap: 4, paddingVertical: 16 },
  emptyText: { fontSize: 11, color: '#A0A8A0', textAlign: 'center' },
});

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.tabButton, active ? styles.tabButtonActive : null]}>
      <Text style={[styles.tabText, active ? styles.tabTextActive : null]}>{label}</Text>
    </Pressable>
  );
}

function InfoRow({
  label,
  value,
  multiline = false,
  statusColor,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  statusColor?: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, multiline ? styles.infoValueMultiline : null, statusColor ? { color: statusColor } : null]}>
        {value}
      </Text>
    </View>
  );
}

function RecordCard({
  icon,
  title,
  detail,
  subtitle,
  status,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
  subtitle: string;
  status?: string;
}) {
  return (
    <View style={styles.recordCard}>
      <View style={styles.recordHead}>
        <View style={styles.recordTitleWrap}>
          {icon}
          <Text style={styles.recordTitle}>{title}</Text>
        </View>
        <Text style={styles.recordStatus}>{status || 'N/A'}</Text>
      </View>
      <Text style={styles.recordSubtitle}>{subtitle}</Text>
      <Text style={styles.recordDetail}>{detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#ECEEEC',
  },
  content: {
    paddingHorizontal: 12,
    paddingBottom: 28,
    gap: 10,
  },
  topBar: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E3E5E3',
  },
  logo: {
    width: 66,
    height: 36,
    resizeMode: 'contain',
  },
  heroCard: {
    height: 170,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D3D9D3',
    backgroundColor: '#FFFFFF',
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  heroLeft: {
    flex: 1.2,
    borderRadius: 12,
    backgroundColor: '#2F9B47',
    paddingHorizontal: 10,
    paddingVertical: 10,
    justifyContent: 'flex-end',
    gap: 6,
  },
  heroLabel: {
    color: '#F0FBF2',
    fontSize: 16,
    fontWeight: '700',
  },
  heroArete: {
    color: '#FFFFFF',
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '800',
    flexShrink: 1,
  },
  heroStatusChip: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: '800',
  },
  heroAnimal: {
    flex: 0.85,
    height: '100%',
    minWidth: 96,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  tabsWrap: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D4DAD4',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    padding: 4,
    gap: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: 999,
    backgroundColor: '#2F9B47',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  actionBtnDanger: {
    flex: 1,
    minHeight: 40,
    borderRadius: 999,
    backgroundColor: '#B42318',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnDangerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  actionBtnDisabled: {
    opacity: 0.45,
  },
  tabButton: {
    flex: 1,
    minHeight: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#2F9B47',
  },
  tabText: {
    color: '#4F5F4F',
    fontSize: 11,
    fontWeight: '800',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  sectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D4DAD4',
    backgroundColor: '#FFFFFF',
    padding: 10,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1B251B',
  },
  smallTitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '800',
    color: '#2D3B2D',
  },
  infoRow: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DEE3DE',
    backgroundColor: '#F7F8F7',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
  },
  infoLabel: {
    color: '#8A938A',
    fontSize: 11,
    fontWeight: '600',
  },
  infoValue: {
    color: '#182418',
    fontSize: 14,
    fontWeight: '700',
  },
  infoValueMultiline: {
    fontWeight: '600',
    lineHeight: 18,
  },
  recordCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DEE3DE',
    backgroundColor: '#F8FAF8',
    padding: 10,
    gap: 4,
  },
  recordHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recordTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recordTitle: {
    color: '#1E2A1E',
    fontWeight: '700',
    fontSize: 13,
  },
  recordStatus: {
    color: '#6D7C6D',
    fontSize: 10,
    fontWeight: '700',
  },
  recordSubtitle: {
    color: '#859285',
    fontSize: 11,
  },
  recordDetail: {
    color: '#2A392C',
    fontSize: 14,
    fontWeight: '700',
  },
  historyItem: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DEE3DE',
    backgroundColor: '#F8FAF8',
    padding: 10,
    gap: 2,
  },
  historyTitle: {
    color: '#1E2A1E',
    fontWeight: '700',
    fontSize: 13,
  },
  historyText: {
    color: '#4B5E4C',
    fontSize: 12,
  },
  historyMeta: {
    color: '#849385',
    fontSize: 10,
    fontWeight: '700',
  },
  sanidadActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sanidadActionBtn: {
    flex: 1,
    minHeight: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CDE4D2',
    backgroundColor: '#F2FBF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sanidadActionBtnText: {
    color: '#157347',
    fontSize: 12,
    fontWeight: '700',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  centerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A261B',
    textAlign: 'center',
  },
  centerText: {
    color: '#667266',
    textAlign: 'center',
  },
  mainButton: {
    minHeight: 46,
    minWidth: 180,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#2F9B47',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

