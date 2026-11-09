import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, ScrollView, Modal, Clipboard, Linking } from 'react-native';
import { AppText as Text } from './AppText';
import { FontAwesome5 } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { commonStyles } from '../styles/commonStyles';

// Importar el logo de la aplicación
const logoFinik = require('../assets/logo.png');

const PagoLicenciaScreen = ({ visible, onClose, deviceId }) => {
  const [metodoPago, setMetodoPago] = useState(null);
  const [mostrarQR, setMostrarQR] = useState(false);

  // Información de pago (estos datos deberían venir de configuración)
  const infoPagos = {
    enzona: {
      nombre: 'ENZONA',
      telefono: '+5354256428',
      email: 'encodigo@enzona.cu',
      tarjeta: '9205 **** **** 3528',
      precio: '8 000.00 CUP',
      color: '#1e88e5',
      icon: 'mobile-alt',
      qrCode: '0225b36083f47d411992a5a039da375b95'
    },
    transfermovil: {
      nombre: 'TRANSFERMÓVIL',
      telefono: '+5354256428',
      tarjeta: '9205 **** **** 3528',
      precio: '8 000.00 CUP',
      color: '#43a047',
      icon: 'credit-card',
      qrCode: 'TRANSFERMOVIL_ETECSA,TRANSFERENCIA,9205129974003528,54256428,'
    }
  };

  const generarDatosPago = (metodo) => {
    const info = infoPagos[metodo];
    const referencia = `ENCODIGO-${deviceId?.substring(0, 8)}-${Date.now().toString().slice(-6)}`;
    
    return {
      ...info,
      referencia,
      concepto: `Licencia ENCODIGO - ${deviceId?.substring(0, 8)}`,
      instrucciones: metodo === 'enzona' 
        ? `Enviar ${info.precio} a ${info.telefono} con concepto: ${referencia}`
        : `Transferir ${info.precio} a la tarjeta ${info.tarjeta} con concepto: ${referencia}`
    };
  };

  const seleccionarMetodo = (metodo) => {
    setMetodoPago(metodo);
    setMostrarQR(true);
  };

  const copiarAlPortapapeles = (texto) => {
    Clipboard.setString(texto);
    Alert.alert('Copiado', 'Información copiada al portapapeles');
  };

  const abrirAppPago = async (metodo) => {
    const datosPago = generarDatosPago(metodo);

    try {
      let urls = [];

      if (metodo === 'enzona') {
        // Para ENZONA, intentar varios deep links conocidos
        urls = [
          `enzona://pay?code=${datosPago.qrCode}`,
          `enzona://payment?code=${datosPago.qrCode}`,
          `com.etecsa.enzona://pay?code=${datosPago.qrCode}`,
          `intent://pay?code=${datosPago.qrCode}#Intent;scheme=enzona;package=com.etecsa.enzona;end`
        ];
      } else if (metodo === 'transfermovil') {
        // Para TRANSFERMÓVIL, intentar varios deep links conocidos
        const qrData = datosPago.qrCode;
        urls = [
          `transfermovil://transfer?data=${encodeURIComponent(qrData)}`,
          `transfermovil://payment?data=${encodeURIComponent(qrData)}`,
          `cu.etecsa.cubacel.tr.tm://transfer?data=${encodeURIComponent(qrData)}`,
          `intent://transfer?data=${encodeURIComponent(qrData)}#Intent;scheme=transfermovil;package=cu.etecsa.cubacel.tr.tm;end`
        ];

      }

      // Intentar abrir con cada URL hasta que una funcione
      let opened = false;
      for (const url of urls) {
        try {
          const canOpen = await Linking.canOpenURL(url);
          if (canOpen) {
            await Linking.openURL(url);
            opened = true;
            break;
          }
        } catch (error) {
          // Continuar con la siguiente URL
          continue;
        }
      }

      if (!opened) {
        // Si ninguna URL funcionó, mostrar opciones alternativas
        const appName = metodo === 'enzona' ? 'ENZONA' : 'TRANSFERMÓVIL';
        Alert.alert(
          `Abrir ${appName}`,
          `No se pudo abrir automáticamente la aplicación ${appName}. Selecciona una opción:`,
          [
            {
              text: 'Copiar código QR',
              onPress: () => copiarAlPortapapeles(datosPago.qrCode)
            },
            {
              text: 'Escanear manualmente',
              onPress: () => Alert.alert(
                'Escaneo manual',
                `Abre la aplicación ${appName} manualmente y escanea el código QR mostrado en pantalla.`
              )
            },
            { text: 'Cancelar', style: 'cancel' }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo abrir la aplicación de pago');
    }
  };

  const confirmarPago = () => {
    Alert.alert(
      'Pago Realizado',
      '¿Ha completado el pago? Una vez confirmado, recibirá su licencia por WhatsApp o SMS.',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Sí, he pagado',
          onPress: () => {
            Alert.alert(
              'Pago Confirmado',
              'Su pago ha sido registrado. Recibirá su licencia en las próximas 24 horas.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    setMostrarQR(false);
                    setMetodoPago(null);
                    onClose();
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const renderSeleccionMetodo = () => (
    <View style={styles.metodosContainer}>
      <Text style={styles.titulo}>Seleccione Método de Pago</Text>
      <Text style={styles.subtitulo}>Licencia ENCODIGO - Precio: 8 000.00 CUP</Text>
      
      <TouchableOpacity
        style={[styles.metodoButton, { backgroundColor: infoPagos.enzona.color }]}
        onPress={() => seleccionarMetodo('enzona')}
      >
        <FontAwesome5 name={infoPagos.enzona.icon} size={30} color="white" />
        <View style={styles.metodoInfo}>
          <Text style={styles.metodoNombre}>{infoPagos.enzona.nombre}</Text>
          <Text style={styles.metodoPrecio}>{infoPagos.enzona.precio}</Text>
        </View>
        <FontAwesome5 name="chevron-right" size={20} color="white" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.metodoButton, { backgroundColor: infoPagos.transfermovil.color }]}
        onPress={() => seleccionarMetodo('transfermovil')}
      >
        <FontAwesome5 name={infoPagos.transfermovil.icon} size={30} color="white" />
        <View style={styles.metodoInfo}>
          <Text style={styles.metodoNombre}>{infoPagos.transfermovil.nombre}</Text>
          <Text style={styles.metodoPrecio}>{infoPagos.transfermovil.precio}</Text>
        </View>
        <FontAwesome5 name="chevron-right" size={20} color="white" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={onClose}
      >
        <Text style={styles.cancelButtonText}>Cancelar</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPagoQR = () => {
    const datosPago = generarDatosPago(metodoPago);
    // Usar códigos QR específicos para ambos métodos
    const qrData = datosPago.qrCode
      ? datosPago.qrCode
      : JSON.stringify({
          metodo: metodoPago,
          telefono: datosPago.telefono,
          tarjeta: datosPago.tarjeta,
          monto: datosPago.precio,
          referencia: datosPago.referencia,
          concepto: datosPago.concepto
        });

    return (
      <ScrollView style={styles.pagoContainer}>
        <View style={styles.pagoHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setMostrarQR(false);
              setMetodoPago(null);
            }}
          >
            <FontAwesome5 name="arrow-left" size={20} color="#666" />
          </TouchableOpacity>
          <Text style={styles.pagoTitulo}>Pago con {datosPago.nombre}</Text>
        </View>

        <View style={styles.qrContainer}>
          <TouchableOpacity
            onPress={() => abrirAppPago(metodoPago)}
            style={styles.qrTouchable}
          >
            <QRCode
              value={qrData}
              size={200}
              backgroundColor="white"
              color="black"
              logo={logoFinik}
              logoSize={40}
              logoBackgroundColor="white"
              logoBorderRadius={3}
            />
           
          </TouchableOpacity>
          <Text style={styles.qrTexto}>Toque para intentar abrir la app automáticamente, o abra manualmente y escanee</Text>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitulo}>Información de Pago</Text>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Método:</Text>
            <Text style={styles.infoValor}>{datosPago.nombre}</Text>
          </View>

          {datosPago.telefono && (
            <TouchableOpacity
              style={styles.infoItem}
              onPress={() => copiarAlPortapapeles(datosPago.telefono)}
            >
              <Text style={styles.infoLabel}>Teléfono:</Text>
              <Text style={[styles.infoValor, styles.copiable]}>{datosPago.telefono}</Text>
              <FontAwesome5 name="copy" size={16} color="#666" />
            </TouchableOpacity>
          )}

          {datosPago.tarjeta && (
            <TouchableOpacity
              style={styles.infoItem}
              onPress={() => copiarAlPortapapeles(datosPago.tarjeta)}
            >
              <Text style={styles.infoLabel}>Tarjeta:</Text>
              <Text style={[styles.infoValor, styles.copiable]}>{datosPago.tarjeta}</Text>
              <FontAwesome5 name="copy" size={16} color="#666" />
            </TouchableOpacity>
          )}

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Monto:</Text>
            <Text style={[styles.infoValor, styles.precio]}>{datosPago.precio}</Text>
          </View>

          <TouchableOpacity
            style={styles.infoItem}
            onPress={() => copiarAlPortapapeles(datosPago.referencia)}
          >
            <Text style={styles.infoLabel}>Referencia:</Text>
            <Text style={[styles.infoValor, styles.copiable]}>{datosPago.referencia}</Text>
            <FontAwesome5 name="copy" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.infoItem}
            onPress={() => copiarAlPortapapeles(datosPago.concepto)}
          >
            <Text style={styles.infoLabel}>Concepto:</Text>
            <Text style={[styles.infoValor, styles.copiable]}>{datosPago.concepto}</Text>
            <FontAwesome5 name="copy" size={16} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.instruccionesContainer}>
          <Text style={styles.instruccionesTitulo}>Instrucciones</Text>
          <Text style={styles.instruccionesTexto}>
            1. Toque el código QR para intentar abrir la app de pago automáticamente{'\n'}
            2. Si no se abre, use el botón "Abrir Manualmente" para instrucciones{'\n'}
            3. También puede copiar el código QR y pegarlo manualmente en la app{'\n'}
            4. {datosPago.instrucciones}{'\n'}
            5. Use la referencia exacta para identificar su pago{'\n'}
            6. Confirme el pago presionando el botón "He Realizado el Pago"{'\n'}
            7. Recibirá su licencia en 24 horas máximo
          </Text>
        </View>

        <View style={styles.botonesContainer}>
          <TouchableOpacity
            style={[styles.botonSecundario, styles.abrirManualButton]}
            onPress={() => {
              const appName = metodoPago === 'enzona' ? 'ENZONA' : 'TRANSFERMÓVIL';
              Alert.alert(
                `Abrir ${appName} manualmente`,
                `1. Cierra esta pantalla\n2. Abre la aplicación ${appName} en tu teléfono\n3. Ve a la sección de pagos o escaneo QR\n4. Escanea el código QR mostrado arriba\n5. Completa el pago de 8 000.00 CUP`,
                [{ text: 'Entendido' }]
              );
            }}
          >
            <FontAwesome5 name="mobile-alt" size={16} color="#007bff" />
            <Text style={styles.botonSecundarioText}>Abrir Manualmente</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.confirmarButton}
            onPress={confirmarPago}
          >
            <FontAwesome5 name="check-circle" size={20} color="white" />
            <Text style={styles.confirmarButtonText}>He Realizado el Pago</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {!mostrarQR ? renderSeleccionMetodo() : renderPagoQR()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  metodosContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitulo: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  metodoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metodoInfo: {
    flex: 1,
    marginLeft: 15,
  },
  metodoNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  metodoPrecio: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
  },
  cancelButton: {
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#dc3545',
    marginTop: 20,
  },
  cancelButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pagoContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  pagoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 10,
    marginRight: 10,
  },
  pagoTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  qrContainer: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'white',
  },
  qrTouchable: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  qrOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  qrOverlayText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  qrTexto: {
    marginTop: 15,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  infoContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 2,
  },
  infoTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    width: 80,
    color: '#666',
  },
  infoValor: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  copiable: {
    color: '#007bff',
  },
  precio: {
    fontWeight: 'bold',
    color: '#28a745',
  },
  instruccionesContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  instruccionesTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#856404',
  },
  instruccionesTexto: {
    fontSize: 14,
    lineHeight: 20,
    color: '#856404',
  },
  confirmarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 12,
  },
  confirmarButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  botonesContainer: {
    margin: 20,
    gap: 10,
  },
  botonSecundario: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007bff',
    backgroundColor: 'transparent',
    marginBottom: 10,
  },
  abrirManualButton: {
    borderColor: '#007bff',
  },
  botonSecundarioText: {
    color: '#007bff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default PagoLicenciaScreen;