import { Redirect, Stack, useSegments } from 'expo-router';

import { useAuth } from '@/src/features/auth/auth-context';
import {
  canApproveProductivo,
  canApproveSanitario,
  canBajaAnimal,
  canCreateAnimal,
  canCreateEventoReproductivo,
  canCreateInventarioMovimiento,
  canCreateProductivoRegistros,
  canEditAnimal,
  canViewEventosReproductivos,
  canViewGanado,
  canViewInventario,
  canViewReportes,
  canViewSanitario,
} from '@/src/features/auth/role-permissions';
import { LoadingScreen } from '@/src/shared/components/loading-screen';

function canAccessRoute(roleName: string | undefined, segments: string[]) {
  const route = segments.filter((segment) => !segment.startsWith('('));
  const [moduleName, screenName] = route;

  if (!moduleName || moduleName === 'home' || moduleName === 'perfil') return true;

  if (moduleName === 'ganado') {
    if (screenName === 'registrar') return canCreateAnimal(roleName);
    if (screenName === 'editar') return canEditAnimal(roleName);
    if (screenName === 'baja') return canBajaAnimal(roleName);
    return canViewGanado(roleName);
  }

  if (moduleName === 'sanitario') {
    return canViewSanitario(roleName);
  }

  if (moduleName === 'productivo') {
    if (screenName === 'registro-peso' || screenName === 'registro-leche') {
      return canCreateProductivoRegistros(roleName);
    }
    if (screenName === 'registro-reproductivo') {
      return canCreateEventoReproductivo(roleName);
    }
    return canViewEventosReproductivos(roleName);
  }

  if (moduleName === 'inventario') {
    if (screenName === 'registro-movimiento') return canCreateInventarioMovimiento(roleName);
    return canViewInventario(roleName);
  }

  if (moduleName === 'aprobaciones') {
    return canApproveProductivo(roleName) || canApproveSanitario(roleName);
  }

  if (moduleName === 'reportes') {
    return canViewReportes(roleName);
  }

  return false;
}

export default function AppLayout() {
  const { status, user } = useAuth();
  const segments = useSegments();

  if (status === 'booting') {
    return <LoadingScreen label="Preparando aplicacion..." />;
  }

  if (status === 'unauthenticated') {
    return <Redirect href="/(auth)/login" />;
  }

  if (!canAccessRoute(user?.rol, segments)) {
    return <Redirect href="/(app)/home" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home" />
      <Stack.Screen name="ganado/index" />
      <Stack.Screen name="ganado/registrar" />
      <Stack.Screen name="ganado/escanear" />
      <Stack.Screen name="ganado/editar" />
      <Stack.Screen name="ganado/baja" />
      <Stack.Screen name="ganado/[id]" />
      <Stack.Screen name="sanitario/index" />
      <Stack.Screen name="sanitario/calendario" />
      <Stack.Screen name="productivo/index" />
      <Stack.Screen name="productivo/registro-peso" />
      <Stack.Screen name="productivo/registro-leche" />
      <Stack.Screen name="productivo/registro-reproductivo" />
      <Stack.Screen name="inventario/index" />
      <Stack.Screen name="inventario/registro-movimiento" />
      <Stack.Screen name="aprobaciones/index" />
      <Stack.Screen name="reportes/index" />
      <Stack.Screen name="perfil" />
    </Stack>
  );
}
