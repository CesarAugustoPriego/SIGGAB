import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuth } from '@/src/features/auth/auth-context';
import {
  canViewCalendarioSanitario,
  getVisibleModulesForRole,
} from '@/src/features/auth/role-permissions';

export function HomeScreen() {
  const router = useRouter();
  const { user, logout, refreshProfile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const visibleModules = useMemo(() => getVisibleModulesForRole(user?.rol), [user?.rol]);

  const onRefreshProfile = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await refreshProfile();
    } finally {
      setRefreshing(false);
    }
  };

  const onLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  const onPressModule = (moduleKey: string, title: string) => {
    if (moduleKey === 'ganado') {
      router.push('/(app)/ganado');
      return;
    }

    if (moduleKey === 'sanitario') {
      if (canViewCalendarioSanitario(user?.rol)) {
        router.push('/(app)/sanitario/calendario');
      } else {
        router.push('/(app)/ganado');
      }
      return;
    }

    Alert.alert(
      `${title} (Proximamente)`,
      'Este modulo quedara habilitado en la siguiente iteracion movil conectada al backend.'
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>SIGGAB</Text>
          <Text style={styles.subtitle}>Panel movil por rol</Text>
        </View>

        <View style={styles.profileCard}>
          <Text style={styles.profileName}>{user?.nombreCompleto || 'Usuario sin sesion'}</Text>
          <Text style={styles.profileMeta}>@{user?.username || 'sin_usuario'}</Text>
          <Text style={styles.roleChip}>{user?.rol || 'Sin rol asignado'}</Text>

          <View style={styles.actionsRow}>
            <Pressable
              onPress={onRefreshProfile}
              disabled={refreshing}
              style={({ pressed }) => [styles.ghostButton, pressed ? styles.pressed : null]}>
              {refreshing
                ? <ActivityIndicator color="#157347" />
                : <Text style={styles.ghostButtonText}>Actualizar perfil</Text>}
            </Pressable>

            <Pressable
              onPress={onLogout}
              disabled={loggingOut}
              style={({ pressed }) => [styles.dangerButton, pressed ? styles.pressed : null]}>
              {loggingOut
                ? <ActivityIndicator color="#FFFFFF" />
                : <Text style={styles.dangerButtonText}>Cerrar sesion</Text>}
            </Pressable>
          </View>
        </View>

        <View style={styles.modulesBlock}>
          <Text style={styles.modulesTitle}>Modulos disponibles</Text>
          <Text style={styles.modulesHint}>
            La visibilidad esta filtrada segun la matriz de permisos oficial del proyecto.
          </Text>

          {visibleModules.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Sin modulos habilitados</Text>
              <Text style={styles.emptyText}>Tu rol actual no tiene permisos moviles habilitados.</Text>
            </View>
          ) : (
            visibleModules.map((module) => (
              <Pressable
                key={module.key}
                onPress={() => onPressModule(module.key, module.title)}
                style={({ pressed }) => [styles.moduleCard, pressed ? styles.pressed : null]}>
                <Text style={styles.moduleTitle}>{module.title}</Text>
                <Text style={styles.moduleDescription}>{module.description}</Text>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F3F9F3',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 18,
    gap: 16,
    paddingBottom: 28,
  },
  header: {
    gap: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E5F36',
  },
  subtitle: {
    fontSize: 14,
    color: '#44624A',
    fontWeight: '500',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#D2E5D2',
    gap: 8,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E2D1E',
  },
  profileMeta: {
    fontSize: 13,
    color: '#58735D',
  },
  roleChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#E6F4EA',
    color: '#176B3A',
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  ghostButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#B8D8BF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7FCF8',
  },
  ghostButtonText: {
    color: '#157347',
    fontWeight: '700',
  },
  dangerButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B42318',
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modulesBlock: {
    gap: 10,
  },
  modulesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#203120',
  },
  modulesHint: {
    fontSize: 13,
    color: '#58735D',
  },
  moduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CFE3CF',
    padding: 12,
    gap: 4,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#155A30',
  },
  moduleDescription: {
    fontSize: 13,
    color: '#416347',
    lineHeight: 18,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E7E0',
    padding: 14,
    gap: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2E3B2F',
  },
  emptyText: {
    fontSize: 13,
    color: '#5E6E60',
  },
  pressed: {
    opacity: 0.88,
  },
});
