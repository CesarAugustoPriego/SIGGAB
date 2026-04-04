import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
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
import { canCreateAnimal, canViewGanado } from '@/src/features/auth/role-permissions';

import { ganadoApi } from '../ganado-api';
import type { Animal, EstadoAnimal } from '../ganado-types';
import {
  filterAnimalesByArete,
  formatEstadoAnimal,
  getEstadoColor,
  getGanadoErrorMessage,
  toNumeric,
} from '../ganado-utils';

export function GanadoListScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [animales, setAnimales] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [estadoFilter, setEstadoFilter] = useState<EstadoAnimal | 'TODOS'>('ACTIVO');
  const [searchQuery, setSearchQuery] = useState('');

  const canView = useMemo(() => canViewGanado(user?.rol), [user?.rol]);
  const canCreate = useMemo(() => canCreateAnimal(user?.rol), [user?.rol]);

  const loadAnimales = useCallback(async () => {
    if (!canView) return;

    try {
      setMessage(null);
      const data = await ganadoApi.getAnimales({ estadoActual: estadoFilter });
      setAnimales(data);
    } catch (error) {
      setMessage(getGanadoErrorMessage(error));
      if ((error as { status?: number })?.status === 401) {
        await logout();
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [canView, estadoFilter, logout]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadAnimales();
    }, [loadAnimales])
  );

  const animalesFiltrados = useMemo(() => filterAnimalesByArete(animales, searchQuery), [animales, searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnimales();
  };

  const onOpenAnimal = (animal: Animal) => {
    router.push({
      pathname: '/(app)/ganado/[id]',
      params: { id: String(animal.idAnimal) },
    });
  };

  const onLongPressAnimal = (animal: Animal) => {
    Alert.alert(
      'Acciones de ganado',
      `Arete: ${animal.numeroArete}`,
      [
        {
          text: 'Ver historial',
          onPress: () => onOpenAnimal(animal),
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

  if (!canView) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.centerBox}>
          <Text style={styles.centerTitle}>Acceso restringido</Text>
          <Text style={styles.centerText}>Tu rol no tiene permisos para modulo Ganado.</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.replace('/(app)/home')}>
            <Text style={styles.primaryButtonText}>Volver al inicio</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Pressable style={styles.iconButton} onPress={() => router.replace('/(app)/home')}>
            <Feather name="menu" size={20} color="#0E0E0E" />
          </Pressable>

          <Image source={require('../../../../assets/images/logo-rancho-los-alpes.png')} style={styles.logo} />

          <Pressable style={styles.iconButton} onPress={onRefresh}>
            {refreshing
              ? <ActivityIndicator color="#2A7A43" />
              : <Feather name="bell" size={18} color="#0E0E0E" />}
          </Pressable>
        </View>

        <View style={styles.headerRow}>
          <Text style={styles.title}>Mi Hato</Text>
          <View style={styles.headerActions}>
            <Pressable style={styles.roundAction} onPress={onRefresh}>
              <Feather name="grid" size={16} color="#6A6F6A" />
            </Pressable>
            {canCreate ? (
              <Pressable style={styles.roundAction} onPress={() => router.push('/(app)/ganado/registrar')}>
                <Feather name="plus" size={18} color="#2F9B47" />
              </Pressable>
            ) : null}
          </View>
        </View>

        <View style={styles.searchWrap}>
          <Feather name="search" size={16} color="#A2AAA2" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            placeholder="Buscar arete..."
            placeholderTextColor="#A2AAA2"
          />
        </View>

        <View style={styles.estadoRow}>
          {(['ACTIVO', 'TODOS', 'VENDIDO', 'MUERTO', 'TRANSFERIDO'] as const).map((estado) => (
            <Pressable
              key={estado}
              onPress={() => setEstadoFilter(estado)}
              style={[styles.estadoChip, estadoFilter === estado ? styles.estadoChipActive : null]}>
              <Text style={[styles.estadoChipText, estadoFilter === estado ? styles.estadoChipTextActive : null]}>
                {estado}
              </Text>
            </Pressable>
          ))}
        </View>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color="#2A7A43" />
            <Text style={styles.centerText}>Cargando animales...</Text>
          </View>
        ) : (
          <View style={styles.listBlock}>
            {message ? <Text style={styles.errorText}>{message}</Text> : null}

            {animalesFiltrados.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Sin resultados</Text>
                <Text style={styles.emptyText}>No hay animales con los filtros aplicados.</Text>
              </View>
            ) : (
              animalesFiltrados.map((animal) => (
                <Pressable
                  key={animal.idAnimal}
                  onPress={() => onOpenAnimal(animal)}
                  onLongPress={() => onLongPressAnimal(animal)}
                  style={({ pressed }) => [styles.itemCard, pressed ? styles.itemCardPressed : null]}>
                  <View style={styles.itemLeft}>
                    <MaterialCommunityIcons name="cow" size={18} color="#2E8D48" />
                    <View style={styles.itemTextWrap}>
                      <Text style={styles.itemArete}>{animal.numeroArete}</Text>
                      <Text style={styles.itemSubline}>
                        {animal.raza?.nombreRaza || 'Sin raza'} - {toNumeric(animal.pesoInicial)}kg
                      </Text>
                    </View>
                  </View>

                  <View style={styles.itemRight}>
                    <Text style={[styles.estadoBadge, { color: getEstadoColor(animal.estadoActual) }]}>
                      {formatEstadoAnimal(animal.estadoActual)}
                    </Text>
                    <Feather name="chevron-right" size={17} color="#8D958D" />
                  </View>
                </Pressable>
              ))
            )}
          </View>
        )}
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
    paddingBottom: 22,
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 23,
    fontWeight: '800',
    color: '#111611',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roundAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D6DBD6',
    backgroundColor: '#F8FAF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    minHeight: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D8DDD8',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#243124',
    fontSize: 14,
  },
  estadoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  estadoChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D3D9D3',
    backgroundColor: '#F4F7F4',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  estadoChipActive: {
    backgroundColor: '#2F9B47',
    borderColor: '#2F9B47',
  },
  estadoChipText: {
    color: '#5E6A5E',
    fontSize: 11,
    fontWeight: '700',
  },
  estadoChipTextActive: {
    color: '#FFFFFF',
  },
  listBlock: {
    gap: 8,
  },
  itemCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D6DDD6',
    backgroundColor: '#FFFFFF',
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  itemCardPressed: {
    opacity: 0.85,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  itemTextWrap: {
    flex: 1,
  },
  itemArete: {
    color: '#141A14',
    fontWeight: '800',
    fontSize: 14,
  },
  itemSubline: {
    color: '#8A928A',
    fontSize: 11,
    marginTop: 1,
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  estadoBadge: {
    fontSize: 10,
    fontWeight: '800',
  },
  centerBox: {
    minHeight: 220,
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
  errorText: {
    color: '#B42318',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DEE3DE',
    backgroundColor: '#FFFFFF',
    padding: 14,
    gap: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2E3A2F',
  },
  emptyText: {
    color: '#677467',
    fontSize: 13,
  },
  primaryButton: {
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: '#2F9B47',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 180,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
