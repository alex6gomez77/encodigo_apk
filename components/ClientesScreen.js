import { useState, useRef, useEffect,  useCallback } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { AppText as Text, AppTextInput as TextInput } from './AppText';
import ScreenHeader from './ScreenHeader';
import { commonStyles } from '../styles/commonStyles';

export default function ClientesScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [clientes, setClientes] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editarId, setEditarId] = useState(null);
  const [nombre, setNombre] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const cargarClientes = useCallback(async () => {
    try {
      const lista = await db.getAllAsync(
        `SELECT clientes.id, clientes.cliente,
                COUNT(obras.id) AS obras_asignadas
         FROM clientes
         LEFT JOIN obras ON obras.cliente_id = clientes.id
         GROUP BY clientes.id, clientes.cliente
         ORDER BY clientes.cliente COLLATE NOCASE`
      );
      setClientes(lista);
    } catch (error) {
      Alert.alert('Error', `No se pudieron cargar los clientes. ${error.message}`);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      cargarClientes();
    }, [cargarClientes])
  );

  const clientesFiltrados = clientes.filter(cliente =>
    String(cliente.cliente ?? '').toLocaleLowerCase().includes(busqueda.trim().toLocaleLowerCase())
  );

  const abrirAgregar = () => {
    setEditarId(null);
    setNombre('');
    setModalVisible(true);
  };

  const abrirEdicion = (cliente) => {
    setEditarId(cliente.id);
    setNombre(cliente.cliente ?? '');
    setModalVisible(true);
  };

  const cancelarEdicion = () => {
    setModalVisible(false);
    setEditarId(null);
    setNombre('');
  };

  const guardarCliente = async () => {
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) {
      Alert.alert('Validación', 'Escribe el nombre del cliente.');
      return;
    }

    try {
      const duplicado = await db.getFirstAsync(
        `SELECT id FROM clientes
         WHERE TRIM(cliente) = ? COLLATE NOCASE
           AND id != ?
         LIMIT 1`,
        nombreLimpio,
        editarId ?? -1
      );
      if (duplicado) {
        Alert.alert('Validación', 'Ya existe un cliente con ese nombre.');
        return;
      }

      if (editarId == null) {
        await db.runAsync('INSERT INTO clientes (cliente) VALUES (?)', nombreLimpio);
      } else {
        await db.runAsync(
          'UPDATE clientes SET cliente = ? WHERE id = ?',
          nombreLimpio,
          editarId
        );
      }

      cancelarEdicion();
      await cargarClientes();
    } catch (error) {
      Alert.alert('Error', `No se pudo guardar el cliente. ${error.message}`);
    }
  };

  const eliminarCliente = (cliente) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Quieres eliminar el cliente "${cliente.cliente}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const obrasAsignadas = await db.getFirstAsync(
                'SELECT COUNT(*) AS total FROM obras WHERE cliente_id = ?',
                cliente.id
              );
              if (obrasAsignadas?.total > 0) {
                Alert.alert(
                  'No se puede eliminar',
                  `Este cliente está asociado a ${obrasAsignadas.total} obra(s). Cambia primero el cliente de esas obras.`
                );
                return;
              }

              await db.runAsync('DELETE FROM clientes WHERE id = ?', cliente.id);
              await cargarClientes();
            } catch (error) {
              Alert.alert('Error', `No se pudo eliminar el cliente. ${error.message}`);
            }
          },
        },
      ]
    );
  };

  const renderCliente = ({ item }) => (
    <View style={commonStyles.detallesItemContainer}>
      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{item.cliente || 'Cliente sin nombre'}</Text>
        <Text style={styles.clientWorks}>
          Obras asociadas: {Number(item.obras_asignadas ?? 0)}
        </Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Editar ${item.cliente}`}
          onPress={() => abrirEdicion(item)}
          style={styles.actionButton}
        >
          <FontAwesome5 name="edit" size={17} color="#4b86b4" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Eliminar ${item.cliente}`}
          onPress={() => eliminarCliente(item)}
          style={styles.actionButton}
        >
          <FontAwesome5 name="trash" size={17} color="#c62828" />
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="CLIENTES"
        count={clientes.length}
        onBack={() => router.back()}
      />

      <View style={styles.searchContainer}>
        <FontAwesome5 name="search" size={16} color="#667085" />
        <TextInput
          accessibilityLabel="Buscar clientes"
          placeholder="Buscar cliente..."
          value={busqueda}
          onChangeText={setBusqueda}
          style={styles.searchInput}
          autoCapitalize="none"
        />
        {!!busqueda && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Limpiar búsqueda"
            onPress={() => setBusqueda('')}
            hitSlop={8}
          >
            <FontAwesome5 name="times-circle" size={17} color="#667085" />
          </Pressable>
        )}
      </View>

      <FlatList
        data={clientesFiltrados}
        keyExtractor={item => String(item.id)}
        renderItem={renderCliente}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {busqueda ? 'No hay clientes que coincidan con la búsqueda.' : 'Aún no hay clientes.'}
          </Text>
        }
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Agregar cliente"
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
              {editarId == null ? 'Agregar cliente' : 'Editar cliente'}
            </Text>
            <Text style={styles.label}>Nombre del cliente</Text>
            <TextInput
              autoFocus
              style={styles.input}
              placeholder="Nombre del cliente"
              value={nombre}
              onChangeText={setNombre}
              returnKeyType="done"
              onSubmitEditing={guardarCliente}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={commonStyles.buttonAgregar} onPress={guardarCliente}>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 12,
    marginVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  searchInput: {
    flex: 1,
    minHeight: 44,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 80,
  },
  clientInfo: {
    flex: 1,
    paddingRight: 12,
  },
  clientName: {
    color: '#192f6a',
    fontSize: 16,
    fontWeight: '700',
  },
  clientWorks: {
    color: '#666',
    fontSize: 13,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    padding: 20,
    color: '#666',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 18,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  label: {
    fontWeight: '600',
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginTop: 5,
    backgroundColor: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },
});
