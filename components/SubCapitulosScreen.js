import { useState, useRef, useEffect,  useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  Pressable
} from 'react-native';
import { AppText as Text, AppTextInput as TextInput } from './AppText';

import { commonStyles } from '../styles/commonStyles.js';
import ScreenHeader from './ScreenHeader';
import { useSQLiteContext } from 'expo-sqlite';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { obtenerSubCapitulosFiltrados, contarSubCapitulosFiltrados, eliminarFiltro, actualizarFiltro } from '../db/database.js';



const TABLA_ID = 'SC'; // esta pantalla filtra subcapitulos constructivos
const LIMITE = 50;

export default function SubCapitulosScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [subcapitulos, setSubCapitulos] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hayMas, setHayMas] = useState(true);
  const [todos, setTodos] = useState(0);
  const [filtro, setFiltro] = useState('');
  const [cadenafiltro, setCadenafiltro] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalDetalleVisible, setModalDetalleVisible] = useState(false);
  const [filtroVisible, setFiltroVisible] = useState(false);
  const filtroRef = useRef(null);
  const cargandoRef = useRef(false);

  const cargarInicial = useCallback(async (estaActiva = () => true) => {
    try {
      const [primeros, total, elFiltro] = await Promise.all([
        obtenerSubCapitulosFiltrados(db, TABLA_ID, LIMITE, 0),
        contarSubCapitulosFiltrados(db, TABLA_ID),
        db.getFirstAsync(
          'SELECT * FROM filtros WHERE tabla_id = ? ORDER BY id DESC LIMIT 1',
          TABLA_ID
        ),
      ]);
      if (!estaActiva()) return;

      setTodos(total);
      setSubCapitulos(primeros);
      setOffset(primeros.length);
      setHayMas(primeros.length < total);
      setCadenafiltro(elFiltro?.filtro ?? '');
      setFiltroVisible(Boolean(elFiltro?.valor));
    } catch (error) {
      if (estaActiva()) {
        const detalle = error instanceof Error ? error.message : JSON.stringify(error);
        Alert.alert('Error', `No se pudieron cargar los subcapítulos. ${detalle || String(error)}`);
      }
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      let estaActiva = true;
      cargarInicial(() => estaActiva);
      return () => {
        estaActiva = false;
      };
    }, [cargarInicial])
  );

  const cargarMas = async () => {
    if (cargandoRef.current || !hayMas) return;
    cargandoRef.current = true;
    try {
      const nuevos = await obtenerSubCapitulosFiltrados(db, TABLA_ID, LIMITE, offset);
      setSubCapitulos(prev => [...prev, ...nuevos]);
      setOffset(prev => prev + nuevos.length);
      setHayMas(offset + nuevos.length < todos);
    } catch (error) {
      const detalle = error instanceof Error ? error.message : JSON.stringify(error);
      Alert.alert('Error', `No se pudieron cargar más subcapítulos. ${detalle || String(error)}`);
    } finally {
      cargandoRef.current = false;
    }
  };

  const eliminarelFiltro = async () => {
    try {
      await eliminarFiltro(db, TABLA_ID);
      await cargarInicial();
    } catch (error) {
      const detalle = error instanceof Error ? error.message : JSON.stringify(error);
      Alert.alert('Error', `No se pudo eliminar el filtro. ${detalle || String(error)}`);
    }
  }

  const handleFiltrar = async () => {
    try {
      await actualizarFiltro(db, TABLA_ID, "*", filtro);
      setModalVisible(false);
      await cargarInicial();
    } catch (error) {
      const detalle = error instanceof Error ? error.message : JSON.stringify(error);
      Alert.alert('Error', `No se pudo aplicar el filtro. ${detalle || String(error)}`);
    }
  }

  function limpiarCampos() {
    setFiltro('');
  }

  function abrirModalFiltrado() {
    limpiarCampos();
    setModalVisible(true);
  }

  const filtrarEIrARenglones = async (item) => {
    try {
      await actualizarFiltro(db, "RC", "rvariantes.IDSubGrupo", item.IDSubGrupo);
      router.push('/Renglones');
    } catch (error) {
      const detalle = error instanceof Error ? error.message : JSON.stringify(error);
      Alert.alert('Error', `No se pudieron abrir los renglones. ${detalle || String(error)}`);
    }
  };


  function handleCancelar() {
    limpiarCampos();
    setModalVisible(false);
    setModalDetalleVisible(false);
  }


  useEffect(() => {
    if (modalVisible && filtroRef.current) {
      filtroRef.current.focus();
    }
  }, [modalVisible]);

  return (
    <View style={styles.contentContainer}>
      <ScreenHeader title="SUB CAPÍTULOS" count={todos} onBack={() => router.back()} />
      {filtroVisible ?
      <Text style={commonStyles.headerFiltro}>
        Filtrado por { cadenafiltro }         
      </Text>
      : 
      <Text style={commonStyles.headerFiltro}>Se muestran 'Todos los SubCapítulos'
      </Text>
      }
    <FlatList
      style={{ paddingHorizontal: 5}}
      data={subcapitulos}
      keyExtractor={(item) => item.IDSubGrupo.toString()}
      renderItem={({ item }) => (
        <View style={[commonStyles.detallesItemContainer, {paddingVertical: 0}]}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 3 }}>
            <Text style={commonStyles.campoCodigo}>{item.IDSubGrupo} </Text>
            <Text style={commonStyles.campoCodigo2}> {item.SobreGrupo}  | {item.Grupo} </Text>
          </View>
            <Pressable              
              onPress={() => filtrarEIrARenglones(item)}
            >
             <Text style={{ fontSize: 14, fontFamily: 'FiraSans_400Regular', fontWeight: 'bold', color: '#192f6a' }}>{item.SubGrupo}</Text>
            </Pressable>
          
        </View>
      )}
      onEndReached={cargarMas}
      onEndReachedThreshold={0.5}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={5}
      removeClippedSubviews
    />

     <Pressable
        style={[commonStyles.buttonFlotante, {justifyContent: 'center'}]}
        onPress={() => abrirModalFiltrado()}
      >
        <FontAwesome5 name="filter" size={15} color="white" />
      </Pressable>

      {filtroVisible ?  
      <Pressable
        style={commonStyles.buttonFlotanteEliminarFiltro}
        onPress={() => eliminarelFiltro()}
      >
        <FontAwesome5 name="trash" size={12} color="red" />
      </Pressable>
      : null}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancelar}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              Filtrado
            </Text>

            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{paddingBottom: 16}}>
              <Text style={styles.label}>Filtro</Text>
              <TextInput
                ref={filtroRef}
                style={commonStyles.input}
                placeholder="Filtro..."
                value={filtro}
                onChangeText={setFiltro}
              />  
             
            </ScrollView>
             <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                <TouchableOpacity style={commonStyles.buttonAgregar} onPress={handleFiltrar} >
                  <Text style={commonStyles.buttonTextAgregar}>Filtrar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={commonStyles.buttonCancelar} onPress={handleCancelar} >
                  <Text style={commonStyles.buttonTextAgregar}>Cancelar</Text>
                </TouchableOpacity>
              </View>
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
  contentContainer: {
    flex: 1,
    backgroundColor: 'white',
    marginTop: 10
  },
  logo: {
    width: 50,
    height: 50,
    
  },
  headerText: {
    color: '#192f6a',
    marginLeft: 15,
    fontWeight: 'bold',
  },
  headerText2: {
    color: '#192f6a',
    marginLeft: 15,
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
  modalOverlay2: {
    flex:1,
    backgroundColor: 'rgba(0,0,0,0.5)', // Semi transparente para modal
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer2: {
    backgroundColor: 'white',
    borderRadius: 8,
    width: '100%',
    height: '100%',
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
  },

  texto: {
    fontFamily: 'FiraSans_400Regular',
    fontSize: 18,
  },
});
