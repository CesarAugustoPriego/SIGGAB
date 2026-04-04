import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/src/features/auth/auth-context';
import { LoadingScreen } from '@/src/shared/components/loading-screen';

export default function AppLayout() {
  const { status } = useAuth();

  if (status === 'booting') {
    return <LoadingScreen label="Preparando aplicacion..." />;
  }

  if (status === 'unauthenticated') {
    return <Redirect href="/(auth)/login" />;
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
    </Stack>
  );
}
