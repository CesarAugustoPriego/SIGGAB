import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
  canCreateEventoReproductivo,
  canViewEventosReproductivos,
} from '@/src/features/auth/role-permissions';
import type { Animal } from '@/src/features/ganado/ganado-types';
import { AnimalPicker } from '@/src/shared/components/animal-picker';
import { productivoApi } from '../productivo-api';
import type { TipoEventoReproductivo } from '../productivo-types';

const ACCENT = '#8E44AD';

const TIPOS: { value: TipoEventoReproductivo; label: string; icon: string; color: string }[] = [
  { value: 'CELO', label: 'Celo', icon: 'heart', color: '#E91E63' },
  { value: 'MONTA', label: 'Monta', icon: 'link', color: '#FF9800' },
  { value: 'PREÑEZ', label: 'Preñez', icon: 'star', color: '#9C27B0' },
  { value: 'PARTO', label: 'Parto', icon: 'sun', color: '#4CAF50' },
  { value: 'ABORTO', label: 'Aborto', icon: 'alert-circle', color: '#F44336' },
];

export function RegistroReproductivoScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [animal, setAnimal] = useState<Animal | null>(null);
  const [tipoEvento, setTipoEvento] = useState<TipoEventoReproductivo | null>(null);
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [observaciones, setObservaciones] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const canView = useMemo(() => canViewEventosReproductivos(user?.rol), [user?.rol]);
  const canCreate = useMemo(() => canCreateEventoReproductivo(user?.rol), [user?.rol]);

  const canSave = useMemo(
    () => !!animal && !!tipoEvento && !!fecha,
    [animal, tipoEvento, fecha],
  );

  const onAnimalSelected = useCallback((selected: Animal | null) => {
    setAnimal(selected);
  }, []);

  const onSave = useCallback(async () => {
    if (!canSave || !animal || !tipoEvento) return;
    if (animal.sexo !== 'HEMBRA') {
      setFormError('Solo se pueden registrar eventos reproductivos en hembras.');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      await productivoApi.createEventoReproductivo({
        idAnimal: animal.idAnimal,
        tipoEvento,
        fechaEvento: fecha,
        observaciones: observaciones.trim() || undefined,
      });
      Alert.alert(
        'Evento registrado',
        `${TIPOS.find(t => t.value === tipoEvento)?.label} registrado para ${animal.numeroArete}.`,
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (err: unknown) {
      const e = err as { status?: number };
      if (e?.status === 401) { await logout(); return; }
      setFormError('Error al registrar. Revisa los datos e intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  }, [canSave, animal, tipoEvento, fecha, observaciones, logout, router]);

  if (!canView || !canCreate) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.centerBox}>
          <Text style={styles.centerTitle}>Acceso restringido</Text>
          <Text style={styles.centerText}>Tu rol no tiene permisos para registrar eventos reproductivos.</Text>
          <Pressable style={styles.mainButton} onPress={() => router.replace('/(app)/home')}>
            <Text style={styles.mainButtonText}>Volver al inicio</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={19} color="#1A1A1A" />
        </Pressable>
        <Text style={styles.topBarTitle}>Evento Reproductivo</Text>
        <View style={styles.iconButton} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: 'padding', android: 'height' })}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* 1. Animal */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Seleccionar animal</Text>
            <AnimalPicker
              accentColor={ACCENT}
              selectedAnimal={animal}
              filterSex="HEMBRA"
              onSelect={(a) => void onAnimalSelected(a)}
            />
          </View>

          {/* 2. Tipo de evento */}
          {animal && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>2. Tipo de evento *</Text>
              <View style={styles.tiposGrid}>
                {TIPOS.map((t) => (
                  <Pressable
                    key={t.value}
                    onPress={() => setTipoEvento(t.value)}
                    style={[
                      styles.tipoChip,
                      tipoEvento === t.value && { backgroundColor: t.color, borderColor: t.color },
                    ]}
                  >
                    <Feather
                      name={t.icon as never}
                      size={16}
                      color={tipoEvento === t.value ? '#FFF' : t.color}
                    />
                    <Text style={[styles.tipoChipText, tipoEvento === t.value && { color: '#FFF' }]}>
                      {t.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* 3. Detalle */}
          {animal && tipoEvento && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>3. Detalle del evento</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Fecha del evento *</Text>
                <TextInput
                  style={styles.dateInput}
                  value={fecha}
                  onChangeText={setFecha}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#A0AAA0"
                  keyboardType="numbers-and-punctuation"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Observaciones (opcional)</Text>
                <TextInput
                  style={styles.obsInput}
                  value={observaciones}
                  onChangeText={setObservaciones}
                  placeholder="Detalles adicionales del evento..."
                  placeholderTextColor="#A0AAA0"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {formError && <Text style={styles.fieldError}>{formError}</Text>}

              <Pressable
                style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
                onPress={onSave}
                disabled={!canSave || saving}
              >
                {saving ? <ActivityIndicator color="#FFF" /> : (
                  <>
                    <Feather name="check" size={18} color="#FFF" />
                    <Text style={styles.saveButtonText}>Guardar evento</Text>
                  </>
                )}
              </Pressable>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F0FB' },
  topBar: {
    minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, backgroundColor: '#F8F0FB', borderBottomWidth: 1, borderBottomColor: '#E0CEE8',
  },
  topBarTitle: { fontSize: 16, fontWeight: '700', color: '#3A1A4A' },
  iconButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EBEBEB', alignItems: 'center', justifyContent: 'center' },

  content: { padding: 16, gap: 16 },
  section: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, gap: 12, borderWidth: 1, borderColor: '#E0CEE8' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#4A1A5A', textTransform: 'uppercase', letterSpacing: 0.5 },

  tiposGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tipoChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14,
    borderWidth: 1, borderColor: '#E0CEE8', backgroundColor: '#FAF5FB', minWidth: '40%',
  },
  tipoChipText: { fontSize: 13, fontWeight: '700', color: '#4A1A5A' },

  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#4A3A5A' },
  dateInput: {
    backgroundColor: '#FAF5FB', borderRadius: 10, paddingHorizontal: 12,
    paddingVertical: 10, fontSize: 14, color: '#2A1A3A', borderWidth: 1, borderColor: '#E0CEE8',
  },
  obsInput: {
    backgroundColor: '#FAF5FB', borderRadius: 10, paddingHorizontal: 12,
    paddingVertical: 10, fontSize: 14, color: '#2A1A3A', borderWidth: 1, borderColor: '#E0CEE8', minHeight: 80,
  },
  fieldError: { color: '#C0392B', fontSize: 12, fontWeight: '600' },

  saveButton: {
    backgroundColor: ACCENT, borderRadius: 12, minHeight: 50,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4,
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
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
});
