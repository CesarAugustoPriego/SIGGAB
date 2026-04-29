import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
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
import { canCreateProductivoRegistros } from '@/src/features/auth/role-permissions';
import type { Animal } from '@/src/features/ganado/ganado-types';
import { AnimalPicker } from '@/src/shared/components/animal-picker';
import { productivoApi } from '../productivo-api';

const ACCENT = '#2F9B47';

export function RegistroPesoScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const canCreate = useMemo(() => canCreateProductivoRegistros(user?.rol), [user?.rol]);

  const [animal, setAnimal] = useState<Animal | null>(null);
  const [peso, setPeso] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const canSave = useMemo(
    () => canCreate && !!animal && !!peso.trim() && Number(peso) > 0 && !!fecha,
    [canCreate, animal, peso, fecha],
  );

  const onAnimalSelected = useCallback((selected: Animal | null) => {
    setAnimal(selected);
  }, []);

  const onSave = useCallback(async () => {
    if (!canSave || !animal) return;
    setSaving(true);
    setFormError(null);
    try {
      await productivoApi.createRegistroPeso({
        idAnimal: animal.idAnimal,
        peso: Number(peso),
        fechaRegistro: fecha,
      });
      Alert.alert('Registro exitoso', `${peso} kg registrados para ${animal.numeroArete}.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: unknown) {
      const e = err as { status?: number };
      if (e?.status === 401) { await logout(); return; }
      setFormError('Error al registrar. Verifica los datos e intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  }, [canSave, animal, peso, fecha, logout, router]);

  if (!canCreate) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.centerBox}>
          <MaterialCommunityIcons name="lock-outline" size={40} color="#A0A8A0" />
          <Text style={styles.centerTitle}>Acceso restringido</Text>
          <Text style={styles.centerText}>Tu rol no tiene permisos para registrar peso.</Text>
          <Pressable style={styles.backButton} onPress={() => router.replace('/(app)/home')}>
            <Text style={styles.backButtonText}>Volver al inicio</Text>
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
        <Text style={styles.topBarTitle}>Registrar Peso</Text>
        <View style={styles.iconButton} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: 'padding', android: 'height' })}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Seleccionar animal</Text>
            <AnimalPicker
              accentColor={ACCENT}
              selectedAnimal={animal}
              onSelect={(selected) => onAnimalSelected(selected)}
            />
            {animal && (
              <View style={styles.animalDetails}>
                <MaterialCommunityIcons name="scale" size={14} color={ACCENT} />
                <Text style={styles.animalDetailsText}>
                  Peso inicial: {Number(animal.pesoInicial).toFixed(0)} kg
                </Text>
              </View>
            )}
          </View>

          {animal && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>2. Datos de peso</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Peso medido (kg) *</Text>
                <View style={styles.bigInputWrap}>
                  <MaterialCommunityIcons name="scale" size={20} color={ACCENT} />
                  <TextInput
                    style={styles.bigInput}
                    value={peso}
                    onChangeText={setPeso}
                    keyboardType="decimal-pad"
                    placeholder="450.5"
                    placeholderTextColor="#A0AAA0"
                  />
                  <Text style={styles.bigInputUnit}>kg</Text>
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Fecha de medicion *</Text>
                <TextInput
                  style={styles.dateInput}
                  value={fecha}
                  onChangeText={setFecha}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#A0AAA0"
                  keyboardType="numbers-and-punctuation"
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
                    <Text style={styles.saveButtonText}>Guardar registro</Text>
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
  safe: { flex: 1, backgroundColor: '#F0F3F0' },
  topBar: {
    minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, backgroundColor: '#F0F3F0', borderBottomWidth: 1, borderBottomColor: '#DDE3DD',
  },
  topBarTitle: { fontSize: 16, fontWeight: '700', color: '#1A2D1A' },
  iconButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EBEBEB', alignItems: 'center', justifyContent: 'center' },

  content: { padding: 16, gap: 16 },
  section: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, gap: 12, borderWidth: 1, borderColor: '#DDE3DD' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#3A4A3A', textTransform: 'uppercase', letterSpacing: 0.5 },

  animalDetails: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -4 },
  animalDetailsText: { fontSize: 12, color: '#5A7A5A', fontWeight: '600' },

  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#4A5A4A' },
  bigInputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F5F7F5', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: '#DDE3DD',
  },
  bigInput: { flex: 1, fontSize: 24, fontWeight: '800', color: '#1A3D1A' },
  bigInputUnit: { fontSize: 16, fontWeight: '600', color: '#5A7A5A' },
  dateInput: {
    backgroundColor: '#F5F7F5', borderRadius: 10, paddingHorizontal: 12,
    paddingVertical: 10, fontSize: 14, color: '#1A2D1A', borderWidth: 1, borderColor: '#DDE3DD',
  },
  fieldError: { color: '#C0392B', fontSize: 12, fontWeight: '600' },

  saveButton: {
    backgroundColor: ACCENT, borderRadius: 12, minHeight: 50,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4,
  },
  saveButtonDisabled: { backgroundColor: '#A0C8A8' },
  saveButtonText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 28 },
  centerTitle: { fontSize: 18, fontWeight: '800', color: '#1A261A', textAlign: 'center' },
  centerText: { fontSize: 13, color: '#667266', textAlign: 'center' },
  backButton: { marginTop: 8, backgroundColor: ACCENT, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28 },
  backButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});
