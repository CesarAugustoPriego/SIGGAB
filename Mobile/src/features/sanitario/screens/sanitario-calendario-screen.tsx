import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
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
  canCompleteCalendarioSanitario,
  canCreateCalendarioSanitario,
  canViewCalendarioSanitario,
} from '@/src/features/auth/role-permissions';
import { ganadoApi } from '@/src/features/ganado/ganado-api';
import type { Animal } from '@/src/features/ganado/ganado-types';

import { sanitarioApi } from '../sanitario-api';
import type { CalendarioSanitario, EstadoCalendario, TipoEventoSanitario } from '../sanitario-types';
import {
  EMPTY_PROGRAMACION_FORM,
  buildMonthGrid,
  formatDate,
  formatEstadoCalendario,
  getEstadoCalendarioColor,
  getSanitarioErrorMessage,
  groupCalendarioByDate,
  monthTitle,
  toInputDate,
  validateProgramacionForm,
  type ProgramacionFormErrors,
  type ProgramacionFormState,
} from '../sanitario-utils';

type ViewMode = 'CALENDARIO' | 'LISTA';

export function SanitarioCalendarioScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ idAnimal?: string }>();
  const { user } = useAuth();

  const idAnimalParam = Number(params.idAnimal || 0);
  const today = new Date().toISOString().slice(0, 10);

  const canView = useMemo(() => canViewCalendarioSanitario(user?.rol), [user?.rol]);
  const canCreate = useMemo(() => canCreateCalendarioSanitario(user?.rol), [user?.rol]);
  const canComplete = useMemo(() => canCompleteCalendarioSanitario(user?.rol), [user?.rol]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingProgramacion, setSavingProgramacion] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('CALENDARIO');
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(today);
  const [calendario, setCalendario] = useState<CalendarioSanitario[]>([]);
  const [alertas, setAlertas] = useState<CalendarioSanitario[]>([]);
  const [tipos, setTipos] = useState<TipoEventoSanitario[]>([]);
  const [animales, setAnimales] = useState<Animal[]>([]);
  const [selectedCalendario, setSelectedCalendario] = useState<CalendarioSanitario | null>(null);
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [editingCalendarioId, setEditingCalendarioId] = useState<number | null>(null);
  const [programForm, setProgramForm] = useState<ProgramacionFormState>(() => ({
    ...EMPTY_PROGRAMACION_FORM,
    idAnimal: idAnimalParam > 0 ? String(idAnimalParam) : '',
  }));
  const [programErrors, setProgramErrors] = useState<ProgramacionFormErrors>({});

  const loadData = useCallback(async () => {
    if (!canView) {
      setLoading(false);
      return;
    }

    setMessage(null);

    try {
      const [calendarioData, alertasData, tiposData, animalesData] = await Promise.all([
        sanitarioApi.getCalendario(idAnimalParam > 0 ? { idAnimal: idAnimalParam } : {}),
        sanitarioApi.getAlertas(30),
        sanitarioApi.getTiposEvento(),
        canCreate ? ganadoApi.getAnimales({ estadoActual: 'ACTIVO' }) : Promise.resolve([] as Animal[]),
      ]);

      setCalendario(calendarioData);
      setAlertas(alertasData);
      setTipos(tiposData);
      setAnimales(animalesData);

      if (idAnimalParam > 0) {
        setProgramForm((prev) => ({ ...prev, idAnimal: String(idAnimalParam) }));
      }
    } catch (error) {
      setMessage(getSanitarioErrorMessage(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [canView, canCreate, idAnimalParam]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadData();
    }, [loadData])
  );

  const calendarCells = useMemo(() => buildMonthGrid(monthCursor), [monthCursor]);
  const groupedByDate = useMemo(() => groupCalendarioByDate(calendario), [calendario]);
  const eventosDelDia = groupedByDate.get(selectedDate) || [];

  const animalSelected = useMemo(
    () => animales.find((item) => item.idAnimal === Number(programForm.idAnimal)),
    [animales, programForm.idAnimal]
  );
  const tipoSelected = useMemo(
    () => tipos.find((item) => item.idTipoEvento === Number(programForm.idTipoEvento)),
    [tipos, programForm.idTipoEvento]
  );

  const onRefresh = () => {
    setRefreshing(true);
    void loadData();
  };

  const changeMonth = (delta: -1 | 1) => {
    setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const onCloseProgramModal = () => {
    if (savingProgramacion) return;
    setEditingCalendarioId(null);
    setShowProgramModal(false);
  };

  const onStartEditCalendario = (item: CalendarioSanitario) => {
    setSelectedCalendario(null);
    setEditingCalendarioId(item.idCalendario);
    setProgramForm({
      idAnimal: String(item.idAnimal),
      idTipoEvento: String(item.idTipoEvento),
      fechaProgramada: toInputDate(item.fechaProgramada),
      fechaAlerta: toInputDate(item.fechaAlerta),
    });
    setProgramErrors({});
    setShowProgramModal(true);
  };

  const onSaveProgramacion = async () => {
    const validation = validateProgramacionForm(programForm);
    setProgramErrors(validation);

    if (Object.keys(validation).length > 0) return;

    setSavingProgramacion(true);
    setMessage(null);

    try {
      if (editingCalendarioId) {
        await sanitarioApi.updateCalendario(editingCalendarioId, {
          idTipoEvento: Number(programForm.idTipoEvento),
          fechaProgramada: programForm.fechaProgramada,
          fechaAlerta: programForm.fechaAlerta.trim() ? programForm.fechaAlerta : null,
        });
      } else {
        await sanitarioApi.createCalendario({
          idAnimal: Number(programForm.idAnimal),
          idTipoEvento: Number(programForm.idTipoEvento),
          fechaProgramada: programForm.fechaProgramada,
          fechaAlerta: programForm.fechaAlerta || undefined,
        });
      }

      setShowProgramModal(false);
      setEditingCalendarioId(null);
      setProgramForm((prev) => ({
        ...EMPTY_PROGRAMACION_FORM,
        idAnimal: idAnimalParam > 0 ? String(idAnimalParam) : prev.idAnimal,
      }));
      await loadData();
      setMessage(editingCalendarioId
        ? 'Programacion actualizada correctamente.'
        : 'Evento programado correctamente en calendario sanitario.');
    } catch (error) {
      setMessage(getSanitarioErrorMessage(error));
    } finally {
      setSavingProgramacion(false);
    }
  };

  const onSetEstadoCalendario = async (
    item: CalendarioSanitario,
    estado: Exclude<EstadoCalendario, 'PENDIENTE'>
  ) => {
    try {
      await sanitarioApi.completarCalendario(item.idCalendario, { estado });
      setSelectedCalendario(null);
      await loadData();
      setMessage(`Evento ${estado.toLowerCase()} exitosamente.`);
    } catch (error) {
      setMessage(getSanitarioErrorMessage(error));
    }
  };

  const openAnimalSelector = () => {
    if (animales.length === 0) return;

    const options: { text: string; onPress?: () => void; style?: 'cancel' }[] = animales.slice(0, 12).map((item) => ({
      text: `${item.numeroArete}`,
      onPress: () => setProgramForm((prev) => ({ ...prev, idAnimal: String(item.idAnimal) })),
    }));

    options.push({ text: 'Cancelar', style: 'cancel' });
    Alert.alert('Seleccionar arete', 'Elige el animal para el evento', options);
  };

  const openTipoSelector = () => {
    if (tipos.length === 0) return;

    const options: { text: string; onPress?: () => void; style?: 'cancel' }[] = tipos.slice(0, 10).map((item) => ({
      text: item.nombreTipo,
      onPress: () => setProgramForm((prev) => ({ ...prev, idTipoEvento: String(item.idTipoEvento) })),
    }));

    options.push({ text: 'Cancelar', style: 'cancel' });
    Alert.alert('Evento sanitario', 'Selecciona un tipo de evento', options);
  };

  if (!canView) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.centerBox}>
          <Text style={styles.centerTitle}>Acceso restringido</Text>
          <Text style={styles.centerText}>Tu rol no tiene permisos para calendario sanitario.</Text>
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
          <Text style={styles.centerText}>Cargando calendario sanitario...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Pressable style={styles.iconButton} onPress={() => router.back()}>
            <Feather name="chevron-left" size={22} color="#131913" />
          </Pressable>

          <Image source={require('../../../../assets/images/logo-rancho-los-alpes.png')} style={styles.logo} />

          <Pressable style={styles.iconButton} onPress={onRefresh}>
            {refreshing
              ? <ActivityIndicator color="#2F9B47" />
              : <Feather name="refresh-cw" size={16} color="#131913" />}
          </Pressable>
        </View>

        <View style={styles.headlineCard}>
          <View style={styles.headlineText}>
            <Text style={styles.headlineTitle}>Calendario Sanitario</Text>
            <Text style={styles.headlineSubtitle}>Programacion y alertas preventivas</Text>
          </View>
          <MaterialCommunityIcons name="calendar-month" size={30} color="#89D79E" />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchTabs}>
            <Pressable
              onPress={() => setViewMode('CALENDARIO')}
              style={[styles.switchTab, viewMode === 'CALENDARIO' ? styles.switchTabActive : null]}>
              <Text style={[styles.switchTabText, viewMode === 'CALENDARIO' ? styles.switchTabTextActive : null]}>
                Calendario
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setViewMode('LISTA')}
              style={[styles.switchTab, viewMode === 'LISTA' ? styles.switchTabActive : null]}>
              <Text style={[styles.switchTabText, viewMode === 'LISTA' ? styles.switchTabTextActive : null]}>
                Lista
              </Text>
            </Pressable>
          </View>

          <View style={styles.monthNav}>
            <Pressable onPress={() => changeMonth(-1)} style={styles.monthArrow}>
              <Feather name="chevron-left" size={15} color="#2D7D43" />
            </Pressable>
            <Text style={styles.monthLabel}>{monthTitle(monthCursor)}</Text>
            <Pressable onPress={() => changeMonth(1)} style={styles.monthArrow}>
              <Feather name="chevron-right" size={15} color="#2D7D43" />
            </Pressable>
          </View>
        </View>

        {message ? <Text style={styles.messageText}>{message}</Text> : null}

        {viewMode === 'CALENDARIO' ? (
          <View style={styles.sectionCard}>
            <View style={styles.weekHeader}>
              {['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'].map((dayName) => (
                <Text key={dayName} style={styles.weekHeaderText}>{dayName}</Text>
              ))}
            </View>

            <View style={styles.grid}>
              {calendarCells.map((cell) => {
                const hasEventos = (groupedByDate.get(cell.isoDate)?.length || 0) > 0;
                const isSelected = selectedDate === cell.isoDate;
                return (
                  <Pressable
                    key={cell.isoDate}
                    onPress={() => setSelectedDate(cell.isoDate)}
                    style={[
                      styles.dayCell,
                      !cell.inCurrentMonth ? styles.dayCellMuted : null,
                      isSelected ? styles.dayCellSelected : null,
                    ]}>
                    <Text style={[
                      styles.dayText,
                      !cell.inCurrentMonth ? styles.dayTextMuted : null,
                      isSelected ? styles.dayTextSelected : null,
                    ]}>
                      {cell.day}
                    </Text>
                    {hasEventos ? <View style={styles.dayDot} /> : null}
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.subtitle}>Eventos para {formatDate(selectedDate)}</Text>

            {eventosDelDia.map((item) => (
              <Pressable
                key={item.idCalendario}
                onPress={() => setSelectedCalendario(item)}
                style={styles.eventRow}>
                <View style={styles.eventRowLeft}>
                  <View style={styles.bullet} />
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle}>
                      {item.animal?.numeroArete ? `Arete #${item.animal.numeroArete}` : `Evento #${item.idCalendario}`}
                    </Text>
                    <Text style={styles.eventSub}>{item.tipoEvento?.nombreTipo || 'Evento sanitario'}</Text>
                  </View>
                </View>
                <View style={styles.eventRowRight}>
                  <Text style={[styles.estadoTag, { color: getEstadoCalendarioColor(item.estado) }]}>
                    {formatEstadoCalendario(item.estado)}
                  </Text>
                  <Feather name="chevron-right" size={16} color="#8A918A" />
                </View>
              </Pressable>
            ))}

            {eventosDelDia.length === 0 ? (
              <Text style={styles.emptyText}>No hay eventos programados para esta fecha.</Text>
            ) : null}

          </View>
        ) : null}

        {viewMode === 'LISTA' ? (
          <View style={styles.sectionCard}>
            {calendario.map((item) => (
              <Pressable
                key={item.idCalendario}
                onPress={() => setSelectedCalendario(item)}
                style={styles.eventRow}>
                <View style={styles.eventRowLeft}>
                  <View style={styles.bullet} />
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle}>{item.tipoEvento?.nombreTipo || 'Evento sanitario'}</Text>
                    <Text style={styles.eventSub}>{formatDate(item.fechaProgramada)}</Text>
                  </View>
                </View>
                <View style={styles.eventRowRight}>
                  <Text style={[styles.estadoTag, { color: getEstadoCalendarioColor(item.estado) }]}>
                    {formatEstadoCalendario(item.estado)}
                  </Text>
                  <Feather name="chevron-right" size={16} color="#8A918A" />
                </View>
              </Pressable>
            ))}

            {calendario.length === 0 ? (
              <Text style={styles.emptyText}>No hay eventos sanitarios programados.</Text>
            ) : null}

            {alertas.length > 0 ? (
              <View style={styles.alertasWrap}>
                <Text style={styles.alertasTitle}>Alertas proximas</Text>
                {alertas.slice(0, 4).map((item) => (
                  <Text key={item.idCalendario} style={styles.alertaItem}>
                    {item.tipoEvento?.nombreTipo || 'Evento'} - {item.animal?.numeroArete || `#${item.idAnimal}`}
                  </Text>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      <Modal transparent visible={selectedCalendario !== null} animationType="fade" onRequestClose={() => setSelectedCalendario(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Pressable style={styles.modalClose} onPress={() => setSelectedCalendario(null)}>
              <Feather name="x" size={18} color="#7A7A7A" />
            </Pressable>

            {selectedCalendario ? (
              <>
                <Text style={styles.modalTitle}>{selectedCalendario.tipoEvento?.nombreTipo || 'Evento sanitario'}</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedCalendario.animal?.numeroArete ? `Arete ${selectedCalendario.animal.numeroArete}` : `Evento #${selectedCalendario.idCalendario}`}
                </Text>

                <InfoRow label="Programado" value={formatDate(selectedCalendario.fechaProgramada)} />
                <InfoRow label="Alerta" value={formatDate(selectedCalendario.fechaAlerta)} />
                <InfoRow label="Programo" value={selectedCalendario.programador?.nombreCompleto || `Usuario #${selectedCalendario.programadoPor}`} />
                <InfoRow label="Estado" value={formatEstadoCalendario(selectedCalendario.estado)} />

                {canComplete && selectedCalendario.estado === 'PENDIENTE' ? (
                  <View style={styles.modalActions}>
                    {canCreate ? (
                      <Pressable
                        style={styles.secondaryButton}
                        onPress={() => onStartEditCalendario(selectedCalendario)}>
                        <Text style={styles.secondaryButtonText}>Editar programacion</Text>
                      </Pressable>
                    ) : null}
                    <Pressable style={styles.mainButton} onPress={() => onSetEstadoCalendario(selectedCalendario, 'COMPLETADO')}>
                      <Text style={styles.mainButtonText}>Marcar como completado</Text>
                    </Pressable>
                    <Pressable style={styles.dangerButton} onPress={() => onSetEstadoCalendario(selectedCalendario, 'CANCELADO')}>
                      <Text style={styles.dangerButtonText}>Cancelar evento</Text>
                    </Pressable>
                  </View>
                ) : null}
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      <Modal transparent visible={showProgramModal} animationType="fade" onRequestClose={onCloseProgramModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Pressable style={styles.modalClose} onPress={onCloseProgramModal}>
              <Feather name="x" size={18} color="#7A7A7A" />
            </Pressable>

            <Text style={styles.modalTitle}>
              {editingCalendarioId ? 'Editar Programacion' : 'Programacion sanitaria'}
            </Text>

            <Text style={styles.formLabel}>Animal</Text>
            <Pressable
              style={[styles.selectorInput, editingCalendarioId ? styles.selectorInputDisabled : null]}
              onPress={openAnimalSelector}
              disabled={Boolean(editingCalendarioId)}>
              <Text style={styles.selectorText}>
                {animalSelected?.numeroArete || 'Seleccionar arete'}
              </Text>
              <Feather name="chevron-down" size={16} color="#6A746A" />
            </Pressable>
            {programErrors.idAnimal ? <Text style={styles.errorText}>{programErrors.idAnimal}</Text> : null}

            <Text style={styles.formLabel}>Evento sanitario</Text>
            <Pressable style={styles.selectorInput} onPress={openTipoSelector}>
              <Text style={styles.selectorText}>
                {tipoSelected?.nombreTipo || 'Seleccionar tipo de evento'}
              </Text>
              <Feather name="chevron-down" size={16} color="#6A746A" />
            </Pressable>
            {programErrors.idTipoEvento ? <Text style={styles.errorText}>{programErrors.idTipoEvento}</Text> : null}

            <View style={styles.row2}>
              <View style={styles.col}>
                <Text style={styles.formLabel}>Fecha programada</Text>
                <TextInput
                  style={styles.input}
                  value={programForm.fechaProgramada}
                  onChangeText={(value) => setProgramForm((prev) => ({ ...prev, fechaProgramada: value }))}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#8A938A"
                />
                {programErrors.fechaProgramada ? <Text style={styles.errorText}>{programErrors.fechaProgramada}</Text> : null}
              </View>
              <View style={styles.col}>
                <Text style={styles.formLabel}>Fecha alerta</Text>
                <TextInput
                  style={styles.input}
                  value={programForm.fechaAlerta}
                  onChangeText={(value) => setProgramForm((prev) => ({ ...prev, fechaAlerta: value }))}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#8A938A"
                />
                {programErrors.fechaAlerta ? <Text style={styles.errorText}>{programErrors.fechaAlerta}</Text> : null}
              </View>
            </View>

            <Pressable
              style={[styles.mainButton, savingProgramacion ? styles.buttonDisabled : null]}
              disabled={savingProgramacion}
              onPress={onSaveProgramacion}>
              {savingProgramacion
                ? <ActivityIndicator color="#FFFFFF" />
                : <Text style={styles.mainButtonText}>
                    {editingCalendarioId ? 'Guardar cambios' : 'Guardar programacion'}
                  </Text>}
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
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
    paddingBottom: 24,
    gap: 10,
  },
  topBar: {
    minHeight: 54,
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
    width: 68,
    height: 36,
    resizeMode: 'contain',
  },
  headlineCard: {
    borderRadius: 14,
    backgroundColor: '#269A41',
    minHeight: 74,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#22843A',
  },
  headlineText: {
    gap: 2,
    flex: 1,
  },
  headlineTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 29,
    fontWeight: '800',
  },
  headlineSubtitle: {
    color: '#E7FAEB',
    fontSize: 13,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  switchTabs: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F3',
    borderWidth: 1,
    borderColor: '#D7DDD7',
    borderRadius: 8,
    padding: 3,
    gap: 4,
  },
  switchTab: {
    minWidth: 86,
    minHeight: 25,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  switchTabActive: {
    backgroundColor: '#44C65C',
  },
  switchTabText: {
    color: '#4F5D50',
    fontSize: 11,
    fontWeight: '700',
  },
  switchTabTextActive: {
    color: '#FFFFFF',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  monthArrow: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF5EC',
    borderWidth: 1,
    borderColor: '#D2E4D5',
  },
  monthLabel: {
    color: '#283428',
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  messageText: {
    color: '#5E6A5E',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D4DAD4',
    backgroundColor: '#FFFFFF',
    padding: 10,
    gap: 8,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  weekHeaderText: {
    width: '14%',
    textAlign: 'center',
    color: '#788478',
    fontSize: 10,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D9DFD9',
    overflow: 'hidden',
    backgroundColor: '#FBFCFB',
  },
  dayCell: {
    width: '14.2857%',
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#E3E7E3',
    gap: 3,
  },
  dayCellMuted: {
    backgroundColor: '#F4F6F4',
  },
  dayCellSelected: {
    backgroundColor: '#2FA448',
  },
  dayText: {
    color: '#263026',
    fontSize: 12,
    fontWeight: '700',
  },
  dayTextMuted: {
    color: '#A1AAA1',
  },
  dayTextSelected: {
    color: '#FFFFFF',
  },
  dayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#2FA448',
  },
  subtitle: {
    color: '#253025',
    fontSize: 13,
    fontWeight: '800',
  },
  eventRow: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D2D8D2',
    backgroundColor: '#F8F9F8',
    minHeight: 58,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  eventRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  bullet: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#49A7FF',
  },
  eventInfo: {
    flex: 1,
    gap: 1,
  },
  eventTitle: {
    color: '#1D261D',
    fontSize: 13,
    fontWeight: '700',
  },
  eventSub: {
    color: '#768276',
    fontSize: 11,
  },
  eventRowRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  estadoTag: {
    fontSize: 10,
    fontWeight: '800',
  },
  emptyText: {
    color: '#667266',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  alertasWrap: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E4D6A4',
    backgroundColor: '#FBF6DD',
    padding: 10,
    gap: 4,
    marginTop: 2,
  },
  alertasTitle: {
    color: '#665821',
    fontSize: 12,
    fontWeight: '800',
  },
  alertaItem: {
    color: '#7A6A29',
    fontSize: 11,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  centerTitle: {
    color: '#1A261B',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  centerText: {
    color: '#667266',
    textAlign: 'center',
  },
  mainButton: {
    minHeight: 42,
    borderRadius: 999,
    backgroundColor: '#39A94E',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  mainButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  dangerButton: {
    minHeight: 40,
    borderRadius: 999,
    backgroundColor: '#B42318',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    marginTop: 8,
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryButton: {
    minHeight: 40,
    borderRadius: 999,
    backgroundColor: '#EAF5EC',
    borderWidth: 1,
    borderColor: '#C8E1CE',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  secondaryButtonText: {
    color: '#1E7A36',
    fontSize: 13,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  modalCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D5DBD5',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  modalClose: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F3',
    borderWidth: 1,
    borderColor: '#E1E4E1',
    zIndex: 2,
  },
  modalTitle: {
    marginTop: 4,
    color: '#141B14',
    fontSize: 26,
    lineHeight: 27,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: '#566456',
    fontSize: 12,
    fontWeight: '600',
  },
  infoRow: {
    minHeight: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DFE4DF',
    backgroundColor: '#F8F9F8',
    paddingHorizontal: 9,
    justifyContent: 'center',
    gap: 1,
  },
  infoLabel: {
    color: '#778377',
    fontSize: 10,
    fontWeight: '700',
  },
  infoValue: {
    color: '#202920',
    fontSize: 13,
    fontWeight: '700',
  },
  modalActions: {
    marginTop: 4,
  },
  formLabel: {
    color: '#2A342A',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  selectorInput: {
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D4DAD4',
    backgroundColor: '#F7F9F7',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  selectorInputDisabled: {
    opacity: 0.7,
  },
  selectorText: {
    color: '#253025',
    fontSize: 13,
    flex: 1,
  },
  row2: {
    flexDirection: 'row',
    gap: 8,
  },
  col: {
    flex: 1,
    gap: 4,
  },
  input: {
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D4DAD4',
    backgroundColor: '#F7F9F7',
    paddingHorizontal: 10,
    color: '#253025',
    fontSize: 13,
  },
  errorText: {
    color: '#B42318',
    fontSize: 12,
    fontWeight: '600',
  },
});
