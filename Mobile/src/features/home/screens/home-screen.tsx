import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuth } from '@/src/features/auth/auth-context';
import {
  canViewAprobaciones,
  canViewCalendarioSanitario,
  canViewGanado,
  canViewInventario,
  canViewProductivo,
  canViewReportes,
  canViewSanitario,
  canViewSanitarioRecords,
} from '@/src/features/auth/role-permissions';
import { fetchHomeStats, type HomeStats } from '@/src/lib/home-dashboard-api';
import { NavDrawer } from '@/src/shared/components/nav-drawer';

// ── Tipos ─────────────────────────────────────────────────────────────────
interface QuickAction {
  key: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap | null;
  featherIcon?: keyof typeof Feather.glyphMap;
  color: string;
  route: string;
}

// ── Accesos rápidos — 100% por rol y con rutas verificadas ─────────────────
function getQuickActions(rol: string | undefined): QuickAction[] {
  const actions: QuickAction[] = [];

  // Campo y quienes pueden ver ganado → escanear es siempre el primero
  if (canViewGanado(rol)) {
    actions.push({
      key: 'escanear',
      label: 'Escanear',
      icon: 'barcode-scan',
      color: '#2E7D32',
      route: '/(app)/ganado/escanear',
    });
    actions.push({
      key: 'ganado',
      label: 'Hato',
      icon: 'cow',
      color: '#388E3C',
      route: '/(app)/ganado',
    });
  }

  // Productivo: registro de peso y leche
  if (canViewProductivo(rol)) {
    actions.push({
      key: 'peso',
      label: 'Pesar',
      icon: 'scale-bathroom',
      color: '#1565C0',
      route: '/(app)/productivo/registro-peso',
    });
    actions.push({
      key: 'leche',
      label: 'Leche',
      icon: 'cup',
      color: '#0277BD',
      route: '/(app)/productivo/registro-leche',
    });
  }

  // Sanitario — si puede ver el calendario lo mandamos ahí,
  // si solo puede ver eventos (campo), lo mandamos a eventos
  if (canViewSanitario(rol) && !canViewProductivo(rol)) {
    if (canViewCalendarioSanitario(rol)) {
      actions.push({
        key: 'calendario',
        label: 'Calendario',
        icon: 'calendar-check',
        color: '#6A1B9A',
        route: '/(app)/sanitario/calendario',
      });
    }
    actions.push({
      key: 'eventos',
      label: 'Eventos',
      icon: 'heart-pulse',
      color: '#AD1457',
      route: '/(app)/sanitario',
    });
  }

  // Inventario
  if (canViewInventario(rol)) {
    actions.push({
      key: 'inventario',
      label: 'Inventario',
      icon: 'package-variant-closed',
      color: '#E65100',
      route: '/(app)/inventario',
    });
  }

  // Aprobaciones
  if (canViewAprobaciones(rol)) {
    actions.push({
      key: 'aprobaciones',
      label: 'Aprobar',
      icon: 'check-circle-outline',
      color: '#00695C',
      route: '/(app)/aprobaciones',
    });
  }

  // Reportes
  if (canViewReportes(rol)) {
    actions.push({
      key: 'reportes',
      label: 'Reportes',
      icon: null, // usa featherIcon
      featherIcon: 'file-text',
      color: '#4527A0',
      route: '/(app)/reportes',
    });
  }

  return actions.slice(0, 4); // máx 4 en la fila
}

// ── Rutas correctas del sanitario según rol ───────────────────────────────
function getSanitarioRoute(rol: string | undefined): string {
  // Veterinarios y admin ven el calendario como pantalla principal
  if (canViewCalendarioSanitario(rol)) return '/(app)/sanitario/calendario';
  // Campo ven la lista de eventos
  return '/(app)/sanitario';
}

// ── Componente principal ──────────────────────────────────────────────────
export function HomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [stats, setStats] = useState<HomeStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  // Animación de aparición de los stats
  const statsOpacity = useRef(new Animated.Value(0)).current;

  const rol = user?.rol;
  const quickActions = useMemo(() => getQuickActions(rol), [rol]);
  const sanitarioRoute = useMemo(() => getSanitarioRoute(rol), [rol]);

  useEffect(() => {
    setLoadingStats(true);
    fetchHomeStats(rol)
      .then((s) => {
        setStats(s);
        Animated.timing(statsOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      })
      .finally(() => setLoadingStats(false));
  }, [rol, statsOpacity]);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try { await logout(); } finally { setLoggingOut(false); }
  };

  // ── Items del drawer por rol ────────────────────────────────────────────
  const navItems = useMemo(() => {
    const items = [];

    items.push({
      key: 'inicio',
      label: 'Inicio',
      icon: <Feather name="home" size={20} color="#2E7D32" />,
      onPress: () => router.replace('/(app)/home'),
    });

    if (canViewGanado(rol)) {
      items.push({
        key: 'ganado',
        label: 'Gestión de Ganado',
        icon: <MaterialCommunityIcons name="cow" size={20} color="#4A6A4A" />,
        onPress: () => router.push('/(app)/ganado' as never),
      });
    }
    if (canViewSanitario(rol)) {
      // La ruta del sanitario en el drawer también respeta el rol
      items.push({
        key: 'sanitario',
        label: canViewSanitarioRecords(rol) ? 'Sanitario / Calendario' : 'Eventos Sanitarios',
        icon: <MaterialCommunityIcons name="heart-pulse" size={20} color="#4A6A4A" />,
        onPress: () => router.push(sanitarioRoute as never),
      });
    }
    if (canViewProductivo(rol)) {
      items.push({
        key: 'productivo',
        label: 'Control Productivo',
        icon: <MaterialCommunityIcons name="scale-bathroom" size={20} color="#4A6A4A" />,
        onPress: () => router.push('/(app)/productivo' as never),
      });
    }
    if (canViewInventario(rol)) {
      items.push({
        key: 'inventario',
        label: 'Inventario',
        icon: <MaterialCommunityIcons name="package-variant-closed" size={20} color="#4A6A4A" />,
        onPress: () => router.push('/(app)/inventario' as never),
      });
    }
    if (canViewAprobaciones(rol)) {
      items.push({
        key: 'aprobaciones',
        label: 'Aprobaciones',
        icon: <MaterialCommunityIcons name="check-circle-outline" size={20} color="#4A6A4A" />,
        onPress: () => router.push('/(app)/aprobaciones' as never),
      });
    }
    if (canViewReportes(rol)) {
      items.push({
        key: 'reportes',
        label: 'Reportes',
        icon: <Feather name="file-text" size={20} color="#4A6A4A" />,
        onPress: () => router.push('/(app)/reportes' as never),
      });
    }

    return items;
  }, [rol, router, sanitarioRoute]);

  const firstName = user?.nombreCompleto?.split(' ')[0] ?? 'Usuario';
  const roleDisplay = user?.rol ?? 'Sin Rol';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>

      {/* ── Top Bar ─────────────────────────────────── */}
      <View style={styles.topBar}>
        <Pressable style={styles.iconBtn} onPress={() => setDrawerOpen(true)}>
          <Feather name="menu" size={24} color="#1A1A1A" />
        </Pressable>

        <Image
          source={require('../../../../assets/images/logo-rancho-los-alpes.png')}
          style={styles.topLogo}
          resizeMode="contain"
        />

        <Pressable style={styles.iconBtn} onPress={() => {}}>
          <Feather name="bell" size={22} color="#1A1A1A" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Tarjeta de bienvenida ─────────────────── */}
        <View style={styles.greetingCard}>
          <View style={styles.greetingText}>
            <Text style={styles.greetingHola}>¡Hola, {firstName}!</Text>
            <Text style={styles.greetingRole}>Perfil: {roleDisplay}</Text>
          </View>
          <View style={styles.avatarBtn}>
            <Pressable onPress={() => router.push('/(app)/perfil' as never)} style={{ alignItems: 'center', gap: 4 }}>
              <Feather name="user" size={26} color="#FFFFFF" />
              <Text style={styles.avatarBtnLabel}>Mi perfil</Text>
            </Pressable>
          </View>
        </View>

        {/* ── Stats ──────────────────────────────────── */}
        <Animated.View style={[styles.statsRow, { opacity: statsOpacity }]}>
          {/* Stat 1: Total Hato */}
          <View style={[styles.statCard, styles.statCardGreen]}>
            <MaterialCommunityIcons name="cow" size={24} color="rgba(255,255,255,0.85)" />
            {loadingStats
              ? <ActivityIndicator color="#fff" style={styles.statLoader} />
              : <Text style={styles.statNumber}>{stats?.totalHato ?? 0}</Text>
            }
            <Text style={styles.statLabelLight}>TOTAL HATO</Text>
          </View>

          {/* Stat 2: Dinámico por rol */}
          <View style={[styles.statCard, styles.statCardWhite]}>
            <MaterialCommunityIcons
              name={
                canViewAprobaciones(rol) ? 'clipboard-check-outline'
                : canViewInventario(rol) ? 'package-variant'
                : canViewSanitario(rol) ? 'calendar-clock'
                : 'chart-line'
              }
              size={24}
              color="#2E7D32"
            />
            {loadingStats
              ? <ActivityIndicator color="#2E7D32" style={styles.statLoader} />
              : <Text style={styles.statNumberDark}>{stats?.secondValue ?? 0}</Text>
            }
            <Text style={styles.statLabelDark}>{stats?.secondLabel ?? '—'}</Text>
          </View>
        </Animated.View>

        {/* ── Accesos Rápidos ────────────────────────── */}
        {quickActions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Accesos Rápidos</Text>
            <View style={styles.quickRow}>
              {quickActions.map((action) => (
                <Pressable
                  key={action.key}
                  style={({ pressed }) => [
                    styles.quickCard,
                    { backgroundColor: action.color },
                    pressed && styles.pressed,
                  ]}
                  onPress={() => router.push(action.route as never)}
                >
                  {action.icon
                    ? <MaterialCommunityIcons name={action.icon} size={26} color="#FFFFFF" />
                    : <Feather name={action.featherIcon!} size={24} color="#FFFFFF" />
                  }
                  <Text style={styles.quickLabel}>{action.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* ── Accesos de módulo completo ─────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Módulos</Text>
          <View style={styles.moduleGrid}>

            {canViewGanado(rol) && (
              <Pressable
                style={({ pressed }) => [styles.moduleCard, pressed && styles.pressed]}
                onPress={() => router.push('/(app)/ganado' as never)}
              >
                <View style={[styles.moduleIcon, { backgroundColor: '#E8F5E9' }]}>
                  <MaterialCommunityIcons name="cow" size={24} color="#2E7D32" />
                </View>
                <Text style={styles.moduleTitle}>Ganado</Text>
                <Text style={styles.moduleSub}>Listado y perfiles</Text>
              </Pressable>
            )}

            {canViewSanitario(rol) && (
              <Pressable
                style={({ pressed }) => [styles.moduleCard, pressed && styles.pressed]}
                onPress={() => router.push(sanitarioRoute as never)}
              >
                <View style={[styles.moduleIcon, { backgroundColor: '#FCE4EC' }]}>
                  <MaterialCommunityIcons name="heart-pulse" size={24} color="#AD1457" />
                </View>
                <Text style={styles.moduleTitle}>Sanitario</Text>
                <Text style={styles.moduleSub}>
                  {canViewSanitarioRecords(rol) ? 'Eventos y calendario' : 'Registrar evento'}
                </Text>
              </Pressable>
            )}

            {canViewProductivo(rol) && (
              <Pressable
                style={({ pressed }) => [styles.moduleCard, pressed && styles.pressed]}
                onPress={() => router.push('/(app)/productivo' as never)}
              >
                <View style={[styles.moduleIcon, { backgroundColor: '#E3F2FD' }]}>
                  <MaterialCommunityIcons name="scale-bathroom" size={24} color="#1565C0" />
                </View>
                <Text style={styles.moduleTitle}>Productivo</Text>
                <Text style={styles.moduleSub}>Peso, leche, reproductivo</Text>
              </Pressable>
            )}

            {canViewInventario(rol) && (
              <Pressable
                style={({ pressed }) => [styles.moduleCard, pressed && styles.pressed]}
                onPress={() => router.push('/(app)/inventario' as never)}
              >
                <View style={[styles.moduleIcon, { backgroundColor: '#FFF3E0' }]}>
                  <MaterialCommunityIcons name="package-variant-closed" size={24} color="#E65100" />
                </View>
                <Text style={styles.moduleTitle}>Inventario</Text>
                <Text style={styles.moduleSub}>Entradas y salidas</Text>
              </Pressable>
            )}

            {canViewAprobaciones(rol) && (
              <Pressable
                style={({ pressed }) => [styles.moduleCard, pressed && styles.pressed]}
                onPress={() => router.push('/(app)/aprobaciones' as never)}
              >
                <View style={[styles.moduleIcon, { backgroundColor: '#E0F2F1' }]}>
                  <MaterialCommunityIcons name="check-circle-outline" size={24} color="#00695C" />
                </View>
                <Text style={styles.moduleTitle}>Aprobaciones</Text>
                <Text style={styles.moduleSub}>Validar registros</Text>
              </Pressable>
            )}

            {canViewReportes(rol) && (
              <Pressable
                style={({ pressed }) => [styles.moduleCard, pressed && styles.pressed]}
                onPress={() => router.push('/(app)/reportes' as never)}
              >
                <View style={[styles.moduleIcon, { backgroundColor: '#EDE7F6' }]}>
                  <Feather name="file-text" size={22} color="#4527A0" />
                </View>
                <Text style={styles.moduleTitle}>Reportes</Text>
                <Text style={styles.moduleSub}>PDF y exportación</Text>
              </Pressable>
            )}

          </View>
        </View>
      </ScrollView>

      {/* ── Nav Drawer ──────────────────────────────── */}
      <NavDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        userName={user?.nombreCompleto ?? 'Usuario'}
        userRole={roleDisplay}
        navItems={navItems}
        onLogout={handleLogout}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F8F5' },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    height: 64,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EEE8',
  },
  iconBtn: { padding: 4, width: 40, alignItems: 'center' },
  topLogo: { width: 80, height: 48 },

  // Scroll
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40, gap: 16 },

  // Greeting
  greetingCard: {
    backgroundColor: '#2E7D32',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  greetingText: { flex: 1 },
  greetingHola: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  greetingRole: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500', marginTop: 3 },
  avatarBtn: { alignItems: 'center', gap: 4, paddingLeft: 12 },
  avatarBtnLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },

  // Stats
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  statCardGreen: { backgroundColor: '#2E7D32' },
  statCardWhite: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8EEE8' },
  statLoader: { marginVertical: 4 },
  statNumber: { fontSize: 32, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1 },
  statNumberDark: { fontSize: 32, fontWeight: '900', color: '#1B241B', letterSpacing: -1 },
  statLabelLight: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.8 },
  statLabelDark: { fontSize: 10, fontWeight: '700', color: '#7A8A7A', letterSpacing: 0.8 },

  // Section
  section: { gap: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#1B241B' },

  // Quick actions
  quickRow: { flexDirection: 'row', gap: 10 },
  quickCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.13,
    shadowRadius: 5,
    elevation: 4,
  },
  quickLabel: { fontSize: 11, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' },

  // Module grid
  moduleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  moduleCard: {
    width: '47.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E8EEE8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  moduleIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleTitle: { fontSize: 14, fontWeight: '800', color: '#1B241B' },
  moduleSub: { fontSize: 11, color: '#7A8A7A', fontWeight: '500' },

  pressed: { opacity: 0.82 },
});
