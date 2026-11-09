import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppText as Text } from './AppText';
import ScreenHeader from './ScreenHeader';
import { commonStyles } from '../styles/commonStyles';
import { obtenerDetallesDelRenglon, obtenerRenglonPorId } from '../db/database';
import AgregarRenglonObraModal from './AgregarRenglonObraModal';
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
  const [errorCarga, setErrorCarga] = useState('');
  const [agregarVisible, setAgregarVisible] = useState(false);
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

  const agregarAlObra = () => {
    setAgregarVisible(true);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="DETALLES DEL RENGLÓN" onBack={() => router.back()} />
      {cargando ? (
        <ActivityIndicator color="#4c669f" style={styles.loading} />
      ) : errorCarga ? (
        <Text style={styles.message}>{errorCarga}</Text>
      ) : renglon ? (
        <>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.renglonInfo}>
              <View style={styles.renglonHierarchy}>
                <Text style={styles.renglonLevel}>
                  Sección {renglon.IDSobreGrupo ?? '—'}: {renglon.SobreGrupo || 'Sin sección'}
                </Text>
                <Text style={styles.renglonLevel}>
                  Capítulo {renglon.IDGrupo ?? '—'}: {renglon.Grupo || 'Sin capítulo'}
                </Text>
                <Text style={styles.renglonLevel}>
                  Subcapítulo {renglon.IDSubGrupo ?? '—'}: {renglon.SubGrupo || 'Sin subcapítulo'}
                </Text>
              </View>
              <View style={styles.renglonHeader}>
                <Text style={commonStyles.campoCodigo}>{renglon.IDRVariante}</Text>
                <Text style={styles.renglonName}>{renglon.RVariante}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Precio</Text>
                <Text style={styles.summaryValue}>
                  ${renglon.Precio ?? ''} x {renglon.umedicion ?? ''}
                </Text>
              </View>
              <View style={styles.summaryGrid}>
                {resumenRenglon.map(([label, field, isCost]) => (
                  <View key={field} style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>{label}</Text>
                    <Text style={styles.summaryValue}>
                      {renglon[field]
                        ? `${isCost ? '$' : ''}${renglon[field]}`
                        : ''}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <Text style={styles.compositionTitle}>
              ELEMENTOS DE COMPOSICIÓN {detalles.length}
            </Text>
            {detalles.length > 0 ? detalles.map((item, index) => (
              <View
                key={`${item.IDRecurso ?? 'recurso'}-${index}`}
                style={styles.compositionItem}
              >
                <Text style={styles.resourceType}>{item.tiporecurso}</Text>
                <Text style={styles.resourceName}>{item.Recurso}</Text>
                <Text style={styles.resourceDetails}>
                  {item.Peso ? `Precio: $${item.Precio} | ` : ''}
                  Norma: {item.Norma} x {item.umedicion}
                  {item.Peso ? ` | Peso: ${item.Peso} kg` : ''}
                  {' | '}Código: {item.IDRecurso}
                </Text>
              </View>
            )) : (
              <Text style={styles.message}>Este renglón no tiene elementos de composición.</Text>
            )}

            <View style={styles.supplySection}>
              <Text style={styles.supplyTitle}>Suministro opcional</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  selectedSuministro
                    ? `Cambiar suministro ${selectedSuministro.Recurso}`
                    : 'Seleccionar suministro opcional'
                }
                onPress={() => router.push('/Suministros')}
                style={styles.supplyPickerButton}
              >
                <FontAwesome5
                  name={selectedSuministro ? 'exchange-alt' : 'search'}
                  size={16}
                  color="#4c669f"
                />
                <Text style={styles.supplyPickerText}>
                  {selectedSuministro?.Recurso || 'Seleccionar suministro'}
                </Text>
                <FontAwesome5 name="chevron-right" size={13} color="#667085" />
              </Pressable>
              {selectedSuministro && (
                <>
                  <Text style={styles.supplyDetails}>
                    {`Código: ${selectedSuministro.IDRecurso} | ${selectedSuministro.tiporecurso || 'Suministro'} | Unidad: ${selectedSuministro.umedicion || selectedSuministro.UM || '—'} | Precio: $${Number(selectedSuministro.Precio ?? 0).toFixed(2)}`}
                  </Text>
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
          </ScrollView>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Agregar renglón a la obra"
            style={commonStyles.buttonFlotante}
            onPress={agregarAlObra}
          >
            <FontAwesome5 name="plus" size={18} color="white" />
          </Pressable>
          <AgregarRenglonObraModal
            renglon={renglon}
            visible={agregarVisible}
            onClose={setAgregarVisible}
          />
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
    paddingVertical: 10,
    marginBottom: 8,
  },
  renglonHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  renglonHierarchy: {
    marginBottom: 6,
  },
  renglonLevel: {
    color: '#555',
    fontSize: 12,
    lineHeight: 18,
  },
  renglonName: {
    flex: 1,
    flexShrink: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#192f6a',
    marginTop: 6,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  summaryItem: {
    flex: 1,
    minWidth: '46%',
    alignItems: 'center',
    backgroundColor: '#ebf8fd',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 5,
    marginTop: 6,
  },
  summaryLabel: {
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: 'bold',
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
    marginTop: 6,
    color: '#555',
    fontSize: 12,
  },
  supplyRemoveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 8,
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
  },
  resourceName: {
    fontSize: 14,
    marginBottom: 5,
  },
  resourceDetails: {
    flexShrink: 1,
    fontSize: 14,
    lineHeight: 18,
  },
  message: {
    padding: 20,
    color: '#666',
    textAlign: 'center',
  },
  loading: {
    marginVertical: 20,
  },
});
