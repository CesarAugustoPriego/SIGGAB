import { useMemo, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
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
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

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
    } catch {
      // Error already managed by AuthContext (apiError).
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterTab = () => {
    setActiveTab('register');
    Alert.alert(
      'Registro pendiente',
      'La vista de registro movil se habilitara en la siguiente iteracion.'
    );
  };

  const handleLoginTab = () => {
    setActiveTab('login');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topbar}>
        <Text style={styles.topbarTitle}>Inicio</Text>
      </View>

      <KeyboardAvoidingView style={styles.container} behavior={Platform.select({ ios: 'padding', default: undefined })}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <ImageBackground
            source={require('../../../../assets/images/auth-hero-register.jpg')}
            style={styles.hero}
            imageStyle={styles.heroImage}>
            <View style={styles.heroOverlay} />
            <View style={styles.logoWrap}>
              <Image source={require('../../../../assets/images/logo-rancho-los-alpes.png')} style={styles.logo} />
            </View>
          </ImageBackground>

          <View style={styles.cardWrap}>
            <View style={styles.card}>
              <View style={styles.tabs}>
                <Pressable
                  onPress={handleLoginTab}
                  style={[styles.tabButton, activeTab === 'login' ? styles.tabButtonActive : null]}>
                  <Text style={[styles.tabText, activeTab === 'login' ? styles.tabTextActive : null]}>Iniciar sesion</Text>
                </Pressable>

                <Pressable
                  onPress={handleRegisterTab}
                  style={[styles.tabButton, activeTab === 'register' ? styles.tabButtonActive : null]}>
                  <Text style={[styles.tabText, activeTab === 'register' ? styles.tabTextActive : null]}>Registrarse</Text>
                </Pressable>
              </View>

              <Text style={styles.welcomeTitle}>Bienvenido a Siggab</Text>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Correo electronico:</Text>
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="admin"
                  placeholderTextColor="#94A39A"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Contrasena:</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  style={styles.input}
                  secureTextEntry
                  placeholder="********"
                  placeholderTextColor="#94A39A"
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
                {submitting
                  ? <ActivityIndicator color="#FFFFFF" />
                  : <Text style={styles.primaryButtonText}>Iniciar sesion</Text>}
              </Pressable>

              <Text style={styles.linkCaption}>
                No tienes cuenta? <Text style={styles.linkText}>Registrate</Text>
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>API: {env.apiBaseUrl}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#101214',
  },
  topbar: {
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: 14,
    backgroundColor: '#1A1D20',
  },
  topbarTitle: {
    color: '#C8CDD2',
    fontSize: 15,
    fontWeight: '500',
  },
  container: {
    flex: 1,
    backgroundColor: '#F4F5F4',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  hero: {
    minHeight: 420,
    justifyContent: 'flex-start',
    paddingTop: 44,
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroImage: {
    resizeMode: 'cover',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18, 38, 25, 0.38)',
  },
  logoWrap: {
    width: 214,
    height: 214,
    borderRadius: 107,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
  cardWrap: {
    marginTop: -60,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#F5F6F5',
    borderRadius: 26,
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: '#E1E3E1',
  },
  tabs: {
    flexDirection: 'row',
    alignSelf: 'center',
    borderRadius: 999,
    backgroundColor: '#DFE2DF',
    padding: 4,
    gap: 4,
  },
  tabButton: {
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#46AE4F',
  },
  tabText: {
    color: '#EEF2EE',
    fontSize: 13,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  welcomeTitle: {
    fontSize: 29,
    fontWeight: '700',
    color: '#131714',
    lineHeight: 34,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#202522',
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#8B938D',
    paddingHorizontal: 2,
    paddingVertical: 8,
    fontSize: 16,
    color: '#172019',
    backgroundColor: 'transparent',
  },
  errorText: {
    color: '#B42318',
    fontSize: 12,
    fontWeight: '600',
    marginTop: -4,
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: '#47AF4F',
    borderRadius: 999,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonPressed: {
    opacity: 0.86,
  },
  primaryButtonDisabled: {
    backgroundColor: '#9FCBA4',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  linkCaption: {
    textAlign: 'center',
    color: '#4F5651',
    fontSize: 14,
    marginTop: 4,
  },
  linkText: {
    color: '#3AA14C',
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  footerText: {
    color: '#7A807C',
    fontSize: 11,
  },
});
