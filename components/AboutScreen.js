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
              source={require('../assets/logo-portada.png')}
              style={styles.logo}
              resizeMode="contain"
            />

            <Text style={styles.subtitleText}>
              SISTEMA DE CÓDIGOS DEL PRECONS III{'\n'}CÁLCULOS ESTIMADOS DE PRECIOS{'\n'}Versión: Beta {'\n'}( Build 23112026 )
            </Text>

           
            <Text style={styles.label}>Desarrollador:</Text>
            <Text style={styles.value}>Lic. Alexei Gómez Ruiz (Especialista en Ciencias Informáticas)</Text>

            <Text style={styles.label}>Colaborador:</Text>
            <Text style={styles.value}>MSc. Ing. Abel Vladimir López Bravo (Especialista en Obras Civiles)</Text>

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
    marginHorizontal: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    marginBottom: 45
  },

  label: {
    fontWeight: 'bold',
    marginTop: 12,
    textAlign: 'center'
  },
  value: {
    marginLeft: 8,
    textAlign: 'center'
  },
  paragraph: {
    marginTop: 8,
    lineHeight: 18,
    textAlign: 'center'
  },
  logo: {
    width: 100,
    height: 100,    
    alignSelf: 'center',
  },
  subtitleText: {
    marginTop: 1,
    color: '#192f6a',
    textAlign: 'center'
  },
});