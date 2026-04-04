import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/src/features/auth/auth-context';
import { LoadingScreen } from '@/src/shared/components/loading-screen';

export default function AppLayout() {
  const { status } = useAuth();

  if (status === 'booting') {
    return <LoadingScreen label="Preparando aplicación..." />;
  }

  if (status === 'unauthenticated') {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home" />
    </Stack>
  );
}
