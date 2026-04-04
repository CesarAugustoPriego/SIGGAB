import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
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

import { canCreateAnimal } from '@/src/features/auth/role-permissions';
import { useAuth } from '@/src/features/auth/auth-context';

import { ganadoApi } from '../ganado-api';
import type { CreateAnimalInput, Raza } from '../ganado-types';
import {
  EMPTY_ANIMAL_FORM,
  getGanadoErrorMessage,
  mapServerFieldErrors,
  type AnimalFormErrors,
  type AnimalFormState,
  validateAnimalForm,
} from '../ganado-utils';

export function GanadoRegisterScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const canCreate = useMemo(() => canCreateAnimal(user?.rol), [user?.rol]);

  const [razas, setRazas] = useState<Raza[]>([]);
  const [loadingRazas, setLoadingRazas] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<AnimalFormState>({
    ...EMPTY_ANIMAL_FORM,
    fechaIngreso: new Date().toISOString().slice(0, 10),
  });
  const [errors, setErrors] = useState<AnimalFormErrors>({});
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      try {
        const data = await ganadoApi.getRazas();
        if (mounted) setRazas(data);
      } catch (error) {
        if (mounted) setMessage(getGanadoErrorMessage(error));
      } finally {
        if (mounted) setLoadingRazas(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const updateField = (field: keyof AnimalFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const onSave = async () => {
    const validationErrors = validateAnimalForm(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSaving(true);
    setMessage(null);

    try {
      const payload: CreateAnimalInput = {
        numeroArete: form.numeroArete.trim(),
        fechaIngreso: form.fechaIngreso,
        pesoInicial: Number(form.pesoInicial),
        idRaza: Number(form.idRaza),
        procedencia: form.procedencia.trim(),
        edadEstimada: Number(form.edadEstimada),
        estadoSanitarioInicial: form.estadoSanitarioInicial.trim(),
      };

      await ganadoApi.createAnimal(payload);
      Alert.alert('Ganado', 'Animal registrado correctamente.', [
        {
          text: 'OK',
          onPress: () => router.replace('/(app)/ganado'),
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

  if (!canCreate) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.centerBox}>
          <Text style={styles.centerTitle}>Acceso restringido</Text>
          <Text style={styles.centerText}>Tu rol no puede registrar animales.</Text>
          <Pressable style={styles.saveButton} onPress={() => router.replace('/(app)/ganado')}>
            <Text style={styles.saveButtonText}>Volver a Mi Hato</Text>
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

          <Pressable style={styles.iconButton}>
            <Feather name="bell" size={18} color="#111" />
          </Pressable>
        </View>

        <Text style={styles.screenTitle}>Registrar</Text>

        <View style={styles.formCard}>
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Arete:</Text>
            <TextInput
              value={form.numeroArete}
              onChangeText={(v) => updateField('numeroArete', v)}
              style={styles.inputPill}
              placeholder="MX-AGS-1001"
              placeholderTextColor="#9EA89E"
            />
            {errors.numeroArete ? <Text style={styles.errorText}>{errors.numeroArete}</Text> : null}
          </View>

          <View style={styles.row}>
            <View style={[styles.fieldWrap, styles.half]}>
              <Text style={styles.fieldLabel}>Edad (meses):</Text>
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
              <Text style={styles.fieldLabel}>Peso (kg):</Text>
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

          <View style={styles.row}>
            <View style={[styles.fieldWrap, styles.half]}>
              <Text style={styles.fieldLabel}>Fecha ingreso:</Text>
              <TextInput
                value={form.fechaIngreso}
                onChangeText={(v) => updateField('fechaIngreso', v)}
                style={styles.inputPill}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9EA89E"
              />
              {errors.fechaIngreso ? <Text style={styles.errorText}>{errors.fechaIngreso}</Text> : null}
            </View>

            <View style={[styles.fieldWrap, styles.half]}>
              <Text style={styles.fieldLabel}>Raza:</Text>
              {loadingRazas ? (
                <View style={styles.inputPillLoading}>
                  <ActivityIndicator color="#2F9B47" />
                </View>
              ) : (
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
              )}
              {errors.idRaza ? <Text style={styles.errorText}>{errors.idRaza}</Text> : null}
            </View>
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Procedencia:</Text>
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
            <Text style={styles.fieldLabel}>Estado sanitario inicial:</Text>
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
              styles.saveButton,
              saving ? styles.buttonDisabled : null,
              pressed && !saving ? styles.buttonPressed : null,
            ]}>
            {saving
              ? <ActivityIndicator color="#FFFFFF" />
              : <Text style={styles.saveButtonText}>Guardar</Text>}
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
  multiline: {
    minHeight: 88,
    paddingTop: 10,
  },
  inputPillLoading: {
    minHeight: 40,
    borderRadius: 12,
    backgroundColor: '#EDEFEF',
    borderWidth: 1,
    borderColor: '#E1E5E1',
    alignItems: 'center',
    justifyContent: 'center',
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
  saveButton: {
    minHeight: 44,
    borderRadius: 999,
    backgroundColor: '#44A84A',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  saveButtonText: {
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
