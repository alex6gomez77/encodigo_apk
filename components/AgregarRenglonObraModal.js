import { useCallback, useRef, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import Checkbox from 'expo-checkbox';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { AppText as Text, AppTextInput as TextInput } from './AppText';
import { commonStyles } from '../styles/commonStyles';
import { useSuministroSelection } from '../contexts/SuministroSelectionContext';
import {
  agregarRCalObra,
  establecerObjetodeobraActivo,
  obtenerObjetodeobraActivo,
  obtenerObjetosdeobras,
  obtenerObraActiva,
  obtenerObras,
} from '../db/database';

export default function AgregarRenglonObraModal({ renglon, visible, onClose }) {
  const db = useSQLiteContext();
  const router = useRouter();
  const { selectedSuministro, setSelectedSuministro } = useSuministroSelection();
  const [obras, setObras] = useState([]);
  const [obraId, setObraId] = useState(null);
  const [obraNombre, setObraNombre] = useState('');
  const [objetosDeObra, setObjetosDeObra] = useState([]);
  const [objetoDeObraId, setObjetoDeObraId] = useState(null);
  const [cantidad, setCantidad] = useState('1');
  const [irAPreliminares, setIrAPreliminares] = useState(false);
  const datosCargadosRef = useRef(false);
  const cantidadNumerica = Number(String(cantidad).trim().replace(',', '.'));
  const precioSuministro = Number(selectedSuministro?.Precio);
  const precioRC = Number(renglon?.Precio ?? 0);
  const precioUnitario = Number.isFinite(precioSuministro)
    ? precioSuministro
    : (Number.isFinite(precioRC) ? precioRC : 0);
  const precioTotal = (Number.isFinite(cantidadNumerica) ? cantidadNumerica : 0) * precioUnitario;
  const unidadCantidad = selectedSuministro?.umedicion
    || selectedSuministro?.UM
    || renglon?.umedicion
    || '—';

  const cargarDatosObra = useCallback(async () => {
    if (datosCargadosRef.current) return;
    try {
      const [obrasCargadas, obraActiva, objetoActivo, objetosCargados] = await Promise.all([
        obtenerObras(db),
        obtenerObraActiva(db),
        obtenerObjetodeobraActivo(db),
        obtenerObjetosdeobras(db),
      ]);
      if (!Array.isArray(objetosCargados)) {
        throw new Error('La consulta de objetos de obra no devolvió una lista válida.');
      }

      setObras(obrasCargadas);
      setObraId(obraActiva?.id ?? null);
      setObraNombre(obraActiva?.obra ?? '');
      setObjetosDeObra(objetosCargados);
      setObjetoDeObraId(
        objetoActivo?.objetodeobra_activo ?? objetosCargados[0]?.id ?? null
      );
      datosCargadosRef.current = true;
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);
      Alert.alert('Error', `No se pudieron cargar los datos para agregar el renglón. ${mensaje}`);
    }
  }, [db]);

  const cerrar = () => {
    datosCargadosRef.current = false;
    onClose(false);
  };

  const actualizarObjetoDeObra = async value => {
    try {
      await establecerObjetodeobraActivo(db, value);
      setObjetoDeObraId(value);
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);
      Alert.alert('Error', `No se pudo actualizar el objeto de obra. ${mensaje}`);
    }
  };

  const agregar = async () => {
    if (obraId == null || objetoDeObraId == null) {
      Alert.alert('Validación', 'Seleccione una obra y un objeto de obra antes de continuar.');
      return;
    }
    if (!Number.isFinite(cantidadNumerica) || cantidadNumerica <= 0) {
      Alert.alert('Validación', 'Ingrese una cantidad válida mayor que cero.');
      return;
    }

    const suministroId = selectedSuministro?.IDRecurso ?? null;
    if (selectedSuministro && suministroId == null) {
      Alert.alert('Error', 'El suministro seleccionado no tiene un código válido.');
      return;
    }

    const obraseleccionado = obras.find(
      obra => String(obra.id) === String(obraId)
    );
    if (!obraseleccionado) {
      Alert.alert('Error', 'No se encontró la obra seleccionada.');
      return;
    }

    try {
      await agregarRCalObra(
        db,
        obraId,
        objetoDeObraId,
        renglon.IDRVariante,
        cantidadNumerica,
        precioUnitario,
        '',
        suministroId
      );
      cerrar();
      setSelectedSuministro(null);
      Alert.alert(
        'Renglón constructivo añadido',
        `Se añadió con éxito el renglón constructivo ${renglon.IDRVariante} a la obra.`
      );

      if (irAPreliminares) {
        router.push({
          pathname: '/Preliminares',
          params: { obraId: String(obraseleccionado.id) },
        });
      } else {
        router.back();
      }
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);
      Alert.alert('Error', `No se pudo asignar el renglón a la obra. ${mensaje}`);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onShow={cargarDatosObra}
      onRequestClose={cerrar}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={commonStyles.gradienteContainer}>
            <TouchableOpacity accessibilityRole="button" onPress={cerrar}>
              <FontAwesome5 style={styles.backIcon} name="arrow-left" size={20} color="#192f6a" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text>AGREGANDO RENGLÓN CONSTRUCTIVO AL OBRA</Text>
              {!!obraId && <Text style={styles.headerText}>{obraNombre}</Text>}
            </View>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.formContent}>
            <View style={styles.renglonInfo}>
              <Text style={styles.hierarchyText}>
                Sección {renglon?.IDSobreGrupo ?? '—'}: {renglon?.SobreGrupo || 'Sin sección'}
              </Text>
              <Text style={styles.hierarchyText}>
                Capítulo {renglon?.IDGrupo ?? '—'}: {renglon?.Grupo || 'Sin capítulo'}
              </Text>
              <Text style={styles.hierarchyText}>
                Subcapítulo {renglon?.IDSubGrupo ?? '—'}: {renglon?.SubGrupo || 'Sin subcapítulo'}
              </Text>
              <View style={styles.renglonTitle}>
                <Text style={commonStyles.campoCodigo}>{renglon?.IDRVariante}</Text>
                <Text style={styles.renglonName}>{renglon?.RVariante}</Text>
              </View>
              <Text style={styles.renglonPrice}>
                Precio: ${Number(renglon?.Precio ?? 0).toFixed(2)} x {renglon?.umedicion || '—'}
              </Text>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.label}>Suministro opcional seleccionado en detalles</Text>
              {selectedSuministro ? (
                <View style={styles.supplyRow}>
                  <Text style={[styles.supplyDetails, styles.supplyDetailsFlex]}>
                    {`${selectedSuministro.Recurso} | Código: ${selectedSuministro.IDRecurso} | ${selectedSuministro.tiporecurso || 'Suministro'} | Unidad: ${selectedSuministro.umedicion || selectedSuministro.UM || '—'} | Precio: $${Number(selectedSuministro.Precio ?? 0).toFixed(2)}`}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Quitar suministro seleccionado"
                    onPress={() => setSelectedSuministro(null)}
                    style={styles.supplyRemoveIconButton}
                    hitSlop={8}
                  >
                    <FontAwesome5 name="times-circle" size={18} color="#b42318" />
                  </Pressable>
                </View>
              ) : (
                <Text style={styles.supplyDetails}>Ninguno seleccionado</Text>
              )}

              <Text style={styles.label}>Objeto de Obra</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={objetoDeObraId}
                  onValueChange={actualizarObjetoDeObra}
                >
                  {objetosDeObra.length === 0 ? (
                    <Picker.Item label="No hay objetos de obra disponibles" value={null} enabled={false} />
                  ) : objetosDeObra.map(objeto => (
                    <Picker.Item
                      key={objeto.id}
                      label={objeto.objetodeobra}
                      value={objeto.id}
                      style={styles.pickerItem}
                    />
                  ))}
                </Picker>
              </View>

              <Text style={styles.label}>Cantidad</Text>
              <View style={styles.quantityInputRow}>
                <TextInput
                  style={[styles.input, styles.quantityInput]}
                  keyboardType="decimal-pad"
                  value={cantidad}
                  onChangeText={setCantidad}
                />
                <View style={styles.quantityUnit}>
                  <Text style={styles.quantityUnitText}>{unidadCantidad}</Text>
                </View>
              </View>

              <View style={styles.quantityTotalFloat}>
                <Text style={styles.quantityTotalLabel}>Precio total según cantidad</Text>
                <Text style={styles.quantityTotalAmount}>${precioTotal.toFixed(2)}</Text>
              </View>

              <View style={styles.checkboxRow}>
                <Checkbox
                  value={irAPreliminares}
                  onValueChange={setIrAPreliminares}
                  color={irAPreliminares ? '#192f6a' : undefined}
                  accessibilityLabel="Ir a Preliminares después de agregar"
                />
                <Pressable onPress={() => setIrAPreliminares(value => !value)}>
                  <Text style={styles.checkboxLabel}>Ir a Preliminares después de agregar</Text>
                </Pressable>
              </View>

              <View style={commonStyles.buttonsRow}>
                <TouchableOpacity style={commonStyles.buttonAgregar} onPress={agregar}>
                  <Text style={commonStyles.buttonTextAgregar}>AGREGAR</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    width: '100%',
    maxHeight: '90%',
    padding: 16,
  },
  headerTextContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  backIcon: {
    marginRight: 10,
  },
  headerText: {
    color: '#192f6a',
    marginRight: 15,
    fontWeight: 'bold',
  },
  formContent: {
    paddingBottom: 8,
  },
  renglonInfo: {
    backgroundColor: '#fff',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginVertical: 5,
  },
  hierarchyText: {
    color: '#555',
    fontSize: 12,
    lineHeight: 18,
  },
  renglonTitle: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 4,
  },
  renglonName: {
    flex: 1,
    flexShrink: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#192f6a',
  },
  renglonPrice: {
    marginTop: 4,
    fontSize: 16,
  },
  formSection: {
    paddingHorizontal: 5,
  },
  label: {
    fontSize: 16,
    marginTop: 10,
    marginBottom: 4,
  },
  supplyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 6,
  },
  supplyDetails: {
    marginTop: 6,
    color: '#555',
    fontSize: 12,
  },
  supplyDetailsFlex: {
    flex: 1,
    marginTop: 0,
  },
  supplyRemoveIconButton: {
    paddingTop: 0,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginTop: 4,
    backgroundColor: '#fff',
  },
  pickerItem: {
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 6,
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  quantityInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quantityInput: {
    flex: 1,
  },
  quantityUnit: {
    minHeight: 42,
    maxWidth: '45%',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 6,
    backgroundColor: '#eef3f8',
    borderWidth: 1,
    borderColor: '#d3dfeb',
  },
  quantityUnitText: {
    color: '#192f6a',
    fontWeight: '600',
  },
  quantityTotalFloat: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 4,
    marginBottom: 12,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    elevation: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
  },
  quantityTotalLabel: {
    color: '#555555',
    fontSize: 13,
  },
  quantityTotalAmount: {
    color: '#217346',
    fontSize: 20,
    fontWeight: 'bold',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 8,
  },
  checkboxLabel: {
    fontSize: 16,
    flexShrink: 1,
  },
});
