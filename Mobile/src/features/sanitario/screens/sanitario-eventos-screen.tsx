import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
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
  canApproveSanitarioEvento,
  canCreateCalendarioSanitario,
  canCreateSanitarioEvento,
  canEditSanitarioEvento,
  canViewSanitarioRecords,
} from '@/src/features/auth/role-permissions';
import { ganadoApi } from '@/src/features/ganado/ganado-api';
import type { Animal } from '@/src/features/ganado/ganado-types';

import { sanitarioApi } from '../sanitario-api';
import type {
  EstadoRegistro,
  EventoSanitario,
  SanitarioCategoria,
  TipoEventoSanitario,
} from '../sanitario-types';
import {
  EMPTY_EVENTO_FORM,
  findTipoForCategoria,
  formatDate,
  formatEstadoRegistro,
  getCategoriaFieldLabels,
  getCategoriaLabel,
  getEstadoRegistroColor,
  getSanitarioErrorMessage,
  resolveCategoriaFromTipoName,
  toEventoFormState,
  toEventoPayload,
  validateEventoForm,
  type EventoFormErrors,
  type EventoFormState,
} from '../sanitario-utils';

type ScreenTab = 'registro' | 'historial';

export function SanitarioEventosScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ idAnimal?: string; idEvento?: string }>();
  const { user } = useAuth();

  const idAnimal = Number(params.idAnimal || 0);
  const idEventoParam = Number(params.idEvento || 0);

  const canViewRecords = useMemo(() => canViewSanitarioRecords(user?.rol), [user?.rol]);
  const canCreateEvento = useMemo(() => canCreateSanitarioEvento(user?.rol), [user?.rol]);
  const canEditEvento = useMemo(() => canEditSanitarioEvento(user?.rol), [user?.rol]);
  const canApproveEvento = useMemo(() => canApproveSanitarioEvento(user?.rol), [user?.rol]);
  const canCreateCalendario = useMemo(() => canCreateCalendarioSanitario(user?.rol), [user?.rol]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [eventos, setEventos] = useState<EventoSanitario[]>([]);
  const [tipos, setTipos] = useState<TipoEventoSanitario[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState<SanitarioCategoria>('VACUNA');
  const [activeTab, setActiveTab] = useState<ScreenTab>('registro');
  const [editingEventId, setEditingEventId] = useState<number>(idEventoParam > 0 ? idEventoParam : 0);
  const [form, setForm] = useState<EventoFormState>(EMPTY_EVENTO_FORM);
  const [errors, setErrors] = useState<EventoFormErrors>({});

  const labels = useMemo(() => getCategoriaFieldLabels(selectedCategoria), [selectedCategoria]);
  const isReadOnlyMode = !canCreateEvento && !canEditEvento;
  const tiposCategoria = useMemo(
    () => tipos.filter((tipo) => resolveCategoriaFromTipoName(tipo.nombreTipo) === selectedCategoria),
    [tipos, selectedCategoria]
  );
  const selectedTipo = useMemo(
    () => tipos.find((tipo) => tipo.idTipoEvento === Number(form.idTipoEvento)) || null,
    [tipos, form.idTipoEvento]
  );

  const syncTipoForCategoria = useCallback((nextCategoria: SanitarioCategoria, options?: { force?: boolean }) => {
    const tipoMatch = findTipoForCategoria(tipos, nextCategoria);
    if (!tipoMatch) return;

    setForm((prev) => {
      if (!options?.force && prev.idTipoEvento && Number(prev.idTipoEvento) > 0) {
        return prev;
      }
      return {
        ...prev,
        idTipoEvento: String(tipoMatch.idTipoEvento),
      };
    });
  }, [tipos]);

  const applyEventoToEditor = useCallback((evento: EventoSanitario) => {
    const categoria = resolveCategoriaFromTipoName(evento.tipoEvento?.nombreTipo);
    setSelectedCategoria(categoria);
    setEditingEventId(evento.idEvento);
    setForm(toEventoFormState(evento));
    setErrors({});
    setActiveTab('registro');
  }, []);

  const loadData = useCallback(async () => {
    if (!idAnimal || idAnimal <= 0) {
      setLoading(false);
      setMessage('Debes abrir sanidad desde el detalle de un animal.');
      return;
    }

    setMessage(null);

    try {
      const [animalData, tiposData] = await Promise.all([
        ganadoApi.getAnimalById(idAnimal),
        sanitarioApi.getTiposEvento(),
      ]);

      setAnimal(animalData);
      setTipos(tiposData);

      if (canViewRecords) {
        const eventosData = await sanitarioApi.getEventos({ idAnimal });
        setEventos(eventosData);
      } else {
        setEventos([]);
      }

      if (idEventoParam > 0 && canEditEvento) {
        const eventoData = await sanitarioApi.getEventoById(idEventoParam);
        applyEventoToEditor(eventoData);
      } else {
        const tipoBase = findTipoForCategoria(tiposData, selectedCategoria) || tiposData[0];
        if (tipoBase) {
          setForm((prev) => ({ ...prev, idTipoEvento: String(tipoBase.idTipoEvento) }));
        }
      }
    } catch (error) {
      setMessage(getSanitarioErrorMessage(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [
    idAnimal,
    canViewRecords,
    canEditEvento,
    idEventoParam,
    applyEventoToEditor,
    selectedCategoria,
  ]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadData();
    }, [loadData])
  );

  useEffect(() => {
    syncTipoForCategoria(selectedCategoria);
  }, [selectedCategoria, syncTipoForCategoria]);

  const resumen = useMemo(() => {
    const aprobados = eventos.filter((item) => item.estadoAprobacion === 'APROBADO').length;
    const pendientes = eventos.filter((item) => item.estadoAprobacion === 'PENDIENTE').length;
    const rechazados = eventos.filter((item) => item.estadoAprobacion === 'RECHAZADO').length;
    const ultimo = eventos[0] || null;

    let estadoGeneral = 'Sano';
    if (rechazados > 0) estadoGeneral = 'Con incidencias';
    else if (pendientes > 0) estadoGeneral = 'En revision';

    return {
      aprobados,
      pendientes,
      rechazados,
      estadoGeneral,
      ultimo,
    };
  }, [eventos]);

  const resetFormForCategory = (categoria: SanitarioCategoria) => {
    setSelectedCategoria(categoria);
    setErrors({});
    setForm((prev) => ({
      ...prev,
      campoPrincipal: '',
      campoSecundario: '',
      campoTerciario: '',
      fechaAlertaProgramacion: '',
    }));
    syncTipoForCategoria(categoria, { force: true });
  };

  const openTipoSelector = () => {
    if (isReadOnlyMode) return;
    if (tiposCategoria.length === 0) {
      setMessage('No hay tipos de evento activos para esta categoria.');
      return;
    }

    const options: { text: string; style?: 'cancel'; onPress?: () => void }[] = tiposCategoria.map((tipo) => ({
      text: tipo.nombreTipo,
      onPress: () => {
        setForm((prev) => ({ ...prev, idTipoEvento: String(tipo.idTipoEvento) }));
        setErrors((prev) => ({ ...prev, idTipoEvento: undefined }));
      },
    }));

    options.push({ text: 'Cancelar', style: 'cancel' });
    Alert.alert('Tipo de evento sanitario', 'Selecciona el tipo especifico', options);
  };

  const reloadList = async () => {
    if (!canViewRecords || !animal) return;
    const eventosData = await sanitarioApi.getEventos({ idAnimal: animal.idAnimal });
    setEventos(eventosData);
  };

  const onSave = async () => {
    if (!animal) {
      setMessage('No se encontro el animal activo para registrar el evento.');
      return;
    }

    if (isReadOnlyMode) {
      setMessage('Tu rol no tiene permisos para registrar o editar eventos sanitarios.');
      return;
    }

    const validation = validateEventoForm(form, selectedCategoria);
    setErrors(validation);

    if (Object.keys(validation).length > 0) {
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const payload = toEventoPayload(form);
      let savedEvent: EventoSanitario;

      if (editingEventId > 0) {
        savedEvent = await sanitarioApi.updateEvento(editingEventId, payload);
      } else {
        savedEvent = await sanitarioApi.createEvento({
          idAnimal: animal.idAnimal,
          ...payload,
        });
      }

      if (editingEventId <= 0 && form.fechaAlertaProgramacion && canCreateCalendario) {
        await sanitarioApi.createCalendario({
          idAnimal: animal.idAnimal,
          idTipoEvento: Number(form.idTipoEvento),
          fechaProgramada: form.fechaAlertaProgramacion,
        });
      }

      await reloadList();

      const categoria = resolveCategoriaFromTipoName(savedEvent.tipoEvento?.nombreTipo || getCategoriaLabel(selectedCategoria));
      setForm((prev) => ({
        ...EMPTY_EVENTO_FORM,
        idTipoEvento: prev.idTipoEvento,
      }));
      setSelectedCategoria(categoria);
      setEditingEventId(0);
      setErrors({});
      setActiveTab(canViewRecords ? 'historial' : 'registro');
      setMessage('Registro sanitario guardado exitosamente.');
    } catch (error) {
      setMessage(getSanitarioErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const onApprove = async (evento: EventoSanitario, estadoAprobacion: Exclude<EstadoRegistro, 'PENDIENTE'>) => {
    try {
      await sanitarioApi.aprobarEvento(evento.idEvento, { estadoAprobacion });
      await reloadList();
      setMessage(`Evento ${estadoAprobacion.toLowerCase()} exitosamente.`);
    } catch (error) {
      setMessage(getSanitarioErrorMessage(error));
    }
  };

  const onPressHistorialItem = (evento: EventoSanitario) => {
    if (evento.estadoAprobacion !== 'PENDIENTE') return;

    const options: { text: string; style?: 'cancel' | 'destructive'; onPress?: () => void }[] = [];

    if (canEditEvento) {
      options.push({
        text: 'Editar',
        onPress: () => applyEventoToEditor(evento),
      });
    }

    if (canApproveEvento) {
      options.push({
        text: 'Aprobar',
        onPress: () => onApprove(evento, 'APROBADO'),
      });
      options.push({
        text: 'Rechazar',
        style: 'destructive',
        onPress: () => onApprove(evento, 'RECHAZADO'),
      });
    }

    options.push({
      text: 'Cancelar',
      style: 'cancel',
    });

    if (options.length === 1) return;

    Alert.alert('Acciones del evento', `Evento #${evento.idEvento}`, options);
  };

  if (!canViewRecords && !canCreateEvento) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.centerBox}>
          <Text style={styles.centerTitle}>Acceso restringido</Text>
          <Text style={styles.centerText}>Tu rol no tiene permisos para modulo sanitario.</Text>
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
          <Text style={styles.centerText}>Cargando modulo sanitario...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!animal) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.centerBox}>
          <Text style={styles.centerTitle}>Sin contexto de animal</Text>
          <Text style={styles.centerText}>{message || 'Abre esta pantalla desde detalle de ganado.'}</Text>
          <Pressable style={styles.mainButton} onPress={() => router.back()}>
            <Text style={styles.mainButtonText}>Regresar</Text>
          </Pressable>
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

          <Pressable style={styles.iconButton} onPress={() => {
            setRefreshing(true);
            void loadData();
          }}>
            {refreshing
              ? <ActivityIndicator color="#2F9B47" />
              : <Feather name="refresh-cw" size={16} color="#131913" />}
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroLabel}>Arete:</Text>
            <Text style={styles.heroArete}>{animal.numeroArete}</Text>
          </View>

          <Image source={require('../../../../assets/images/auth-hero-register.jpg')} style={styles.heroAnimal} />
        </View>

        <View style={styles.pillBar}>
          <MaterialCommunityIcons name="needle" size={14} color="#121212" />
          <Text style={styles.pillLabel}>SANIDAD</Text>
        </View>

        {canViewRecords ? (
          <View style={styles.tabsWrap}>
            <Pressable
              onPress={() => setActiveTab('registro')}
              style={[styles.tabBtn, activeTab === 'registro' ? styles.tabBtnActive : null]}>
              <Text style={[styles.tabText, activeTab === 'registro' ? styles.tabTextActive : null]}>Registro</Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('historial')}
              style={[styles.tabBtn, activeTab === 'historial' ? styles.tabBtnActive : null]}>
              <Text style={[styles.tabText, activeTab === 'historial' ? styles.tabTextActive : null]}>Historial</Text>
            </Pressable>
          </View>
        ) : null}

        {message ? <Text style={styles.messageText}>{message}</Text> : null}

        {activeTab === 'registro' ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Tipo de evento sanitario</Text>
            <View style={styles.tipoRow}>
              {(['VACUNA', 'TRATAMIENTO', 'PADECIMIENTO'] as const).map((categoria) => (
                <Pressable
                  key={categoria}
                  onPress={() => resetFormForCategory(categoria)}
                  style={[styles.tipoChip, selectedCategoria === categoria ? styles.tipoChipActive : null]}>
                  <Text style={[styles.tipoChipText, selectedCategoria === categoria ? styles.tipoChipTextActive : null]}>
                    {getCategoriaLabel(categoria)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Tipo especifico</Text>
              <Pressable
                onPress={openTipoSelector}
                style={[styles.inputWrap, isReadOnlyMode ? styles.inputDisabledWrap : null]}>
                <Text
                  style={[
                    styles.input,
                    !selectedTipo ? styles.placeholderText : null,
                    isReadOnlyMode ? styles.inputDisabled : null,
                  ]}>
                  {selectedTipo?.nombreTipo || 'Seleccionar tipo de evento'}
                </Text>
                <Feather name="chevron-down" size={15} color="#121212" />
              </Pressable>
            </View>
            {errors.idTipoEvento ? <Text style={styles.errorText}>{errors.idTipoEvento}</Text> : null}

            <LabelledInput
              label="Fecha"
              value={form.fechaEvento}
              onChangeText={(value) => setForm((prev) => ({ ...prev, fechaEvento: value }))}
              placeholder="YYYY-MM-DD"
              icon="calendar"
              error={errors.fechaEvento}
              editable={!isReadOnlyMode}
            />

            <LabelledInput
              label={labels.principal}
              value={form.campoPrincipal}
              onChangeText={(value) => setForm((prev) => ({ ...prev, campoPrincipal: value }))}
              placeholder="Captura el dato principal..."
              icon="activity"
              error={errors.campoPrincipal}
              editable={!isReadOnlyMode}
            />

            <LabelledInput
              label={labels.secundario}
              value={form.campoSecundario}
              onChangeText={(value) => setForm((prev) => ({ ...prev, campoSecundario: value }))}
              placeholder="Dato complementario..."
              icon="file-text"
              error={errors.campoSecundario}
              editable={!isReadOnlyMode}
              multiline={selectedCategoria === 'PADECIMIENTO'}
            />

            {labels.terciario ? (
              <LabelledInput
                label={labels.terciario}
                value={form.campoTerciario}
                onChangeText={(value) => setForm((prev) => ({ ...prev, campoTerciario: value }))}
                placeholder="Dato adicional..."
                icon="clipboard"
                error={errors.campoTerciario}
                editable={!isReadOnlyMode}
              />
            ) : null}

            <View style={styles.alertCard}>
              <Text style={styles.alertTitle}>{labels.alerta}</Text>
              <TextInput
                value={form.fechaAlertaProgramacion}
                onChangeText={(value) => setForm((prev) => ({ ...prev, fechaAlertaProgramacion: value }))}
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#8C948C"
                editable={!isReadOnlyMode && canCreateCalendario}
              />
              {!canCreateCalendario ? (
                <Text style={styles.alertHint}>
                  Tu rol no puede programar alertas en calendario.
                </Text>
              ) : null}
              {errors.fechaAlertaProgramacion ? <Text style={styles.errorText}>{errors.fechaAlertaProgramacion}</Text> : null}
            </View>

            {!isReadOnlyMode ? (
              <Pressable
                onPress={onSave}
                disabled={saving}
                style={({ pressed }) => [
                  styles.mainButton,
                  saving ? styles.buttonDisabled : null,
                  pressed ? styles.pressed : null,
                ]}>
                {saving
                  ? <ActivityIndicator color="#FFFFFF" />
                  : <Text style={styles.mainButtonText}>{editingEventId > 0 ? 'Actualizar Registro' : 'Guardar Registro'}</Text>}
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {activeTab === 'historial' ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Historial sanitario</Text>

            <View style={styles.summaryRow}>
              <SummaryCard
                tone="success"
                title="Estado general"
                value={resumen.estadoGeneral}
              />
              <SummaryCard
                tone="warning"
                title="Ultimo evento"
                value={resumen.ultimo?.tipoEvento?.nombreTipo || 'Sin registro'}
              />
              <SummaryCard
                tone="danger"
                title="Alerta pendiente"
                value={resumen.pendientes > 0 ? `${resumen.pendientes} eventos` : 'Sin pendientes'}
              />
            </View>

            <Text style={styles.subtitle}>Historial detallado</Text>

            {eventos.map((evento) => (
              <Pressable
                key={evento.idEvento}
                onPress={() => onPressHistorialItem(evento)}
                style={({ pressed }) => [styles.eventCard, pressed ? styles.pressed : null]}>
                <View style={styles.eventCardHead}>
                  <Text style={styles.eventCardTitle}>
                    {getCategoriaLabel(resolveCategoriaFromTipoName(evento.tipoEvento?.nombreTipo))}
                  </Text>
                  <Text style={[styles.statusChip, { color: getEstadoRegistroColor(evento.estadoAprobacion) }]}>
                    {formatEstadoRegistro(evento.estadoAprobacion)}
                  </Text>
                </View>
                <Text style={styles.eventCardText}>
                  {evento.diagnostico || 'Sin descripcion clinica'}
                </Text>
                <Text style={styles.eventCardMeta}>
                  {formatDate(evento.fechaEvento)}
                  {evento.autorizador?.nombreCompleto ? ` | ${evento.autorizador.nombreCompleto}` : ''}
                </Text>
              </Pressable>
            ))}

            {eventos.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyTitle}>Sin historial sanitario</Text>
                <Text style={styles.emptyText}>Aun no hay eventos registrados para este animal.</Text>
              </View>
            ) : null}

            {(canCreateEvento || canEditEvento) ? (
              <Pressable
                onPress={() => {
                  setEditingEventId(0);
                  setForm((prev) => ({ ...EMPTY_EVENTO_FORM, idTipoEvento: prev.idTipoEvento }));
                  setErrors({});
                  setActiveTab('registro');
                }}
                style={styles.mainButton}>
                <Text style={styles.mainButtonText}>Agregar Nuevo Registro</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function LabelledInput({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  error,
  editable,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  icon: keyof typeof Feather.glyphMap;
  error?: string;
  editable: boolean;
  multiline?: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputWrap, multiline ? styles.inputWrapMultiline : null]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          style={[styles.input, multiline ? styles.inputMultiline : null, !editable ? styles.inputDisabled : null]}
          placeholder={placeholder}
          placeholderTextColor="#8C948C"
          editable={editable}
          multiline={multiline}
        />
        <Feather name={icon} size={15} color="#121212" />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function SummaryCard({
  tone,
  title,
  value,
}: {
  tone: 'success' | 'warning' | 'danger';
  title: string;
  value: string;
}) {
  const toneStyle = tone === 'success'
    ? styles.summaryCardSuccess
    : tone === 'warning'
      ? styles.summaryCardWarning
      : styles.summaryCardDanger;

  return (
    <View style={[styles.summaryCard, toneStyle]}>
      <Text style={styles.summaryTitle}>{title}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
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
  heroCard: {
    height: 98,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D3D9D3',
    backgroundColor: '#FFFFFF',
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroLeft: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#229A3E',
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: 'center',
    gap: 2,
  },
  heroLabel: {
    color: '#EFFAF1',
    fontSize: 12,
    fontWeight: '700',
  },
  heroArete: {
    color: '#FFFFFF',
    fontSize: 31,
    lineHeight: 34,
    fontWeight: '800',
  },
  heroAnimal: {
    width: 102,
    height: '100%',
    borderRadius: 10,
    resizeMode: 'cover',
  },
  pillBar: {
    minHeight: 34,
    borderWidth: 1,
    borderColor: '#CCCFCC',
    borderRadius: 12,
    backgroundColor: '#F3F4F3',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  pillLabel: {
    color: '#171717',
    fontSize: 13,
    fontWeight: '800',
  },
  tabsWrap: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D6DCD6',
    backgroundColor: '#FFFFFF',
    padding: 4,
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    minHeight: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#2F9B47',
  },
  tabText: {
    color: '#596659',
    fontWeight: '700',
    fontSize: 12,
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
    color: '#1B241B',
    fontSize: 14,
    fontWeight: '800',
  },
  tipoRow: {
    flexDirection: 'row',
    gap: 5,
    flexWrap: 'wrap',
  },
  tipoChip: {
    borderRadius: 6,
    paddingHorizontal: 10,
    minHeight: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CFD6CF',
    backgroundColor: '#ECEFEC',
  },
  tipoChipActive: {
    backgroundColor: '#53C96B',
    borderColor: '#53C96B',
  },
  tipoChipText: {
    color: '#2B312B',
    fontSize: 11,
    fontWeight: '700',
  },
  tipoChipTextActive: {
    color: '#FFFFFF',
  },
  fieldWrap: {
    gap: 4,
  },
  fieldLabel: {
    color: '#2A2F2A',
    fontSize: 13,
    fontWeight: '700',
  },
  inputWrap: {
    minHeight: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D4D8D4',
    backgroundColor: '#F4F6F4',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 8,
  },
  inputDisabledWrap: {
    opacity: 0.65,
  },
  inputWrapMultiline: {
    minHeight: 94,
    alignItems: 'flex-start',
    paddingTop: 8,
  },
  input: {
    flex: 1,
    color: '#1D261D',
    fontSize: 13,
  },
  placeholderText: {
    color: '#8C948C',
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputDisabled: {
    color: '#7A847A',
  },
  alertCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D6D8B2',
    backgroundColor: '#EEF0CE',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
  },
  alertTitle: {
    color: '#546034',
    fontWeight: '700',
    fontSize: 13,
  },
  alertHint: {
    color: '#5A665A',
    fontSize: 11,
  },
  messageText: {
    color: '#5D6B5E',
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    color: '#B42318',
    fontSize: 12,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 6,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 7,
    gap: 2,
  },
  summaryCardSuccess: {
    backgroundColor: '#C6F1D0',
    borderColor: '#73D78B',
  },
  summaryCardWarning: {
    backgroundColor: '#F9F0B5',
    borderColor: '#E2C356',
  },
  summaryCardDanger: {
    backgroundColor: '#F8D1D1',
    borderColor: '#E89898',
  },
  summaryTitle: {
    color: '#263026',
    fontSize: 10,
    fontWeight: '700',
  },
  summaryValue: {
    color: '#101610',
    fontSize: 12,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 2,
    color: '#212B21',
    fontSize: 13,
    fontWeight: '800',
  },
  eventCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D2D8D2',
    backgroundColor: '#F8F9F8',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 3,
  },
  eventCardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventCardTitle: {
    color: '#1E291E',
    fontSize: 13,
    fontWeight: '800',
  },
  statusChip: {
    fontSize: 10,
    fontWeight: '800',
  },
  eventCardText: {
    color: '#3C4D3C',
    fontSize: 12,
    lineHeight: 16,
  },
  eventCardMeta: {
    color: '#6D796D',
    fontSize: 10,
    fontWeight: '700',
  },
  emptyWrap: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCE1DC',
    backgroundColor: '#FFFFFF',
    padding: 12,
    gap: 4,
  },
  emptyTitle: {
    color: '#2F3B2F',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyText: {
    color: '#667266',
    fontSize: 12,
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
    marginTop: 4,
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
  buttonDisabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.86,
  },
});
