import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { canEditAnimal } from '@/src/features/auth/role-permissions';

import { ganadoApi } from '../ganado-api';
import type { Animal, Raza, UpdateAnimalInput } from '../ganado-types';
import {
  type AnimalFormErrors,
  type AnimalFormState,
  getGanadoErrorMessage,
  mapServerFieldErrors,
  toAnimalFormState,
  toInputDate,
  toNumeric,
  validateAnimalUpdateForm,
} from '../ganado-utils';

function hasChanges(form: AnimalFormState, animal: Animal) {
  if (form.fechaIngreso !== toInputDate(animal.fechaIngreso)) return true;
  if (Number(form.pesoInicial) !== toNumeric(animal.pesoInicial)) return true;
  if (Number(form.idRaza) !== animal.idRaza) return true;
  if (form.procedencia.trim() !== animal.procedencia) return true;
  if (Number(form.edadEstimada) !== animal.edadEstimada) return true;
  if (form.estadoSanitarioInicial.trim() !== animal.estadoSanitarioInicial) return true;
  return false;
}

function buildUpdatePayload(form: AnimalFormState, animal: Animal): UpdateAnimalInput {
  const payload: UpdateAnimalInput = {};

  if (form.fechaIngreso !== toInputDate(animal.fechaIngreso)) payload.fechaIngreso = form.fechaIngreso;
  if (Number(form.pesoInicial) !== toNumeric(animal.pesoInicial)) payload.pesoInicial = Number(form.pesoInicial);
  if (Number(form.idRaza) !== animal.idRaza) payload.idRaza = Number(form.idRaza);
  if (form.procedencia.trim() !== animal.procedencia) payload.procedencia = form.procedencia.trim();
  if (Number(form.edadEstimada) !== animal.edadEstimada) payload.edadEstimada = Number(form.edadEstimada);
  if (form.estadoSanitarioInicial.trim() !== animal.estadoSanitarioInicial) {
    payload.estadoSanitarioInicial = form.estadoSanitarioInicial.trim();
  }

  return payload;
}

export function GanadoEditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const animalId = Number(params.id || 0);

  const { user } = useAuth();
  const canEdit = useMemo(() => canEditAnimal(user?.rol), [user?.rol]);

  const [animal, setAnimal] = useState<Animal | null>(null);
  const [razas, setRazas] = useState<Raza[]>([]);
  const [form, setForm] = useState<AnimalFormState>({
    numeroArete: '',
    fechaIngreso: '',
    pesoInicial: '',
    idRaza: '',
    procedencia: '',
    edadEstimada: '',
    estadoSanitarioInicial: '',
  });
  const [errors, setErrors] = useState<AnimalFormErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!canEdit) {
      setLoading(false);
      return;
    }

    if (!Number.isInteger(animalId) || animalId <= 0) {
      setLoading(false);
      setMessage('Identificador de animal invalido.');
      return;
    }

    let mounted = true;

    void (async () => {
      try {
        const [animalData, razasData] = await Promise.all([
          ganadoApi.getAnimalById(animalId),
          ganadoApi.getRazas(),
        ]);

        if (!mounted) return;

        setAnimal(animalData);
        setRazas(razasData);
        setForm(toAnimalFormState(animalData));
      } catch (error) {
        if (mounted) setMessage(getGanadoErrorMessage(error));
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [animalId, canEdit]);

  const updateField = (field: keyof AnimalFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const onSave = async () => {
    if (!animal) return;

    if (animal.estadoActual !== 'ACTIVO') {
      setMessage('Solo se permiten ediciones en animales ACTIVO.');
      return;
    }

    const formErrors = validateAnimalUpdateForm(form);
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) return;

    if (!hasChanges(form, animal)) {
      setMessage('No hay cambios para guardar.');
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const payload = buildUpdatePayload(form, animal);
      const updated = await ganadoApi.updateAnimal(animal.idAnimal, payload);

      Alert.alert('Ganado', 'Animal actualizado correctamente.', [
        {
          text: 'Ver detalle',
          onPress: () => router.replace({
            pathname: '/(app)/ganado/[id]',
            params: { id: String(updated.idAnimal) },
          }),
        },
      ]);
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        ...mapServerFieldErrors(error),
      }));
      setMessage(getGanadoErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (!canEdit) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.centerBox}>
          <Text style={styles.centerTitle}>Acceso restringido</Text>
          <Text style={styles.centerText}>Solo Administrador puede editar animales.</Text>
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
          <Text style={styles.centerText}>Cargando datos del animal...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!animal) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.centerBox}>
          <Text style={styles.centerTitle}>No fue posible abrir la edicion</Text>
          <Text style={styles.centerText}>{message || 'Animal no encontrado.'}</Text>
          <Pressable style={styles.mainButton} onPress={() => router.back()}>
            <Text style={styles.mainButtonText}>Regresar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardRoot}
        behavior={Platform.select({ ios: 'padding', android: 'height' })}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
          <View style={styles.topBar}>
            <Pressable style={styles.iconButton} onPress={() => router.back()}>
              <Feather name="chevron-left" size={22} color="#111" />
            </Pressable>

            <Image source={require('../../../../assets/images/logo-rancho-los-alpes.png')} style={styles.logo} />

            <Pressable
              style={styles.iconButton}
              onPress={() => router.replace({ pathname: '/(app)/ganado/[id]', params: { id: String(animal.idAnimal) } })}>
              <Feather name="eye" size={18} color="#111" />
            </Pressable>
          </View>

          <Text style={styles.screenTitle}>Editar animal</Text>

          <View style={styles.formCard}>
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Arete (solo lectura)</Text>
              <TextInput value={form.numeroArete} editable={false} style={[styles.inputPill, styles.inputDisabled]} />
            </View>

            <View style={styles.row}>
              <View style={[styles.fieldWrap, styles.half]}>
                <Text style={styles.fieldLabel}>Estado actual</Text>
                <TextInput value={animal.estadoActual} editable={false} style={[styles.inputPill, styles.inputDisabled]} />
              </View>
              <View style={[styles.fieldWrap, styles.half]}>
                <Text style={styles.fieldLabel}>Fecha ingreso</Text>
                <TextInput
                  value={form.fechaIngreso}
                  onChangeText={(v) => updateField('fechaIngreso', v)}
                  style={styles.inputPill}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9EA89E"
                />
                {errors.fechaIngreso ? <Text style={styles.errorText}>{errors.fechaIngreso}</Text> : null}
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.fieldWrap, styles.half]}>
                <Text style={styles.fieldLabel}>Edad (meses)</Text>
                <TextInput
                  value={form.edadEstimada}
                  onChangeText={(v) => updateField('edadEstimada', v)}
                  style={styles.inputPill}
                  keyboardType="numeric"
                  placeholder="24"
                  placeholderTextColor="#9EA89E"
                />
                {errors.edadEstimada ? <Text style={styles.errorText}>{errors.edadEstimada}</Text> : null}
              </View>
              <View style={[styles.fieldWrap, styles.half]}>
                <Text style={styles.fieldLabel}>Peso (kg)</Text>
                <TextInput
                  value={form.pesoInicial}
                  onChangeText={(v) => updateField('pesoInicial', v)}
                  style={styles.inputPill}
                  keyboardType="numeric"
                  placeholder="350.5"
                  placeholderTextColor="#9EA89E"
                />
                {errors.pesoInicial ? <Text style={styles.errorText}>{errors.pesoInicial}</Text> : null}
              </View>
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Raza</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.razaChips}>
                {razas.map((raza) => (
                  <Pressable
                    key={raza.idRaza}
                    onPress={() => updateField('idRaza', String(raza.idRaza))}
                    style={[styles.razaChip, form.idRaza === String(raza.idRaza) ? styles.razaChipActive : null]}>
                    <Text style={[styles.razaChipText, form.idRaza === String(raza.idRaza) ? styles.razaChipTextActive : null]}>
                      {raza.nombreRaza}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              {errors.idRaza ? <Text style={styles.errorText}>{errors.idRaza}</Text> : null}
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Procedencia</Text>
              <TextInput
                value={form.procedencia}
                onChangeText={(v) => updateField('procedencia', v)}
                style={styles.inputPill}
                placeholder="Origen del animal"
                placeholderTextColor="#9EA89E"
              />
              {errors.procedencia ? <Text style={styles.errorText}>{errors.procedencia}</Text> : null}
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Estado sanitario inicial</Text>
              <TextInput
                value={form.estadoSanitarioInicial}
                onChangeText={(v) => updateField('estadoSanitarioInicial', v)}
                style={[styles.inputPill, styles.multiline]}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholder="Descripcion inicial"
                placeholderTextColor="#9EA89E"
              />
              {errors.estadoSanitarioInicial ? <Text style={styles.errorText}>{errors.estadoSanitarioInicial}</Text> : null}
            </View>

            {message ? <Text style={styles.errorText}>{message}</Text> : null}

            <Pressable
              onPress={onSave}
              disabled={saving}
              style={({ pressed }) => [
                styles.mainButton,
                saving ? styles.buttonDisabled : null,
                pressed && !saving ? styles.buttonPressed : null,
              ]}>
              {saving
                ? <ActivityIndicator color="#FFFFFF" />
                : <Text style={styles.mainButtonText}>Guardar cambios</Text>}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#ECEEEC',
  },
  keyboardRoot: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 12,
    paddingBottom: 120,
    gap: 10,
  },
  topBar: {
    minHeight: 62,
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
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#121712',
  },
  formCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D2D8D2',
    backgroundColor: '#F8F9F8',
    padding: 12,
    gap: 8,
  },
  fieldWrap: {
    gap: 5,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F251F',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  half: {
    flex: 1,
  },
  inputPill: {
    minHeight: 40,
    borderRadius: 12,
    backgroundColor: '#EDEFEF',
    borderWidth: 1,
    borderColor: '#E1E5E1',
    paddingHorizontal: 12,
    color: '#1A231A',
  },
  inputDisabled: {
    backgroundColor: '#E5E8E5',
    color: '#4B554B',
  },
  multiline: {
    minHeight: 88,
    paddingTop: 10,
  },
  razaChips: {
    gap: 6,
    paddingRight: 8,
  },
  razaChip: {
    minHeight: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CDD4CD',
    backgroundColor: '#F1F4F1',
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  razaChipActive: {
    backgroundColor: '#2F9B47',
    borderColor: '#2F9B47',
  },
  razaChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4A574A',
  },
  razaChipTextActive: {
    color: '#FFFFFF',
  },
  mainButton: {
    minHeight: 44,
    borderRadius: 999,
    backgroundColor: '#44A84A',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    paddingHorizontal: 16,
    minWidth: 180,
  },
  mainButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonPressed: {
    opacity: 0.88,
  },
  errorText: {
    color: '#B42318',
    fontSize: 12,
    fontWeight: '600',
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
});
