import { useState, useRef, useEffect,  useCallback } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { AppText as Text, AppTextInput as TextInput } from './AppText';
import ScreenHeader from './ScreenHeader';
import { commonStyles } from '../styles/commonStyles';
import { establecerObjetodeobraActivo, obtenerObjetosdeobras } from '../db/database';

export default function ObjetosScreen() {
  const db = useSQLiteContext();
  const [objetos, setObjetos] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [nombre, setNombre] = useState('');
  const [editarId, setEditarId] = useState(null);

  const cargarObjetos = useCallback(async () => {
    try {
      const lista = await obtenerObjetosdeobras(db);
      setObjetos(lista);
    } catch (error) {
      const detalle = error instanceof Error ? error.message : JSON.stringify(error);
      Alert.alert('Error', `No se pudieron cargar los objetos de obra. ${detalle || String(error)}`);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      cargarObjetos();
    }, [cargarObjetos])
  );

  function abrirAgregar() {
    setEditarId(null);
    setNombre('');
    setModalVisible(true);
  }

  function abrirEdicion(objeto) {
    setEditarId(objeto.id);
    setNombre(objeto.objetodeobra ?? '');
    setModalVisible(true);
  }

  async function guardarObjeto() {
    console.log('guardarObjeto', { nombre, editarId });
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) {
      Alert.alert('Validación', 'Ingresa el nombre del objeto de obra.');
      return;
    }

    try {
      const duplicado = await db.getFirstAsync(
        `SELECT id FROM objetosdeobras
         WHERE TRIM(objetodeobra) = ? COLLATE NOCASE
           AND id != ?
         LIMIT 1`,
        nombreLimpio,
        editarId ?? -1
      );
      if (duplicado) {
        Alert.alert('Validación', 'Ya existe un objeto de obra con ese nombre.');
        return;
      }

      if (editarId == null) {
        await db.runAsync(
          'INSERT INTO objetosdeobras (objetodeobra) VALUES (?)',
          nombreLimpio
        );
      } else {
        await db.runAsync(
          'UPDATE objetosdeobras SET objetodeobra = ? WHERE id = ?',
          nombreLimpio,
          editarId
        );
      }

      setModalVisible(false);
      cargarObjetos();
    } catch (error) {
      Alert.alert('Error', `No se pudo guardar el objeto de obra. ${error.message}`);
    }
  }

  async function establecerActivo(id) {
    try {
      await establecerObjetodeobraActivo(db, id);
      cargarObjetos();
    } catch (error) {
      Alert.alert('Error', `No se pudo activar el objeto de obra. ${error.message}`);
    }
  }

  function eliminarObjeto(objeto) {
    Alert.alert(
      'Confirmar eliminación',
      `¿Quieres eliminar "${objeto.objetodeobra}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const asignaciones = await db.getFirstAsync(
                'SELECT COUNT(*) AS total FROM listadodecantidades WHERE objetodeobra_id = ?',
                objeto.id
              );
              if (asignaciones?.total > 0) {
                Alert.alert(
                  'No se puede eliminar',
                  'Este objeto de obra tiene renglones asignados. Retira esas asignaciones antes de eliminarlo.'
                );
                return;
              }

              if (objeto.activo === objeto.id) {
                const siguiente = await db.getFirstAsync(
                  'SELECT id FROM objetosdeobras WHERE id != ? ORDER BY id LIMIT 1',
                  objeto.id
                );
                await establecerObjetodeobraActivo(db, siguiente?.id ?? null);
              }

              await db.runAsync('DELETE FROM objetosdeobras WHERE id = ?', objeto.id);
              cargarObjetos();
            } catch (error) {
              Alert.alert('Error', `No se pudo eliminar el objeto de obra. ${error.message}`);
            }
          },
        },
      ]
    );
  }

  function cancelarEdicion() {
    setModalVisible(false);
    setNombre('');
    setEditarId(null);
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="OBJETOS DE OBRA" count={objetos.length} backHref="/Principal" />

      <ScrollView contentContainerStyle={styles.listContent}>
        {objetos.length === 0 ? (
          <Text style={styles.emptyText}>Aún no hay objetos de obra. Agrega uno para comenzar.</Text>
        ) : (
          objetos.map((objeto) => {
            const activo = objeto.activo === objeto.id;
            return (
              <View key={objeto.id} style={commonStyles.detallesItemContainer}>
                <Text style={styles.objectName}>{objeto.objetodeobra}</Text>
                <View style={styles.row}>
                  <Text style={activo ? styles.activeLabel : styles.inactiveLabel}>
                    {activo ? 'Activo' : 'Inactivo'}
                  </Text>
                  {!activo && (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => establecerActivo(objeto.id)}
                      style={styles.activateButton}
                    >
                      <Text style={styles.activateText}>Usar</Text>
                    </Pressable>
                  )}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Editar ${objeto.objetodeobra}`}
                    onPress={() => abrirEdicion(objeto)}
                    style={styles.iconButton}
                  >
                    <FontAwesome5 name="edit" size={17} color="#4b86b4" />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Eliminar ${objeto.objetodeobra}`}
                    onPress={() => eliminarObjeto(objeto)}
                    style={styles.iconButton}
                  >
                    <FontAwesome5 name="trash" size={17} color="red" />
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Agregar objeto de obra"
        style={commonStyles.buttonFlotante}
        onPress={abrirAgregar}
      >
        <FontAwesome5 name="plus" size={20} color="white" />
      </Pressable>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={cancelarEdicion}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {editarId == null ? 'Agregar objeto de obra' : 'Editar objeto de obra'}
            </Text>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              autoFocus
              style={styles.input}
              placeholder="Nombre del objeto"
              value={nombre}
              onChangeText={setNombre}
              returnKeyType="done"
              onSubmitEditing={guardarObjeto}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={commonStyles.buttonAgregar} onPress={guardarObjeto}>
                <Text style={commonStyles.buttonTextAgregar}>
                  {editarId == null ? 'AGREGAR' : 'GUARDAR'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={commonStyles.buttonCancelar} onPress={cancelarEdicion}>
                <Text style={commonStyles.buttonTextAgregar}>CANCELAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 80,
    flexGrow: 1,
  },
  objectName: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 10,
  },
  activeLabel: {
    color: '#237a3b',
    flex: 1,
    fontWeight: 'bold',
  },
  inactiveLabel: {
    color: '#666',
    flex: 1,
  },
  activateButton: {
    backgroundColor: '#eaf1f7',
    borderRadius: 5,
    marginRight: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  activateText: {
    color: '#192f6a',
  },
  iconButton: {
    alignItems: 'center',
    marginLeft: 16,
    padding: 5,
  },
  emptyText: {
    color: '#666',
    padding: 20,
    textAlign: 'center',
  },
  modalOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 18,
  },
  label: {
    marginBottom: 6,
  },
  input: {
    borderColor: '#ccc',
    borderRadius: 5,
    borderWidth: 1,
    marginBottom: 18,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
