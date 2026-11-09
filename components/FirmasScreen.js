import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  StyleSheet,
  Button,
  Alert,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  Pressable
} from 'react-native';
import { AppText as Text, AppTextInput as TextInput } from './AppText';

import { commonStyles } from '../styles/commonStyles.js';
import { useSQLiteContext } from 'expo-sqlite';
import { FontAwesome5 } from '@expo/vector-icons';
import LicenciaContext from '../contexts/LicenciaContext';
import ScreenHeader from './ScreenHeader';

export default function FirmasScreen() {
  return (
    <View style={styles.container}>     
        <Main />    
    </View>
  );
}

function Main() {
  const db = useSQLiteContext();
  const { licenciaActiva } = useContext(LicenciaContext);

  const [firmas, setFirmas] = useState([]);
  const [resumen, setResumen] = useState({
    totalFirmas: 0,
  });

  // Cargar datos firmas
  async function loadDatos() {
    try {
      // Cargar firmas
      const listaFirmas = await db.getAllAsync('SELECT * FROM firmas');
      setFirmas(listaFirmas);
      
      // Resumen: conteo firmas
      const totalFirmasRes = await db.getFirstAsync('SELECT COUNT(*) AS total FROM firmas');

      setResumen({
        totalFirmas: totalFirmasRes?.total ?? 0,
      });

    } catch (e) {
      Alert.alert('Error', 'No se pudieron cargar los datos.');
    }
  }

  useEffect(() => {
    if (db) loadDatos();
  }, [db]);

  // Funciones CRUD
  async function agregarFirma(
    nombre,
    cargo,
    telefono,
    correo
  ) {
    if (!nombre.trim()) {
      Alert.alert('Validación', 'Por favor ingresa el nombre del firmante.');
      return;
    }
    try {
      await db.runAsync(
        `INSERT INTO firmas 
          (nombre, cargo, telefono, correo)
         VALUES (?, ?, ?, ?)`,
        nombre,
        cargo,
        telefono,
        correo        
      );
      await loadDatos();
    } catch (e) {
      Alert.alert('Error', 'No se pudo agregar la firma.');
    }
  }

  async function eliminarFirma(id) {
    Alert.alert(
      'Confirmar borrado',
      '¿Seguro quieres eliminar esta firma?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.runAsync('DELETE FROM firmas WHERE id = ?', id);
              await loadDatos();
            } catch (e) {
              Alert.alert('Error', 'No se pudo eliminar la firma.');
            }
          },
        },
      ]
    );
  }

  async function guardarEdicion(
    editarId,
    nombre,
    cargo,
    telefono,
    correo
  ) {
    if (!nombre.trim()) {
      Alert.alert('Validación', 'Por favor ingresa el nombre del firmante.');
      return;
    }
    try {
      await db.runAsync(
        `UPDATE firmas SET
           nombre = ?,
           cargo = ?,
           telefono = ?,
           correo = ?
         WHERE id = ?`,
        nombre,
        cargo,
        telefono,
        correo,
        editarId
      );
      await loadDatos();
    } catch (e) {
      Alert.alert('Error', 'No se pudo actualizar la firma.');
    }
  }

  return (
    <>      
      <Content
        firmas={firmas}
        onAgregar={agregarFirma}
        onEliminar={eliminarFirma}
        onGuardarEdicion={guardarEdicion}
        resumen={resumen}
      />
    </>
  );
}

function Header({ resumen }) {
  return (
    <View style={styles.headerContainer}>
      <Text style={styles.headerText}>
        Total Firmas: {resumen.totalFirmas} {'\n'}
      </Text>
    </View>
  );
}

function Content({ firmas, onAgregar, onEliminar, onGuardarEdicion, resumen }) {
  const [modalVisible, setModalVisible] = useState(false);

  const [nombre, setNombre] = useState('');
  const [cargo, setCargo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');

  const [editarId, setEditarId] = useState(null);

  const firmaInputRef = useRef(null);

  useEffect(() => {
    if (modalVisible && firmaInputRef.current) {
      firmaInputRef.current.focus();
    }
  }, [modalVisible]);

  function limpiarCampos() {
    setNombre('');
    setCargo('');
    setTelefono('');
    setCorreo('');
    setEditarId(null);
  }

  function abrirModalParaAgregar() {
    limpiarCampos();
    setModalVisible(true);
  }

  function iniciarEdicion(item) {
    setEditarId(item.id);
    setNombre(item.nombre ?? '');
    setCargo(item.cargo ?? '');
    setTelefono(item.telefono ?? '');
    setCorreo(item.correo ?? '');
    setModalVisible(true);
  }

  async function handleGuardar() {
    if (editarId) {
      await onGuardarEdicion(
        editarId,
        nombre,
        cargo,
        telefono,
        correo
      );
    } else {
      await onAgregar(
        nombre,
        cargo,
        telefono,
        correo
      );
    }
    limpiarCampos();
    setModalVisible(false);
  }

  function handleCancelar() {
    limpiarCampos();
    setModalVisible(false);
  }

  return (
    <View style={styles.contentContainer}>
      <ScreenHeader
        title="FIRMAS"
        count={resumen.totalFirmas}
        backHref="/Principal"
      />


      <ScrollView style={{ paddingHorizontal: 5}}>
        {firmas.map((item) => (
          <View style={[commonStyles.detallesItemContainer, {paddingVertical: 5}]} key={item.id}>
            <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.nombre}</Text>
            <Text>Cargo: {item.cargo}</Text>
            <Text>Teléfono: {item.telefono}</Text>
            <Text>Correo: {item.correo}</Text>

             <View style={commonStyles.editarItemListadoClientes}>
                <Pressable onPress={() => iniciarEdicion(item)}>
                  <FontAwesome5 name="edit" size={16} color="#4b86b4" />
                </Pressable>
              </View>  
              <View style={commonStyles.eliminarItemListadoClientes}>
                <Pressable onPress={() => onEliminar(item.id)}>
                  <FontAwesome5 name="trash" size={16} color="red" />
                </Pressable>
              </View>
          </View>
        ))}
      </ScrollView>

       <Pressable
          style={commonStyles.buttonFlotante}
          onPress={() => abrirModalParaAgregar()}
        >
          <FontAwesome5 name="plus" size={20} color="white" />
        </Pressable>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancelar}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {editarId ? 'Editar Firma' : 'Agregar Firma'}
            </Text>

            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{paddingBottom: 16}}>
              <Text style={styles.label}>Nombre del Firmante</Text>
              <TextInput
                ref={firmaInputRef}
                style={styles.input}
                placeholder="Nombre del Firmante"
                value={nombre}
                onChangeText={setNombre}
                autoFocus={true}
              />
              <Text style={styles.label}>Cargo</Text>
              <TextInput
                style={styles.input}
                placeholder="Cargo"
                value={cargo}
                onChangeText={setCargo}
              />
              <Text style={styles.label}>Teléfono</Text>
              <TextInput
                style={styles.input}
                placeholder="Teléfono"
                value={telefono}
                onChangeText={setTelefono}
              />
              <Text style={styles.label}>Correo</Text>
               <TextInput
                style={styles.input}
                placeholder="Correo"
                value={correo}
                onChangeText={setCorreo}
              />
              

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                <TouchableOpacity style={commonStyles.buttonAgregar} onPress={handleGuardar} >
                  <Text style={commonStyles.buttonTextAgregar}>{editarId ? "GUARDAR" : "AGREGAR"}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={commonStyles.buttonCancelar} onPress={handleCancelar} >
                  <Text style={commonStyles.buttonTextAgregar}>CANCELAR</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1,  backgroundColor: '#fff' },
  headerContainer: {
    padding: 16,
    backgroundColor: '#4b86b4',
    marginBottom: 16,
    borderRadius: 10,
  },
  headerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: 'white',
    marginBottom: 16,
  },
  itemContainer: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 12,
  },
  botonesCabecera: {
    flexDirection: 'row',
    marginTop: 8,
    justifyContent: 'space-between',
    width: '100%',
  },
  botonesContainer: {
    flexDirection: 'row',
    marginTop: 8,
    justifyContent: 'flex-end',
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4b86b4',
    borderRadius: 5,
    padding: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 6,
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  modalOverlay: {
    flex:1,
    backgroundColor: 'rgba(0,0,0,0.5)', // Semi transparente para modal
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    width: '100%',
    maxHeight: '85%',
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  pickerContainer: {
    marginBottom: 8,
  },
  pickerLabel: {
    paddingLeft: 4,
    color: 'gray'

  },
  pickerIOS: {
    height: 150,
  },
  pickerAndroid: {
    height: 50,
    width: '100%',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 6,
    marginBottom: 8,
    // ajusta padding si es necesario para que se vea bien
    overflow: 'hidden', // importante para que el borde redondeado funcione
  }
});