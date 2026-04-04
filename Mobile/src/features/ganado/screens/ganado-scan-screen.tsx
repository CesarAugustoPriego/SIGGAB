import { useState } from 'react';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { Feather } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ganadoApi } from '../ganado-api';
import { getGanadoErrorMessage } from '../ganado-utils';

export function GanadoScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const [scannerEnabled, setScannerEnabled] = useState(true);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [manualArete, setManualArete] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const openAnimalDetail = (idAnimal: number) => {
    router.replace({
      pathname: '/(app)/ganado/[id]',
      params: { id: String(idAnimal) },
    });
  };

  const searchByArete = async (rawArete: string) => {
    const arete = rawArete.trim();
    if (!arete) {
      setMessage('Ingresa o escanea un numero de arete valido.');
      return;
    }

    setBusy(true);
    setMessage(null);
    setLastScan(arete);

    try {
      const animal = await ganadoApi.getAnimalByArete(arete);
      Alert.alert('Animal encontrado', `Arete: ${animal.numeroArete}`, [
        {
          text: 'Ver detalle',
          onPress: () => openAnimalDetail(animal.idAnimal),
        },
        {
          text: 'Seguir escaneando',
          onPress: () => {
            setScannerEnabled(true);
          },
        },
      ]);
    } catch (error) {
      setMessage(getGanadoErrorMessage(error));
      setScannerEnabled(true);
    } finally {
      setBusy(false);
    }
  };

  const onBarcodeScanned = async (result: BarcodeScanningResult) => {
    if (!scannerEnabled || busy) return;
    setScannerEnabled(false);
    await searchByArete(result.data);
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerBox}>
          <ActivityIndicator color="#2F9B47" />
          <Text style={styles.centerText}>Solicitando permisos de camara...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerBox}>
          <Text style={styles.centerTitle}>Permiso de camara requerido</Text>
          <Text style={styles.centerText}>
            Para escanear aretes necesitamos acceso a la camara del dispositivo.
          </Text>
          <Pressable style={styles.mainButton} onPress={() => void requestPermission()}>
            <Text style={styles.mainButtonText}>Permitir camara</Text>
          </Pressable>
          <Pressable style={styles.ghostButton} onPress={() => router.back()}>
            <Text style={styles.ghostButtonText}>Volver</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.topBar}>
          <Pressable style={styles.iconButton} onPress={() => router.back()}>
            <Feather name="chevron-left" size={22} color="#111" />
          </Pressable>
          <Text style={styles.title}>Escanear arete</Text>
          <Pressable style={styles.iconButton} onPress={() => setScannerEnabled(true)}>
            <Feather name="refresh-cw" size={16} color="#111" />
          </Pressable>
        </View>

        <Text style={styles.subtitle}>
          Enfoca el numero de arete. Tambien puedes buscarlo manualmente.
        </Text>

        <View style={styles.cameraFrame}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['code128', 'code39', 'ean13', 'ean8', 'upc_a', 'upc_e', 'qr'],
            }}
            onBarcodeScanned={scannerEnabled ? onBarcodeScanned : undefined}
          />
          <View style={styles.overlay}>
            <View style={styles.overlayBox} />
          </View>
        </View>

        <View style={styles.manualWrap}>
          <TextInput
            value={manualArete}
            onChangeText={setManualArete}
            style={styles.input}
            placeholder="Numero de arete"
            placeholderTextColor="#9EA89E"
            autoCapitalize="characters"
          />
          <Pressable
            style={[styles.mainButton, busy ? styles.buttonDisabled : null]}
            onPress={() => void searchByArete(manualArete)}
            disabled={busy}>
            {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.mainButtonText}>Buscar</Text>}
          </Pressable>
        </View>

        {lastScan ? <Text style={styles.lastScan}>Ultimo escaneo: {lastScan}</Text> : null}
        {message ? <Text style={styles.errorText}>{message}</Text> : null}

        {!scannerEnabled && !busy ? (
          <Pressable style={styles.ghostButton} onPress={() => setScannerEnabled(true)}>
            <Text style={styles.ghostButtonText}>Reanudar escaneo</Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#ECEEEC',
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingBottom: 18,
    gap: 10,
  },
  topBar: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E3E5E3',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#121712',
  },
  subtitle: {
    color: '#5A675A',
    fontSize: 13,
  },
  cameraFrame: {
    height: 330,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D2D8D2',
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  overlayBox: {
    width: '78%',
    height: 140,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
  },
  manualWrap: {
    gap: 8,
    marginTop: 2,
  },
  input: {
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D2D8D2',
    paddingHorizontal: 12,
    color: '#1A231A',
  },
  mainButton: {
    minHeight: 44,
    borderRadius: 999,
    backgroundColor: '#2F9B47',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  mainButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  ghostButton: {
    minHeight: 42,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#B8D8BF',
    backgroundColor: '#F7FCF8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  ghostButtonText: {
    color: '#157347',
    fontWeight: '700',
  },
  lastScan: {
    fontSize: 12,
    color: '#4A574A',
    fontWeight: '600',
  },
  errorText: {
    color: '#B42318',
    fontSize: 12,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  centerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A261B',
    textAlign: 'center',
  },
  centerText: {
    color: '#667266',
    textAlign: 'center',
  },
});
