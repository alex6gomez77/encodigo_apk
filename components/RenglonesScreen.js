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
import { AppText as Text, AppTextInput as TextInput,  } from './AppText';

import { commonStyles } from '../styles/commonStyles.js';
import ScreenHeader from './ScreenHeader';
import { useSQLiteContext } from 'expo-sqlite';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { obtenerRenglonesFiltrados, contarRenglonesFiltrados, eliminarFiltro, actualizarFiltro } from '../db/database.js';
import { useSuministroSelection } from '../contexts/SuministroSelectionContext';



const TABLA_ID = 'RC'; // esta pantalla filtra renglones constructivos
const LIMITE = 50;

export default function RenglonesScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [renglones, setRenglones] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hayMas, setHayMas] = useState(true);
  const [todos, setTodos] = useState(0);
  const [filtro, setFiltro] = useState('');
  const [cadenafiltro, setCadenafiltro] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [filtroVisible, setFiltroVisible] = useState(false);
  const cargandoRef = useRef(false);
  const filtroRef = useRef(null);
  const { setSelectedSuministro } = useSuministroSelection();

  const cargarInicial = useCallback(async (estaActiva = () => true) => {
    try {
      const primeros = await obtenerRenglonesFiltrados(db, TABLA_ID, LIMITE, 0);
      const total = await contarRenglonesFiltrados(db, TABLA_ID);
      const elFiltro = await db.getFirstAsync(
        'SELECT * FROM filtros WHERE tabla_id = ? ORDER BY id DESC LIMIT 1',
        TABLA_ID
      );
      if (!estaActiva()) return;

      setTodos(total);
      setRenglones(primeros);
      setOffset(primeros.length);
      setHayMas(primeros.length < total);
      setCadenafiltro(elFiltro?.filtro ?? '');
      setFiltroVisible(Boolean(elFiltro?.valor));
    } catch (error) {
      if (estaActiva()) {
        const detalle = error instanceof Error ? error.message : JSON.stringify(error);
        Alert.alert('Error', `No se pudieron cargar los renglones. ${detalle || String(error)}`);
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
      const nuevos = await obtenerRenglonesFiltrados(db, TABLA_ID, LIMITE, offset);
      setRenglones(prev => [...prev, ...nuevos]);
      setOffset(prev => prev + nuevos.length);
      setHayMas(offset + nuevos.length < todos);
    } catch (error) {
      const detalle = error instanceof Error ? error.message : JSON.stringify(error);
      Alert.alert('Error', `No se pudieron cargar más renglones. ${detalle || String(error)}`);
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

  const abrirModalDetalles = (item) => {
    setSelectedSuministro(null);
    router.push({
      pathname: '/DetalleRenglon',
      params: { id: String(item.IDRVariante) },
    });
  }
  
  function handleCancelar() {
    limpiarCampos();
    setModalVisible(false);
  }


  useEffect(() => {
    if (modalVisible && filtroRef.current) {
      filtroRef.current.focus();
    }
  }, [modalVisible]);

  return (
    <View style={styles.contentContainer}>
      <ScreenHeader
        title="RENGLONES CONSTRUCTIVOS"
        count={todos}
        onBack={() => router.back()}
      />
      {filtroVisible ?
      <Text style={commonStyles.headerFiltro}>
        Filtrado por { cadenafiltro }         
      </Text>
      : 
      <Text style={commonStyles.headerFiltro}>Se muestran 'Todos los Renglones Constructivos'
      </Text>
      }
      {renglones.length ==0 ?
        <View style={{flexDirection: 'column', textAlign: 'center', alignItems: 'center'}}>
           <FontAwesome5 style={{ color: '#192f6a',marginLeft: 15,fontWeight: 'bold', textAlign: 'center'}} name="exclamation-triangle" size={50} color="#192f6a" />
          <Text style={{ color: '#192f6a',marginLeft: 15,fontWeight: 'bold', textAlign: 'center'}}>
            ATENCIÓN!
          </Text>
          <Text style={{ color: '#192f6a',marginLeft: 15, textAlign: 'center'}}>
          NO EXISTEN RENGLONES CONSTRUCTIVOS PARA { cadenafiltro }.
          </Text>
       </View>
      : 
      ''
      
      }
    <FlatList
      style={{ paddingHorizontal: 5}}
      data={renglones}
      keyExtractor={(item) => item.IDRVariante.toString()}
      renderItem={({ item }) => (
        <View style={[commonStyles.detallesItemContainer, {paddingVertical: 0}]}>
          <View style={{flexDirection: 'row', alignItems: 'center', paddingHorizontal: 0}}>
            <Text style={commonStyles.campoCodigo}>{item.IDRVariante} </Text>
              <Text 
                style={[commonStyles.campoCodigo2, { flex: 1, flexShrink: 1 }]} 
                numberOfLines={3} 
                ellipsizeMode="tail"
              > 
                {item.SobreGrupo}  | {item.Grupo}  | {item.SubGrupo}
              </Text>
          </View>
            <Pressable              
              onPress={() => abrirModalDetalles(item)}
            >
             <Text style={{ fontSize: 14, fontFamily: 'FiraSans_400Regular', fontWeight: 'bold', color: '#192f6a' }}>{item.RVariante}</Text>
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
      : ''}

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
  }, detallesItemContainer: {
    backgroundColor: '#fff',
    borderRadius: 5,
    paddingHorizontal: 10,
    margin: 5,
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
  gradienteResumenContainerFichas: {
    alignItems: 'center',
    backgroundColor: '#f2f2f2', 
    borderRadius: 5,
    padding: 5,
    width: '40%',
    marginBottom: 5,
    overflow: 'hidden',
    flexShrink: 1,
    marginHorizontal: 20
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
  label: {
    fontSize: 16,
    marginBottom: 8,
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
