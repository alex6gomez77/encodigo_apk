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
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { AppText as Text } from './AppText';
import ScreenHeader from './ScreenHeader';
import { commonStyles } from '../styles/commonStyles';
import { useSuministroSelection } from '../contexts/SuministroSelectionContext';
import { contarSuministros, obtenerSuministros } from '../db/database';

const PAGE_SIZE = 50;

export default function SuministrosScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { setSelectedSuministro } = useSuministroSelection();
  const [suministros, setSuministros] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [errorCarga, setErrorCarga] = useState('');

  useEffect(() => {
    let cancelado = false;

    const cargar = async () => {
      try {
        const [primeros, cantidad] = await Promise.all([
          obtenerSuministros(db, PAGE_SIZE, 0, busqueda),
          contarSuministros(db, busqueda),
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
  }, [db, busqueda]);

  const cargarMas = async () => {
    if (cargandoMas || offset >= total) return;
    setCargandoMas(true);
    try {
      const siguientes = await obtenerSuministros(db, PAGE_SIZE, offset, busqueda);
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

  const seleccionarSuministro = suministro => {
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
        {`Unidad: ${item.umedicion || item.UM || '—'}  |  Precio: $${Number(item.Precio ?? 0).toFixed(2)}`}
        {Number(item.Peso) > 0 ? `  |  Peso: ${Number(item.Peso).toFixed(4)} kg` : ''}
      </Text>
    </Pressable>
  );

  return (
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

      <FlatList
        data={suministros}
        keyExtractor={item => String(item.IDRecurso)}
        renderItem={renderSuministro}
        onEndReached={cargarMas}
        onEndReachedThreshold={0.4}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {errorCarga ||
              (busqueda ? 'No se encontraron suministros.' : 'No hay suministros disponibles.')}
          </Text>
        }
        ListFooterComponent={
          cargandoMas ? <ActivityIndicator color="#4c669f" style={styles.loading} /> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    color: '#4c669f',
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
