import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppText as Text } from './AppText';
import ScreenHeader from './ScreenHeader';
import { commonStyles } from '../styles/commonStyles';
import Checkbox from 'expo-checkbox';
import { obtenerDetallesDelRenglon, obtenerRenglonPorId } from '../db/database';
import { useSuministroSelection } from '../contexts/SuministroSelectionContext';

const resumenRenglon = [
  ['Costo de Materiales', 'CDMateriales', true],
  ['Horas Equipo', 'HorasEquipos'],
  ['Costo Uso de Equipos', 'CDUsoEquipos', true],
  ['Horas Hombre', 'HorasHombre'],
  ['Costo Mano de Obra', 'CDManoObra', true],
  ['Horas Total', 'HorasTotal'],
];

export default function DetalleRenglonScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { selectedSuministro, setSelectedSuministro } = useSuministroSelection();
  const [renglon, setRenglon] = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [elementosDesplegados, setElementosDesplegados] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [conMateriales, setConMateriales] = useState(true);
  const renglonId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    let cancelado = false;

    const cargar = async () => {
      if (!renglonId) {
        setErrorCarga('No se indicó el renglón que se debe mostrar.');
        setCargando(false);
        return;
      }

      try {
        const [renglonCargado, detallesCargados] = await Promise.all([
          obtenerRenglonPorId(db, renglonId),
          obtenerDetallesDelRenglon(db, renglonId),
        ]);
        if (cancelado) return;
        if (!renglonCargado) {
          throw new Error(`No se encontró el renglón ${renglonId}.`);
        }
        setRenglon(renglonCargado);
        setDetalles(detallesCargados);
      } catch (error) {
        if (cancelado) return;
        const mensaje = error instanceof Error ? error.message : String(error);
        setErrorCarga(mensaje);
        Alert.alert('Error', `No se pudieron cargar los detalles del renglón. ${mensaje}`);
      } finally {
        if (!cancelado) setCargando(false);
      }
    };

    cargar();
    return () => {
      cancelado = true;
    };
  }, [db, renglonId]);

   useEffect(() => {
    setElementosDesplegados(!selectedSuministro);
   }, [selectedSuministro]);

  const agregarAlObra = () => {
    if (!renglon?.IDRVariante) return;
    router.push({
      pathname: '/AgregarRenglonObra',
      params: {
        id: String(renglon.IDRVariante),
        conMateriales: String(conMateriales),
      },
    });
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="DETALLES DEL RENGLÓN" onBack={() => router.back()} />
      {cargando ? (
        <ActivityIndicator color="#4b86b4" style={styles.loading} />
      ) : errorCarga ? (
        <Text style={styles.message}>{errorCarga}</Text>
      ) : renglon ? (
        <>
         <View style={{textAlign: 'right', alignItems: 'flex-end', paddingHorizontal: 5, backgroundColor: '#4b86b4', marginHorizontal: 20, borderRadius: 5}}>
            <View style={styles.checkboxRow}>
                <Checkbox
                  value={conMateriales}
                  onValueChange={setConMateriales}
                  color={conMateriales ? '#192f6a' : '#88c7f7'}
                  accessibilityLabel="con Materiales"
                  style={{ width: 12, height: 12 }}
                />                  
                <Pressable onPress={() => setConMateriales(value => !value)}>
                  <Text style={styles.checkboxLabel}>INCLUYENDO LOS MATERIALES</Text>
                </Pressable>
              </View>
              <Text style={styles.checkboxLabel}>{renglon.perfilsalarial ?? ''}</Text>
            </View>
          <ScrollView contentContainerStyle={styles.content}>
           
            <View style={styles.renglonInfo}>
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
                <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                  <View style={{flexDirection: 'row'}}>
                  <Text style={selectedSuministro && { opacity: 0.3, textDecorationLine: 'line-through' } }>Precio: $</Text>
                  <Text style={selectedSuministro && { opacity: 0.3, textDecorationLine: 'line-through' } }>
                    { conMateriales ?
                    `${Number(renglon.CDManoObra * renglon.Incremento + renglon.CDUsoEquipos + renglon.CDMateriales ?? 0).toFixed(2)} `
                  :
                      `${Number(renglon.CDManoObra * renglon.Incremento + renglon.CDUsoEquipos ?? 0).toFixed(2)} `
                  }
                  | Unidad: {renglon.umedicion ?? '' /* ax6 */}
                    
                  </Text> 
                  </View> 
                  <View >
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Quitar suministro seleccionado"
                      onPress={() => setElementosDesplegados(!elementosDesplegados)}
                      style={styles.supplyRemoveButton}
                    >
                    { elementosDesplegados ?
                      <FontAwesome5 name="arrow-circle-up" size={14} color="#4b86b4" />
                      :
                      <FontAwesome5 name="arrow-circle-down" size={14} color="#4b86b4" />
                    }
                    </Pressable>
                  </View>
                </View>   
            </View>
            </View>
            

          <View style={!elementosDesplegados && {height:0, marginBottom: 20}}>
             
              <View style={styles.summaryGrid}>
                {resumenRenglon.map(([label, field, isCost]) => (
                  <View key={field} style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>{label}</Text>
                     <Text style={styles.summaryValue}>
                       {renglon[field]
                         ? `${isCost ? '$' : ''}${renglon[field]}${field === 'CDManoObra' ? ` * ${renglon.Incremento ?? '1'}` : ''}` 
                         : ''}
                     </Text> 
                  </View>
                ))}
              
              
              </View>

            <Text style={styles.compositionTitle}>
              ELEMENTOS DE COMPOSICIÓN {detalles.length}
            </Text>
            {detalles.length > 0 ? detalles.map((item, index) => (
              <View
                key={`${item.IDRecurso ?? 'recurso'}-${index}`}
                style={styles.compositionItem}
              >
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 0, justifyContent: 'space-between'}}>
                  <Text style={styles.resourceType}>{item.tiporecurso}</Text>
                  <Text style={{fontSize: 10}}> {item.IDRecurso}</Text>
                </View>
                <Text style={styles.resourceName}>{item.Recurso}</Text>
                <Text style={styles.resourceDetails}>
                  {item.Precio ? `Precio: $${Number(item.Precio?? 0).toFixed(2)} | ` : ''}                 
                  Norma: {Number(item.Norma?? 0).toFixed(4)} x {item.umedicion}
                  {item.Peso ? ` | Peso: ${item.Peso} kg` : ''}
                </Text>
              </View>
            )) : (
              <Text style={styles.message}>Este renglón no tiene elementos de composición.</Text>
            )}
          </View>


            

            <View style={styles.supplySection}>
              <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-between'}}>
              <Text style={styles.supplyTitle}>Suministro</Text>
              {selectedSuministro && (
                <>                 
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Quitar suministro seleccionado"
                    onPress={() => setSelectedSuministro(null)}
                    style={styles.supplyRemoveButton}
                  >
                    <FontAwesome5 name="times-circle" size={14} color="#b42318" />
                    <Text style={styles.supplyRemoveText}>Quitar suministro</Text>
                  </Pressable>
                </>
              )}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  selectedSuministro
                    ? `Cambiar suministro ${selectedSuministro.Recurso}`
                    : 'Seleccionar suministro opcional'
                }
                onPress={() => router.push({ pathname: '/Suministros', params: { soloMateriales: '1' } })}
                style={styles.supplyPickerButton}
              >
                <FontAwesome5
                  name={selectedSuministro ? 'exchange-alt' : 'search'}
                  size={16}
                  color="#4b86b4"
                />
                <Text style={styles.supplyPickerText}>
                  {selectedSuministro?.Recurso || 'Seleccionar suministro'}
                </Text>
                <FontAwesome5 name="chevron-right" size={13} color="#667085" />
              </Pressable>
              {selectedSuministro && (
                <>
                  <Text style={styles.supplyDetails}>
                    {`Código: ${selectedSuministro.IDRecurso} | ${selectedSuministro.tiporecurso || 'Suministro'} `}
                  </Text>
                  <Text style={styles.supplyDetails}>
                     Precio: ${ conMateriales ?
                        `${Number(selectedSuministro.MO * renglon.Incremento + selectedSuministro.EQ + selectedSuministro.MA ?? 0).toFixed(2)} `
                      :
                          `${Number(selectedSuministro.MO * renglon.Incremento + selectedSuministro.EQ ?? 0).toFixed(2)} `
                      } 
                      {` | Unidad: ${selectedSuministro.umedicion || selectedSuministro.UM || '—'}`}
                   


                    
                  </Text>
                  
                </>
              )}
            </View>
          </ScrollView>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Agregar renglón a la obra"
            style={commonStyles.buttonFlotante}
            onPress={agregarAlObra}
          >
            <FontAwesome5 name="plus" size={18} color="white" />
          </Pressable>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    paddingHorizontal: 10,
    paddingBottom: 80,
  },
  renglonInfo: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 0,
    marginBottom: 0,
  },
  renglonHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  renglonTitleBlock: {
    flex: 1,
    flexShrink: 1,
  },
  hierarchyText: {
    color: '#555',
    fontSize: 10,
    lineHeight: 14,
  },
  renglonHierarchyInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  renglonHierarchyInlineFixed: {
    color: '#555',
    fontSize: 12,
    lineHeight: 18,
    flexShrink: 0,
  },
  renglonHierarchyInlineCap: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    color: '#555',
    fontSize: 12,
    lineHeight: 18,
  },
  renglonName: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#192f6a',
    marginTop: 2,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    marginTop: 2,
  },
  summaryItem: {
    flex: 1,
    minWidth: '46%',
    alignItems: 'center',
    backgroundColor: '#ebf8fd',
    borderRadius: 5,
    paddingHorizontal: 2,
    paddingVertical: 2,
    marginTop: 2,
  },
  summaryLabel: {
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 14,
  //  fontWeight: 'bold',
    textAlign: 'center',
  },
  compositionTitle: {
    fontSize: 14,
    marginHorizontal: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  compositionItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginVertical: 5,
  },
  supplySection: {
    marginHorizontal: 5,
    marginTop: 16,
  },
  supplyTitle: {
    fontSize: 16,
    marginBottom: 6,
    color: '#192f6a',
    fontWeight: '600',
  },
  supplyPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  supplyPickerText: {
    flex: 1,
    color: '#192f6a',
  },
  supplyDetails: {
    //marginTop: 6,
   // color: '#555',
    fontSize: 14,
  },
  supplyRemoveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginBottom: 6,
    paddingVertical: 4,
  },
  supplyRemoveText: {
    color: '#b42318',
    fontSize: 13,
    fontWeight: '600',
  },
  resourceType: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#192f6a',
  },
  resourceName: {
    fontSize: 14,
    marginBottom: 0,
  },
  resourceDetails: {
    flexShrink: 1,
    fontSize: 14,
    lineHeight: 18,
  },
  renglonTitle: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 0,
    fontSize: 12,
    fontWeight: 'bold',
  },
  renglonName: {
    flex: 1,
    flexShrink: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#192f6a',
  },
  message: {
    padding: 20,
    color: '#666',
    textAlign: 'center',
  },
  loading: {
    marginVertical: 20,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  perfilSalarial: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxLabel: {
    fontSize: 12,
    flexShrink: 1,
    color: '#fff'
  },
});
