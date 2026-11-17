import { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import Checkbox from 'expo-checkbox';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { AppText as Text, AppTextInput as TextInput } from './AppText';
import ScreenHeader from './ScreenHeader';
import { commonStyles } from '../styles/commonStyles';
import { useLicencia, LICENCIA_ESTADOS } from '../contexts/LicenciaContext.js';
import { useSuministroSelection } from '../contexts/SuministroSelectionContext';
import { useObjetoSelection } from '../contexts/ObjetoSelectionContext';
import {
  agregarRCalObra,
  obtenerObjetodeobraActivo,
  obtenerObjetosdeobras,
  obtenerObraActiva,
  obtenerObras,
  obtenerEtapas,
  activarEtapa,
  cantidadRenglonesAsignados,
  obtenerRenglonPorId,
} from '../db/database';

const LIMITE = 50;

export default function AgregarRenglonObraScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const params = useLocalSearchParams();
  const renglonId = Array.isArray(params.id) ? params.id[0] : params.id;
  const conMateriales = String(params.conMateriales) === 'true';
  const { licenciaEstado } = useLicencia();
  const { selectedSuministro, setSelectedSuministro } = useSuministroSelection();
  const { selectedObjeto, setSelectedObjeto } = useObjetoSelection();
  const [renglon, setRenglon] = useState(null);
  const [obras, setObras] = useState([]);
  const [obraId, setObraId] = useState(null);
  const [obraNombre, setObraNombre] = useState('');
  const [objetosDeObra, setObjetosDeObra] = useState([]);
  const [objetoDeObraId, setObjetoDeObraId] = useState(null);
  const [etapas, setEtapas] = useState([]);
  const [etapaId, setEtapaId] = useState(null);
  const [cantidad, setCantidad] = useState('1');
  const [renglonesAsignados, setRenglonesAsignados] = useState('0');
  const [irAPreliminares, setIrAPreliminares] = useState(false);
  const datosCargadosRef = useRef(false);
  const cantidadNumerica = Number(String(cantidad).trim().replace(',', '.'));
  const precioSuministro = Number(selectedSuministro?.Precio);
  const precioRC = conMateriales ? Number(renglon?.Precio ?? 0) : Number(renglon?.CDManoObra + renglon?.CDUsoEquipos ?? 0);
  const precioUnitario = Number.isFinite(precioSuministro)
    ? precioSuministro
    : (Number.isFinite(precioRC) ? precioRC : 0);
  const precioTotal = (Number.isFinite(cantidadNumerica) ? cantidadNumerica : 0) * precioUnitario;
  const unidadCantidad = selectedSuministro?.umedicion
    || selectedSuministro?.UM
    || renglon?.umedicion
    || '—';

  useEffect(() => {
    let activo = true;
    const cargarRenglon = async () => {
      if (!renglonId) return;
      try {
        const renglonCargado = await obtenerRenglonPorId(db, renglonId);
        if (activo) setRenglon(renglonCargado);
      } catch (error) {
        const mensaje = error instanceof Error ? error.message : String(error);
        if (activo) {
          Alert.alert('Error', `No se pudo cargar el renglón. ${mensaje}`);
        }
      }
    };
    cargarRenglon();
    return () => {
      activo = false;
    };
  }, [db, renglonId]);

  const cargarDatosObra = useCallback(async () => {
    if (datosCargadosRef.current || !renglon) return;
    try {
      const [obrasCargadas, obraActiva, objetoActivo, objetosCargados, etapasCargadas, etapaActiva, losRenglonesAsignados] = await Promise.all([
        obtenerObras(db),
        obtenerObraActiva(db),
        obtenerObjetodeobraActivo(db),
        obtenerObjetosdeobras(db),
        obtenerEtapas(db),
        activarEtapa(db, renglon.IDSobreGrupo),
        cantidadRenglonesAsignados(db),
      ]);
      if (!Array.isArray(objetosCargados)) {
        throw new Error('La consulta de objetos de obra no devolvió una lista válida.');
      }

      setObras(obrasCargadas);
      setObraId(obraActiva?.id ?? null);
      setObraNombre(obraActiva?.obra ?? '');
      setObjetosDeObra(objetosCargados);
      setEtapas(etapasCargadas);
      setRenglonesAsignados(losRenglonesAsignados.cantidad);
      const activoId =
        objetoActivo?.objetodeobra_activo ?? objetosCargados[0]?.id ?? null;
      setObjetoDeObraId(activoId);
      setSelectedObjeto(
        objetosCargados.find(objeto => String(objeto.id) === String(activoId)) ??
          null
      );
      setEtapaId(etapaActiva.IDSubEtapa);
      datosCargadosRef.current = true;
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);
      Alert.alert('Error', `No se pudieron cargar los datos para agregar el renglón. ${mensaje}`);
    }
  }, [db, renglon]);

  useEffect(() => {
    cargarDatosObra();
  }, [cargarDatosObra]);

  const isPremiumDisabled = () => {
    switch (licenciaEstado) {
      case LICENCIA_ESTADOS.SIN_LICENCIA:
      case LICENCIA_ESTADOS.TRIAL_VENCIDA:
      case LICENCIA_ESTADOS.ORIGINAL_VENCIDA:
      case LICENCIA_ESTADOS.ERROR:
        return true;
      case LICENCIA_ESTADOS.TRIAL_ACTIVA:
      case LICENCIA_ESTADOS.ORIGINAL_ACTIVA:
        return false;
      default:
        return true;
    }
  };

  const cerrar = () => {
    datosCargadosRef.current = false;
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/Principal');
    }
  };

  const objetoDeObraNombre = useMemo(() => {
    if (selectedObjeto?.objetodeobra) return selectedObjeto.objetodeobra;
    const seleccionado = objetosDeObra.find(
      objeto => String(objeto.id) === String(objetoDeObraId)
    );
    return seleccionado?.objetodeobra || 'Seleccionar objeto de obra';
  }, [selectedObjeto, objetosDeObra, objetoDeObraId]);

  const objetoDeObraSeleccionadoId = selectedObjeto?.id ?? objetoDeObraId;

  const seleccionarObjetoDeObra = () => {
    router.push({
      pathname: '/Objetos',
      params: { seleccion: 'true' },
    });
  };

  const actualizarEtapa = async value => {
    try {
      setEtapaId(value);
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);
      Alert.alert('Error', `No se pudo actualizar la Etapa. ${mensaje}`);
    }
  };

  const agregar = async () => {
    if (obraId == null || objetoDeObraSeleccionadoId == null) {
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
        etapaId,
        objetoDeObraSeleccionadoId,
        renglon.IDRVariante,
        cantidadNumerica,
        precioUnitario,
        '',
        suministroId,
        unidadCantidad,
        selectedSuministro ? selectedSuministro.recurso : renglon.RVariante,
        conMateriales
      );

      setSelectedSuministro(null);
      setSelectedObjeto(null);
      Alert.alert(
        'Renglón constructivo añadido',
        `Se añadió con éxito el renglón constructivo ${renglon.IDRVariante} ${selectedSuministro ? ', con el suministro ' + selectedSuministro.IDRecurso : ''} a la obra ${obraNombre}.`
      );

      if (irAPreliminares) {
        router.push({
          pathname: '/Preliminares',
          params: { obraId: String(obraseleccionado.id) },
        });
      } else if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/Principal');
      }
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);
      Alert.alert('Error', `No se pudo asignar el renglón a la obra. ${mensaje}`);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={`AGREGANDO RENGLÓN A LA OBRA`}
        onBack={cerrar}
      />
 
      <Text>{!!obraId && <Text style={styles.headerText}>{obraNombre.toUpperCase()}</Text>}</Text>
               
             
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.formContent}>
        <View style={styles.renglonInfo}>
          <Text style={styles.hierarchyText}>
             {renglon?.SobreGrupo || 'Sin sección'} | {renglon?.Grupo || 'Sin capítulo'} | {renglon?.SubGrupo || 'Sin subcapítulo'}
          </Text>
          <View style={styles.renglonTitle}>
            <Text style={[commonStyles.renglonName, {fontWeight: 'bold'}]}
            numberOfLines={3}
            ellipsizeMode="tail"
            >
              {renglon?.IDRVariante} <Text style={{fontWeight: '500'}}>{renglon?.RVariante}</Text>
            </Text>
          </View>
          <Text style={[styles.renglonPrice, selectedSuministro && { opacity: 0.3, textDecorationLine: 'line-through' }]}>
            Precio: ${Number(precioRC ?? 0).toFixed(2)}  | Unidad: {renglon?.umedicion || '—'} |
            {conMateriales ?
            <Text style={{color: '#4b86b4'}} > Incluye los Materiales</Text>

            :
            <Text style={{color: '#b42318', paddingHorizontal: 10}} > Sin Materiales</Text>
            }
          </Text>
        </View>

        <View style={styles.formSection}>
          {selectedSuministro && (
            <>
            <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-between'}}>
              <Text style={styles.label}>Suministro</Text>
              <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Quitar suministro seleccionado"
                  onPress={() => setSelectedSuministro(null)}
                  style={styles.supplyRemoveIconButton}
                  hitSlop={8}
                >
                  <FontAwesome5 name="times-circle" size={12} color="#b42318" />
                  <Text style={styles.supplyRemoveText}>Quitar</Text>
                </Pressable>
                </View>
              <View style={styles.supplyRow}>
                <Text style={[styles.supplyDetails, styles.supplyDetailsFlex]}>
                  {`${selectedSuministro.Recurso} | Código: ${selectedSuministro.IDRecurso} | ${selectedSuministro.tiporecurso || 'Suministro'}  `}
                </Text>
                <Text style={[styles.supplyDetails, {color: 'black', fontSize: 14}]}>
                  {`Precio: $${Number(selectedSuministro.Precio ?? 0).toFixed(2)} | Unidad: ${selectedSuministro.umedicion || selectedSuministro.UM || '—'} `}
                </Text>

              </View>
            </>
          )}

          <Text style={styles.label}>Etapa</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={etapaId}
              onValueChange={actualizarEtapa}
            >
              {etapas.length === 0 ? (
                <Picker.Item label="No hay etapas disponibles" value={null} enabled={false} />
              ) : etapas.map(objeto => (
                <Picker.Item
                  key={objeto.IDSubEtapa}
                  label={objeto.IDSubEtapa + " " + objeto.SubEtapa}
                  value={objeto.IDSubEtapa}
                  style={styles.pickerItem}
                />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Objeto de Obra</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Seleccionar objeto de obra"
            onPress={seleccionarObjetoDeObra}
            style={styles.objetoSelector}
          >
            <Text style={styles.objetoSelectorText} numberOfLines={1}>
              {objetoDeObraNombre}
            </Text>
            <FontAwesome5 name="chevron-right" size={13} color="#667085" />
          </Pressable>

          <View style={{flexDirection: 'column'}}>
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
          </View>

          <View style={styles.quantityTotalFloat}>
            <Text style={styles.quantityTotalLabel}>Precio según Cantidad</Text>
            <Text style={styles.quantityTotalAmount}>${precioTotal.toFixed(2)}</Text>
          </View>

          <View style={{flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between'}}>
            <View style={styles.checkboxRow}>
              <Checkbox
                value={irAPreliminares}
                onValueChange={setIrAPreliminares}
                color={irAPreliminares ? '#192f6a' : undefined}
                accessibilityLabel="Ir a Preliminares"
                style={{ width: 12, height: 12 }}
              />
              <Pressable onPress={() => setIrAPreliminares(value => !value)}>
                <Text style={styles.checkboxLabel}>Ir a Preliminares</Text>
              </Pressable>
            </View>

            <View style={commonStyles.buttonsRow}>
              <TouchableOpacity style={commonStyles.buttonAgregar}
                onPress={() => {
                if (!isPremiumDisabled() && renglonesAsignados >= LIMITE) {
                Alert.alert(
                  'Límite de Renglones alcanzado',
                  `Has asignado ya el máximo de Renglones Constructivos permitidos para una Obra (${LIMITE}). Actualiza a Premium continuar asignando Renglones ilimitados.`,
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Ir a Zona de Licencia',
                      onPress: () => router.push('/Licencia'),
                      style: 'default'
                    }
                  ]
                );
                } else {
                  agregar();
                }
              }}
              >
                <Text style={commonStyles.buttonTextAgregar}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  formContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  renglonInfo: {
    backgroundColor: '#fff',
    borderRadius: 5,
    paddingHorizontal: 2,
    marginVertical: 0,
  },
  hierarchyText: {
    color: '#555',
    fontSize: 12,
    lineHeight: 14,
  },
  renglonTitle: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexShrink: 1,
    gap: 8,
    marginTop: 0,
  },
  renglonName: {
    flex: 1,
    flexShrink: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#192f6a',
  },
  renglonPrice: {
    marginTop: 0,
    fontSize: 12,
  },
  formSection: {
    paddingHorizontal: 5,
  },
  label: {
    fontSize: 16,
    marginTop: 10,
    marginBottom: 1,
  },
  supplyRow: {
    alignItems: 'flex-start',
  },
  supplyDetails: {
    color: '#555',
    fontSize: 12,
  },
  supplyDetailsFlex: {
    flex: 1,
    marginTop: 0,
  },
  supplyRemoveIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 11,
    marginBottom: 1,
  },
  supplyRemoveText: {
    color: '#b42318',
    fontSize: 10,
    fontWeight: '600',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginTop: 4,
    backgroundColor: '#fff',
  },
  objetoSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  objetoSelectorText: {
    flex: 1,
    color: '#192f6a',
    fontSize: 14,
  },
  pickerItem: {
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    maxWidth: '50%',
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
    minHeight: 35,
    maxWidth: '80%',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 5,
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
    color: '#192f6a',
    fontSize: 20,
    fontWeight: 'bold',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxLabel: {
    fontSize: 14,
    flexShrink: 1,
  },
});