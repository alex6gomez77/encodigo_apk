import  { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView, Pressable, Linking, Modal, TouchableOpacity} from 'react-native';
import { AppText as Text, AppTextInput as TextInput } from './AppText';
import { useSQLiteContext } from 'expo-sqlite';
import { FontAwesome5 } from '@expo/vector-icons';
import { commonStyles } from '../styles/commonStyles';
import { useRouter } from 'expo-router';
import { useLicencia, LICENCIA_ESTADOS } from '../contexts/LicenciaContext';
import PagoLicenciaScreen from './PagoLicenciaScreen';
import ScreenHeader from './ScreenHeader';

import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

export default function LicenciaScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
 
  const [deviceId, setDeviceId] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [licenciaTexto, setLicenciaTexto] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [mostrarPago, setMostrarPago] = useState(false);
  const [nombrecliente, setNombrecliente] = useState('USUARIO TEMPORAL');
  
  const { 
    isLoading,
    licenciaEstado,
    refrescarLicencia,
    calcularDiasRestantes: calcularDiasRestantesContexto, 
    importarLicencia, 
    lalicencia, 
    deviceId: contextDeviceId 
  } = useLicencia();

  async function loadGenerales() {
    try {
      const result = await db.getFirstAsync('SELECT * FROM generales');     
      setDeviceId(result.ir?.toString() || contextDeviceId || '');
      setNombrecliente(result.empresa);
    } catch (e) {
      Alert.alert('Error', 'No se pudieron cargar los datos.');
    }
  }

  useEffect(() => {
    if (db) loadGenerales();
  }, [db, contextDeviceId]);


  const compartirPorWhatsApp = async () => {
      if (deviceId) {
        const mensaje = `Solicitud de Licencia. APK ENCODIGO. Cliente: '${nombrecliente}', ID de Dispositivo: '${deviceId}'. Favor de confirmar. Gracias.`;
        const url = `whatsapp://send?phone=+5354256428&text=${encodeURIComponent(mensaje)}`;
        await Linking.openURL(url);
        setModalVisible(false);
      }
    };
  
    const compartirPorSMS = async () => {
      if (deviceId) {
        const mensaje = `Solicitud de Licencia. APK ENCODIGO. Cliente: '${nombrecliente}', ID de Dispositivo: '${deviceId}'. Favor de confirmar. Gracias.`;
        const url = `sms:+5354256428?body=${encodeURIComponent(mensaje)}`;
        await Linking.openURL(url);
        setModalVisible(false);
      }
    };

    const importLicenseFile = async () => {
      try {
        // Mostrar opciones para importar licencia
        Alert.alert(
          'Importar Licencia',
          'Seleccione cómo desea importar la licencia:',
          [
            {
              text: 'Desde Archivo',
              onPress: importarDesdeArchivo
            },
            {
              text: 'Pegar Texto',
              onPress: () => setModalVisible(true)
            },
            {
              text: 'Cancelar',
              style: 'cancel'
            }
          ]
        );
      } catch (error) {
        Alert.alert('Error', 'Error al iniciar la importación de licencia');
      }
    };

    const importarDesdeArchivo = async () => {
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: ['application/json', 'text/plain', '*/*'],
          copyToCacheDirectory: true
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const file = result.assets[0];
          
          // Leer el contenido del archivo
          const fileContent = await FileSystem.readAsStringAsync(file.uri);
          
          // Intentar parsear como JSON
          const licenciaData = JSON.parse(fileContent);
          
          // Importar la licencia
          await procesarImportacionLicencia(licenciaData);
        }
      } catch (error) {
        Alert.alert('Error', 'Error al leer el archivo de licencia. Verifique que sea un archivo JSON válido.');
      }
    };

    const importarDesdeTexto = async () => {
      if (!licenciaTexto.trim()) {
        Alert.alert('Error', 'Por favor ingrese los datos de la licencia');
        return;
      }

      setIsImporting(true);
      
      try {
        // Intentar parsear el JSON
        const licenciaData = JSON.parse(licenciaTexto);
        
        // Importar la licencia
        await procesarImportacionLicencia(licenciaData);
        
        // Limpiar y cerrar modal
        setLicenciaTexto('');
        setModalVisible(false);
        
      } catch (parseError) {
        Alert.alert('Error', 'Formato JSON inválido. Verifique los datos de la licencia.');
      } finally {
        setIsImporting(false);
      }
    };

    const procesarImportacionLicencia = async (licenciaData) => {
      try {
        const resultado = await importarLicencia(licenciaData);
        
        if (resultado.success) {
          Alert.alert(
            'Éxito',
            resultado.message,
            [
              {
                text: 'OK',
                onPress: () => {
                  // Recargar los datos generales para mostrar la nueva licencia
                  loadGenerales();
                }
              }
            ]
          );
        } else {
          Alert.alert('Error', resultado.error);
        }
        
      } catch (error) {
        Alert.alert('Error', `Error al procesar la licencia: ${error.message}`);
      }
    };

    const cargarEjemploLicencia = () => {
      const licenciaEjemplo = {
        "software": "ENCODIGO",
        "licenseKey": "1C78-CEBA-8C1E",
        "signature": "JG+E6S0CCJ6EJWuR918WSoOZfWkl2yrZCDKDqqU9D6ZAoxD8q7/+3U3EV2xjdJY2CynSYhgpokdB3kViYmhkT+WwsfiIDWdsuqn5aUSpu0zFQN/MyZmXSG8C6fBf8Zd1sVVjTyxLI7t6/1WzzvUUE45pN+VHsumOBg3Z1rzPNNq9KUnmKtygzZOjVOGIOAieXUzatZD9E7PiIDZxEpGYIiPMzEOjkXaFd5XseZzPEnct6NHbhPlCrU7rftwPaqvarIgVx8Zapd+ka8K6PJTb2HQF8o+BFVeCKmwFbDnYkqvAHOeqoNQPjv0UpJXKvBvfNPuRiRzVc+oVj9QT//AvOQ==",
        "machineId": deviceId || contextDeviceId,
        "customer": "Cliente de Ejemplo",
        "startDate": "22/09/2025",
        "expiration": "22/09/2026"
      };
      
      setLicenciaTexto(JSON.stringify(licenciaEjemplo, null, 2));
    };
  

  return (
    <View style={styles.contentContainer}>
      <ScreenHeader title="ASISTENCIA TÉCNICA" onBack={() => router.back()} />

      <ScrollView  style={{ paddingHorizontal: 16 }}>
       
        <View style={styles.licenseContainer}>
          <Text style={{fontSize: 16, fontWeight: 'bold', paddingBottom: 5}}>Zona de Licencia </Text>
          <Text style={styles.licenseText}>ID del Dispositivo </Text>
          <Text style={{fontFamily: 'monospace', fontSize: 12, marginBottom: 10}}>{deviceId}</Text>

                  {/* Información de licencia actual */}
                  {(licenciaEstado === LICENCIA_ESTADOS.TRIAL_ACTIVA ||
                    licenciaEstado === LICENCIA_ESTADOS.ORIGINAL_ACTIVA) && lalicencia && (
                    <View style={[styles.currentLicenseInfo,{backgroundColor: '#e9f5e9'}]}>
                      <Text style={{fontSize: 14, fontWeight: 'bold', color: '#28a745', marginBottom: 5}}>
                        ✓ Licencia Activa
                      </Text>
                      <Text style={{fontSize: 12}}>Cliente: {lalicencia.customer}</Text>
                      <Text style={{fontSize: 12}}>Clave: {lalicencia.licenseKey}</Text>
                      <Text style={{fontSize: 12}}>Expira: {lalicencia.expiration}</Text>
                      <Text style={{fontSize: 12}}>Días Restantes: {calcularDiasRestantesContexto(lalicencia.expiration)}</Text>
                    </View>
                  )}
          
                  {/* Información de licencia vencida */}
                  {(licenciaEstado === LICENCIA_ESTADOS.TRIAL_VENCIDA ||
                    licenciaEstado === LICENCIA_ESTADOS.ORIGINAL_VENCIDA) && lalicencia && (
                    <View style={[styles.currentLicenseInfo,{backgroundColor: '#f8d7da'}]}>
                      <Text style={{fontSize: 14, fontWeight: 'bold', color: '#dc3545', marginBottom: 5}}>
                        ⚠ Licencia Vencida
                      </Text>
                      <Text style={{fontSize: 12}}>Cliente: {lalicencia.customer}</Text>
                      <Text style={{fontSize: 12}}>Clave: {lalicencia.licenseKey}</Text>
                      <Text style={{fontSize: 12}}>Venció: {lalicencia.expiration}</Text>
                    </View>
                  )}



          
         
          
          <View style={styles.licenseButtons}>
            <Pressable
              style={[styles.licenseButton, styles.buyButton]}
              onPress={compartirPorWhatsApp}
            >
              <FontAwesome5 name="whatsapp" size={20} color="white" />
              <Text style={styles.licenseButtonText}> Solicitar por WhatsApp</Text>
            </Pressable>
            <Pressable
              style={[styles.licenseButton, styles.buyButton]}
              onPress={compartirPorSMS}
            >
              <FontAwesome5 name="sms" size={20} color="white" />
              <Text style={styles.licenseButtonText}> Solicitar por SMS</Text>
            </Pressable>
          </View>
          
          <View style={styles.licenseButtons}>
            <TouchableOpacity
              style={[styles.licenseButton, styles.buyButton]}
              onPress={() => setMostrarPago(true)}
            >
              <FontAwesome5 name="shopping-cart" size={16} color="white" />
              <Text style={styles.licenseButtonText}>Comprar Licencia</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.licenseButton, styles.importButton]}
              onPress={importLicenseFile}
            >
              <FontAwesome5 name="download" size={16} color="white" />
              <Text style={styles.licenseButtonText}>Importar Licencia</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.licenseContainer}>
              <Text style={{fontSize: 16, fontWeight: 'bold', paddingBottom: 5}}>Soporte Técnico </Text>
            
              <Text style={{fontSize: 12, textAlign: 'center', marginBottom: 10}}>
                Contacta al soporte técnico a través de WhatsApp o SMS para asistencia con licencias y otros temas relacionados con la aplicación.
              </Text>
              <Text style={{fontSize: 12, textAlign: 'center', marginBottom: 10}}>
                  alex6gomez77@gmail.com
              </Text>
              <Text style={{fontSize: 12, textAlign: 'center', marginBottom: 10}}>
                  +53 54256428
              </Text>
      </View>
        {/* Modal para pegar licencia */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Importar Licencia</Text>
              
              <Text style={styles.modalSubtitle}>Pegue los datos de la licencia (JSON):</Text>
              
              <TextInput
                style={styles.modalTextInput}
                multiline
                placeholder="Pegue aquí los datos de la licencia en formato JSON..."
                value={licenciaTexto}
                onChangeText={setLicenciaTexto}
                editable={!isImporting}
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.exampleButton]}
                  onPress={cargarEjemploLicencia}
                  disabled={isImporting}
                >
                  <Text style={styles.modalButtonText}>Ejemplo</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setModalVisible(false);
                    setLicenciaTexto('');
                  }}
                  disabled={isImporting}
                >
                  <Text style={styles.modalButtonText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.importButton,
                    isImporting && styles.disabledButton
                  ]}
                  onPress={importarDesdeTexto}
                  disabled={isImporting}
                >
                  <Text style={styles.modalButtonText}>
                    {isImporting ? 'Importando...' : 'Importar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Componente de Pago */}
        <PagoLicenciaScreen
          visible={mostrarPago}
          onClose={() => setMostrarPago(false)}
          deviceId={deviceId}
        />
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
  contentContainer: {
    flex: 1,
    backgroundColor: 'white',
    marginTop: 10
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    flex: 1,
    marginRight: 8,
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

   licenseContainer: {
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
    backgroundColor: '#F2F2F2', // Fallback color
    //backgroundImage no es compatible en React Native, para gradientes usa LinearGradient
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20
  },
  currentLicenseInfo: {
    backgroundColor: '#e8f5e8',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    width: '90%',
    alignItems: 'center',
  },
  licenseText: {
    color: '#333',
    fontSize: 14,
    marginBottom: 4,
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
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    marginVertical: 5,
    paddingVertical: 5,
    textAlign: 'center',
  },
});