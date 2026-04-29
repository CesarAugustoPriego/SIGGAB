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

const ACCENT = '#1A8FC0';

export function RegistroLecheScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const canCreate = useMemo(() => canCreateProductivoRegistros(user?.rol), [user?.rol]);

  const [animal, setAnimal] = useState<Animal | null>(null);
  const [litros, setLitros] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const canSave = useMemo(
    () => canCreate && !!animal && !!litros.trim() && Number(litros) > 0 && !!fecha,
    [canCreate, animal, litros, fecha],
  );

  const onAnimalSelected = useCallback((selected: Animal | null) => {
    setAnimal(selected);
  }, []);

  const onSave = useCallback(async () => {
    if (!canSave || !animal) return;
    setSaving(true);
    setFormError(null);
    try {
      await productivoApi.createProduccionLeche({
        idAnimal: animal.idAnimal,
        litrosProducidos: Number(litros),
        fechaRegistro: fecha,
      });
      Alert.alert('Registro exitoso', `${litros} L registrados para ${animal.numeroArete}.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: unknown) {
      const e = err as { status?: number };
      if (e?.status === 401) { await logout(); return; }
      setFormError('Error al registrar. Revisa los datos e intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  }, [canSave, animal, litros, fecha, logout, router]);

  if (!canCreate) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.centerBox}>
          <MaterialCommunityIcons name="lock-outline" size={40} color="#A0A8A0" />
          <Text style={styles.centerTitle}>Acceso restringido</Text>
          <Text style={styles.centerText}>Tu rol no tiene permisos para registrar leche.</Text>
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
        <Text style={styles.topBarTitle}>Registrar Leche</Text>
        <View style={styles.iconButton} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: 'padding', android: 'height' })}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Seleccionar animal</Text>
            <AnimalPicker
              accentColor={ACCENT}
              selectedAnimal={animal}
              filterSex="HEMBRA"
              onSelect={(selected) => onAnimalSelected(selected)}
            />
          </View>

          {animal && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>2. Produccion de leche</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Litros producidos *</Text>
                <View style={styles.bigInputWrap}>
                  <MaterialCommunityIcons name="water" size={20} color={ACCENT} />
                  <TextInput
                    style={[styles.bigInput, { color: '#1A4D6A' }]}
                    value={litros}
                    onChangeText={setLitros}
                    keyboardType="decimal-pad"
                    placeholder="18.5"
                    placeholderTextColor="#A0AAA0"
                  />
                  <Text style={[styles.bigInputUnit, { color: '#1A6FA0' }]}>L</Text>
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Fecha de registro *</Text>
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
  safe: { flex: 1, backgroundColor: '#F0F4F7' },
  topBar: {
    minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, backgroundColor: '#F0F4F7', borderBottomWidth: 1, borderBottomColor: '#D8E5EE',
  },
  topBarTitle: { fontSize: 16, fontWeight: '700', color: '#1A2D40' },
  iconButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EBEBEB', alignItems: 'center', justifyContent: 'center' },

  content: { padding: 16, gap: 16 },
  section: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, gap: 12, borderWidth: 1, borderColor: '#D8E5EE' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#1A3A50', textTransform: 'uppercase', letterSpacing: 0.5 },

  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#4A5A6A' },
  bigInputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F5F8FB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: '#D8E5EE',
  },
  bigInput: { flex: 1, fontSize: 24, fontWeight: '800' },
  bigInputUnit: { fontSize: 16, fontWeight: '600' },
  dateInput: {
    backgroundColor: '#F5F8FB', borderRadius: 10, paddingHorizontal: 12,
    paddingVertical: 10, fontSize: 14, color: '#1A2D40', borderWidth: 1, borderColor: '#D8E5EE',
  },
  fieldError: { color: '#C0392B', fontSize: 12, fontWeight: '600' },

  saveButton: {
    backgroundColor: ACCENT, borderRadius: 12, minHeight: 50,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4,
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 28 },
  centerTitle: { fontSize: 18, fontWeight: '800', color: '#1A2D40', textAlign: 'center' },
  centerText: { fontSize: 13, color: '#667280', textAlign: 'center' },
  backButton: { marginTop: 8, backgroundColor: ACCENT, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28 },
  backButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});
