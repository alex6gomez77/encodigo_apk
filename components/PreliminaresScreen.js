import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  Platform,
  Image,
  Pressable,
} from 'react-native';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import { AppText as Text, AppTextInput as TextInput, AppPicker as Picker } from './AppText';

import { commonStyles } from '../styles/commonStyles.js';
import ScreenHeader from './ScreenHeader';
import { useSQLiteContext } from 'expo-sqlite';
import { FontAwesome5 } from '@expo/vector-icons';
import { useLocalSearchParams, Link, useRouter } from 'expo-router';
import {
  obtenerRenglonesFiltrados,
  contarRenglonesFiltrados,
  eliminarFiltro,
  actualizarFiltro,
  obtenerDetallesDelRenglon,
  obtenerObras,
  obtenerObraActiva,
  establecerObraActiva,
  obtenerObjetosdeobras,
  obtenerObjetodeobraActivo,
  establecerObjetodeobraActivo, // ✅ FIX 6: import que faltaba
  agregarRCalObra,
  obtenerRenglonesAsignados,
  eliminarObjetosDeLaObra,
  eliminarRenglonAsignado,
} from '../db/database.js';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import PizZip from 'pizzip';
import { Buffer } from 'buffer';

global.Buffer = global.Buffer || Buffer;

const TABLA_ID = 'RC';
const LIMITE = 50;

export default function PreliminaresScreen() {
  const { obraId } = useLocalSearchParams();
  const db = useSQLiteContext();
  const idObra = Array.isArray(obraId) ? obraId[0] : obraId;
  const router = useRouter();
  const [laObra, setLaObra] = useState({});
  const [renglones, setRenglones] = useState([]);
  const [renglonesAsignados, setRenglonesAsignados] = useState([]);
  const [offset, setOffset] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [hayMas, setHayMas] = useState(true);
  const [todos, setTodos] = useState(0);
  const [filtro, setFiltro] = useState('');
  const [cadenafiltro, setCadenafiltro] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalDetalleVisible, setModalDetalleVisible] = useState(false);
  const [modalAgregarAObraVisible, setModalAgregarAObraVisible] = useState(false);
  const [exportacionVisible, setExportacionVisible] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [exportacionMensaje, setExportacionMensaje] = useState('');
  const [exportacionError, setExportacionError] = useState('');
  const [objetoExportando, setObjetoExportando] = useState(null);
  const [importando, setImportando] = useState(false);
  const [importacionMensaje, setImportacionMensaje] = useState('');
  const [importacionError, setImportacionError] = useState('');
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [objetoImportando, setObjetoImportando] = useState(null);
  const [filtroVisible, setFiltroVisible] = useState(false);
  const [elementoSeleccionado, setElementoSeleccionado] = useState(null);
  const [detallesRenglon, setDetallesRenglon] = useState(null);
  const [obras, setObras] = useState(null);
  const [obra_id, setObra_id] = useState(null);
  const [objetosdeobras, setObjetosdeobras] = useState(null);
  const [objetodeobra_id, setObjetodeobra_id] = useState(null);
  const [cantidad, setCantidad] = useState('1');
  const filtroRef = useRef(null);

  const totalesPorObjeto = useMemo(() => {
    const totales = new Map();
    for (const renglon of renglonesAsignados) {
      const objetoId = String(renglon.objetodeobra_id ?? 'default');
      const costo = Number(renglon.precio ?? 0) * Number(renglon.cantidad ?? 0);
      totales.set(objetoId, (totales.get(objetoId) ?? 0) + costo);
    }
    return totales;
  }, [renglonesAsignados]);

  const costoTotalObra = useMemo(
    () => [...totalesPorObjeto.values()].reduce((total, costo) => total + costo, 0),
    [totalesPorObjeto]
  );

  const cargarInicial = useCallback(
    async (estaActiva = () => true) => {
      try {
        const primeros = await obtenerRenglonesFiltrados(db, TABLA_ID, LIMITE, 0);
        const total = await contarRenglonesFiltrados(db, TABLA_ID);
        const elFiltro = await db.getFirstAsync(
          'SELECT * FROM filtros WHERE tabla_id = ? ORDER BY id DESC LIMIT 1',
          TABLA_ID
        );
        const obra = idObra
          ? await db.getFirstAsync('SELECT * FROM obras WHERE id = ?', idObra)
          : await obtenerObraActiva(db);
        const asignados =
          obra?.id != null ? await obtenerRenglonesAsignados(db, obra.id) : [];
        if (!estaActiva()) return;

        setLaObra(obra ?? {});
        setTodos(total);
        setRenglones(primeros);
        setOffset(primeros.length);
        setHayMas(primeros.length < total);
        setCadenafiltro(elFiltro?.filtro ?? '');
        setFiltroVisible(Boolean(elFiltro?.valor));
        setRenglonesAsignados(asignados);
      } catch (error) {
        if (estaActiva()) {
          const detalle = error instanceof Error ? error.message : JSON.stringify(error);
          Alert.alert(
            'Error',
            `No se pudieron cargar los preliminares. ${detalle || String(error)}`
          );
        }
      }
    },
    [db, idObra]
  );

  useFocusEffect(
    useCallback(() => {
      let estaActiva = true;
      cargarInicial(() => estaActiva);
      return () => {
        estaActiva = false;
      };
    }, [cargarInicial])
  );

  const cargarMas = async () => {
    if (cargando || !hayMas) return;
    setCargando(true);
    try {
      const nuevos = await obtenerRenglonesFiltrados(db, TABLA_ID, LIMITE, offset);
      setRenglones((prev) => [...prev, ...nuevos]);
      setOffset((prev) => prev + nuevos.length);
      setHayMas(offset + nuevos.length < todos);
    } catch (error) {
      const detalle = error instanceof Error ? error.message : JSON.stringify(error);
      Alert.alert(
        'Error',
        `No se pudieron cargar más renglones. ${detalle || String(error)}`
      );
    } finally {
      setCargando(false);
    }
  };

  const eliminarelFiltro = async () => {
    await eliminarFiltro(db, TABLA_ID);
    cargarInicial();
  };

  const handleFiltrar = async () => {
    await actualizarFiltro(db, TABLA_ID, '*', filtro);
    setModalVisible(false);
    cargarInicial();
  };

  function limpiarCampos() {
    setFiltro('');
  }

  function abrirModalFiltrado() {
    limpiarCampos();
    setModalVisible(true);
  }

  const ponerActivaLaObrayObjetodeobra = async (obraId, elObjetodeobra) => {
    setObra_id(obraId);
    setObjetodeobra_id(elObjetodeobra);
  };

  const agregarAObra = async () => {
    const lasObras = await obtenerObras(db);
    setObras(lasObras);
    const obra_activa = await obtenerObraActiva(db);

    const objetodeobra_activo = await obtenerObjetodeobraActivo(db);

    const losobjetosdeobras = await obtenerObjetosdeobras(db);
    setObjetosdeobras(losobjetosdeobras);

    await ponerActivaLaObrayObjetodeobra(
      laObra.id ?? obra_activa?.id ?? lasObras[0]?.id,
      objetodeobra_activo?.objetodeobra_activo ?? losobjetosdeobras[0]?.id
    );

    setModalAgregarAObraVisible(true);
  };

  const abrirModalDetalles = async (item) => {
    setElementoSeleccionado(item);
    const losDetalles = await obtenerDetallesDelRenglon(db, item.IDRVariante);
    setDetallesRenglon(losDetalles);
    setModalDetalleVisible(true);
  };

  // ✅ FIX 7: al cambiar de obra, recarga los objetos de esa obra
  const actualizarObraId = async (value) => {
    await establecerObraActiva(db, value);
    setObra_id(value);
    try {
      const losobjetos = await obtenerObjetosdeobras(db);
      setObjetosdeobras(losobjetos);
      setObjetodeobra_id(losobjetos?.[0]?.id ?? null);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los objetos de la obra.');
    }
  };

  const actualizarObjetodeobraId = async (value) => {
    await establecerObjetodeobraActivo(db, value);
    setObjetodeobra_id(value);
  };

  function handleCancelar() {
    limpiarCampos();
    setModalVisible(false);
    setModalDetalleVisible(false);
    setModalAgregarAObraVisible(false);
  }

  function handleCancelarAgregandoAObra() {
    setModalAgregarAObraVisible(false);
  }

  // ✅ FIX 8: firma de agregarRCalObra unificada con la del import
  // (db, obraId, etapa, objetodeobraId, IDRVariante, cantidad, precio, observaciones)
  const handleAgregarRCalObra = async () => {
    if (obra_id == null || objetodeobra_id == null) {
      Alert.alert(
        'Validación',
        'Seleccione una obra y un objeto de obra antes de continuar.'
      );
      return;
    }

    try {
      await agregarRCalObra(
        db,
        obra_id,
        elementoSeleccionado.IDSubEtapa ?? '',
        objetodeobra_id,
        elementoSeleccionado.IDRVariante,
        cantidad,
        elementoSeleccionado.Precio,
        ''
      );
      if (String(obra_id) === String(laObra.id)) {
        setRenglonesAsignados(await obtenerRenglonesAsignados(db, obra_id));
      }
      setModalAgregarAObraVisible(false);
      Alert.alert(
        'Renglón constructivo añadido',
        `Se añadió con éxito el renglón constructivo ${elementoSeleccionado.IDRVariante} a la obra.`
      );
      router.push('/Obras');
    } catch (error) {
      Alert.alert('Error', 'No se pudo asignar el renglón a la obra.');
    }
  };

  const confirmarEliminarObjetoDeObra = (objeto) => {
    const renglonesDelObjeto = renglonesAsignados.filter(
      (renglon) =>
        String(renglon.objetodeobra_id) === String(objeto.objetodeobra_id)
    ).length;

    Alert.alert(
      'Eliminar objeto de obra',
      `Se quitarán ${renglonesDelObjeto} renglón(es) de "${
        objeto.objetodeobra || 'Por defecto'
      }" de esta obra. Esta acción no elimina el objeto de obra del catálogo. ¿Deseas continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar de la obra',
          style: 'destructive',
          onPress: async () => {
            try {
              await eliminarObjetosDeLaObra(db, laObra.id, objeto.objetodeobra_id);
              setRenglonesAsignados(await obtenerRenglonesAsignados(db, laObra.id));
            } catch (error) {
              Alert.alert(
                'Error',
                `No se pudo eliminar el objeto de obra de la obra. ${error.message}`
              );
            }
          },
        },
      ]
    );
  };

  const confirmarEliminarRenglon = (renglon) => {
    Alert.alert(
      'Eliminar renglón constructivo',
      `¿Deseas quitar el renglón ${renglon.IDRVariante} de esta obra?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await eliminarRenglonAsignado(db, laObra.id, renglon.asignacion_id);
              setRenglonesAsignados(await obtenerRenglonesAsignados(db, laObra.id));
            } catch (error) {
              const detalle =
                error instanceof Error ? error.message : JSON.stringify(error);
              Alert.alert(
                'Error',
                `No se pudo eliminar el renglón de la obra. ${detalle || String(error)}`
              );
            }
          },
        },
      ]
    );
  };

  const exportarListado = async (destino) => {
    setExportando(true);
    setExportacionMensaje('');
    setExportacionError('');

    if (renglonesAsignados.length === 0) {
      setExportacionError('Agrega renglones a la obra antes de generar el Excel.');
      setExportando(false);
      return;
    }

    try {
      const datos = [
        [
          'No.',
          'Etapa',
          'Código',
          'Suministro',
          'Descripción',
          'Cantidad',
          'Unidad Medida',
          'Precio',
          'CM',
          'Importe Total',
        ],
        ...renglonesAsignados.map((renglon, index) => {
          const cantidadNum = Number(renglon.cantidad) || 0;
          const precio = Number(renglon.precio) || 0;
          return [
            index + 1,
            renglon.IDSubEtapa || '',
            renglon.IDRVariante || '',
            renglon.suministro_nombre || '',
            renglon.RVariante || '',
            cantidadNum,
            renglon.suministro_unidad || renglon.umedicion || '',
            precio,
            '1',
            cantidadNum * precio,
          ];
        }),
        [],
      ];
      const escaparXml = (valor) =>
        String(valor).replace(/[<>&'"]/g, (caracter) => ({
          '<': '&lt;',
          '>': '&gt;',
          '&': '&amp;',
          "'": '&apos;',
          '"': '&quot;',
        })[caracter]);
      const filasXml = datos
        .map((fila, indiceFila) => {
          const celdasXml = fila
            .map((valor, indiceColumna) => {
              const referencia = `${String.fromCharCode(65 + indiceColumna)}${
                indiceFila + 1
              }`;
              if (typeof valor === 'number' && Number.isFinite(valor)) {
                return `<c r="${referencia}"><v>${valor}</v></c>`;
              }
              return `<c r="${referencia}" t="inlineStr"><is><t xml:space="preserve">${escaparXml(
                valor ?? ''
              )}</t></is></c>`;
            })
            .join('');
          return `<row r="${indiceFila + 1}">${celdasXml}</row>`;
        })
        .join('');

      const zip = new PizZip();
      zip.file(
        '[Content_Types].xml',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
          '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
          '<Default Extension="xml" ContentType="application/xml"/>' +
          '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
          '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
          '</Types>'
      );
      zip.file(
        '_rels/.rels',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
          '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
          '</Relationships>'
      );
      zip.file(
        'xl/workbook.xml',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
          '<sheets><sheet name="Listado de cantidades" sheetId="1" r:id="rId1"/></sheets>' +
          '</workbook>'
      );
      zip.file(
        'xl/_rels/workbook.xml.rels',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
          '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
          '</Relationships>'
      );
      zip.file(
        'xl/worksheets/sheet1.xml',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
          `<sheetData>${filasXml}</sheetData></worksheet>`
      );
      const contenido = zip.generate({ type: 'base64', compression: 'DEFLATE' });
      const fecha = new Date().toISOString().slice(0, 10);
      const nombreArchivo = `Listado_de_cantidades_${fecha}.xlsx`;
      const tipoArchivo =
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      if (destino === 'guardar' && Platform.OS === 'android') {
        const permiso =
          await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!permiso.granted) {
          setExportacionError('No se seleccionó una carpeta para guardar el archivo.');
          return;
        }

        const uri = await FileSystem.StorageAccessFramework.createFileAsync(
          permiso.directoryUri,
          nombreArchivo,
          tipoArchivo
        );
        await FileSystem.writeAsStringAsync(uri, contenido, {
          encoding: FileSystem.EncodingType.Base64,
        });
        setExportacionMensaje('El archivo Excel se guardó en la carpeta seleccionada.');
        return;
      }

      const directorioCache = FileSystem.cacheDirectory;
      if (!directorioCache) {
        throw new Error('No está disponible la carpeta temporal para crear el archivo.');
      }
      const uri = `${directorioCache}${nombreArchivo}`;
      await FileSystem.writeAsStringAsync(uri, contenido, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (!(await Sharing.isAvailableAsync())) {
        throw new Error(
          'No hay una aplicación disponible para compartir o guardar el archivo.'
        );
      }
      await Sharing.shareAsync(uri, {
        mimeType: tipoArchivo,
        dialogTitle:
          destino === 'guardar'
            ? 'Guardar archivo de Excel'
            : 'Enviar listado de cantidades',
        UTI: 'org.openxmlformats.spreadsheetml.sheet',
      });
      setExportacionMensaje(
        destino === 'guardar'
          ? 'Se abrió el selector para guardar el archivo Excel.'
          : 'Se abrió el menú para compartir el archivo. Selecciona WhatsApp para enviarlo.'
      );
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error);
      setExportacionError(`No se pudo generar o compartir el Excel. ${detalle}`);
    } finally {
      setExportando(false);
    }
  };

  const exportarObjetoDeObra = async (objetodeobra_id_param) => {
    setObjetoExportando(objetodeobra_id_param);
    setExportando(true);
    setExportacionMensaje('');
    setExportacionError('');

    const renglonesDelObjeto = renglonesAsignados.filter(
      (renglon) =>
        String(renglon.objetodeobra_id ?? 'default') ===
        String(objetodeobra_id_param ?? 'default')
    );

    if (renglonesDelObjeto.length === 0) {
      setExportacionError('No hay renglones asignados a este objeto de obra.');
      setExportando(false);
      setObjetoExportando(null);
      return;
    }

    try {
      const objeto = objetosdeobras?.find(
        (o) => String(o.id) === String(objetodeobra_id_param)
      );
      const nombreObjeto = objeto?.objetodeobra || 'Objeto de obra';
      const nombreLimpio = String(nombreObjeto)
        .replace(/[^a-zA-Z0-9]/g, '_')
        .slice(0, 25);
      const nombreSheet = `LC-${nombreLimpio}`.slice(0, 31);

      const datos = [
        [
          'No.',
          'Etapa',
          'Código',
          'Suministro',
          'Descripción',
          'Cantidad',
          'Unidad Medida',
          'Precio',
          'CM',
          'Importe Total',
        ],
        ...renglonesDelObjeto.map((renglon, index) => {
          const cantidadNum = Number(renglon.cantidad) || 0;
          const precio = Number(renglon.precio) || 0;
          return [
            index + 1,
            renglon.IDSubEtapa || '',
            renglon.IDRVariante || '',
            renglon.suministro_nombre || '',
            renglon.RVariante || '',
            cantidadNum,
            renglon.suministro_unidad || renglon.umedicion || '',
            precio,
            '1',
            cantidadNum * precio,
          ];
        }),
      ];
      const escaparXml = (valor) =>
        String(valor).replace(/[<>&'"]/g, (caracter) => ({
          '<': '&lt;',
          '>': '&gt;',
          '&': '&amp;',
          "'": '&apos;',
          '"': '&quot;',
        })[caracter]);
      const filasXml = datos
        .map((fila, indiceFila) => {
          const celdasXml = fila
            .map((valor, indiceColumna) => {
              const referencia = `${String.fromCharCode(65 + indiceColumna)}${
                indiceFila + 1
              }`;
              if (typeof valor === 'number' && Number.isFinite(valor)) {
                return `<c r="${referencia}"><v>${valor}</v></c>`;
              }
              return `<c r="${referencia}" t="inlineStr"><is><t xml:space="preserve">${escaparXml(
                valor ?? ''
              )}</t></is></c>`;
            })
            .join('');
          return `<row r="${indiceFila + 1}">${celdasXml}</row>`;
        })
        .join('');

      const zip = new PizZip();
      zip.file(
        '[Content_Types].xml',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
          '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
          '<Default Extension="xml" ContentType="application/xml"/>' +
          '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
          '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
          '</Types>'
      );
      zip.file(
        '_rels/.rels',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
          '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
          '</Relationships>'
      );
      zip.file(
        'xl/workbook.xml',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
          '<sheets><sheet name="' +
          nombreSheet +
          '" sheetId="1" r:id="rId1"/></sheets>' +
          '</workbook>'
      );
      zip.file(
        'xl/_rels/workbook.xml.rels',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
          '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
          '</Relationships>'
      );
      zip.file(
        'xl/worksheets/sheet1.xml',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
          `<sheetData>${filasXml}</sheetData></worksheet>`
      );
      const contenido = zip.generate({ type: 'base64', compression: 'DEFLATE' });
      const fecha = new Date().toISOString().slice(0, 10);
      const nombreArchivo = `LC-${nombreLimpio}_${fecha}.xlsx`;
      const tipoArchivo =
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      const directorioCache = FileSystem.cacheDirectory;
      if (!directorioCache) {
        throw new Error('No está disponible la carpeta temporal para crear el archivo.');
      }
      const uri = `${directorioCache}${nombreArchivo}`;
      await FileSystem.writeAsStringAsync(uri, contenido, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (!(await Sharing.isAvailableAsync())) {
        throw new Error(
          'No hay una aplicación disponible para compartir o guardar el archivo.'
        );
      }
      await Sharing.shareAsync(uri, {
        mimeType: tipoArchivo,
        dialogTitle: `Exportar cantidades de ${nombreObjeto}`,
        UTI: 'org.openxmlformats.spreadsheetml.sheet',
      });
      setExportacionMensaje(
        `Se abrió el menú para compartir el Excel de ${nombreObjeto}.`
      );
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error);
      setExportacionError(`No se pudo generar el Excel. ${detalle}`);
    } finally {
      setExportando(false);
      setObjetoExportando(null);
    }
  };

  const importarCantidadesObjeto = async (objetodeobra_id_param) => {
    setObjetoImportando(objetodeobra_id_param);
    setImportando(true);
    setImportacionMensaje('');
    setImportacionError('');

    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/zip',
          '*/*',
        ],
        copyToCacheDirectory: true,
      });

      if (res.canceled || !res.assets || res.assets.length === 0) {
        setImportando(false);
        setObjetoImportando(null);
        return;
      }

      const uri = res.assets[0].uri;
      let contenidoBase64;
      try {
        contenidoBase64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } catch (readError) {
        throw new Error('No se pudo leer el archivo Excel seleccionado.');
      }

      const zip = new PizZip(contenidoBase64);

      const workbookXml = zip.file('xl/workbook.xml')?.asText() || '';
      const sheetMatches =
        workbookXml.match(/<sheet[^>]*name="([^"]*)"[^>]*>/g) || [];
      const sheetNames = sheetMatches.map((m) => {
        const match = m.match(/name="([^"]*)"/);
        return match ? match[1] : '';
      });

      let nombreDesdeHoja = sheetNames[0] || '';
      let nombreObjetoFinal = 'default';
      let objetodeobraIdFinal = objetodeobra_id_param;

      if (nombreDesdeHoja.startsWith('LC-')) {
        const nombreCandidato = nombreDesdeHoja.slice(3);
        const objetoExistente = objetosdeobras?.find(
          (o) => String(o.objetodeobra) === String(nombreCandidato)
        );
        if (objetoExistente) {
          nombreObjetoFinal = nombreCandidato;
          objetodeobraIdFinal = objetoExistente.id;
        } else {
          nombreObjetoFinal = nombreCandidato;
          objetodeobraIdFinal = null;
        }
      } else {
        nombreObjetoFinal = 'default';
        objetodeobraIdFinal = null;
      }

      const sheetXml = zip.file('xl/worksheets/sheet1.xml')?.asText() || '';
      const filas = sheetXml.match(/<row[^>]*>.*?<\/row>/gs) || [];

      const datosRenglones = [];
      let enCabecera = false;

      for (const filaXml of filas) {
        const celdas = filaXml.match(/<c[^>]*>([\s\S]*?)<\/c>/g) || [];
        const valoresFila = [];

        for (const celdaXml of celdas) {
          let valor = '';
          const inlineMatch = celdaXml.match(
            /<is><t[^>]*>([\s\S]*?)<\/t><\/is>/
          );
          if (inlineMatch) {
            valor = inlineMatch[1];
          } else {
            const vMatch = celdaXml.match(/<v>([\s\S]*?)<\/v>/);
            if (vMatch) valor = vMatch[1];
          }
          valoresFila.push(valor);
        }

        const filaTexto = valoresFila.join(' | ');
        if (
          filaTexto.includes('Descripción') ||
          filaTexto.includes('Código')
        ) {
          enCabecera = true;
          continue;
        }

        if (!enCabecera) continue;
        if (
          valoresFila.length === 0 ||
          valoresFila.every((v) => v.trim() === '')
        )
          continue;

        const codigoRC = (valoresFila[1] || '').trim();
        const descripcion = (valoresFila[3] || '').trim();
        const cantidadRaw = (valoresFila[4] || '').trim();
        const precioRaw = (valoresFila[6] || '').trim();

        if (!codigoRC && !descripcion) continue;

        const cantidadNum = Number(cantidadRaw) || 0;
        const precioNum = Number(precioRaw) || 0;

        datosRenglones.push({
          IDRVariante: codigoRC,
          RVariante: descripcion,
          cantidad: cantidadNum,
          precio: precioNum,
          suministro_nombre: (valoresFila[2] || '').trim(),
          IDSubEtapa: (valoresFila[0] || '').trim(),
        });
      }

      if (datosRenglones.length === 0) {
        throw new Error('No se encontraron renglones válidos en el archivo Excel.');
      }

      const obraIdFinal = idObra || objetodeobraIdFinal;
      for (const renglon of datosRenglones) {
        // ✅ FIX 8: misma firma que handleAgregarRCalObra
        await agregarRCalObra(
          db,
          obraIdFinal,
          renglon.IDSubEtapa,
          objetodeobraIdFinal,
          renglon.IDRVariante,
          renglon.cantidad,
          renglon.precio,
          `Importado: ${renglon.RVariante || ''}`
        );
      }

      if (obraIdFinal) {
        setRenglonesAsignados(await obtenerRenglonesAsignados(db, obraIdFinal));
      }

      setImportacionMensaje(
        `Se importaron ${datosRenglones.length} renglón(es) correctamente.`
      );
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error);
      setImportacionError(`No se pudo importar el listado. ${detalle}`);
    } finally {
      setImportando(false);
      setObjetoImportando(null);
    }
  };

  const preguntarDestinoExportacion = () => {
    setExportacionMensaje('');
    setExportacionError('');
    setExportacionVisible(true);
  };

  // ✅ FIX 10: guard por si el input aún no está montado
  useEffect(() => {
    if (modalVisible && filtroRef.current) {
      filtroRef.current.focus();
    }
  }, [modalVisible]);

  // ✅ FIX 1: TODO el JSX queda dentro del contentContainer,
  // todos los modales dentro del mismo return.
  return (
    <View style={styles.contentContainer}>
      <ScreenHeader
        title={'PRELIMINARES'}
        count={renglonesAsignados.length}
        onBack={() => router.back()}
      />

      <Text style={styles.headerFiltro}>
        {laObra.obra ? laObra.obra.toUpperCase() : ''}
      </Text>

      <View style={styles.listModeContainer}>
        <View style={styles.assignedListTitle}>
          <Text style={styles.assignedPrice}>
            Costo: ${costoTotalObra.toFixed(2)}
          </Text>
        </View>
        <Link href="/Renglones" asChild>
          <Pressable style={{ alignItems: 'center', marginRight: 10 }}>
            <FontAwesome5 name="bars" size={20} color="#192f6a" />
          </Pressable>
        </Link>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Generar Excel del listado de cantidades"
          onPress={preguntarDestinoExportacion}
          style={styles.exportButton}
        >
          <FontAwesome5 name="file-excel" size={16} color="#ffffff" />
        </Pressable>
      </View>

      <FlatList
        style={{ paddingHorizontal: 5 }}
        data={renglonesAsignados}
        keyExtractor={(item) => String(item.asignacion_id)}
        renderItem={({ item, index }) => (
          <View>
            {(index === 0 ||
              renglonesAsignados[index - 1].objetodeobra_id !==
                item.objetodeobra_id) && (
              <Swipeable
                renderRightActions={() => (
                  <RectButton
                    accessibilityRole="button"
                    accessibilityLabel={`Eliminar ${
                      item.objetodeobra || 'objeto de obra'
                    } de la obra`}
                    onPress={() => confirmarEliminarObjetoDeObra(item)}
                    style={styles.swipeDeleteAction}
                  >
                    <FontAwesome5 name="trash" size={18} color="#fff" />
                  </RectButton>
                )}
              >
                <View style={styles.objetoObraHeader}>
                  <Text style={styles.objetoObraHeading}>
                    {item.objetodeobra || 'Por defecto'}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Exportar cantidades de ${
                      item.objetodeobra || 'objeto de obra'
                    }`}
                    onPress={() => exportarObjetoDeObra(item.objetodeobra_id)}
                    style={styles.exportObjetoButton}
                    disabled={
                      objetoExportando === item.objetodeobra_id || exportando
                    }
                  >
                    <FontAwesome5 name="file-excel" size={14} color="#ffffff" />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Importar cantidades de ${
                      item.objetodeobra || 'objeto de obra'
                    }`}
                    onPress={() => {
                      setObjetoImportando(item.objetodeobra_id);
                      setImportModalVisible(true);
                    }}
                    style={styles.importObjetoButton}
                    disabled={
                      objetoImportando === item.objetodeobra_id || importando
                    }
                  >
                    <FontAwesome5
                      name="file-import"
                      size={14}
                      color="#ffffff"
                    />
                  </Pressable>
                  <Text style={styles.assignedPrice}>
                    $
                    {(
                      totalesPorObjeto.get(
                        String(item.objetodeobra_id ?? 'default')
                      ) ?? 0
                    ).toFixed(2)}
                  </Text>
                </View>
              </Swipeable>
            )}
            <Swipeable
              renderRightActions={() => (
                <RectButton
                  accessibilityRole="button"
                  accessibilityLabel={`Eliminar renglón ${item.IDRVariante} de la obra`}
                  onPress={() => confirmarEliminarRenglon(item)}
                  style={styles.swipeDeleteAction}
                >
                  <FontAwesome5 name="trash" size={18} color="#fff" />
                </RectButton>
              )}
            >
              <Pressable onPress={() => abrirModalDetalles(item)}>
                <View style={commonStyles.detallesItemContainer}>
                  <View style={{ flex: 1, flexDirection: 'row' }}>
                    <Text style={styles.subetapa}>
                      Etapa: {item.IDSubEtapa || ''} {item.SubEtapa || ''}
                    </Text>
                  </View>

                  <View style={styles.assignedLineHeader}>
                    <Text style={commonStyles.campoCodigo}>
                      {item.IDRVariante}
                    </Text>
                    <Text
                      style={styles.assignedHierarchy}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {[item.SobreGrupo, item.Grupo, item.SubGrupo]
                        .filter(Boolean)
                        .join(' | ') || 'Sin jerarquía'}
                    </Text>
                  </View>
                  <Text style={styles.assignedDescription}>
                    {item.RVariante || 'Renglón sin descripción'}
                  </Text>
                  {!!item.suministro_nombre && (
                    <Text style={styles.assignedNotes}>
                      {`Suministro: ${item.suministro_nombre} (${item.IDRecurso})`}
                    </Text>
                  )}
                  <View style={{ flex: 1, flexDirection: 'row' }}>
                    <Text style={styles.assignedPrice}>
                      {item.cantidad} x {item.umedicion || ''}
                    </Text>
                    <Text style={styles.assignedPrice}>
                      Precio: ${Number(item.precio ?? 0).toFixed(2)}
                    </Text>
                    <Text style={styles.assignedPrice}>
                      Costo: $
                      {(
                        Number(item.precio ?? 0) * Number(item.cantidad ?? 0)
                      ).toFixed(2)}
                    </Text>
                  </View>
                  {!!item.observaciones && (
                    <Text style={styles.assignedNotes}>
                      {item.observaciones}
                    </Text>
                  )}
                </View>
              </Pressable>
            </Swipeable>
          </View>
        )}
        ListEmptyComponent={
          <View>
            <Text style={styles.emptyAssignedList}>
              Esta obra aún no tiene renglones asignados.
            </Text>

            <Link href="/Renglones" asChild>
              <Pressable style={{ alignItems: 'center' }}>
                <FontAwesome5 name="bars" size={30} color="#192f6a" />
                <Text
                  style={styles.cabecera}
                  adjustsFontSizeToFit
                  numberOfLines={1}
                  minimumFontScale={0.6}
                >
                  Ir a Renglones
                </Text>
              </Pressable>
            </Link>
          </View>
        }
        onEndReached={undefined}
        onEndReachedThreshold={undefined}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews
      />

      {/* ===== MODAL FILTRO ===== */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancelar}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Filtrado</Text>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              <Text style={styles.label}>Filtro</Text>
              <TextInput
                ref={filtroRef}
                style={commonStyles.input}
                placeholder="Filtro..."
                value={filtro}
                onChangeText={setFiltro}
              />
            </ScrollView>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: 12,
              }}
            >
              <TouchableOpacity
                style={commonStyles.buttonAgregar}
                onPress={handleFiltrar}
              >
                <Text style={commonStyles.buttonTextAgregar}>Filtrar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={commonStyles.buttonCancelar}
                onPress={handleCancelar}
              >
                <Text style={commonStyles.buttonTextAgregar}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ===== MODAL IMPORTAR ===== */}
      <Modal
        visible={importModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!importando) setImportModalVisible(false);
        }}
      >
        <View style={styles.importModalOverlay}>
          <View style={styles.importModalContainer}>
            <Text style={styles.importModalTitle}>
              Importar cantidades de objeto de obra
            </Text>
            <Text style={styles.importModalMessage}>
              {importando
                ? 'Procesando el archivo Excel...'
                : importacionError ||
                  importacionMensaje ||
                  'Selecciona un archivo Excel (.xlsx) para importar.'}
            </Text>
            {!importando && !importacionError && !importacionMensaje && (
              <View style={styles.importModalActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setImportModalVisible(false);
                    importarCantidadesObjeto(objetoImportando);
                  }}
                  style={[styles.importModalButton, styles.importSaveButton]}
                >
                  <Text style={styles.importModalButtonText}>
                    Seleccionar archivo Excel
                  </Text>
                </Pressable>
              </View>
            )}
            {!importando && (
              <Pressable
                accessibilityRole="button"
                onPress={() => setImportModalVisible(false)}
                style={styles.importModalCancel}
              >
                <Text style={styles.importModalCancelText}>
                  {importacionError || importacionMensaje ? 'Cerrar' : 'Cancelar'}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>

      {/* ===== MODAL DETALLE DEL RENGLÓN ===== */}
      <Modal
        visible={modalDetalleVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancelar}
      >
        <View style={styles.modalOverlay2}>
          <View style={styles.modalContainer2}>
            <View style={commonStyles.gradienteContainer}>
              <TouchableOpacity onPress={handleCancelar}>
                <FontAwesome5
                  style={{ marginRight: 10 }}
                  name="arrow-left"
                  size={20}
                  color="#192f6a"
                />
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image
                  source={require('../assets/logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <View
                  style={{ flexDirection: 'column', alignItems: 'flex-start' }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text style={styles.headerText}>ENCODIGO</Text>
                    <Text style={styles.headerText2}>PRECONS III</Text>
                  </View>
                  <Text style={styles.headerText}>
                    DETALLES DEL RENGLÓN CONSTRUCTIVO
                  </Text>
                </View>
              </View>
              <Text></Text>
            </View>

            {elementoSeleccionado ? (
              <View style={styles.detallesItemContainer}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 0,
                  }}
                >
                  <Text style={commonStyles.campoCodigo}>
                    {elementoSeleccionado.IDRVariante}{' '}
                  </Text>
                  <Text
                    style={[commonStyles.campoCodigo2, { flex: 1, flexShrink: 1 }]}
                    numberOfLines={3}
                    ellipsizeMode="tail"
                  >
                    {elementoSeleccionado.SobreGrupo} |{' '}
                    {elementoSeleccionado.Grupo} |{' '}
                    {elementoSeleccionado.SubGrupo}
                  </Text>
                </View>

                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'FiraSans_400Regular',
                    fontWeight: 'bold',
                  }}
                  numberOfLines={2}
                >
                  {elementoSeleccionado.RVariante}
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: 'FiraSans_400Regular',
                    fontWeight: 'bold',
                    textAlign: 'center',
                  }}
                >
                  Precio: ${Number(elementoSeleccionado.Precio ?? 0).toFixed(2)} x{' '}
                  {elementoSeleccionado.umedicion}
                </Text>

                <View style={styles.resumenContainer2}>
                  <View
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                    }}
                  >
                    <View style={styles.gradienteResumenContainerFichas}>
                      <Text
                        style={{ textAlign: 'center', marginTop: 2 }}
                        adjustsFontSizeToFit
                        numberOfLines={1}
                        minimumFontScale={0.6}
                      >
                        Costo de Materiales
                      </Text>
                      <Text
                        style={styles.resumenNumero}
                        adjustsFontSizeToFit
                        numberOfLines={1}
                      >
                        $
                        {Number(
                          elementoSeleccionado.CDMateriales ?? 0
                        ).toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.gradienteResumenContainerFichas}>
                      <Text
                        style={{ textAlign: 'center', marginTop: 2 }}
                        adjustsFontSizeToFit
                        numberOfLines={1}
                        minimumFontScale={0.6}
                      >
                        Costo Mano de Obra
                      </Text>
                      <Text
                        style={styles.resumenNumero}
                        adjustsFontSizeToFit
                        numberOfLines={1}
                      >
                        ${Number(elementoSeleccionado.CDManoObra ?? 0).toFixed(2)}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                    }}
                  >
                    <View style={styles.gradienteResumenContainerFichas}>
                      <Text
                        style={{ textAlign: 'center', marginTop: 2 }}
                        adjustsFontSizeToFit
                        numberOfLines={1}
                        minimumFontScale={0.6}
                      >
                        Costo Uso de Equipos
                      </Text>
                      <Text
                        style={styles.resumenNumero}
                        adjustsFontSizeToFit
                        numberOfLines={1}
                      >
                        $
                        {Number(
                          elementoSeleccionado.CDUsoEquipos ?? 0
                        ).toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.gradienteResumenContainerFichas}>
                      <Text
                        style={{ textAlign: 'center', marginTop: 2 }}
                        adjustsFontSizeToFit
                        numberOfLines={1}
                        minimumFontScale={0.6}
                      >
                        Horas Hombre
                      </Text>
                      <Text
                        style={styles.resumenNumero}
                        adjustsFontSizeToFit
                        numberOfLines={1}
                      >
                        ${elementoSeleccionado.HorasHombre}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                    }}
                  >
                    <View style={styles.gradienteResumenContainerFichas}>
                      <Text
                        style={{ textAlign: 'center', marginTop: 2 }}
                        adjustsFontSizeToFit
                        numberOfLines={1}
                        minimumFontScale={0.6}
                      >
                        Horas Equipo
                      </Text>
                      <Text
                        style={styles.resumenNumero}
                        adjustsFontSizeToFit
                        numberOfLines={1}
                      >
                        ${elementoSeleccionado.HorasEquipos}
                      </Text>
                    </View>
                    <View style={styles.gradienteResumenContainerFichas}>
                      <Text
                        style={{ textAlign: 'center', marginTop: 2 }}
                        adjustsFontSizeToFit
                        numberOfLines={1}
                        minimumFontScale={0.6}
                      >
                        Horas Total
                      </Text>
                      <Text
                        style={styles.resumenNumero}
                        adjustsFontSizeToFit
                        numberOfLines={1}
                      >
                        ${elementoSeleccionado.HorasTotal}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : null}

            {/* ✅ FIX 2 + 3: solo FlatList con ListHeaderComponent (sin ScrollView anidado) */}
            {detallesRenglon ? (
              <FlatList
                style={{ flex: 1 }}
                data={detallesRenglon}
                keyExtractor={(item, index) =>
                  `${item.IDRecurso}-${index}`
                }
                ListHeaderComponent={
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: 'FiraSans_400Regular',
                      textAlign: 'left',
                      paddingHorizontal: 20,
                    }}
                  >
                    ELEMENTOS DE COMPOSICIÓN {detallesRenglon.length}
                  </Text>
                }
                renderItem={({ item }) => (
                  <View
                    style={[
                      commonStyles.detallesItemContainer,
                      { paddingVertical: 0 },
                    ]}
                  >
                    <View
                      style={{ flexDirection: 'row', alignItems: 'flex-start' }}
                    >
                      <Text style={commonStyles.campoCodigo2}>
                        {item.IDRecurso}{' '}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: 'FiraSans_400Regular',
                          fontWeight: 'bold',
                        }}
                      >
                        {' '}
                        {item.tiporecurso}{' '}
                      </Text>
                    </View>
                    <Text
                      style={{ fontSize: 14, fontFamily: 'FiraSans_400Regular' }}
                    >
                      {item.Recurso}
                    </Text>

                    {/* ✅ FIX 2: se eliminó el <View> anidado dentro de <Text> */}
                    <Text
                      style={[
                        commonStyles.campoCodigo2,
                        { flex: 1, flexShrink: 1 },
                      ]}
                      numberOfLines={3}
                      ellipsizeMode="tail"
                    >
                      {item.Peso ? `Precio: $${item.Precio} | ` : ''}
                      Norma: {item.Norma} x {item.umedicion}
                      {item.Peso ? ` | Peso: ${item.Peso}kg` : ''}
                    </Text>
                  </View>
                )}
                windowSize={5}
                removeClippedSubviews
              />
            ) : null}

            <Pressable
              style={commonStyles.buttonFlotante}
              onPress={() => agregarAObra()}
            >
              <FontAwesome5 name="plus" size={18} color="white" />
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ===== MODAL AGREGAR A OBRA ===== */}
      <Modal
        visible={modalAgregarAObraVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancelarAgregandoAObra}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={commonStyles.gradienteContainer}>
              <TouchableOpacity onPress={handleCancelarAgregandoAObra}>
                <FontAwesome5
                  style={{ marginRight: 10 }}
                  name="arrow-left"
                  size={20}
                  color="#192f6a"
                />
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image
                  source={require('../assets/logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text
                    style={[styles.headerText, { flex: 1, flexShrink: 1 }]}
                    numberOfLines={3}
                    ellipsizeMode="tail"
                  >
                    AGREGANDO RC AL OBRA
                  </Text>
                </View>
              </View>
            </View>
            {elementoSeleccionado ? (
              <View style={styles.detallesItemContainer}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 0,
                  }}
                >
                  <Text style={commonStyles.campoCodigo}>
                    {elementoSeleccionado.IDRVariante}{' '}
                  </Text>
                  <Text
                    style={[
                      commonStyles.campoCodigo2,
                      { flex: 1, flexShrink: 1, textTransform: 'lowercase' },
                    ]}
                    numberOfLines={3}
                    ellipsizeMode="tail"
                  >
                    {elementoSeleccionado.SobreGrupo} |{' '}
                    {elementoSeleccionado.Grupo} |{' '}
                    {elementoSeleccionado.SubGrupo}
                  </Text>
                </View>

                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'FiraSans_400Regular',
                    fontWeight: 'bold',
                  }}
                  numberOfLines={2}
                >
                  {elementoSeleccionado.RVariante}
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: 'FiraSans_400Regular',
                    fontWeight: 'bold',
                    textAlign: 'center',
                  }}
                >
                  Precio: ${Number(elementoSeleccionado.Precio ?? 0).toFixed(2)} x{' '}
                  {elementoSeleccionado.umedicion}
                </Text>
              </View>
            ) : null}

            {obras ? (
              <View style={styles.detallesItemContainer}>
                <Text style={styles.label}>Obra</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={obra_id}
                    onValueChange={(value) => actualizarObraId(value)}
                  >
                    {obras.map((obra) => (
                      <Picker.Item
                        key={obra.id}
                        label={obra.obra}
                        value={obra.id}
                      />
                    ))}
                  </Picker>
                </View>

                <Text style={styles.label}>Objeto de Obra</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={objetodeobra_id}
                    onValueChange={(value) => actualizarObjetodeobraId(value)}
                  >
                    {(objetosdeobras ?? []).map((oo) => (
                      <Picker.Item
                        key={oo.id}
                        label={oo.objetodeobra}
                        value={oo.id}
                      />
                    ))}
                  </Picker>
                </View>

                <Text style={styles.label}>Cantidad</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={cantidad}
                  onChangeText={(text) => setCantidad(text)}
                />

                <Text style={styles.label}>Ir a los detalles de la obra</Text>

                <View style={commonStyles.buttonsRow}>
                  <TouchableOpacity
                    style={commonStyles.buttonAgregar}
                    onPress={handleAgregarRCalObra}
                  >
                    <Text style={commonStyles.buttonTextAgregar}>
                      {' '}
                      AGREGAR{' '}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* ===== MODAL EXPORTAR ===== */}
      <Modal
        visible={exportacionVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!exportando) setExportacionVisible(false);
        }}
      >
        <View style={styles.exportModalOverlay}>
          <View style={styles.exportModalContainer}>
            <Text style={styles.exportModalTitle}>
              Exportar listado de cantidades
            </Text>
            <Text style={styles.exportModalMessage}>
              {exportando
                ? 'Generando el archivo Excel...'
                : exportacionError ||
                  exportacionMensaje ||
                  '¿Qué deseas hacer con el archivo Excel?'}
            </Text>
            {!exportando && !exportacionError && !exportacionMensaje && (
              <View style={styles.exportModalActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => exportarListado('guardar')}
                  style={[styles.exportModalButton, styles.exportSaveButton]}
                >
                  <Text style={styles.exportModalButtonText}>
                    Guardar en el teléfono
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => exportarListado('compartir')}
                  style={[styles.exportModalButton, styles.exportShareButton]}
                >
                  <Text style={styles.exportModalButtonText}>
                    Enviar por WhatsApp
                  </Text>
                </Pressable>
              </View>
            )}
            {!exportando && (
              <Pressable
                accessibilityRole="button"
                onPress={() => setExportacionVisible(false)}
                style={styles.exportModalCancel}
              >
                <Text style={styles.exportModalCancelText}>
                  {exportacionError || exportacionMensaje ? 'Cerrar' : 'Cancelar'}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  resumenContainer2: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  gradienteResumenContainer: {
    alignItems: 'center',
    borderRadius: 5,
    padding: 10,
    width: '30%',
    marginBottom: 10,
    marginHorizontal: 2,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginTop: 4,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  headerContainer: {
    padding: 16,
    backgroundColor: '#4b86b4',
    marginBottom: 16,
    borderRadius: 10,
  },
  detallesItemContainer: {
    backgroundColor: '#fff',
    borderRadius: 5,
    paddingHorizontal: 10,
    margin: 5,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: 'white',
    marginTop: 10,
  },
  headerFiltro: {
    color: '#192f6a',
    marginLeft: 5,
    paddingHorizontal: 10,
    marginBottom: 0,
    fontFamily: 'FiraSans_400Regular',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logo: {
    width: 50,
    height: 50,
  },
  gradienteResumenContainerFichas: {
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 5,
    padding: 5,
    width: '40%',
    marginBottom: 5,
    overflow: 'hidden',
    flexShrink: 1,
    marginHorizontal: 20,
  },
  resumenNumero: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerText: {
    color: '#192f6a',
    marginLeft: 15,
    fontWeight: 'bold',
  },
  headerText2: {
    color: '#192f6a',
    marginLeft: 15,
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
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
  modalOverlay2: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
  },
  modalContainer2: {
    backgroundColor: 'white',
    padding: 20,
    flex: 1,
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 6,
    marginBottom: 8,
    overflow: 'hidden',
  },
  pickerLabel: {
    paddingLeft: 4,
    color: 'gray',
  },
  pickerIOS: {
    height: 150,
  },
  pickerAndroid: {
    height: 50,
    width: '100%',
  },
  texto: {
    fontFamily: 'FiraSans_400Regular',
    fontSize: 18,
  },
  listModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  assignedListTitle: {
    flex: 1,
    flexShrink: 1,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#217346',
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 8,
  },
  exportObjetoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#192f6a',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginLeft: 8,
    marginTop: 4,
  },
  importObjetoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e67e22',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginLeft: 6,
    marginTop: 4,
  },
  exportButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  listModeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 5,
  },
  listModeButtonActive: {
    backgroundColor: '#192f6a',
  },
  listModeText: {
    color: '#192f6a',
    fontWeight: 'bold',
  },
  listModeTextActive: {
    color: 'white',
  },
  objetoObraHeading: {
    flex: 1,
    color: '#192f6a',
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 4,
  },
  objetoObraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  swipeDeleteAction: {
    backgroundColor: '#c62828',
    justifyContent: 'center',
    alignItems: 'center',
    width: 72,
    marginVertical: 4,
    borderRadius: 6,
  },
  deleteObjectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  deleteObjectButtonText: {
    color: '#c62828',
    fontSize: 13,
    fontWeight: '600',
  },
  deleteLineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  assignedItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  assignedLineHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  assignedHierarchy: {
    flex: 1,
    flexShrink: 1,
    color: '#555',
    fontSize: 12,
    lineHeight: 18,
  },
  assignedQuantity: {
    color: '#192f6a',
    fontWeight: 'bold',
  },
  assignedDescription: {
    fontSize: 14,
    fontFamily: 'FiraSans_400Regular',
    fontWeight: 'bold',
    marginTop: 3,
  },
  assignedPrice: {
    fontSize: 16,
    marginTop: 3,
    paddingRight: 5,
  },
  subetapa: {
    fontSize: 12,
    marginTop: 3,
    paddingRight: 5,
  },
  assignedNotes: {
    fontSize: 12,
    color: '#555',
    marginTop: 3,
  },
  exportModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
  },
  exportModalContainer: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
  },
  exportModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#192f6a',
    textAlign: 'center',
    marginBottom: 12,
  },
  exportModalMessage: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
  },
  exportModalActions: {
    gap: 10,
  },
  exportModalButton: {
    alignItems: 'center',
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  exportSaveButton: {
    backgroundColor: '#217346',
  },
  exportShareButton: {
    backgroundColor: '#192f6a',
  },
  exportModalButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  exportModalCancel: {
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 8,
  },
  exportModalCancelText: {
    color: '#555555',
    fontWeight: '600',
  },
  importModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
  },
  importModalContainer: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
  },
  importModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e67e22',
    textAlign: 'center',
    marginBottom: 12,
  },
  importModalMessage: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
  },
  importModalActions: {
    gap: 10,
  },
  importModalButton: {
    alignItems: 'center',
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  importSaveButton: {
    backgroundColor: '#e67e22',
  },
  importModalButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  importModalCancel: {
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 8,
  },
  importModalCancelText: {
    color: '#555555',
    fontWeight: '600',
  },
  emptyAssignedList: {
    textAlign: 'center',
    color: '#666',
    padding: 20,
  },
  cabecera: {
    color: '#192f6a',
    fontWeight: 'bold',
  },
});