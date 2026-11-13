import { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Image, Pressable, Modal } from 'react-native';
import { AppText as Text } from './AppText';
import { useSQLiteContext } from 'expo-sqlite';
import { Link } from 'expo-router'
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function PrincipalScreen() {
  const db = useSQLiteContext();

  const [totalObras, settotalObras] = useState(0);
  const [totalSecciones, settotalSecciones] = useState(0);
  const [totalCapitulos, settotalCapitulos] = useState(0);
  const [totalSubCapitulos, settotalSubCapitulos] = useState(0);
  const [totalRenglones, settotalRenglones] = useState(0);
  const [totalClientes, setTotalClientes] = useState(0);
  const [totalObjetos, setTotalObjetos] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);

  async function loadResumen() {
    try {
      const result = await db.getFirstAsync('SELECT COUNT(*) AS total FROM obras');
      settotalObras(result?.total ?? 0);

      const resultSecciones = await db.getFirstAsync('SELECT COUNT(*) as total FROM sobregrupos');
      settotalSecciones(resultSecciones?.total ?? 0);

      const resultCapitulos = await db.getFirstAsync('SELECT COUNT(*) as total FROM grupos');
      settotalCapitulos(resultCapitulos?.total ?? 0);

      const resultSubCapitulos = await db.getFirstAsync('SELECT COUNT(*) as total FROM subgrupos');
      settotalSubCapitulos(resultSubCapitulos?.total ?? 0);

      const resultRenglones = await db.getFirstAsync('SELECT COUNT(*) as total FROM rvariantes');
      settotalRenglones(resultRenglones?.total ?? 0);
      
      const resultClientes = await db.getFirstAsync('SELECT COUNT(*) as total FROM clientes');
      setTotalClientes(resultClientes?.total ?? 0);

    const resultObjetos = await db.getFirstAsync('SELECT COUNT(*) as total FROM objetosdeobras');
      setTotalObjetos(resultObjetos?.total ?? 0);

    } catch (e) {
    }
  }

  useEffect(() => {
    if (db) {
      loadResumen();
    }
  }, [db]);

  return (
    <View style={styles.container}>          
        
        <View style={styles.contenedorPrincipal}>
          {/* Texto de fondo */}
         
          
          {/* Logo encima */}
          <Link href="/" asChild>
            <Pressable style={styles.contenedorLogo}>
              <Image
                source={require('../assets/logo-portada.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </Pressable>
          </Link>
        </View>
        
      

      <View style={styles.resumenContainer2}>

        <View style={{ display: 'flex',   flexDirection: 'row', justifyContent: 'space-between'}}>
          <LinearGradient          
            colors={['#f2f2f2',  '#abcdf3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradienteResumenContainerFichas}
          >
          <Link href="/Obras" asChild>
            <Pressable style={{alignItems: 'center'}}>
            <FontAwesome5 name="building" size={30} color="#192f6a" />
            <Text 
              style={styles.cabecera}
              adjustsFontSizeToFit
              numberOfLines={1}
              minimumFontScale={0.6}
            >
                Obras
              </Text>
              <Text style={styles.resumenNumero} adjustsFontSizeToFit numberOfLines={1}>
                {totalObras}
              </Text>
            </Pressable>
          </Link>
          </LinearGradient>

          
          
          <LinearGradient          
            colors={['#f2f2f2',  '#abcdf3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradienteResumenContainer}
          >
          <Link href="/Generales" asChild>
            <Pressable style={{alignItems: 'center'}}>
            <FontAwesome5 name="sliders-h" size={30} color="#192f6a" />
            <Text 
              style={styles.cabecera}
              adjustsFontSizeToFit
              numberOfLines={1}
              minimumFontScale={0.6}
            >
                Generales
              </Text>
              <Text style={styles.resumenNumero} adjustsFontSizeToFit numberOfLines={1}>
                 
              </Text>
            </Pressable>
          </Link>
          </LinearGradient>
        </View>

       
        <View style={{ display: 'flex',   flexDirection: 'row', justifyContent: 'space-between'}}>
          <LinearGradient          
          colors={['#f2f2f2',  '#abcdf3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradienteResumenContainer}
        >
          <Link href="/Secciones" asChild>
            <Pressable style={{alignItems: 'center'}} >
              <FontAwesome5 name="th-large" size={30} color="#192f6a" />
              <Text 
                style={styles.cabecera}
                adjustsFontSizeToFit
                numberOfLines={1}
                minimumFontScale={0.6}
              >
                Secciones
              </Text>
              <Text style={styles.resumenNumero} adjustsFontSizeToFit numberOfLines={1}>
                {totalSecciones}
              </Text>
            </Pressable>
          </Link>
          </LinearGradient>
          <LinearGradient          
          colors={['#f2f2f2',  '#abcdf3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradienteResumenContainer}
        >

          <Link href="/Capitulos" asChild>
            <Pressable style={{alignItems: 'center'}}>
            <FontAwesome5 name="book" size={30} color="#192f6a" />
            <Text 
              style={styles.cabecera}
              adjustsFontSizeToFit
              numberOfLines={1}
              minimumFontScale={0.6}
            >
                Capítulos
              </Text>
              <Text style={styles.resumenNumero} adjustsFontSizeToFit numberOfLines={1}>
                {totalCapitulos}
              </Text>
            </Pressable>
          </Link>
          </LinearGradient>

        <LinearGradient          
          colors={['#f2f2f2',  '#abcdf3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradienteResumenContainer}
        >
          <Link href="/SubCapitulos" asChild>
            <Pressable style={{alignItems: 'center'}}>
            <FontAwesome5 name="angle-right" size={30} color="#192f6a" />
            <Text 
              style={styles.cabecera}
              adjustsFontSizeToFit
              numberOfLines={1}
              minimumFontScale={0.6}
            >
                SubCapítulos
              </Text>
              <Text style={styles.resumenNumero} adjustsFontSizeToFit numberOfLines={1}>
                {totalSubCapitulos}
              </Text>
            </Pressable>
          </Link>          
          </LinearGradient>
        </View>

        <View style={{ display: 'flex',   flexDirection: 'row', justifyContent: 'space-between'}}>
          <LinearGradient          
          colors={['#f2f2f2',  '#abcdf3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradienteResumenContainer}
        >
          <Link href="/Renglones" asChild>
            <Pressable style={{alignItems: 'center'}}>
            <FontAwesome5 name="bars" size={30} color="#192f6a" />
            <Text 
              style={styles.cabecera}
              adjustsFontSizeToFit
              numberOfLines={1}
              minimumFontScale={0.6}
            >
                Renglones
              </Text>
              <Text style={styles.resumenNumero} adjustsFontSizeToFit numberOfLines={1}>
                {totalRenglones}
              </Text>
            </Pressable>
          </Link>
          </LinearGradient>
          <LinearGradient          
            colors={['#f2f2f2',  '#abcdf3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradienteResumenContainer}
          >
          <Link href="/Clientes" asChild>
            <Pressable style={{alignItems: 'center'}}>
            <FontAwesome5 name="pen-fancy" size={30} color="#192f6a" />
            <Text 
              style={styles.cabecera}
              adjustsFontSizeToFit
              numberOfLines={1}
              minimumFontScale={0.6}
            >
                Clientes
              </Text>
              <Text style={styles.resumenNumero} adjustsFontSizeToFit numberOfLines={1}>
                {totalClientes}
              </Text>
            </Pressable>
          </Link>
          </LinearGradient>
          <LinearGradient          
            colors={['#f2f2f2',  '#abcdf3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradienteResumenContainer}
          >
          <Link href="/Objetos" asChild>
            <Pressable style={{alignItems: 'center'}}>
            <FontAwesome5 name="briefcase" size={30} color="#192f6a" />
            <Text 
              style={styles.cabecera}
              adjustsFontSizeToFit
              numberOfLines={1}
              minimumFontScale={0.6}
            >
                Objetos
              </Text>
              <Text style={styles.resumenNumero} adjustsFontSizeToFit numberOfLines={1}>
                {totalObjetos}
              </Text>
            </Pressable>
          </Link>
          </LinearGradient>
         
        </View>
      </View>

      
    <View style={{alignItems: 'center', flexDirection: 'row', marginTop: 'auto', justifyContent: 'space-around'}}>
     
      <Link href="/Ayuda" style={{  color: '#3b5998', fontSize: 14, flexDirection: 'row', alignItems: 'center', marginRight: '30%' }} >
        <FontAwesome5 name="question-circle" size={14} color="#3b5998" /> Ayuda
      </Link>
     
      <Link href="/About" style={{ color: '#3b5998', fontSize: 14 }} >
      <FontAwesome5 name="info-circle" size={14} color="#3b5998" /> Acerca de...
      </Link>
     
     </View> 
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  logo: {
    width: 300,
    height: 300,
  },

  gradienteContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: '#4a71c7', 
    borderBottomLeftRadius: 80,
    borderBottomRightRadius: 80,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
    height: '20%'
  },
  gradienteBarraContainer: {
    alignItems: 'center',
    backgroundColor: '#4a71c7', 
    padding: 10,
    width: '90%',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
    overflow: 'hidden',
    borderRadius: 10,
  },
  gradienteResumenContainer: {
    alignItems: 'center',
    backgroundColor: '#4a71c7', 
    borderRadius: 5,
    padding: 10,
    width: '30%',
    marginBottom: 10,
    shadowColor: '#4a71c7',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
    overflow: 'hidden',
    flexShrink: 1,
    marginHorizontal: 2
  },
  gradienteResumenContainerFichas: {
    alignItems: 'center',
    backgroundColor: '#4a71c7', 
    borderRadius: 5,
    padding: 10,
    width: '64%',
    marginBottom: 10,
    shadowColor: '#4a71c7',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
    overflow: 'hidden',
    flexShrink: 1,
    marginHorizontal: 2
  },
  cabecera: {
    textAlign: 'center', 
    color: "#192f6a", 
    marginTop: 5,
    fontSize: 15
  },
  resumenContainer2: {    
    padding: 10,   
    width: '95%',
    marginBottom: 10,     
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    marginTop: 5
  },
  resumenNumero: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#192f6a',
    textAlign: 'center',
    marginTop: 1,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
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
  },
  modalButtons: {
    alignItems: 'center',
    width: '100%',
  },
  button: {
    padding: 10,
    borderRadius: 5,
    width: '45%',
  },
  buttonLater: {
    padding: 10,
    borderRadius: 5,
    width: '80%',
    backgroundColor: '#ccc',
    marginTop: 10,
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
  },
  warningIconContainer: {
    position: 'absolute',
    top: 20,
    right: 50,
  },
  contenedorPrincipal: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoFondo: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    fontSize: 60, // Ajusta según tu necesidad
    fontWeight: 'bold',
    color: '#192f6a', // Blanco con baja opacidad
    zIndex: 1,
    // Si quieres que el texto esté centrado verticalmente:
    top: '15%',
    transform: [{ translateY: -40 }], // Mitad del fontSize aproximadamente
  },
  contenedorLogo: {
    zIndex: 2, // Asegura que el logo esté encima
  },
});