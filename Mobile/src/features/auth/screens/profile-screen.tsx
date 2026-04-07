import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { useAuth } from '@/src/features/auth/auth-context';
import { authApi } from '@/src/features/auth/auth-api';
import { ApiClientError } from '@/src/types/api';

// ── Change Password Modal ─────────────────────────────────────────────────

interface CambiarPasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

function CambiarPasswordModal({ visible, onClose }: CambiarPasswordModalProps) {
  const [passwordActual, setPasswordActual] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [loading, setLoading] = useState(false);
  const [showActual, setShowActual] = useState(false);
  const [showNueva, setShowNueva] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);

  const resetFields = () => {
    setPasswordActual('');
    setNuevaPassword('');
    setConfirmar('');
    setShowActual(false);
    setShowNueva(false);
    setShowConfirmar(false);
  };

  const handleClose = () => {
    resetFields();
    onClose();
  };

  const handleActualizar = async () => {
    if (!passwordActual || !nuevaPassword || !confirmar) {
      Alert.alert('Campos requeridos', 'Por favor completa todos los campos.');
      return;
    }
    if (nuevaPassword.length < 8) {
      Alert.alert('Contraseña muy corta', 'La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (nuevaPassword !== confirmar) {
      Alert.alert('No coinciden', 'La nueva contraseña y la confirmación no son iguales.');
      return;
    }

    setLoading(true);
    try {
      await authApi.cambiarPassword(passwordActual, nuevaPassword);
      Alert.alert('¡Listo!', 'Tu contraseña fue actualizada exitosamente.', [
        { text: 'Aceptar', onPress: handleClose },
      ]);
    } catch (error) {
      const msg =
        error instanceof ApiClientError
          ? error.message
          : 'Ocurrió un error al actualizar la contraseña.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={modal.overlay} onPress={handleClose}>
        <Pressable style={modal.sheet} onPress={() => {}}>
          {/* Header */}
          <View style={modal.header}>
            <Text style={modal.title}>Cambiar contraseña</Text>
            <Pressable onPress={handleClose} style={modal.closeBtn} hitSlop={10}>
              <Feather name="x" size={20} color="#555" />
            </Pressable>
          </View>

          {/* Contraseña actual */}
          <Text style={modal.label}>Contraseña actual</Text>
          <View style={modal.inputWrapper}>
            <TextInput
              style={modal.input}
              placeholder="Contraseña actual"
              placeholderTextColor="#BBBBBB"
              secureTextEntry={!showActual}
              value={passwordActual}
              onChangeText={setPasswordActual}
              autoCapitalize="none"
            />
            <Pressable onPress={() => setShowActual((v) => !v)} style={modal.eyeBtn}>
              <Feather name={showActual ? 'eye-off' : 'eye'} size={18} color="#888" />
            </Pressable>
          </View>

          {/* Nueva contraseña */}
          <Text style={modal.label}>Nueva contraseña</Text>
          <View style={modal.inputWrapper}>
            <TextInput
              style={modal.input}
              placeholder="Mínimo 8 caracteres"
              placeholderTextColor="#BBBBBB"
              secureTextEntry={!showNueva}
              value={nuevaPassword}
              onChangeText={setNuevaPassword}
              autoCapitalize="none"
            />
            <Pressable onPress={() => setShowNueva((v) => !v)} style={modal.eyeBtn}>
              <Feather name={showNueva ? 'eye-off' : 'eye'} size={18} color="#888" />
            </Pressable>
          </View>

          {/* Confirmar contraseña */}
          <Text style={modal.label}>Confirmar nueva contraseña</Text>
          <View style={modal.inputWrapper}>
            <TextInput
              style={modal.input}
              placeholder="Repite la nueva contraseña"
              placeholderTextColor="#BBBBBB"
              secureTextEntry={!showConfirmar}
              value={confirmar}
              onChangeText={setConfirmar}
              autoCapitalize="none"
            />
            <Pressable onPress={() => setShowConfirmar((v) => !v)} style={modal.eyeBtn}>
              <Feather name={showConfirmar ? 'eye-off' : 'eye'} size={18} color="#888" />
            </Pressable>
          </View>

          {/* Botón */}
          <Pressable
            style={({ pressed }) => [modal.submitBtn, pressed && modal.pressed, loading && modal.btnDisabled]}
            onPress={handleActualizar}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#FFFFFF" />
              : <Text style={modal.submitText}>Actualizar Contraseña</Text>
            }
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Pantalla principal ─────────────────────────────────────────────────────
export function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [notifPush, setNotifPush] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const nombre = user?.nombreCompleto ?? 'Usuario';
  const username = user?.username ?? '';
  const rol = user?.rol ?? 'Sin rol';

  // Color de badge según rol
  const rolColor = rol.toLowerCase().includes('administrador')
    ? '#2E7D32'
    : rol.toLowerCase().includes('veterinario')
    ? '#6A1B9A'
    : rol.toLowerCase().includes('produccion')
    ? '#1565C0'
    : rol.toLowerCase().includes('campo')
    ? '#E65100'
    : rol.toLowerCase().includes('almacen')
    ? '#AD6800'
    : '#455A64';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>

      {/* ── Top Bar ─────────────────────────────────── */}
      <View style={styles.topBar}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()}>
          <Feather name="chevron-left" size={26} color="#1A1A1A" />
        </Pressable>

        <Image
          source={require('../../../../assets/images/logo-rancho-los-alpes.png')}
          style={styles.topLogo}
          resizeMode="contain"
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Tarjeta de perfil ─────────────────────── */}
        <View style={styles.profileCard}>
          {/* Avatar */}
          <View style={styles.avatarCircle}>
            <Feather name="user" size={48} color="#AAAAAA" />
          </View>

          {/* Datos */}
          <Text style={styles.nombre}>{nombre}</Text>
          <Text style={styles.username}>@{username}</Text>

          {/* Badge rol */}
          <View style={[styles.rolBadge, { backgroundColor: rolColor }]}>
            <Text style={styles.rolText}>{rol}</Text>
          </View>
        </View>

        {/* ── Ajustes ───────────────────────────────── */}
        <View style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>Ajustes</Text>

          {/* Cambiar contraseña */}
          <Pressable
            style={({ pressed }) => [styles.settingsRow, pressed && styles.pressed]}
            onPress={() => setModalVisible(true)}
          >
            <View style={styles.settingsLeft}>
              <Feather name="lock" size={18} color="#555" />
              <Text style={styles.settingsLabel}>Cambiar contraseña</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#AAAAAA" />
          </Pressable>
        </View>

        {/* ── Info del sistema ──────────────────────── */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Información del sistema</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Sistema</Text>
            <Text style={styles.infoValue}>SIGGAB</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Rancho</Text>
            <Text style={styles.infoValue}>Los Alpes</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ID Usuario</Text>
            <Text style={styles.infoValue}>#{user?.idUsuario}</Text>
          </View>
        </View>

      </ScrollView>

      {/* ── Modal Cambiar Contraseña ─────────────────── */}
      <CambiarPasswordModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

// ── Estilos la pantalla ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F8F5' },

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

  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 48, gap: 16 },

  // Profile card
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  nombre: { fontSize: 20, fontWeight: '800', color: '#1B241B' },
  username: { fontSize: 14, color: '#7A8A7A', fontWeight: '500' },
  rolBadge: {
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
  },
  rolText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },

  // Settings card
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  settingsTitle: { fontSize: 15, fontWeight: '800', color: '#1B241B', marginBottom: 10 },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderRadius: 10,
    paddingHorizontal: 4,
  },
  settingsLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingsLabel: { fontSize: 15, color: '#333', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 2 },

  // Info card
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    gap: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  infoTitle: { fontSize: 15, fontWeight: '800', color: '#1B241B', marginBottom: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  infoLabel: { fontSize: 13, color: '#7A8A7A', fontWeight: '500' },
  infoValue: { fontSize: 13, color: '#1B241B', fontWeight: '700' },

  pressed: { opacity: 0.82 },
});

// ── Estilos del modal ─────────────────────────────────────────────────────
const modal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: { fontSize: 18, fontWeight: '800', color: '#1B241B' },
  closeBtn: { padding: 4 },
  label: { fontSize: 13, color: '#555', fontWeight: '600', marginTop: 6 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 12,
    marginBottom: 2,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: '#1B241B',
  },
  eyeBtn: { padding: 6 },
  submitBtn: {
    backgroundColor: '#2E7D32',
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.85 },
  btnDisabled: { opacity: 0.6 },
});
