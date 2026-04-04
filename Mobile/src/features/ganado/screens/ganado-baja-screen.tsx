import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { canBajaAnimal } from '@/src/features/auth/role-permissions';

import { ganadoApi } from '../ganado-api';
import type { Animal } from '../ganado-types';
import {
  DEFAULT_BAJA_FORM,
  type BajaFormErrors,
  type BajaFormState,
  formatEstadoAnimal,
  getGanadoErrorMessage,
  validateBajaForm,
} from '../ganado-utils';

const BAJA_ESTADOS: BajaFormState['estadoActual'][] = ['VENDIDO', 'MUERTO', 'TRANSFERIDO'];

export function GanadoBajaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const animalId = Number(params.id || 0);

  const { user } = useAuth();
  const canBaja = useMemo(() => canBajaAnimal(user?.rol), [user?.rol]);

  const [animal, setAnimal] = useState<Animal | null>(null);
  const [form, setForm] = useState<BajaFormState>(DEFAULT_BAJA_FORM);
  const [errors, setErrors] = useState<BajaFormErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!canBaja) {
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
        const animalData = await ganadoApi.getAnimalById(animalId);
        if (!mounted) return;
        setAnimal(animalData);
      } catch (error) {
        if (mounted) setMessage(getGanadoErrorMessage(error));
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [animalId, canBaja]);

  const onSave = async () => {
    if (!animal) return;

    if (animal.estadoActual !== 'ACTIVO') {
      setMessage(`El animal ya tiene estado ${animal.estadoActual} y no puede darse de baja nuevamente.`);
      return;
    }

    const formErrors = validateBajaForm(form);
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) return;

    setSaving(true);
    setMessage(null);

    try {
      const updated = await ganadoApi.bajaAnimal(animal.idAnimal, {
        estadoActual: form.estadoActual,
        motivoBaja: form.motivoBaja.trim(),
        fechaBaja: form.fechaBaja,
      });

      Alert.alert('Ganado', 'Baja registrada correctamente.', [
        {
          text: 'Ver detalle',
          onPress: () => router.replace({
            pathname: '/(app)/ganado/[id]',
            params: { id: String(updated.idAnimal) },
          }),
        },
      ]);
    } catch (error) {
      setMessage(getGanadoErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (!canBaja) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.centerBox}>
          <Text style={styles.centerTitle}>Acceso restringido</Text>
          <Text style={styles.centerText}>Solo Administrador puede dar de baja animales.</Text>
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
          <Text style={styles.centerText}>Cargando animal...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!animal) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.centerBox}>
          <Text style={styles.centerTitle}>No fue posible abrir la baja</Text>
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
      <ScrollView contentContainerStyle={styles.content}>
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

        <Text style={styles.screenTitle}>Dar de baja animal</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Arete</Text>
          <Text style={styles.value}>{animal.numeroArete}</Text>

          <Text style={styles.label}>Estado actual</Text>
          <Text style={styles.value}>{formatEstadoAnimal(animal.estadoActual)}</Text>

          <Text style={[styles.label, styles.labelSpacing]}>Estado de baja</Text>
          <View style={styles.estadoRow}>
            {BAJA_ESTADOS.map((estado) => (
              <Pressable
                key={estado}
                style={[styles.estadoChip, form.estadoActual === estado ? styles.estadoChipActive : null]}
                onPress={() => setForm((prev) => ({ ...prev, estadoActual: estado }))}>
                <Text style={[styles.estadoChipText, form.estadoActual === estado ? styles.estadoChipTextActive : null]}>
                  {estado}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, styles.labelSpacing]}>Fecha de baja</Text>
          <TextInput
            value={form.fechaBaja}
            onChangeText={(value) => setForm((prev) => ({ ...prev, fechaBaja: value }))}
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9EA89E"
          />
          {errors.fechaBaja ? <Text style={styles.errorText}>{errors.fechaBaja}</Text> : null}

          <Text style={[styles.label, styles.labelSpacing]}>Motivo de baja</Text>
          <TextInput
            value={form.motivoBaja}
            onChangeText={(value) => setForm((prev) => ({ ...prev, motivoBaja: value }))}
            style={[styles.input, styles.multiline]}
            placeholder="Describe causa y contexto de la baja"
            placeholderTextColor="#9EA89E"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          {errors.motivoBaja ? <Text style={styles.errorText}>{errors.motivoBaja}</Text> : null}

          {message ? <Text style={styles.errorText}>{message}</Text> : null}

          <Pressable
            onPress={onSave}
            disabled={saving || animal.estadoActual !== 'ACTIVO'}
            style={({ pressed }) => [
              styles.mainButton,
              (saving || animal.estadoActual !== 'ACTIVO') ? styles.buttonDisabled : null,
              pressed && !saving ? styles.buttonPressed : null,
            ]}>
            {saving
              ? <ActivityIndicator color="#FFFFFF" />
              : <Text style={styles.mainButtonText}>Confirmar baja</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D2D8D2',
    backgroundColor: '#F8F9F8',
    padding: 12,
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F251F',
  },
  labelSpacing: {
    marginTop: 6,
  },
  value: {
    borderRadius: 12,
    backgroundColor: '#E5E8E5',
    borderWidth: 1,
    borderColor: '#E1E5E1',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#1A231A',
    fontWeight: '700',
  },
  estadoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  estadoChip: {
    minHeight: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CDD4CD',
    backgroundColor: '#F1F4F1',
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  estadoChipActive: {
    backgroundColor: '#2F9B47',
    borderColor: '#2F9B47',
  },
  estadoChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4A574A',
  },
  estadoChipTextActive: {
    color: '#FFFFFF',
  },
  input: {
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
  mainButton: {
    minHeight: 44,
    borderRadius: 999,
    backgroundColor: '#B42318',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
    minWidth: 180,
  },
  mainButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
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
