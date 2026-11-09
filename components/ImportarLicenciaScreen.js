import React, { useState } from 'react';
import { View, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { AppText as Text, AppTextInput as TextInput } from './AppText';
import { useLicencia } from '../contexts/LicenciaContext';
import { commonStyles } from '../styles/commonStyles';
import ScreenHeader from './ScreenHeader';

const ImportarLicenciaScreen = () => {
  const { importarLicencia, lalicencia, deviceId } = useLicencia();
  const [licenciaTexto, setLicenciaTexto] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Ejemplo de licencia para pruebas
  const licenciaEjemplo = {
    "software": "ENCODIGO",
    "licenseKey": "1C78-CEBA-8C1E",
    "signature": "JG+E6S0CCJ6EJWuR918WSoOZfWkl2yrZCDKDqqU9D6ZAoxD8q7/+3U3EV2xjdJY2CynSYhgpokdB3kViYmhkT+WwsfiIDWdsuqn5aUSpu0zFQN/MyZmXSG8C6fBf8Zd1sVVjTyxLI7t6/1WzzvUUE45pN+VHsumOBg3Z1rzPNNq9KUnmKtygzZOjVOGIOAieXUzatZD9E7PiIDZxEpGYIiPMzEOjkXaFd5XseZzPEnct6NHbhPlCrU7rftwPaqvarIgVx8Zapd+ka8K6PJTb2HQF8o+BFVeCKmwFbDnYkqvAHOeqoNQPjv0UpJXKvBvfNPuRiRzVc+oVj9QT//AvOQ==",
    "machineId": deviceId || "ac0dc40359039a29efc783157b4c0dcead734f8feaebdd6d2fdaada689a87b45",
    "customer": "Primer Cliente APK",
    "startDate": "21/09/2025",
    "expiration": "21/09/2026"
  };

  const cargarEjemplo = () => {
    setLicenciaTexto(JSON.stringify(licenciaEjemplo, null, 2));
  };

  const handleImportarLicencia = async () => {
    if (!licenciaTexto.trim()) {
      Alert.alert('Error', 'Por favor ingrese los datos de la licencia');
      return;
    }

    setIsLoading(true);
    
    try {
      // Intentar parsear el JSON
      const licenciaData = JSON.parse(licenciaTexto);
      
      // Llamar a la función de importar
      const resultado = await importarLicencia(licenciaData);
      
      if (resultado.success) {
        Alert.alert(
          'Éxito', 
          resultado.message,
          [
            {
              text: 'OK',
              onPress: () => {
                setLicenciaTexto('');
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', resultado.error);
      }
      
    } catch (parseError) {
      Alert.alert('Error', 'Formato JSON inválido. Verifique los datos de la licencia.');
    } finally {
      setIsLoading(false);
    }
  };

  const limpiarCampo = () => {
    setLicenciaTexto('');
  };

  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader title="IMPORTAR LICENCIA" backHref="/Licencia" />
      <ScrollView style={commonStyles.container}>
        <View style={commonStyles.content}>
        
        {/* Información del dispositivo */}
        <View style={[commonStyles.card, { marginBottom: 20 }]}>
          <Text style={commonStyles.subtitle}>Información del Dispositivo</Text>
          <Text style={commonStyles.text}>
            <Text style={{ fontWeight: 'bold' }}>Device ID: </Text>
            {deviceId || 'Generando...'}
          </Text>
        </View>

        {/* Licencia actual */}
        {lalicencia && (
          <View style={[commonStyles.card, { marginBottom: 20, backgroundColor: '#e8f5e8' }]}>
            <Text style={commonStyles.subtitle}>Licencia Actual</Text>
            <Text style={commonStyles.text}>
              <Text style={{ fontWeight: 'bold' }}>Cliente: </Text>
              {lalicencia.customer}
            </Text>
            <Text style={commonStyles.text}>
              <Text style={{ fontWeight: 'bold' }}>Clave: </Text>
              {lalicencia.licenseKey}
            </Text>
            <Text style={commonStyles.text}>
              <Text style={{ fontWeight: 'bold' }}>Expira: </Text>
              {lalicencia.expiration}
            </Text>
          </View>
        )}

        {/* Campo de entrada */}
        <View style={commonStyles.card}>
          <Text style={commonStyles.subtitle}>Datos de la Licencia (JSON)</Text>
          
          <TextInput
            style={[
              commonStyles.input,
              { 
                height: 200, 
                textAlignVertical: 'top',
                fontFamily: 'monospace',
                fontSize: 12
              }
            ]}
            multiline
            placeholder="Pegue aquí los datos de la licencia en formato JSON..."
            value={licenciaTexto}
            onChangeText={setLicenciaTexto}
            editable={!isLoading}
          />

          {/* Botones de acción */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 }}>
            <TouchableOpacity
              style={[commonStyles.button, { backgroundColor: '#6c757d', flex: 0.3 }]}
              onPress={cargarEjemplo}
              disabled={isLoading}
            >
              <Text style={commonStyles.buttonText}>Ejemplo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[commonStyles.button, { backgroundColor: '#dc3545', flex: 0.3 }]}
              onPress={limpiarCampo}
              disabled={isLoading}
            >
              <Text style={commonStyles.buttonText}>Limpiar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                commonStyles.button, 
                { 
                  backgroundColor: isLoading ? '#ccc' : '#28a745',
                  flex: 0.3
                }
              ]}
              onPress={handleImportarLicencia}
              disabled={isLoading}
            >
              <Text style={commonStyles.buttonText}>
                {isLoading ? 'Importando...' : 'Importar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Instrucciones */}
        <View style={[commonStyles.card, { marginTop: 20, backgroundColor: '#f8f9fa' }]}>
          <Text style={commonStyles.subtitle}>Instrucciones</Text>
          <Text style={[commonStyles.text, { fontSize: 14 }]}>
            1. Pegue los datos de la licencia en formato JSON en el campo de texto{'\n'}
            2. Verifique que el machineId coincida con el Device ID de este dispositivo{'\n'}
            3. Presione "Importar" para validar e instalar la licencia{'\n'}
            4. Use "Ejemplo" para cargar datos de prueba
          </Text>
        </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default ImportarLicenciaScreen;