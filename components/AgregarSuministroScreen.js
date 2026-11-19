import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { AppText as Text, AppTextInput as TextInput, AppButton as Button } from './AppText';
import { Picker } from '@react-native-picker/picker';
import ScreenHeader from './ScreenHeader';

export default function AgregarSuministroScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('');
  const [unidad, setUnidad] = useState('');
  const [precio, setPrecio] = useState('');
  const [tipos, setTipos] = useState([]);
  const [unidades, setUnidades] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const t = await db.getAllAsync('SELECT * FROM recursotipos ORDER BY tiporecurso');
        const u = await db.getAllAsync('SELECT * FROM unidadesmedidas ORDER BY umedicion');
        setTipos(t);
        setUnidades(u);
        if (t.length) setTipo(String(t[0].idtiporecurso));
        if (u.length) setUnidad(String(u[0].um));
      } catch (e) {}
    })();
  }, [db]);

  const handleGuardar = async () => {
    if (!nombre.trim()) {
      Alert.alert('Validación', 'Debe ingresar el nombre del suministro.');
      return;
    }
    try {
      await db.runAsync(
        'INSERT INTO recursos (IDRecurso, Recurso, Tipo, UM, Precio, Activo) VALUES (?,?,?,?,?,1)',
        codigo.trim() || null,
        nombre.trim(),
        tipo,
        unidad || null,
        Number(precio) || 0
      );
      Alert.alert('Éxito', 'Suministro guardado.');
      router.back();
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar el suministro.');
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="AGREGAR SUMINISTRO" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Código</Text>
        <TextInput style={styles.input} value={codigo} onChangeText={setCodigo} />
        <Text style={styles.label}>Nombre</Text>
        <TextInput style={styles.input} value={nombre} onChangeText={setNombre} />
        <Text style={styles.label}>Tipo</Text>
        <View style={styles.pickerWrapper}>
          <Picker selectedValue={tipo} onValueChange={setTipo}>
            {tipos.map(t => (
              <Picker.Item key={t.idtiporecurso} label={t.tiporecurso} value={String(t.idtiporecurso)} />
            ))}
          </Picker>
        </View>
        <Text style={styles.label}>Unidad</Text>
        <View style={styles.pickerWrapper}>
          <Picker selectedValue={unidad} onValueChange={setUnidad}>
            {unidades.map(u => (
              <Picker.Item key={u.um} label={u.umedicion || u.um} value={String(u.um)} />
            ))}
          </Picker>
        </View>
        <Text style={styles.label}>Precio</Text>
        <TextInput style={styles.input} value={precio} onChangeText={setPrecio} keyboardType="numeric" />
        <Button title="Guardar" onPress={handleGuardar} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16 },
  label: { marginTop: 8, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, marginTop: 4 },
  pickerWrapper: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, marginTop: 4 },
});