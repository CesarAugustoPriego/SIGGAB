import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
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
import type { CreateAnimalInput, ProcedenciaAnimal, Raza, SexoAnimal } from '../ganado-types';
import {
  EMPTY_ANIMAL_FORM,
  getGanadoErrorMessage,
  mapServerFieldErrors,
  type AnimalFormErrors,
  type AnimalFormState,
  validateAnimalForm,
} from '../ganado-utils';

const SEXO_OPTIONS: SexoAnimal[] = ['HEMBRA', 'MACHO'];
const PROCEDENCIA_OPTIONS: Array<{ value: ProcedenciaAnimal; label: string }> = [
  { value: 'ADQUIRIDA', label: 'Adquirida' },
  { value: 'NACIDA', label: 'Nacida en rancho' },
];

async function pickImageFromGallery() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permiso requerido', 'Se necesita acceso a la galería para seleccionar una foto.');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
    base64: true,
  });

  if (result.canceled || !result.assets[0]?.base64) return null;
  const asset = result.assets[0];
  const mimeType = asset.mimeType || 'image/jpeg';
  return {
    base64: `data:${mimeType};base64,${asset.base64}`,
    uri: asset.uri,
  };
}

async function takePhotoWithCamera() {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permiso requerido', 'Se necesita acceso a la cámara para tomar una foto.');
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
    base64: true,
  });

  if (result.canceled || !result.assets[0]?.base64) return null;
  const asset = result.assets[0];
  const mimeType = asset.mimeType || 'image/jpeg';
  return {
    base64: `data:${mimeType};base64,${asset.base64}`,
    uri: asset.uri,
  };
}

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

  useEffect(() => {
    if (!form.idRaza && razas[0]) {
      setForm((prev) => ({ ...prev, idRaza: String(razas[0].idRaza) }));
    }
  }, [form.idRaza, razas]);

  const updateField = (field: keyof AnimalFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    const errorField = field as keyof AnimalFormErrors;
    if (errors[errorField]) {
      setErrors((prev) => ({ ...prev, [errorField]: undefined }));
    }
  };

  const onPickFromGallery = async () => {
    const result = await pickImageFromGallery();
    if (result) {
      setForm((prev) => ({
        ...prev,
        fotoBase64: result.base64,
        fotoPreviewUrl: result.uri,
        eliminarFoto: false,
      }));
    }
  };

  const onTakePhoto = async () => {
    const result = await takePhotoWithCamera();
    if (result) {
      setForm((prev) => ({
        ...prev,
        fotoBase64: result.base64,
        fotoPreviewUrl: result.uri,
        eliminarFoto: false,
      }));
    }
  };

  const onRemovePhoto = () => {
    setForm((prev) => ({
      ...prev,
      fotoBase64: '',
      fotoPreviewUrl: '',
      eliminarFoto: false,
    }));
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
        sexo: form.sexo,
        procedencia: form.procedencia,
        edadEstimada: Number(form.edadEstimada),
        estadoSanitarioInicial: form.estadoSanitarioInicial.trim(),
        fotoBase64: form.fotoBase64 || undefined,
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

          <View style={[styles.iconButton, { opacity: 0 }]} />
        </View>

        <Text style={styles.screenTitle}>Registrar</Text>

        <View style={styles.formCard}>
          {/* ── Arete SINIIGA ── */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Arete SINIIGA:</Text>
            <TextInput
              value={form.numeroArete}
              onChangeText={(v) => updateField('numeroArete', v.replace(/\D/g, '').slice(0, 10))}
              style={styles.inputPill}
              placeholder="2712345678"
              placeholderTextColor="#9EA89E"
              keyboardType="number-pad"
              maxLength={10}
            />
            <Text style={styles.hintText}>Formato: 27 + 8 dígitos (código Tabasco)</Text>
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
            <Text style={styles.fieldLabel}>Sexo:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.razaChips}>
              {SEXO_OPTIONS.map((sexo) => (
                <Pressable
                  key={sexo}
                  onPress={() => updateField('sexo', sexo)}
                  style={[styles.razaChip, form.sexo === sexo ? styles.razaChipActive : null]}>
                  <Text style={[styles.razaChipText, form.sexo === sexo ? styles.razaChipTextActive : null]}>
                    {sexo === 'HEMBRA' ? 'Hembra' : 'Macho'}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            {errors.sexo ? <Text style={styles.errorText}>{errors.sexo}</Text> : null}
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Procedencia:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.razaChips}>
              {PROCEDENCIA_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => updateField('procedencia', option.value)}
                  style={[styles.razaChip, form.procedencia === option.value ? styles.razaChipActive : null]}>
                  <Text style={[styles.razaChipText, form.procedencia === option.value ? styles.razaChipTextActive : null]}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
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

          {/* ── Foto del ejemplar ── */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Foto del ejemplar:</Text>
            {form.fotoPreviewUrl ? (
              <View style={styles.photoPreviewWrap}>
                <Image source={{ uri: form.fotoPreviewUrl }} style={styles.photoPreview} />
                <Pressable style={styles.photoRemoveBtn} onPress={onRemovePhoto}>
                  <Feather name="x" size={16} color="#B42318" />
                  <Text style={styles.photoRemoveBtnText}>Quitar</Text>
                </Pressable>
              </View>
            ) : null}
            <View style={styles.photoActions}>
              <Pressable style={styles.photoActionBtn} onPress={onTakePhoto}>
                <Feather name="camera" size={18} color="#2F9B47" />
                <Text style={styles.photoActionText}>Tomar foto</Text>
              </Pressable>
              <Pressable style={styles.photoActionBtn} onPress={onPickFromGallery}>
                <Feather name="image" size={18} color="#2F9B47" />
                <Text style={styles.photoActionText}>Galería</Text>
              </Pressable>
            </View>
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
  hintText: {
    fontSize: 11,
    color: '#8A938A',
    fontStyle: 'italic',
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
  // ── Photo section ──
  photoPreviewWrap: {
    alignItems: 'center',
    gap: 8,
  },
  photoPreview: {
    width: 140,
    height: 140,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D2D8D2',
  },
  photoRemoveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  photoRemoveBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B42318',
  },
  photoActions: {
    flexDirection: 'row',
    gap: 8,
  },
  photoActionBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#C7E0CC',
    backgroundColor: '#F2FBF4',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  photoActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2F9B47',
  },
  // ── Buttons ──
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
