import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { inventarioApi } from '../inventario-api';
import type { Insumo, TipoMovimiento } from '../inventario-types';

const ACCENT = '#D35400';

export function RegistroMovimientoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [insumosQuery, setInsumosQuery] = useState('');
  
  const [selectedInsumo, setSelectedInsumo] = useState<Insumo | null>(null);
  const [tipoMovimiento, setTipoMovimiento] = useState<TipoMovimiento>('SALIDA');
  const [cantidad, setCantidad] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    inventarioApi.getInsumos()
      .then(setInsumos)
      .catch(() => setGlobalError('No se pudieron cargar los insumos'));
  }, []);

  const canSave = useMemo(() => {
    return selectedInsumo && cantidad.trim() && parseFloat(cantidad) > 0 && fecha.trim();
  }, [selectedInsumo, cantidad, fecha]);

  const onSubmit = useCallback(async () => {
    if (!canSave || !selectedInsumo) return;
    setSubmitting(true);
    setGlobalError(null);
    try {
      await inventarioApi.createMovimiento({
        idInsumo: selectedInsumo.idInsumo,
        tipoMovimiento,
        cantidad: parseFloat(cantidad),
        fechaMovimiento: fecha,
      });
      Alert.alert('Movimiento registrado', `Se registró la ${tipoMovimiento.toLowerCase()} de ${cantidad} ${selectedInsumo.unidadMedida}.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      setGlobalError(err?.data?.error || 'Error al guardar el movimiento. Revisa el stock disponible.');
    } finally {
      setSubmitting(false);
    }
  }, [canSave, selectedInsumo, tipoMovimiento, cantidad, fecha, router]);

  const filteredInsumos = insumos.filter(i =>
    i.nombreInsumo.toLowerCase().includes(insumosQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        
        {/* Navbar */}
        <View style={styles.navbar}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="x" size={24} color="#1A1A1A" />
          </Pressable>
          <Text style={styles.navTitle}>Registrar Movimiento</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]} keyboardShouldPersistTaps="handled">
          
          <View style={styles.formCard}>
            
            {/* TIPO TABS */}
            <View style={styles.fieldSection}>
              <Text style={styles.label}>1. Tipo de movimiento</Text>
              <View style={styles.tabContainer}>
                <Pressable
                  style={[styles.tabBtn, tipoMovimiento === 'SALIDA' && styles.tabBtnSalida]}
                  onPress={() => setTipoMovimiento('SALIDA')}
                >
                  <Text style={[styles.tabText, tipoMovimiento === 'SALIDA' && styles.tabTextActiveOut]}>📉 Salida (Gasto)</Text>
                </Pressable>
                <Pressable
                  style={[styles.tabBtn, tipoMovimiento === 'ENTRADA' && styles.tabBtnEntrada]}
                  onPress={() => setTipoMovimiento('ENTRADA')}
                >
                  <Text style={[styles.tabText, tipoMovimiento === 'ENTRADA' && styles.tabTextActiveIn]}>📈 Entrada</Text>
                </Pressable>
              </View>
            </View>

            {/* Insumo Picker */}
            <View style={styles.fieldSection}>
              <Text style={styles.label}>2. Insumo (Material o Producto)</Text>
              <Pressable
                style={styles.inputBox}
                onPress={() => setPickerVisible(true)}
              >
                <Text style={selectedInsumo ? styles.inputText : styles.placeholderText}>
                  {selectedInsumo ? `${selectedInsumo.nombreInsumo} (${selectedInsumo.unidadMedida})` : 'Seleccionar insumo...'}
                </Text>
                <Feather name="chevron-down" size={20} color="#B0B0B0" />
              </Pressable>
            </View>

            {/* Cantidad */}
            {selectedInsumo && (
              <View style={styles.fieldSection}>
                <Text style={styles.label}>3. Cantidad a reportar</Text>
                <View style={styles.bigInputWrap}>
                  <MaterialCommunityIcons name="cube-outline" size={20} color={ACCENT} />
                  <TextInput
                    style={styles.bigInput}
                    placeholder="0"
                    placeholderTextColor="#A0A0A0"
                    keyboardType="numeric"
                    onChangeText={setCantidad}
                    value={cantidad}
                  />
                  <Text style={styles.bigInputUnit}>{selectedInsumo.unidadMedida}</Text>
                </View>
                <Text style={styles.fieldHint}>Stock actual: {selectedInsumo.stockActual} {selectedInsumo.unidadMedida}</Text>
              </View>
            )}

            {/* Fecha */}
             <View style={styles.fieldSection}>
              <Text style={styles.label}>4. Fecha de registro</Text>
              <View style={[styles.inputBox, { backgroundColor: '#F5F5F5' }]}>
                <Text style={[styles.inputText, { color: '#6A6A6A' }]}>{fecha}</Text>
                <Feather name="calendar" size={18} color="#A0A0A0" />
              </View>
            </View>

            {globalError && (
              <View style={styles.globalErrorBox}>
                <Feather name="alert-circle" size={16} color="#E74C3C" />
                <Text style={styles.globalErrorText}>{globalError}</Text>
              </View>
            )}
          </View>

        </ScrollView>

        {/* Action Bottom */}
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Pressable 
            style={[styles.submitBtn, (!canSave || submitting) && styles.submitBtnDisabled, tipoMovimiento === 'ENTRADA' && { backgroundColor: '#2F9B47' }]} 
            onPress={onSubmit} 
            disabled={!canSave || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Feather name="save" size={18} color="#FFF" />
                <Text style={styles.submitBtnText}>Confirmar Movimiento</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* INSUMO PICKER MODAL */}
        <Modal visible={pickerVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPickerVisible(false)}>
          <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Catálogo de Insumos</Text>
              <Pressable onPress={() => setPickerVisible(false)}>
                <Text style={styles.modalCloseText}>Cerrar</Text>
              </Pressable>
            </View>
            <View style={styles.modalSearchBox}>
              <Feather name="search" size={18} color="#8A8A8A" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Buscar por nombre..."
                value={insumosQuery}
                onChangeText={setInsumosQuery}
                autoFocus
              />
            </View>
            <ScrollView contentContainerStyle={styles.modalList} keyboardShouldPersistTaps="handled">
              {filteredInsumos.map(insumo => (
                <Pressable
                  key={insumo.idInsumo}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedInsumo(insumo);
                    setPickerVisible(false);
                  }}
                >
                  <View>
                     <Text style={styles.modalItemName}>{insumo.nombreInsumo}</Text>
                     <Text style={styles.modalItemSub}>{insumo.tipoInsumo?.nombreTipo || 'Varios'} · Stock: {insumo.stockActual} {insumo.unidadMedida}</Text>
                  </View>
                  <MaterialCommunityIcons name={selectedInsumo?.idInsumo === insumo.idInsumo ? 'radiobox-marked' : 'radiobox-blank'} size={20} color={selectedInsumo?.idInsumo === insumo.idInsumo ? ACCENT : '#DCDCDC'} />
                </Pressable>
              ))}
              {filteredInsumos.length === 0 && (
                <Text style={styles.modalEmpty}>No se encontraron resultados.</Text>
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F3F4F3' },
  navbar: { minHeight: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, backgroundColor: '#F3F4F3', borderBottomWidth: 1, borderBottomColor: '#E6E8E6' },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  navTitle: { fontSize: 16, fontWeight: '700', color: '#1B241B' },
  content: { padding: 16 },

  formCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#EBDFD8', gap: 20 },
  fieldSection: { gap: 8 },
  label: { fontSize: 13, fontWeight: '700', color: '#3A2E26' },
  fieldHint: { fontSize: 12, color: '#8A7A71', marginTop: -2 },
  
  inputBox: { minHeight: 48, backgroundColor: '#FAFCFA', borderWidth: 1, borderColor: '#DCDCDC', borderRadius: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inputText: { fontSize: 15, color: '#1B241B', flex: 1 },
  placeholderText: { fontSize: 15, color: '#A0A0A0', flex: 1 },
  
  bigInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FAFCFA', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#DCDCDC' },
  bigInput: { flex: 1, fontSize: 24, fontWeight: '800', color: '#3A2E26' },
  bigInputUnit: { fontSize: 16, fontWeight: '600', color: '#8A7A71' },

  tabContainer: { flexDirection: 'row', height: 48, backgroundColor: '#F0F0F0', borderRadius: 12, padding: 4 },
  tabBtn: { flex: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tabBtnSalida: { backgroundColor: '#C0392B', shadowColor: '#C0392B', elevation: 2 },
  tabBtnEntrada: { backgroundColor: '#2F9B47', shadowColor: '#2F9B47', elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '600', color: '#7A7A7A' },
  tabTextActiveOut: { color: '#FFF', fontWeight: '800' },
  tabTextActiveIn: { color: '#FFF', fontWeight: '800' },

  globalErrorBox: { backgroundColor: '#FDEDEC', borderWidth: 1, borderColor: '#F5B7B1', padding: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  globalErrorText: { color: '#C0392B', fontSize: 12, flex: 1, fontWeight: '500' },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', padding: 16, borderTopWidth: 1, borderTopColor: '#EBDFD8' },
  submitBtn: { backgroundColor: '#D35400', height: 52, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },

  /* Modal */
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  modalCloseText: { fontSize: 16, color: ACCENT, fontWeight: '600' },
  modalSearchBox: { margin: 16, backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 12, height: 44, flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalSearchInput: { flex: 1, fontSize: 15 },
  modalList: { paddingHorizontal: 16, paddingBottom: 40 },
  modalItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F5F5F5', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalItemName: { fontSize: 16, color: '#1A1A1A', fontWeight: '600' },
  modalItemSub: { fontSize: 12, color: '#8A8A8A', marginTop: 4 },
  modalEmpty: { textAlign: 'center', marginTop: 40, color: '#8A8A8A' },
});
