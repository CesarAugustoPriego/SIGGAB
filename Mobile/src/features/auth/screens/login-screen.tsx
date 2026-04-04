import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { env } from '@/src/config/env';
import { useAuth } from '@/src/features/auth/auth-context';

export function LoginScreen() {
  const { login, apiError, clearApiError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => username.trim().length >= 3 && password.length >= 6, [username, password]);

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;

    clearApiError();
    setSubmitting(true);

    try {
      await login({
        username: username.trim(),
        password,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.select({ ios: 'padding', default: undefined })}>
        <View style={styles.header}>
          <Text style={styles.title}>SIGGAB Móvil</Text>
          <Text style={styles.subtitle}>Acceso de campo · Rancho Los Alpes</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Iniciar sesión</Text>
          <Text style={styles.cardHint}>
            Usa tu cuenta del sistema para registrar y consultar información autorizada por tu rol.
          </Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Usuario</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="ej. admin"
              placeholderTextColor="#8AA08A"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor="#8AA08A"
            />
          </View>

          {apiError ? <Text style={styles.errorText}>{apiError}</Text> : null}

          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit || submitting}
            style={({ pressed }) => [
              styles.primaryButton,
              (!canSubmit || submitting) && styles.primaryButtonDisabled,
              pressed && canSubmit && !submitting ? styles.primaryButtonPressed : null,
            ]}>
            {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Entrar</Text>}
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>API configurada: {env.apiBaseUrl}</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#E8F4E8',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    gap: 18,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#14532D',
  },
  subtitle: {
    fontSize: 14,
    color: '#2F5A38',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: '#CDE3CD',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F3A1F',
  },
  cardHint: {
    fontSize: 13,
    color: '#4A664F',
    lineHeight: 18,
  },
  formGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2B4F2F',
  },
  input: {
    borderWidth: 1,
    borderColor: '#BFD7BF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1B2D1B',
    backgroundColor: '#F8FCF8',
  },
  errorText: {
    color: '#B42318',
    fontSize: 13,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#157347',
    borderRadius: 10,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonPressed: {
    opacity: 0.9,
  },
  primaryButtonDisabled: {
    backgroundColor: '#7EA78E',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 6,
  },
  footerText: {
    color: '#55715B',
    fontSize: 12,
  },
});
