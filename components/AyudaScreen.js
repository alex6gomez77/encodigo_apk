import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Link } from "expo-router";
import { AppText as Text } from "./AppText";
import ScreenHeader from "./ScreenHeader";
import { commonStyles } from '../styles/commonStyles.js';

export default function AyudaScreen() {
  return (
    <View style={styles.contentContainer}>
      <ScreenHeader title="AYUDA" backHref="/Principal" />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.infoBox}>
        <Text style={styles.intro}>
          ENCODIGO es una herramienta para consultar y utilizar los códigos de
          PRECONS III en la elaboración de obras, y obtener cálculos
          estimados de sus precios.
        </Text>

        <Text style={styles.sectionTitle}>Codificación PRECONS III</Text>

        <Text style={styles.question}>1. ¿Cómo busco un código?</Text>
        <Text style={styles.answer}>
          Desde la pantalla principal, abre Secciones para recorrer la
          clasificación. Toca una sección para ver sus capítulos, un capítulo
          para ver sus subcapítulos y un subcapítulo para consultar sus
          renglones constructivos. También puedes abrir Renglones directamente
          y utilizar el filtro para buscar por código o descripción.
        </Text>

        <Text style={styles.question}>
          2. ¿Qué información muestra un renglón?
        </Text>
        <Text style={styles.answer}>
          Al seleccionar un renglón puedes revisar su código, descripción,
          unidad de medida, precio y elementos de composición disponibles. Usa
          esta información para comprobar que corresponde al trabajo que vas a
          presupuestar.
        </Text>

        <Text style={styles.question}>
          3. ¿Cómo quito un filtro de búsqueda?
        </Text>
        <Text style={styles.answer}>
          Cuando hay un filtro activo, la pantalla lo indica. Pulsa el botón de
          borrar filtro para volver a mostrar todos los elementos de esa lista.
        </Text>

        <Text style={styles.sectionTitle}>Obras y precios estimados</Text>

        <Text style={styles.question}>4. ¿Cómo creo una obra?</Text>
        <Text style={styles.answer}>
          Entra en Obras y pulsa el botón “+”. Completa los datos
          solicitados, como código, nombre, cliente, tipo, cantidad y
          porcentajes aplicables. Revisa los valores antes de guardar: se usan
          en la preparación y el cálculo estimado de la obra.
        </Text>

        <Text style={styles.question}>
          5. ¿Cómo agrego un renglón constructivo a una obra?
        </Text>
        <Text style={styles.answer}>
          En Renglones, selecciona el renglón que necesitas y elige la acción
          para agregarlo. En el formulario selecciona la obra, el objeto de
          obra y la cantidad; luego pulsa “AGREGAR”. Si corresponde, activa la
          opción para continuar a Preliminares.
        </Text>

        <Text style={styles.question}>6. ¿Para qué sirve Preliminares?</Text>
        <Text style={styles.answer}>
          Permite consultar el catálogo de renglones preliminares y los que ya
          están asignados a la obra seleccionada. Úsalo para completar los
          conceptos preliminares que correspondan a tu estimación.
        </Text>

        <Text style={styles.question}>
          7. ¿Cómo se calcula el precio estimado?
        </Text>
        <Text style={styles.answer}>
          El cálculo se basa en los renglones y cantidades incorporados al
          la obra, junto con sus datos de precios y los porcentajes
          configurados. El resultado es una estimación: verifica que los códigos,
          precios, unidades, cantidades y parámetros estén actualizados y sean
          los aplicables antes de utilizarlo como precio definitivo.
        </Text>

        <Text style={styles.question}>
          8. ¿Dónde configuro los datos y porcentajes?
        </Text>
        <Text style={styles.answer}>
          En Generales puedes revisar los parámetros generales disponibles.
          En Obras también se muestran campos de porcentajes para cada
          obra. Confirma los valores requeridos con la normativa y la
          información vigente de tu entidad.
        </Text>

        <Text style={styles.sectionTitle}>Gestión y documentos</Text>

        <Text style={styles.question}>9. ¿Puedo duplicar una obra?</Text>
        <Text style={styles.answer}>
          Sí. En Obras usa la acción de duplicar de la obra y define el
          nuevo código y nombre. Revisa y actualiza sus datos antes de trabajar
          con la copia. Algunas operaciones pueden depender del estado de la
          licencia.
        </Text>

        <Text style={styles.question}>
          10. ¿Cómo importo o exporto una obra?
        </Text>
        <Text style={styles.answer}>
          En Obras están disponibles las acciones para importar y exportar
          obras mediante archivos .fik. Para importar, selecciona el
          archivo recibido; para exportar, elige la obra y comparte o
          guarda el archivo generado. Estas operaciones pueden depender del
          estado de la licencia.
        </Text>

        <Text style={styles.question}>
          11. ¿Cómo genero un documento para imprimir?
        </Text>
        <Text style={styles.answer}>
          En Obras, utiliza la acción de Word de la obra correspondiente
          para generar un documento .docx. Luego selecciona dónde guardarlo o
          compártelo desde las opciones del dispositivo.
        </Text>

        <Text style={styles.question}>12. ¿Cómo elimino una obra?</Text>
        <Text style={styles.answer}>
          En Obras, pulsa el icono de papelera de la obra que deseas
          eliminar y confirma la operación. La eliminación puede ser
          permanente.
        </Text>

        <Text style={styles.sectionTitle}>Documentación y soporte</Text>
        <Text style={styles.answer}>
          Consulta la normativa aplicable y verifica sus actualizaciones antes
          de utilizar los resultados de la estimación.
        </Text>
        <Link
          href="https://www.gacetaoficial.gob.cu/es/resolucion-148-de-2023-de-ministerio-de-finanzas-y-precios"
          style={styles.link}
        >
          Resolución 148/2023 (GOC-2023-593-O64)
        </Link>

        <Text style={styles.question}>¿Cómo saber si hay una nueva versión?</Text>
        <Text style={styles.answer}>Consulta el proyecto ENCODIGO:</Text>
        <Link
          href="https://drive.google.com/drive/folders/1g90nKs5f-05UStcy81WXdDW4c1myPyZT?usp=drive_link"
          style={styles.link}
        >
          PROYECTO ENCODIGO
        </Link>

        <Text style={styles.question}>¿Cómo contactar al soporte técnico?</Text>
        <Text style={styles.answer}>
          Si tienes problemas con la aplicación, escribe a
          alex6gomez77@gmail.com o llama al +53 54256428.
        </Text>

        <Text style={styles.sectionTitle}>Control de versiones</Text>
        <Text style={styles.versionTitle}>
          Versión (APK) 1.0.0 (Build 30112025)
        </Text>
        <Text style={styles.listItem}>• Primera versión para Android.</Text>
        <Text style={styles.versionTitle}>Versión (PC) 2.1.0 (31/05/2025)</Text>
        <Text style={styles.listItem}>
          • Se aplica redondeo al precio final de la obra o del producto.
        </Text>
        <Text style={styles.listItem}>
          • Corrección de caracteres no válidos en nombres de archivos exportados.
        </Text>
        <Text style={styles.versionTitle}>Versión (PC) 2.0.0 (15/03/2025)</Text>
        <Text style={styles.listItem}>• Nueva interfaz de usuario.</Text>
        <Text style={styles.listItem}>
          • Mejoras en la gestión de recursos y equipos.
        </Text>
        <Text style={styles.versionTitle}>Versión (PC) 1.5.0 (10/12/2024)</Text>
        <Text style={styles.listItem}>
          • Soporte para exportación e importación de obras.
        </Text>
        <Text style={styles.versionTitle}>Versión (PC) 1.0.0 (01/09/2024)</Text>
        <Text style={styles.listItem}>• Primera versión pública.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    width: "100%",
  },
  infoBox: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingBottom: 16,
    marginHorizontal: 5,
    ...commonStyles.shadow,
  },
  intro: {
    marginTop: 12,
    color: "#333",
    lineHeight: 20,
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginTop: 16,
    marginBottom: 8,
    color: "#2a4d8f",
  },
  question: {
    fontWeight: "bold",
    marginTop: 12,
    color: "#1a2a4d",
  },
  answer: {
    marginTop: 4,
    marginBottom: 8,
    color: "#333",
    lineHeight: 18,
  },
  link: {
    color: "#1a5fb4",
    textDecorationLine: "underline",
    marginBottom: 8,
  },
  listItem: {
    marginLeft: 16,
    color: "#444",
    marginBottom: 2,
  },
  versionTitle: {
    fontWeight: "bold",
    marginTop: 10,
    color: "#4c669f",
  },
});
