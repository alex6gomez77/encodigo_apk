import { createContext, useState, useEffect, useContext } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import CryptoJS from 'crypto-js';

import * as Device from 'expo-device';
import * as Application from 'expo-application';

// Tipos de estado de licencia
export const LICENCIA_ESTADOS = {
  SIN_LICENCIA: 'sin_licencia',
  TRIAL_ACTIVA: 'trial_activa',
  TRIAL_VENCIDA: 'trial_vencida',
  ORIGINAL_ACTIVA: 'original_activa',
  ORIGINAL_VENCIDA: 'original_vencida',
  ERROR: 'error'
};

// Crear el contexto
const LicenciaContext = createContext({
  // Estados
  licenciaActiva: null,
  lalicencia: null,
  deviceId: null,
  isLoading: true,
  licenciaEstado: LICENCIA_ESTADOS.SIN_LICENCIA,

  // Funciones
  setLicenciaActiva: () => {},
  setLalicencia: () => {},
  setDeviceId: () => {},
  verificarLicencia: () => {},
  generarLicenciaTemporal: () => {},
  eliminarLicencia: () => {},
  refrescarLicencia: () => {},
  importarLicencia: () => {},
});

// Provider del contexto
export const LicenciaProvider = ({ children }) => {
  const db = useSQLiteContext();

  // Estados
  const [licenciaActiva, setLicenciaActiva] = useState(null);
  const [lalicencia, setLalicencia] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [licenciaEstado, setLicenciaEstado] = useState(LICENCIA_ESTADOS.SIN_LICENCIA);


// --- UTILIDADES ---
function base64ToUint8Array(base64) {
  const cleaned = base64.replace(/-/g, '+').replace(/_/g, '/'); // en caso de base64url
  const binaryString = atob(cleaned);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function hexToUint8Array(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

function wordArrayToUint8Array(wordArray) {
  const words = wordArray.words;
  const sigBytes = wordArray.sigBytes;
  const u8 = new Uint8Array(sigBytes);
  for (let i = 0; i < sigBytes; i++) {
    u8[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
  }
  return u8;
}

function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

const AES_LICENSE_KEY_HEX = '7f4e8a1c3b5d9f2e6a0c4b8d1f3e7a9c2b5e8f1a4d7c0e3b6a9f2c5e8d1b4a77';
const HMAC_LICENSE_KEY_HEX = '9a2b5c8d1e4f7a0b3c6d9e2f5a8b1c4d7e0f3a6b9c2d5e8f1a4b7c0d3e6f9a2b';

// Parsear claves una sola vez
const AES_KEY_WORDARRAY = CryptoJS.enc.Hex.parse(AES_LICENSE_KEY_HEX);
const HMAC_KEY_WORDARRAY = CryptoJS.enc.Hex.parse(HMAC_LICENSE_KEY_HEX);

async function decryptLicenseAPK(blobBase64) {
 try {
   const blob = base64ToUint8Array(blobBase64);
   const iv = blob.slice(0, 16);
   const ciphertext = blob.slice(16, -32);
   const receivedHmac = blob.slice(-32);
  
   // ✅ HMAC: usar Latin1 para datos binarios
   const dataToSign = new Uint8Array([...iv, ...ciphertext]);
   const dataLatin1 = String.fromCharCode.apply(null, dataToSign);
   const dataWA = CryptoJS.enc.Latin1.parse(dataLatin1);
   const expectedHmacWA = CryptoJS.HmacSHA256(dataWA, HMAC_KEY_WORDARRAY);
   const expectedHmac = wordArrayToUint8Array(expectedHmacWA);

   if (!arraysEqual(receivedHmac, expectedHmac)) {
     console.error('DEBUG: decryptLicenseAPK - HMAC validation failed');
     throw new Error('HMAC inválido');
   }

   // ✅ Descifrado AES-CBC
   const ciphertextWA = CryptoJS.lib.WordArray.create(ciphertext);
   const ivWA = CryptoJS.lib.WordArray.create(iv);

   const decrypted = CryptoJS.AES.decrypt(
     { ciphertext: ciphertextWA },
     AES_KEY_WORDARRAY,
     {
       iv: ivWA,
       mode: CryptoJS.mode.CBC,
       padding: CryptoJS.pad.Pkcs7,
     }
   );

   const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
   if (!jsonString) {
     console.error('DEBUG: decryptLicenseAPK - Decryption failed, empty result');
     throw new Error('Descifrado fallido');
   }

   return JSON.parse(jsonString);
 } catch (error) {
   console.error('DEBUG: decryptLicenseAPK - Error in decryption:', error.message);
   throw new Error('Licencia inválida o corrupta');
 }
}



/////////////////////////////////////////////////////////////////////////////////////////////



  async function generateStableDeviceId() {
    try {
      // Colectar propiedades estables
      const stableProps = [
        await Application.getAndroidId(),
        Application.applicationId,
        Device.manufacturer,
        Device.modelName,
        Device.brand,
        Device.deviceType
      ].filter(val => val && val !== 'unknown')
      .sort()
      .join('|');

      if (stableProps) {
        return await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          stableProps,
          { encoding: Crypto.CryptoEncoding.HEX }
        );
      }
    } catch (error) {
      console.error('Error generando ID estable:', error);
    }
    
    // Fallback
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${Application.applicationId}-${Device.modelName}-${Math.floor(Date.now() / 86400000)}`,
      { encoding: Crypto.CryptoEncoding.HEX }
    );
  }

// Función para verificar licencia
  const verificarLicencia = async () => {
    
    if (!db) {
      setLicenciaEstado(LICENCIA_ESTADOS.ERROR);
      setIsLoading(false);
      return {
        success: false,
        estado: LICENCIA_ESTADOS.ERROR,
        mensaje: 'Base de datos no disponible'
      };
    }
   
    setIsLoading(true);
   
    try {
      let result = await db.getFirstAsync('SELECT * FROM generales WHERE id = 1');
      if (!result) {
        // Crear registro inicial si no existe
        try {
          await db.runAsync('INSERT INTO generales (id) VALUES (1)');
          // Volver a intentar la consulta
          result = await db.getFirstAsync('SELECT * FROM generales WHERE id = 1');
          if (!result) {
            setLicenciaActiva(false);
            setLicenciaEstado(LICENCIA_ESTADOS.ERROR);
            setIsLoading(false);
            return {
              success: false,
              estado: LICENCIA_ESTADOS.ERROR,
              mensaje: 'No se pudo crear el registro inicial'
            };
          }
        } catch (insertError) {
          setLicenciaActiva(false);
          setLicenciaEstado(LICENCIA_ESTADOS.ERROR);
          setIsLoading(false);
          return {
            success: false,
            estado: LICENCIA_ESTADOS.ERROR,
            mensaje: 'Error creando registro inicial'
          };
        }
      }

      // Guardar deviceId si existe
      if (result.ir) {
        setDeviceId(result.ir);
      } else {
        // Generar deviceId usando método consistente con SHA256
      /*  const newDeviceId = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          `${Date.now()}-${Math.random()}`,
          { encoding: Crypto.CryptoEncoding.HEX }
        );
        */
        const newDeviceId = await generateStableDeviceId();
        await db.runAsync('UPDATE generales SET ir = ? WHERE id = 1', [newDeviceId]);
        setDeviceId(newDeviceId);
      }

      const licencia = result?.licencia;
     
      if (licencia) {
        try {
          // Intentar parsear la licencia como JSON
          const licenciaObj = JSON.parse(licencia);
          //corregir en el caso de que la licencia no sea TRIAL previniendo alguna manipulación de la misma
          if (licenciaObj.licenseKey !== 'TRIAL') {           
            const desencriptada = await decryptLicenseAPK(licenciaObj.signature);            
            licenciaObj.expiration = desencriptada.expiration;
            licenciaObj.startDate = desencriptada.startDate;
            licenciaObj.customer = desencriptada.customer ? desencriptada.customer : licenciaObj.customer;
            licenciaObj.machineId = desencriptada.machineId;
            licenciaObj.software = desencriptada.software;
            licenciaObj.licenseKey = desencriptada.licenseKey;
            licenciaObj.signature = licenciaObj.signature; // mantener la firma original
            
            //verificar que el machineId coincida con deviceID
            if (licenciaObj.machineId !== deviceId) {
              setLicenciaActiva(false);
              setLicenciaEstado(LICENCIA_ESTADOS.ERROR);
              setIsLoading(false);
              return {
                success: false,
                estado: LICENCIA_ESTADOS.ERROR,
                mensaje: 'La Licencia no pertenece a este dispositivo',
                licencia: licenciaObj
              };
            }

          }


          setLalicencia(licenciaObj);
          // Verificar si la licencia ha expirado usando la función auxiliar existente
          if (licenciaObj.expiration) {
            const expiracionResult = verificarExpiracion(licenciaObj.expiration);
            if (!expiracionResult.valid) {
             
              // Determinar si es trial u original
              const estado = licenciaObj.licenseKey === 'TRIAL'
                ? LICENCIA_ESTADOS.TRIAL_VENCIDA
                : LICENCIA_ESTADOS.ORIGINAL_VENCIDA;
             
              setLicenciaActiva(false);
              setLicenciaEstado(estado);
              setIsLoading(false);
              return {
                success: false,
                estado: estado,
                mensaje: expiracionResult.error,
                licencia: licenciaObj
              };
            }
          }
         
          // Licencia válida
          const estado = licenciaObj.licenseKey === 'TRIAL'
            ? LICENCIA_ESTADOS.TRIAL_ACTIVA
            : LICENCIA_ESTADOS.ORIGINAL_ACTIVA;
         
          setLicenciaActiva(true);
          setLicenciaEstado(estado);
          setIsLoading(false);
          return {
            success: true,
            estado: estado,
            mensaje: 'Licencia válida',
            licencia: licenciaObj
          };
         
        } catch (parseError) {
          setLicenciaEstado(LICENCIA_ESTADOS.ERROR);
          setIsLoading(false);
          return {
            success: false,
            estado: LICENCIA_ESTADOS.ERROR,
            mensaje: 'Error al parsear la licencia'
          };
        }
      } else {
        // No hay licencia
        const tempResult = await generarLicenciaTemporalConEstado(result.ir);
        setIsLoading(false);
        return tempResult;
      }
    } catch (e) {
      setLicenciaActiva(false);
      setLicenciaEstado(LICENCIA_ESTADOS.ERROR);
      setIsLoading(false);
      return {
        success: false,
        estado: LICENCIA_ESTADOS.ERROR,
        mensaje: 'Error al verificar licencia'
      };
    }
  };

  // Función para generar licencia temporal
  const generarLicenciaTemporal = async (machineId) => {
    return await generarLicenciaTemporalConEstado(machineId);
  };

  // Función para generar licencia temporal con estado detallado
  const generarLicenciaTemporalConEstado = async (machineId) => {
    if (!db) {
      setLicenciaEstado(LICENCIA_ESTADOS.ERROR);
      return {
        success: false,
        estado: LICENCIA_ESTADOS.ERROR,
        mensaje: 'Base de datos no disponible'
      };
    }
   
    // Usar deviceId actual si machineId no está disponible
    const finalMachineId = machineId || deviceId || await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${Date.now()}-${Math.random()}`,
      { encoding: Crypto.CryptoEncoding.HEX }
    );
   
    const licenseKey = 'TRIAL';
    const dias = 30; // Días de validez de la licencia temporal ->normal
   
    try {
      // Crear objeto de licencia con fecha de expiración
      const licenseObject = {
        software: 'ENCODIGO',
        licenseKey,
        machineId: finalMachineId,
        customer: 'USUARIO TEMPORAL',
        startDate: new Date().toLocaleDateString('es-ES'),
        expiration: new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES'),
      };

      const jsonStr = JSON.stringify(licenseObject);
     
      // Guardar la licencia en la base de datos
      await db.runAsync('UPDATE generales SET licencia = ? WHERE id = 1', [jsonStr]);

      setLalicencia(licenseObject);
      setLicenciaActiva(true);
      setLicenciaEstado(LICENCIA_ESTADOS.TRIAL_ACTIVA);
     
      return {
        success: true,
        estado: LICENCIA_ESTADOS.TRIAL_ACTIVA,
        mensaje: 'Licencia trial generada exitosamente',
        licencia: licenseObject
      };
    } catch (e) {
      setLicenciaActiva(false);
      setLicenciaEstado(LICENCIA_ESTADOS.ERROR);
      return {
        success: false,
        estado: LICENCIA_ESTADOS.ERROR,
        mensaje: 'Error al generar licencia temporal'
      };
    }
  };

  // Función para eliminar licencia
  const eliminarLicencia = async () => {
    if (!db) {
      setLicenciaEstado(LICENCIA_ESTADOS.ERROR);
      return {
        success: false,
        estado: LICENCIA_ESTADOS.ERROR,
        mensaje: 'Base de datos no disponible'
      };
    }
   
    try {
      await db.runAsync('UPDATE generales SET licencia = NULL WHERE id = 1');
      setLicenciaActiva(false);
      setLalicencia(null);
      setLicenciaEstado(LICENCIA_ESTADOS.SIN_LICENCIA);
      return {
        success: true,
        estado: LICENCIA_ESTADOS.SIN_LICENCIA,
        mensaje: 'Licencia eliminada correctamente'
      };
    } catch (e) {
      setLicenciaEstado(LICENCIA_ESTADOS.ERROR);
      return {
        success: false,
        estado: LICENCIA_ESTADOS.ERROR,
        mensaje: 'Error al eliminar licencia'
      };
    }
  };

  // Función para refrescar el estado de la licencia
  const refrescarLicencia = async () => {
    return await verificarLicencia();
  };

  // Función para importar licencia
  const importarLicencia = async (licenciaData) => {
    if (!db) {
      return { success: false, error: 'Base de datos no disponible' };
    }

    try {
      // Validar estructura de la licencia
      const validacionResult = validarEstructuraLicencia(licenciaData);
      if (!validacionResult.valid) {
        return { success: false, error: validacionResult.error };
      }

      // Verificar que el machineId coincida con el dispositivo actual
      
      const currentDeviceId = deviceId || obtenerDeviceId();
      const desencriptada = decryptLicenseAPK(licenciaData.signature)._j;
      if (desencriptada.machineId !== currentDeviceId) {
         return {
          success: false,
          error: `Esta licencia no es válida para este dispositivo. MachineId esperado: ${currentDeviceId}`
        };
      }

      // Verificar que la licencia no haya expirado
      const expiracionResult = verificarExpiracion(desencriptada.expiration);
      if (!expiracionResult.valid) {
        return { success: false, error: expiracionResult.error };
      }

      // Verificar firma digital (opcional, dependiendo de si tienes clave pública)
      const firmaResult = await verificarFirmaDigital(licenciaData);
      if (!firmaResult.valid) {
        // Puedes decidir si continuar o no con licencias sin firma válida
      }

     

      // Si todas las validaciones pasan, guardar la licencia
      licenciaData.startDate = desencriptada.startDate;
      licenciaData.expiration = desencriptada.expiration;  

      const licenciaJson = JSON.stringify(licenciaData);          

      await db.runAsync('UPDATE generales SET licencia = ? WHERE id = 1', [licenciaJson]);

      // Determinar el estado de la licencia importada
      const importacionExpiracionResult = verificarExpiracion(licenciaData.expiration);
      const estado = importacionExpiracionResult.valid
        ? (licenciaData.licenseKey === 'TRIAL' ? LICENCIA_ESTADOS.TRIAL_ACTIVA : LICENCIA_ESTADOS.ORIGINAL_ACTIVA)
        : (licenciaData.licenseKey === 'TRIAL' ? LICENCIA_ESTADOS.TRIAL_VENCIDA : LICENCIA_ESTADOS.ORIGINAL_VENCIDA);

      // Actualizar estados
      setLalicencia(licenciaData);
      setLicenciaActiva(importacionExpiracionResult.valid);
      setLicenciaEstado(estado);

      return {
        success: true,
        message: 'Licencia importada correctamente',
        estado: estado,
        licencia: licenciaData
      };

    } catch (error) {
      return { success: false, error: `Error al importar licencia: ${error.message}` };
    }
  };

  // Función auxiliar para validar estructura de licencia
  const validarEstructuraLicencia = (licencia) => {
    const camposRequeridos = ['software', 'licenseKey', 'signature', 'machineId', 'customer', 'startDate', 'expiration'];
   
    for (const campo of camposRequeridos) {
      if (!licencia[campo]) {
        return { valid: false, error: `Campo requerido faltante: ${campo}` };
      }
    }

    // Validar que sea para el software correcto
    if (licencia.software !== 'ENCODIGO') {
      return { valid: false, error: 'Esta licencia no es para el software ENCODIGO' };
    }

    // Validar formato de fechas
    if (!validarFormatoFecha(licencia.startDate) || !validarFormatoFecha(licencia.expiration)) {
      return { valid: false, error: 'Formato de fecha inválido. Use DD/MM/YYYY' };
    }
     //Validar aquí el id del dispositivo
    if (licencia.machineId.length < 10) {
      return { valid: false, error: 'MachineId inválido' };
    }
    

    return { valid: true };
  };

  // Función auxiliar para validar formato de fecha
  const validarFormatoFecha = (fecha) => {
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!regex.test(fecha)) return false;
   
    const [day, month, year] = fecha.split('/').map(Number);
    const date = new Date(year, month - 1, day);
   
    return date.getDate() === day &&
           date.getMonth() === month - 1 &&
           date.getFullYear() === year;
  };

  // Función auxiliar para calcular días restantes
  const calcularDiasRestantes = (expiration) => {
    try {
      const [day, month, year] = expiration.split('/').map(Number);
      const expDate = new Date(year, month - 1, day);
      const now = new Date();
      const timeDiff = expDate - now;
      const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      return daysRemaining;
    } catch (error) {
      return -1; // Error
    }
  };

  // Función auxiliar para verificar expiración
  const verificarExpiracion = (expiration) => {
    try {
      const daysRemaining = calcularDiasRestantes(expiration);

      if (daysRemaining <= 0) {
        return { valid: false, error: `La licencia expiró el ${expiration}`, daysRemaining };
      }

      return { valid: true, daysRemaining };
    } catch (error) {
      return { valid: false, error: 'Error al verificar fecha de expiración', daysRemaining: -1 };
    }
  };

  // Función auxiliar para verificar firma digital
  const verificarFirmaDigital = async (licencia) => {
    try {
      // Aquí deberías tener la clave pública para verificar la firma
      // Por ahora, solo verificamos que la firma existe y tiene el formato correcto
      if (!licencia.signature || licencia.signature.length < 50) {
        return { valid: false, error: 'Firma digital inválida o faltante' };
      }

      // Crear el mensaje que debería haber sido firmado
      const mensaje = `${licencia.software}|${licencia.licenseKey}|${licencia.machineId}|${licencia.customer}|${licencia.startDate}|${licencia.expiration}`;
     
      // TODO: Implementar verificación real con clave pública
      // const publicKey = "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----";
      // const isValid = KJUR.crypto.Signature.verifyWithMessageHash(
      //   mensaje,
      //   licencia.signature,
      //   publicKey
      // );
     
      // Por ahora, solo validamos el formato
      return { valid: true, warning: 'Verificación de firma no implementada completamente' };
     
    } catch (error) {
      return { valid: false, error: `Error verificando firma: ${error.message}` };
    }
  };

  // Función auxiliar para obtener device ID
  const obtenerDeviceId = async () => {
    try {
      const result = await db.getFirstAsync('SELECT ir FROM generales WHERE id = 1');
      if (result?.ir) {
        setDeviceId(result.ir);
        return result.ir;
      } else {
        // Generar nuevo device ID
        const newDeviceId = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          `${Date.now()}-${Math.random()}`,
          { encoding: Crypto.CryptoEncoding.HEX }
        );
        await db.runAsync('UPDATE generales SET ir = ? WHERE id = 1', [newDeviceId]);
        setDeviceId(newDeviceId);
        return newDeviceId;
      }
    } catch (error) {
      const fallbackId = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `${Date.now()}-${Math.random()}`,
        { encoding: Crypto.CryptoEncoding.HEX }
      );
      setDeviceId(fallbackId);
      return fallbackId;
    }
  };

  // Efecto para verificar licencia al inicializar
  useEffect(() => {   
    const normal = 1; // Cambiar a 1 para modo normal, 0 para desarrollo (elimina licencia) ->dias
    if (normal) {
    if (db) {
      // Agregar un pequeño delay para asegurar que la DB esté completamente lista
      const timer = setTimeout(() => {
          verificarLicencia();
      }, 100);
     
      return () => clearTimeout(timer);
    } else {
      setIsLoading(true);
    }
  } else{
    eliminarLicencia();
  }
  }, [db]);

  // Valor del contexto
  const contextValue = {
    // Estados
    licenciaActiva,
    lalicencia,
    deviceId,
    isLoading,
    licenciaEstado,

    // Funciones
    setLicenciaActiva,
    setLalicencia,
    setDeviceId,
    verificarLicencia,
    generarLicenciaTemporal,
    eliminarLicencia,
    refrescarLicencia,
    importarLicencia,
    calcularDiasRestantes,
  };

  return (
    <LicenciaContext.Provider value={contextValue}>
      {children}
    </LicenciaContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useLicencia = () => {
  const context = useContext(LicenciaContext);
  if (!context) {
    throw new Error('useLicencia debe ser usado dentro de un LicenciaProvider');
  }
  return context;
};

export default LicenciaContext;