
// Contenido completo del archivo components/DetallesFichaScreen.js con los cambios realizados
import { View, FlatList, StyleSheet, Pressable, Modal, TouchableOpacity, Alert, ScrollView,
  Platform } from "react-native";
import { AppText as Text, AppTextInput as TextInput, AppPicker as Picker } from './AppText';
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { useLocalSearchParams, Link } from "expo-router";
import { createIconSetFromFontello, FontAwesome5 } from "@expo/vector-icons";
import { useSQLiteContext } from "expo-sqlite";
import { commonStyles } from "../styles/commonStyles";
import { useState, useEffect } from "react";
import { useLicencia, LICENCIA_ESTADOS } from '../contexts/LicenciaContext.js';
import NumericInput from '../components/NumericInput.js';

const Tab = createMaterialTopTabNavigator();

function MyTabBar({ state, descriptors, navigation }) {
  const icons = {
    Actividades: 'tasks',
    Equipos: 'desktop',
    Recursos: 'boxes',
    Partidas: 'list',
  };

  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const iconName = icons[route.name] || 'circle';

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity key={route.key} onPress={onPress} style={styles.tab}>
            <FontAwesome5 name={iconName} size={20} color={focused ? 'white' : '#bbb'} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const ActividadesScreen = ({ actividades, listaActividades, cargos, agregarActividad, eliminarActividad, isPremiumDisabled }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const initialNuevaFicharhumano = {
    actividad_id: "",
    cargo_id: "",
    cantidad: "1",
    tiempo: "8",
    argumentacion: ""
  };
  const [nuevaFicharhumano, setNuevaFicharhumano] = useState(initialNuevaFicharhumano);

  const onAgregar = () => {
    agregarActividad(nuevaFicharhumano);
    setNuevaFicharhumano(initialNuevaFicharhumano);
    setModalVisible(false);
  };

  return (
    <View style={{ flex: 1, marginTop: 1}}>
      <View style={commonStyles.resumenContainer}>        
        <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between'}}>
          <Text>Actividades {actividades.length}</Text>
          <Text style={{  fontWeight: 'bold' }}>
            ${actividades.reduce((acc, a) => acc + Number(a.costo || 0), 0).toFixed(2)}
          </Text>
        </View>
      </View>
      
      <FlatList        
        data={actividades}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={commonStyles.detallesItemContainer}>
            <Text style={{ fontWeight: 'bold', paddingTop: 5 }}>{`${item.actividad}`}</Text>
            <Text style={{paddingTop: 5}}>{`${item.cargo.toUpperCase()}`}</Text>
            <Text>{`${item.cantidad} x ${item.tiempo} hrs`}</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 4, marginBottom: 2 }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 10, color: '#666' }}>Tarifa Horaria</Text>
                <Text> $ {Number(item.tarifahoraria ?? 0).toFixed(2)}</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 10, color: '#666' }}>Pagado</Text>
                <Text>
                  {item.salariodevengado !== undefined && item.salariodevengado !== null && item.salariodevengado !== ''
                    ? '$ ' + Number(item.salariodevengado).toFixed(2)
                    : '$ 0.00'}
                </Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 10, color: '#666' }}>Vacaciones</Text>
                <Text>
                  {item.vacaciones !== undefined && item.vacaciones !== null && item.vacaciones !== ''
                    ?  '$ ' + Number(item.vacaciones).toFixed(2)
                    : '$ 0.00'}
                </Text>
              </View>
            </View>
            {item.descripcion ?
            <Text style={{ paddingBottom: 5 }}>{`${item.descripcion}`}</Text> : null}

            <View style={commonStyles.etiquetaPrecio} >
              <Text >
                $ {Number(item.costo || 0).toFixed(2)}
              </Text>
            </View>

            <View style={commonStyles.eliminarItemDetalles}>
             <Pressable onPress={() => eliminarActividad(item.id)}>
              <FontAwesome5 name="trash" size={16} color="red" />
            </Pressable>
            </View>
          </View>
        )}
      />
     
      <Pressable
        style={[
                  commonStyles.buttonFlotante,
                  isPremiumDisabled()  && { opacity: 0.3 }
                ]}
                disabled={isPremiumDisabled()}
        onPress={() => setModalVisible(true)}
      >
        <FontAwesome5 name="plus" size={20} color="white" />
      </Pressable>

      <Modal transparent visible={modalVisible} animationType="slide">
        <View style={commonStyles.modalOverlay}>
          <View style={commonStyles.modalContainer}>
            <Text style={commonStyles.modalTitle}>Agregar actividad</Text>

            <View style={commonStyles.pickerContainer}>
              <Text style={commonStyles.pickerLabel}>Actividad</Text>
              <Picker
                selectedValue={nuevaFicharhumano.actividad_id}
                onValueChange={(itemValue) => setNuevaFicharhumano({ ...nuevaFicharhumano, actividad_id: itemValue })}
                style={Platform.OS === 'ios' ? commonStyles.pickerIOS : commonStyles.pickerAndroid}
              >
                <Picker.Item label="Seleccionar actividad" value="" />
                {listaActividades.map((actividad) => (
                  <Picker.Item key={actividad.id} label={actividad.actividad} value={actividad.id} />
                ))}
              </Picker>
            </View>

            <View style={commonStyles.pickerContainer}>
              <Text style={commonStyles.pickerLabel}>Cargo</Text>
              <Picker
                selectedValue={nuevaFicharhumano.cargo_id}
                onValueChange={(itemValue) => setNuevaFicharhumano({ ...nuevaFicharhumano, cargo_id: itemValue })}                
                style={Platform.OS === 'ios' ? commonStyles.pickerIOS : commonStyles.pickerAndroid}
              >
                <Picker.Item label="Seleccionar cargo" value="" />
                {cargos.map((cargo) => (
                  <Picker.Item key={cargo.id} label={cargo.cargo} value={cargo.id} />
                ))}
              </Picker>
            </View>
            <View style={{ flexDirection: 'row', marginBottom: 10, gap: 5 }}>
            <View style={{ flex: 1 }}>
              <Text style={commonStyles.pickerLabel}>Cantidad</Text>
              <TextInput
                placeholder="Cantidad"
                value={nuevaFicharhumano.cantidad}
                onChangeText={(text) => setNuevaFicharhumano({ ...nuevaFicharhumano, cantidad: text })}
                style={commonStyles.input}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={commonStyles.pickerLabel}>Tiempo (Horas)</Text>
              <TextInput
                placeholder="Horas"
                value={nuevaFicharhumano.tiempo}
                onChangeText={(text) => setNuevaFicharhumano({ ...nuevaFicharhumano, tiempo: text })}
                style={commonStyles.input}
                keyboardType="numeric"
              />
            </View>
          </View>

            <Text style={commonStyles.pickerLabel}>Argumentación</Text>
            <TextInput
                placeholder="Argumentación"
                value={nuevaFicharhumano.argumentacion}
                onChangeText={(text) => setNuevaFicharhumano({ ...nuevaFicharhumano, argumentacion: text })}
                style={commonStyles.input}
              />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
              
                <TouchableOpacity style={commonStyles.buttonAgregar} onPress={onAgregar} >
                  <Text style={commonStyles.buttonTextAgregar}>AGREGAR</Text>
                </TouchableOpacity>
                <TouchableOpacity style={commonStyles.buttonCancelar} onPress={() => setModalVisible(false)} >
                  <Text style={commonStyles.buttonTextAgregar}>CANCELAR</Text>
                </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const EquiposScreen = ({ equipos, listaEquipos, agregarEquipo, eliminarEquipo, insumosxequipos, isPremiumDisabled }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const initialNuevoEquipo = {
    equipo_id: "",
    cantidad: "1",
    cantidadhe: "8",
    argumentacion: ""
  };
  const [nuevoEquipo, setNuevoEquipo] = useState(initialNuevoEquipo);
  const [unidadMedida, setUnidadMedida] = useState('U');
  const onAgregar = () => {
    agregarEquipo(nuevoEquipo);
    setNuevoEquipo(initialNuevoEquipo);
    setModalVisible(false);
  };

  const insumosPorEquipo = (equipoId) => {
    return insumosxequipos.filter((insumo) => insumo.equipo_id === equipoId);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={commonStyles.resumenContainer}>
        <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between'}}>
          <Text>Equipos {equipos.length}</Text>
          <Text style={{  fontWeight: 'bold' }}>
            ${equipos.reduce((acc, a) => acc + Number(a.costo || 0), 0).toFixed(2)}
          </Text>
        </View>
      </View>
      <FlatList
        data={equipos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={commonStyles.detallesItemContainer}>
            <Text style={{paddingTop: 5, marginBottom: 5}}>{item.umedida_id == 'HE' ? "Cantidad: " + item.cantidad + " Equipos" : "Uso: " + item.cantidad + " " + item.umedida_id}</Text>
            <Text style={{ fontWeight: 'bold' }}>{item.equipo}</Text>
            
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 4, marginBottom: 2 }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 10, color: '#666' }}>Explotación</Text>
                <Text>  {Number(item.cantidadhe ?? 0).toFixed(2)} Hrs</Text>
              </View>
               <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 10, color: '#666' }}>Depreciación</Text>
                <Text> $ {Number(item.depreciacion ?? 0).toFixed(2)}</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 10, color: '#666' }}>Mantenimiento</Text>
                <Text>
                  {item.mantenimiento !== undefined && item.mantenimiento !== null && item.mantenimiento !== ''
                    ? '$ ' + Number(item.mantenimiento).toFixed(2)
                    : '$ 0.00'}
                </Text>
              </View>              
            </View>
           {item.descripcion ?
            <Text>{`${item.descripcion}`}</Text> : null}
            {insumosPorEquipo(item.equipo_id).length > 0 && (
              <View style={{paddingHorizontal: 8, borderRadius: 6, marginTop: 6, paddingBottom: 8, backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee' }}>
                <Text style={{ fontWeight: 'bold', marginTop: 6, color: 'gray' }}>Insumos</Text>
                {insumosPorEquipo(item.equipo_id).map((insumo) => (
                  <View  key={insumo.id} style={{flexDirection: 'row',  justifyContent: 'space-between'}}>
                    <Text style={{fontSize: 12}}>{insumo.insumo}</Text>
                    <Text style={{fontSize: 12}}>{insumo.indiceconsumo.toFixed(2)} {insumo.umconsumo}</Text>
                  </View>
                ))}
              </View>
            )}
            <View style={commonStyles.etiquetaPrecio}>
              <Text>
                $ {Number(item.costo || 0).toFixed(2)}
              </Text>
            </View>
             <View style={commonStyles.eliminarItemDetalles}>
             <Pressable onPress={() => eliminarEquipo(item.id)}>
              <FontAwesome5 name="trash" size={16} color="red" />
            </Pressable>
            </View>

          </View>
        )}
      />
      <Pressable
       style={[
                  commonStyles.buttonFlotante,
                  isPremiumDisabled()  && { opacity: 0.3 }
                ]}
                disabled={isPremiumDisabled()}
        onPress={() => setModalVisible(true)}
      >
        <FontAwesome5 name="plus" size={20} color="white" />
      </Pressable>

      <Modal transparent visible={modalVisible} animationType="slide">
        <View style={commonStyles.modalOverlay}>
          <View style={commonStyles.modalContainer}>
            <Text style={commonStyles.modalTitle}>Agregar equipo</Text>

            <View style={commonStyles.pickerContainer}>
              <Text style={commonStyles.pickerLabel}>Equipo</Text>
              <Picker
                selectedValue={nuevoEquipo.equipo_id}
                onValueChange={(itemValue) => {                 
                  setNuevoEquipo({ ...nuevoEquipo, equipo_id: itemValue });
                  // Encuentra el equipo y determina la unidad de medida
                  const equipoSeleccionado = listaEquipos.find(e => e.id === itemValue);
                  if (equipoSeleccionado) {
                    if (equipoSeleccionado.umexplotacion === "HE") {
                      setUnidadMedida("U");
                    } else {
                      setUnidadMedida(equipoSeleccionado.umdescripcion || "U");
                    }
                  }
                }}                
                style={Platform.OS === 'ios' ? commonStyles.pickerIOS : commonStyles.pickerAndroid}
              >
                <Picker.Item label="Seleccionar equipo" value="" />
                {listaEquipos.map((equipo) => (
                  <Picker.Item key={equipo.id} label={equipo.equipo} value={equipo.id} />
                ))}
              </Picker>
            </View>

            <Text style={commonStyles.pickerLabel}>Cantidad  ({unidadMedida})</Text>
            <TextInput
              placeholder="Cantidad"
              value={nuevoEquipo.cantidad}
              onChangeText={(text) => setNuevoEquipo({ ...nuevoEquipo, cantidad: text })}
              style={commonStyles.input}
              keyboardType="numeric"
            />

            <Text style={commonStyles.pickerLabel}>Horas de Explotación</Text>
            <TextInput
              placeholder="Horas"
              value={nuevoEquipo.cantidadhe}
              onChangeText={(text) => setNuevoEquipo({ ...nuevoEquipo, cantidadhe: text })}
              style={commonStyles.input}
              keyboardType="numeric"
            />

            <Text style={commonStyles.pickerLabel}>Argumentación</Text>
            <TextInput
              placeholder="Argumentación"
              value={nuevoEquipo.argumentacion}
              onChangeText={(text) => setNuevoEquipo({ ...nuevoEquipo, argumentacion: text })}
              style={commonStyles.input}
            />

             <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
              <TouchableOpacity style={commonStyles.buttonAgregar} onPress={onAgregar} >
                  <Text style={commonStyles.buttonTextAgregar}>AGREGAR</Text>
                </TouchableOpacity>
                <TouchableOpacity style={commonStyles.buttonCancelar} onPress={() => setModalVisible(false)} >
                  <Text style={commonStyles.buttonTextAgregar}>CANCELAR</Text>
                </TouchableOpacity>
            </View>

           
          </View>
        </View>
      </Modal>
    </View>
  );
};

const RecursosScreen = ({ recursos, listaRecursos, agregarRecurso, eliminarRecurso, isPremiumDisabled }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const initialNuevoRecurso = {
    insumo_id: "",
    cantidad: "1",
    precio: "",
    descripcion: "",
    unidad_medida: ''
  };
  const [nuevoRecurso, setNuevoRecurso] = useState(initialNuevoRecurso);

  const onAgregar = () => {
    agregarRecurso(nuevoRecurso);
    setNuevoRecurso(initialNuevoRecurso);
    setModalVisible(false);
  };

  // Manejador del Picker modificado
  const handleRecursoChange = (itemValue) => {
    // Buscar el recurso seleccionado
    
    const recursoSeleccionado = listaRecursos.find(recurso => recurso.id === itemValue);
    if (recursoSeleccionado) {
      setNuevoRecurso({
        ...nuevoRecurso,
        insumo_id: itemValue,
        precio: recursoSeleccionado.preciounitario?.toString() || '', // Auto-completar precio
        unidad_medida: recursoSeleccionado.um || '' // Guardar UM
      });
    } else {
      // Si se selecciona "Seleccionar recurso"
      setNuevoRecurso({
        ...nuevoRecurso,
        insumo_id: '',
        precio: '',
        unidad_medida: ''
      });
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={commonStyles.resumenContainer}>
        <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between'}}>
          <Text>Recursos {recursos.length}</Text>
          <Text style={{  fontWeight: 'bold' }}>
            ${recursos.reduce((acc, a) => acc + Number(a.costo || 0), 0).toFixed(2)}
          </Text>
        </View>
      </View>
      <FlatList
        data={recursos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[commonStyles.detallesItemContainer, {paddingBottom: 8}]}>
            <Text style={{ fontWeight: 'bold', paddingTop: 5 }}>{item.insumo.toUpperCase()}</Text>           
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 4, marginBottom: 2, paddingTop: 5 }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 10, color: '#666' }}>Cantidad</Text>
                <Text>  {Number(item.cantidad ?? 0).toFixed(2)} {item.um}</Text>
              </View>
               <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 10, color: '#666' }}>Precio</Text>
                <Text> $ {Number(item.precio ?? 0).toFixed(2)} / {item.um}</Text>
              </View>                          
            </View>
            {item.descripcion ?
            <Text>{`${item.descripcion}`}</Text> : null}

            <View style={commonStyles.etiquetaPrecio}>
              <Text>
                $ {Number(item.costo || 0).toFixed(2)}
              </Text>
            </View>
            {!item.hook_id ?
             <View style={commonStyles.eliminarItemDetallesRecursos}>
             <Pressable onPress={() => eliminarRecurso(item.id)}>
              <FontAwesome5 name="trash" size={16} color="red" />
            </Pressable>
            </View>
            : 
            <View style={commonStyles.eliminarItemDetallesRecursos}>
             <Pressable onPress={() => Alert.alert('Precausión','Este Recurso solo se elimina quitando el Equipo que lo generó')}>
              <FontAwesome5 name="exclamation" size={16} color="#4c669f" />
            </Pressable>
            </View>
            }
          </View>
        )}
      />
      <Pressable
        style={[
                  commonStyles.buttonFlotante,
                  isPremiumDisabled()  && { opacity: 0.3 }
                ]}
                disabled={isPremiumDisabled()}
        onPress={() => setModalVisible(true)}
      >
        <FontAwesome5 name="plus" size={20} color="white" />
      </Pressable>

      <Modal transparent visible={modalVisible} animationType="slide">
        <View style={commonStyles.modalOverlay}>
          <View style={commonStyles.modalContainer}>
            <Text style={commonStyles.modalTitle}>Agregar recurso</Text>

            <View style={commonStyles.pickerContainer}>
              <Text style={commonStyles.pickerLabel}>Recurso</Text>
              <Picker
                selectedValue={nuevoRecurso.insumo_id}
                onValueChange={handleRecursoChange}                
                style={Platform.OS === 'ios' ? commonStyles.pickerIOS : commonStyles.pickerAndroid}
              >
                <Picker.Item label="Seleccionar recurso" value="" />
                {listaRecursos.map((recurso) => (
                  <Picker.Item key={recurso.id} label={recurso.insumo} value={recurso.id} />
                ))}
              </Picker>
            </View>

             {/* Contenedor flex para cantidad y UM */}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={commonStyles.pickerLabel}>Cantidad
                    ({nuevoRecurso.unidad_medida ? (
                  <Text style={{ marginLeft: 10, marginTop: 20, fontSize: 16, color: '#666' }}>
                    {nuevoRecurso.unidad_medida}
                  </Text>
                ) : 'U'})
                  </Text>
                  <TextInput
                    placeholder="Cantidad"
                    value={nuevoRecurso.cantidad}
                    onChangeText={(text) => setNuevoRecurso({ ...nuevoRecurso, cantidad: text })}
                    style={commonStyles.input}
                    keyboardType="numeric"
                  />
                </View>
                {/* Mostrar UM si hay un recurso seleccionado */}
                
              </View>

            <Text style={commonStyles.pickerLabel}>Precio</Text>
            <TextInput
              placeholder="Precio"
              value={nuevoRecurso.precio}
              onChangeText={(text) => setNuevoRecurso({ ...nuevoRecurso, precio: text })}
              style={commonStyles.input}
              keyboardType="numeric"
            />

            <Text style={commonStyles.pickerLabel}>Argumentación</Text>
            <TextInput
              placeholder="Argumentación"
              value={nuevoRecurso.argumentacion}
              onChangeText={(text) => setNuevoRecurso({ ...nuevoRecurso, descripcion: text })}
              style={commonStyles.input}
            />

             <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
              <TouchableOpacity style={commonStyles.buttonAgregar} onPress={onAgregar} >
                  <Text style={commonStyles.buttonTextAgregar}>AGREGAR</Text>
                </TouchableOpacity>
                <TouchableOpacity style={commonStyles.buttonCancelar} onPress={() => setModalVisible(false)} >
                  <Text style={commonStyles.buttonTextAgregar}>CANCELAR</Text>
                </TouchableOpacity>
            </View>

           
          </View>
        </View>
      </Modal>
    </View>
  );
};


const PartidasScreen = ({ partidas, fichasubpartidas, handleGuardarPartida, conceptos, setConceptos, isPremiumDisabled }) => {
   const [modalVisible, setModalVisible] = useState(false);
   const [titulopartida, setTitulopartida] = useState('Partida X');
   const [modalConceptos, setModalConceptos] = useState([]);
   const [draft, setDraft] = useState([]);

     /* helper para actualizar cualquier campo */
    const update = (id, field, value) =>
      setDraft(prev =>
        prev.map(item =>
          item.id === id ? { ...item, [field]: value } : item
        )
      );

    useEffect(() => {
      if (modalConceptos.length > 0) {
        setDraft(modalConceptos.map(c => ({ ...c })));
        setModalVisible(true);
      }
    }, [modalConceptos]);

  const handlePress = async (id, fila) => {
    try {
      const filtrado = fichasubpartidas.filter(sp => sp.partida_id === id);
      const titulo = partidas.filter(sp => sp.fila === fila)[0].concepto;
      setTitulopartida(titulo);
      setModalConceptos(filtrado);
    } catch (error) {
    }
  };

  const handleSave = async () => {
    setConceptos(draft.map(c => ({ ...c })));
    handleGuardarPartida(draft);
    setModalVisible(false);
    setModalConceptos([]);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={commonStyles.resumenContainer}>
        <View style={{ alignItems: 'center', flexDirection: 'row' }}>
          <Text>Partidas {partidas.length}</Text>          
        </View>
      </View>
      <FlatList
        data={partidas}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
           <View style={[commonStyles.detallesItemPartidas, {minHeight: 60}]}>
            <Text style={{ color: 'gray', paddingTop: 5}}>Fila {item.fila}</Text>
            <Text style={{ fontWeight: '700', paddingRight: 45, paddingTop: 8}}>{item.concepto}</Text>           
            {item.desglosarpartida === 1 && (
              <View style={commonStyles.fondoFlotantePartida}>
              <Pressable style={commonStyles.buttonFlotantePartida} onPress={() => handlePress(item.plantilla_id, item.fila)}>
                <FontAwesome5 name="list" size={10} color="white" />
              </Pressable>
              </View>
            )}
            <View style={commonStyles.etiquetaPrecio} >
              {item.importe ? <Text>  {'$ ' + item.importe.toFixed(2)}  </Text> : <Text style={{ color: 'gray'}}> $ 0.00 </Text> }
            </View>
          </View>
        )}
      />
     
      
      {/* Modal de las subpartidas */}
      <Modal transparent visible={modalVisible} animationType="slide">
      <View style={commonStyles.modalOverlay}>
        <View style={[commonStyles.modalContainer, {backgroundColor: '#f2f2f2'}]}>
          <Text style={commonStyles.modalTitle}>{titulopartida}</Text>

          {/* Scroll solo del cuerpo */}
          <ScrollView showsVerticalScrollIndicator={false}>
            {draft.map((concepto) => (
              
              <View key={concepto.id} style={{ marginBottom: 5, backgroundColor: 'white', padding: 5, borderRadius: 8 }}>
                <Text style={{ marginBottom: 4 }}>{concepto.concepto}</Text>
                {/* Fila Costo + Salario */}
                
                <View style={{ flexDirection: 'row', gap: 8}}>
                  <View style={{ flex: 1 }}>
                    <Text style={commonStyles.pickerLabel}>Costo</Text>
                    <NumericInput
                      placeholder="Costo"
                      value={concepto.importe}
                      onValueChange={txt => update(concepto.id, 'importe', txt)}
                      style={commonStyles.input}
                      editable={concepto.editable === 1}
                      decimals={2}
                    />
                  </View>
                  
                  <View style={{ flex: 1 }}>
                    <Text style={commonStyles.pickerLabel}>Salario</Text>
                    <NumericInput
                      placeholder="Salario"
                      value={concepto.salarios}
                      onValueChange={txt => update(concepto.id, 'salarios', txt)}
                      style={commonStyles.input}
                      editable={concepto.editable === 1}
                      decimals={2}
                    />
                  </View>
                </View> 
                <Text style={commonStyles.pickerLabel}>Argumentación</Text>
                <TextInput
                  placeholder="Argumentación"
                  value={String(concepto.argumentacion ?? '')}
                  onChangeText={txt => update(concepto.id, 'argumentacion', txt)}
                  style={commonStyles.input}
                  multiline
                />
              </View>
            ))}
          </ScrollView>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
              

              <TouchableOpacity style={[isPremiumDisabled()  && { opacity: 0.3 }, commonStyles.buttonAgregar ]} disabled={isPremiumDisabled()} onPress={handleSave} >
                <Text style={commonStyles.buttonTextAgregar}>GUARDAR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={commonStyles.buttonCancelar} onPress={() => { setModalVisible(false); setModalConceptos([]); }} >
                <Text style={commonStyles.buttonTextAgregar}>CANCELAR</Text>
              </TouchableOpacity>
            </View>
        </View>
      </View>
    </Modal>
    </View>
  );
}

export default function DetallesFichaScreen() {
   const { lalicencia, licenciaEstado } = useLicencia();
   const { ficha } = useLocalSearchParams();
   const fichaObj = JSON.parse(ficha || "{}");
   const db = useSQLiteContext();
   const [showLicenseAlert, setShowLicenseAlert] = useState(false);
   
   // Función para determinar si la licencia está vencida (deshabilita todas las operaciones)
  const isLicenseExpired = () => {
    return licenciaEstado === LICENCIA_ESTADOS.TRIAL_VENCIDA ||
           licenciaEstado === LICENCIA_ESTADOS.ORIGINAL_VENCIDA;
  };

  // Función para determinar si las características premium están deshabilitadas
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

  // Función para obtener el mensaje de alerta según el estado
  const getLicenseAlertMessage = () => {
    switch (licenciaEstado) {
      case LICENCIA_ESTADOS.SIN_LICENCIA:
        return 'Las opciones de añadir Actividades, Equipos, Recursos y modificar las Partidas requieren una licencia válida. Adquiera una licencia para desbloquear estas funciones.';
      
      case LICENCIA_ESTADOS.TRIAL_VENCIDA:
        return 'Su licencia de prueba ha expirado. Las operaciones de añadir Actividades, Equipos, Recursos y modificar las Partidas han sido deshabilitadas hasta que adquiera una licencia válida.';
      
      case LICENCIA_ESTADOS.ORIGINAL_VENCIDA:
        return 'Su licencia original ha expirado. Las operaciones de añadir Actividades, Equipos, Recursos y modificar las Partidas han sido deshabilitadas hasta que renueve su licencia.';
      
      case LICENCIA_ESTADOS.ERROR:
        return 'Error en la verificación de licencia. Las opciones de añadir Actividades, Equipos, Recursos y modificar las Partidas están temporalmente deshabilitadas. Contacte al soporte técnico.';
      
      case LICENCIA_ESTADOS.TRIAL_ACTIVA:
        return 'Está utilizando una licencia de prueba. Las opciones de duplicar ficha e importar ficha no están disponibles durante este período, adquiera una licencia válida para habilitarlas.';
      
      case LICENCIA_ESTADOS.ORIGINAL_ACTIVA:
        return 'Licencia activa. Todas las funciones están disponibles.';
      
      default:
        return 'Las opciones de duplicar ficha e importar ficha han sido deshabilitadas hasta que adquiera una licencia válida.';
    }
  };

  // Función para obtener el título de la alerta según el estado
  const getLicenseAlertTitle = () => {
    switch (licenciaEstado) {
      case LICENCIA_ESTADOS.SIN_LICENCIA:
        return 'Licencia Requerida';
      
      case LICENCIA_ESTADOS.TRIAL_VENCIDA:
        return 'Licencia de Prueba Expirada';
      
      case LICENCIA_ESTADOS.ORIGINAL_VENCIDA:
        return 'Licencia Original Expirada';
      
      case LICENCIA_ESTADOS.ERROR:
        return 'Error de Licencia';
      
      case LICENCIA_ESTADOS.TRIAL_ACTIVA:
        return 'Licencia de Prueba Activa';
      
      case LICENCIA_ESTADOS.ORIGINAL_ACTIVA:
        return 'Licencia Activa';
      
      default:
        return 'Licencia no activa';
    }
  };

 

  const [actividades, setActividades] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [insumosxequipos, setInsumosxequipos] = useState([]);
  const [recursos, setRecursos] = useState([]);
  const [partidas, setPartidas] = useState([]);
  const [fichasubpartidas, setFichasubpartidas] = useState([]);
  const [listaActividades, setListaActividades] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [listaEquipos, setListaEquipos] = useState([]);
  const [listaRecursos, setListaRecursos] = useState([]);
  const [precioObra, setPrecioObra] = useState(0);  
  const [conceptos, setConceptos] = useState([]);

  useEffect(() => {
    if (!db) {
      return;
    }
    // Cargar listas de actividades, cargos y equipos desde BD
    //Tambien hay que cargar las Actividades de ficharhumanos, los Equipos de fichaequipos, los Recursos de fichainsumos y las partidas.
    const fetchData = async () => {
      try {
        const actividadesDB = await db.getAllAsync("SELECT * FROM actividades;");
        const cargosDB = await db.getAllAsync("SELECT * FROM cargos;");
        const equiposDB = await db.getAllAsync("SELECT equipos.*, umedidas.umdescripcion FROM equipos JOIN umedidas ON umedidas.id = equipos.umexplotacion;");
        const recursosDB = await db.getAllAsync("SELECT * FROM insumos;");
        const insumosxequiposDB = await db.getAllAsync("SELECT insumosxequipos.*, insumos.insumo FROM insumosxequipos JOIN insumos ON insumos.id = insumosxequipos.insumo_id;");
       const fichaEquiposDB = await db.getAllAsync("SELECT fichaequipos.*, equipos.equipo FROM fichaequipos JOIN equipos ON equipos.id = fichaequipos.equipo_id WHERE ficha_id = ?;", [fichaObj.id]);
        const fichaActividadesDB = await db.getAllAsync("SELECT ficharhumanos.*, actividades.actividad, cargos.cargo, cargos.tarifahoraria FROM ficharhumanos JOIN actividades ON ficharhumanos.actividad_id = actividades.id JOIN cargos ON ficharhumanos.cargo_id = cargos.id WHERE ficharhumanos.ficha_id = ?;", [fichaObj.id]);
        const fichaRecursosDB = await db.getAllAsync("SELECT fichainsumos.*, insumos.insumo, insumos.um, insumotipos.tipoinsumo FROM fichainsumos JOIN insumos ON insumos.id = fichainsumos.insumo_id JOIN insumotipos ON insumos.insumotipo_id = insumotipos.id WHERE fichainsumos.ficha_id = ?;", [fichaObj.id]);
        setListaActividades(actividadesDB);
        setCargos(cargosDB);
        setListaEquipos(equiposDB);
        setEquipos(fichaEquiposDB);
        setActividades(fichaActividadesDB);
        setRecursos(fichaRecursosDB);
        setInsumosxequipos(insumosxequiposDB);
        setListaRecursos(recursosDB);
        setPrecioObra(fichaObj.precio);
        const partidasDB = await db.getAllAsync("SELECT fichapartidas.*, plantillapartidas.concepto, plantillapartidas.fila, plantillapartidas.desglosarpartida  FROM fichapartidas JOIN plantillapartidas ON plantillapartidas.id = fichapartidas.plantilla_id WHERE fichapartidas.ficha_id = ? AND plantillapartidas.activo = 1;", [fichaObj.id]);
        setPartidas(partidasDB);
        const fichaSubpartidasDB = await db.getAllAsync("SELECT fichasubpartidas.*, plantillasubpartidas.concepto, plantillasubpartidas.fila, plantillasubpartidas.partida_id, plantillasubpartidas.editable  FROM fichasubpartidas JOIN plantillasubpartidas ON plantillasubpartidas.id = fichasubpartidas.plantilla_id WHERE fichasubpartidas.ficha_id = ? AND plantillasubpartidas.activo = 1;", [fichaObj.id]);
        setFichasubpartidas(fichaSubpartidasDB);
      } catch (error) {
        console.error('DEBUG: DetallesFichaScreen - Error in fetchData:', error);
      }
    };

    fetchData();

    return () => {
    };
  }, [db]); // Agregar db como dependencia para re-ejecutar si cambia

  const agregarActividad = async (actividadNueva) => {
     
    if (!db) {
      return;
    }
    // 1. Obtener coeficientes de la ficha
    const fichaCoef = await db.getFirstAsync(
      "SELECT * FROM fichas WHERE id = ?",
      [fichaObj.id]
    );
    // 2. Obtener tarifahoraria del cargo y el nombre de la Actividad 
    const elCargo = await db.getFirstAsync(
      "SELECT * FROM cargos WHERE id = ?",
      [actividadNueva.cargo_id]
    );
    const laActividad = await db.getFirstAsync("SELECT * FROM actividades WHERE id = ?",[actividadNueva.actividad_id]);

    const tarifahoraria = Number(elCargo?.tarifahoraria ?? 0);
    const cantidad = Number(actividadNueva.cantidad ?? 0);
    const tiempo = Number(actividadNueva.tiempo ?? 0);
    const cargo = elCargo.cargo;
    const actividad = laActividad.actividad;

    // 3. Calcular valores
    const salariodevengado = tarifahoraria * cantidad * tiempo;
    const vacaciones = salariodevengado * (Number(fichaCoef?.p100vacaciones ?? 0) / 100);
    const contribuciones = salariodevengado * (Number(fichaCoef?.p100contribuciones ?? 0) / 100);
    const gastos = salariodevengado * (Number(fichaCoef?.p100gastos ?? 0) / 100);
    const impuestos = salariodevengado * (Number(fichaCoef?.p100impuestos ?? 0) / 100);
    const costo = salariodevengado + vacaciones;
    // 4. Añadir los campos calculados al objeto
    const nextItem = actividades.length > 0 ? Math.max(...actividades.map(a => a.item)) + 1 : 1;
    try {
      const result = await db.runAsync(
        `INSERT INTO ficharhumanos 
          (item, ficha_id, actividad_id, cargo_id, cantidad, tiempo, descripcion, salariodevengado, vacaciones, contribuciones, gastos, impuestos, costo) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          nextItem,
          fichaObj.id,
          actividadNueva.actividad_id,
          actividadNueva.cargo_id,
          actividadNueva.cantidad,
          actividadNueva.tiempo,
          actividadNueva.argumentacion,
          salariodevengado,
          vacaciones,
          contribuciones,
          gastos,
          impuestos,
          costo
        ]
      );

      // Recuperar el id insertado
      const insertId = result?.lastInsertRowId;

      // Crear el objeto con el id real
      const nuevaAct = {
        id: insertId,
        item: nextItem,
        ...actividadNueva,
        descripcion: actividadNueva.argumentacion,
        salariodevengado,
        vacaciones,
        contribuciones,
        gastos,
        impuestos,
        costo,
        tarifahoraria,
        cargo,
        actividad
        
      };

      setActividades([...actividades, nuevaAct]);
      actualizarImportes(fichaObj.id);
    } catch (error) {
    }
  };
  const eliminarActividad = async (id) => {
    if (!db) {
      return;
    }
    Alert.alert(
      'Confirmar eliminación',
      '¿Está seguro que desea eliminar esta actividad?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              setActividades(actividades.filter(a => a.id !== id));            
              await db.runAsync(`DELETE FROM ficharhumanos WHERE id = ?;`, [id]);
              actualizarImportes(fichaObj.id);
            } catch (error) {
            }
          }
        }
      ]
    );
  };

  const insertarOActualizarInsumo = async (ficha_id, insumo, cantidadInsumo, costo, hook_id, descripcionInsumo, idlistado, itemFicha) => {
    if (!db) {
      return;
    }
   try {
        const temp = await db.getFirstAsync(`
            SELECT * 
            FROM fichainsumos 
            WHERE ficha_id = ? AND insumo_id = ? AND precio = ? 
            `, [ficha_id, insumo.insumo_id, insumo.precio]
          );         

          const fichaInsumos = await db.getFirstAsync(`
            SELECT * 
            FROM fichainsumos 
            WHERE ficha_id = ? AND insumo_id = ? AND precio = ? AND hook_id = ?
            `, [ficha_id, insumo.insumo_id, insumo.precio, '[' + hook_id + ']']
          );
         
          if (fichaInsumos) {
              // Actualizar Ficha de Insumos existente 
              await db.runAsync("UPDATE fichainsumos SET cantidad = ?, precio = ?, costo = ?, descripcion = ? WHERE id = ?", [cantidadInsumo, insumo.precio, costo, descripcionInsumo, fichaInsumos.id]);
              
          } else {
              // Insertar Ficha de Insumos Nueva
                const fichaItem = await db.getFirstAsync(`SELECT COUNT(id) as cantidad FROM fichainsumos WHERE ficha_id = ?`, [ficha_id]);
                let itemFicha = fichaItem ? fichaItem.cantidad : 0;
                itemFicha++;
                let hooks = [Number(hook_id)];
                let hooksJson = JSON.stringify(hooks);
                await db.runAsync(`
                  INSERT INTO fichainsumos (ficha_id, insumo_id, idlistado, item, cantidad, precio, costo, hook_id, descripcion) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
                  , [ficha_id, insumo.insumo_id, idlistado, itemFicha, cantidadInsumo, insumo.precio, costo, hooksJson, descripcionInsumo]
                );                    
            }    
            //actualizar recursos
            const fichaRecursosDB = await db.getAllAsync("SELECT fichainsumos.*, insumos.insumo, insumos.um, insumotipos.tipoinsumo FROM fichainsumos JOIN insumos ON insumos.id = fichainsumos.insumo_id JOIN insumotipos ON insumos.insumotipo_id = insumotipos.id WHERE fichainsumos.ficha_id = ?;", [fichaObj.id]);
            setRecursos(fichaRecursosDB);
    } catch (error) {
    }
  };

  const procesarInsumos = async (equipoCalculado, hook_id, elequipo) => {
    if (!db) {
      return;
    }
    try {
      const insumosxequipos = await db.getAllAsync(`
        SELECT insumosxequipos.*, insumotipos.insumogrupo_id
        FROM insumosxequipos 
        INNER JOIN insumos ON insumos.id = insumosxequipos.insumo_id
        INNER JOIN insumotipos ON insumotipos.id = insumos.insumotipo_id
        WHERE equipo_id = ?;
      `, [equipoCalculado.equipo_id]);

      const fichaItem = await db.getFirstAsync("SELECT COUNT(id) as cantidad FROM fichainsumos WHERE ficha_id = ?", [fichaObj.id]);
      let itemFicha = fichaItem ? fichaItem.cantidad : 0;

      for (const insumo of insumosxequipos) {
        let cantidadInsumo;

        if (insumo.insumogrupo_id == 2) { // combustibles
          cantidadInsumo = equipoCalculado.cantidinsumoTotal / insumo.indiceconsumo;
        } else if (insumo.insumogrupo_id == 3) { // Energía
          cantidadInsumo = equipoCalculado.cantidinsumoTotal * insumo.indiceconsumo;
        }

        let costo = cantidadInsumo * insumo.precio;
        let descripcionInsumo = `${cantidadInsumo.toFixed(2)} ${insumo.um} del equipo "${elequipo}"`;

        await insertarOActualizarInsumo(fichaObj.id, insumo, cantidadInsumo, costo, hook_id, descripcionInsumo, equipoCalculado.idlistado, itemFicha);
      }
    } catch (error) {
    }
  };

  const agregarEquipo = async (equipoNuevo) => {
    if (!db) {
      return;
    }
    const nextItem = equipos.length > 0 ? Math.max(...equipos.map(a => a.item)) + 1 : 1;
    const elEquipo = await db.getFirstAsync("SELECT * FROM equipos WHERE id = ?",[equipoNuevo.equipo_id]);
    try {
      const equipoCalculado = await calcularEquipo(equipoNuevo);
      const result = await db.runAsync(
        `INSERT INTO fichaequipos (ficha_id, equipo_id, idlistado, item, cantidad, umedida_id, tarifaunitaria, costo, cantidadhe, depreciacion, mantenimiento, descripcion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [fichaObj.id, equipoCalculado.equipo_id, equipoCalculado.idlistado, nextItem, equipoCalculado.cantidad, equipoCalculado.umedida_id, equipoCalculado.tarifaunitaria, equipoCalculado.costo, equipoCalculado.cantidadhe, equipoCalculado.depreciacion, equipoCalculado.mantenimiento, equipoCalculado.descripcion]
      );
      
      const hook_id = result?.lastInsertRowId;
      const nuevoEq = { id: hook_id, ...equipoCalculado, equipo: elEquipo.equipo, item: nextItem };      
      setEquipos([...equipos, nuevoEq]);

      await procesarInsumos(equipoCalculado, hook_id, elEquipo.equipo);
      actualizarImportes(fichaObj.id);
    } catch (error) {
    }
  };

  const calcularEquipo = async (datos) => {
    if (!db) {
      return;
    }
    const { ficha_id, equipo_id, item, cantidad, cantidadhe,  argumentacion } = datos;
    // Obtener datos del equipo
    const row = await db.getFirstAsync("SELECT * FROM equipos WHERE id = ?", [equipo_id]);
    if (!row) throw new Error("No se encontró el equipo con el ID proporcionado.");
   
    const elequipo = row.equipo;
    const indicemtto = row.indicemtto;
   // let cantidadhe = tiempo;
    let vidaUtilHoras = 0;
    let cantidadheTotal = 0;
    let cantidinsumoTotal = 0;

    if (row.umexplotacion === 'KM') {
      vidaUtilHoras = row.vidautil / 50;
    } else {
      vidaUtilHoras = row.vidautil;
    }

    if (row.umexplotacion === 'HE') {
      cantidadheTotal = cantidadhe * cantidad;
      cantidinsumoTotal = cantidadhe * cantidad;
    } else {
      cantidadheTotal = cantidadhe;
      cantidinsumoTotal = cantidad;
    }

    const depreciaxHora = (row.valorinicial - row.valorresidual) / vidaUtilHoras;
    const depreciacion = depreciaxHora * cantidadheTotal;
    const mantenimiento = (indicemtto / 100) * depreciacion;
    const umedida_id = row.umexplotacion;
    const costo = depreciacion + mantenimiento;
    const idlistado = null;

    // Crear el objeto equipo
    return {
      ficha_id,
      equipo_id,
      idlistado,
      item,
      cantidad,
      umedida_id,
      cantidadhe,
      depreciacion,
      mantenimiento,
      costo,
      cantidinsumoTotal,
      descripcion: argumentacion,
      elequipo
    };
  };

   const eliminarEquipo = async (id) => {
    if (!db) {
      return;
    }
    
    Alert.alert(
      'Confirmar eliminación',
      '¿Está seguro que desea eliminar este Equipo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            
          try {
            setEquipos(equipos.filter(a => a.id !== id));
            //const elEquipo = await db.getFirstAsync(`SELECT equipo_id FROM fichaequipos WHERE id = ?`, [id]);
            await db.runAsync(`DELETE FROM fichaequipos WHERE id = ?;`, [id]);
            await db.runAsync(`DELETE FROM fichainsumos WHERE hook_id = ?;`, ['[' + id + ']']);
            //actualizar recursos
            const fichaRecursosDB = await db.getAllAsync("SELECT fichainsumos.*, insumos.insumo, insumos.um, insumotipos.tipoinsumo FROM fichainsumos JOIN insumos ON insumos.id = fichainsumos.insumo_id JOIN insumotipos ON insumos.insumotipo_id = insumotipos.id WHERE fichainsumos.ficha_id = ?;", [fichaObj.id]);
            setRecursos(fichaRecursosDB);
            actualizarImportes(fichaObj.id);
          } catch (error) {
          }
          }
        }
      ]
    );
  };

  const agregarRecurso = async (recursoNuevo) => {
    if (!db) {
      return;
    }
  const elRecurso = await db.getFirstAsync("SELECT * FROM insumos WHERE id = ?",[recursoNuevo.insumo_id]);

  const cantidad = Number(recursoNuevo.cantidad ?? 0);
  const precio = Number(recursoNuevo.precio ?? 0);
  const insumo = elRecurso.insumo;
  const um = elRecurso.um;
  const costo = precio * cantidad;
  
  const nextItem = recursos.length > 0 ? Math.max(...recursos.map(a => a.item)) + 1 : 1;

  try {
      const result = await db.runAsync(
      `INSERT INTO fichainsumos 
        (item, ficha_id, insumo_id, cantidad, precio, descripcion,  costo) 
        VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [
        nextItem,
        fichaObj.id,
        recursoNuevo.insumo_id,
        recursoNuevo.cantidad,
        recursoNuevo.precio,
        recursoNuevo.descripcion,
        costo
      ]
      );

      const insertId = result?.lastInsertRowId;
     // Crear el objeto con el id real
    const nuevoRec = {
      id: insertId,
      item: nextItem,
      ...recursoNuevo,
      costo,
      um,
      insumo      
    };

    setRecursos([...recursos, nuevoRec]);     
      actualizarImportes(fichaObj.id);
    } catch (error) {
    }
  };

const eliminarRecurso = async (id) => {
    if (!db) {
      return;
    }
    Alert.alert(
      'Confirmar eliminación',
      '¿Está seguro que desea eliminar este recurso?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
            setRecursos(recursos.filter(a => a.id !== id));   
            await db.runAsync(`DELETE FROM fichainsumos WHERE id = ?;`, [id]);
          actualizarImportes(fichaObj.id);
          } catch (error) {
          }
          }
        }
      ]
    );
  };

  const actualizarImportes = async (ficha_id) => {
    if (!db) {
      return;
    }
    try {
      // FILA 1: Gasto Material Plantilla_id 1
      let resultado = await db.getFirstAsync("SELECT SUM(costo) as total FROM fichainsumos WHERE ficha_id = ?", [ficha_id]);
      if (!resultado) throw new Error("No se encontraron resultados para fichainsumos.");
      let f1 = resultado.total || 0;
      await db.runAsync("UPDATE fichapartidas SET importe = ? WHERE ficha_id = ? AND plantilla_id = ?", [f1, ficha_id, 1]);   
      // FILA 1.1: Materias primas y materiales Plantilla_id 2       
      resultado = await db.getFirstAsync(`
          SELECT SUM(fichainsumos.costo) as total 
          FROM fichainsumos 
          LEFT JOIN insumos ON insumos.id = fichainsumos.insumo_id 
          LEFT JOIN insumotipos ON insumotipos.id = insumos.insumotipo_id 
          WHERE fichainsumos.ficha_id = ? AND insumotipos.insumogrupo_id = 1
      `, [ficha_id]);
      if (!resultado) throw new Error("No se encontraron resultados para materias primas.");
      let fmateriasprimas = resultado.total || 0;
      await db.runAsync("UPDATE fichapartidas SET importe = ? WHERE ficha_id = ? AND plantilla_id = ?", [fmateriasprimas, ficha_id, 2]);

      // FILA 1.2: Combustible y lubricantes plantilla_id 3  insumogrupo_id 2      
      resultado = await db.getFirstAsync(`
          SELECT SUM(fichainsumos.costo) as total 
          FROM fichainsumos 
          INNER JOIN insumos ON insumos.id = fichainsumos.insumo_id 
          INNER JOIN insumotipos ON insumotipos.id = insumos.insumotipo_id 
          WHERE fichainsumos.ficha_id = ? AND insumotipos.insumogrupo_id = 2
      `, [ficha_id]);
      if (!resultado) throw new Error("No se encontraron resultados para combustibles.");
      let fcombustibles = resultado.total || 0;
      await db.runAsync("UPDATE fichapartidas SET importe = ? WHERE ficha_id = ? AND plantilla_id = ?", [fcombustibles, ficha_id, 3]);

      // FILA 1.3: Energía  Plantilla_id 4 insumogrupo_id 3
      resultado = await db.getFirstAsync(`
          SELECT SUM(fichainsumos.costo) as total 
          FROM fichainsumos 
          INNER JOIN insumos ON insumos.id = fichainsumos.insumo_id 
          INNER JOIN insumotipos ON insumotipos.id = insumos.insumotipo_id 
          WHERE fichainsumos.ficha_id = ? AND insumotipos.insumogrupo_id = 3
      `, [ficha_id]);
      if (!resultado) throw new Error("No se encontraron resultados para energía.");
      let fenergia = resultado.total || 0;
      await db.runAsync("UPDATE fichapartidas SET importe = ? WHERE ficha_id = ? AND plantilla_id = ?", [fenergia, ficha_id, 4]);

      // FILA 1.4: Agua Plantilla_id 5 insumogrupo_id 4
      resultado = await db.getFirstAsync(`
          SELECT SUM(fichainsumos.costo) as total 
          FROM fichainsumos 
          INNER JOIN insumos ON insumos.id = fichainsumos.insumo_id 
          INNER JOIN insumotipos ON insumotipos.id = insumos.insumotipo_id 
          WHERE fichainsumos.ficha_id = ? AND insumotipos.insumogrupo_id = 4
      `, [ficha_id]);
      if (!resultado) throw new Error("No se encontraron resultados para agua.");
      let fagua = resultado.total || 0;
      await db.runAsync("UPDATE fichapartidas SET importe = ? WHERE ficha_id = ? AND plantilla_id = ?", [fagua, ficha_id, 5]);

      // FILA 2: Calcular Salario + Vacaciones Plantilla_id 6
      resultado = await db.getFirstAsync("SELECT SUM(costo) AS total FROM ficharhumanos WHERE ficha_id = ?", [ficha_id]);
      if (!resultado) throw new Error("No se encontraron resultados para ficharhumanos.");
      let f2 = resultado.total || 0;
      await db.runAsync("UPDATE fichapartidas SET importe = ? WHERE ficha_id = ? AND plantilla_id = ?", [f2, ficha_id, 6]);

      // FILA 3: Otros Gastos Directos partida_id 7
      // Depreciación de los activos fijos tangibles que intervienen directamente en el proceso  plantilla_id de subpartida 2
      resultado = await db.getFirstAsync("SELECT SUM(depreciacion) as total FROM fichaequipos WHERE ficha_id = ?", [ficha_id]);
      if (!resultado) throw new Error("No se encontraron resultados para fichaequipos.");
      let fdaf = resultado.total || 0;
      await db.runAsync("UPDATE fichasubpartidas SET importe = ? WHERE ficha_id = ? AND plantilla_id = ?", [fdaf, ficha_id, 2]);
      // Pagos por mantenimientos y reparaciones recibidos  plantilla_id de subpartida 1
      resultado = await db.getFirstAsync("SELECT SUM(mantenimiento) as total FROM fichaequipos WHERE ficha_id = ?", [ficha_id]);
      if (!resultado) throw new Error("No se encontraron resultados para fichaequipos.");
      let fpmrr = resultado.total || 0;
      await db.runAsync("UPDATE fichasubpartidas SET importe = ? WHERE ficha_id = ? AND plantilla_id = ?", [fpmrr, ficha_id, 1]);
      // Otros Gastos Directos   partida_id 7
      resultado = await db.getFirstAsync("SELECT SUM(importe) as total FROM fichasubpartidas INNER JOIN plantillasubpartidas ON plantillasubpartidas.id = fichasubpartidas.plantilla_id WHERE ficha_id = ? AND plantillasubpartidas.partida_id = 7", [ficha_id]);
      if (!resultado) throw new Error("No se encontraron resultados para fichaequipos.");
      let f3 = resultado.total || 0;
      await db.runAsync("UPDATE fichapartidas SET importe = ? WHERE ficha_id = ? AND plantilla_id = ?", [f3, ficha_id, 7]);

      // FILA 4: Gastos asociados a la producción partida_id 8
      resultado = await db.getFirstAsync("SELECT SUM(importe) as total FROM fichasubpartidas INNER JOIN plantillasubpartidas ON plantillasubpartidas.id = fichasubpartidas.plantilla_id WHERE ficha_id = ? AND plantillasubpartidas.partida_id = 8", [ficha_id]);
      if (!resultado) throw new Error("No se encontraron resultados para fichasubpartidas.");
      let f4 = resultado.total || 0;
      await db.runAsync("UPDATE fichapartidas SET importe = ? WHERE ficha_id = ? AND plantilla_id = ?", [f4, ficha_id, 8]);

      // FILA 5: TOTAL DE COSTOS (F1 + F2 + F3 + F4) Plantilla_id 10
      let f5 = f1 + f2 + f3 + f4;
      await db.runAsync("UPDATE fichapartidas SET importe = ? WHERE ficha_id = ? AND plantilla_id = ?", [f5, ficha_id, 10]);

      // FILA 6: GASTOS GENERALES Y DE ADMINISTRACIÓN partida_id 11
      resultado = await db.getFirstAsync("SELECT SUM(importe) as total FROM fichasubpartidas INNER JOIN plantillasubpartidas ON plantillasubpartidas.id = fichasubpartidas.plantilla_id WHERE ficha_id = ? AND plantillasubpartidas.partida_id = 11", [ficha_id]);
      if (!resultado) throw new Error("No se encontraron resultados para gastos generales.");
      let f6 = resultado.total || 0;
      await db.runAsync("UPDATE fichapartidas SET importe = ? WHERE ficha_id = ? AND plantilla_id = ?", [f6, ficha_id, 11]);

      // FILA 7: Gastos de Distribución y Venta partida_id 13
      // Gastos de distribución y venta plantilla_id de subpartida 35
      resultado = await db.getFirstAsync("SELECT SUM(importe) as total FROM fichapartidas WHERE ficha_id = ? AND plantilla_id = 13", [ficha_id]);
      if (!resultado) throw new Error("No se encontraron resultados para otros gastos directos.");
      let fgdv = resultado.importe || 0;
      await db.runAsync("UPDATE fichasubpartidas SET importe = ? WHERE ficha_id = ? AND plantilla_id = ?", [fgdv, ficha_id, 35]);

      // FILA 7: Gastos de Distribución y Venta partida_id 13
      resultado = await db.getFirstAsync("SELECT SUM(importe) as total FROM fichasubpartidas INNER JOIN plantillasubpartidas ON plantillasubpartidas.id = fichasubpartidas.plantilla_id WHERE ficha_id = ? AND plantillasubpartidas.partida_id = 13", [ficha_id]);
      if (!resultado) throw new Error("No se encontraron resultados para gastos generales.");
      let f7 = resultado.total || 0;
      await db.runAsync("UPDATE fichapartidas SET importe = ? WHERE ficha_id = ? AND plantilla_id = ?", [f7, ficha_id, 13]);
      // Salarios de Gastos de Distribución y Venta partida_id 14
      resultado = await db.getFirstAsync("SELECT SUM(importe) as total FROM fichasubpartidas INNER JOIN plantillasubpartidas ON plantillasubpartidas.id = fichasubpartidas.plantilla_id WHERE ficha_id = ? AND plantillasubpartidas.partida_id = 14", [ficha_id]);
      if (!resultado) throw new Error("No se encontraron resultados para gastos generales.");
      let f71 = resultado.total || 0;
      await db.runAsync("UPDATE fichapartidas SET importe = ? WHERE ficha_id = ? AND plantilla_id = ?", [f71, ficha_id, 14]);

      // FILA 8: Gastos Financieros partida_id 15
      resultado = await db.getFirstAsync("SELECT SUM(importe) as total FROM fichasubpartidas INNER JOIN plantillasubpartidas ON plantillasubpartidas.id = fichasubpartidas.plantilla_id WHERE ficha_id = ? AND plantillasubpartidas.partida_id = 15", [ficha_id]);
      if (!resultado) throw new Error("No se encontraron resultados para gastos generales.");
      let f8 = resultado.total || 0;
      await db.runAsync("UPDATE fichapartidas SET importe = ? WHERE ficha_id = ? AND plantilla_id = ?", [f8, ficha_id, 15]);

      // FILA 9 Gastos por Financiamiento entregado a la OSDE partida_id 16
      let laficha = await db.getFirstAsync("SELECT * FROM fichas WHERE id = ?", [ficha_id]);
      let f9 = 0;
      if (laficha.p100osde) {
        f9 = (laficha.p100osde * (f2 + f4 + f6 + f7 + f8)) / 100;
      } else {
        resultado = await db.getFirstAsync("SELECT SUM(importe) as total FROM fichasubpartidas INNER JOIN plantillasubpartidas ON plantillasubpartidas.id = fichasubpartidas.plantilla_id WHERE ficha_id = ? AND plantillasubpartidas.partida_id = 16", [ficha_id]);
        if (!resultado) throw new Error("No se encontraron resultados para gastos generales.");
        f9 = resultado.total || 0;
      }
      await db.runAsync("UPDATE fichasubpartidas SET importe = ? WHERE ficha_id = ? AND plantilla_id = ?", [f9, ficha_id, 40]);
      await db.runAsync("UPDATE fichapartidas SET importe = ? WHERE ficha_id = ? AND plantilla_id = ?", [f9, ficha_id, 16]);

      const ficha = await db.getFirstAsync("SELECT * FROM fichas WHERE id = ?", [ficha_id]);
      if (!ficha) throw new Error("No se encontró la ficha.");

      // FILA 10: Gastos Tributarios
      // Impuesto sobre la Fuerza de Trabajo  plantilla_id de subpartida 41
      let fift = (ficha.p100impuestosft * f2) / 100;
      await db.runAsync("UPDATE fichasubpartidas SET importe = ? WHERE ficha_id = ? AND plantilla_id = ?", [fift, ficha_id, 41]);
      // Gastos Tributarios: Contribución a la Seguridad Social  plantilla_id de subpartida 42  
      let fcss = (ficha.p100contribuciones * f2) / 100;
      await db.runAsync("UPDATE fichasubpartidas SET importe = ? WHERE ficha_id = ? AND plantilla_id = ?", [fcss, ficha_id, 42]);
      // Gastos Tributarios partida_id 17
      resultado = await db.getFirstAsync(`
          SELECT SUM(importe) as total 
          FROM fichasubpartidas 
          INNER JOIN plantillasubpartidas ON plantillasubpartidas.id = fichasubpartidas.plantilla_id 
          WHERE ficha_id = ? AND plantillasubpartidas.partida_id = 17
          `, [ficha_id]);
      if (!resultado) throw new Error("No se encontraron resultados para gastos generales.");
      let f10 = resultado.total || 0;
      await db.runAsync("UPDATE fichapartidas SET importe = ? WHERE ficha_id = ? AND plantilla_id = ?", [f10, ficha_id, 17]);

      // FILA 11: TOTAL DE GASTOS (F6+F7+F8+F9+F10) plantilla_id 18
      let f11 = f6 + f7 + f8 + f9 + f10;
      await db.runAsync("UPDATE fichapartidas SET importe = ? WHERE ficha_id = ? AND plantilla_id = ?", [f11, ficha_id, 18]);

      // FILA 12: TOTAL DE GASTOS (F5 + F11) plantilla_id 19
      let f12 = f5 + f11;
      await db.runAsync("UPDATE fichapartidas SET importe = ? WHERE ficha_id = ? AND plantilla_id = ?", [f12, ficha_id, 19]);

      // FILA 13: UTILIDAD plantilla_id 20       
      const putilidad = ficha.p100utilidades;
      let f13 = f12 * putilidad / 100;
      await db.runAsync("UPDATE fichapartidas SET importe = ? WHERE ficha_id = ? AND plantilla_id = ?", [f13, ficha_id, 20]);

      // FILA 14: Actualizar precio de la Ficha
      const precio = f12 + f13;
      await db.runAsync("UPDATE fichas SET precio = ? WHERE id = ?", [precio, ficha_id]);

      // Devolver un objeto con los resultados 
      const importes = {
        f1,
        fmateriasprimas,
        fcombustibles,
        fenergia,
        f2,
        f3,
        f4,
        f5,
        f6,
        f7,
        f71,
        f8,
        f9,
        fift,
        fcss,
        f10,
        precio
      };

      setPrecioObra(precio);
      const partidasDB = await db.getAllAsync("SELECT fichapartidas.*, plantillapartidas.concepto, plantillapartidas.fila, plantillapartidas.desglosarpartida  FROM fichapartidas JOIN plantillapartidas ON plantillapartidas.id = fichapartidas.plantilla_id WHERE fichapartidas.ficha_id = ? AND plantillapartidas.activo = 1;", [fichaObj.id]);
      setPartidas(partidasDB);

      return {
        success: true,
        importes
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  };


  const handleGuardarPartida = async (losDrafts) => {
    if (!db) {
      return;
    }
    try {
      for (const concepto of losDrafts) {
        await db.runAsync(
          "UPDATE fichasubpartidas SET importe = ?, salarios = ?, argumentacion = ? WHERE plantilla_id = ? AND ficha_id = ?",
          [concepto.importe, concepto.salarios, concepto.argumentacion, concepto.plantilla_id, fichaObj.id]
        );
      }
      await actualizarImportes(fichaObj.id);
      // Recargar fichasubpartidas para reflejar cambios
      const fichaSubpartidasDB = await db.getAllAsync("SELECT fichasubpartidas.*, plantillasubpartidas.concepto, plantillasubpartidas.fila, plantillasubpartidas.partida_id, plantillasubpartidas.editable  FROM fichasubpartidas JOIN plantillasubpartidas ON plantillasubpartidas.id = fichasubpartidas.plantilla_id WHERE fichasubpartidas.ficha_id = ? AND plantillasubpartidas.activo = 1;", [fichaObj.id]);
      setFichasubpartidas(fichaSubpartidasDB);
    } catch (error) {
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={commonStyles.gradienteContainer}>
        <Link href="/Fichas" asChild>
          <FontAwesome5 style={{ marginLeft: 8, float: "right" }} name="arrow-left" size={20} color="#ffffff" />
        </Link>
        <View style={{flexDirection: 'row', alignItems: 'center',}}>
          <FontAwesome5 name="file" size={14} color="#ffffffff" />
          <Text style={commonStyles.headerText}>Detalles de la Ficha</Text>
        </View>
        {isPremiumDisabled()  ? (
          <TouchableOpacity onPress={() => setShowLicenseAlert(true)} style={{ marginRight: 8, float: "right" }}>
            <FontAwesome5 name="exclamation-triangle" size={20} color="#ffff" />
          </TouchableOpacity>
        ) : <Text></Text>}  
      </View>
      <View id="nombreObraDetalles" style={{ backgroundColor: '#4c669f', borderTopLeftRadius: 5, borderTopEndRadius: 5, paddingHorizontal: 5}}>
          <Text style={{color: 'white', fontWeight: 'bold', paddingTop: 6, paddingHorizontal: 5}}>{fichaObj.identidad.toUpperCase()}</Text>
          <Text style={{color: 'white',  paddingHorizontal: 5, paddingTop: 5}}>{fichaObj.obra}</Text>
          
          <View style={commonStyles.etiquetaPrecio}>
              <Text>
               Precio:  $ {Number(precioObra || 0).toFixed(2)}
              </Text>
            </View>          
      </View>

      <Tab.Navigator     
         screenOptions={{
            tabBarShowLabel: false,
          }}
          tabBar={props => <MyTabBar {...props} />}
      >
        <Tab.Screen name="Actividades">
          {() => (
            <ActividadesScreen
              actividades={actividades}
              listaActividades={listaActividades}
              cargos={cargos}
              agregarActividad={agregarActividad}
              eliminarActividad={eliminarActividad}
              isPremiumDisabled={isPremiumDisabled}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Equipos">
          {() => (
            <EquiposScreen
              equipos={equipos}
              listaEquipos={listaEquipos}
              agregarEquipo={agregarEquipo}
              eliminarEquipo={eliminarEquipo}
              insumosxequipos={insumosxequipos}
              isPremiumDisabled={isPremiumDisabled}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Recursos">
          {() => (
            <RecursosScreen
              recursos={recursos}
              listaRecursos={listaRecursos}
              agregarRecurso={agregarRecurso}
              eliminarRecurso={eliminarRecurso}
              isPremiumDisabled={isPremiumDisabled}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Partidas">
          {() => (
            <PartidasScreen 
            partidas={partidas} 
            fichasubpartidas={fichasubpartidas} 
            handleGuardarPartida={handleGuardarPartida} 
            conceptos={conceptos} 
            setConceptos={setConceptos}
              isPremiumDisabled={isPremiumDisabled}
            />
            )}
        </Tab.Screen>
      </Tab.Navigator>

      {/* Alerta de licencia no activa */}
      {showLicenseAlert && (
        <View style={styles.alertOverlay}>
          <View style={styles.alertContainer}>
            <View style={styles.alertHeader}>
              <Text style={styles.alertTitle}>{getLicenseAlertTitle()}</Text>
              <TouchableOpacity onPress={() => setShowLicenseAlert(false)} style={styles.alertCloseButton}>
                <Text style={styles.alertCloseText}>×</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.alertMessage}>
              {getLicenseAlertMessage()}
            </Text>
            <Link href="/Licencia" style={styles.alertButton}>
              <Text style={styles.alertButtonText}>Ir a Zona de Licencia</Text>
            </Link>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff", padding: 16 },
  detallesItemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomColor: "#ccc",
    borderBottomWidth: 1
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center"
  },
  modalContainer: {
    width: 300,
    backgroundColor: "white",
    borderRadius: 8,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 15, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#999",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 15
  },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#4c669f',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  tab: {
    paddingHorizontal: 20,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputHalf: {
    ...commonStyles.input,
    width: '48%',
  },

  alertOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  alertContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  alertMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
    lineHeight: 20,
  },
  alertButton: {
    backgroundColor: '#4a71c7',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
  },
  alertButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    width: '100%',
  },
  alertCloseButton: {
    padding: 5,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
  },
  alertCloseText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
  },
});