import { Redirect } from 'expo-router';

import { useAuth } from '@/src/features/auth/auth-context';
import { LoadingScreen } from '@/src/shared/components/loading-screen';

export default function IndexRedirect() {
  const { status } = useAuth();

  if (status === 'booting') {
    return <LoadingScreen label="Cargando sesión..." />;
  }

  if (status === 'authenticated') {
    return <Redirect href="/(app)/home" />;
  }

  return <Redirect href="/(auth)/login" />;
}
