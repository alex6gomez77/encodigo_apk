import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  Pressable
} from 'react-native';
import { AppText as Text, AppTextInput as TextInput, AppPicker as Picker } from './AppText';

import { commonStyles } from '../styles/commonStyles.js';
import { useSQLiteContext } from 'expo-sqlite';
import { FontAwesome5 } from '@expo/vector-icons';
import LicenciaContext from '../contexts/LicenciaContext';
import ScreenHeader from './ScreenHeader';

export default function CargosScreen() {
  return (
    <View style={styles.container}>     
        <Main />    
    </View>
  );
}

function Main() {
  const db = useSQLiteContext();

  const [cargos, setCargos] = useState([]);
  const [resumen, setResumen] = useState({
    totalCargos: 0,
  });

  // Arreglo de categorías ocupacionales
  const categoriasOcupacionales = [
    { id: 'C', nombre: 'CUADRO' },
    { id: 'T', nombre: 'TÉCNICO' },
    { id: 'S', nombre: 'OBRA' },
    { id: 'O', nombre: 'OPERARIO' },
    { id: 'A', nombre: 'ADMINISTRATIVO' }
  ];

  // Cargar datos cargos
  async function loadDatos() {
    try {
      // Cargar cargos
      const listaCargos = await db.getAllAsync('SELECT * FROM cargos');
      setCargos(listaCargos);
      
      // Resumen: conteo cargos
      const totalCargosRes = await db.getFirstAsync('SELECT COUNT(*) AS total FROM cargos');

      setResumen({
        totalCargos: totalCargosRes?.total ?? 0,
      });

    } catch (e) {
      Alert.alert('Error', 'No se pudieron cargar los datos.');
    }
  }

  useEffect(() => {
    if (db) loadDatos();
  }, [db]);

  // Funciones CRUD
  async function agregarCargo(
    cargo,
    catocupacional_id,
    grupoescala,
    salarioescala,
    tarifahoraria,
    activo
  ) {
    if (!cargo.trim()) {
      Alert.alert('Validación', 'Por favor ingresa el nombre del cargo.');
      return;
    }
    try {
      await db.runAsync(
        `INSERT INTO cargos
          (cargo, catocupacional_id, grupoescala, salarioescala, tarifahoraria, activo)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        cargo,
        catocupacional_id,
        grupoescala,
        salarioescala,
        tarifahoraria,
        activo
      );
      await loadDatos();
    } catch (e) {
      Alert.alert('Error', 'No se pudo agregar el cargo.');
    }
  }

  async function eliminarCargo(id) {
    Alert.alert(
      'Confirmar borrado',
      '¿Seguro quieres eliminar este cargo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.runAsync('DELETE FROM cargos WHERE id = ?', id);
              await loadDatos();
            } catch (e) {
              Alert.alert('Error', 'No se pudo eliminar el cargo.');
            }
          },
        },
      ]
    );
  }

  async function guardarEdicion(
    editarId,
    cargo,
    catocupacional_id,
    grupoescala,
    salarioescala,
    tarifahoraria,
    activo
  ) {
    if (!cargo.trim()) {
      Alert.alert('Validación', 'Por favor ingresa el nombre del cargo.');
      return;
    }
    try {
      await db.runAsync(
        `UPDATE cargos SET
           cargo = ?,
           catocupacional_id = ?,
           grupoescala = ?,
           salarioescala = ?,
           tarifahoraria = ?,
           activo = ?
         WHERE id = ?`,
        cargo,
        catocupacional_id,
        grupoescala,
        salarioescala,
        tarifahoraria,
        activo,
        editarId
      );
      await loadDatos();
    } catch (e) {
      Alert.alert('Error', 'No se pudo actualizar el cargo.');
    }
  }

  return (
    <>      
      <Content
        cargos={cargos}
        onAgregar={agregarCargo}
        onEliminar={eliminarCargo}
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
        Total Cargos: {resumen.totalCargos} {'\n'}
      </Text>
    </View>
  );
}

function Content({ cargos, onAgregar, onEliminar, onGuardarEdicion, resumen }) {
  const [modalVisible, setModalVisible] = useState(false);

  const [cargo, setCargo] = useState('');
  const [catocupacional_id, setCatocupacionalId] = useState('C');
  const [grupoescala, setGrupoescala] = useState('');
  const [salarioescala, setSalarioescala] = useState('');
  const [tarifahoraria, setTarifahoraria] = useState('');
  const [activo, setActivo] = useState(1);

  const [editarId, setEditarId] = useState(null);

  // Arreglo de categorías ocupacionales
  const categoriasOcupacionales = [
    { id: 'C', nombre: 'Cuadro' },
    { id: 'T', nombre: 'Técnico' },
    { id: 'S', nombre: 'Obra' },
    { id: 'O', nombre: 'Operario' },
    { id: 'A', nombre: 'Administrativo' }
  ];

  const firmaInputRef = useRef(null);

  useEffect(() => {
    if (modalVisible && firmaInputRef.current) {
      firmaInputRef.current.focus();
    }
  }, [modalVisible]);

  function limpiarCampos() {
    setCargo('');
    setCatocupacionalId('C');
    setGrupoescala('');
    setSalarioescala('');
    setTarifahoraria('');
    setActivo(1);
    setEditarId(null);
  }

  function abrirModalParaAgregar() {
    limpiarCampos();
    setModalVisible(true);
  }

  function iniciarEdicion(item) {
    setEditarId(item.id);
    setCargo(item.cargo ?? '');
    setCatocupacionalId(item.catocupacional_id ?? 'C');
    setGrupoescala(item.grupoescala ?? '');
    setSalarioescala(item.salarioescala?.toString() ?? '');
    setTarifahoraria(item.tarifahoraria?.toString() ?? '');
    setActivo(item.activo ?? 1);
    setModalVisible(true);
  }

  async function handleGuardar() {
    if (editarId) {
      await onGuardarEdicion(
        editarId,
        cargo,
        catocupacional_id,
        grupoescala,
        salarioescala ? parseInt(salarioescala) : null,
        tarifahoraria ? parseFloat(tarifahoraria) : 0,
        activo
      );
    } else {
      await onAgregar(
        cargo,
        catocupacional_id,
        grupoescala,
        salarioescala ? parseInt(salarioescala) : null,
        tarifahoraria ? parseFloat(tarifahoraria) : 0,
        activo
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
        title="CARGOS"
        count={resumen.totalCargos}
        backHref="/Principal"
      />


      <ScrollView style={{ paddingHorizontal: 5}}>
        {cargos.map((item) => (
          <View style={[commonStyles.detallesItemContainer]} key={item.id}>
            <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.cargo}</Text>
            <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-between', paddingRight: 80}}>
            <Text>Categoría: {categoriasOcupacionales.find(cat => cat.id === item.catocupacional_id)?.nombre || item.catocupacional_id}</Text>
            <Text>Grupo: {item.grupoescala}</Text>
            </View>
            <View style={{flex: 1, flexDirection: 'row', justifyContent: 'space-between', paddingRight: 80}}>
            <Text>Salario: $ {item.salarioescala.toFixed(2)}</Text>
            <Text>Tarifa Horaria: $ {item.tarifahoraria.toFixed(2)}</Text>
            </View>
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
              {editarId ? 'Editar Cargo' : 'Agregar Cargo'}
            </Text>

            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{paddingBottom: 16}}>
              <Text style={styles.label}>Nombre del Cargo</Text>
              <TextInput
                ref={firmaInputRef}
                style={styles.input}
                placeholder="Nombre del cargo"
                value={cargo}
                onChangeText={setCargo}
                autoFocus={true}
              />
              <Text style={styles.label}>Categoría Ocupacional</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={catocupacional_id}
                  onValueChange={setCatocupacionalId}
                  style={styles.pickerAndroid}
                >
                  {categoriasOcupacionales.map((cat) => (
                    <Picker.Item key={cat.id} label={cat.nombre} value={cat.id} />
                  ))}
                </Picker>
              </View>
              <Text style={styles.label}>Grupo Escala</Text>
              <TextInput
                style={styles.input}
                placeholder="Grupo escala"
                value={grupoescala}
                onChangeText={setGrupoescala}
              />
              
              <Text style={styles.label}>Salario Escala</Text>
              <TextInput
                style={styles.input}
                placeholder="Salario escala"
                value={salarioescala}
                onChangeText={setSalarioescala}
                keyboardType="numeric"
              />
              <Text style={styles.label}>Tarifa Horaria</Text>
              <TextInput
                style={styles.input}
                placeholder="Tarifa horaria"
                value={tarifahoraria}
                onChangeText={setTarifahoraria}
                keyboardType="numeric"
              />
              
            </ScrollView>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                <TouchableOpacity style={commonStyles.buttonAgregar} onPress={handleGuardar} >
                  <Text style={commonStyles.buttonTextAgregar}>{editarId ? "GUARDAR" : "AGREGAR"}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={commonStyles.buttonCancelar} onPress={handleCancelar} >
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