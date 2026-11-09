# Función Importar Licencia

## Descripción
La función `importarLicencia` permite importar y validar licencias en formato JSON para la aplicación ENCODIGO. Esta función realiza múltiples validaciones para asegurar que la licencia sea válida y compatible con el dispositivo actual.

## Uso

### Desde un componente React
```javascript
import { useLicencia } from '../contexts/LicenciaContext';

const MiComponente = () => {
  const { importarLicencia } = useLicencia();

  const handleImportar = async () => {
    const licenciaData = {
      "software": "ENCODIGO",
      "licenseKey": "1C78-CEBA-8C1E",
      "signature": "JG+E6S0CCJ6EJWuR918WSoOZfWkl2yrZCDKDqqU9D6ZAoxD8q7/+3U3EV2xjdJY2CynSYhgpokdB3kViYmhkT+WwsfiIDWdsuqn5aUSpu0zFQN/MyZmXSG8C6fBf8Zd1sVVjTyxLI7t6/1WzzvUUE45pN+VHsumOBg3Z1rzPNNq9KUnmKtygzZOjVOGIOAieXUzatZD9E7PiIDZxEpGYIiPMzEOjkXaFd5XseZzPEnct6NHbhPlCrU7rftwPaqvarIgVx8Zapd+ka8K6PJTb2HQF8o+BFVeCKmwFbDnYkqvAHOeqoNQPjv0UpJXKvBvfNPuRiRzVc+oVj9QT//AvOQ==",
      "machineId": "ac0dc40359039a29efc783157b4c0dcead734f8feaebdd6d2fdaada689a87b45",
      "customer": "Primer Cliente APK",
      "startDate": "21/09/2025",
      "expiration": "21/09/2026"
    };

    const resultado = await importarLicencia(licenciaData);
    
    
  };
};
```

## Formato de Licencia

La licencia debe ser un objeto JSON con los siguientes campos obligatorios:

```json
{
  "software": "ENCODIGO",
  "licenseKey": "Clave de la licencia",
  "signature": "Firma digital en base64",
  "machineId": "ID único del dispositivo",
  "customer": "Nombre del cliente",
  "startDate": "DD/MM/YYYY",
  "expiration": "DD/MM/YYYY"
}
```

### Campos Requeridos

- **software**: Debe ser exactamente "ENCODIGO"
- **licenseKey**: Clave única de la licencia
- **signature**: Firma digital para verificar autenticidad
- **machineId**: Debe coincidir con el ID del dispositivo actual
- **customer**: Nombre del cliente o empresa
- **startDate**: Fecha de inicio en formato DD/MM/YYYY
- **expiration**: Fecha de expiración en formato DD/MM/YYYY

## Validaciones Realizadas

### 1. Validación de Estructura
- Verifica que todos los campos requeridos estén presentes
- Valida que el software sea "ENCODIGO"
- Verifica el formato de las fechas (DD/MM/YYYY)

### 2. Validación de Dispositivo
- Compara el `machineId` de la licencia con el ID del dispositivo actual
- Si no coinciden, rechaza la licencia

### 3. Validación de Expiración
- Verifica que la fecha de expiración no haya pasado
- Convierte las fechas del formato DD/MM/YYYY a objetos Date para comparación

### 4. Verificación de Firma Digital
- Valida que la firma esté presente y tenga el formato correcto
- Actualmente implementa validación básica de formato
- Preparado para implementar verificación criptográfica completa

## Respuesta de la Función

La función retorna un objeto con la siguiente estructura:

### Éxito
```javascript
{
  success: true,
  message: "Licencia importada correctamente"
}
```

### Error
```javascript
{
  success: false,
  error: "Descripción del error"
}
```

## Posibles Errores

- `"Base de datos no disponible"`: La base de datos SQLite no está disponible
- `"Campo requerido faltante: [campo]"`: Falta un campo obligatorio
- `"Esta licencia no es para el software ENCODIGO"`: El campo software no es correcto
- `"Formato de fecha inválido. Use DD/MM/YYYY"`: Las fechas no tienen el formato correcto
- `"Esta licencia no es válida para este dispositivo"`: El machineId no coincide
- `"La licencia expiró el [fecha]"`: La licencia ha expirado
- `"Firma digital inválida o faltante"`: Problema con la firma digital

## Componente de Interfaz

Se incluye un componente completo `ImportarLicenciaScreen` que proporciona:

- Campo de texto para pegar la licencia JSON
- Validación en tiempo real
- Botón para cargar ejemplo de licencia
- Información del dispositivo actual
- Estado de la licencia actual
- Instrucciones de uso

### Acceso al Componente
La pantalla está disponible en la ruta `/ImportarLicencia` de la aplicación.

## Ejemplo Completo

```javascript
import React, { useState } from 'react';
import { useLicencia } from '../contexts/LicenciaContext';

const EjemploImportarLicencia = () => {
  const { importarLicencia, deviceId } = useLicencia();
  const [resultado, setResultado] = useState(null);

  const licenciaEjemplo = {
    "software": "ENCODIGO",
    "licenseKey": "1C78-CEBA-8C1E",
    "signature": "JG+E6S0CCJ6EJWuR918WSoOZfWkl2yrZCDKDqqU9D6ZAoxD8q7/+3U3EV2xjdJY2CynSYhgpokdB3kViYmhkT+WwsfiIDWdsuqn5aUSpu0zFQN/MyZmXSG8C6fBf8Zd1sVVjTyxLI7t6/1WzzvUUE45pN+VHsumOBg3Z1rzPNNq9KUnmKtygzZOjVOGIOAieXUzatZD9E7PiIDZxEpGYIiPMzEOjkXaFd5XseZzPEnct6NHbhPlCrU7rftwPaqvarIgVx8Zapd+ka8K6PJTb2HQF8o+BFVeCKmwFbDnYkqvAHOeqoNQPjv0UpJXKvBvfNPuRiRzVc+oVj9QT//AvOQ==",
    "machineId": deviceId, // Usar el ID del dispositivo actual
    "customer": "Cliente de Ejemplo",
    "startDate": "22/09/2025",
    "expiration": "22/09/2026"
  };

  const probarImportacion = async () => {
    const resultado = await importarLicencia(licenciaEjemplo);
    setResultado(resultado);
  };

  return (
    <div>
      <button onClick={probarImportacion}>
        Probar Importación
      </button>
      {resultado && (
        <div>
          {resultado.success ? (
            <p style={{color: 'green'}}>{resultado.message}</p>
          ) : (
            <p style={{color: 'red'}}>{resultado.error}</p>
          )}
        </div>
      )}
    </div>
  );
};
```

## Notas Técnicas

- La función es asíncrona y debe ser llamada con `await`
- Utiliza la base de datos SQLite para almacenar la licencia
- Actualiza automáticamente el estado del contexto de licencias
- Es compatible con React Native y Expo
- Utiliza las librerías `expo-crypto` y `jsrsasign` para operaciones criptográficas

## Seguridad

- La verificación de firma digital está preparada para implementación completa
- Se valida la integridad de todos los campos
- Se verifica la correspondencia con el dispositivo
- Se controla la expiración de licencias