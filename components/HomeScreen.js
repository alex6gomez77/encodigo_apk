import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Pressable,
  Modal,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { AppText as Text } from './AppText';
import { Link } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient';
import { useLicencia, LICENCIA_ESTADOS } from '../contexts/LicenciaContext';

export default function HomeScreen() {
  const { width, height } = useWindowDimensions();
  const logoSize = Math.min(width * 0.8, height * 0.38, 300);
  const [modalVisible, setModalVisible] = useState(false);
  const [timeoutReached, setTimeoutReached] = useState(false);
  
  // Usar el contexto de licencia
  const {
    lalicencia,
    deviceId,
    isLoading,
    licenciaEstado,
    refrescarLicencia,
    calcularDiasRestantes: calcularDiasRestantesContexto
  } = useLicencia();
  
 
  // Timeout de seguridad para evitar carga infinita
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        setTimeoutReached(true);
      }
    }, 10000); // 10 segundos

    return () => clearTimeout(timer);
  }, [isLoading]);

  // Efecto para mostrar modal cuando la licencia no está activa
  useEffect(() => {
    refrescarLicencia();
    if (licenciaEstado === LICENCIA_ESTADOS.TRIAL_VENCIDA ||
        licenciaEstado === LICENCIA_ESTADOS.ORIGINAL_VENCIDA ||
        licenciaEstado === LICENCIA_ESTADOS.ERROR) {
      setModalVisible(true);
    } else {
      setModalVisible(false);
    }
  }, [licenciaEstado]);



  // Función para posponer
  const posponer = () => {
    setModalVisible(false);
  };

 

  // Función para obtener el mensaje del modal según el estado de la licencia
  const getModalMessage = () => {
    switch (licenciaEstado) {
      case LICENCIA_ESTADOS.TRIAL_VENCIDA:
        return `Tu período de prueba ha expirado.`;
      case LICENCIA_ESTADOS.ORIGINAL_VENCIDA:
        return `Tu licencia ha expirado.`;
      case LICENCIA_ESTADOS.ERROR:
        return `Error al verificar la licencia. Tu ID de dispositivo es: ${deviceId}`;
      default:
        return `Licencia no activa.`;
    }
  };

  // Función para obtener el título del modal según el estado
  const getModalTitle = () => {
    switch (licenciaEstado) {
      case LICENCIA_ESTADOS.TRIAL_VENCIDA:
        return 'Licencia Trial Vencida';
      case LICENCIA_ESTADOS.ORIGINAL_VENCIDA:
        return 'Licencia Vencida';
      case LICENCIA_ESTADOS.ERROR:
        return 'Error de Licencia';
      default:
        return 'Licencia no activa';
    }
  };

 
  // Renderizar texto del estado de la licencia
  const renderEstadoLicencia = () => {
    if (isLoading && !timeoutReached) {
      return 'Verificando licencia...';
    }

    if (timeoutReached && isLoading) {
      return 'Error verificando licencia - Toque para reintentar';
    }

    switch (licenciaEstado) {
      case LICENCIA_ESTADOS.SIN_LICENCIA:
        return 'Sin Licencia';
      case LICENCIA_ESTADOS.TRIAL_ACTIVA:
        const diasTrial = calcularDiasRestantesContexto(lalicencia?.expiration);
        return `Trial Activa - ${diasTrial} días restantes`;
      case LICENCIA_ESTADOS.TRIAL_VENCIDA:
        return 'Trial Vencida';
      case LICENCIA_ESTADOS.ORIGINAL_ACTIVA:
        const diasOriginal = calcularDiasRestantesContexto(lalicencia?.expiration);
        return `Licencia Activa - ${diasOriginal} días restantes`;
      case LICENCIA_ESTADOS.ORIGINAL_VENCIDA:
        return 'Licencia Vencida';
      case LICENCIA_ESTADOS.ERROR:
        return 'Error en la Licencia';
      default:
        return 'Estado Desconocido';
    }
  };

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      
        <Image          
          source={require('../assets/logo-portada.png')}
          style={{ width: logoSize, height: logoSize }}
          resizeMode="contain"
        />       
        <Text style={styles.subtitleText}>
          SISTEMA DE CÓDIGOS DEL PRECONS III{'\n'} CÁLCULOS ESTIMADOS DE PRECIOS{'\n'}Versión: 1.0.0 {'\n'}( Build 13112026 )
        </Text>   
     

     
        <Link href="/Principal" asChild>
          <Pressable>
            <Text style={styles.texto}>ACCEDER</Text>          
          </Pressable>
        </Link>

     

      <View style={styles.copyrightContainer}>

        <Link href="/Licencia" asChild>
          <Pressable style={styles.bntLicenseInfo}>   
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
         </Pressable>
        </Link>

        <Text style={styles.copyrightText}>
          Copyright AX6 2026 Todos los Derechos Reservados
        </Text>      
      </View>  

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <View style={styles.alertHeader}>
              <Text style={styles.alertTitle}>{getModalTitle()}</Text>
              <TouchableOpacity onPress={() => posponer()} style={styles.alertCloseButton}>
                <Text style={styles.alertCloseText}>×</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalMessage}>
              {getModalMessage()}
            </Text>
            <View style={styles.modalButtons}>
              <Link href="/Licencia" style={styles.alertButton}>
                <Text style={styles.alertButtonText}>Ir a Zona de Licencia</Text>
              </Link>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    width: '100%',
    paddingHorizontal: 10,
    paddingTop: 12,
    paddingBottom: 20,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    textAlign: 'center',
    color: '#192f6a'
  },
  subtitleText: {
    marginTop: 1,
    color: '#192f6a',
    textAlign: 'center'
  },
  gradienteContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingTop: 10,
    paddingBottom: 10,
    marginBottom: 20,
    backgroundColor: '#4a71c7', 
    borderBottomLeftRadius: 80,
    borderBottomRightRadius: 80,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
    height: '50%'
  },
  gradienteBarraContainer: {
  alignItems: 'center',
  width: '90%',
  // flex: 1,              // ❌ ELIMINA ESTA LÍNEA
  // justifyContent: 'center',  // ❌ ELIMINA ESTA LÍNEA
  marginVertical: 0,
  shadowColor: '#000',
  shadowOpacity: 0.2,
  shadowRadius: 10,
  elevation: 5,
  overflow: 'hidden',
  borderRadius: 10,
},

resumenNumero: {
fontSize: 20,
fontWeight: 'bold',
color: '#192f6a',
textAlign: 'center',
marginVertical: 6,
},

texto: {
  fontSize: 20,
  fontWeight: '700',
  color: '#192f6a',
  textAlign: 'center',
  marginVertical: 12,
  padding: 20,
},
  gradienteResumenContainer: {
    alignItems: 'center',
    backgroundColor: '#4a71c7', 
    borderRadius: 10,
    padding: 10,
    width: '100%',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
    overflow: 'hidden',
    flexShrink: 1,
    marginHorizontal: 2
  },
  resumenContainer2: {    
    padding: 5,   
    width: '95%',
    marginBottom: 10, 
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  licenciaText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffffff',
    textAlign: 'center',
    marginTop: 8,
  },
  copyrightContainer: {
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'center',
    marginTop: 'auto',
    width: '100%',
  },
  copyrightText: {
    fontSize: 14,
    color: 'gray',
    marginTop: 20,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 420,
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
  modalButtons: {
    alignItems: 'center',
    width: '100%',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%'
  },
  button: {
    padding: 10,
    borderRadius: 5,
    width: '45%',
    alignItems: 'center',
  },
  buttonLater: {
    padding: 10,
    borderRadius: 5,
    width: '80%',
    backgroundColor: '#ccc',
    marginTop: 10,
    alignItems: 'center',
  },
  buttonConfirm: {
    backgroundColor: '#4a71c7',
  },
  buttonCancel: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    marginTop: 5,
  },

   licenseContainer: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
    marginTop: 20,
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
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
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
  currentLicenseInfo: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 10,
    marginVertical: 5,
    width: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bntLicenseInfo: {
    width: '100%',    
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
