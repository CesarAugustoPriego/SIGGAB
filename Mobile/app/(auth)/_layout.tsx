import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/src/features/auth/auth-context';
import { LoadingScreen } from '@/src/shared/components/loading-screen';

export default function AuthLayout() {
  const { status } = useAuth();

  if (status === 'booting') {
    return <LoadingScreen label="Validando sesión..." />;
  }

  if (status === 'authenticated') {
    return <Redirect href="/(app)/home" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
    </Stack>
  );
}
