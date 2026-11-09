import { useState, useRef, useEffect,  useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, ScrollView, StyleSheet,
  Modal, Alert, TouchableOpacity, Pressable
} from 'react-native';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import { AppText as Text, AppTextInput as TextInput, AppButton as Button } from './AppText';

import { Picker  } from '@react-native-picker/picker';
import { useSQLiteContext } from 'expo-sqlite';
import { Link, useRouter  } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { commonStyles } from '../styles/commonStyles.js'
import ScreenHeader from './ScreenHeader';
import { useLicencia, LICENCIA_ESTADOS } from '../contexts/LicenciaContext.js';

import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import CryptoJS from 'crypto-js';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { Buffer } from 'buffer';
import { actualizarFiltro, contarObrasFiltradas, eliminarFiltro, establecerObraActiva, obtenerObrasFiltradas } from '../db/database';
global.Buffer = global.Buffer || Buffer;


const TABLA_ID = 'OB';
const LIMITE = 50;

export default function ObrasScreen() {

  const router = useRouter();
  const db = useSQLiteContext();
  const { lalicencia, licenciaEstado } = useLicencia();
  const [obras, setObras] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalFiltroVisible, setModalFiltroVisible] = useState(false);
  const [filtroObra, setFiltroObra] = useState('');
  const [filtroObraAplicado, setFiltroObraAplicado] = useState('');
  const [filtro, setFiltro] = useState('');
  const [cadenafiltro, setCadenafiltro] = useState([]);
  const [editarId, setEditarId] = useState(null);
  const [duplicarModalVisible, setDuplicarModalVisible] = useState(false);
  const [duplicarFormData, setDuplicarFormData] = useState({ codigo: '', obra: '' });
  const [obraADuplicar, setObraADuplicar] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [showLicenseAlert, setShowLicenseAlert] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hayMas, setHayMas] = useState(true);
  const [todos, setTodos] = useState(0);
  const [filtroVisible, setFiltroVisible] = useState(false);
  const filtroRef = useRef(null);
  const cargandoRef = useRef(false);

  const cargarInicial = useCallback(async (estaActiva = () => true) => {
    try {
      const primeros = await obtenerObrasFiltradas(db, TABLA_ID, LIMITE, 0);
      const total = await contarObrasFiltradas(db, TABLA_ID);
      const totalObras = await db.getFirstAsync('SELECT COUNT(*) AS total FROM obras');
      const elFiltro = await db.getFirstAsync(
        'SELECT * FROM filtros WHERE tabla_id = ? ORDER BY id DESC LIMIT 1',
        TABLA_ID
      );

      if (!estaActiva()) return;

      setTodos(total);
      setResumen({ totalObras: totalObras?.total ?? 0 });
      setObras(primeros);
      setOffset(primeros.length);
      setHayMas(primeros.length < total);
      setCadenafiltro(elFiltro?.filtro ?? '');
      setFiltroVisible(Boolean(elFiltro?.valor));
    } catch (error) {
      if (estaActiva()) {
        const detalle = error instanceof Error ? error.message : JSON.stringify(error);
        Alert.alert('Error', `No se pudieron cargar las obras. ${detalle || String(error)}`);
      }
    }
  }, [db]);

  const loadClientes = useCallback(async (estaActiva = () => true) => {
    try {
      const lista = await db.getAllAsync('SELECT * FROM clientes ORDER BY cliente');
      if (!estaActiva()) return;

      setClientes(lista);
      setFormData((actual) => (
        actual.cliente_id || lista.length === 0
          ? actual
          : { ...actual, cliente_id: String(lista[0].id) }
      ));
    } catch (error) {
      if (estaActiva()) {
        const detalle = error instanceof Error ? error.message : String(error);
        Alert.alert('Error', `No se pudieron cargar los clientes. ${detalle}`);
      }
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      let estaActiva = true;
      cargarInicial(() => estaActiva);
      loadClientes(() => estaActiva);
      return () => {
        estaActiva = false;
      };
    }, [cargarInicial, loadClientes])
  );

  useEffect(() => {
    setShowLicenseAlert(isPremiumDisabled() || lalicencia?.licenseKey === 'TRIAL');
  }, [lalicencia, licenciaEstado]);

  const cargarMas = async () => {
    if (cargandoRef.current || !hayMas) return;
    cargandoRef.current = true;
    try {
      const nuevos = await obtenerObrasFiltradas(db, TABLA_ID, LIMITE, offset);
      setObras(prev => [...prev, ...nuevos]);
      setOffset(prev => prev + nuevos.length);
      setHayMas(nuevos.length > 0 && offset + nuevos.length < todos);
    } catch (error) {
      const detalle = error instanceof Error ? error.message : JSON.stringify(error);
      Alert.alert('Error', `No se pudieron cargar más obras. ${detalle || String(error)}`);
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
      setModalFiltroVisible(false);
      await cargarInicial();
    } catch (error) {
      const detalle = error instanceof Error ? error.message : JSON.stringify(error);
      Alert.alert('Error', `No se pudo aplicar el filtro. ${detalle || String(error)}`);
    }

  }

  const activarObra = async (obra) => {
    try {
      await establecerObraActiva(db, obra.id);
      await cargarInicial();
    } catch (error) {
      const detalle = error instanceof Error ? error.message : JSON.stringify(error);
      Alert.alert('Error', `No se pudo activar la obra. ${detalle || String(error)}`);
    }
  };


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
        return 'Las opciones de duplicar obra e importar obra requieren una licencia válida. Adquiera una licencia para desbloquear estas funciones.';
      
      case LICENCIA_ESTADOS.TRIAL_VENCIDA:
        return 'Su licencia de prueba ha expirado. Las operaciones con obras (crear, editar, duplicar, importar y exportar a word) han sido deshabilitadas hasta que adquiera una licencia válida.';
      
      case LICENCIA_ESTADOS.ORIGINAL_VENCIDA:
        return 'Su licencia original ha expirado. Las operaciones con obras (crear, editar, duplicar, importar y exportar a word) han sido deshabilitadas hasta que renueve su licencia.';
      
      case LICENCIA_ESTADOS.ERROR:
        return 'Error en la verificación de licencia. Las opciones con obras de crear, editar, duplicar, importar y exportar a word están temporalmente deshabilitadas. Contacte al soporte técnico.';
      
      case LICENCIA_ESTADOS.TRIAL_ACTIVA:
        return 'Está utilizando una licencia de prueba. Las opciones de duplicar obra e importar obra no están disponibles durante este período, adquiera una licencia válida para habilitarlas.';
      
      case LICENCIA_ESTADOS.ORIGINAL_ACTIVA:
        return 'Licencia activa. Todas las funciones están disponibles.';
      
      default:
        return 'Las opciones de duplicar obra e importar obra han sido deshabilitadas hasta que adquiera una licencia válida.';
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
  

  const [resumen, setResumen] = useState({
    totalObras: 0,
    totalValor: 0,
  });

  const defaultForm = {
    codigo: '',
    cliente_id: '',
    obra: '',
    identidad: 'obra',
    cantidadfisica: '1',
    p100utilidades: '15',
    p100impuestos: '10',
    p100vacaciones: '9.09',
    p100contribuciones: '14',
    p100gastos: '1',
    p100impuestosft: '5',
    p100osde: '',
    contribucionespecial: '',
    argumentacion: '',
  };

  const [formData, setFormData] = useState(defaultForm);

  useEffect(() => {
    if (modalFiltroVisible) {
      filtroRef.current?.focus();
    }
  }, [modalFiltroVisible]);

  const resetForm = () => {
    setFormData({
      ...defaultForm,
      cliente_id: clientes.length > 0 ? String(clientes[0].id) : '',
    });
  };

  const abrirNuevoObra = () => {
    setEditarId(null);
    resetForm();
    setModalVisible(true);
  };

  const aplicarFiltroObras = () => {
    setFiltroObraAplicado(filtroObra.trim());
    setModalFiltroVisible(false);
  };

  const limpiarFiltroObras = () => {
    setFiltroObra('');
    setFiltroObraAplicado('');
    setModalFiltroVisible(false);
  };

  const cancelarFiltroObras = () => {
    setFiltroObra(filtroObraAplicado);
    setModalFiltroVisible(false);
  };

  const textoFiltroObra = filtroObraAplicado.toLocaleLowerCase();
  const obrasFiltradas = obras.filter(obra =>
    [obra.codigo, obra.obra, obra.cliente]
      .some(valor => String(valor ?? '').toLocaleLowerCase().includes(textoFiltroObra))
  );

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleChangeDuplicar = (key, value) => {
    setDuplicarFormData(prev => ({ ...prev, [key]: value }));
  };

  async function handleGuardarObra() {
    const codigo = formData.codigo.trim();
    const nombre = formData.obra.trim();
    const clienteId = Number(formData.cliente_id);
    if (!codigo || !nombre || !Number.isInteger(clienteId) || clienteId <= 0) {
      Alert.alert('Validación', 'Debe completar Código, Obra y Cliente');
      return;
    }

    const leerNumero = (valor, etiqueta, valorVacio = 0) => {
      if (String(valor ?? '').trim() === '') return valorVacio;
      const numero = Number(String(valor).replace(',', '.'));
      if (!Number.isFinite(numero)) {
        Alert.alert('Validación', `El campo "${etiqueta}" debe ser un número válido.`);
        return null;
      }
      return numero;
    };
    const cantidad = leerNumero(formData.cantidadfisica, 'Cantidad', 1);
    const utilidades = leerNumero(formData.p100utilidades, 'Porcentaje Utilidades');
    const impuestos = leerNumero(formData.p100impuestos, 'Porcentaje Impuestos');
    const vacaciones = leerNumero(formData.p100vacaciones, 'Porcentaje Vacaciones');
    const contribuciones = leerNumero(formData.p100contribuciones, 'Porcentaje Contribuciones');
    const gastos = leerNumero(formData.p100gastos, 'Porcentaje Gastos');
    const impuestosFt = leerNumero(formData.p100impuestosft, 'Porcentaje Impuestos FT');
    const osde = leerNumero(formData.p100osde, 'Porcentaje OSDE');
    const contribucionEspecial = leerNumero(formData.contribucionespecial, 'Contribución Especial');
    const valoresNumericos = [
      cantidad,
      utilidades,
      impuestos,
      vacaciones,
      contribuciones,
      gastos,
      impuestosFt,
      osde,
      contribucionEspecial,
    ];
    if (valoresNumericos.some((valor) => valor === null)) return;
    if (cantidad <= 0) {
      Alert.alert('Validación', 'La cantidad debe ser mayor que cero.');
      return;
    }

    try {
      const parametros = [
        codigo,
        nombre,
        clienteId,
        formData.identidad,
        cantidad,
        utilidades,
        impuestos,
        vacaciones,
        contribuciones,
        gastos,
        impuestosFt,
        osde,
        contribucionEspecial,
        formData.argumentacion.trim(),
      ];

      if (editarId != null) {
        await db.runAsync(
          `UPDATE obras SET
             codigo = ?, obra = ?, cliente_id = ?, identidad = ?, cantidadfisica = ?,
             p100utilidades = ?, p100impuestos = ?, p100vacaciones = ?, p100contribuciones = ?,
             p100gastos = ?, p100impuestosft = ?, p100osde = ?, contribucionespecial = ?,
             argumentacion = ?
           WHERE id = ?`,
          ...parametros,
          editarId
        );
        Alert.alert('Éxito', 'Obra actualizada correctamente.');
      } else {
        let obraId;
        await db.withTransactionAsync(async () => {
          const result = await db.runAsync(
            `INSERT INTO obras
              (codigo, obra, cliente_id, identidad, cantidadfisica, p100utilidades, p100impuestos,
               p100vacaciones, p100contribuciones, p100gastos, p100impuestosft, p100osde,
               contribucionespecial, argumentacion)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            ...parametros
          );
          obraId = result.lastInsertRowId;

          const partidas = await db.getAllAsync(
            'SELECT * FROM plantillapartidas WHERE activo = 1 ORDER BY item'
          );
          for (const partida of partidas) {
            await db.runAsync(
              'INSERT INTO obrapartidas (obra_id, plantilla_id, coeficiente) VALUES (?, ?, ?)',
              obraId,
              partida.id,
              partida.coeficiente
            );
          }

          const subpartidas = await db.getAllAsync(`
            SELECT plantillasubpartidas.*, plantillapartidas.coeficiente
            FROM plantillasubpartidas
            INNER JOIN plantillapartidas ON plantillapartidas.id = plantillasubpartidas.partida_id
            WHERE plantillasubpartidas.activo = 1
            ORDER BY plantillasubpartidas.fila
          `);
          for (const subpartida of subpartidas) {
            const importe = subpartida.id === 39 && contribucionEspecial > 0
              ? contribucionEspecial
              : null;
            const argumentacion = importe == null ? null : formData.argumentacion.trim();
            await db.runAsync(
              `INSERT INTO obrasubpartidas
                (obra_id, plantilla_id, coeficiente, importe, argumentacion)
               VALUES (?, ?, ?, ?, ?)`,
              obraId,
              subpartida.id,
              subpartida.coeficiente,
              importe,
              argumentacion
            );
          }
        });
        Alert.alert('Éxito', 'Obra y partidas agregadas correctamente.');
      }

      setModalVisible(false);
      setEditarId(null);
      resetForm();
      await cargarInicial();
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error);
      Alert.alert('Error', `No se pudo guardar la obra. ${detalle}`);
    }
  }

  function handleEditarObra(obra) {
    setFormData({
      ...defaultForm,
      codigo: obra.codigo ?? '',
      obra: obra.obra ?? '',
      cliente_id: obra.cliente_id == null ? '' : String(obra.cliente_id),
      identidad: obra.identidad ?? 'obra',
      cantidadfisica: String(obra.cantidadfisica ?? 1),
      p100utilidades: String(obra.p100utilidades ?? 15),
      p100impuestos: String(obra.p100impuestos ?? 10),
      p100vacaciones: String(obra.p100vacaciones ?? 9.09),
      p100contribuciones: String(obra.p100contribuciones ?? 14),
      p100gastos: String(obra.p100gastos ?? 1),
      p100impuestosft: String(obra.p100impuestosft ?? 5),
      p100osde: obra.p100osde == null ? '' : String(obra.p100osde),
      contribucionespecial: obra.contribucionespecial == null
        ? ''
        : String(obra.contribucionespecial),
      argumentacion: obra.argumentacion ?? '',
    });
    setEditarId(obra.id);
    setModalVisible(true);
  }

  const cancelarFormulario = () => {
    setModalVisible(false);
    setEditarId(null);
    resetForm();
  };

  function handleEliminarObra(id) {
    const obra = obras.find((item) => item.id === id);
    Alert.alert(
      'Confirmar eliminación',
      `¿Desea eliminar "${obra?.obra ?? 'esta obra'}" y todos sus datos asociados?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await db.withTransactionAsync(async () => {
                await db.runAsync(
                  `UPDATE cronogramas
                   SET dependencia_id = NULL
                   WHERE dependencia_id IN (
                     SELECT cronogramas.id
                     FROM cronogramas
                     INNER JOIN obrarhumanos
                       ON obrarhumanos.id = cronogramas.obrarhumano_id
                     WHERE obrarhumanos.obra_id = ?
                   )`,
                  id
                );
                await db.runAsync(
                  `DELETE FROM cronogramas
                   WHERE obrarhumano_id IN (
                     SELECT id FROM obrarhumanos WHERE obra_id = ?
                   )`,
                  id
                );
                for (const tabla of [
                  'listadodecantidades',
                  'tempobrainsumos',
                  'obrainsumos',
                  'obraequipos',
                  'obrarhumanos',
                  'obrasubpartidas',
                  'obrapartidas',
                ]) {
                  await db.runAsync(`DELETE FROM ${tabla} WHERE obra_id = ?`, id);
                }
                await db.runAsync(
                  'UPDATE generales SET obra_activa = NULL WHERE obra_activa = ?',
                  id
                );
                await db.runAsync('DELETE FROM obras WHERE id = ?', id);
              });

              if (editarId === id) {
                cancelarFormulario();
              }
              await cargarInicial();
              Alert.alert('Obra eliminada', 'La obra y sus datos asociados se eliminaron correctamente.');
            } catch (error) {
              const detalle = error instanceof Error ? error.message : String(error);
              Alert.alert('Error', `No se pudo eliminar la obra. ${detalle}`);
            }
          }
        }
      ]
    );
  }

  async function handleSaveObra(obra) {
    try {
     const { fileName, data } = await getObraDataExport(obra.id);

     const encryptedData = encryptData(data);


    // Intenta cada paso por separado
    const cacheDir = FileSystem.cacheDirectory;
    if (!cacheDir) {
      throw new Error('❌ cacheDirectory es undefined');
    }
    if (!fileName) {
      throw new Error('❌ fileName es undefined o vacío');
    }

    // Construcción paso a paso
    const uri = cacheDir + fileName; // Versión simple sin template literal


    // Ahora funciona sin error
    await FileSystem.writeAsStringAsync(uri, encryptedData, {
      encoding: FileSystem.EncodingType.UTF8
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/json',
        dialogTitle: 'Compartir obra',
        UTI: 'public.json'
      });
    } else {
      Alert.alert('Archivo Generado', `Ruta: ${uri}`);
    }
    } catch (error) {
      console.error('DEBUG: handleSaveObra - Error:', error.message);
      Alert.alert('Error', 'No se pudo guardar la obra.');
    }
  }

  // Función para encriptar datos (inversa de decryptData)
  const encryptData = (plainText) => {
    const FIXED_KEY = '5f0673dbf7480734aaa6eab6d78da9a7c339e829e7cdc7099255f9653374f0ce';
    const FIXED_IV  = 'dd3d1e591e3504c62ac9695a69bf4169';

    const encrypted = CryptoJS.AES.encrypt(
      plainText,
      CryptoJS.enc.Hex.parse(FIXED_KEY),
      { iv: CryptoJS.enc.Hex.parse(FIXED_IV),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7 }
    );

    return encrypted.toString();
  };
  
  const handleExportarObraWORD = async (obra) => {
    try {
      const obra_id = obra.id;
      // Obtener los datos de la Obra
      const obraData = await db.getFirstAsync(`
        SELECT obras.*, clientes.cliente, clientes.reeup, clientes.organismo, elaboradopor.nombre as nombreelaborado, elaboradopor.cargo as cargoelaborado, aprobadopor.nombre as nombreaprobado, aprobadopor.cargo as cargoaprobado
        FROM obras
        LEFT JOIN firmas as elaboradopor ON elaboradopor.id = obras.elaboradopor_id
        LEFT JOIN firmas as aprobadopor ON aprobadopor.id = obras.aprobadopor_id
        LEFT JOIN clientes ON clientes.id = obras.cliente_id
        WHERE obras.id = ?
      `, [obra_id]);

      const partidas = await db.getAllAsync('SELECT obrapartidas.*, plantillapartidas.concepto, plantillapartidas.fila, plantillapartidas.desglosarpartida, plantillapartidas.descripcion FROM obrapartidas INNER JOIN plantillapartidas ON plantillapartidas.id = obrapartidas.plantilla_id  WHERE obrapartidas.obra_id = ? ORDER BY obrapartidas.plantilla_id ASC', [obra_id]);
      const generales = await db.getFirstAsync('SELECT * FROM generales');
      const lasActividades = await db.getAllAsync(`
        SELECT
            actividad_id,
            actividades.actividad,
            COUNT(*) as cantidad,
            SUM(obrarhumanos.salariodevengado) as subtotal
        FROM obrarhumanos
        INNER JOIN actividades ON actividades.id = obrarhumanos.actividad_id
        WHERE obrarhumanos.obra_id = ?
        GROUP BY actividad_id
        ORDER BY obrarhumanos.item
      `, [obra_id]);

      const losRecursos = await db.getAllAsync(`
        SELECT
            insumogrupo_id,
            insumogrupos.insumogrupo,
            COUNT(*) as cantidad,
            SUM(obrainsumos.costo) as subtotal
        FROM obrainsumos
        INNER JOIN insumos ON insumos.id = obrainsumos.insumo_id
        INNER JOIN insumotipos ON insumotipos.id = insumos.insumotipo_id
        INNER JOIN insumogrupos ON insumogrupos.id = insumotipos.insumogrupo_id
        WHERE obrainsumos.obra_id = ?
        GROUP BY insumogrupo_id
        ORDER BY insumogrupos.id
      `, [obra_id]);

      const losEquipos = await db.getAllAsync(`
        SELECT
            equipos.equipotipo_id,
            equipotipos.equipotipo,
            COUNT(*) as cantidad,
            SUM(obraequipos.costo) as subtotal
        FROM obraequipos
        INNER JOIN equipos ON equipos.id = obraequipos.equipo_id
        INNER JOIN equipotipos ON equipotipos.id = equipos.equipotipo_id
        WHERE obraequipos.obra_id = ?
        GROUP BY equipos.equipotipo_id
        ORDER BY obraequipos.item
      `, [obra_id]);

      const lasPartidas = await db.getAllAsync(`
        SELECT
            plantillasubpartidas.partida_id,
            plantillapartidas.concepto,
            COUNT(*) as cantidad,
            SUM(obrasubpartidas.importe) as subtotal
        FROM obrasubpartidas
        INNER JOIN plantillasubpartidas ON plantillasubpartidas.id = obrasubpartidas.plantilla_id
        INNER JOIN plantillapartidas ON plantillapartidas.id = plantillasubpartidas.partida_id
        WHERE obrasubpartidas.obra_id = ? AND obrasubpartidas.importe > 0 AND obrasubpartidas.importe <> ''
        GROUP BY plantillasubpartidas.partida_id
        ORDER BY obrasubpartidas.plantilla_id
      `, [obra_id]);

      const obraEquipos = await db.getAllAsync(`
        SELECT obraequipos.*, equipos.*, umedidas.umdescripcion
        FROM obraequipos
        INNER JOIN equipos ON equipos.id = obraequipos.equipo_id
        INNER JOIN umedidas ON umedidas.id = obraequipos.umedida_id
        WHERE obraequipos.obra_id = ?
        ORDER BY item
      `, [obra_id]);

      const obraRecursos = await db.getAllAsync(`
        SELECT tempobrainsumos.*, insumos.*, insumotipos.insumogrupo_id
                FROM tempobrainsumos
                INNER JOIN insumos ON insumos.id = tempobrainsumos.insumo_id
                INNER JOIN insumotipos ON insumotipos.id = insumos.insumotipo_id
                INNER JOIN insumogrupos ON insumogrupos.id = insumotipos.insumogrupo_id
                WHERE tempobrainsumos.obra_id = ?
                ORDER BY tempobrainsumos.item
      `, [obra_id]);

      const obrasubPartidas = await db.getAllAsync(`
        SELECT obrasubpartidas.*, plantillasubpartidas.*
        FROM obrasubpartidas
        INNER JOIN plantillasubpartidas ON plantillasubpartidas.id = obrasubpartidas.plantilla_id
        WHERE obrasubpartidas.obra_id = ?  AND obrasubpartidas.importe > 0 AND obrasubpartidas.importe <> ''
        ORDER BY plantillasubpartidas.fila
      `, [obra_id]);

      const obrarhumanos = await db.getAllAsync(`
        SELECT
            obrarhumanos.*,
            cargos.cargo, cargos.grupoescala, cargos.salarioescala, cargos.tarifahoraria, cargos.catocupacional_id
        FROM obrarhumanos
        INNER JOIN cargos ON cargos.id = obrarhumanos.cargo_id
        WHERE obrarhumanos.obra_id = ?
      `, [obra_id]);

      const fCodigo = obraData.codigo || '';
      const fObra = obraData.obra || '';
      const cliente = obraData.cliente || '';
      const organismo = obraData.organismo || '';
      const identidad = obra.identidad != null ? obra.identidad : 'Obra';

      const data = {
        // PAGINA # 1
        obra1: fObra,
        obra2: fObra,
        obra3: fObra,
        obra4: fObra,
        obra5: fObra,

        identidad1: identidad,
        identidad2: identidad,
        identidad3: identidad,
        identidad4: identidad,
        identidad5: identidad,

        codigo1: fCodigo,
        elaboradopor: obraData.nombreelaborado || '',
        cargoelaboradopor: obraData.cargoelaborado || '',
        aprobadopor: obraData.nombreaprobado || '',
        cargoaprobadopor: obraData.cargoaprobado || '',
        fecha1: new Date().toLocaleDateString('es-ES'),
        fecha2: new Date().toLocaleDateString('es-ES'),
        utilidad: obraData.p100utilidades ? obraData.p100utilidades.toFixed(2) : '0.00',
        f14: obraData.precio ? obraData.precio.toFixed(2) : '0.00',
        'f4.1': ' ',
        'f6.1': ' ',
        'f7.1': ' ',
        ref1: 'n/d',
        empresa1: cliente,
        organismo1: organismo,
        cantidadfisica: obraData.cantidadfisica ? obraData.cantidadfisica.toFixed(2) : '1',
        preciofinal: obraData.precio 
        ? Math.ceil(obraData.precio * obraData.cantidadfisica).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(',', '.') 
        : '0.00',

        preciofinal: obra.precio 
        ? ( identidad.toUpperCase() === 'OBRA' 
            ? Math.ceil(obra.precio * obra.cantidadfisica)
                .toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                .replace(',', '.')
            : Math.ceil(obra.precio / obra.cantidadfisica)
                .toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                .replace(',', '.')
        ) 
        : '0.00',      
      };

     
      // PARTIDAS
      partidas.forEach((partida) => {
        const importe = partida.importe != null ? partida.importe.toFixed(2) : '';
        data[`f${partida.fila}`] = importe;
        if (partida.fila == 2) {
          data.costototalsalario2 = importe;
        }
      });

      // PAGINA # 2
      data.codigo2 = fCodigo;
      data.ref2 = 'n/d';
      data.empresa2 = cliente;
      data.organismo2 = organismo;
      let gastototal = 0;
      const actividadesConObras = lasActividades.reduce((acc, actividad) => {
        const obras = obrarhumanos
          .filter(f => String(f.actividad_id) === String(actividad.actividad_id))
          .map(f => ({            
            cant2: f.cantidad,
            cargo2: f.cargo,
            descripcion2: f.descripcion,
            co2: f.catocupacional_id,
            ge2: f.grupoescala,
            th2: f.tarifahoraria.toFixed(2),
            tc2: '0.00',
            nh2: f.tiempo.toFixed(2),
            gs2: f.salariodevengado.toFixed(2)
          }));
        gastototal += actividad.subtotal;
        return [...acc, {
          actividad2: actividad.actividad,
          st2: actividad.subtotal.toFixed(2),
          filas: obras
        }];
      }, []);
      data.actividades = actividadesConObras;
      data.gastototal2 = gastototal.toFixed(2);

      // PAGINA # 3
      data.codigo3 = fCodigo;
      data.ref3 = 'n/d';
      data.empresa3 = cliente;
      data.organismo3 = organismo;
      gastototal = 0;
      const recursosConObras = losRecursos.reduce((acc, insumoGrupo) => {
        const obras = obraRecursos
          .filter(f => String(f.insumogrupo_id) === String(insumoGrupo.insumogrupo_id) )
          .map(f => ({
            cod3: f.codigo || '',
            producto3: f.insumo,
            descripcion3: f.descripcion,
            um3: f.um,
            cb3: '',
            nc3: f.cantidad.toFixed(2),
            pu3: f.precio.toFixed(2),
            cp3: f.costo.toFixed(2),
          }));
        gastototal += insumoGrupo.subtotal;
        return [...acc, {
          grupoinsumo3: insumoGrupo.insumogrupo,
          st3: insumoGrupo.subtotal.toFixed(2),
          filas3: obras
        }];
      }, []);
      data.insumos = recursosConObras;
      data.gastototal3 = gastototal.toFixed(2);

      // PÁGINA # 4
      data.codigo4 = fCodigo;
      data.ref4 = 'n/d';
      data.empresa4 = cliente;
      data.organismo4 = organismo;
      gastototal = 0;
      const equiposConObras = losEquipos.reduce((acc, tipoEquipo) => {
        const obras = obraEquipos
          .filter(f => String(f.equipotipo_id) === String(tipoEquipo.equipotipo_id) )
          .map(f => ({
            cod4: f.codigo || '',
            equipo4: f.equipo,
            descripcion4: f.descripcion,
            cant4: f.cantidad.toFixed(2),
            explot4: f.cantidadhe.toFixed(2),
            depreciacion4: f.depreciacion ? f.depreciacion.toFixed(2) : '',
            mantenimiento4: f.mantenimiento ? f.mantenimiento.toFixed(2) : '',
            costo4: f.costo.toFixed(2),
          }));
        gastototal += tipoEquipo.subtotal;
        return [...acc, {
          equipotipo4: tipoEquipo.equipotipo,
          st4: tipoEquipo.subtotal.toFixed(2),
          filas4: obras
        }];
      }, []);
      data.equipos = equiposConObras;
      data.gastototal4 = gastototal.toFixed(2);

    
      // PÁGINA 5
      data.codigo5 = fCodigo;
      data.ref5 = 'n/d';
      data.empresa5 = cliente;
      data.organismo5 = organismo;
      gastototal = 0;
      const partidasConObras = lasPartidas.reduce((acc, partida) => {
        const obras = obrasubPartidas
          .filter(f => String(f.partida_id) === String(partida.partida_id) )
          .map(f => ({
            
            concepto5: f.concepto,
            imp5: f.importe ? '$ ' + f.importe.toFixed(2) : '',
            salario5: f.salarios ? '$ ' + f.salarios.toFixed(2) : '',
            argumentacion5: f.descripcion || '',
          }));
          
        gastototal += partida.subtotal;
        return [...acc, {
          partida5: partida.concepto,
          st5: partida.subtotal.toFixed(2),
          filas5: obras
        }];
      }, []);
      data.partidas = partidasConObras;
      data.gastototal5 = gastototal.toFixed(2);


     
      // Usar la plantilla obra.docx embebida como base64     
      const PLANTILLA_DOCX_BASE64 = `UEsDBBQABgAIAAAAIQCXAiNnuAEAANwKAAATAAgCW0NvbnRlbnRfVHlwZXNdLnhtbCCiBAIooAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADElstOwzAQRfdI/EPkLWpcnkKoKQseS6gEfIBrT1qL+CF7+vp7Jk0bIdQ2QBt1Eyn23HvPxEk0vfu5KZIphKidzdh52mUJWOmUtqOMfbw/d25ZElFYJQpnIWMLiOy+f3rSe194iAmpbczYGNHfcR7lGIyIqfNgaSd3wQik2zDiXshPMQJ+0e3ecOksgsUOlh6s33uEXEwKTJ7mtFyReDtiyUNVV0ZlTJtSX67zjYoARfwhEd4XWgqkfT616gdXZ8WUknJZE8faxzMq2JJQ7mwPWOle6WEGrSAZiIAvwlAVn7mguHJyYkiZ7rbZwOnyXEuo9aWbD05CjHRKpkjrHSO0XfNv5bATM4RAysOD1NaNEBEXBcTDE1S+zfGASII2AFbOjQgzGL61RvHNvBEkdw6twzZOo7ZuhACrWmJYOzcijEEoCOeHJ6iMf3UOreRXxr/s/+LI/beQ/6f+L4/Wf1V2deT86yOeP+WJYQFtvAEr60YIpAEGquv+X+LSZlckVQ6C85EGovCPttfzS6nuUMMeAurdf7o6kaz37g/K0UiB+mu2nER0Zu/4ymZDOF/Opv0vAAAA//8DAFBLAwQUAAYACAAAACEAmVV+Bf4AAADhAgAACwAIAl9yZWxzLy5yZWxzIKIEAiigAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKySTUsDMRCG74L/Icy9O9sqItLdXkToTWT9AUMy+4GbD5Kptv/eKIou1LWHHjN558kzQ9abvR3VK8c0eFfBsihBsdPeDK6r4Ll5WNyCSkLO0OgdV3DgBJv68mL9xCNJbkr9EJLKFJcq6EXCHWLSPVtKhQ/s8k3royXJx9hhIP1CHeOqLG8w/mZAPWGqrakgbs0VqOYQ+BS2b9tB873XO8tOjjyBvBd2hs0ixNwfZcjTqIZix1KB8foxlxNSCEVGAx43Wp1u9Pe0aFnIkBBqH3ne5yMxJ7Q854qmiR+bNx8Nmq/ynM31OW30Lom3/6znM/OthJOPWb8DAAD//wMAUEsDBBQABgAIAAAAIQAee5HUD0AAAGNJAwARAAAAd29yZC9kb2N1bWVudC54bWzsfduO40aW4PsC+w+Jml7AC68rGXeyMK4Br3YB7Xahyt2LfWRKzEyNlaJASS67C/NJ89Sf4B/buFEiKUoiKVKklCwbKSlIBk+cOPc4ceLf/+P3l/ndb1GymsWL79+At8abu2gxiaezxdP3b/7+S/Cd+eZutQ4X03AeL6Lv3/wRrd78x/v/+T/+/cu7aTzZvESL9R3vYrF692U5+f7N83q9fHd/v5o8Ry/h6u3LbJLEq/hx/XYSv9zHj4+zSXT/JU6m99AAhvy2TOJJtFrx97nh4rdw9UZ3N/m9Wm/TJPzCHxYd4vvJc5iso993fYDanZB7697c7wg26IiPEIL9rlDtrui9gGqvI9yoIw7VXk+kWU8lg6PNeoL7PbFmPaH9nsxmPe2R08s+gcfLaMEvPsbJS7jmP5On+5cw+XWz/I53vAzXs4fZfLb+g/dp0LSbcLb4tQFE/KltDy9oWrsHdv8ST6M5mqa9xN+/2SSLd/r577bPC9Dfqef1x/aJaF7ttfx11n30+3q+WqfPJlVwpx73tGCRWLtPojnHY7xYPc+WW+nw0rQ3fvE57eS3Ywj47WWe3vdlCSqy2iHR5qlp2HVYBXw9dy9zBfnxHoFRYTZFF9snqoCQf2cKyQun4N2LG6Emg1xQUfikHcC9Dugkqqgs0j5M3cf9ZMfdop9ZRbZK+1GzIvqZ7RALKsrAIjCZDqabWl1AlMIhPsTjmb5W0/X0uV536Rzdi2fDdfgcrrZMo3p8rCgI0h5xpkdFYPN4spVnos+oHtLItsM/XjJzuHw6j1F/SOLNctfb7LzePuxE9hdhPNXoSzN8VgitzgPm83O45JL8ZfLuw9MiTsKHOYeIs+8d58A7OQPiLydk8SG/Rr/LdkE/+svjXHyZbu6ESHzznhuBD/H0D/G5fpjrj4+J/vJ5/cec9/nut5ATyy/8feEkXkw24TSZbObhm3t92//lt3BhBAyGufHJm/5YcsCmv+/ucPg4uIUqf8XLtMcFt0fF/at/fv9GPrhahpNIf5/E85hrnHCzjlU38+hx3ezJh3i9jl+aPZvMnp4bvna2WM2m0Y/nPPyPJg/f76H8Yf7XOP417cvAtnzscZas1p9iMXPi5zzUv3YX3Xi+eRFORXo9bZC3LOIfHe5WbH/9Q/0COxi2hPRDMpuKr0/8k/dxJ+mFEstQg801Q4ZgSTPAwNz1nHa4TvhV7vpMP3EwDEIQQ5aARjZ9TESj42AvcHkjwO+WYRJ+4DCK26Br61ZuIK5FK9P/0g5+kc/rTtXb9IiSH6MsXSDAUtDSOybqb/pLs4gc8l2BQ8Rj+sZlHkrDsqCFnQKUFmQMEHs7zNMjV41e9Bhu5mtxxUSUEtGvvPJRNMEAWR6Rw1xqYPLsz18fzxbTiNsY0xm3xiLN3eGDIrLwIb1VcKroexlzgQcAIXR7a/kt0DSsFBO6O0HfXOTxWx4irm44tlJi4TAIuAX++aNUEgX/rWBOgnixXvHr4Woy47LfTmbh/O5vYZLEX8T7nm3OV4VmJSO23KEBkR3eb5Gh/nTyEj7o9185sy/Ws2k4Bf8l0aAuy7dVneduIXw3HLCy1CFbv5MEloFWaNxURC6TaBUlv0Vv3t9VGML50OamVbx5NpnFhVkVdKUZX8kH9bcgLaQkvKsqLZjvgcACNC8tUOC6FvJEa2Npkb99lBYVpMXlGbSc5N0//zWdPcXv9ki/ZToX8canZlQuFXtlKicm9mxf0nNWJwIGLMdDI5XfkE78dEhc981U0ePbzhkqiR6PcZP4ULdusVLLAAY+w7ZlFtmoqQGMjVQDt2oAc0MXmYEtTN0MlAZzXQQzTHxw5IXGkdlrmFib9LeIPMzlWAeh5977L4ITwz17tAdB0LUQiNRQG6lVDLA0+grBGOFTf16Gi3Sg0tU+yICAEQciO8gzIKTEwI7lnWbAUdtetU35/ufkKVzMVi/xa+C2OB1sBcUrPlS8tOCEuZYJ/UAYokf0qmQYahmB4Zfxhr5SmxF2FDufiWA1lKpWfP+0EaHi6Pdwss6SsOABEbcl3aiQ1T/TBpiKmRxNK8TuoZBgH1IgZMMpFJbKHBZQQnfRsX2Zc0t4rY5WAoHJqCsIriZlnkLr+eSaClgZRT0fXzv8pGHZCvgxAgvaEIhQd+f46WiA/EI0WX/cKoqKsH7mD0n2QNilUML5HIXTKPkUPUZJtJiImdRmhBrVm7vknVhoTT5M9ZQ9xvG62gNaW4rL6SAmHA2zxSberNS15dNnMUARG4BQLSk98+/c9dcMsHz6KRSjXMdLcQ9T0S2lj7HiTrXmwznEVMyqOVL3JocnLmLxUwHPkakefdqs5U/9skk8F3Ok1ZG4R6Fc4XqfrErW0bRJlvF8dgs9/PIHKTT4DWR3w+nVM22XC9D+yYctv1RdP6v7bH4Fre7TuTW0ug8XVtGaPb5dR6v3uNLyhZW08I94I0aj5ulx9ns03c6UG83nnDQz6M5P+3ZWU5SUXlavzfRVXMAD/tEFPPnr+AKebDiwgJcS+MkFPGJhNZpcK0JM671cM0ZEWtjF1T5kyE7U+8qX9QqitSDDsvECgg3XM4S0PhnVoAQ4lpJ2B6MaGKWgpXeU+1oCEftzvHoWbK0k3DwKkyKByUma86sBFP/JHp6jlyiQjQ/h5NenJN4spnKutlc+P3PZJZ5JQSt13AxGDWh6VbT9cezuabP8Fem46SYJRakBIDIVPnLInpJw+Zzy5c5QghJ7qT+F9ervf07S5+WVdkyDh4L+hCnxHXe2MiNsA4Ks2/G3+O1hb+MgxTGGykiu1LvvmRIDw2VigbwrSmxMdgBo9NweUbk5ksq8WbzXIjDgMrKL98bc9luu4wYELfXAPkH3SbnUsVmA3BNJIpelXC0kmbZNX4mMdOPVMaKSClremaPz465PLhsoYNhwTgRtlNnAKcJ2OjQbDlIj92sosgzhIrTsnwYMOMovukaN3iedHnq3IFTQsVY/rHCRSzFlHQR6NKE0porWFO5Q5/yHsCinOoWkkASVGnuHAayZFnVR3P0UriPxQFu2w2G1bpqOAYtqHfoM+Z4hM1Ga8odFkI9BE/64hFofKtN8bZLoUFm3s8B0KPGEehuuboeIWZ7vCuIbdfs16Pa3vWl3QLhyt+0GC4xdaPf9JRxT8keeYjDWy++3Sg9e1JvS1xHYK1X60Xy+n1pwMdxpUr1S3H1YrDYv8WrEXiPsfaPtzf7w17q5Lk1QBwYXwN7HQcxhMnvpcf6uW/L+MdJ9Eyd1EHOnPeVo9b9z4Nx34Cxjkzi25RRj4BRbwHa2Gwh7cZapXk5+bc7yMTZwfYiB1zkUb4/BgDGzVV5ND47ZIPizw3AG9F3XtMGJ4G7f4Qzgep5pidW4MZxxBUIFvIUNFEkr4QxmBDbEqIOsy+7CGRbTmudW6cGNXx42q/WMI6g/81rniY7mdU28sbbxdkHz+q+DmLvNQzKbhIt1gfirScWa5jXDDnbdgqbEPiIo8MSuqx7Na82Ao3k9mtcpYHkzoa9J6tC8NiwvwIZZ2O84MPOaMc8hVtBdgoe+MprXbZnXqIEiacW8RgSY2Peq7KUbzetL0YO/iJKnP/87bEAU9awLYQU4EBacKwDF3m1Z+qFH62IM3uXgGK2L9fu8lOxrkjq0LgiCroMGnmdMsOMS1GGCib4yWhdtWRe4gSJpxbogzAcms8bg3ZDowX7aXMCygMC2sVPIqoQW8iAsVGG7uGWhA2CjZTFaFilgeQnZ1yR1GbfwvcBiaNhZzgwH1LWCMcv5SoRKb4uCyLYD6MMqGy/HHUztzvnncB4ms/72MOlE8Std9fNmSTTpcQeYrrtxpdgb8dYMb5+idTJ72Exmf/5rMaLwDMbt3m+inulAGxVMIGh7ALhy+9e5fpO+Ik0gbXFLKOopu3Q7ojzK49W5Uocosm8v5uZXX5GBLBcXsyEG5sUg6DCPyIMZRi/mCvi5t7VXAphtG01KwY5ezJlz/vM66XFjnATnak0hWcNiRN5ZDmD3iYPUZB6jZiFEghC2uCBpI3FQX2nHkHylq/2HSLJvQ/LmF9qpYwUB2zskaGCGJEK+EZhjOPxK+Lm3ZXbq+9SB4MTizmhIjsbQsIwhexVPZuF0LFHREH/5cORId1XxNu8PcddNcB+TeLqZ7K8jVNN19RwYiLANQCDUV9aBobbrMRkfH5YDw1Tj6MAMwoG5+XwehKmPHIneAefzwAA5xNCgjw7M4B2Y/qoWGjYjyPa683Vr0UW1TGF065nCPVYtvG47SVQt/D+3gztpNF1mg//nQcyfynG7wO5+nwTQK4YhaeBjZLP88cVjlvxo0B4CrO/s/Ytiotta4OIoIufEfqWerWoD+b5hsROmf49WdTXr6YL29kPvQuc4BIKcSQNl004Wiud7xK50/NZgLO8bO5jrOGX88vMv9uXqHml4ri7eexqPnt8zEofv05xGovvz519+vpyRfrvU+E0Avg3gtwH6NsDdV+llxKYABIUyLwaDtsOoPBTvTEdDX2kcTD8l9y+RcH4NyqBfD+U0fHkzpl9cdegoYGIQw/aHHX4HjhOggIoi3GP4vYJ3eQkOP0avtIEaaOfIIBgYDvO9zgilMVWM+UMtg3JTm/J+iBZRIo456A1/w7dEj+GvvxrE10130/E0r2aIs6cvs8VstU7Cy+QQIea6rmEV1lcM17V8ZglnqG+3Z1xyGe6SS94c6ws/XW6C8G0jsNmJnIuenRjqscCGHSaGZFl4dGLO55r+cogIthik9KpOPh1ziLqzlcYcogHhThpNYw5RBzlExDbNwC2E9jH0bd+kOxHX3MaVr6ynDUeD9qoMWgHDmEOk2VJ8qNty+KmRme9jz4TC3hiuVY0Mh9gB7W7HqL4yWtXtECxroEZasakxAcTj/3dGKI2pYlwa6NYCvO5IY48h2ut2OzwRnu29WOR147C/dZXrxts/osUFSmwyYHi2j4Wmyqg0hCBCVKZ+n+sw6Sstldg0VOPoQw3Ch8obYn3hp8stEKZveNgZtvuCbUwgdU6Ubxrdl6HwM+txUcDybZ+C7kilFl2MiwKSHsZFgXFRIOW6cVGgAxsXItNyA1yoQU2CwKGWszOdmtu48pX1tOG4KHBVBq2AYVwU0GwpPtRtOfxUtqohhsw/ecxy36k2GHsUgzHV5kqEitlAjbRTrMc0iAeMcVHg8nPe86KA1t1Xaj0Hs0W4mMyiYu3/aqxTs/46RMDaK9CGApeZhtw3dq4Fpq9IYeoDYmPWhG1Go+yQ7aNx2gtkecneF346tIcAII4DBl5/HToG/1+eujXaQ1fAz1YDod6KPQQBxo4Nutto25gqRnuoW3tIwnO19tAyTnrD3HXHYbUlGb7MokWPx7leN/lx1CXRUzjtD39j+f/XiLcey/9fN8P+/LlQQ+u+C8cZ25hCXDCmKLJN6ttib1ffjvP+Gm53KTop9gWi+zSzhusq543+vvDT6Zm3zISE6Nah1iQlLoTWuJ+gKs30zc/AaCDH21k7wI4VmIY4gXL0lS876ePawRnI+0Ukxa/Di2RvUI/6BpKkn+ERHNgWdrytLDzDBGrAI687HTmfvpiBo2/zJy/H+0JQl0VKmAMDj52wLPo2f1zk2SdPY+rR/KmWd3pBw+ihd4Y/DoEgZ9Bb0jLCvmVhdyBGUjXiGWuydw3P1cWSTuNxrMneAhJ/sMea7K0g8puAfhuwbwPz28D6NgDGBeqyB4FvW6RgOEDX9blJWeGQU4QNh+0KGZ5p6Z8S9AMuwq4RcRk6aeIPXBTAg+D1AEuXexV9l3rALfjJA/MNiOkAxzh1ptToG1yZbwAb6IZ2fAPkYexYha09o28wGNIYfYPRNxgMEsfzmlpC5P8bifFsHI6OakuI/CYg3D8FF/BPIUW+SrvJGBsGojYOCDltbJgWNuHuIOPX659qRFyGPJr4pxcFMG8894usLnf9Wg52XHRiX4DyTz0fk4DKMXfin4rLTpxMo2Ql8RKv1/FL2vOKc9U8Es+s/snfI78o+Sfdy0k8jzmQ4WYdb6XFtq+DsgO61HGDYMwJKpBkn97LUZcWNVAndVzay5MgCgD2qV3YwYVcx7aBcVYuaQkJWgQGRqNNmK8k/+jv69l8Ng2nx3RTBolng1Iw/DR22zP8BLw2JlibMZeH9/03g0Xl+68bPdt5/VqAkdqI4pYKjNSH8X/dTaO7oBDKG9QEt2bhX172gsAHJvYLecvQYBBgr40jh+Ur6wnaMYmtnlNwIdDyhkdfCOpyu7trQN+QB2234whID1dClTJ/qSgYhiPAKYsEptx5M66AteC1XkKSHIdA8AnADXTTsN0F4CBgG66Ia41La0OkuY+ffPfDzxfTFhqggtk2/LNrTyOybxzeQhD+F/vTh8BuIAQHYqATKwDUgIWahARZxKxkoI+x/TwiLkN1g4/t582CfpFV36T3GcWsiklvIBR4RnAiRb99kx5ZVOZ7NrCg1vEyvVxPoChbI312MZtr/Odk1LZZMmShtaJIotg1A4QK8Vrg2J7nsfxyY+lEHRZJ+dvV3n/VJKFoWUoBpBXckMRUZrxnQ+CuTvKeGy7WIv73rigPukfBl4Pmw9eJhupxtppNwv/K2xPV1DdVRwzfJgcyTF3T8QsukOFz8vFZPiF92Byo5Omr5sCPSTSZHSyuVFBMFwCowfKKSalNld98CYz9fTGTW7yPmzAXnsZBCdCjk4UoJU47eGkG3l/24LsIMO+/LiWrPc4W4fy0zSk+HubiycJqNaHUB7CDhAl9u3xlqaDl74q5/IyW0WIqStpFRWE7ny04piVs8vunzZz/jn4PJ1qk5mJSho6RnI35FEC9YJOZgzKBq5BdRCum3HbEoMHm7FYxmKor2g5qdqgwq6PC8CwXu8Wj74ZBYSl+WNv4KdXNKX40I/IPzcsPc23mSVJXNt7OCuOXP0hCF4sruxt2MZyHefvmXt1nz4kdfckbj3UfnvHZmEY/nvf4P5o9rsRqFv0P87+Gf8QbMRo1T4+z36PpdqbcaD7/KZTTrtGdn/btrKYoKb2sXpvpS7w2jn9NB2EAXz70OEtW608x70OWoJuH2V/yohvPNy+LzPVcwyL+0QkXgonVr3+kv7YwbCn4B+6KiK/CJeF9KMhl4EAOp0ozAEjL8HwzIfJu9cL0PQ1XRTlmEAK28BZOhlCqbN+jUrRKJavvqBFCkSpaS668+jAgC8ygscx0DWa426qDuUUhh4l9XPKVpTKzkvuDtW7MKmAmdcL5QlRyWAoO9cR/RekKUqQfd300FnoBSphj/jx8iJMjtWblhOSWky8J+aklpr0BNVoe6XsSlnGSd2bKrRRimiaHtWAHQxsQFJi7ze5yxjzmGeIUgWpWSv52GYPQTQNmwgxGS63evWnuJl8mVTQ7p6dIbF2/MEp5+KJ1y48AdMTVa0n5MIo51cPGm327Vj5I03iO7luy4G9H+bhh8nRc8ZSJsb6hriKqMQIBMlHhHBeIHctCNB8uHoqo7pJkH0aBnX3hRND9TUht6Q7dVZXaIHBcbBmDldpl1goAurFFc+U6pHMQTZ7zJwKUyzpAsGUFQSGOiAwUuD4Ue/yqusB7s9pOvgzWa87ZWSW6rSt+6l2kHa1LDwBDstJ0D5DtEVVfKDp2rO1heSfiPHdV5R3Gpg34aJrKuyNWQHfyztBhrxblXTVt37u8myUvZfJO04T4UHfmeKl6wV7ElaWNTsTLqkf1SMVNz/UcKy61CfavS0WPUb0iKdvLJH64lqCeVsWvNKjHsOMTwy8wnOEihDwjbz2NQb2Sab5VHzHULPx6YnoYI+DZjjdU1TPG9F55TI/ZgHh+8Wxmn5h8PLsBDUlSjzG9i8nriaD7WxDaNUN62HIhKwa6Bx7SM1o3VipGf64lpIeJZQaG9A4yswpsjwDP203hwVk9GdLTV6So09GocydapkHpdEyZ1Hg6H5PoXPiL08EYBeR0eKLY3ZBFZK0oIGCcnSA7Ue2uCTONUcAORGSlKKD4KEtVhzTAxO6ipEfTROIL5J8X57RcpxgMMQwqnQVGEHZlUZg9LOgrGSycN5TdzK+iyfpjTj5m3iUYPR3yhL9ottjEm5XCxfLpsyAnIRYgVAG1ZyEizJSvlk8/haLjdbwU1pU8DDbdjoWh/KUykzn5mGojgZ4t3VsUTiNOHUzd+xjH68zPp81a/tQv4zQvsKCDZeIeNUo1vP05Ksnz3hMhIR/yZBNOk8lmvsvnTmUhZkBOVdWM70W82KYuyxFUzveu92RhD2CtZ/MbBWs9Wsj0bvLwNs+7zsNKIhWyvLPp1tg+mm69u3gw3VonWJemW293aZ9Kt7YY1g5oPt0aUm2M5fOqmZFuUziYV+042At2WyuVIN02Zq1a1/dtAgu7qIsSSK3AYAMwoozSQyswCMiBSI2QGgjqb8FckEO+q2ouUM+zDGoWFg1BgCxg2fksz+Mj3xOeeh+aviJtb31zRp5W0yrr8EERWfiQ3io4VfS9jFdCzBGiN/QcvIULu23OvO5u3zixcsZJuomVtuTAbSE7ZLZ39xLNehytURJNP4ZPkZNE4a8KZe+/cjGgNmTnTJGOISopQN3t647WwDxG3d2CtbeztD+wsjwhW787c3FMQMsY8lkbFVCzSPsq3jybzGLYaKlAyP+7qjISWZ5rYLPgUkGHENf18otmNWVk/oqqnLfD1igjS2Tk5Rm0nOTdP/81nT3F73og/Uks3tyI8KWFU5nwsWkzQFhhtZgAG5jgPONgJPxBGQfr958OkXHffBY9vu2Dx5Lo8RiDiQ91aw6W6s4Bd2SRx05Ebio7B9iouOmynnPAbAw9BxXOnWEWRgyAfOH+kf9vT/G9918EH4bdlD6pJwZ6EAGRGn0jPYstmYd73hmTDPgGwlQwbNY3J7bhMJSPYY7sd4Ps93PyFC5mq5f4lTJgnI6/giYWH9vgsv7QHWWCx0SFw/eDx6fKiYwVLHZBUkB0Ub1CM9CptblmYqXL3vm4rKXLxRVay3q2VO558X0GKy2NYaSbbfLNkG0tpIMVMwLswl1yiF4isxn1dAx3u7ZkEwos2lZuPayaWy8xv09Vv9nz2dNWpaiFiKN6hRLDDaBbKDlcvmx4FCd7eiV/u9QrHicMcHZ1QbVQpdItoLQ8T5e/Uqvm21qgeh3gbLGpIKydg6Fw1j0EQk668Wod3znhKmpgukhGboHKkOs6gvxHKrtVKtNFXBvQmNQKLdAYQYHrInm8ykhjt0hjXrSaJLPlZPbnvxY5OrsAWIWVEO1oHIG22WEJl0TnNJr3jEVNu1eNRffYpoMRj5XxuBlxeDYOf55sxKiK4rGaGhZe2N35WhhCn3mMVdpKdbYWRgENgrOzUNvTwrvK5hMRFEtU683o5gLLaF/+uHRcR09ve2btNGRw9bydR2RVtm4lTIAQhpYvdzqMbH1jbH2E6n5INsu+rZvrYd/68tFfTcL5kZz/w2xNWtHWwHN8xoJKe+huhq0NTVCXOYdkgFz9S5jMHk+VQhrZujlb/xgnHMVN+FquZLTA2DAwXN8iVUpka7a8Kh7Geo9Ylyxck15H1m6btRXH7KssCpiLBAm9GpV1CXIf9vLCX5uc6irXf+/OF6Yo8Klh09fl/Bh7zs8ro7m/xcXtuBeAZzSSqvC1SOBoga8ZgxalTqUimTcc1LhFvq5Pjj+EIk/iM3fHi6cN5ohSfKi28l34GNiYFK0TgKFjBzi/S6KUpOwAYFJKUi4hxM1voczkEw0hTbObZMxcKYUgMPi/vclMG1zxgl3TSbrT2K4BZsSpxF7NQo7c2Uu0uvtb9OXuU/wSLg6NgTdPOL7ceJPMokTc39qwBInuFZvKUhihOIDSArqpMf/b0TGLeJZYfbqtMXPJPvtNJNhEq+Oa/fqHWpbfu5W2pZm82JQSc8zkvVgmLzUO5OxWz+Q1iaaOczJ5AZV3qwGWZ/IyBA1QFAhlVbIhwA5wnEo1GqpUyQZVM3kP0G9xf4iOAbRzerm0Zk6fPQ58zzM8WWUlgxPoWB432Xa7SaR9ki+np/B8uMYexdRDBQsZwACSrDlznu1wUv2bHgFuS0dZF4TYUb1su4C4uJP3bvXEiRJnHQ69/k7JgEACpIg+waLEIZ7BThVyUiya8be6SbY/yDTEYrKEdh5KRLiod93dMCWQNnQzboEaeWASTx4IvMc0hmVw1ssxDfSQr8+L79etbL9qm3ZBssZCxUrEHsU2bmMLUnt2+r89zrjOblYVtSQH/yDxIWRx0ewVWIQi2/Zwpub+QeI7UgZuX2L3R3x6KJr4sPbvu0nUqBDO6PI1knwm4WLdaPOptNQqUw9xDR96UmPnwhfAtl20C0uUUM9xQtESvgdCkfWBd1JKW5G3QRLJgcIfe0EpGvjIdAo1a4iPPS4ld/GBjA2WNimZYDnAKC+KmL/9Jqd6VnXCS3HWBQRARtZytDBNt0bEi0ZSoiz596CQ4O4UAk5RxWDKgGMXSjSfr2J6CJsXTZob1irNCgeV5ZQepBZgewE25TJJllp8ZhMmj6S6cmpJK6bK+7YGiQ5+3y7pPEWNSEdEfSqTjgEDG7mwmOoBaAAcVbPtFkhHrWVqyrG009PJ6twQ6Gb93KxWWVle3EHCIdgHyPOKaa3AICjw8gu71yxzVPmmlHL2RM6tUc6kIeWUJAEdpBxqCAeoeAghdu3AgHaF2M2V2DYQ6SjGzVLLoqGcESsKlakF2D6wqKSLrGNlMxB4eOcwNaAWC1GiipsPQc4oH1GRDu0yf6R/yilPp/rL0YpHmrU7p+mnVYMyhPmYsSa8bYg5mw1FTAuBUzs3VXA9YIaH1CrzoeB6R7F1myDgWXpdYKfZXdu33PyC1PGB73FcSWxd33w2x+1zVNex85KQtAyHlPBTHj+9R85zYEqqv79Q5BwDG1lEnkB2hP4HT1o9RcYrEly1iasXtEaOFXh2pR0BQ564ziPVrU5RrYgh800ICRby+Spn6OIRwZanqoaCpcDzXOZVqQc3ZGbqKRzX6rzVipWJLCKHuWLYVzxvvcTCWp20eoEqjB2f4mJw/Ppsjj4CUS1PW50oEWEwMDE54SoNXp9dLArU7lTVCtEQHBBPncp61RzWRwimybSJDzVfSRa3ha1Sh1P8gOkjfy9XoThfKgrhE2K5nkT3wZPSSLpYfioMgZAKh53Iwt12dyAgGFBoGVUM3ZoBQcwBdLZH5qqAoOrhTGpLPcScZLD23MYBbBJr71Te4xDwyX3/efOwjtfhPF9tvQsBxQwLsMAvrDhQaHgulCtYjUmmLIbcHcl0KpQqk8xFqKPnGPFp6v26OposeEBGAwgsWaI5p/9UpDfvI9quR9xTPmL7keI6GyUO85tNsWHJ025PiejjCNnjt/ztyiDYjb5l2y1lt9aJSQORTbrO5Zsd0/rio2xXLEU08Cy76ObYxEA+3MkugTGbCzSviHPHQT7bJS/v74rNIPhchHS531SPowaYg9tven9MyJVuvrz+QVfefHn9Q62STsxdKs83Knm/+U3rGktcJBJnRyWdcnNh9OVCbCu1srsk9+T0qbPIlVLY32Sa2a6n95HKLscjxU9sT7yGI8WxBXW0K789FjG9UlA8UlxbzoVmFYdRLyzfxQoC6LOt+6cZifjAwcXzaCAFwcmIorLNtIMg31Zucsnx3RWo+qBpBW2LYORXEQzHx7PvyriYypXZnWnlUQqBcge1rLjVXCZ1gssvxxTvMXR2DF65MyR857tpdLdS9VTE13m82vOQukbdOgkfwv8Mp9yMPqi6B4k/ibDwbpnE081ElnRvEomQcqgy+yKHODYqHjFouCY0WWZ7bhP23Y9E7LNvNt75HQC6DEDr/s3VRQ70eXqd0eZJoMU+ES6BZDxM83PT86alFq64NEYs03SAILLulUlGE+aoUTvbnBy7XCkZFo3qSli96pvTQDYOzgpjqzIRGibwDegXNhJgHJgmQDu/ph2RiC1qOLnVozGWOlSJ+CR4RErEWueR7u9vcmxcWOtCxPZsD+4cZEkuDBvBLlJ2krpytysRp5oy1LUfaBQHebdCY8e3rKY0pnC1FyxkrmUGoEpN+mZYyaCg7XEWKWUVTdYfc7RbAeTP/CEpUXx+p5IHz1HIPeFP0WOURIuJCEto+aUG9+YueTfjSEo+TLXf+RjH62oPpJpt+fRZDEOISGKqJNJn/h1C9T1ORAHB79/MuYO8moRLXUpw+fRTKMa3jpcy60oNQqddAbVpXMUuuNiEavOByvQxpGWqBiZ2D0uFrMDmV9WtT5u1/KlBnMRzMUlaWoh7FLIVlvfpqo2ojpLRR6M6mSJM9QIkYzio4sNKgA4/HARERQQ12lw7tJherinGg9KEioOBn8AigV80K7ZHtme9N5N4zDUE5CcDP9gAjARSshxMnAASYqnBUhNK/S0aVHLMd1UtKmSbCFKzsIGD2gYmRib55vTQ96S7iSgl+QKp3G+lfk7gF5bfotd9jn13L9HMx9HKFdD0Y/gUOUkU/qpQ9v4rFwQl58V2DNH6Pbrs6/KW4Ze8EXuMursFK+829QpWlidk63e5Al9fapc3zwzhfGizSPsq3jybzGLUJPQhFcBdVRlJMLVxICscZGUk8CCxjHwgrqaMzN8+ysgKMvLyDFpO8u6f/5rOnuJ3HcTQc3Q+icVrGlG5tGcqU7nhcVfINws7FrDjudRyVbrrSOW3YAms3386JK77Zqro8W3nDJVEj8e4SXyoW7dYOU3y2XCJYTBqeie2rVa2+7GRauB27X5GqO0Flt5zvl1cAgB6vpGP6ozcfns67b3/Irgu3LM9e2D6rhk+UkNtpEIxNfeZaj/FNU1mOpCHwdnKJkXNSjzbB6BQJGHktRvktZ+Tp3AxW73Er4Hb4nSwFZSs+NjGhPWH7igT8yV0f4VQ3vFhPE5iB8MWb3WOkzANtR+r0gkR4ozj/daaJ0SIo8K2MB84IcIyLKe4nMgoY1RbK1uPxSUgCCxx60lTq8IJEeeVn//S4LRnhj0zqLTb+DhO9vRC/vZqeuHC552dLfYUhLV3rSmcdQ+BEH06RtDA7pCM2QaJEQsbNiuY+R2RmG66JIm9Rqr6KJMQ103Iqqz0SAOqog5F2JA1PV6f4OqmaMk1EN7ff2pCcqRsG3dtkiOWxW11t1horhuScwNgADREkhvAtu+LKlCZau+Eq6gB5ZWWfmlAepgwZCH6Os201yvt5HnTd268WG1emujatk47Z55ve4wVVh9HyXfrRl40mcV3f1/M1uHRA5AP019Lp3IjQkwDXsjYGwr9qTjmrdNfIddDp8qdVsjcA1luotUxF0R8qLbSVGvoBAzaUj9niAoEPvH5vxxRle5ZPnkud4aCKiKr563f6lzXk0RwdecJ58clyOUVnJG9P+iDh2TfzAhn0lAqLQy9FQLl8X2rTE+N8X35awvDFm+14vswncwK8f3yE6AtVBr1B6VHS1cJ75cucZaF97GDEabyfJiT4f2M3XA4g7pqJsUBiiwu+moT9aIHQGMMsWUXUxGZ5XuWKcvcZfRm2QHQh42xkqVk7nbAfDy3Dbvj0nZOZdXD/TVKDiCsC2Ceks0yVlJzLxH6YkA0yIQyIZW7wbIQ6nMK8lFiDwcOdU6sPVTmX1y5LFkN9j3IaBA6hg0lOWRzNiyKHMzyR8kcR8g+o+Vu13VKZVObjOau5Gcz5V6telaLZ1O0CK5kc3m68zFed4jBgp3/MPQBHS2WUSC1oY/lhKwbLuD1RWXlTAYEiDjBtVLSaAVReV4mw0GZSAMDmLZZKI0Kbd8PiEqTqzjyPZk4jMXkSx0GdPFwz9Gt88fZ0WLU0pU42obiy7tN2qBt5QJok3h6OcPoGI4anawK5d7PqqW6LOiYlBSWN6GLPYDhUdYabkrGrTOOKga1Lk90LE6wQVwv8M1CbQmIDdvwZCHW3QRrt6vAhwfPfM/ffiuzfm3HvDfKLq91EhC2bT7VxQwIZDiiWc7VTWjfgR3cXYrDzkXL5qURPdU7oYhBAm25ZyhDT9TzoeuCm6GnQZ3m3Q8xTR6aCSe0n7h1kJgM5omiH4XqcAa2XO5mt01M/S0S5w5WMvV66SuTTYtJs83IYsWgMj0R1yGe2PuYpyfD9Z1sRfOrpadUIO2pt1cgkP6So54MFAIGTAnSJzR0CEPNKhYX9is2zRisLN/nIINhaiHPkdGfLINBDwPstc1g/VmTgzoqfeS2AXLbZNmkGkDVNTBoEdt2jErHp1UI7HYU10UGMsyiZ0mB4RNXRiyqDnxPFpSsdemVl7NlwR6vf5erdXiRM9wvvk7W1vqYPMP9mGDoen3sFtbFrm49rPt1sIMCqV403KCMQIdoWXo05XiQAql/IVRtVmrFH4lpuNQ6pcqGriUOxBeHOkO1Ino0gNR2K533MuAZKo3YDZaD6gTJkOVi32JVdlIMmYNKTxcf6gTVDDtB5NoIXS0HXcuk1ApVMAcHyKLXrnhKQxE9z5D4UFOT5NBYNUUbOcQOvGL16OLUVE/RrnM6eFkufzHHc5vxXZ50wTzqWrIC10nCOoqRfcJqUJfrxk4Hv+RmybNOB68ni6hhUirT6jMkAzwEIAAViqQeJhmMmGVuA69dk8wwTgfvkWQuFRY9CUnfwdHTqPq6Wh+MUZwi9MtA2FI51zINx0xiUbeY89pYwxHJdxUUXDubGFzHo8ARmrJ7BZcp896VtGqdksrkUhn5iI+ybczEN30jgEULwqE2AVQFGlIEl25jPnx4fT8HqW9bMkZkNeFdX2T2vYF1P53vvu4W1vFMasmpq/EQIvX68q25CCNNf4X2XWnvQ3tlTZPbhbttnYfVlAGRZwFcSU1lWPWgeyVAvitQ6kE1Y9i+GVjWid0rFQa0JwXztx8wim/Uhj1m8OgjQdNTncVRzh+U7LoLNotp+BIt+KVo1cghEnRZee4hdRzTkLt/MnOPuf5zmar81uLca3WZmfvcAjBIBf/o1cj5zsDSTEXftFezOzK0VqXqgujzA5sgX3j+p0SfG0DL35F/1tbLXdEpibIpQ+kFYzrqror7/wcAAP//7F3pkuO2tX4VVcd/HWMn2ZXpKq7xVMXJ1Iwr9zdbYvfoRi3qUmr3OFN5qjyCX+xiISUSAilKIqmlNVU2myBEAgffWXBwgINs4Nz99PCXn97uV/Hj8uEvb/fLRTyezp9Hb/ePyVOaJR/uHHDH72bTOf8bU1rcfH6d8YL4dZWKN7zdT+cT/iSbPn9dfbiDzFal2adMXqJ0vlry5/FyPJ1+uHOzaTwb/T3OsvRNvPCrO1/qxfL3j/zhb/Hswx3I25m/cJmMV58y8cHldPKZPwZ+hJzQFy8TRV/481Kp+MnXJJ4k2efkKcmS+TjhFVe/L3gXJslT/Dpb3Y2y++nkw132cQKh+vji+cu/ebU33h9qE0mGr/xvhNTfaTZN5vwrs3g+WY7jRVL86pdYtGyVLnhlyGTdgi4AydvHdLVKXz7cIVsRN3niD4mqqtr54c5SVZ/SdFW6fX5dyVtJj7f7cToTZBWjlqg6ikyKPvLPRXEV9VePs/yi6Mj/+LL6fSaoIcn8a/w4i8fpfPwaT7Lx6yxWn+HV/ienBLEgEg3JifdtU8NLM95wiSLe9+KN83SeiPrLf4tGb9oq/+bNT7MyigQlDvulIulhv5Wjc9hPpxy4k+TnY378z0N+LFi2SvLH2d/S9F/FuwBxFXym2XL1ORUjJ5EW53ebh346e32Zl54XBbLKPP3Z4/he3/1T3UkOUW1YA+mv2XQi/nzmV/6OkcSLY9tSxGjFGEJTMbQA2by5eOFKsFMNo3/+JJgBeB4JIlEIyf0izuKPvI3EtiNkyaq8dJV8W4lSK/9XvOBX+XsCoEUjKSdWuYhZZT8nZVxgaBVNK2qM1f+Lu5xFZJdHGoeIn+UVF5VWYs5QIEBBtZU08j3GGFl3c3fPVWGgpJl4YmPGqFc8+aSJQykW+KXK/vzzKZfkySKZT4R0y2VaoR34tagqOFW8e5EuhZijlK2rmquglspmcG1SyEh+299HctbjZOXqZ/Ipfk68LIn/pUj28J2LgflqOoknkjzqZ723aPVAhv3cf/TPtUV3v826P59mlXlClv4o2arU2tG3l1mhGBZZskyy35K7h1GLLhzf2jLRvosvT8fTlFRHVVkaUtzJimYZKeX/qK2MtADE2GdhVUYi23JB5LJjZGS1+k1GtpCRwzOoGfL+H/+dTJ/T+y3od4zzcSo+cxDKpTnTGuUoAAjjMKqi3PIgRiTYoPeG8iFQ3iugHz7XietTM1Xy9OfeGSpLnpq4SVxU1TVVdkO+xEbURZg4ts5Gh5r9BBQauFuzn0Uec7Cm0qhtu6GFbirt2lXaQ/gimC7eMj1PwPN983uiunqQBiU2wltMpZwGXxbxvOgoauQ1xgAklvRjlniNBZ4FMRUceOO1q+a1f2TP8Xy6fEnfA7elRWdb6FhxUQ7hKsNA5jshsoWvv0GFSoZhDojAhofUqGpcVGKYavV+GYaSYkQamWF0Josbwu9bFBTyrMI8agTXQ1Z2va6d85Ru2yCyxkfZA15H9nH7+d/i39NXYfSoR0/Tb8lk/dBPZrNfYvmx3EFfeJC1FxWOdONjhbbSu3SXNQwbXdbyrtllLQtqXNZrMOxyWXNJK+mvFVMH5+tCWm0sXdZ6MVHuYq0YQWQq5hNF47uBs/Y517nDCcUoUmtMGwa0mGUV7pL19JJwaevbubXcbBf7PocSlDxZZxcjioumNdvFkpzbUPnNnU2f1wpcrd4ULzRqceoC7Ae25ig3CqVmmmwJpWp1KZRIxCzfaRBK8eMs+cRb9pzFi685+25Jl5JwQcqO2QiX5Fs8XpWli1oEhIqBC1GDc7QcLWp0AdNOPec0678FQlHlDp16rVULMcmaXUAsjCALfOGzuUqInQxVwwAo/L/X6eIQ/EgZ3gF+WAT8kFH7XYqo/x0XXx4LIy27Soj5sWGZriXIhEWgg6xeFPlh4IXODi/WDUqXC6Wf0yxejsJvi1m64qT847/zA0Al7UkdVAdILsQY8ogrRq3sIvEdN4RIThlucLtsuAXJIkvG04ORJqcoHSANY892Ake8q4Q0GIXYcqj8wg1pl420X7iOTObTF+GrOcgaE7PeDpBGfBu6/GVVpPWkQlGAQz84R6TJJwMDzUjIDlugxcjkvpMGUNaEEKTLVVp1yFYgKi6qzOgmxczByPbEat0ugBnXFSKbYsc1AazVusKxtNyQq4i5rAyjosQWUzE7sINQeHRKfQY+8bGPpJ+nuc+Bjz2yWd/sqc9JvFy5y2nM+W76kixHf0/eRp/Tl3heRxBePF5+uPPT12yaZKK+opGMui3IFEWA/9vCWlHgiwbJIigdxDv5IqfFpfZLcM33CvOUeij6RxmJ0CaE9Wo6/aemTmtMfTWdTqRzZVnX9avpp2nVbC3/zWsuhlBGWeO25nLsmgtD0LS44jhy7UF/B7KooRihYr2uWpuyHCDakgsx1V4vq++1K4F5kEYiAr+kQAFEgPKptiptXoZxkGWHip2KRRbRKveJTx3WCFatfSsKZWMNcNOWb5z1Do4C+XVeKwpNqNMjMHKzczU27wJacnNttt7cInXCjs0tmxfJO5OBjyPbDoGrxVDBwA0iy22xdWI9PK1skc2SWEf212NJ8tTaCHkbu/6eEHGNujuMuBrTdXePjVHqZcX/29qTMFgb9g9KzBm02sIwYi7MJwVrro+I78KgVVBij1xPpIDsmOtr+dPCILSZvuJMfd8iAd0w425CbvFntbrkzxLVuuJPfymvh1kWxhCOLTTnXTyz5krp8KenKVfzB0Tqto5IsDxsu0R3BZqZok1EAm6LblNEQi2KKaRuSAJtxstwgGwIBEO37fkWig1upG0tc5gbST5ochPluy+PBd1ATscmd2OtGlPkh7bFSdoJh+mteLt/LQpy+0Zr2jid7NBmHbrGmmh0SOittL1bcwmygIN9oik4zAACBG+mwwYuGZwhTsADJxn0Lcbo+4PKhjtfxG9h1qaexQItXAMw5gAIpPe9WbI7HgRs4/O8eCBPhxTp+scMvsVJshxn08V4ms53gCofiWHadYgwFR6LUWuLwwr5JMfVfeyU2vxBC1yeicWRs1AO0sKt0s8S6E0G5x8cx/PV5doc0oXXmk8s4Dq+ZWvymwMcEs/vOpTg3fBJ7yyRyJCng7aDSV9ua3xg4AJHzfXK80sUuEEovYYH4wMFNFIhowPgg6ipsMKHc+XwMC/U/9B4vkXT4PWO5hYN67sNk3VoV4OhdGpCHaQOxBpNa3aHboQ9T65nldWBa6MwYEfFMA7D7jcOv3F4TRteyiF118XigEr1dtQGb4gtj9BI2xqGfBsTaDU6n87KECRKxCgxwOTaSk+BfOc6XfpBh3bPH9zzMK1h5c54YGI8iGjIs587iouqVZF7rVdimR/5LHJ2RAXXrsTqi060lzUnbLsuYFTzplMLWYAG60a26PiWQDOsnJbWIM/VM3khS7BdLb3+tHPptRZn+63asMDHxIVtDno4HmcX4AHvEGfthmsvv7BlRUFoszZ7As9ytE7g7xp8QPfzYDLku0GI25xpcBvRE43ofj5H6Hm+S4DmhLi4ER3Q5zg8i+7lVUJh6DPq7jg25exV5LWNYRduAxwCSoHuMLw8Xh3MbdDXMIuLGl/x9jXRjUHbpkBCzCAJgB7IoQ9kbSBhV9G1CBWxArsmg5iouJEd8F2fPGqEL7FASEIZpL0Lvs2U3IJvq/D3Q+BLcspWRVNeeN1bVhu8HV9eH1fpKp5VjydsKwjJHtYJcEOHAaCtiBJkYdeC1Yjss4ZMr1LuEiCz5SgtD93+u/AOb8mpPai7SfV9uWoilo2ZBwYi1na+jRPSpaMjuI36mGtCFEJtY9bg+phKKdFCHR+xx62adqqXbW7UcnzPgtrZPJen5wuh3Tm0TeLZhGdxMZ3jQFwrBBjoUzwYWRGwqvGWJzzT4BirHBrM8qs9pEDPmPPw/acmBXAlG/a3en2lG/a3+tkm0p9GxPJDe8dOs3oOBwGmnvDSnobDW8m6tXArb7bfO7kj3p5NyBq35I635I7iz+phCZjgnEe18k3SlL0OTDAZkyAgDiLWDi9dns9lc95bvesF77EQz4DvIkiHsb1KU5FccFzp/Hbv+eRfY3FQ16/CSTKaJKNZumwMF+xwTtc0g1LnDS9Hn7J08jpeTX/bpW0Hip45yI8kWLY1WxDKAhK4WhANc4LQxSr+oEO2yKNvS2xRdn//CAu74eYMMvHCzRlUJtX3ZyFJpLd1IAGyu02X5RQSF/MkGlgucPTNNiZN6dqWq+JedO6vPqmxpjWHRPI+0sNsRknldq8n6Bf+XKOcyin/OXlKsmQ+FrTL5bwi/d0ou5/y0co+TgpPweL5i4CJXC63Vb77r8KPgNTfaSZIzUnKDcblOF7kRF88/xKLlvEpAq8M1Tp7QReA5K2y5Tn4bEVcKcWJqqraKfZoKRM2TWWy+/z2+XUlb3N5z41mQdZc3og6ikyKPhvhrFC8hu1R0yNoWra7TY9u0yPT9EhmhJSdrRTL3MfbxTJZ7PrN5kmTJjmVgjAmwRT7x4m/I2pFTZqgy/wgnzQVikDzpGOVzEiqgMJwVP/XzMj9kmAi6FoRcLRWUp8GXuhVN2g293xLkXAFzuj6aDepSErd7FaR3DLe7lRZkvU4Wbn6mXyKnxMvS+J/KZI9fOdiwJBUo+cWrR7osJ+rWlZvVXuzCd39NmsrJeLpmlXmCVn6o+7r3XN+UerC8a0tE+27+PJ0PE3pISH6Uv6P2spIgnxGaajFNpEIIGqF1an2njLSYGyXqHWTkQYZOTyD1hxc/4dMldZ7qu5xKj5zEMqlOdMe5UHgWnag+VkR4RMYX26D6hLlN0vgdJbA6uFznbg+NVMlT3/unaGy5KmJm8RFVV1TZTfkKyGhFgmp3I7RhdlPNss4RY0uzH7gEs4GTLSnbPYLAQDQZpX1xuxDMPvw3PcQqoTw7yEbd6K6epAGJbZKAXTcHgdCuBKVXFVWrFaEPBhWz8i6mY9XyGv/KNLBvwduS4vOttCx4mJax2CujSwiHf97rmOoUdXWO0/EMBe2uFFZlDIxjxrB9ZCVXa+bIF51xPW2c/7jLQ/Lpg1ruu2Th4VYKhH9Vm1sSs8CkZVL60oxQ2qlXrXD7ODGNiNyFlhmKVNUECSMhRDt2AuvLF1GQYhtyWVnk80eOV7oUNJm53czTbbETLV6Oxv4KrPZt7SyBLQ7GFAQWYiFrE22yYsc0NOMoVTffX+MD+mDn87HyeKwfKUdZY/HBCDLCrVp8TsRCe8iM+7Hl0WarZJDMCZUqo6xWiTJ9VPWamP7DUkXiaQgGXFbMh19iWdxNj1EaklrTEfUAVLL4lMY1wI79t53hLW86GywdmWocrPn1xfONPGOJPHiosqMU2hsc9sWyYiug6bQ9XmRW02hj6XThkJ75EUGCCDiyt6Vl2kd4GCgHT5s7HM+R2nX59KEZr8+n3jzVi28jbS41H4Jrtk/L/IVdLo2L/KF9nA79QvndhGptGObxxUM5S0L8ujsvW+OY9x7R4ylNS45SPOd+tU3bxq8RxyqyU1nWdAPfLhjTpuftgsZ0Nx0nZ3MhNdBuwXEa+ZZLY+CKFajhkx3jPwwYtTTzCpmBRZB2uE9zePTq4nRaH7uVP0db3ZpVMl9fCRXEFuxpYP1cv/gEs3y1MzRMi/7gc1snHP4yXi5dZbXfVi5lulwaHsYeEJ3lToNbOi6zKnGqjQTcovpqk96ZLqDrYKcMF0b6/03VrK7yl98QLRV6zUobNseYqhV/uI2a1Bre7PTs+SRgwlltM3ZF8c7aLYRfJiDRj6obPNV5+sU/peBUrdW4FI7HsYlpNrxIBEmXqifNkQhwj60N9lEa8ejXqIMMx5Dj8GWxBkq/0adDhdtABjaVjdSr6kNYjeiWJUazp44cHNwg6wyLo7tGcRGmedFkdjPVWYZx/cQBlUlfMYi7JYQtS8rvOmD05fFBXPPXst+AHogANLoLduqDuHWqncxmv7d5UM9Az2zbD4Oo0Mbv6kVsb6SeRpi9LIxtGvJwPLDFY7Sq5aFXMfbMkW9kAb5SQcXITCMB+Bfg2SIN+ux6fyAmWxr1w6zbABDmVKhi5ks6SUpGscldpAvFoZLjYQ4DJkXVU8L6MMVc3YTpwvx6nTlz1FJ0Q7bSbPfBJ3YGDGs4czoMLnhbD+ctRuuTuaMFqMhYXabAOuzHMV3kixtj+kNdHxqEdDGkXkb0RONaCdmKbF4Ox330lm3F7O0rxGtsSDb78dxGQ58eWjTTguyFMXZ/eJgyzUU6hDT+/YEakCQ4wRinC9laeWWgck00zomA5MIw9GBVIsYEEGCPE/TYdiDvuM6mxQSN8ScO2IMWYWG+fCwoSXdO64sKvfI7RK86+2YZlOQ65rAphcveM8gj1kbK6B1uB/i4g2EMhfOTivAcP5MV1ZA14mfTNF+hyR+woxGjowUXX1NXhI/DwMcC5N/U/zlazzhP/SiNQvsjg0EBNoY+G124fQRG9g5Q3SO/bbQFxfTnhYUWYQEkSBEicAsdCHzwxZHldbPSQbZ03JevsJTh7vreuz7T4s8sL9NMiHocRxYfpvpqREK9cmEBt7e1MAUay4ox6zfkgndTss+z2RC7Q0UFthO6GuRRGYDpcuFrv2yDtGA+Qz5B2+g3Eub2y70o0rGx1vWoe2sQxW9UGqlRsEe2/iQzEefWu0/Gyigqf80QwhBSqHknP75IGAMQbfMB5X443WaoctnhOYWiDH9oSFPzjAtuBA3hxT9hW7aBjCNKJcOURtT0ZgnK5csBgC3yjupTcuS93KY3Gtxn0/LDfylRvHNkEynxUAcl2FHurberiTDzmM6+V3+MUnHMlbp4f8BAAD//wMAUEsDBBQABgAIAAAAIQDvC5PUWAEAAEQIAAAcAAgBd29yZC9fcmVscy9kb2N1bWVudC54bWwucmVscyCiBAEooAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALSVy26DMBBF95X6D8j7YiCPPhTIpqqUbUs/wIHhoYKN7Elb/r5WIhLSolEXZjkXee7xHdtstt9t432CNrWSMQv9gHkgM5XXsozZe/py98A8g0LmolESYtaDYdvk9mbzCo1Au8hUdWc820WamFWI3RPnJqugFcZXHUj7pVC6FWhLXfJOZB+iBB4FwZrrcQ+WXPX0dnnM9C63/mnfwX96q6KoM3hW2aEFiRMWvFAKQduOQpeAMTvVoW8bMT7tHy5cAlQg8jHAqV5RAE79DSDa0ZoLwaBQCPfzR0DPIJofYEkBOPU32DcwnsCxJvfv0l4e2j1oO/ILwVmiINYuIUDm0l69UQqDQubgNIjpc7CgAFauH6NfIZwlMgWnFGjXwoXgWJ5E+koG87/LEQWwdOn/Bfu3Py/jSKRAHuc/k2QQodMkCiUxFftmdCTO0kDBr/79yQ8AAAD//wMAUEsDBBQABgAIAAAAIQBv8tcztQIAAMoLAAASAAAAd29yZC9mb290bm90ZXMueG1srJbbcpswEIbvO9N3YLi3BfiEmdiZSZx0fNu0D6AIYZigw0jC2G9fiXOD6wFSXwh5xX762dUuPDxeSGqdsZAJozvbnTu2hSliYUJPO/v3r9eZb1tSQRrClFG8s69Y2o/7798e8iBiTFGmsLQ0g8og52hnx0rxAACJYkygnJMECSZZpOaIEcCiKEEY5EyEwHNcp5hxwRCWUm/4DOkZSrvCocswWihgrp0NcAlQDIXCl5bhjoaswBb4fZA3AaSf0HP7qMVo1BoYVT3QchJIq+qRVtNINx5uPY3k9UmbaaRFn+RPI/WOE+kfcMYx1YsREwQq/VecAIHiI+MzDeZQJe9JmqirZjrrGgMT+jFBkfZqCGQRjiZsAGEhThdhTWE7OxM0qPxnjb+RHpT+1aXxwOmwbfV2W4AvKpWq9hVDYle6HxjKCKaqiBoQONVxZFTGCW+6A5lK04txDTnfC8CZpPV9OXcHltq/WtuhTEMLHCK/yh1JS+X3ia4zIJsG0XgMkfD3nrUSok9wu/Gk0HSC6w5sPjXA6wHWCA98WdQMv2IA1Fa34SQDy6rmlFkxnKQNrDuwB34W0wGE2SiEt6h1mItx77BkqMJ4HK7OETC+UMEYyqZoSmI0sBHUxGWHWB6wlKGmnxkmHhe0VQO8kk4O+elrhfpDsIy3tORrtGPbsnPz9TSCVRV8twnJr4l5iyHXnZyg4HiiTMD3VCvS5WvpCrSKDJhRH2RzKab4UtjN+akmUWomYWaZlmjvO1+BVh6oK9dEiTkUUDFha5Opp5lb3Mi15zIwa0dtXHurp6W/2dqFVb9jlbFuqp9x1Z+k4c+d7TjOs7Pc+o3pgCOYpaqzYujCDM3WYP8ACpseeTHWMm9KRoyqhGbFW+bts3znlvr108vBf335r+pvqrj3JJ0/cv8HAAD//wMAUEsDBBQABgAIAAAAIQDydBVztAIAAMQLAAARAAAAd29yZC9lbmRub3Rlcy54bWyslttuozAQhu9X2ndA3KcGQg5FSSpto656u90+gGubgIoPsk1I3n5tzluyFdDNhXHGzOefGc/A7uFCM+dMpEo527v+nec6hCGOU3bau6+/nxZb11EaMgwzzsjevRLlPhy+f9sVEWGYcU2UYxBMRYVAezfRWkQAKJQQCtUdTZHkisf6DnEKeByniICCSwwCz/fKmZAcEaXMfo+QnaFyaxy6jKNhCQvjbIEhQAmUmlw6hj8ZsgL3YDsEBTNA5gkDf4haTkatgVU1AIWzQEbVgLSaR7rxcOt5pGBI2swjLYek7TzS4DjR4QHngjCzGHNJoTZ/5QlQKN9zsTBgAXX6lmapvhqmt24wMGXvMxQZr5ZAl3gyYQMoxyRb4obC924uWVT7L1p/Kz2q/OtL60Gycdua7e4BuehM6cZXjold5X7kKKeE6TJqQJLMxJEzlaSi7Q50Ls0sJg3k/FkAzjRr7iuEP7LU/tXajlUaOuAY+XXuaFYp/5zoeyOyaRGtxxgJf+/ZKKHmBHcbzwpNL7j+yObTAIIBYI3IyJdFw9jWDIC66racdGRZNZwqK5aTdoH1R/bAj2J6AJxPQgTLRoe9WPceS2GNk2m4JkfA+kINE6jaoqmI8chG0BDDHrE6YBlHbT+zTDItaKsWeKW9HIrT1wr1p+S56Gjp12jPXcsu7MfTBFZd8P0mpL4m5iWBwnRyiqLnE+MSvmVGkSlfx1SgU2bAjuYg20s5JZfSbs9PPYkzO8G5Y1uie+g+Ap0i0ldhgIoIKKHm0jUmW04Lv7xPGMcwsmvPxhhufqwCb7t0S6t5xWpr3dQ/62o+SPGvvet53qMX3m9b05HEMM90b8XSpR3arcFhB0qbGUU51ipvCUac6ZTl5Svm5aN474b24OlpHa6D4L9qv6nik+fo5urwBwAA//8DAFBLAwQUAAYACAAAACEAf3MoCvUIAADlMAAAEAAAAHdvcmQvaGVhZGVyMS54bWzsWu9y4jgS/35V9w4uvjO2sY0NtckW4c9M6uZmU0k2+1nYAnxjWy5ZkGSu7mHuGe4R9sWuW5KNwcASwmT26kJVsCR3/9Tqf2qJ/PTzU5oYK8qLmGUXLfuD1TJoFrIozuYXrV/vJ+2gZRSCZBFJWEYvWs+0aP18+de//PTYX0TcAO6s6D/m4UVrIUTeN80iXNCUFB/SOOSsYDPxIWSpyWazOKTmI+OR2bFsS7ZyzkJaFDDVkGQrUrQ0XPh0HFrEySMwI6BrhgvCBX1aY9gvBvHMnhk0gTonAMEKO3YTynkxVNdEqRpA7klAIFUDyTsNacfiuqchdZpI/mlIThMpOA2p4U5p08FZTjN4OWM8JQK6fG6mhH9d5m0AzomIp3ESi2fAtLolDImzrydIBFwVQupEL0bwzZRFNHGiEoVdtJY862v+dsWPovcVv35UHDQ5blqYrmfSJ5EUouTlx+hOsY9YuExpJqTWTE4T0CPLikWcV9khPRUNXi5KkNUhBazSpKR7zO0jQ21fahspM6wBjxFf2y5NlOSHEW3rCGsiRMVxjAibc5aSpODB64lPUk1NufaRyacE6DQAuiE9crMoMQKNYYbr6Eac+MiwKnGUVRAnXivWPjIHbgtTA4iWL4LoOKUc+ED2GlYRiWjxMrjSRibyEkEWpKiCRiHOjkwEJaJbQ1QOlrCwymeISV+mNK8CfE5rNsznrwvUj5wt8zVa/Dq063XKfsS66QVYOuDrSah4nTB3C5JDJk/D/vU8Y5xME5AIwteACDSkBfAbHBkfskmf5Dj6j27MEmxESwNTYusS6j8xTfTjhuvGnXhOAKu/IuAk9zAPCVkWLknEw2VCWqYm+w1IIAnZlu/aLWiL5xwEip7WFNdZVNIEuymuYIVQtsoey8s5MyhSkb74dtGyZCMnIdXtkCUM9iKyFEzBJHQmTuOcMiFYWvKijpOK293D7XS9SU+tF2xIhxozDGGHWg+DrSJgvJqoiXg8X5woY5wVcUQ/vYb54RRms2GfafKZsa8lluUOJNss5oW4ZWhk7CZE99YvQUXLFI8l5ftyQJJk7NMVHEyq3oPq2WsZKr/8yOMIm3N4AoYhXcvrBWqtG6M9y5UIW8O2bXXWwCWe4PAWzk7RLUhhOYPO0O2BMLbbzwkn1yCNa9lXnUnPV6NQUQoc9fUHBUf2e478nuMOux0VW1zLzj/Ruge4HauUoqQI1XfZ07GFi0OX2oyb1d8pn1cByimc7LgoATVEviG/NbJ6A99GFR+Qf3P5amhEZ2SZiOabm6215nrejeQxzkIypd9IpP1RkKnyJTItSTB6ETNnBfqAXoWmi2UCWZBsLk+yQeBrAj1bZbgbqXp/0vW6AymO1iufsEwUQEWKMIbNYMBjkhhfCOfsEWddDCBCtoalpBgZMGcpZdvr6ZlLg2FWL+MnBxtQvqKtS6P8yFUohh2Ceh1nCOFzDkEzdsMZmymhv5XyOtLNMdzWa6BZ+9e7zVXoChWaeZ9k4YJxI4oLcS+jEVtXVeszRo/rWLp7u+4WcZon9EbZz1DV/ooqj79odTy72/V64PHGlC7AoFDOS0KsH6iK+4Q8s6W4zoY0SWSeIEnCHn9ZUZ6QXCUO2K60hOi5tjP2rM4V+jO+oFEsHdpzBu7Y60gPyPuVXMaTnOVZ+xe8AmeL8UjyqRJ3whkcSUKZmRQ70PwymxVUXLa7jmeB1upjZVfBbIA+bIFiEM45yRfbuJ4VHIR9kPQQrLC1GHid4vYC1/daRghLARcKoK3WQ2czGoqxosTk3DIwZMEa8nsKCdHrlMSPIMsX2AlUL2KQMQysm33Qc0ZS8OebOBRLTg1f5dC8H35ZfcQVxOGEAwU6D+nLNemRz2DMojzcnnA2UieSjA0x1umgyGE51SZweP7XzlqDGkGpbCx5s2j8Y6hcqQzQoNXPK7Gg9Wq0bAUGwTVjB1Sh7eWU5krYnIk4Zx9yOE+aazJkQgU2MKZJnE/iJMGlY9vgfZpOMRghusALQthRhMxrcSakgsAJPxdCt5SK/tkJBpbV61y1h541bLuWP24Peq7f9q2x71puYA/t4b+QGyJ0WaCLkGSUx6W9jj131m5ALO0nqgCRziEFKp9SRFOtCWUtBKciXGBzBsu9BadSPNULqZu1OrBXyL2F9J9mPMUniLGVQJQS9gekuWbOof75SKHGxAbu1aHSJ1mBrIq0JNHCqOllE/4kRc07632MTFBtEX+jtzTZTmU5maP/SJI8FL/FkVhcynRTH9D9EmMTspnINiBVhq9j6pFN0AcVwip5y82n2nXU7ojbua5d5M66uxSSFd2OWmiQxPOs3OKwCKf8YCnkdr3BlT8ebZZCTtcaBe7gFaWQ49juYHK+Usi3qxJ4oxhCIthVg+7BSsgauxN7eJYCY7qztKhVQpeTfcXOll6+uyR7arLDtdibqur6XVXHqurLu6reversqvrbtiznmPZPq5H6ytv/ryvfLcgdHGKh6DQiagx//3cSLhO2V7azhlHdJvmhGV3L9r1zz0jefI1875RvbfKD9g2s7si+OvPaJ3G4IIX0MVYIVmwIYB5V98orS2geewe4XRKrO24t2O6SuOuPfGtk4Y13rST2rsaBPwxk0b2vJFYWnIw7Y2tNd7hOrpn7u1wZ/iOslIKHEQWiDbLOVmX1LF+gIcpnZRB8KEtshsiO22FnMhoFPUuPnuF2WJ0iaxQvvx0+aO/RZBR4zuCwvCfcBq9vNb+DaXdaaa9udh4X92rEscfDsTdxXq6RjRx2pJr+4NL8XsBepLfX6hY6ifH3x44jhcHO7RJ//qv/1LN5OjRq9+a2vLx+bWKrx4/t7AqgRm4/24V8I6muc6rxbHwksgFDN5xFy1CN3lG+nfDPKsjuTWYVhzFMf3jP+y56QWd+o2mbv49sJNS9yvkRakl+nFLKPP7nU8oYBFyCsL//J3vXTkM7EX1XSkMpN5xiZnvPMA3NPL97S0Mn94THM3L2A8/BsjZwxv7AmrTeooj7AccYVB9OtaFGfKgx/Y9cW4WtNRpPXFk1/i+X+ouIX/4XAAD//wMAUEsDBBQABgAIAAAAIQB7clmfCQUAAE8XAAAQAAAAd29yZC9mb290ZXIxLnhtbMyX3XKjNhTH7zvTd2C47DThw5/xrL2DEzubabP1JO72pjeyEIYGECPJH9m36WVfo32xHgkEdpxkMcnuJjMxQuL8zp+jcw7w7v02iY01YTyi6dB0Tm3TICmmfpQuh+bv8+lJ3zS4QKmPYpqSoXlPuPl+9OMP7zaDQDADrFM+2GR4aIZCZAPL4jgkCeKnSYQZ5TQQp5gmFg2CCBNrQ5lvubZjq1HGKCacg6tzlK4RNwsc3taj+QxtwFgC2xYOERNkWzGcoyEd68zqH4LcBiC4Q9c5RLWORnUtqeoA1G4EAlUHpE4z0iM3121Gcg9JvWak1iGp34x0kE7JYYLTjKSwGFCWIAGnbGkliN2tshMAZ0hEiyiOxD0w7a7GoCi9a6AIrEpC0vKPJvSshPokbvmaQofmiqWDwv6ktJfSB7l9cSgtSFzPLbg7s8hWxFxoW1Yndrn5BcWrhKRCRc1iJIY40pSHUVZ2h6QpDRZDDVk/F4B1EuvrNplTs9Seam0X+TZUwDryi71L4lz580THrrGbElFa1JGw71MrSSCDK8eNQrMTXKdm89EA9wDQxaTmw0Iz+gXDwlV1S05Us6w0J98VyYmqwDo1e+BDMTsAf3UUwm1pHfIgzXdY3Bd+eBxO75ElbZFAIeJl0eTEoGYj0MT2DjFPsJjisp9JJjkuaJ0SeJ/s7GG2fFmhXjK6yipa9DLaVdWyN/K96QhWUfC7TYi/TMxtiDLo5AkeXC1TytAiBkVQvgZUoKF2QP5CIsuDGpKtmpf5UwyCWA78lSFbojmC9z+xiIvDjBWDW3EfA2uwRpAkc/CDME3xCvkMr2JkWsVlf8Al0ITgXRNO7zMQg1aClstjEA9vpOqMZhonbyQm0oR/HpptNcgQJgUH05jCg6bV7UzPHAWGQJHzfBZhDI+BahoC4oPheJr7jEkgtJsUXnO1EwV+xEmldkGFoEkzWxYtw4Zuo5RHPvnwEuNPTYytg/1ZxL9SeqdZdttTZkHEuLihsMcq5jEqzqpF2JhVIr849LqeUJek9MMYvjnKs0/5mVNpKFPukkW+HC7hCAxDZVa/67Tym92bdh23VyG0JXzGwGZATG7An93y3PP2Gbh12oMMMXQl/XbsXtttTfJZeC0UcrZX/EmJ0nzOpL0zsafeJC8QnP8WWnGR9kqcoTPf36q6kJKKC7N9322v32/3zx/4Hp9700lvrH3vS8+nZrt69OQFCdAqFoeXzx6IzwoxeyU9i4hPsmWUFrUcpb40l4kslfaLxM5N2ZSmgsM64jiCduqxCMXGR8QY3UivoQeJ+GBa2fPP2p9rF7FRSKtUlf887uZad0bjFqXcuCUsCnbcPbr8wK2jbkS7hZ0Z/fuP2qF8Unndj7I37vS8vgrc17p7cC+fB7o8M0Y4YWtijoynpElhnW576ub9+isKG02vPl79YsDTvvMW4jT62ZhTn3Ijhn9oVQSHMMgDhmB+T6PMqqL+nila1TrqF+106nhnquyeaRjfqWj/wnpFFe5r1OxxFfoqWzz77295S8+n205o3k5ZfkNpQeyfh0h6LkZzlb4LAqHTV34vbfAaItgcSuOJ8M28y4lhGH/+ZFxPbi4n099urr25Cmpp+SaDy4nsAoI8Gl8pzr5odcYXryIupTNGafDFYnG+WS7WU/RE6EjqV1Hb68vykM8VXx37/bbj9jt2o3572FoV/ct9VLe6UmYAAv8HAAD//wMAUEsDBBQABgAIAAAAIQBheV3QrAgAAIooAAAQAAAAd29yZC9oZWFkZXIyLnhtbOxZ6W4juRH+HyDv0NB/Td+6sPZCp8fIZMYYz3p/U2xK6gy72WC3ZHuCPEyeIY+wL5YqHq2WJWtl2bPYIGPAbh5VH4t1sUj/9PNDxp0Nk2Uq8ouW/85rOSynIknz5UXrly+zdq/llBXJE8JFzi5aj6xs/Xz517/8dD9YJdIB7rwc3Bf0orWqqmLguiVdsYyU77KUSlGKRfWOiswVi0VKmXsvZOIGnu+pViEFZWUJS41JviFly8DRh9PQEknugRkBI5euiKzYwxbDfzFI7Pbd3j5QcAYQ7DDw96HCF0N1XJRqDyg6Cwik2kOKz0M6sLnOeUjBPlL3PKRwH6l3HtKeO2X7Di4KlsPkQsiMVNCVSzcj8uu6aANwQap0nvK0egRMr2NhSJp/PUMi4KoRsjB5MULXzUTCeJhYFHHRWst8YPjbNT+KPtD85lNzMH7asrBc32UPFS8ryytP0Z1mnwi6zlheKa25knHQo8jLVVrU2SE7Fw0mVxZkc0wBm4xbuvvCPzHUnkttE22GLeAp4hvbZVxLfhzR906wJkLUHKeIsLumlSQDD94ufJZqGsr1T0w+FiDYA+hQduJhYTF6BsOl2+hGnPTEsLI42iqIk24V65+YA58K0wBI1i+CCEIrB36QvYFVJlWyehmctZGLvKQiK1LWQaMRFycmAosYNRC1g3FB63yGmOxlSotrwMesYcNi+bpAvZJiXWzR0tehXW9T9j3WTS/AMgHfTELl64S5XZECMnlGB9fLXEgy5yARhK8DEegoC+BfcGT8qCZ7UOPoP6ax4NhI1g6mxNYl1H/VnJvPjTSN2+qRA9ZgQ8BJvsA6hIqcrkki6ZqTlmvIfgUSSEJ+FHegvIShxwIESh62FNd5Ymi8ZyhGsEMoW1VPFHbNHIpUpC+/XbQ81SgIZaZNBRdwFpF1JTQMZ4vqPM65qCqRWV7UMa+5o2e4w0486/tqN2BDNjaYlMIJtR0GWyXAOJrphWS6XJ0pY5qXacLev4b57hxmd88+c/5BiK8Wy4uGim2RyrL6LNDI2OXE9LaToKJ1htcSO28HFEku3o/gYlL37nTP38pQ++WVTBNsLuELGI5yrbjf03vdGfWDuBcfGg/1sEa2gJWEWbg8JZ9BDC8cBuOoD9L40aAgklyjOGHX60SjUI9CSVnhaNf8oOTI/kUivz/1ZsOpDi5phJfvWdMFosCzUlgKqv/angku3B361G7gbP7O5LKOUMngaicrC2ggih35u+NwPA19NMER+Xe3r4cmbEHWvNqfucGhOIzGnUDttTDr7mSPaU7JnH0jiXHIisy1M5G5JcHwRcxClOgEZheGLlUZZEXypbrK9npdQ2BWqw13o1TfnXXizlCJY/QqZyKvSqAiJU3hNBjKlHDnI5FS3OOqqyGEyJNhJSmGBqxppWzHfbOyNRimdRtABdiAyQ1rXTr2R+1CMxwQNA7CMcTPWwiaixspxEIL/c3KGwYmOZLtHlje/uV2dxemRIVmMSA5XQnpJGlZfVHhiK1R3foAUeBHoWe6n7fdMs0Kzm60/Rxd7m+Y9viLVhD7nagfh3B9mrMVGBTqeUWIBQTTgc/Jo1hX1/mYca4SBeFc3H/aMMlJoTMHnFdGQu25s14nCqZmgiWpcmhvFvTCTlc5ZDGo5XIe1CqPxr9gCpwtxTvJ+1rcmRRwJ6EqNWl2oPm0WJSsumx3wtgDrTXHbFfD7IDePQHFIFxKUqye4sZe7yjsnaKHYIWzxcH3lKjfi7pxy6GwFXChXlfnOKBZLBitppoSs3PLwZAFa6i/84tWPw4s8T3I8hGOAt1LBGQMBwtn34NDLycZOPRNSqu1ZA4OaTL6cXOFe0jpTAIJug8ZqF2ZkQ9gztLeb8+4HulLSS7GGO1sWBawofocOL7+a1dtQE2gWnbWcr9u/H2oQusM0KA1KGqxoPVqtHwDFsE9YwdUYSwWWntxsRRVWoh3BVwp3S0ZMqEC9zDmPC1mKee4dWw7csCyOYYjxBfEG4UzpVKZLc0rpSBwww9lZVpaRf8MekPP6wej9jj2xu3I607bw37UbXe9aTfyop4/9sf/Qm6I0XWJLkL4pEitvU69ejYeQTzjJ7oGUc6hBLJfJaKr94SylpVkFV1hcwHb/QxOpXnqCaWbrTqwV6rThQweFjLDL4jxJIVoJTwfku6WuYAS6IpBmYkNPK2p1ifZgKya1JIYYfTyqgm/iqLhnc0+Riaotky/sc+MP01mBVmi/yiSgla/pkm1ulQJpzlg+hZjF3I/le1A6hzfxDQju6B3OoR1+lbHT33u6PMRD3RTvaiz9XAxpIu6A+XQkKfL3J5yWIgzebQaijpTqGa6WOI3qqFg4ne6cDE9vxoKQz8azt6uGur6dRm8Uw8hEcjb6xwthrxpNPPHb1JjzA9WF41i6HL2XL3zRC/fXZJnyrLj5dgfqqrrH6o6VVUff6jqh1e9uar+9lSWt1j2T6uR5s7b/687PyzILdxjoep0EuaMf/s3p2sunpXtTcOoaRMsSv4sCjm6+57XmfijN979LKUrUioLiLIS5Y4A7mllIb7pQfPUR7KnBaN+BTaCHS4Yw85kFA6nk9aLn8+0BWfTYOqp988TqshO7I/63/FN7R+0VgrW6hrEGGQby7a2VBNoCPutDYIfbYndIDnwfBrNpiPfs6Nv8HxaP+Jaipc/nx6zd9yfhNNZFLzc3r/zXLp99vsOpj1opefD5uBt6vkQCHrTfjTCzZ8VAtEw7qr3uj09jcbeEG/QDT0Z4mf19AWWF3AXYgXLkxQvfOYoqh9t52whJMPkoGcOXJzeKo1Zte/lbbOx16/UjMtgr5y5IpA4MYPeEk5kqppclM6nuWRSqNzKiXMjRbKmNP3tP7kj1Pwt5PyUpm+fc4+5URBMR9PxFP/Zc5YbmbPwtHBrHJx/VCY9linxo//buqsTrzsZD4Nw9D+ebVaJvPwvAAAA//8DAFBLAwQUAAYACAAAACEAxJ/g/BMFAABUFwAAEAAAAHdvcmQvZm9vdGVyMi54bWzMl91yozYUx+8703dguOw04cPGdjxr79ixnc202XoSd3vTG1kImwYQI8kf2bfpZV+jfbEeCQT+SLKYZHeTmRghdH7nz9E5B3j3fhtHxpowHtKkZzrntmmQBFM/TBY98/fZ5KxjGlygxEcRTUjPfCDcfN//8Yd3m24gmAHWCe9uUtwzl0KkXcvieElixM/jEDPKaSDOMY0tGgQhJtaGMt9ybcdWo5RRTDgHV5coWSNu5ji8rUbzGdqAsQQ2LbxETJBtyXBOhnjWhdU5Brk1QHCHrnOMapyMallS1RGoWQsEqo5IXj3SIzfXqkdyj0nteqTGMalTj3SUTvFxgtOUJHAxoCxGAk7ZwooRu1+lZwBOkQjnYRSKB2DaLY1BYXJfQxFYFYS44Z9MaFsx9UnU8DWF9swVS7q5/VlhL6V3M/v8UFiQqJpbcHdhka2IuNC2rErsMvMRxauYJEJFzWIkgjjShC/DtOgOcV0aXFxqyPq5AKzjSK/bpE7FUnuqtY2ybSiBVeTnexdHmfLniY5dYTclorCoImHfp1YSQwaXjmuFZie4TsXmowHuEaCFScWHhWZ0coaFy+qWnLBiWWlOtiuSE5aBdSr2wEMxOwB/dRLCbWgd8iDNd1jcF/7yNJzeI0vaIoGWiBdFkxGDio1AE5s7xCzBIoqLfiaZ5LSgeQXwId7Zw3TxskK9YnSVlrTwZbTrsmVv5HvTCay84HebEH+ZmLslSqGTx7h7vUgoQ/MIFEH5GlCBhtoB+QuJLA9qSLZqXuZPPggiOfBXhmyJZh/e/8Q8yg9Tlg/uxEMErO4aQZLMwA/CNMEr5DO8ipBp5cv+gCXQhJym14LXS5h6SEGQvy1XDEE/vJSqM5pqoryXiEgL/rlnNtUgRRhsbTnGNKLwrGm0vMmFo7gQK3KZzSKM4UlQTkNMfDAcTjKfEQmEdpPAm652osCPOEErQTPLORWCxvVsWbhY1nQbJjz0yYeXGH+qY2wd7c88+pXSe82ymwNlFoSMi1sqt1meRig/Ky/Cxqxi+dGhr+sJtSShH4bw2VGcfcrOnFJDkXVXLPTlcAFHYBhZcrnNplp8MO86brtkaFP4lIHdgKDcgkN7eGkP2h74dZrdFDF0LR1PbGcw6oyzWXg1FHK2nf9JjdJ8xnbsFRhnv7lYrFNfqTMOUl9qylem+86djudcDNx9547TGA/dxlA739eeTU2VIGdsTwZSejY5IgFaReJ4+XRnsVKRi9mr62lIfJIuwiQv1zDxpblMZVnTnTy1M1M2oYngcB1xHEJPHbAQRcZHxBjdSK/LAaTiwbSy55+1P9fOY6OQVqEq+3nczY1uj8YdSrhxR1gY7Lh79PKBW0fdiHYLO9P/9x+1Q9mk8rof5cHQaw86KnBf6+7BvXwo6AJNGeGErYnZN56SJoV5rebEzZr2VxTWn1x/vP7FgEe+9xbi1P/ZmFGfciOCf2hWBC9hkAUMwfyeRplVef09U7Wqd1Qu2sag4dnNoexfz3SM71S0f2F9RRXua9TsaRX6Kls8/e9veUvPp9tOaN5OWX5DaUHkXy6R9JyPZip95wRCp1d+L23wIiLYDErjifBNB1djwzD+/Mm4Gd9ejSe/3d4MZiqoheWbDC4nsgsI8mh8pTh71PCGo1cRl9ApozT4YrG43ywXqyl6InQk8cuo7fVlecjm8k+Pg5ekcWs4GnnydejEfnvcWhX9y31Ut7pCZgAC/wcAAP//AwBQSwMEFAAGAAgAAAAhAGcfWKqLCAAAiycAABAAAAB3b3JkL2hlYWRlcjMueG1s7Frpbhs5Ev6/wLxDQ/+VvnVh7IGuTozJZgzHk/lNdVNSb9jNBpuS7Sz2YfYZ9hHmxbaKR0uyZEWWnWAWGwN286j6WKyLRSY//3JfMGdNRZ3z8qLlv/FaDi1TnuXl4qL1+23S7rWcWpIyI4yX9KL1QOvWL5c//e3nu8EyEw5wl/XgrkovWkspq4Hr1umSFqR+U+Sp4DWfyzcpL1w+n+cpde+4yNzA8z3VqgRPaV3DUmNSrkndMnDp/WlomSB3wIyAkZsuiZD0foPhPxskdvtubx8oOAMIdhj4+1Dhs6E6Lkq1BxSdBQRS7SHF5yEd2FznPKRgH6l7HlK4j9Q7D2nPnYp9B+cVLWFyzkVBJHTFwi2I+Lyq2gBcEZnPcpbLB8D0OhaG5OXnMyQCrgahCLNnI3TdgmeUhZlF4RetlSgHhr/d8KPoA81vPg0HZactC8v1XXovWS0trzhFd5p9wtNVQUuptOYKykCPvKyXedVkh+JcNJhcWpD1MQWsC2bp7ir/xFB7KrVNtBk2gKeIb2xXMC35cUTfO8GaCNFwnCLC7ppWkgI8eLPwWarZUq5/YvKxAMEeQCelJx4WFqNnMNx0E92Ik58YVhZHWwVx8o1i/RNz4GNhtgCy1bMggtDKgR9k38KqM5ktnwdnbeQiL5FkSeomaDTi/MREYBGjLUTtYIynTT5DTPo8pcUN4EOxZcNq8bJAfSv4qtqg5S9Du9qk7Dusm56BZQJ+OwnVLxPm45JUkMmLdHC1KLkgMwYSQfg6EIGOsgD+BUfGj2rSezWO/mMac4aNbOVgSmxdQv0nZ8x8roVpfJQPDLAGawJOcgvrkJSX6YpkIl0x0nIN2R9AAknIj+IOlJcw9FCBQNn9huKqzAyN9wTFCHYIZavq8cquWUKRivT1l4uWpxoVSalpp5xxOIvISnINw+hcnsc541LywvKijlnDHT3BHXbipO+r3YAN6dhgpimcUJthsFUGjKNELyTyxfJMGfOyzjP67iXMn85hdvfsM2PvOf9ssbxoqNjmuajlDUcjY5cR09tMgopWBV5L7LwdUCQlfzeCi0nT+6R7/kaGxi/fijzD5gK+gOEo14r7Pb3XnVE/iHvxofFQD2tkCygFzMLlKbsBMbxxEvSnY5DGjwYVEeQKxIlGXjTxko4ehZJS4mjX/KDkyH4rkN+feslwqoNLGOHFO7rtAlHgWSksRar/2p4JLtwd+tRu4Kz/TsWiiVBB4WonpAU0ENWu/B2/H3SnaIIj8u9uXw9N6JysmNyfucahOIzGnUDttTLr7mSPaZmSGf1CMuOQksy0M5GZJcHwRcyK1+gEZheGLlcZZEnKhbrK9npdQ2BWawx3rVTfTTpxZ6jEMXoVCS9lDVSkTnM4DYYiJ8z5QITgd7jqcggh8mhYSYqhAWtaKdtx36xsDYZp3QZQBTagYk1bl479UbvQDAcEjYNwDPHzGoKW/FpwPtdCf7HyhoFJjmSzB1q2f/+4uwtTokKzGpAyXXLhZHktb1U4YmvUtN5D9PhR6JnuzaZb50XF6LW2n6PL/TXVHn/RCmK/E/eCCKZmdAkGhXpeEWIBQXXgM/LAV/KqHFPGVKIgjPG739ZUMFLpzAHnlZEQPdePRpM48Ydmgma5cugwSTp+NwlRsdWgkcu5V6s8GP+CKXC2HO8k7xpxE8HhTpKq1KTZgea3+bym8rLdCWMPtLY9ZrsaZgf00yNQDMKFINXyMW7s9Y7CflL0EKxwtjj4nhL1e1E3bjkpbAVcqNfVOQ5o5nOayqmmxOzccjBkwRrq7+yi1Y8DS3wHsnyAo0D3Mg4Zw8HCGdRckgLc+TpP5UpQx/ciw5J+WL/FHeRpIoAEnYcM1J7MyHswZm1vt2dcjvSVpORjjHU6rCvYTnMKHF//patuQU2gVnZWYr9q/DpUpXUGaNAaVI1Y0HoxWrkGi+CesQOqMPYKrb0YX3CZV/xNBRdKd0OGTKjAPYwZy6skZwy3jm1HDGgxw2CE6AI3SOFEkSqv5aVUCgInfF9L09Iq+mfQG3pePxi1x7E3bkded9oe9qNuu+tNu5EX9fyxP/4XckOErmp0EcImVW7tderFc+sJxDN+oisQ5RxKIPtVIrp6TyhrLQWV6RKbc9juDTiV5mkmlG426sBerc4WMrifiwK/IMajBKKV8HRAuhvmCgqgtxSKTGzgWZ1qfZI1yKpJLYkRRi+vmvCrKLa8c7uPkQmqrfMv9Iayx6msIgv0H0VSpfKPPJPLS5VutgdM32LsQu4nsh1IneG3Mc3ILugnHcI6eavDpzl19OmIx7mpXdTJergU0iXdgWJoyPJFac84LMOpOF4LTf3RqO9Nd2uhuNOfDONRcH4tFIZ+NExerxbq+k0RvFMNIREcq73O0VLIm0aJP36VCmN2sLbYKoUuk8fVzndZ9okK7Hjl9V31cvVDLwf18uGHXn74yzP08uu30MtfViPbO2//v+78sCAf4eYJlaKTUWf8579ZumJ8T7bvIAaWEk/qBDXS8zoTf/TKvpDk6ZLUau+8lrzeEcA9rYjC9y9onvqg9Li80i+mRrDD5VV3FIddL/zKU9mh8ko7UzINpp56Kzyh5urE/qj/Dd+f/pE2SsHKVoMYg2yiyFZiagINYb+NQfCjLbHjJoeeGr3hJJwG8aPy9AVPjc2Dp6V4/lPjMXv7wcSP4ih8vr2/8rS4eSL7BqY9aKWnw+bg3eNJlXh+PASljM4NgWgYdwN0gFP0ZIif1NMtLM/h5kArWmY5Xo/MIdA8cM7onAuKyUHPHLhmvFYas2p/lTS9HYLBXs0woTVZCLqAXf75nxKzJuO1c1XWqwK+yarMCP6vAsLoqyfSo+ES+aNJHCPzWb5hztrTfGPrYP5e6fFY+sOP/ufGR0fGpJ9Mk0nyP55Clpm4/C8AAAD//wMAUEsDBBQABgAIAAAAIQAwae9UhAgAAPEnAAAQAAAAd29yZC9oZWFkZXI0LnhtbOxZ63LaSBb+v1X7Dir+E12QQFBjT2FAiWu8GZfjyfxuWg1oI6m1rQbb2dqH2WfZF9tz+iLAYAawk5qtjauC+nLO16fPrU93fvr5scidFRN1xsuLlv/OazmspDzNyvlF67f7pB23nFqSMiU5L9lF64nVrZ8v//qXnx4Gi1Q4wF3Wg4eKXrQWUlYD163pghWkfldkVPCaz+Q7yguXz2YZZe4DF6kbeL6nWpXglNU1LDUi5YrULQNHH49DSwV5AGYEDF26IEKyxzWGfzJI5PbdeBcoOAMIdhj4u1Cdk6G6Lkq1AxSeBQRS7SBF5yHt2Vz3PKRgF6l3HlJnFyk+D2nHnYpdB+cVK2FyxkVBJHTF3C2I+LKs2gBcEZlNszyTT4DpdS0MycovZ0gEXA1C0UlPRui5BU9Z3kktCr9oLUU5MPzthh9FH2h+82k4WH7csrBc32WPMq+l5RXH6E6zjzldFqyUSmuuYDnokZf1Iqua7FCciwaTCwuyOqSAVZFbuofKPzLUXkptY22GNeAx4hvbFbmW/DCi7x1hTYRoOI4RYXtNK0kBHrxe+CzVbCjXPzL5WIBgB6BL2ZGHhcWIDYZL19GNONmRYWVxtFUQJ1sr1j8yBz4XZgMgXZ4EEXSsHPhB9g2sOpXp4jQ4ayMXeYkkC1I3QaMRZ0cmAosYbiBqB8s5bfIZYrLTlBY1gE/Fhg2r+esC9b3gy2qNlr0O7Xqdsh+wbjoBywT8ZhKqXyfMpwWpIJMXdHA9L7kg0xwkgvB1IAIdZQH8BUfGj2qyRzWO/mMasxwb6dLBlNi6hPpPTnPzuRWm8Uk+5YA1WBFwkntYh1Be0iVJBV3mpOUast+BBJKQH0ZdKC9h6KkCgdLHNcV1mRoa7wWKK9ghlK2qxyu7ZglFKtLXXy9anmpUhDLTpjzncBaRpeQaJmczeR7nlEvJC8uLOs4b7vAF7k43Svq+2g3YkI0MJqVwQq2HwVYpMF4leiGRzRdnypiVdZayD69h/nwOs7tjn2l+w/kXi+WFQ8U2y0Qt7zgaGbs5Mb31JKhoWeC1xM7bAUVS8g9XcDFpep91z1/L0Pjle5Gl2JzDFzAc5VpRP9Z73Rr1gyiO9o139LBGtoBSwCxcntI7EMMbJUF/MgJp/HBQEUGuQZzOeJxcxV5Hj0JJKXG0Z/5QcmS/F8jvT7xkONHBJYzw4gPbdIEw8KwUloLqX9szwYW7Q5/aDpzV35iYNxEqGFzthLSABqLakr8bjUKvO0SwA/Jvb18PjdmMLHO5O3OLQ1EnHHUDtdfKrLuVPSYlJVP2laTGISWZamciU0uC4YuYFa/RCcwuDF2mMsiClHN1lY3jniEwqzWGu1Wq7yXdqDtU4hi9ioSXsgYqUtMMToOhyEjufCRC8AdcdTGEEHk2rCTF0IA1rZTtqG9WtgbDtG4DqAIbMLFirUvH/qldaIY9gkZBZwTx8xaClvxWcD7TQn+18nYCkxzJeg+sbP/2aXsXpkSFZjUgJV1w4aRZLe9VOGLrqmndQPT4Yccz3bt1t86KKme32n6OLvdXTHs8+HrcC+CvF7ScKVuAQaGeV4RYQDAd+Dl54kt5XY5YnqtEQfKcP/y6YiInlc4ccF4ZCdFzo8Tzh1EYmAmWZsqho3EwHsVJDxVbDRq5nEe1ypPxL5gCZ8vwTvKhETcRHO4kVKUmzQ40v85mNZOX7W4n8kBrm2O2q2G2QD8/A8UgnAtSLZ7jRl58EPazoodghbPFwfeUsB+HvajlUNgKuFDc0zkOaGYzRuVEU2J2bjkYsmAN9Tu9aPWjwBI/gCwf4SjQvZRDxnCwcAZtlqQAd77NqFwK5vheaFjox9V73EFGEwEk6DxkoPZkRm7AmLW93Z5xOdJXkpKPMNbZsK5gO80pcHj91666ATWGWtlZit2q8Y+hKq0zQIPWoGrEgtar0coVWAT3jB1QhbFXx9or53Mus4q/q+BC6a7JkAkVuIMxzbMqyfIct45tRwxYMcVghOiCaKNwokiV17JSKgWBE97U0rS0iv4ZxEPP6wdX7VHkjdqh15u0h/2w1+55k17ohbE/8kf/Qm6I0GWNLkLycZVZex178dx4AvGMn+gKRDmHEsh+lYiu3hPKWkvBJF1gcwbbvQOn0jzNhNLNWh3Yq9XZQgaPM1HgF8R4lkC0El4OSHfNXEEB9J5BkYkNPKup1idZgaya1JIYYfTyqgn/FMWGd272MTJBtXX2ld2x/Hkqq8gc/UeRVFT+nqVycanSzeaA6VuMbcjdRLYFqTP8JqYZ2Qb9rENYJ291+DSnjj4d8Tg3tYs6WfeXQrqk21MMDfNsXtozDstwJg7WQgGUQlF3ggX+Ri0UxWNw2u74/Fqo0/HDYfJ2tVDPb4rgrWoIiWAXcfdgKeRNwsQfvUmFMd1bW2yUQpfJ82rnuyz7QgV2uPL6rnq5/qGXvXr5+EMvP/zlBL388i308qfVyObO2/+vO98vyCe4eUKl6KTMGf3n3zld5nxHtrc1AFYNf5bdv2gGFCOG4sW/emP3SzK6ILVSN68lr7cEcI+r2/DJDZrHvmE9r+j0I60RbH9FF/XjXm8c/cHr3L6KTlswmQQTTz1PHlHmdSP/qv8Nn7z+ThulYDGtQYxB1oFriz81gYaw38Yg+NGW2HKTfa+bXjL2k2Q8Oay/E143mzdWS3H66+Yhe4fDYSfohG//mrl+lfsGpt1rpZfDZu9150WVdJN4HAXJ8NwQCIdRL0AHOEZPhvhFPd3D8hwuK6xiZZrhjcycO82b6pTNuGCYHPTMnpvNW6Uxq3abM9/s7Ax2ypQbOJ3AOTBdTv6xzMAHnFvB0yWFK/Tb585D7uBfXUVBHHTPdQdzph3nDhsH4PfKiIcyHn70f2pu6wQzdz8c4Zvx/3LWWKTi8r8AAAD//wMAUEsDBBQABgAIAAAAIQAxULdXoQgAALYoAAAQAAAAd29yZC9oZWFkZXI1LnhtbOxZ6XLbOBL+P1X7Diz9V3iLlGrsKV1MXJPNuByP5zdEQhInIMECKdnO1D7MPsu+2HYDIHUrkmxnd2vjqog4uj80+kID+fmXp4wZSyrKlOdXLfud1TJoHvMkzWdXrd/vo3bYMsqK5AlhPKdXrWdatn65/ttPPz/25okwgDsve49FfNWaV1XRM80yntOMlO+yNBa85NPqXcwzk0+naUzNRy4S07FsS7YKwWNalrDUkORLUrY0XPx0GloiyCMwI6BnxnMiKvq0wrDPBvHNrhnuAjkXAMEOHXsXyj0bqmOiVDtA3kVAINUOkn8Z0p7NdS5DcnaRgsuQ3F2k8DKkHXfKdh2cFzSHySkXGamgK2ZmRsSXRdEG4IJU6SRlafUMmFanhiFp/uUCiYCrQcjc5GyEwMx4Qpmb1Cj8qrUQeU/ztxt+FL2n+PWn4aDstGVhua5JnypWVjWvOEV3in3E40VG80pqzRSUgR55Xs7ToskO2aVoMDmvQZbHFLDMWE33WNgnhtqh1DZSZlgBniK+tl3GlOTHEW3rBGsiRMNxigiba9aSZODBq4UvUs2acu0Tk08N4OwAdGJ64mFRY4Qaw4xX0Y046YlhVeMoqyBOulKsfWIO3BZmDSBZnAXhuLUc+EH2NawyqZL5eXC1jUzkJRWZk7IJGoU4PTER1IjeGqJyMMbjJp8hJj1PaX4D+Jyt2bCYvSxQ3wu+KFZo6cvQblYp+xHrpjOwdMCvJ6HyZcJ8npMCMnkW925mORdkwkAiCF8DItCQFsBfcGT8yCZ9kuPoP7oxZdhIFgamxNY11H/VhOnPrdCNz9UzA6zekoCT3MM6JOZ5vCCJiBeMtExN9geQQBKyPb8D5SUMPRcgUPK0orjJE01jHaAYwA6hbJU9XtRr5lCkIn359aplyUZBYqrbMWccziKyqLiCYXRaXcY54VXFs5oXdcwabu8At9vxo64tdwM2pEONGcdwQq2GwVYJMA4itZBIZ/MLZUzzMk3oh5cwP1zCbO7YZ8I+cv6lxrK8vmSbpqKs7jgaGbuM6N5qElS0yPBaUs/XA5Ik5x8GcDFpeg+qZ69kaPzyvUgTbM7gCxiGdC2/G6q9bozajh/6+8ZdNayQa8BKwCxcnpI7EMPqh0G/64I0ttcriCA3KI5l+e4oHKlRKCkrHA30H0qO7PcC+e2xFfXHKriEFl58oOsu4DlWLUVNEavfuqeDC3eHPrUZOMu/UzFrIlRQuNqJqgbUEMWG/F5/PBxZ3uC4/JvbV0MjOiULVu3O3OKQ73rDjiP3Wuh1N7LHOI/JhH4liXbIikyUM5FJTYLhi5gFL9EJ9C40XSozyJzkM3mVDcNAE+jVGsPdStUHUcfv9KU4Wq8i4nlVAhUp4xROg75ICTM+ESH4I64670OIbA1LSTE0YM1ayrbf1SvXBsO0XgdQATagYklb10b9J3ehGPYI6jvuEOLnNQTN+a3gfKqE/lrL6zo6OZLVHmje/v3z5i50iQrNokfyeM6FkaRldS/DEVuDpvURosD2XEt371bdMs0KRm+V/QxV7i+p8nhwvTBwHM8FjzcmdA4GhXpeEmIBQVXgM/LMF9VNPqSMyURBGOOPvy2pYKRQmQPOKy2h9GcrdMOh9FycoEkqHdq2B1YQjGxUbNFr5DKe5CrP2r9gCpwtxTvJh0bcSHC4k8QyNSl2oPltOi1pdd3uuL4FWlsfq7sKZgP0YQsUg3AmSDHfxvWt8Cjsg6SHYIWzxcD3FK8beoHfMmLYCrhQGKgcBzTTKY2rsaLE7NwyMGTBGvJ3ctXq+k5N/AiyfIKjQPUSDhnDwMIZQjsnGbjzbRpXC0EN2/I0S/xp+R53kMaRABJ0HtKTe9IjH8GYZX27veBypK4kOR9irNN+WcB2mlPg+PovXXUNagS1srEQu1Xjt6EKpTNAg1avaMSC1ovR8iVYBPeMHVDFtr0Yn/EqLfi7Ai6U5ooMmVCBOxgTlhZRyhhuHduG6NFsgsEI0QXRFsOJUsm8luaVVBA44cey0i2lor+csG9ZXWfQHvrWsO1Zwbjd73pBO7DGgWd5oT20h/9AbojQRYkuQtioSGt7nXrxXHsCsbSfqApEOocUqP5KEU21J5S1rASt4jk2p7DdO3AqxdNMSN2s1IG9Up4tpPc0FRl+QYytBKKUcDggzRVzAQXQewpFJjbwrI6VPskSZFWkNYkWRi0vm/BPUqx553ofIxNUW6Zf6R1l26msIDP0H0lSxNUfaVLNr2W6WR/Q/RpjE3I3kW1Aqgy/jqlHNkEfVAir5C0Pn+bUUacjHue6dpEn6/5SSJV0e4qhPktneX3GYRlOxdFaKOhGUd+Otmo5NxgG3nAoV7isFnJd2+tHr1cLBXZTBG9UQ0h01XLCztFSyBp7kT18lQpjsre2WCuFrqPtaue7LHugAjteeX1Xvdz80MtevXz6oZcf/nKGXn59C73812pkfeft/9ed7xfkM9w8oVI0EmoM//VPFi8Y35HtO4iBpcRBnaBGQqszsgev7AtRGs9JKffOy4qXGwKYpxVR+P4FzVMflLbLK/ViqgXbX145Y6jUnAiXOfOpSTlTNHbGlnwrPKHm6vj2oPuG709/xo1SsLJVINogqyiqKzE5gYaov41B8KMsseEm+54aPbcbdKIRaup1nhqbB8+a4vynxmP2dj27E3mDC+z9jafF1RPZG5h2r5UOh83eu8dBlXSiQac7cr9hwsMh4PX9wBnv05PVcYYDaadGT5r4oJ7uYXkONwda0DxJ8XqkD4HmgXNCp1xQTA5qZs8147XSWK32V0nT6yHo7NQMI1rOGC/psTSttf/Gohw4UyGPM0jnt5Bq04RsZvMtOcO+PYzkq+Z/QM6CCzhw8pgWb3DmHAsjbzDoe07YvTSMdFlyWrpZq2G+10ly7KTAj/qf2a3T1e33/XEHk8P/cradJ+L63wAAAP//AwBQSwMEFAAGAAgAAAAhAKomDr68AAAAIQEAABsAAAB3b3JkL19yZWxzL2hlYWRlcjEueG1sLnJlbHOMz7GKwzAMBuD9oO9gtDdOOpTjiJOlHGQt7QMIW3FMY9nYvuPy9jV0aaHDjZL4vx/1459fxS+l7AIr6JoWBLEOxrFVcL187z9B5IJscA1MCjbKMA67j/5MK5YayouLWVSFs4KllPglZdYLecxNiMT1MofksdQxWRlR39CSPLTtUaZnA4YXU0xGQZpMB+KyRfqPHebZaToF/eOJy5sK6XztriAmS0WBJ+PwseyayBbk0MuXx4Y7AAAA//8DAFBLAwQUAAYACAAAACEAqiYOvrwAAAAhAQAAGwAAAHdvcmQvX3JlbHMvaGVhZGVyMi54bWwucmVsc4zPsYrDMAwG4P2g72C0N046lOOIk6UcZC3tAwhbcUxj2di+4/L2NXRpocONkvi/H/Xjn1/FL6XsAivomhYEsQ7GsVVwvXzvP0HkgmxwDUwKNsowDruP/kwrlhrKi4tZVIWzgqWU+CVl1gt5zE2IxPUyh+Sx1DFZGVHf0JI8tO1RpmcDhhdTTEZBmkwH4rJF+o8d5tlpOgX944nLmwrpfO2uICZLRYEn4/Cx7JrIFuTQy5fHhjsAAAD//wMAUEsDBBQABgAIAAAAIQCqJg6+vAAAACEBAAAbAAAAd29yZC9fcmVscy9oZWFkZXIzLnhtbC5yZWxzjM+xisMwDAbg/aDvYLQ3TjqU44iTpRxkLe0DCFtxTGPZ2L7j8vY1dGmhw42S+L8f9eOfX8UvpewCK+iaFgSxDsaxVXC9fO8/QeSCbHANTAo2yjAOu4/+TCuWGsqLi1lUhbOCpZT4JWXWC3nMTYjE9TKH5LHUMVkZUd/Qkjy07VGmZwOGF1NMRkGaTAfiskX6jx3m2Wk6Bf3jicubCul87a4gJktFgSfj8LHsmsgW5NDLl8eGOwAAAP//AwBQSwMEFAAGAAgAAAAhAKomDr68AAAAIQEAABsAAAB3b3JkL19yZWxzL2hlYWRlcjQueG1sLnJlbHOMz7GKwzAMBuD9oO9gtDdOOpTjiJOlHGQt7QMIW3FMY9nYvuPy9jV0aaHDjZL4vx/1459fxS+l7AIr6JoWBLEOxrFVcL187z9B5IJscA1MCjbKMA67j/5MK5YayouLWVSFs4KllPglZdYLecxNiMT1MofksdQxWRlR39CSPLTtUaZnA4YXU0xGQZpMB+KyRfqPHebZaToF/eOJy5sK6XztriAmS0WBJ+PwseyayBbk0MuXx4Y7AAAA//8DAFBLAwQUAAYACAAAACEAqiYOvrwAAAAhAQAAGwAAAHdvcmQvX3JlbHMvaGVhZGVyNS54bWwucmVsc4zPsYrDMAwG4P2g72C0N046lOOIk6UcZC3tAwhbcUxj2di+4/L2NXRpocONkvi/H/Xjn1/FL6XsAivomhYEsQ7GsVVwvXzvP0HkgmxwDUwKNsowDruP/kwrlhrKi4tZVIWzgqWU+CVl1gt5zE2IxPUyh+Sx1DFZGVHf0JI8tO1RpmcDhhdTTEZBmkwH4rJF+o8d5tlpOgX944nLmwrpfO2uICZLRYEn4/Cx7JrIFuTQy5fHhjsAAAD//wMAUEsDBAoAAAAAAAAAIQCOu+HwhBoAAIQaAAAVAAAAd29yZC9tZWRpYS9pbWFnZTEucG5niVBORw0KGgoAAAANSUhEUgAAAKcAAACvCAYAAAHvQv4XAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAIdUAACHVAQSctJ0AABoZSURBVHhe7Z0LkGRnVccbksxMd68kARHESEjY3ZmJZSgrilR4DDvT3RtEpEDGisnszFYSNtmZnul7eyxFIy6FlA8UjUghKQSS7E7PEqp4hOw8RBQVSqWAKgWMglo8CpWXUCjBEBK83+R/796+93+++/q6b3fP/VX9a7v7O//znXvumZ7u2X6UknLV2d3vu8JN8Ti+ui4aMiWVEidK6k/iJmWJdUlD8cGkuBgidVI/wSTB636GJ2kIf1JdkuB1LSaSHjja/r4SrmZP6ibsSupHlyR4XRGZUKFL4r+sEBMGb2RJ/NfVv4pgwq4JCi4qpKQuzBMaSxakYEml2FBSBQuOm1BBkyp0Jt2aQkyqYGZ22w0n167BxT20SRX+JH5heS8BE5ZlpIQusZIwpIRGCU6DEVIn1TW9r0lTnzSFkaRuEjfRiCeVkgSvq8uxkZIEr6vLfs7/5J16PG46j5QkeF1ddnETij/OUpLgdXVZISb03yAlCV5Xl7UJ/QtSEv919W/QFyIYEEziv64IxivoSAUDpaTBOBdxTpkhTkKFdviDxjgJFZE/psEEwesu/kSRSRX+RMGEKgETlvWwhC6JEgVhCXPHnR6/sNQb3BbeeMvqZbgpFj0r1C0ojpZW7IdgE4kqlOV1hRCOFBA7QYCoQhmx9jFRiBKWi0KLQtlaJlihus3YmhKWUxcq/abxyLtQt8CgsHyevAplxSlhOR66zdiaEpYjC2XFKWE5jC5ItxlbU8Jy1zpu2sO/n19Y5jCDEpb38G/o3zR4uyss763j4h5sHyUs76HGT3vvwxIoYXkPVggTlj1YXiUsdxFZqAtLqITlLqKKZHmUsEyJXagL20AJy3uYLNAlcaEubEMlLHfB4pSwHIvUhbqwApSi1oK4hUjFZC7UhRUUFEK78BcYR7BlJ26BjMVme9NoMXFIUuBA4r9H8AvLgwMrUgnL5llYWK/iYiJYkUpYNo8qNM1PIitSCcvm8ReqdOxk+3YsaWFFKmE5Pf5i4gg2EVakEpZLx1fW6iyvEkI4UlCwoyyGwYpUwrJIZH6pCH+huCkWrEglLItkKnSxaX8TV2PDilTCskjqQnXoCmFrSlgWKQqVCmFrSlgWKQqVCmFrSlgWGaZCP4WLnEEpNBJWKNtICcs9K7TasL6Di2EGpdBq3XpE+9RmEAp1invULVIsNu9CDzTs7waLHLhCq43W/8YqUpFXoeVG+2uxi3Tpd6GVhvWlxEUy2EZKWE5c6HRn93tYdoq0/y1xkeWa/TZc7IJtpoTlRIVOdbYfxlKpUrf/OXmR9dbvSYHBzVxhOXah050dr5PluvVpf3G+vR/3WATBmZFTxODh38wvLMcrtLP9KG5Sd+YfDe63t+fMqQsRwmEmJWfJOzp/Ea6wFGsNV527IHuX7nX1QtcfOII/0B7MrFS6an4MIaGCcHNkobhYqtTsd9E9nmM/ESEeYqEKlkSpNNO6BCFdReEmbaEuTifvYrmrs2tPQUgX2kIVLJnSRG3t6QjxCsPVyEIr9dafsJylZ8sv+YgsVMGSKlWONJ+FkK5TGixy2veD49xP/gHLVXqedSVCKLEKVbDkSuNzrRcixEMqsly3X8NylGebz0aISOxCFWwTpYla+xcRsodXqL/I2bUW8zr31/MI0ZKoUAXbTMnZ8DUI8QrF1dLE7Nr1zFOds9cQEkniQhXOY8TQA1mlSqP9boR4jNVXX0Jja9YphMQiVaEKsVjnVyFCSuOz7TqLKTesNyCkC1XMwkp7F1e7SF2oghWhNNGw/2v8iNVga9Wj1t2we6giXPWkUAUrRlK51voL2PY4vrL+DX+RUYItPc5vGToGfjn3n59BeBesIEmwZMN5fvMgK1DJuUf4KsIo/mKkU28U54H2V0JFNvRF+ulboQp1is8XaX8NN8fmxtVkL/HMRLXW+nvnLijxn833Fd6v7xiCZbiYn5+/ABf7AmucJFiGC/9/mx1rtr+Lm3sGa5wkWIYLf0ODQohRWOMkwZIvrDEmhPSZYY2TBEsXuv+C1wn25LBkprS0sv4gtkkNa5wkWLrItaG4SYvuR14JYcZgjZMES2qMHEfSJMGGLixbNpZ6AmucJFhS4z8u3JScpElUQ3GxL7DGSYIlNUl7QTGSJAJ28JJg8WAxkmBJjZFeGEkSATt4SbB4sBhJsKTGSC+MJImAHbwkWDxYjCRYUmOkF0aSRMAOXhIsHixGEiypMdILI0kiYAcvCRYPFiMJltS4fVhstj+Om5JTNPQ8x1atB3AxPUVDDRO3oewAJMHiwWIkweLBYiTBkplq3XrI/as6bopP0dDzuE1kcpbl1+j4KRqqGmk9zJrIVCpF/IF9PzdUvfyXNU0SbHr2Y0PLjdY3WcMkwRaf/dLQAw3ry6xhkmDrDewAJMHiwWIkweLBYiTBEqLSsD/PGiYJtt7CDkASLB4sRhIsHiwmKP/Lff34X1QQR7Alp1K335g0ETsQSbB4sBhJsHiwGFdSI8u11gP+44sSbMkp163XsYSuEEZhByQJFg8WIwkWDxYzvbnzCJa7KDfa/8iOSxL9TMY4VGqt21lCSbCFYAfHhHAPFiMJFo+odUWlYf0VOw5JpYOr47CGiPML2oMl10l6EBs8yKAQ5sFiJMHiId2uqMyt3cfqllS65sTFsFLcZsZuqAvbTCenkAqsXfgb4ReWPViMJFi0lOutDVanpNJ1q0+GVUvqhrqwzXUqzd5MX98f1ZTguk6wUCbq9ltZXZJK1648DdZYZG6oCytGp7G59mFYu5Ca4m9YlGDpolK3/pjVIan03PPvw0iCsYa6sOJ0Kr9w+adh1cIa55f/7RB+nEclv8P2lVSaaU7BmgrjDXVhxeo0Nrf2s7BSWBOVpEZWatar2D6SxueaNVgz0bOGurDidRqfs1Zh7SLUTKGRF821bmJ5JVVm126G1Qg9b6iLU3zk2wP8qtTW3gJrF6qZuNjF2Kz9MpZH0kTN/hVYjdK3hrpIb7+R5Pwy+RtYKWOzzRcxnyTnmdBvwRqLxZPWvyR5N0LfG+rCDlanSt3+HKx7XHBklb6dSJJzYt4MayT+pigNRUNd2MHrVG1Y9MMIJDkn4r3YSmSp2X7U34ighqqhLqwZWVSt2doXGhxbbr/af/C9ELbKl6rwmR1x5TTyP5AqNvNLy09lDXHVt3d09ZJKwv+zqaR4R5nESDbUpXrU+gJroKtyw4r9/sE0jFxDXcr1Vtcffsu11texVJCFiXrrHC4W5EXoaatGsBRIsKZJgqVAgjVNEiwFEqxpkmAZHtRDj2PN9S/gas9hTZMEy/Dgf4A8MzOj/3gwA7CmSYJlePA30xWWegJrmiRYhgfWTKUbmtZzEWIU1jRJsAwPrJF+IcwYrGmSYMkP1pCsWlpZ/xjSZ4Y1TRIsXbD64gj2ZLBEpnTqVMoXWflgTZMESxesrjiCPRkskSk56fdnMxeX2xu4SYt/Q0k33tb+OYRnhjVNEiypWFqxv+g/BtycDNdsopnHlu2vIMwYrGmSYEnFwDRT/YcXlo3DmiYJllQMRDNxc89gTZMESypybaZzMd5b7TLCmiYJllTk0syF2277IVzsC6xpkmBJRS7NTAM7cKapjZ3fgMWDxUmCJRUj18zJjZ3Q16+xOEmwpGLkmnl4Y+dVsHiwOEmwpGL0JnNz65dg8WBxkmBJxejdZ75zK/TxbCxOEiypGL3J7OyEXqXM4iTBkorRm8yN3WVYPFicJFhSMXqTubF9KyweLE4SLKkYuWYe3ti+BRYPFicJllSMXDMPbW4fh8WDxUmCJRX+ZuKm5AxSMw93thZg8WBxkmBJhdtMXE3HIDXz4JmdG2DxYHGSYEmFaiYupmewJnP7F2DxYHGSYMmPgZrMjZ2fh8WDxUmCJT/iNPPyd7znElY80+HOuVnYPFgc0+Ez2y+FxYPFSYLFCOqVzrgYn0Fq5tSZndAbYFmcJFgy43/pOG6Kx0BN5ua5F8HiweIkwZIJfyMTN3SgJrOzU4fFg8VJgiU1rJGuEKJnoCazs5vaqwRLKlgDg0KozCA1c/rM7gtg8WBxkmBJDGucJFg4AzWZd289DxYPFicJlkSwhkmqNNrfgI0zSM08eHrrObB4sDhJsMSGNUySercybDIDNZmn7/spWDxYnCRYYsEaJkl9MCpsegZqMjtbPwGLB4uTBEskrGGSqo0EX8E2UJPZ2boaFg8WJwkWLaxhkqp1i34YoMggNfOZne0fg8WDxUmCRYQ1TJL6rljYkjEwk7lxX+iDoVicJFgorGE6wZaOgZjMe953EBYPFicJlhCsWTrB1hv6Npn3vO8KWDxYHBPCQ7BmiUr7o52EfjXzyjvvDX2QHosLCqEhaMNkpW+kSlCp29/GVS39auZld73/R2DxYHF+ISxEoFGRgi05/iSVhh35OKpfzbyi877QZ3uyOFcICeE/vjiCLTks2YGIx1P9aubT7n73k2DxYHFKWA5Bj08j2JLDknnS3Pn2q5lqH1g8WByWQtDj0gi2EIsr1kdwkcOSMSG8i34188p7PxD6kOZgDG4OwY5FJ9hCLK62/1o97sbVMCyZTrB1Mbm5/ZnggTH1spm4KQQ7Bp1gC3G8af25+4wQN4WpNKwTLKlOsHYxeXbnE/6DY+pVM3E1BKtdJ9hCLK3aHbeR2mYqJmbXFlhynWDtYnpz50P+BgSVqZl38mbiYghWs06wURK/cKs8t/pStolOsHYxvbl9X7ARrrI08+DprSfAEgmrVSfYRFK9Cm58dq3ONtMJ1i6mNrY2WEP60UxWo06waUnVTMXEkfa1bFOdYO1i6uzum4MN6XUzWW06wRZJ6mYqLppdu5ptrhOsXUxu7PyuvyG9bCarSSfYYpGpmXtcu/pMVoROcHYxubH9a25DetVMVotOsMUmezMVs2tPYcXoBGcXThNXVEOyNNMJpW9uZTXoBFsizDRTcc2Ji1lROsHZxeTmuRvSNhOhIdjeOsGWGHPNVFxzosKK0wnOIKHpYs3zC2Eh2J46wZYKs81UXDU/xorUCU4trIGuEBKC7aUTbKkx38w95i9gxeoEowhrohKWQ7A9dIItEz1q5h6PY0XrBB9l0Bup6GUz92DF6wRbiEFvpKLnzVSwg9AJti6ecs9udZAbqehLMxXsYHSCrZtTp8ZwKQTLoRNsRulbMxXsoHSCLRLm1Qk24/S1mQp2cDrBJsI8OsEWmyRN6XszFewgdYItBIvVCbZYpGlKLs1UsIPVCTYPFqMTbJEsNdvf8zckSVNya6aCHbROsPWkkUsr7Q/5G+EXQiLJtZkKdvAmhW1EXnHLLVf4G8CE0Ehyb6aCNcGEkF7Ef+C9ELbpP6wZWYS0IuzgTQtb5QNrShohXSQ33Go9lzXBlLBNfrDmJBHSJII1wi+EDSesSXEEeyquOXHiItZIJYQML6xZOsGWmWMr7a+PXDMVrGlMCDfKyDVTwZrnF8J6wrFl+5Uj1UwFa6ISlguSUjTSMEUjCwoGBf9/IpoU0hcUpIcNlgkhfUFBethgmRDSF/SShYX1qnrud+Pq+lW4aaRgg2VCSF/QS9zh9Gtx2XoFloceNlgmhPQFvYQNp1+Ly2tvQuhQwgbLhJC+oJdEDadfx5pW375l3RRssEwI6Qt6SZLhDKpUyv7lwL2GDZYJIX1BL8kynH7dcPLkpUg5ULDBMiGk39+wQRh0LdzafBbKzx02WCaE9JEcX1mrsx71Sti2P7AChknOM//Qd7z0EzZYJoT0key74VxasR9ebLa/bUJLK+0H2R5ptbhiP3L9zTeHPr0vL9hgmRDSR7JwW3OW9T2TnB6z3ith2/7ACtB95G5STDzmXFpevxvpBg42WCaE9LkQfLOFXwjpD6yAvIdT3XPDPvCwwTIhpM+FYjgDuv6mlafBMlSwwTIhpM+FfT+ci0377xAy1LDBMiGkz4V9N5xLzfaj162ujuPmkYENlgkhfS7sm+EcddhgmRDS50IxnIZhJzirpju7v470IsxnQkifC8VwGoad4Mzq7P4q0otQnwEhfS4Uw2kYdoKzarpz7peRXoT5TAjpc6EYTsOwE5xVk51z60gvwnwmhPS5UAynYdgJzqrJze0W0oswnwkhfS4Uw2kYdoKz6nBnewXpRZjPhJA+F4rhNAw7wVk1vbF1EulFmM+EkD4XiuE0DDvBWXXozLlXIr0I85kQ0udCMZyGYSc4qyZPb92E9CLMZ0JInwvScB5r2h9FSH9gRRTD+ZgOnT23iPQizGdCSJ8LweFcatr/8NhKn/EX4aoYzsc0eXbrRqQXYT4TQvpccIfz2PL6A7gpH4KDqVQM52M6tLF1PdKLMJ8JIX0uLC7bH8TFfCmGU9bBje15pBdhPhNC+v2N0eE8derC6Y3tmmld9tZ3PhE7iLATnFWHOlsvQ3oR5jMhpN/fmBzOy9/xnktYo7OKfcNrEObLqsmNrZcgvQjzmRDSDxTVuv1/ff2o5WI4ZU2dvv/FSC/CfCaE9ANBtWE97B/KoBBmnmI4ZU1uvP8o0oswnwkhfa6wQdTJsdAvdU9NMZyy1ONdpBdhPhNC+lxwBu3R4OAlkZPCzJAWwylrcnP7hUgvwnwmhPR95UDdeoQNW1pl/iC2YjhlHdrcfj7SizCfCSF9XzhwVP+YMosqDftr2CY5xXDKmrzn/muRXoT5TAjpe8qBWvezb5Oq1K1vYZv0FMMp69Bd73820oswnwkhfU+o1u1vs4EyoWqj/SC2yU4xnLKmNu6/BulFmM+EkN4olXrrW2ygTKhatx7CNuYohlPWobM7kZ8DynwmhPRGcB73fYMNlAk598LfwzbmKYZT1uSZcz+O9CLMZ0JIn4lKw/oqGygTcu4pH8E2vacYzrAOnt6K/O4k5jMhpE/FRN36TzZQpoRt+k8xnOd1xd3nDiO9CPOZENInolKzv8iGyZSwzXAyco85N+6/EulFmC+rpjd3Ev3KdH59/zsbJlPCNsPNqA3nM87cfznSizBfWk11thN9aG6l1vosGyYjatiPYpv+4jzDusd5Bvc/uGqMEXzMeRnSizBfUiUeyob1GTpQhoRt+kul1n5LsBDnQL+D5cyM2nA+/fT2DyO9CPPFVdKhLB+1HgieP5PCNv2lUrf+kBXjV7XRyvw57KM2nE9929aTkV6E+aI0tZlwKGut0RvKct3+bVaMVhkea4zacF721h2jbw+Z7uwm+oN1uW59mp4jQ3K2MPv6yzg4P2mvZcUkFdLFZtSG88p7P3Ax0oswH1GiZ9/VhvUJdj5MqVSavwBbxebYavvD6s+MuJqcypz1alZMViF9LCY3dz5HTk4mDe1wdrYT/Raq1KyPsP6bUumq+TFsFZvFlfaH/P9Bg5uTUa6tNVlBJoWtYuEM6afoCUuhYRxOLMei3LA/yPptSqXn2GVsFZul5vqOfygzDadLpd46zgo0KWeb2I9Vpjs7f8tOXhIN03Di5lhM1FvnWH9NqXTtTT+ArRLR8w/yKtdb86xgkyrNzFyI7SKZ3tjeDZ7IuMptOO+8N/Zw4mosKo3Wu1k/Tak007oEW6Wib58yN1azf4YdgEmVZpYmsF0kU2e33+UfgDjKazgPnt56AtIbwXlMeZb1z5RKMyd+EFtlom/D6TJRW51hB2RSSX6NTHW23s4GgmnYh7Nct+9h/TKl0uya0W9R7vtwulw4Y/0kO0CTKs2tPAnbRXKos3MHGwy/hnU4nYdWb2f9MaXKzPJTsZVRchtOl7EXnJxmB2xS5Vr8L1ud7my9lg2I0rAN50TNvpP1w5RKCfqahtyH0+P5J3+UNcCkxuesyJeeuaivVwkOSV7DOfneDyd6tltprL2JHb8pqXOFrXrK4Ayny/NOXsoaYlJjs6uRryx3mTy9c5M7JHkMJ9LGolJv3cGO15ScZ9/PwFZ9YfCG0+Wq5QOsQSZVObIW+a5Gl6nN7Zf3azinE/6PTrXRfj07PlMan1k+iK36yuAOp8vlSxOsYSY1MduM/ESNuLBhi6ukQ1muW69jx2NKF82evBpb5cLgD6fHiYtYA01q/IjVwGapYUMXpaRDOdFo3c7qN6WJI60XYKtcGaLh9Hg8a6hJjdWaL8deiWHDJynxUNbsdVavKZVnrcgPqe0nwzicHqzBJjU+14r8/p8gbAhDSvrre3btNlafKU002pHf1pEHQz2cLqzhJjVRtyK/Utrl0jvvvZgOJISwWFw0u7bA6jGl8lwr8msL82QkhtOFnQCTqjSsN2CraN7xlxNph7LXL5aZqLfb2GqgGanhdHFOQKZPxI1SuWGdxlZGGZuzXsr2M6VKrXU7thoKRnI4XdT7kNhJMqVyzfozbJWJXr9iy6nzN7FVT5ifn79gcXn9PbhqjJEeTpdeD2m1YX0MWyVifG71OpbPlJyhfD22Ms7iSuv3/cOysNLexZIx9sVwulR7PKSVuvWv2ErLeH21wfymNFGz/ghbGYUNiatiOA3BTqhJOUP6JWzVxXjd6ulQVuesP8VWRlhaWX+QDQZTMZyGYSfYpMqN1lfVPuO1laNs3ZTUK9v3Digji8utk2wQ4qgYzh7BTvgwqFq3d3AIqbjuuuvGj6/YD7GTn1RLy/bnF5vrbzSqFftbbC8lHML+gQ3AIKpy1PoISk6Mc2/0SXayh004nP0HG4hBULlhfxIlZmJm5tSFzr3SI+ykD4twKPsX9SH4bEj6rWrd+hxK6glLzfZn2QAkUS8ecxbEoNrDL3HSyX1C1U+ONe072PBFqRjOnFEfdMuGyLTKdavvQ8m4/mTzxWwQmYrhHBDKR1tfZ0OVVXncU8bl+K1rh9hQuiqGc8CoNqwvsSFLqnLN/gpSDgWvsO2y86z/4WI4hwBnSFN9i8Qg31MmYalpf7kYzgGn3LD/iQ1hUE5c+q9XLijIgvPs/uN0KOvWfyOkoCBf3E8IdoYy+3d+F2SkVPp/Y/zms75nKtAAAAAASUVORK5CYIJQSwMEFAAGAAgAAAAhAJa1reLxBQAAUBsAABUAAAB3b3JkL3RoZW1lL3RoZW1lMS54bWzsWUtvE0ccv1fqdxjtHfyIHZIIB8WODS0EosRQcRzvjncHz+6sZsYJvlVwrFSpKq16KFJvPVRtkUDqhX6atFQtlfgK/c/ser1jj8GQVKUCH7zz+P3fj52xL166GzN0RISkPGl5tfNVD5HE5wFNwpZ3s987t+EhqXASYMYT0vImRHqXtj/84CLeUhGJCQL6RG7hlhcplW5VKtKHZSzP85QksDfkIsYKpiKsBAIfA9+YVerV6nolxjTxUIJjYHtjOKQ+QX3N0tueMu8y+EqU1As+E4eaNbEoDDYY1fRDTmSHCXSEWcsDOQE/7pO7ykMMSwUbLa9qPl5l+2KlIGJqCW2Jrmc+OV1OEIzqhk6Eg4Kw1mtsXtgt+BsAU4u4brfb6dYKfgaAfR8szXQpYxu9jVp7yrMEyoaLvDvVZrVh40v81xbwm+12u7lp4Q0oGzYW8BvV9cZO3cIbUDZsLurf3ul01i28AWXD9QV878LmesPGG1DEaDJaQOt4FpEpIEPOrjjhGwDfmCbADFUpZVdGn6hluRbjO1z0AGCCixVNkJqkZIh9wHVwPBAUawF4i+DSTrbky4UlLQtJX9BUtbyPUwwVMYO8ePrji6eP0cm9Jyf3fjm5f//k3s8Oqis4CctUz7//4u+Hn6K/Hn/3/MFXbrws43//6bPffv3SDVRl4LOvH/3x5NGzbz7/84cHDviOwIMyvE9jItF1cowOeAyGOQSQgXg9in6EaZliJwklTrCmcaC7KrLQ1yeY5dGxcG1ie/CWgBbgAl4e37EUPozEWFEH8GoUW8A9zlmbC6dNV7WsshfGSegWLsZl3AHGRy7Znbn4dscp5PI0LW1oRCw19xmEHIckIQrpPT4ixEF2m1LLr3vUF1zyoUK3KWpj6nRJnw6sbJoRXaExxGXiUhDibflm7xZqc+Ziv0uObCRUBWYuloRZbryMxwrHTo1xzMrIa1hFLiUPJ8K3HC4VRDokjKNuQKR00dwQE0vdqxh6kTPse2wS20ih6MiFvIY5LyN3+agT4Th16kyTqIz9SI4gRTHa58qpBLcrRM8hDjhZGu5blFjhfnVt36ShpdIsQfTOWOR92+rAMU1e1o4ZhX581u0YGuCzbx/+jxrxDryTXJUw336X4eabboeLgL79PXcXj5N9Amn+vuW+b7nvYstdVs+rNtpZbzXH5emh2PCLl56Qh5SxQzVh5Jo0XVmC0kEPFs3EEBUH8jSCYS7OwoUCmzESXH1CVXQY4RTE1IyEUOasQ4lSLuEaYJadvPUGvBVUttacXgABjdUeD7LltfLFsGBjZqG5fE4FrWkGqwpbu3A6YbUMuKK0mlFtUVphslOaeeTehGpAWF/7a+v1TDRkDGYk0H7PGEzDcuYhkhEOSB4jbfeiITXjtxXcpi95q0vb1GxPIW2VIJXFNZaIm0bvNFGaMphFSdftXDmyxJ6hY9CqWW96yMdpyxvCIQqGcQr8pG5AmIVJy/NVbsori3neYHda1qpLDbZEpEKqXSyjjMps5UQsmelfbza0H87GAEc3Wk2LtY3af6iFeZRDS4ZD4qslK7NpvsfHiojDKDhGAzYWBxj01qkK9gRUwjvD5JqeCKhQswMzu/LzKpj/fSavDszSCOc9SZfo1MIMbsaFDmZWUq+Yzen+hqaYkj8jU8pp/I6ZojMXjq1rgR76cAwQGOkcbXlcqIhDF0oj6vcEHByMLNALQVlolRDTvzZrXcnRrG9lPExBwTlEHdAQCQqdTkWCkH2V2/kKZrW8K+aVkTPK+0yhrkyz54AcEdbX1buu7fdQNO0muSMMbj5o9jx3xiDUhfq2nnyytHnd48FMUEa/qrBS0y+9CjZPp8JrvmqzjrUgrt5c+VWbwuUD6S9o3FT4bHa+7fMDiD5i0xMlgkQ8lx08kC7FbDQAnbPFTJpmlUn4t45RsxAUcuecXS6OM3R2cVyac/bLxb25s/OR5etyHjlcXVks0UrpImNmC/868cEdkL0LF6UxU9LYR+7CVbMz/b8A+GQSDen2PwAAAP//AwBQSwMEFAAGAAgAAAAhAKX84X1ECAAAcB4AABEAAAB3b3JkL3NldHRpbmdzLnhtbLRZbY/buBH+XqD/YeHvjsV30c3mIEriJYfkejjnGqDfZEleC6sXQ5J34yv63zvUy3rXGRfZFAUWa4oP5+FwZjhDUW9/+lqVNw952xVNfbsgb7zFTV6nTVbUd7eLPz7bpb+46fqkzpKyqfPbxSnvFj+9++tf3j6uu7zvYVh3AxR1t67S28W+7w/r1apL93mVdG+aQ14DuGvaKunhsb1bVUl7fzws06Y6JH2xLcqiP62o58nFRNPcLo5tvZ4ollWRtk3X7Honsm52uyLNp59Zov2eeUeRqEmPVV73w4yrNi9Bh6bu9sWhm9mqH2UDcD+TPPy3RTxU5TzukXjfsdzHps2eJL5HPSdwaJs07zpwUFXOChb1eWL+DdHT3G9g7mmJAxWIE29oPddcvI6AfkMg0/zr6zj8iWMFks95iux1PPKJpzgblsgfU+YZQXZ8FQVlsx7ux4k/4+qyPtu/jm720crJJn2yT7qniBwZd+XrGPkzxjHAyia9f86Zv85o4onwVJ192H2rFhLVI/Sx2LZJO+aMKaSrdP3hrm7aZFuCOhDaNxCdN4N27j842f0Mzfzr0O9sOzV2pWuA6d9BSvuzaaqbx/Uhb1PY15APPW+xckCS9sVD/qUtXMbb9KcSmNfJ4fBrUsGUnzZfhi36uC4Tlzfzbhlv3ONDXmdN+yG6XUjunrOy/Meca6XrqMtwn6f3MJN7Sl17YL9d/P8m5p7+vrmzfJccy/5zst30zcGxJuAoRSd4fzrs83rIoP+E2jDjnIpJvE0eQemf2yJ737TFn03dJ+XmkKTQOQ8mZJ6r6A5lcjoPjM7SMdSn0yxBx/HpPmnBNnk7EYYg1DblPCprfm36EIpMCzlwUjdrN/vkkEfjqrp3b5t15zqmZXY3D+v8Kzg9z4oeit6hyKoEEhT1xKDjCqN4XO+apq+bPv+tff4EeriktCTj3BfdM99LWXDZNw8XPC97Z5oXgmNlda1j+blNisHi+SA9rPZjcmqO/cfiPv/yxR9NOUhsxmru4mIIrRcV+lOT5S5Ijm3x/ft9iMPByXzyGTrRsctdEENyYKBvem+avm+q9+fg+h8mngx0tglsgWxwm2v8Duafh0I20Z714lFTh54RjxFf+SgiuBSTby4RYSOGIpKGBmfTntERjlBhAhQJPC2mPXGBhB7X+DwREwafJ+aWhBhCiGKeRRFKtEVXSihjuAZECWWmqLhAfEX4lEAukEj5DLU1iT0boJ4jMY0MzhZzQ3DdLIn8KwiNFWoDSpixEkUosQZHuBcFqOeoVEQrFFGejnAZpbRGI4QGwnJcJmJxiMaBQ66sJ+I0RC1KI2EZ6lNGqJ2LwgVCpcTZGCM8QG3NGOUBLsM9ozSK+JLju5EFNOS4TEgMHlXMSmtRi3IX2ajWnDAIERShTOHxxpnSPuofzlXgo7bmglE71dQLRArG8Hl8jwqcTUvPoDYAxOcGRQLB8YwEiKI4W0wZRaNXEOUZdD2CsjDAEcZDiWogONN43hGCKYbGgZDcUlxGQc3CNTDeFW+LiBCJekFEzPPR/CZiYjguE4NBryHKorEjiQhD1DqSSq5RG0guIzz3SuHFeFRBYTQan0dQE6C7USpJ8Ai5Xp1lwGBz4wg3V7Q2RFg0emGdRqIVUMZc4LVeWh5SFFEMjjWobopzQVAbKC6pQLO/EjTAa5aSSknUOkoxiAQU0Z42OBIoGeHzWBYY1KfKSiHRHeyDTQlqa59JKa4hxkPrjw/5bX4BuUCkDCSO+JBKUZ/6PgsIuk99zVSI2sDX3Kc4W0BCi8aBb+CgiPrHjwQJca0t1R6qgYY/H9VaEy/Cd4km0sP3qabKj1FbawZ7GPW2hgwf4hoIKD9oVGnBYo5aRysOBzgckfqKBoZ4eI7Xhlo8EnXIJUNPDtrSyEd9GkBk4yeHgFMPfysIuOD4SgPJrpx7A18FGp/HCCj2KBJCKsfZIkXxvR1YOF6jbEbAUnHEpwY/wxoD2QWNXmN4ZFGLmtALFOqF0FNeiNotFFC5Ud0AESGaQ0KfcY3uhTCgnKKxExqhY1yD0Itxb4chWBSXiSnHsz+kCQ/P/iHs+hi1WyRoHKFeiCQPOOrtSEpK0L0AASIkLhPASwbq0yhkhuMaRCSYr8ouEKia+JtETMQVrSFNhHhdiIXQ+BtLrCRXqLdjLcwVGa0Mbp04kNrHEcs5R/0TW8E0uhvhVSogqA1cGOAnfCuoIOgusQre39FItArOiagXLBRhiuZr61N5RTcotfgbJSARR21ttbAxPk8gI/xuwxp15ZxoQzji42yRivDzgY1p7M33Pg7q3r2t1u7bjLseG1u2qfubapQIk2rbFsnNJ/f1ZuVGbNt7U9Qzvs13TZs/RzbH7QwulyPQVUlZ2jZJZ2BwQjVcakb5bmiXn5L27sw7jWjR3izf/fLE5W6i8/bntjkeRvSxTQ4f6iw/L4Lw0e3Vuqj7j0U193fH7WaWqpP29Aw61tnfH9rBTmfzPK77fV7lzj4fk/MlbV4v/9iMxk7LduOu3/JPyeEw3uJt78jtoizu9v1wj9zDU5a098PD9o5OGB0wOmLDQ5K6lcHoqXHuo3Pfs3Fs7mPnPj73DVfcY1PMfeLcJ+e+4dp7fzrkbVnU97eLp6br3zVl2Tzm2fsz/k3XaIThHvVHr5Gn0eVwDftirMPc4MNLBvclZ7r2Xr0QHkL8Qhd3aZ8WEI6bU7U9X4e/GRUvi67f5IekTfqmnbG/DRjh66xJP8BOgtbQr1RkTDDlRyKeYDHC/4q8yGpG/aXiUbzkcPxeQu1ky9gqA6/sERw36b+njTh/Kn73HwAAAP//AwBQSwMEFAAGAAgAAAAhAEO1vIxBBAAAshUAABIAAAB3b3JkL251bWJlcmluZy54bWzMll1u4zYQx98L9A6CgD46+lZkY52FYsdFim5RINkD0BJtsSEpgaTspE89S4/Wk5SkRMmOk0B24NYvpkxyfhz9ZziaL1+fCbY2kHFU0qntXbm2BWlW5oiup/b3x8UosS0uAM0BLimc2i+Q219vfvzhy3ZCa7KETG60JIPyybbKpnYhRDVxHJ4VkAB+RVDGSl6uxFVWEqdcrVAGnW3Jcsd3PVc/VazMIOeSMwN0A7jd4rLnYbScga00VsDQyQrABHzuGd7RkMgZO8khyD8BJN/Q9w5RwdGo2FFeHYDCk0DSqwNSdBrpjZeLTyP5h6Tr00jBISk5jXSQTuQwwcsKUrm4KhkBQv5la4cA9lRXIwmugEBLhJF4kUw3NhiA6NMJHkmrjkCC/GjCtUPKHOIgN5RyateMTlr7UWevXJ809u3QWUA87Fh53NiBzwJzYWzZEO0a83mZ1QRSoVVzGMRSx5LyAlVddSCn0uRiYSCbjwTYEGz2bStv4FV7r7TNmzD0wCHut7EjuPH8Y6LnDoimQnQWQ1zYP9N4QmQG9wefJM2OuN7A4mMA/gEgzuDAj4VhJC3DyfrbrTho4LUynCYqioN6Yb2BNfC1MzuAvD4K4QfGDzUo8x0Wz0VeHIczMXKULRCgALy7NA1xNbAQGGK4Q2wSDJdZV88UEx4nWtQBX8hODKv15y7qz6ysq56GPke770v2VnVPR7DaC79bhPjnnHkoQCUrOckm92taMrDE0iN5fS15Ay0dAfUrE1kN+hE+63mVP+3DCquHvLZUSbRvZBcIllwwkInfamLt/buXV0l2kxI+YVC2kExNNg1juhKQ3TIIntQWRaFcHTvZAJlWYRRF3iJObEetkBoL9CvcQPz4UkGzp3hZMpR/U2tYrTV7Bamw2eEn0WyeBGGzgjdqAcmhcWoiKiw/5gs/uFvM7nztg/bRmHuNnexxF6SbzGGGCGgPk6xH+YUzaz+1FnL6l8xMYrgSzXT1O1MDouo11bT0MAp95UoB6Fq323HkN5v/OAA4HYG1w6KkgivFeYZkln4zmWA9AMqtB6nzSsEh4CLlCLy/o0il+O8vZ/wDU0SFUmUFZCAa17edgK7bzPA/u5B0MzPl+d4cliKYOchHdw/7zkM6+q6nliiXzgI2ekhbXbQgjhb+daS9PtLu+HZ2ly7iJtv2orqsMYat+6+C+s9ffx8d1fFYJ9jrqL4fwTdUPIsaOtkaNdIgjIMknp1djSAML1SNYCc3onk6Gy/aSnRONZKxTsnLUyPcyY341h+n8/OrEQbhhaoR9WqMo1mSBvF/oMb1peZG3KsRpN4sWfjnrxuR//a38f9X43qnbsyT0PWj8+dGFI8vVI2kV8O/DtP01r87uxqxF+rifQlqOHstb/vmlv5V/a+60bqlnuS1brj1ZOjGrh9HbqKl2muZjUu6K3I0x4xN63zzLwAAAP//AwBQSwMEFAAGAAgAAAAhAJpHDHP/DQAAwYIAAA8AAAB3b3JkL3N0eWxlcy54bWzknVtz27gVgN870//A0VP7kMgX+ZLMOjuOY9eZjbPelbN5hkjIQkMSKkjG9v6b/pb+sQIgKIE+BMUDYj29zGRiSeT5AJwbcHj94cfHLI2+U1Ewnp9N9l/vTSKaxzxh+f3Z5Mvd1avTSVSUJE9IynN6NnmixeTHd3/+0w8Pb4vyKaVFJAF58TaLzyarsly/nU6LeEUzUrzma5rLjUsuMlLKr+J+mhHxrVq/inm2JiVbsJSVT9ODvb3jicGIIRS+XLKYfuBxldG81PJTQVNJ5HmxYuuioT0MoT1wkawFj2lRyEFnac3LCMs3mP0ZAGUsFrzgy/K1HIzpkUZJ8f09/SlLt4AjHOAAAI5j+ohjnBrGVEraHJbgOMcbDkssjl9nLEBSoRAHh00/1B8lbrGKpExWOFxjo6mSJSVZkWLVJi5THHFmEWsHS3n8zWZSnNKONsCnTNkwi99+vM+5IItUkqRXRtKxIg1W/0v7qD/6I33Uvyu1mA/LVH2QWnsnQzfh8Qe6JFVaFuqruBXmq/mm/1zxvCyih7ekiBm7k/2VjWZMtn99nhdsIrdQUpTnBSOdG1fqQ+eWuCitn9+zhE2mqsXid7nxO5FqPzhofrlQPWj9lpL8vvmN5q++zO2eWD8tJPdsQsSr+bkSnJqB1X+t4a6ff1N/HljCHy6kAgRPm8b26vZJVfL5msgEdOnc8rm1ZWqw9d9NY1NgB5nCZEKb13lVbqXLT9KDaDIv5QYFq3/88vFWMC5k7jybvHljfpzTjF2zJKG5tWO+Ygn9uqL5l4Im299/udLuaX6IeZXLz4cnx9o30iK5fIzpWmVTuTUnylKflUCq9q7YtnEt/o8Gtm/s0yW/okRNKdH+c4TuPgpxoCQKa7TdzOrZ2PVeqIYOX6qh2Us1dPRSDR2/VEMnL9XQ6Us1pDF/ZEMsT+TsoPeHzQDqLo4jGtEcR7ChOY5YQnMcoYLmOCIBzXE4Oprj8GM0x+GmCE7JY5cXWs5+6PD2fu7uOcKPu3tK8OPungH8uLsTvh93d3734+5O537c3dnbj7s7WeO59VIr+ijDLC9HR9mS8zLnJY1K+jieRnLJ0nV2GJ6a9KgIMsgAmDqzmYl4NC0m+vtuD9FB6j+fl6ocjPgyWrL7StBidMdp/p2mfE0jkiSSFxAoaFkJh0Z8fFrQJRU0j2lIxw4HTVlOo7zKFgF8c03ug7FongRWX0MMkhQ2Di3r6ZUKEhbAqTMSCz6+a5wEyw+fWDFeVwoSva/SlAZifQ7jYpo1vjbQmPGlgcaMrww0ZnxhYNkslIoMLZCmDC2QwgwtkN5q/wylN0MLpDdDC6Q3QxuvtztWpjrF26uO/eHH7i5Srs6MjO7HnN3nRC4Axk835phpdEsEuRdkvYrUsepurD1mbDvvefIU3TnntN3ooSreNBRq2a89SB2/Znk1Xt8tWqjY2/ACRd+GFyj+NrzxEXgjV9Fq/XYdptyZV4uyM6aHO9ycpFW93h0fjKQc72HbALhioggWBt3YAB78Wa12lTlDJMZtL8d3bMsaH1bPs1LQ7hlkgF6qs6w9WRqBun5aUyGrtm+jSVc8TfkDTcIR56Xgta/ZIX+gTTIo5C+z9YoUTJdSLcTwlUBzyUV0Q9ajB3SbEpaHsdvlq4ywNAq3wLi+u/kU3fG1qkKVYsIA3/Oy5FkwpjlQ+JevdPHXMB08lzVy/hRotOeBjh5p2AULMMnUJJ4EIslVKMtZkDlU836iTwtORBKGditofRFKSQMR5yRb14uOALEl8+KDzD8BVkOa9xsRTB02ChVUd0Fg1lHFolr8ncbjU91nHgU5cPRzVerDk3qpq6XD4cYvE1q48UsEbU05PSj/DTDYFm78YFu4UIO9SElRMOcZVm9eqOE2vNDjHV/8GR5PuVhWaTgFNsBgGmyAwVTI0yrLi5Aj1ryAA9a80OMN6DKaF+CIneb9TbAkmDE0LJQlNCyUGTQslA00LKgBxl/AY8HGX8VjwcZfylPDAi0BLFgoPws6/Qc6CWTBQvmZhoXyMw0L5WcaFsrPDj9EdLmUi+BwU4yFDOVzFjLcRJOXNFtzQcRTIORlSu9JgAOkNe1W8KW6/YXn9TXeAZDqGHUacLFd40IZ+StdBOuaYoXsV4AjoiRNOQ90bG074WjJ9qVtu8T07R+ju3CbkpiueJpQ4RiTW1bWy+qWDHOYHpyyG3TY8xO7X5XRfLU52m9jjs3NHz2STcHeEtvdYJfOj5ubYLrEbmjCqqzpKLzX4vhwuLD26JbwbLfwdiXRkjwaKAnbPN4tuV0ltyRPBkrCNk8HSuo4bUn2xcMHIr51OsJJn/9sajyH8530edFGuLPZPkfaSHa54EmfF7VCJTqPY3W2AFpnWMy45YcFj1seE0VuCiac3JTBceVG9AXYr/Q7UzM7Jmnq9jYXV4C8rxfRgzLnLxWvj9u3TjgNv+fro1w45QWNOjmHw09ctbKMW4+D040bMTjvuBGDE5AbMSgTOcVRKclNGZyb3IjBScqNQGcrOCPgshWUx2UrKO+TrSDFJ1uNWAW4EYOXA24EOlAhAh2oI1YKbgQqUIG4V6BCCjpQIQIdqBCBDlS4AMMFKpTHBSqU9wlUSPEJVEhBBypEoAMVItCBChHoQIUIdKB6ru2d4l6BCinoQIUIdKBCBDpQ9XpxRKBCeVygQnmfQIUUn0CFFHSgQgQ6UCECHagQgQ5UiEAHKkSgAhWIewUqpKADFSLQgQoR6ECt70T0D1QojwtUKO8TqJDiE6iQgg5UiEAHKkSgAxUi0IEKEehAhQhUoAJxr0CFFHSgQgQ6UCECHaj6ZOGIQIXyuECF8j6BCik+gQop6ECFCHSgQgQ6UCECHagQgQ5UiEAFKhD3ClRIQQcqRKADFSL6/NOconRdZr+PP+rpvGJ/+Kkr06lf7Tu9bdThcFTTKzdr+L0I7zn/FnXel3io641hELZIGdeHqB2n1W2uviQCdeLz54v+O3xs+shnMpl7IfQ5UwCfDZUEx1RmfS5vS4Iib9bn6bYkWHXO+rKvLQmmwVlf0tVx2VyUIqcjINyXZizhfYd4X7a2xKGK+3K0JQg13JeZLUGo4L58bAkeRSo5P5c+Gqin4831pYDQ544W4cRN6HNLaKsmHcPAGGo0N2Go9dyEoWZ0E1D2dGLwhnWj0BZ2o/xMDcMMa2r/QHUTsKaGBC9TA4y/qSHK29QQ5WdqmBixpoYErKn9k7Ob4GVqgPE3NUR5mxqi/EwNpzKsqSEBa2pIwJp65ITsxPibGqK8TQ1RfqaGizusqSEBa2pIwJoaErxMDTD+poYob1NDlJ+pQZWMNjUkYE0NCVhTQ4KXqQHG39QQ5W1qiOoztT6K0jI1ysKWOG4RZgniJmRLEJecLUGPasmS9qyWLIJntQRt1dgcVy3ZRnMThlrPTRhqRjcBZU8nBm9YNwptYTfKz9S4aqnL1P6B6iZgTY2rlpymxlVLvabGVUu9psZVS25T46qlLlPjqqUuU/snZzfBy9S4aqnX1LhqqdfUuGrJbWpctdRlaly11GVqXLXUZeqRE7IT429qXLXUa2pcteQ2Na5a6jI1rlrqMjWuWuoyNa5acpoaVy31mhpXLfWaGlctuU2Nq5a6TI2rlrpMjauWukyNq5acpsZVS72mxlVLvabGVUs3UoQFeATUPCOijMI9L+6aFKuSjH844Zdc0IKn32kShR3qJ9Qopw+tt2Mptn7/oNy/lDpTD0i3bldK6gfEGqDe8WOyeYuVElY9icxLuszPusNbuzdbzUjMeVz9ufMNaWeTc8Hq+6e3byPb/KTfhmZ9j4vmS60n+6VmxavLuRlz88oyPQQ46HglRx2bp2g5Bn1VSa3RhK6FIEu+FvKjEniuBMczdfuVsrVdvV/LcvUIHD0vVfD19FoFJ8n77FXHr6uDb0xC2tVD2Z9FWptTfviYJxLwYN5sVvc0eSQ1Sm6/oGl6Q+q9+dq9a0qXZb11f08/PuHZ9kX9JECnvNBThhMwbXem/trvKfWrA8y1DA6dz1meysRIOhSuL60Zq2t371rBu/UB+lhy9VKONc0TprwY9Gz7hOZar0S29LPKNCCwVVJtfofgCyLw8b+o27wo6tFv315oZrHW2wubNwHuiGiHJsoq5WDw9QU0uwY+aETmtYdFfau83HGhnh4o+/PGXJTBdGQov5aT/eGxdlrtperCKr04WskUxtRbY/fldjNYg+3Ql68mbnUWS2i3o+p5fXvj6h+rmhNzpYutmoOjmS71N8o4PtJX0gBdPJ87bpoXgUZzkhfRXMbqsj2VuPYwM4trs5poOrfhjRBXhcxaegLuStd0q3jgqXqp9VKGOdUL4v8JlW8UfJnHZEF/JwlMA+YlSpgEuKX1JL4mrXfMmaJgyuf1bnt7b+S/06t6Z6NyOb3rNZr82+yn1tb1QmXNpYJms33Dt/bRGWWzy+npoS5M1PymedaLVIcsiHr8ta2A5xrdbo02+nmmWceqqkfTu9Ts1ul/zHLTkZKZ0oNMdzAfmxdzYVxzS/s/dc22Ap5rVG6NEhqt//VPtcdo97Rs99/vnpuaojUtkZjncUUSEVcp9NB6ZlJnTzv1aJchDgU1j0FqK2jvcna1f2G8yKow3nMhk3XtgLqC0Pur96uYrv8u/U9/UC+S3ryhOeXibKLeL20UVNcXXrKb2sNLuqlMvISZtHpCr8eJ/+YnXhdJG/UPqZmGRmx3OQE8Te0VtXYbHb4dFZLDS836qe2kR4ezi+bOnfBRvKj/R5RHgyO/+VS8+zcAAAD//wMAUEsDBBQABgAIAAAAIQAu91C5agEAACQEAAAUAAAAd29yZC93ZWJTZXR0aW5ncy54bWyc081vwiAUAPD7kv0PTe9KdWpMY/WybFmyr2QfdwRqicBrAFf73+9Rq6vxYncpj7bvF3g8Fqu9VtGPsE6CyeLRMIkjYRhwaTZZ/PX5MJjHkfPUcKrAiCyuhYtXy9ubRZVWYv0hvMc/XYSKcalmWVx4X6aEOFYITd0QSmHwYw5WU49TuyGa2u2uHDDQJfVyLZX0NRknySxuGXuNAnkumbgHttPC+CafWKFQBOMKWbqjVl2jVWB5aYEJ53A/Wh08TaU5MaPJBaQls+Ag90PcTLuihsL0UdJEWv0B037A+AKYMbHvZ8xbg2Bm15G8nzM7OZJ3nP8tpgPwXS9ifHdcRxhCesdy3POiH3c8IxJyqacFdcW5mKt+4qQjHhpMAdt2TdGvaNMTWOtwhpqlTxsDlq4VStiVETZW1MDhiecThiYU++Z9KEsb5CoEWLUl3l+8LfWb+X55JmFGlYLq/fURJ+Tsbi9/AQAA//8DAFBLAwQUAAYACAAAACEA/BYbYrACAACGCwAAEgAAAHdvcmQvZm9udFRhYmxlLnhtbMSU3U7bMBSA7yftHaLcQ5w0/aGioMGotItxMdgDuI7TWPgnsl3Svv2OnaQElQJGgrVS454cf7G/HJ/zy63g0SPVhim5iNNTFEdUElUwuV7Ef++XJ7M4MhbLAnMl6SLeURNfXnz/dt7MSyWtiWC+NHNBFnFlbT1PEkMqKrA5VTWVcLNUWmALf/U6EVg/bOoTokSNLVsxzuwuyRCaxB1Gv4eiypIR+lORjaDS+vmJphyISpqK1aanNe+hNUoXtVaEGgN7FrzlCczkHpPmByDBiFZGlfYUNtOtyKNgeor8SPAnwDgMkB0AJoRuwxizjpHAzCGHFWGcyZ7DigHnY4sZAIpNECIb9etwFzd9wDKFLaowXP+OEjcXW1xhUz0nljyMmA+IbYFxRR6GTBombbwH7oR7h4LMf62l0njFgQRVGUFhRR7sfuH9uIsf0q2POy3doORuANYuupMbNXOJBYB+92uI7rA00R3VrPRZmNtbyIDER8yP5CUuscZSGZr2iSD3Ck1Qjpzm9pu3iaTC2lD36DYRteESC8Z3fdQ0zJgOzCyp+vgj1sxtvb1l2BpubMwKLeKbMULZzXIZt5F0EV8jOMRofNVFMvcs98nOusioj8AaIEI8B/6kKG05xHP2OfDMpPV24O+eCWqiW9pEf5TA0qs7NJLBekZoDFbGMB4FGdGeG2TE7fXAyHR2aAS9ZQSFG7nGnK00O2Ji6Q34qgAPn14b+Usmsnz6JSZ+wLL4EQ9ffEbcrv9bRXgP0S3WWjWv6Jh0Kj6/LPyKs9n0SYePzNqtPtPRR47rQGehB0RtNKPaNY0jNqbg4My7cIclD7IhVEH1S/2iZFtavL808tHXNAsBvQIf8eDaZds2XfsMq4qPtU00GZrIM9cs9hFnInva9+sm3qyKbmAu/gEAAP//AwBQSwMEFAAGAAgAAAAhAF1T7Hz1AQAAlwMAABEACAFkb2NQcm9wcy9jb3JlLnhtbCCiBAEooAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHyTTW7bMBCF9wV6B0J7iZKVBKkgK0jTOgiaFEWsokV3LDm22VCkQFKWlaNk1zPkCL5YKNqS4yIowAU5873HGf7kF5tKoDVow5WcBkkUBwgkVYzL5TT4Xs7C8wAZSyQjQkmYBh2Y4KJ4/y6ndUaVhm9a1aAtB4OckzQZrafByto6w9jQFVTERI6QLrlQuiLWLfUS14Q+kCXgSRyf4QosYcQS3BuG9egY7C0ZHS3rRgtvwCgGARVIa3ASJfjAWtCVeVPgM6/IituuhjfRITnSG8NHsG3bqE096upP8M+727lvNeSyPysKQZEzmlluBRSzm683X8I5N9YRiAG62v4VtBEK1UQTNON0RdD2SXJKcjyqer1pfv8Baosd0iuVscqgDl0TP3Ehd/6sobvoHPSaU+7m3lkQ9HlNREMo3z7LHQw+3aGSaL4gxm84bNNvSTUQq3Rxy2mELgVsgKPr7XMFj+i+4Y+eH5j+CTxA1yrNzKFGOtS49DXm+DXVS4SL37kHtuDAPnbFJau4dIejCVPa0/8AvUbDmvcvtEjSc8+MgXx/4buqgCF3UdnuWofMj/TqUzkLikk8OQnjNIxPyuQsm5xmcfyrb+hIfzCs9iX83/E0TBI3ykmapR+OHQcD38H+ixXuh0WJb2GI+MXxVypeAAAA//8DAFBLAwQUAAYACAAAACEA+dJ9kS0CAACdBAAAEAAIAWRvY1Byb3BzL2FwcC54bWwgogQBKKAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACkVN1u0zAUvkfiHazct26y0kHlekKdyiZgq9RsuzbOSWvh2JbtViuPsjsegKfoi3GStCFjiAvI1Xd+fPKdz1/CLh4rTXbgg7JmlqTDUULASFsos54ld/li8DYhIQpTCG0NzJI9hOSCv37Flt468FFBIDjChFmyidFNKQ1yA5UIQywbrJTWVyJi6NfUlqWScGnltgITaTYaTSg8RjAFFAPXDUzaidNd/NehhZU1v3Cf7x3O4yyHymkRgd/UJ/WwsLFitMuy3Eahc1UBT7P0HCtdzJZiDYG/YbQF7MH6IvBxNmG0hWy+EV7IiCLy7Gx8xmgvwd47p5UUEfXln5X0NtgyktuGNKkHMNpvYbjICuTWq7jnI0b7IfukDDJI3zHaIuTmxdoLtzkS7CK2kkLDHDXgpdABGP2VYFcg6vtdClUT3MXpDmS0ngT1DW94nJAvIkCt3CzZCa+EiUnb1gYN1i5Ez/PDj7jVltEu08B+Yx+rMU+bBgR/bTxOV1HD/89ugmZDxM93b94QbktULv5BiqwvRcOhFaKls7i+uf44WKkQ0ZqkADI/fNcS5SAOL4IslNwIcngyeLX9JTq01EhPad2cVab2NNTww9JDeLH2aYHfKM9t5YRBb9AOoTe+hjuX28va2sfrf57sWfZBxc3KCYl2ys4n4755eyW2wiwU6MbOT12CXaE+XtcvwLNmDcWp52Wh/hzu278NTyfDET6N/085NHH3G+A/AQAA//8DAFBLAwQUAAYACAAAACEAqlLaZDgBAAChAgAAEwAIAWRvY1Byb3BzL2N1c3RvbS54bWwgogQBKKAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACskjtPwzAQgHck/oPlCQbHbtpCEyWpaNJODAgKA5vlOG2k2I7sa0KF+O+4Lx4rRfLiu/N3352cTN9UgzppXW10igcBw0hqYcpar1L8vFyQCUYOuC55Y7RM8VY6PM0uL5IHa1ppoZYOeYR2KV4DtDGlTqyl4i7wae0zlbGKg7/aFTVVVQtZGLFRUgMNGbuhYuPAKNJ+4fCBF3fwV2RpxM7OvSy3redlyRG+RZWCukzxezHOi2LMxiScRzkZsMGMRMPolrAJY+EszBfR3fwDo3ZXHGKkufKj51ZykKXndRBXdSOhVjILWTgibEjYaMlYvD+vCf1ZkdBT/zNNhr9MjD2YNG3vwGYL7uBRtsYCujqure/7oPJhYvfxQBh1vVc7Pvk3sdFJ7N53e+LdmUui338r+wQAAP//AwBQSwECLQAUAAYACAAAACEAlwIjZ7gBAADcCgAAEwAAAAAAAAAAAAAAAAAAAAAAW0NvbnRlbnRfVHlwZXNdLnhtbFBLAQItABQABgAIAAAAIQCZVX4F/gAAAOECAAALAAAAAAAAAAAAAAAAAPEDAABfcmVscy8ucmVsc1BLAQItABQABgAIAAAAIQAee5HUD0AAAGNJAwARAAAAAAAAAAAAAAAAACAHAAB3b3JkL2RvY3VtZW50LnhtbFBLAQItABQABgAIAAAAIQDvC5PUWAEAAEQIAAAcAAAAAAAAAAAAAAAAAF5HAAB3b3JkL19yZWxzL2RvY3VtZW50LnhtbC5yZWxzUEsBAi0AFAAGAAgAAAAhAG/y1zO1AgAAygsAABIAAAAAAAAAAAAAAAAA+EkAAHdvcmQvZm9vdG5vdGVzLnhtbFBLAQItABQABgAIAAAAIQDydBVztAIAAMQLAAARAAAAAAAAAAAAAAAAAN1MAAB3b3JkL2VuZG5vdGVzLnhtbFBLAQItABQABgAIAAAAIQB/cygK9QgAAOUwAAAQAAAAAAAAAAAAAAAAAMBPAAB3b3JkL2hlYWRlcjEueG1sUEsBAi0AFAAGAAgAAAAhAHtyWZ8JBQAATxcAABAAAAAAAAAAAAAAAAAA41gAAHdvcmQvZm9vdGVyMS54bWxQSwECLQAUAAYACAAAACEAYXld0KwIAACKKAAAEAAAAAAAAAAAAAAAAAAaXgAAd29yZC9oZWFkZXIyLnhtbFBLAQItABQABgAIAAAAIQDEn+D8EwUAAFQXAAAQAAAAAAAAAAAAAAAAAPRmAAB3b3JkL2Zvb3RlcjIueG1sUEsBAi0AFAAGAAgAAAAhAGcfWKqLCAAAiycAABAAAAAAAAAAAAAAAAAANWwAAHdvcmQvaGVhZGVyMy54bWxQSwECLQAUAAYACAAAACEAMGnvVIQIAADxJwAAEAAAAAAAAAAAAAAAAADudAAAd29yZC9oZWFkZXI0LnhtbFBLAQItABQABgAIAAAAIQAxULdXoQgAALYoAAAQAAAAAAAAAAAAAAAAAKB9AAB3b3JkL2hlYWRlcjUueG1sUEsBAi0AFAAGAAgAAAAhAKomDr68AAAAIQEAABsAAAAAAAAAAAAAAAAAb4YAAHdvcmQvX3JlbHMvaGVhZGVyMS54bWwucmVsc1BLAQItABQABgAIAAAAIQCqJg6+vAAAACEBAAAbAAAAAAAAAAAAAAAAAGSHAAB3b3JkL19yZWxzL2hlYWRlcjIueG1sLnJlbHNQSwECLQAUAAYACAAAACEAqiYOvrwAAAAhAQAAGwAAAAAAAAAAAAAAAABZiAAAd29yZC9fcmVscy9oZWFkZXIzLnhtbC5yZWxzUEsBAi0AFAAGAAgAAAAhAKomDr68AAAAIQEAABsAAAAAAAAAAAAAAAAATokAAHdvcmQvX3JlbHMvaGVhZGVyNC54bWwucmVsc1BLAQItABQABgAIAAAAIQCqJg6+vAAAACEBAAAbAAAAAAAAAAAAAAAAAEOKAAB3b3JkL19yZWxzL2hlYWRlcjUueG1sLnJlbHNQSwECLQAKAAAAAAAAACEAjrvh8IQaAACEGgAAFQAAAAAAAAAAAAAAAAA4iwAAd29yZC9tZWRpYS9pbWFnZTEucG5nUEsBAi0AFAAGAAgAAAAhAJa1reLxBQAAUBsAABUAAAAAAAAAAAAAAAAA76UAAHdvcmQvdGhlbWUvdGhlbWUxLnhtbFBLAQItABQABgAIAAAAIQCl/OF9RAgAAHAeAAARAAAAAAAAAAAAAAAAABOsAAB3b3JkL3NldHRpbmdzLnhtbFBLAQItABQABgAIAAAAIQBDtbyMQQQAALIVAAASAAAAAAAAAAAAAAAAAIa0AAB3b3JkL251bWJlcmluZy54bWxQSwECLQAUAAYACAAAACEAmkcMc/8NAADBggAADwAAAAAAAAAAAAAAAAD3uAAAd29yZC9zdHlsZXMueG1sUEsBAi0AFAAGAAgAAAAhAC73ULlqAQAAJAQAABQAAAAAAAAAAAAAAAAAI8cAAHdvcmQvd2ViU2V0dGluZ3MueG1sUEsBAi0AFAAGAAgAAAAhAPwWG2KwAgAAhgsAABIAAAAAAAAAAAAAAAAAv8gAAHdvcmQvZm9udFRhYmxlLnhtbFBLAQItABQABgAIAAAAIQBdU+x89QEAAJcDAAARAAAAAAAAAAAAAAAAAJ/LAABkb2NQcm9wcy9jb3JlLnhtbFBLAQItABQABgAIAAAAIQD50n2RLQIAAJ0EAAAQAAAAAAAAAAAAAAAAAMvOAABkb2NQcm9wcy9hcHAueG1sUEsBAi0AFAAGAAgAAAAhAKpS2mQ4AQAAoQIAABMAAAAAAAAAAAAAAAAALtIAAGRvY1Byb3BzL2N1c3RvbS54bWxQSwUGAAAAABwAHAAjBwAAn9QAAAAA`;
      
      // Asegurar Buffer global (opcional pero recomendado)
      if (typeof global.Buffer === 'undefined') {
        global.Buffer = Buffer;
      }

      // Convertir el base64 a Buffer
      const templateBuffer = Buffer.from(PLANTILLA_DOCX_BASE64, 'base64');

      // Procesar con docxtemplater
      const zip = new PizZip(templateBuffer);
      for (const [nombreArchivo, archivo] of Object.entries(zip.files)) {
        if (archivo.dir || !/^word\/.*\.xml$/.test(nombreArchivo)) continue;
        const contenido = archivo.asText().replace(/servicios|servicio/gi, (valor) => {
          const reemplazo = valor.toLowerCase().replace('servicios', 'obras').replace('servicio', 'obra');
          if (valor === valor.toUpperCase()) return reemplazo.toUpperCase();
          if (valor[0] === valor[0].toUpperCase()) return reemplazo[0].toUpperCase() + reemplazo.slice(1);
          return reemplazo;
        });
        zip.file(nombreArchivo, contenido);
      }
      const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

      // Aplicar los datos (asegúrate de que `data` esté definido)
      doc.render(data);

      // Generar el nuevo documento en base64
      const outputBase64 = doc.getZip().generate({
        type: 'base64',
        compression: 'DEFLATE',
      });

      // Guardar en el dispositivo
      const fileName = `obra_${fCodigo || 'sin_codigo'}.docx`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, outputBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Compartir
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          dialogTitle: 'Compartir obra',
        });
      } else {
      }
              
    } catch (error) {
      Alert.alert('Error', 'No se pudo generar el WORD.');
    }
  };

  const handleDuplicarObra = async(obra, nuevoCodigo, nuevoObra) => {
    try {
        const obra_id = obra.id;
        // Obtener la obra original
        const originalObra = await db.getFirstAsync('SELECT * FROM obras WHERE id = ?', [obra_id]);
        if (!originalObra) throw new Error('Obra no encontrada');
        if (!originalObra) {
            throw new Error('Obra no encontrada');
        }

        // Crear una nueva obra duplicada
        const params = [
          nuevoCodigo || '',
          nuevoObra || '',
          originalObra.elaboradopor_id || null,
          originalObra.aprobadopor_id || null,
          originalObra.identidad || 'obra',
          originalObra.cantidadfisica || 1,
          originalObra.p100utilidades || 0,
          originalObra.p100impuestos || 0,
          originalObra.p100vacaciones || 0,
          originalObra.p100contribuciones || 0,
          originalObra.p100gastos || 0,
          originalObra.p100impuestosft || 0,
          originalObra.precio || 0,
          originalObra.actividadtipo_id || null,
          originalObra.user_id || 1
        ];
        const newObra = await db.runAsync(`
                INSERT INTO obras
                (codigo, obra, elaboradopor_id, aprobadopor_id, identidad, cantidadfisica, p100utilidades, p100impuestos, p100vacaciones, p100contribuciones, p100gastos, p100impuestosft, precio, actividadtipo_id, user_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?)
                `, params);
        // Obtener el ID de la nueva obra creada
        const newObra_id = newObra.lastInsertRowId;
        // Duplicar las partidas
        const obrapartidas = await db.getAllAsync('SELECT * FROM obrapartidas WHERE obra_id = ?', [obra_id]);
        for (const partida of obrapartidas) {
           await db.runAsync('INSERT INTO obrapartidas (obra_id, plantilla_id, importe, salarios, desglosarsalarios, aplicarcoeficiente, coeficiente, coeficienteaplicado) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [newObra_id, partida.plantilla_id, partida.importe, partida.salarios, partida.desglosarsalarios, partida.aplicarcoeficiente, partida.coeficiente, partida.coeficienteaplicado]);
        }

        // Duplicar las subpartidas
        const obrasubpartidas = await db.getAllAsync('SELECT * FROM obrasubpartidas WHERE obra_id = ?', [obra_id]);
        for (const subpartida of obrasubpartidas) {
            await db.runAsync('INSERT INTO obrasubpartidas (obra_id, plantilla_id, costobase, importe, salarios, coeficiente, argumentacion) VALUES (?, ?, ?, ?, ?, ?, ?)', [newObra_id, subpartida.plantilla_id, subpartida.costobase, subpartida.importe, subpartida.salarios, subpartida.coeficiente, subpartida.argumentacion]);
        }
        // Duplicar los recursos humanos
        const obrarhumanos = await db.getAllAsync('SELECT * FROM obrarhumanos WHERE obra_id = ?', [obra_id]);
        for (const humano of obrarhumanos) {
            await db.runAsync('INSERT INTO obrarhumanos (obra_id, actividad_id, idlistado, item, cantidad, cargo_id, pagosadicionales, tiempo, salariodevengado, vacaciones, contribuciones, gastos, impuestos, costo, descripcion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [newObra_id, humano.actividad_id, humano.idlistado, humano.item, humano.cantidad, humano.cargo_id, humano.pagosadicionales, humano.tiempo, humano.salariodevengado, humano.vacaciones, humano.contribuciones, humano.gastos, humano.impuestos, humano.costo, humano.descripcion]);
        }       
        // Duplicar los equipos
        const obraequipos = await db.getAllAsync('SELECT * FROM obraequipos WHERE obra_id = ?', [obra_id]);        
        const fequipos = [];
        for (const equipo of obraequipos) {
          const oldObraId = obra.id;
          const laObraEquipo = await db.runAsync('INSERT INTO obraequipos (obra_id, item, equipo_id, umedida_id, cantidad, costo, mantenimiento, cantidadhe, depreciacion, descripcion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [newObra_id, equipo.item, equipo.equipo_id, equipo.umedida_id, equipo.cantidad, equipo.costo, equipo.mantenimiento, equipo.cantidadhe, equipo.depreciacion, equipo.descripcion]);
          const newObraId = laObraEquipo.lastInsertRowId;
          fequipos.push([oldObraId, newObraId]);
        }
        // Duplicar los insumos
        const obrainsumos = await db.getAllAsync('SELECT * FROM obrainsumos WHERE obra_id = ?', [obra_id]);
        for (const insumo of obrainsumos) {
          const equipoDupla = fequipos.find(dupla => dupla[0] === insumo.equipo_id);
          if (equipoDupla) {
              insumo.hook_id = `[${equipoDupla[1]}]`; // Actualizar con el nuevo ID
          }

          await db.runAsync('INSERT INTO obrainsumos (obra_id, item, insumo_id, cantidad, costo, precio, descripcion, hook_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [newObra_id, insumo.item, insumo.insumo_id, insumo.cantidad, insumo.costo, insumo.precio, insumo.descripcion, insumo.hook_id]);
        }
        await cargarInicial();
        return newObra; // Retornar la nueva obra creada
    } catch (error) {
        throw error; // Propagar el error para manejarlo en el nivel superior
    }
  };

  const decryptData = async (b64Cipher) => {

    const FIXED_KEY = '5f0673dbf7480734aaa6eab6d78da9a7c339e829e7cdc7099255f9653374f0ce';
    const FIXED_IV  = 'dd3d1e591e3504c62ac9695a69bf4169';

    // 1. limpieza del base64 (por si hay saltos de línea)
    
      // 1. Quita TODO lo que no sea Base64
      const clean = b64Cipher
        .replace(/[^A-Za-z0-9+/=]/g, '') // elimina saltos, espacios, ++, etc.
        .replace(/=+$/, '');             // opcional: quita padding extra

      // 2. Descifrar
      const decryptedWA = CryptoJS.AES.decrypt(
        clean,
        CryptoJS.enc.Hex.parse(FIXED_KEY),
        { iv: CryptoJS.enc.Hex.parse(FIXED_IV),
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7 }
      );

      // 3. Obtener el Base64 interno
      const innerB64 = decryptedWA.toString(CryptoJS.enc.Utf8);
      // 4. Devolver el Base64 limpio (lo conviertes a Buffer/Uint8Array después)
      return innerB64;   
  };
  
  async function seleccionarArchivo() {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: '*/*', // o puedes especificar mime si aplica, pero .fik es personalizado
        copyToCacheDirectory: true,
      });   

      const archivo = res.assets[0];
      const uriArchivo = archivo.uri;                           
      // Leer contenido del archivo
      const contenido = await FileSystem.readAsStringAsync(uriArchivo);
      // Aquí procesas el contenido según tu necesidad
      const decryptedData = await decryptData(contenido);
      await addObraDataImport(decryptedData);
    
    } catch (error) {
    }
  }
  
    //Importar Obra de Costos
  /* ---------- helpers promisificados ---------- */
  const executeSql = (sql, params = []) => db.runAsync(sql, params);
  const getRow     = (sql, params = []) => db.getFirstAsync(sql, params);
  const getAll     = (sql, params = []) => db.allAsync(sql, params);
  
  /* ---------- función principal ---------- */
  const addObraDataImport = async (data) => {
    const userId = 1;               // <-- pon el id real
    let obraId = 0;
    let miCliente_id = null;
  
    const frhumanos    = [];
    const fequipos     = [];
    const finsumos     = [];
    const fcargos      = [];
    const fcronogramas = [];
    const laObraEquipos = [];
  
    /* 1. parsear JSON */
    let products;
    try { products = JSON.parse(data); } catch (e) {
      throw new Error('Error al decodificar JSON: ' + e.message);
    }
    if (!Array.isArray(products)) throw new Error('Se esperaba un array');

    const nombresTablasAnteriores = {
      servicios: 'obras',
      serviciopartidas: 'obrapartidas',
      serviciosubpartidas: 'obrasubpartidas',
      serviciorhumanos: 'obrarhumanos',
      servicioequipos: 'obraequipos',
      servicioinsumos: 'obrainsumos',
    };
    const nombresColumnasAnteriores = {
      servicio: 'obra',
      servicio_id: 'obra_id',
      servicio_activo: 'obra_activa',
      serviciorhumano_id: 'obrarhumano_id',
    };
    const normalizarFilaAnterior = (fila) => {
      if (!fila || typeof fila !== 'object' || Array.isArray(fila)) return fila;
      return Object.fromEntries(
        Object.entries(fila).map(([nombre, valor]) => [
          nombresColumnasAnteriores[nombre] ?? nombre,
          nombre === 'identidad' && valor === 'servicio' ? 'obra' : valor,
        ])
      );
    };
    products = products.map((producto) => {
      if (producto?.type !== 'table') return producto;
      const datos = Array.isArray(producto.data)
        ? producto.data.map(normalizarFilaAnterior)
        : normalizarFilaAnterior(producto.data);
      return {
        ...producto,
        name: nombresTablasAnteriores[producto.name] ?? producto.name,
        data: datos,
      };
    });
  
    /* ---------- 1er ciclo ---------- */
    for (const p of products) {
      if (p.type !== 'table') continue;
  
      if (p.name === 'obras') {
        const obra = { ...p.data, user_id: userId };
        delete obra.id;
        const keys = Object.keys(obra).join(',');
        const qs   = '?,'.repeat(Object.keys(obra).length).slice(0, -1);
        obraId = await executeSql(
          `INSERT INTO obras (${keys}) VALUES (${qs})`,
          Object.values(obra)
        ).then(res => res.lastInsertRowId);
        continue;
      }
  
      if (p.name === 'actividades') {
        for (const row of p.data) {
          const oldId = row.id;
          const exist = await getRow(
            'SELECT id FROM actividades WHERE actividad=? AND unidades=? AND um=?',
            [row.actividad, row.unidades, row.um]
          );
          delete row.id; delete row.user_id; delete row.created_at; delete row.updated_at; delete row.obra_id;
          const keys = Object.keys(row).join(',');
          const qs = '?,'.repeat(Object.keys(row).length).slice(0, -1);
          const newId = exist
            ? exist.id
            : await executeSql(
                `INSERT INTO actividades (${keys}) VALUES (${qs})`,
                Object.values(row)
              ).then(res => res.lastInsertRowId);
          frhumanos.push([oldId, newId]);
        }
        continue;
      }
  
      if (p.name === 'equipos') {
        for (const row of p.data) {
          const oldId = row.id;
          const exist = await getRow(
            'SELECT id FROM equipos WHERE equipo=? AND equipotipo_id=?',
            [row.equipo, row.equipotipo_id]
          );
          delete row.id; delete row.user_id; delete row.created_at; delete row.updated_at;
          const keys = Object.keys(row).join(','); const qs = '?,'.repeat(Object.keys(row).length).slice(0, -1);
          const newId = exist
            ? exist.id
            : await executeSql(
                `INSERT INTO equipos (${keys}) VALUES (${qs})`,
                Object.values(row)
              ).then(res => res.lastInsertRowId);
          fequipos.push([oldId, newId]);
        }
        continue;
      }
  
      if (p.name === 'insumos') {
        for (const row of p.data) {
          const oldId = row.id;
          const exist = await getRow(
            'SELECT id FROM insumos WHERE insumo=? AND um=?',
            [row.insumo, row.um]
          );
          delete row.id; delete row.user_id; delete row.created_at; delete row.updated_at;
          const keys = Object.keys(row).join(','); const qs = '?,'.repeat(Object.keys(row).length).slice(0, -1);
          const newId = exist
            ? exist.id
            : await executeSql(
                `INSERT INTO insumos (${keys}) VALUES (${qs})`,
                Object.values(row)
              ).then(res => res.lastInsertRowId);
          finsumos.push([oldId, newId]);
        }
        continue;
      }
  
      if (p.name === 'cargos') {
        for (const row of p.data) {
          const oldId = row.id;
          const exist = await getRow(
            `SELECT id FROM cargos
             WHERE cargo=? AND catocupacional_id=? AND grupoescala=?
               AND salarioescala=? AND tarifahoraria=?`,
            [row.cargo, row.catocupacional_id, row.grupoescala, row.salarioescala, row.tarifahoraria]
          );
          delete row.id; delete row.user_id; delete row.created_at; delete row.updated_at;
          const keys = Object.keys(row).join(','); const qs = '?,'.repeat(Object.keys(row).length).slice(0, -1);
          const newId = exist
            ? exist.id
            : await executeSql(
                `INSERT INTO cargos (${keys}) VALUES (${qs})`,
                Object.values(row)
              ).then(res => res.lastInsertRowId);
          fcargos.push([oldId, newId]);
        }
      }
    }
  
    /* ---------- 2do ciclo ---------- */
    for (const p of products) {
      if (p.type !== 'table') continue;
  
      if (p.name === 'obrapartidas') {
        for (const row of p.data) {
          delete row.id;
          const keys = Object.keys(row).join(','); const qs = '?,'.repeat(Object.keys(row).length).slice(0, -1);
          await executeSql(
            `INSERT INTO obrapartidas (${keys}) VALUES (${qs})`,
            Object.values({ ...row, obra_id: obraId })
          );
        }
        continue;
      }
  
      if (p.name === 'obrasubpartidas') {
        for (const row of p.data) {
          delete row.id;
          const keys = Object.keys(row).join(','); const qs = '?,'.repeat(Object.keys(row).length).slice(0, -1);
          await executeSql(
            `INSERT INTO obrasubpartidas (${keys}) VALUES (${qs})`,
            Object.values({ ...row, obra_id: obraId })
          );
        }
        continue;
      }
  
      if (p.name === 'obrarhumanos') {
        for (const row of p.data) {
          const oldId = row.id;
          delete row.id; delete row.created_at; delete row.updated_at;
          const actDupla = frhumanos.find(d => d[0] === row.actividad_id);
          const cargoDupla = fcargos.find(d => d[0] === row.cargo_id);
          if (actDupla)   row.actividad_id   = actDupla[1];
          if (cargoDupla) row.cargo_id       = cargoDupla[1];
          const keys = Object.keys(row).join(','); const qs = '?,'.repeat(Object.keys(row).length).slice(0, -1);
          const newId = await executeSql(
            `INSERT INTO obrarhumanos (${keys}) VALUES (${qs})`,
            Object.values({ ...row, obra_id: obraId })
          ).then(res => res.lastInsertRowId);
          fcronogramas.push([oldId, newId]);
        }
        continue;
      }
  
      if (p.name === 'obraequipos') {
        for (const row of p.data) {
          const oldId = row.id;
          delete row.id; delete row.created_at; delete row.updated_at;
          const eqDupla = fequipos.find(d => d[0] === row.equipo_id);
          if (eqDupla) row.equipo_id = eqDupla[1];
          const keys = Object.keys(row).join(','); const qs = '?,'.repeat(Object.keys(row).length).slice(0, -1);
          const newId = await executeSql(
            `INSERT INTO obraequipos (${keys}) VALUES (${qs})`,
            Object.values({ ...row, obra_id: obraId })
          ).then(res => res.lastInsertRowId);
          laObraEquipos.push([oldId, newId]);
        }
      }
    }
  
    /* ---------- 3er ciclo ---------- */
    for (const p of products) {
      if (p.type !== 'table') continue;
  
      if (p.name === 'obrainsumos') {
        for (const row of p.data) {
          delete row.id; delete row.created_at; delete row.updated_at;
          const insDupla = finsumos.find(d => d[0] === row.insumo_id);
          if (insDupla) row.insumo_id = insDupla[1];
          if (row.hook_id) {
            const m = row.hook_id.match(/\[(\d+)\]/);
            if (m) {
              const oldHook = Number(m[1]);
              const eq2 = laObraEquipos.find(d => d[0] === oldHook);
              if (eq2) row.hook_id = `[${eq2[1]}]`;
            }
          }
          const keys = Object.keys(row).join(','); const qs = '?,'.repeat(Object.keys(row).length).slice(0, -1);
          await executeSql(
            `INSERT INTO obrainsumos (${keys}) VALUES (${qs})`,
            Object.values({ ...row, obra_id: obraId })
          );
        }
        continue;
      }
  
      if (p.name === 'insumosxequipos') {
        for (const row of p.data) {
          delete row.id; delete row.created_at; delete row.updated_at;
          const insDupla = finsumos.find(d => d[0] == row.insumo_id);
          const eqDupla  = fequipos.find(d  => d[0] == row.equipo_id);
          if (insDupla) row.insumo_id = insDupla[1];
          if (eqDupla)  row.equipo_id  = eqDupla[1];
          const exists = await getRow(
            `SELECT id FROM insumosxequipos
             WHERE equipo_id=? AND insumo_id=? AND indiceconsumo=?
               AND precio=? AND um=? AND umconsumo=?`,
            [row.equipo_id, row.insumo_id, row.indiceconsumo, row.precio, row.um, row.umconsumo]
          );
          if (exists) continue;
          const keys = Object.keys(row).join(','); const qs = '?,'.repeat(Object.keys(row).length).slice(0, -1);
          await executeSql(
            `INSERT INTO insumosxequipos (${keys}) VALUES (${qs})`,
            Object.values(row)
          );
        }
        continue;
      }
  
      if (p.name === 'cronogramas') {
        for (const row of p.data) {
          delete row.id; delete row.created_at; delete row.updated_at;
          const rhDupla = fcronogramas.find(d => d[0] === row.obrarhumano_id);
          const depDupla = fcronogramas.find(d => d[0] === row.dependencia_id);
          if (rhDupla) row.obrarhumano_id = rhDupla[1];
          if (depDupla) row.dependencia_id = depDupla[1];
          const keys = Object.keys(row).join(','); const qs = '?,'.repeat(Object.keys(row).length).slice(0, -1);
          await executeSql(
            `INSERT INTO cronogramas (${keys}) VALUES (${qs})`,
            Object.values(row)
          );
        }
        continue;
      }
  
      if (p.name === 'cliente') {
        const cli = { ...p.data };
        const oldId = cli.id;
        delete cli.id; delete cli.user_id; delete cli.created_at; delete cli.updated_at;
        const exists = await getRow('SELECT id FROM clientes WHERE reeup=?', [cli.reeup]);
        if (!exists) {
          const keys = Object.keys(cli).join(','); const qs = '?,'.repeat(Object.keys(cli).length).slice(0, -1);
          miCliente_id = await executeSql(
            `INSERT INTO clientes (${keys}) VALUES (${qs})`,
            Object.values(cli)
          ).then(res => res.lastInsertRowId);
        } else {
          miCliente_id = exists.id;
        }
        await executeSql('UPDATE obras SET cliente_id=? WHERE id=?', [miCliente_id, obraId]);
      }
    }
  };
  
  const getObraDataExport = async (obra_id) => {     
      try {
          // Consultar la obra
          const obra = await db.getFirstAsync('SELECT * FROM obras WHERE id = ?', [obra_id]);
          if (!obra) throw new Error('Obra no encontrada');
          // Consultar las partidas
          const obrapartidas = await db.getAllAsync('SELECT * FROM obrapartidas WHERE obra_id = ? ORDER BY plantilla_id', [obra_id]);
          // Consultar las subpartidas
          const obrasubpartidas = await db.getAllAsync('SELECT * FROM obrasubpartidas WHERE obra_id = ? ORDER BY plantilla_id', [obra_id]);
          // Consultar los recursos humanos
          const obrarhumanos = await db.getAllAsync('SELECT * FROM obrarhumanos WHERE obra_id = ? ORDER BY item', [obra_id]);
          // Consultar los equipos
          const obraequipos = await db.getAllAsync('SELECT * FROM obraequipos WHERE obra_id = ? ORDER BY item', [obra_id]);
          // Consultar los insumosxequipos (filtrado por equipos de la obra)
          const insumosxequipos = await db.getAllAsync('SELECT insumosxequipos.* FROM insumosxequipos INNER JOIN obraequipos ON obraequipos.equipo_id = insumosxequipos.equipo_id WHERE obraequipos.obra_id = ?', [obra_id]);
          // Consultar los insumos
          const obrainsumos = await db.getAllAsync('SELECT * FROM obrainsumos WHERE obra_id = ? ORDER BY item', [obra_id]);
          // Consultar las Actividades involucradas
          const actividades = await db.getAllAsync('SELECT actividades.* FROM actividades INNER JOIN obrarhumanos ON obrarhumanos.actividad_id = actividades.id WHERE obrarhumanos.obra_id = ?', [obra_id]);
          // Consultar los Equipos involucrados
          const equipos = await db.getAllAsync('SELECT equipos.* FROM equipos INNER JOIN obraequipos ON obraequipos.equipo_id = equipos.id WHERE obraequipos.obra_id = ?', [obra_id]);
          // Consultar los Insumos involucrados
          const insumos = await db.getAllAsync('SELECT insumos.* FROM insumos INNER JOIN obrainsumos ON obrainsumos.insumo_id = insumos.id WHERE obrainsumos.obra_id = ?', [obra_id]);
          // Consultar cronogramas (opcional)
          let cronogramas = null;
          try {
              cronogramas = await db.getAllAsync('SELECT cronogramas.* FROM cronogramas INNER JOIN obrarhumanos ON obrarhumanos.id = cronogramas.obrarhumano_id WHERE obrarhumanos.obra_id = ?', [obra_id]);
          } catch (error) {
          }

          // Consultar cliente
          let cliente = null;
          try {
              cliente = await db.getFirstAsync('SELECT clientes.* FROM clientes INNER JOIN obras ON obras.cliente_id = clientes.id WHERE obras.id = ?', [obra_id]);
          } catch (error) {
          }

          // Preparar el nombre del archivo
          const originalName = `Obra ${obra.codigo}-${obra.obra}.fik`;

          // Preparar los datos para exportar
          const fichero = [
              { type: "header", version: "1.0.0", author: "Lic. Alexei Gómez Ruiz", comment: "Exportado desde ENCODIGO APK", platform: "APK", date: new Date().toISOString().split('T')[0] },
              { type: "database", name: "encodigo" },
              { type: "table", name: "obras", database: "encodigo", data: obra },
              { type: "table", name: "cliente", database: "encodigo", data: cliente },
              { type: "table", name: "obrapartidas", database: "encodigo", data: obrapartidas },
              { type: "table", name: "obrasubpartidas", database: "encodigo", data: obrasubpartidas },
              { type: "table", name: "obrarhumanos", database: "encodigo", data: obrarhumanos },
              { type: "table", name: "obraequipos", database: "encodigo", data: obraequipos },
              { type: "table", name: "obrainsumos", database: "encodigo", data: obrainsumos },
              { type: "table", name: "insumosxequipos", database: "encodigo", data: insumosxequipos },
              { type: "table", name: "actividades", database: "encodigo", data: actividades },
              { type: "table", name: "equipos", database: "encodigo", data: equipos },
              { type: "table", name: "insumos", database: "encodigo", data: insumos },
              { type: "table", name: "cronogramas", database: "encodigo", data: cronogramas },
          ];

          // Convertir a JSON
          const data = JSON.stringify(fichero);
          return { fileName: originalName, data };
      } catch (error) {
          throw error;
      }
  };

  return (
    <View style={styles.container}>

      <ScreenHeader
        title="OBRAS"
        count={todos}
        onBack={() => router.back()}
        rightAccessory={
          (isPremiumDisabled() || lalicencia?.licenseKey === 'TRIAL') ? (
            <TouchableOpacity
              onPress={() => setShowLicenseAlert(true)}
              style={{ marginLeft: 8, marginRight: 8 }}
            >
              <FontAwesome5 name="exclamation-triangle" size={20} color="#ff9800" />
            </TouchableOpacity>
          ) : null
        }
      />
     
      {cadenafiltro ? (
        <Text style={commonStyles.headerFiltro}>
          Obras filtrados por "{cadenafiltro}"
        </Text>
      ) : null}

      <ScrollView
        style={{ paddingHorizontal: 12 }}
        onScroll={({ nativeEvent }) => {
          const cercaDelFinal = nativeEvent.layoutMeasurement.height + nativeEvent.contentOffset.y
            >= nativeEvent.contentSize.height - 120;
          if (cercaDelFinal) cargarMas();
        }}
        scrollEventThrottle={300}
      >
        {obrasFiltradas.length === 0 && (
          <Text style={styles.emptyText}>
            {obras.length === 0
              ? 'No hay obras registradas.'
              : 'No hay obras que coincidan con el filtro.'}
          </Text>
        )}
        {obrasFiltradas.map(obra => (
          <Swipeable
            key={obra.id}
            renderRightActions={() => (
              <RectButton
                accessibilityRole="button"
                accessibilityLabel={`Eliminar obra ${obra.obra}`}
                onPress={() => handleEliminarObra(obra.id)}
                style={styles.swipeDeleteAction}
              >
                <FontAwesome5 name="trash" size={18} color="#fff" />
              </RectButton>
            )}
          >
            <View style={commonStyles.detallesItemContainer}>            
            <Text style={{ fontSize: 10, paddingTop: 4}}>
               {obra.codigo || "S/C"} 
            </Text>
            <Link href={{ pathname: '/Preliminares', params: { obraId: String(obra.id) } }} asChild >
              <TouchableOpacity>
                <Text style={{ color: '#192f6a',  fontSize: 16, fontWeight: '800', paddingTop: 8}} >{obra.obra}</Text> 
              </TouchableOpacity>
            </Link>   
            <Text style={{fontSize: 16}}>Cliente: {obra.cliente}</Text>

            <View style={{ flexDirection: 'row',  gap: 2, marginTop: 4, marginBottom: 2 }}>
              <View style={{ alignItems: 'center', flex: 1, minWidth: 60 }}>
                <Text style={{ fontSize: 14, color: '#666' }}>Precio total</Text>
                <Text style={{ fontSize: 14 }}>  ${Number(obra.precio_asignado ?? 0).toFixed(2)}</Text>
              </View>
               <View style={{ alignItems: 'center', flex: 1, minWidth: 60  }}>
                <Text style={{ fontSize: 14, color: '#666' }}>Objetos de Obra</Text>
                <Text style={{ fontSize: 14 }}> {Number(obra.objetos_asignados ?? 0)}</Text>
              </View>
              <View style={{ alignItems: 'center', flex: 1, minWidth: 60  }}>
                <Text style={{ fontSize: 14, color: '#666' }}>Renglones </Text>
                <Text style={{ fontSize: 14 }}> {Number(obra.renglones_asignados ?? 0)}</Text>
              </View> 
            </View> 

           

            <View style={styles.botonesListadoObras}>
                
            
              <View style={styles.botonesContainer}>
                <TouchableOpacity onPress={() => handleSaveObra(obra)} style={[commonStyles.buttonObraFlotante, {backgroundColor: "#ffffff"}]}>
                <FontAwesome5 name="save" size={20} color="#4c669f" />
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => handleEditarObra(obra)} 
                style={[
                  commonStyles.buttonObraFlotante, 
                  {backgroundColor: "#ffffff"}, 
                  isPremiumDisabled() && { opacity: 0.3 }
                ]}
                disabled={isPremiumDisabled()}
              >
                <FontAwesome5 name="edit" size={18} color={isPremiumDisabled() ? '#999' : '#4c669f'} />
              </TouchableOpacity>


              <TouchableOpacity
                onPress={() => { setObraADuplicar(obra); setDuplicarFormData({ codigo: obra.codigo + '-Copia', obra: obra.obra + '-Copia' }); setDuplicarModalVisible(true); }}
                style={[
                  commonStyles.buttonObraFlotante,
                  {backgroundColor: "#ffffff"},
                  (lalicencia?.licenseKey === 'TRIAL'  ||  isPremiumDisabled() ) && { opacity: 0.3 }
                ]}
                disabled={lalicencia?.licenseKey === 'TRIAL'  ||  isPremiumDisabled()}
              >
                <FontAwesome5 name="plus" size={18} color={lalicencia?.licenseKey === 'TRIAL' ||  isPremiumDisabled() ? '#999' : '#4c669f'} />
              </TouchableOpacity>
                {/* ax6 */}
              <TouchableOpacity onPress={() => handleExportarObraWORD(obra)} 
                style={[
                  commonStyles.buttonObraFlotante, 
                  {backgroundColor: "#ffffff"}, 
                  isPremiumDisabled() && { opacity: 0.3 }
                ]}
                disabled={isPremiumDisabled()}
              >
                <FontAwesome5 name="file-word" size={20} color={isPremiumDisabled() ? '#999' : '#4c669f'} />
              </TouchableOpacity>
              </View>
            </View>
           
            {obra.obra_activa ? (
              <View style={commonStyles.etiquetaObraActiva}>
                <FontAwesome5 name="check-circle" size={15} color="#eeff04" />
                
                <Text style={{ fontSize: 14, color: '#eeff04' }}>
                  OBRA ACTIVA
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Activar obra ${obra.obra}`}
                onPress={() => activarObra(obra)}
                style={commonStyles.etiquetaObraInactiva}
              >
                <FontAwesome5 name="check-circle" size={15} color="#192f6a" />
                <Text style={styles.activateWorkButtonText}>Activar</Text>
              </TouchableOpacity>
            )}
            
            </View>
          </Swipeable>
        ))}
      </ScrollView>

      {filtroVisible ?  
      <Pressable
        style={commonStyles.buttonFlotanteEliminarFiltro}
        onPress={() => eliminarelFiltro()}
      >
        <FontAwesome5 name="trash" size={12} color="red" />
      </Pressable>
      : ''}

      <Modal
        visible={modalFiltroVisible}
        animationType="slide"
        transparent
        onRequestClose={cancelarFiltroObras}
      >
        <View style={styles.modalFiltroOverlay}>
          <View style={styles.modalFiltroContainer}>
            <Text style={styles.modalFiltroTitle}>Filtrar obras</Text>
            <Text style={styles.label}>Código, obra o cliente</Text>
            <TextInput
              ref={filtroRef}
              style={commonStyles.input}
              placeholder="Escribe para buscar..."
              value={filtro}
              onChangeText={setFiltro}
              autoCapitalize="none"
            />
            <View style={styles.modalFiltroBotones}>
              <TouchableOpacity
                style={commonStyles.buttonAgregar}
                onPress={handleFiltrar}
              >
                <Text style={commonStyles.buttonTextAgregar}>Filtrar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={commonStyles.buttonCancelar}
                onPress={cancelarFiltroObras}
              >
                <Text style={commonStyles.buttonTextAgregar}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Pressable
        style={commonStyles.buttonFlotanteImportar}
        onPress={() => {
          setFiltroObra(filtroObraAplicado);
          setModalFiltroVisible(true);
        }}
      >
        <FontAwesome5 name="filter" size={18} color="#ff9800" />
      </Pressable>

      {filtroObraAplicado ? (
        <Pressable
          style={styles.buttonLimpiarFiltroObras}
          onPress={limpiarFiltroObras}
        >
          <FontAwesome5 name="trash" size={12} color="red" />
        </Pressable>
      ) : null}

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

     
      
      <Pressable 
        onPress={() => {
          if (!isPremiumDisabled() && resumen.totalObras >= 3) {
            // Opcional: mostrar alerta cuando se alcanza el límite
          Alert.alert(
            'Límite de obras alcanzado',
            'Has alcanzado el máximo de obras permitidas. Actualiza a Premium para crear obras ilimitadas.',
            [
              { text: 'Cancelar', style: 'cancel' },
              { 
                text: 'Ir a Zona de Licencia', 
                onPress: () => router.push('/Licencia'),
                style: 'default'
              }
            ]
          );
          } else {
            abrirNuevoObra();
          }
        }} 
        style={[
                  commonStyles.buttonFlotante,                    
                  isPremiumDisabled() && { opacity: 0.3 }
                ]}
                disabled={isPremiumDisabled()}  
      >
        <FontAwesome5 name="plus" size={20} color={isPremiumDisabled() ? '#999' : '#fff'} />
      </Pressable>

      <Modal 
        visible={modalVisible} 
        animationType="slide"         
        transparent={false}
        onRequestClose={cancelarFormulario}
      >
        <ScrollView style={styles.modalContainer}>
          <Text style={styles.modalTitle}>
          {editarId ? 'Editar Obra' : 'Agregar Nueva Obra'}
          </Text>

          <Text style={styles.label}>Código</Text>
          <TextInput
            style={styles.input}
            value={formData.codigo}
            onChangeText={text => handleChange('codigo', text)}
          />

          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            value={formData.obra}
            onChangeText={text => handleChange('obra', text)}
          />

          <Text style={styles.label}>Cliente</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={formData.cliente_id}
              onValueChange={value => handleChange('cliente_id', value)}
            >
              {clientes.map(c => (
                <Picker.Item key={c.id} label={c.cliente} value={String(c.id)} />
              ))}
            </Picker>          
          </View>

          <Text style={styles.label}>Tipo</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={formData.identidad}
              onValueChange={value => handleChange('identidad', value)}
            >
              <Picker.Item label="Producto" value="producto" />
              <Picker.Item label="Obra" value="obra" />
            </Picker>
          </View>

          <Text style={styles.label}>Cantidad</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={formData.cantidadfisica}
            onChangeText={text => handleChange('cantidadfisica', text)}
          />

          {/* Campos porcentuales y otros */}

          <Text style={styles.label}>Porcentaje Utilidades (%)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={formData.p100utilidades}
            onChangeText={text => handleChange('p100utilidades', text)}
          />

          <Text style={styles.label}>Porcentaje Impuestos (%)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={formData.p100impuestos}
            onChangeText={text => handleChange('p100impuestos', text)}
          />

          <Text style={styles.label}>Porcentaje Vacaciones (%)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={formData.p100vacaciones}
            onChangeText={text => handleChange('p100vacaciones', text)}
          />

          <Text style={styles.label}>Porcentaje Contribuciones (%)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={formData.p100contribuciones}
            onChangeText={text => handleChange('p100contribuciones', text)}
          />

          <Text style={styles.label}>Porcentaje Gastos (%)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={formData.p100gastos}
            onChangeText={text => handleChange('p100gastos', text)}
          />

          <Text style={styles.label}>Porcentaje Impuestos FT (%)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={formData.p100impuestosft}
            onChangeText={text => handleChange('p100impuestosft', text)}
          />

          <Text style={styles.label}>Porcentaje OSDE (%)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={formData.p100osde}
            onChangeText={text => handleChange('p100osde', text)}
          />

          <Text style={styles.label}>Contribución Especial</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={formData.contribucionespecial}
            onChangeText={text => handleChange('contribucionespecial', text)}
          />

          <Text style={styles.label}>Argumentación</Text>
          <TextInput
            style={[styles.input, {height: 80}]}
            multiline
            value={formData.argumentacion}
            onChangeText={text => handleChange('argumentacion', text)}
          />

          
        </ScrollView>
        <View style={styles.buttonsRow}> 
          <TouchableOpacity style={commonStyles.buttonAgregar} onPress={handleGuardarObra} >
                <Text style={commonStyles.buttonTextAgregar}>{editarId ? "GUARDAR" : "AGREGAR"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={commonStyles.buttonCancelar} onPress={cancelarFormulario} >
                <Text style={commonStyles.buttonTextAgregar}>CANCELAR</Text>
              </TouchableOpacity>
        </View>
      </Modal>

      <Modal
        visible={duplicarModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setDuplicarModalVisible(false)}
      >
        <ScrollView style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Duplicar Obra</Text>

          <Text style={styles.label}>Código</Text>
          <TextInput
            style={styles.input}
            value={duplicarFormData.codigo}
            onChangeText={text => handleChangeDuplicar('codigo', text)}
          />

          <Text style={styles.label}>Obra</Text>
          <TextInput
            style={styles.input}
            value={duplicarFormData.obra}
            onChangeText={text => handleChangeDuplicar('obra', text)}
          />

          <View style={styles.buttonsRow}>
            <Button title="Duplicar" onPress={() => {
              if (!duplicarFormData.codigo.trim() || !duplicarFormData.obra.trim()) {
                Alert.alert('Validación', 'Debe completar Código y Obra');
                return;
              }
              handleDuplicarObra(obraADuplicar, duplicarFormData.codigo, duplicarFormData.obra);
              setDuplicarModalVisible(false);
            }} />
            <Button title="Cancelar" color="red" onPress={() => setDuplicarModalVisible(false)} />
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  emptyText: { textAlign: 'center', marginTop: 20, fontStyle: 'italic', color: '#666' },
  obraItem: { padding: 12, borderBottomWidth: 1, borderColor: '#ccc' },
  obraCodigo: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },

  modalContainer: { padding: 20, backgroundColor: '#f9f9f9' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  modalFiltroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalFiltroContainer: {
    width: '100%',
    maxWidth: 420,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  modalFiltroTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalFiltroBotones: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  buttonLimpiarFiltroObras: {
    position: 'absolute',
    bottom: 40,
    right: 160,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontWeight: '600', marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 8, marginTop: 4, backgroundColor: '#fff' },
  pickerWrapper: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, marginTop: 4, backgroundColor: '#fff' },
  buttonsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30, margin: 16 },
  botonesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingRight: 5,
    gap: 10,
    marginVertical: 10,
  },

  botonesListadoObras: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingRight: 35,
  },
  activateWorkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#4c669f',
    borderRadius: 6,
    paddingVertical: 8,
    marginTop: 8,
  },
  activateWorkButtonText: {
    color: '#192f6a',
    fontSize: 14,
    fontWeight: '600',
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
