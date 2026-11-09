import { StyleSheet, View, Image, ScrollView } from "react-native";
import { AppText as Text } from './AppText';
import '../global.css'
import ScreenHeader from './ScreenHeader';

export default function AboutScreen(){
    return (
      <View style={styles.contentContainer}>        
        <ScreenHeader title="ACERCA DE" backHref="/Principal" />

        <View style={styles.infoBox}>
          <ScrollView>
            <Image          
              source={require('../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />

            <Text style={styles.label}>Nombre de la Aplicación:</Text>
            <Text style={styles.value}>ENCODIGO - SISTEMA DE CÓDIGOS DEL PRECONS & CÁLCULOS ESTIMADOS DE PRECIOS. </Text>

            <Text style={styles.label}>Versión:</Text>
            <Text style={styles.value}>1.0.0  ( Build 15102026 )</Text>

            <Text style={styles.label}>Desarrollador:</Text>
            <Text style={styles.value}>Lic. Alexei Gómez Ruiz (Especialista en Ciencias Informáticas)</Text>

            <Text style={styles.label}>E-mail:</Text>
            <Text style={styles.value}>alex6gomez77@gmail.com </Text>
            <Text style={styles.label}>Teléfono:</Text>
            <Text style={styles.value}>+5354256428</Text>

            <Text style={styles.label}>Descripción:</Text>
            <Text style={styles.paragraph}>
              ENCODIGO permite consultar los códigos y renglones constructivos de PRECONS III, organizar clientes y obras, y asociar a cada obra objetos de obra, renglones y suministros. Con las cantidades, precios y parámetros configurados, calcula importes estimados y facilita la generación e intercambio de documentos de la obra. Los resultados son una referencia de trabajo: deben revisarse y validarse con la información y las disposiciones vigentes antes de utilizarlos como precios definitivos.
            </Text>
          </ScrollView>
        </View>       
      </View>
    )
}

const styles = StyleSheet.create({
   contentContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 0,
    alignItems: 'stretch',
    justifyContent: 'flex-start'
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBox: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginHorizontal: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    marginBottom: 45
  },

  label: {
    fontWeight: 'bold',
    marginTop: 12,
  },
  value: {
    marginLeft: 8,
  },
  paragraph: {
    marginTop: 8,
    lineHeight: 18,
  },
  logo: {
    width: 150,
    height: 150,
    backgroundColor: '#f2f2f2',
    borderRadius: 75,
    alignSelf: 'center',
    marginTop: 20,
  },
});