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
  actualizarRenglonObra,
  obtenerObjetodeobraActivo,
  obtenerObjetosdeobras,
  obtenerObraActiva,
  obtenerObras,
  obtenerEtapas,
  activarEtapa,
  cantidadRenglonesAsignados,
  obtenerRenglonPorId,
  obtenerRenglonAsignadoAlLCPorId,
} from '../db/database';

const LIMITE = 50;

export default function AgregarRenglonObraScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Parámetros de navegación
  const renglonId = Array.isArray(params.id) ? params.id[0] : params.id; 
  const listadodecantidadesID = Array.isArray(params.listadodecantidadesID) ? params.listadodecantidadesID[0] : params.listadodecantidadesID;
  const conMateriales = String(params.conMateriales) === 'true';
  
  const { licenciaEstado } = useLicencia();
  const { selectedSuministro, setSelectedSuministro } = useSuministroSelection();
  const { selectedObjeto, setSelectedObjeto } = useObjetoSelection();

  // Estados de datos
  const [renglon, setRenglon] = useState(null);
  const [renglonAsignado, setRenglonAsignado] = useState(null); 
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
  const objetoModificadoRef = useRef(false);

    // --- SINCRONIZACIÓN CON EL CONTEXTO DE OBJETO ---
  useEffect(() => {
    // Si el usuario selecciona un objeto nuevo en la pantalla de Objetos...
    if (selectedObjeto?.id) {
      // Forzamos la actualización del ID local para que al guardar use este
      setObjetoDeObraId(selectedObjeto.id);
    }
  }, [selectedObjeto]);
  
  // Control de carga
  const [cargando, setCargando] = useState(true);

  // --- CÁLCULOS SEGUROS ---
  const cantidadNumerica = Number(String(cantidad).trim().replace(',', '.')) || 0;
  const incremento = Number(renglon?.Incremento ?? 1);
  
  const calcPrecioSuministro = () => {
    if (!selectedSuministro) return 0;
    const mo = Number(selectedSuministro.MO ?? 0);
    const eq = Number(selectedSuministro.EQ ?? 0);
    const ma = Number(selectedSuministro.MA ?? 0);
    return conMateriales ? (mo * incremento + eq + ma) : (mo * incremento + eq);
  };

  const calcPrecioRC = () => {
    if (!renglon) return 0;
    const mo = Number(renglon.CDManoObra ?? 0);
    const eq = Number(renglon.CDUsoEquipos ?? 0);
    const ma = Number(renglon.CDMateriales ?? 0);
    return conMateriales ? (mo * incremento + eq + ma) : (mo * incremento + eq);
  };

  const precioSuministro = calcPrecioSuministro();
  const precioRC = calcPrecioRC();
  const precioUnitario = selectedSuministro ? precioSuministro : precioRC;
  const precioTotal = cantidadNumerica * precioUnitario;
  const unidadCantidad = selectedSuministro?.umedicion || selectedSuministro?.UM || renglon?.umedicion || '—';

  // --- CARGA DE DATOS ATÓMICA Y A PRUEBA DE BALAS ---
  useEffect(() => {
    let activo = true;

    const cargarDatos = async () => {
      if (!renglonId && !listadodecantidadesID) {
        setCargando(false);
        return;
      }

      try {
        setCargando(true);
        
        let idVarianteParaBuscar = renglonId;
        let asignadoLocal = null;
        let renglonBaseLocal = null;

        // 1. Obtener datos de la BD en variables locales (sin setear estados aún)
        if (listadodecantidadesID) {
          asignadoLocal = await obtenerRenglonAsignadoAlLCPorId(db, listadodecantidadesID);
          if (asignadoLocal) {
            idVarianteParaBuscar = asignadoLocal.IDRVariante;
          }
        }

        /*
        if (idVarianteParaBuscar) {
          renglonBaseLocal = await obtenerRenglonPorId(db, String(idVarianteParaBuscar));
        }
          */

              // ✅ AQUÍ ESTÁ LA MAGIA: Reconstruimos el cero a la izquierda si es necesario
        if (idVarianteParaBuscar) {
          let idString = String(idVarianteParaBuscar).trim();
          
          // Si el ID tiene 5 dígitos (ej. 72414), le ponemos el cero delante para que sean 6
          // Ajusta el '6' al largo total que deben tener tus códigos (ej. si son 7, pon un 7)
          if (idString.length === 5 && !idString.startsWith('0')) {
             idString = '0' + idString;
          }

          try {
             renglonBaseLocal = await obtenerRenglonPorId(db, idString);
          } catch (e) {
             renglonBaseLocal = null;
          }
        }

        

        if (!renglonBaseLocal) {
          throw new Error('No se encontraron los datos del renglón constructivo.');
        }

        // 2. Cargar catálogos usando las variables locales (NO el estado renglon)
        const [
          obrasCargadas,
          obraActiva,
          objetoActivo,
          objetosCargados,
          etapasCargadas,
          etapaActiva,
          losRenglonesAsignados
        ] = await Promise.all([
          obtenerObras(db),
          obtenerObraActiva(db),
          obtenerObjetodeobraActivo(db),
          obtenerObjetosdeobras(db),
          obtenerEtapas(db),
          // Usamos renglonBaseLocal.IDSobreGrupo, no renglon?.IDSobreGrupo
          activarEtapa(db, String(renglonBaseLocal?.IDSobreGrupo || '')), 
          cantidadRenglonesAsignados(db),
        ]);

        if (!activo) return;

        if (!Array.isArray(objetosCargados)) {
          throw new Error('La consulta de objetos de obra no devolvió una lista válida.');
        }

        // 3. ¡SETEAMOS TODOS LOS ESTADOS DE GOLPE! (Carga atómica)
        setObras(obrasCargadas);
        setObraId(obraActiva?.id ?? null);
        setObraNombre(obraActiva?.obra ?? '');
        setObjetosDeObra(objetosCargados);
        setEtapas(etapasCargadas);
        setRenglonesAsignados(losRenglonesAsignados?.cantidad || 0);
        setRenglon(renglonBaseLocal);

        if (asignadoLocal) {
          setRenglonAsignado(asignadoLocal);
          setCantidad(String(asignadoLocal.cantidad ?? '1'));
          
          // Forzamos String en la etapa
          setEtapaId(String(asignadoLocal.IDSubEtapa || etapaActiva?.IDSubEtapa || '1001'));
          
           // ✅ CORRECCIÓN AQUÍ: Solo seteamos el objeto si NO ha sido modificado manualmente
          if (!objetoModificadoRef.current) {
            const objetoIdEdicion = asignadoLocal.objetodeobra_id ?? objetosCargados[0]?.id ?? null;
            setObjetoDeObraId(objetoIdEdicion);
            setSelectedObjeto(
              objetosCargados.find(obj => String(obj.id) === String(objetoIdEdicion)) ?? null
            );
          }
        } else {
          setRenglonAsignado(null);
          setEtapaId(String(etapaActiva?.IDSubEtapa || '1001'));
          
          const activoId = objetoActivo?.objetodeobra_activo ?? objetosCargados[0]?.id ?? null;
          setObjetoDeObraId(activoId);
          setSelectedObjeto(
            objetosCargados.find(obj => String(obj.id) === String(activoId)) ?? null
          );
        }

        

      } catch (error) {
        const mensaje = error instanceof Error ? error.message : String(error);
        if (activo) {
          Alert.alert('Error', `No se pudieron cargar los datos. ${mensaje}`);
          cerrar(); 
        }
      } finally {
        if (activo) setCargando(false);
      }
    };

    cargarDatos();

    return () => {
      activo = false;
    };
  }, [db, renglonId, listadodecantidadesID]);

  // --- ACCIONES ---
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

  const cerrar = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/Principal');
    }
  }, [router]);

  const objetoDeObraNombre = useMemo(() => {
    if (selectedObjeto?.objetodeobra) return selectedObjeto.objetodeobra;
    const seleccionado = objetosDeObra.find(
      objeto => String(objeto.id) === String(objetoDeObraId)
    );
    return seleccionado?.objetodeobra || 'Seleccionar objeto de obra';
  }, [selectedObjeto, objetosDeObra, objetoDeObraId]);

  //const objetoDeObraSeleccionadoId = selectedObjeto?.id ?? objetoDeObraId;
    // Confía en el estado local, que se mantiene sincronizado con el contexto
  const objetoDeObraSeleccionadoId = objetoDeObraId || selectedObjeto?.id;

  const seleccionarObjetoDeObra = () => {
    objetoModificadoRef.current = true; // <--- Agrega esta línea
    router.push({
      pathname: '/Objetos',
      params: { seleccion: 'true' },
    });
  };

  const actualizarEtapa = async value => {
    setEtapaId(value);
  };

  const guardarRenglon = async (esEdicion) => {
    // 1. Validaciones Críticas
    if (!renglon || !renglon.IDRVariante) {
      Alert.alert('Error', 'Los datos del renglón no están cargados.');
      return;
    }
    if (obraId == null) {
      Alert.alert('Validación', 'Debe crear primero al menos una obra y activarla antes de continuar.');
      return;
    }
    if (objetoDeObraSeleccionadoId == null) {
      Alert.alert('Validación', 'Seleccione un objeto de obra antes de continuar.');
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

    const obraseleccionado = obras.find(obra => String(obra.id) === String(obraId));
    if (!obraseleccionado) {
      Alert.alert('Error', 'No se encontró la obra seleccionada.');
      return;
    }

    const objetoIdAGuardar = objetoDeObraId || selectedObjeto?.id;
    
    if (objetoIdAGuardar == null) {
      Alert.alert('Validación', 'Seleccione un objeto de obra antes de continuar.');
      return;
    }

    // 2. Ejecutar guardado
    try {
      const nombreRecurso = selectedSuministro ? selectedSuministro.recurso : renglon.RVariante;

      if (esEdicion && renglonAsignado) {
        await actualizarRenglonObra(
          db,
          listadodecantidadesID,
          obraId,
          objetoIdAGuardar,
          etapaId,
          cantidadNumerica,
          precioUnitario,
          '',
          suministroId,
          unidadCantidad,
          nombreRecurso,
          conMateriales
        );
      } else {
        await agregarRCalObra(
          db,
          obraId,
          etapaId,
          objetoIdAGuardar,
          renglon.IDRVariante,
          cantidadNumerica,
          precioUnitario,
          '',
          suministroId,
          unidadCantidad,
          nombreRecurso,
          conMateriales
        );
      }

      setSelectedSuministro(null);
      setSelectedObjeto(null); 
      setObjetoDeObraId(null); // <-- También limpiamos el local
      
      Alert.alert(
        esEdicion ? 'Renglón actualizado' : 'Renglón añadido',
        `Se ${esEdicion ? 'actualizó' : 'añadió'} con éxito el renglón ${renglon.IDRVariante} ${selectedSuministro ? 'con el suministro ' + selectedSuministro.IDRecurso : ''} a la obra ${obraNombre}.`
      );

      if (irAPreliminares) {
        router.push({
          pathname: '/Preliminares',
          params: { obraId: String(obraseleccionado.id) },
        });
      } else {
        cerrar();
      }
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);
      Alert.alert('Error', `No se pudo ${esEdicion ? 'actualizar' : 'asignar'} el renglón. ${mensaje}`);
    }
  };

  const handleAgregarOActualizar = () => {
    if (!isPremiumDisabled() && !renglonAsignado && Number(renglonesAsignados) >= LIMITE) {
      Alert.alert(
        'Límite de Renglones alcanzado',
        `Has asignado ya el máximo de Renglones Constructivos permitidos para una Obra (${LIMITE}). Actualiza a Premium continuar asignando Renglones ilimitados.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Ir a Zona de Licencia', onPress: () => router.push('/Licencia') }
        ]
      );
      return;
    }
    guardarRenglon(!!renglonAsignado);
  };

  if (cargando) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Cargando datos...</Text>
      </View>
    );
  }

  // --- RENDERIZADO ---
  return (
    <View style={styles.container}>
      <ScreenHeader
        title={renglonAsignado ? 'ACTUALIZANDO RENGLÓN DE LA OBRA' : 'AGREGANDO RENGLÓN A LA OBRA'}
        onBack={cerrar}
      />
 
      {!!obraId && <Text style={styles.headerText}>{obraNombre.toUpperCase()}</Text>}              
      <View style={{textAlign: 'right', alignItems: 'flex-end', paddingHorizontal: 5, backgroundColor: '#4b86b4', marginHorizontal: 20, borderRadius: 5}}>
        <View style={styles.checkboxRow}>                            
          {conMateriales ?
            <Text style={{color: '#ffffff', fontWeight: 'bold'}} >INCLUYENDO LOS MATERIALES</Text>
            :
            <Text style={{color: '#fffb00', fontWeight: 'bold'}} >SIN MATERIALES</Text>
          }
        </View>
        <Text style={{color: '#ffffff',fontSize: 12, fontWeight: 'bold' }}>{renglon?.perfilsalarial}</Text>
      </View>  
      
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
            Precio: ${precioRC.toFixed(2)}  | Unidad: {renglon?.umedicion || '—'} 
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
                 Precio: ${precioSuministro.toFixed(2)} 
                 {` | Unidad: ${selectedSuministro.umedicion || selectedSuministro.UM || '—'}`}
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
                  key={String(objeto.IDSubEtapa)}
                  label={objeto.IDSubEtapa + " " + objeto.SubEtapa}
                  value={String(objeto.IDSubEtapa)}
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
              <TouchableOpacity 
                style={commonStyles.buttonAgregar}
                onPress={handleAgregarOActualizar}
              >
                <Text style={commonStyles.buttonTextAgregar}>
                  {renglonAsignado ? 'Actualizar' : 'Agregar'}
                </Text>
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
    fontWeight: 'bold'
  },
  checkboxLabel: {
    fontSize: 14,
    flexShrink: 1,
  },
  headerText: {
    marginLeft: 15,
    fontWeight: 'bold',
    paddingHorizontal: 5
  },
});