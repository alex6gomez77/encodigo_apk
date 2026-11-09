import { useState, useEffect } from 'react';
import { View, StyleSheet, Button, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { AppText as Text, AppTextInput as TextInput } from './AppText';
import { useSQLiteContext } from 'expo-sqlite';
import { commonStyles } from '../styles/commonStyles';
import ScreenHeader from './ScreenHeader';

export default function GeneralesScreen() {
  const db = useSQLiteContext();
  const [generales, setGenerales] = useState({}); 

  async function loadGenerales() {
    try {
      const result = await db.getFirstAsync('SELECT * FROM generales');
      setGenerales(result);
    } catch (e) {
      Alert.alert('Error', 'No se pudieron cargar los datos.');
    }
  }

  useEffect(() => {
    if (db) loadGenerales();
  }, [db]);

  async function guardarEdicion() {
    try {      
      await db.runAsync(
        `UPDATE generales SET
           empresa = ?,
           organismo = ?,
           p100utilidades = ?,
           p100impuestos = ?,
           p100vacaciones = ?,
           p100gastos = ?,
           p100contribuciones = ?,
           p100impuestosft = ?,
           p100osde = ?,
           p100especial = ?,
           contribucionespecial = ?,
           argumentacion = ?
         WHERE rowid = 1`,
        generales.empresa,
        generales.organismo,
        generales.p100utilidades,
        generales.p100impuestos,
        generales.p100vacaciones,
        generales.p100gastos,
        generales.p100contribuciones,
        generales.p100impuestosft,
        generales.p100osde,
        generales.p100especial,
        generales.contribucionespecial,
        generales.argumentacion
      );
      Alert.alert('Éxito', 'Los cambios han sido guardados.');
    } catch (e) {
      Alert.alert('Error', 'No se pudieron guardar los cambios.');
    }
  
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="GENERALES" backHref="/Principal" />

      <ScrollView style={{ paddingHorizontal: 16 }}>
       
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Empresa</Text>
          <TextInput
            style={styles.input}
            value={generales.empresa?.toString()}
            onChangeText={(text) => setGenerales({ ...generales, empresa: text })}
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Organismo</Text>
          <TextInput
            style={styles.input}
            value={generales.organismo?.toString()}
            onChangeText={(text) => setGenerales({ ...generales, organismo: text })}
          />
        </View>
        <View style={styles.inputContainer}>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>% Utilidades</Text>
              <TextInput
                style={styles.input}
                value={generales.p100utilidades?.toString()}
                onChangeText={(text) => setGenerales({ ...generales, p100utilidades: text })}
              />
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>% Impuestos</Text>
              <TextInput
                style={styles.input}
                value={generales.p100impuestos?.toString()}
                onChangeText={(text) => setGenerales({ ...generales, p100impuestos: text })}
              />
            </View>
          </View>
        </View>
        <View style={styles.inputContainer}>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>% Vacaciones</Text>
              <TextInput
                style={styles.input}
                value={generales.p100vacaciones?.toString()}
                onChangeText={(text) => setGenerales({ ...generales, p100vacaciones: text })}
              />
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>% Gastos</Text>
              <TextInput
                style={styles.input}
                value={generales.p100gastos?.toString()}
                onChangeText={(text) => setGenerales({ ...generales, p100gastos: text })}
              />
            </View>
          </View>
        </View>
        <View style={styles.inputContainer}>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>% Contribuciones</Text>
              <TextInput
                style={styles.input}
                value={generales.p100contribuciones?.toString()}
                onChangeText={(text) => setGenerales({ ...generales, p100contribuciones: text })}
              />
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>% Impuestos FT</Text>
              <TextInput
                style={styles.input}
                value={generales.p100impuestosft?.toString()}
                onChangeText={(text) => setGenerales({ ...generales, p100impuestosft: text })}
              />
            </View>
          </View>
        </View>
        <View style={styles.inputContainer}>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>% OSDE</Text>
              <TextInput
                style={styles.input}
                value={generales.p100osde?.toString()}
                onChangeText={(text) => setGenerales({ ...generales, p100osde: text })}
              />
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>% Especial</Text>
              <TextInput
                style={styles.input}
                value={generales.p100especial?.toString()}
                onChangeText={(text) => setGenerales({ ...generales, p100especial: text })}
              />
            </View>
          </View>
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Contribución Especial</Text>
          <TextInput
            style={styles.input}
            value={generales.contribucionespecial?.toString()}
            onChangeText={(text) => setGenerales({ ...generales, contribucionespecial: text })}
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Argumentación</Text>
          <TextInput
            style={styles.input}
            value={generales.argumentacion?.toString()}
            onChangeText={(text) => setGenerales({ ...generales, argumentacion: text })}
          />
        </View>
        
        <TouchableOpacity style={commonStyles.buttonAgregar} onPress={guardarEdicion} >
          <Text style={commonStyles.buttonTextAgregar}>GUARDAR CAMBIOS</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    flex: 1,
    marginRight: 8,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  button: {
    padding: 10,
    borderRadius: 5,
    width: '45%',
  },
 
  buttonConfirm: {
    backgroundColor: '#4a71c7',
  },

  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 10,
    color: '#666',
  },
  modalTextInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    height: 200,
    textAlignVertical: 'top',
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  exampleButton: {
    backgroundColor: '#6c757d',
  },
  cancelButton: {
    backgroundColor: '#dc3545',
  },
  importButton: {
    backgroundColor: '#28a745',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  licenseButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginTop: 15,
  },
  licenseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 0.48,
    padding: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buyButton: {
    backgroundColor: '#28a745',
  },
  licenseButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 14,
  },
});