import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ganadoApi } from '@/src/features/ganado/ganado-api';
import type { Animal } from '@/src/features/ganado/ganado-types';

const { width: SW } = Dimensions.get('window');

export interface AnimalPickerProps {
  /** Accent color for the picker (matches form theme) */
  accentColor?: string;
  /** Currently selected animal */
  selectedAnimal: Animal | null;
  /** Called when the user selects (or clears) an animal */
  onSelect: (animal: Animal | null) => void;
}

/**
 * Pressable trigger + full-screen modal that:
 *   1. Lists all ACTIVO animals (filterable by arete / raza)
 *   2. Has a camera 📷 button to scan a barcode instead
 */
export function AnimalPicker({ accentColor = '#2F9B47', selectedAnimal, onSelect }: AnimalPickerProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const open = () => setModalOpen(true);
  const close = () => setModalOpen(false);

  const handleSelect = (animal: Animal) => {
    onSelect(animal);
    close();
  };

  return (
    <>
      {/* ── Trigger ── */}
      <Pressable
        onPress={open}
        style={[styles.trigger, selectedAnimal ? { borderColor: accentColor } : null]}
      >
        {selectedAnimal ? (
          <View style={styles.triggerContent}>
            <MaterialCommunityIcons name="cow" size={20} color={accentColor} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.triggerArete, { color: accentColor }]}>
                {selectedAnimal.numeroArete}
              </Text>
              <Text style={styles.triggerMeta}>
                {selectedAnimal.raza?.nombreRaza ?? 'Sin raza'} · {selectedAnimal.edadEstimada} meses · {selectedAnimal.estadoActual}
              </Text>
            </View>
            <Pressable onPress={() => onSelect(null)} hitSlop={8}>
              <Feather name="x-circle" size={18} color="#A0A8A0" />
            </Pressable>
          </View>
        ) : (
          <View style={styles.triggerContent}>
            <Feather name="search" size={16} color="#7A8A7A" />
            <Text style={styles.triggerPlaceholder}>Seleccionar animal...</Text>
            <Feather name="camera" size={16} color="#7A8A7A" />
          </View>
        )}
      </Pressable>

      {/* ── Modal ── */}
      <AnimalListModal
        visible={modalOpen}
        accentColor={accentColor}
        onSelect={handleSelect}
        onClose={close}
      />
    </>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function AnimalListModal({
  visible,
  accentColor,
  onSelect,
  onClose,
}: {
  visible: boolean;
  accentColor: string;
  onSelect: (a: Animal) => void;
  onClose: () => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [scannerActive, setScannerActive] = useState(true);
  const scanBusy = useRef(false);

  const [animales, setAnimales] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [scanError, setScanError] = useState<string | null>(null);

  // Load on open
  useEffect(() => {
    if (!visible) return;
    setQuery('');
    setScanError(null);
    setCameraOpen(false);
    void fetchAnimales();
  }, [visible]);

  const fetchAnimales = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await ganadoApi.getAnimales({ estadoActual: 'ACTIVO' });
      setAnimales(data);
    } catch {
      setLoadError('Error cargando animales. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  // Filter
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return animales;
    return animales.filter(
      (a) =>
        a.numeroArete.toLowerCase().includes(q) ||
        (a.raza?.nombreRaza?.toLowerCase().includes(q) ?? false),
    );
  }, [animales, query]);

  // ─── Camera ───────────────────────────────────────────────────────────────

  const openCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara para escanear aretes.');
        return;
      }
    }
    scanBusy.current = false;
    setScannerActive(true);
    setScanError(null);
    setCameraOpen(true);
  };

  const onBarcodeScanned = useCallback(async (result: BarcodeScanningResult) => {
    if (!scannerActive || scanBusy.current) return;
    scanBusy.current = true;
    setScannerActive(false);
    setCameraOpen(false);
    setScanError(null);

    const scanned = result.data.trim();
    try {
      const animal = await ganadoApi.getAnimalByArete(scanned);
      onSelect(animal);
    } catch {
      setScanError(`Sin resultados para "${scanned}"`);
    }
  }, [scannerActive, onSelect]);

  const BOX = SW * 0.7;
  const CORNER = 22;
  const CW = 3;

  // ─── Camera sub-modal ─────────────────────────────────────────────────────

  if (cameraOpen) {
    return (
      <Modal visible animationType="slide" onRequestClose={() => setCameraOpen(false)}>
        <View style={scan.modal}>
          <View style={scan.topBar}>
            <Pressable style={scan.closeBtn} onPress={() => setCameraOpen(false)}>
              <Feather name="arrow-left" size={22} color="#FFF" />
            </Pressable>
            <Text style={scan.title}>Escanear arete</Text>
            <Pressable style={scan.closeBtn} onPress={() => { scanBusy.current = false; setScannerActive(true); }}>
              <Feather name="refresh-cw" size={18} color="#FFF" />
            </Pressable>
          </View>

          <CameraView
            style={scan.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['code128', 'code39', 'ean13', 'ean8', 'qr'] }}
            onBarcodeScanned={scannerActive ? onBarcodeScanned : undefined}
          />

          {/* Viewfinder corners */}
          <View style={scan.overlay} pointerEvents="none">
            <View style={[scan.corner, { top: '30%', left: (SW - BOX) / 2, borderTopWidth: CW, borderLeftWidth: CW, borderTopLeftRadius: 6, borderColor: accentColor }]} />
            <View style={[scan.corner, { top: '30%', right: (SW - BOX) / 2, borderTopWidth: CW, borderRightWidth: CW, borderTopRightRadius: 6, borderColor: accentColor }]} />
            <View style={[scan.corner, { top: '55%', left: (SW - BOX) / 2, borderBottomWidth: CW, borderLeftWidth: CW, borderBottomLeftRadius: 6, borderColor: accentColor }]} />
            <View style={[scan.corner, { top: '55%', right: (SW - BOX) / 2, borderBottomWidth: CW, borderRightWidth: CW, borderBottomRightRadius: 6, borderColor: accentColor }]} />
          </View>

          <View style={scan.footer}>
            <Text style={scan.hint}>Enfoca el código de barras o QR del arete</Text>
            {!scannerActive && (
              <Pressable
                style={[scan.resumeBtn, { backgroundColor: accentColor }]}
                onPress={() => { scanBusy.current = false; setScannerActive(true); }}
              >
                <Text style={scan.resumeBtnText}>Reanudar escaneo</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>
    );
  }

  // ─── Animal list modal ────────────────────────────────────────────────────

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modal}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Feather name="x" size={20} color="#3A4A3A" />
          </Pressable>
          <Text style={styles.modalTitle}>Seleccionar animal</Text>
          <Pressable style={[styles.cameraBtn, { backgroundColor: accentColor }]} onPress={openCamera}>
            <Feather name="camera" size={17} color="#FFF" />
          </Pressable>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Feather name="search" size={15} color="#8A9A8A" />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar por arete o raza..."
            placeholderTextColor="#A0AAA0"
            autoCapitalize="none"
            autoFocus
            clearButtonMode="while-editing"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Feather name="x" size={15} color="#8A9A8A" />
            </Pressable>
          )}
        </View>

        {/* Scan error */}
        {scanError && (
          <View style={styles.scanErrorBanner}>
            <Feather name="alert-circle" size={14} color="#C0392B" />
            <Text style={styles.scanErrorText}>{scanError}</Text>
          </View>
        )}

        {/* List */}
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color={accentColor} size="large" />
            <Text style={styles.centerText}>Cargando ganado...</Text>
          </View>
        ) : loadError ? (
          <View style={styles.centerBox}>
            <Feather name="wifi-off" size={32} color="#A0A8A0" />
            <Text style={styles.centerText}>{loadError}</Text>
            <Pressable style={[styles.retryBtn, { backgroundColor: accentColor }]} onPress={fetchAnimales}>
              <Text style={styles.retryBtnText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.centerBox}>
            <MaterialCommunityIcons name="cow-off" size={36} color="#B0BAB0" />
            <Text style={styles.centerText}>
              {query ? `Sin resultados para "${query}"` : 'No hay animales activos.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(a) => String(a.idAnimal)}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                onPress={() => onSelect(item)}
                style={({ pressed }) => [styles.animalRow, pressed && styles.animalRowPressed]}
              >
                <View style={[styles.animalRowIcon, { backgroundColor: `${accentColor}18` }]}>
                  <MaterialCommunityIcons name="cow" size={20} color={accentColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowArete, { color: accentColor }]}>{item.numeroArete}</Text>
                  <Text style={styles.rowMeta}>
                    {item.raza?.nombreRaza ?? 'Sin raza'} · {item.edadEstimada ?? '?'} meses
                  </Text>
                </View>
                <View style={styles.rowRight}>
                  <Text style={styles.rowPeso}>{Number(item.pesoInicial).toFixed(0)} kg</Text>
                  <Feather name="chevron-right" size={16} color="#B0BAB0" />
                </View>
              </Pressable>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}

        {/* Count footer */}
        {!loading && !loadError && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {filtered.length} de {animales.length} animales activos
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Trigger
  trigger: {
    borderWidth: 1, borderColor: '#DDE3DD', borderRadius: 12,
    backgroundColor: '#F8FAF8', minHeight: 52, justifyContent: 'center', paddingHorizontal: 12,
  },
  triggerContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  triggerArete: { fontSize: 15, fontWeight: '800' },
  triggerMeta: { fontSize: 11, color: '#7A8A7A', marginTop: 1 },
  triggerPlaceholder: { flex: 1, fontSize: 14, color: '#9A9A9A' },

  // Modal
  modal: { flex: 1, backgroundColor: '#F4F6F4' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E0E8E0',
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#1A2D1A' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
  cameraBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  // Search
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    margin: 12, paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#DDE3DD',
  },
  searchInput: { flex: 1, fontSize: 15, color: '#1A2D1A' },

  // Scan error
  scanErrorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: 12, marginBottom: 8,
    backgroundColor: '#FFECEC', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#F4C4C4',
  },
  scanErrorText: { color: '#C0392B', fontSize: 12, fontWeight: '600', flex: 1 },

  // List
  list: { paddingHorizontal: 12, paddingBottom: 24 },
  animalRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#E4EBE4',
  },
  animalRowPressed: { opacity: 0.82 },
  animalRowIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  rowArete: { fontSize: 14, fontWeight: '800' },
  rowMeta: { fontSize: 11, color: '#7A8A7A', marginTop: 1 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowPeso: { fontSize: 12, fontWeight: '700', color: '#5A6A5A' },
  separator: { height: 6 },

  // States
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  centerText: { fontSize: 13, color: '#7A8A7A', textAlign: 'center' },
  retryBtn: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 24 },
  retryBtnText: { color: '#FFF', fontWeight: '700' },

  // Footer
  footer: {
    paddingVertical: 10, paddingHorizontal: 16,
    borderTopWidth: 1, borderTopColor: '#E0E8E0', backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  footerText: { fontSize: 11, color: '#8A9A8A' },
});

// Scan modal styles
const scan = StyleSheet.create({
  modal: { flex: 1, backgroundColor: '#000' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 16 },
  title: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  camera: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, pointerEvents: 'none' },
  corner: { position: 'absolute', width: 22, height: 22 },
  footer: { backgroundColor: '#000', padding: 20, gap: 12, alignItems: 'center' },
  hint: { color: '#AAB8AA', fontSize: 13, textAlign: 'center' },
  resumeBtn: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 28 },
  resumeBtnText: { color: '#FFF', fontWeight: '700' },
});
