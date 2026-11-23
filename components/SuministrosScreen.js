import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter, useLocalSearchParams, Link } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { AppText as Text } from './AppText';
import ScreenHeader from './ScreenHeader';
import { commonStyles } from '../styles/commonStyles';
import { useSuministroSelection } from '../contexts/SuministroSelectionContext';
import { actualizarFiltro, contarSuministros, obtenerSuministros } from '../db/database';

const PAGE_SIZE = 50;

const TIPOS = [
  { id: '1', label: 'Materiales' },
  { id: '2', label: 'Tarifas MO' },
  { id: '3', label: 'Costos Equipos' },
  { id: 'E', label: 'Normas Equipos' },
  { id: 'J', label: 'Juegos Productos' },
  { id: 'N', label: 'Normas MO' },
  { id: 'S', label: 'Semielaborados' },
];

export default function SuministrosScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { setSelectedSuministro } = useSuministroSelection();
  const [suministros, setSuministros] = useState([]);
  const [precioSemielaborado, setPrecioSemielaborado] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [errorCarga, setErrorCarga] = useState('');
  const [selectedTipos, setSelectedTipos] = useState(TIPOS.map(t => t.id));

  useEffect(() => {
    if (params.soloMateriales === '1') {
      setSelectedTipos(['1', 'S']);
    } else {
      setSelectedTipos(TIPOS.map(t => t.id));
    }
  }, [params.soloMateriales]);

  useEffect(() => {
    let cancelado = false;

    const cargar = async () => {
      try {
        const [primeros, cantidad] = await Promise.all([
          obtenerSuministros(db, PAGE_SIZE, 0, busqueda, selectedTipos),
          contarSuministros(db, busqueda, selectedTipos),
        ]);
        if (cancelado) return;
        setErrorCarga('');
        setSuministros(primeros);        
        setTotal(cantidad);
        setOffset(primeros.length);
      } catch (error) {
        if (!cancelado) {
          setErrorCarga(error.message);
          Alert.alert('Error', `No se pudieron cargar los suministros. ${error.message}`);
        }
      }
    };

    cargar();

    return () => {
      cancelado = true;
    };
  }, [db, busqueda, selectedTipos]);

  const cargarMas = async () => {
    if (cargandoMas || offset >= total) return;
    setCargandoMas(true);
    try {
      const siguientes = await obtenerSuministros(db, PAGE_SIZE, offset, busqueda, selectedTipos);
      setErrorCarga('');
      setSuministros(previos => [...previos, ...siguientes]);
      setOffset(previo => previo + siguientes.length);
    } catch (error) {
      setErrorCarga(error.message);
      Alert.alert('Error', `No se pudieron cargar más suministros. ${error.message}`);
    } finally {
      setCargandoMas(false);
    }
  };

  const seleccionarSuministro = async suministro => {
      suministro['MO'] = 0;
      suministro['EQ'] = 0;
      suministro['MA'] = 0;

      if (suministro.Tipo == 'S' || suministro.Tipo == 'J'){
        const recursos = await db.getAllAsync(
          `SELECT rc.Tipo, 
              SUM(rc.Precio * c.Norma) AS Subtotal
          FROM crecursos c
          LEFT JOIN recursos rn ON rn.IDRecurso = c.IDRecursoNorma
          LEFT JOIN recursos rc ON rc.IDRecurso = c.IDRecurso
          WHERE c.IDRecursoNorma = ?
          GROUP BY rc.Tipo
          `, [suministro.IDRecurso]
        );  

       recursos.map( rec => {  
          if(rec.Tipo == "2"){         
            suministro['MO'] = rec.Subtotal ;
          } else if(rec.Tipo == "3"){         
            suministro['EQ'] = rec.Subtotal;
          } else if(rec.Tipo == "1"){          
            suministro['MA'] = rec.Subtotal;
          }               
        });        
      } else if(suministro.Tipo == '1'){ //Materiales       
        suministro['MA'] = suministro.Precio;       
      } else { 
        suministro = null;       
      }

    setSelectedSuministro(suministro);     
    router.back();
  };

  const renderSuministro = ({ item }) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Seleccionar ${item.Recurso}, código ${item.IDRecurso}`}
      onPress={() => seleccionarSuministro(item)}
      style={commonStyles.detallesItemContainer}
    >
      <View style={styles.supplyHeader}>
        <Text style={styles.supplyType}>{item.tiporecurso || 'SUMINISTRO'}</Text>
        <Text style={styles.supplyCode}>{item.IDRecurso}</Text>
      </View>
      <Text style={styles.supplyName}>{item.Recurso || '(Sin descripción)'}</Text>
      <Text style={styles.supplyDetails}>
        {`Precio: $${Number(item.Precio ?? 0).toFixed(2)} | Unidad: ${item.umedicion || item.UM || '—'} `}
        {Number(item.Peso) > 0 ? `  |  Peso: ${Number(item.Peso).toFixed(4)} kg` : ''}
      </Text>
    </Pressable>
  );

  return (
    <>
    <View style={styles.container}>
      <ScreenHeader title="SUMINISTROS" count={total} onBack={() => router.back()} />

      <View style={styles.searchContainer}>
        <FontAwesome5 name="search" size={16} color="#667085" />
        <TextInput
          accessibilityLabel="Buscar suministros"
          placeholder="Buscar por código, nombre o tipo..."
          value={busqueda}
          onChangeText={setBusqueda}
          style={styles.searchInput}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {!!busqueda && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Limpiar búsqueda"
            onPress={() => setBusqueda('')}
            hitSlop={8}
          >
            <FontAwesome5 name="times-circle" size={17} color="#667085" />
          </Pressable>
        )}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 8 }}>
        {TIPOS.map(t => {
          const active = selectedTipos.includes(t.id);
          return (
            <Pressable
              key={String(t.id)}
              onPress={() => {
                setSelectedTipos(prev =>
                  active ? prev.filter(x => x !== t.id) : [...prev, t.id]
                );
              }}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 5,
                backgroundColor: active ? '#4b86b4' : '#eee',
              }}
            >
              <Text style={{ color: active ? '#fff' : '#333', fontSize: 12 }}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={suministros}
        keyExtractor={item => String(item.IDRecurso.toString())}
        renderItem={renderSuministro}
        onEndReached={cargarMas}
        onEndReachedThreshold={0.5}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {errorCarga ||
              (busqueda ? 'No se encontraron suministros.' : 'No hay suministros disponibles.')}
          </Text>
        }
        ListFooterComponent={
          cargandoMas ? <ActivityIndicator color="#4b86b4" style={styles.loading} /> : null
        }
      />
    </View>
    <Pressable style={commonStyles.buttonFlotante} onPress={() => router.push('/AgregarSuministro')}>
      <FontAwesome5 name="plus" size={20} color="#fff" />
    </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 50,
    height: 50,
    borderRadius: 5,
    backgroundColor: '#4b86b4',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    elevation: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 12,
    marginVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  searchInput: {
    flex: 1,
    minHeight: 44,
    color: '#222',
    fontFamily: 'FiraSans_400Regular',
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
  supplyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  supplyType: {
    flex: 1,
    color: '#4b86b4',
    fontSize: 12,
    fontWeight: '700',
  },
  supplyCode: {
    color: '#666',
    fontSize: 12,
  },
  supplyName: {
    marginTop: 4,
    color: '#192f6a',
    fontSize: 15,
    fontWeight: '600',
  },
  supplyDetails: {
    marginTop: 4,
    color: '#555',
    fontSize: 12,
  },
  emptyText: {
    padding: 20,
    color: '#666',
    textAlign: 'center',
  },
  loading: {
    marginVertical: 16,
  },
});
