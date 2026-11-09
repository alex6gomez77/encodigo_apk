import { StyleSheet } from 'react-native';

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  content: {
    padding: 16,
    paddingBottom: 32,
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  subtitle: {
    color: '#192f6a',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  text: {
    color: '#333333',
    fontSize: 14,
    lineHeight: 20,
  },

  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'center',
  },

  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  gradienteContainer: {
    width: '100%',
    marginBottom: 0,
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
  },

  // Puedes agregar aquí más estilos comunes
  
  contentContainer: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 15,
    marginBottom: 16,
  },

    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
    },

  headerText: {
    color: '#ffffff',
    marginLeft: 5
  },
    textoLink: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },  
    gradienteBarraContainer: {
        alignItems: 'center',
        backgroundColor: '#4c669f', // Fallback color
        borderRadius: 10,
        padding: 10,
        width: '100%',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 3,
      },
        resumenNumero: {
            color: '#ffffff',
            fontSize: 24,
            fontWeight: 'bold',
        },
        resumenTexto: {
            color: '#ffffff',
            fontSize: 16,
        },
       /*       modalContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#ffffff',
        },
  */
  
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    width: '100%',
    maxHeight: '85%',
    padding: 16,
  },

        modalContent: {
            width: '80%',
            backgroundColor: '#ffffff',
            borderRadius: 10,
            padding: 20,
            elevation: 5,
        },
        modalTitle: {
            fontSize: 20,
            fontWeight: 'bold',
            marginVertical: 12,
        },

        input: {
            borderWidth: 1,
            borderColor: '#cccccc',
            borderRadius: 5,
            padding: 10,
            marginBottom: 12,
        },
        botonesContainer: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            marginTop: 12,
        },
        buttonsRow: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            marginTop: 12,
        },
        botonesCabecera: {
        flexDirection: 'row',
        marginTop: 8,
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '90%',
        },
        button: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 5,
            marginLeft: 10
        },
        buttonObraFlotante: {
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            marginHorizontal: 3,
        },
        buttonFlotante: {
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: 20,
            padding: 10,
            position: "absolute", 
            bottom: 40, 
            right: 60, 
            backgroundColor: "#4c669f",
            width: 40,
            height: 40
        },
        buttonFlotanteEliminarFiltro: {
          flexDirection: 'row',
          alignItems: 'center',
          padding: 10,
          position: "absolute", 
          top: 40, 
          right: 5, 
          width: 40,
          height: 40
      },
        buttonFlotanteImportar: {
            flexDirection: 'row',
            alignItems: 'center',
          //  borderWidth: 1,
           // borderColor: '#192f6a',
            borderRadius: 20,
            padding: 7,
            position: "absolute", 
            bottom: 85, 
            right: 67, 
           // backgroundColor: "#192f6a",
            width: 30,
            height: 30
        },
        buttonFlotantePartida: {
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#4b86b4',
            borderRadius: 5,
            padding: 4,
            position: "absolute", 
            top: 35, 
            right: 7, 
            backgroundColor: "#4c669f",
        },
         fondoFlotantePartida: {
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#f2f2f2',
            borderRadius: 5,
            padding: 4,
            position: "absolute", 
            top: 0, 
            right: 20, 
            backgroundColor: "#f2f2f2",
            width: 35,
            height: 60
        },
        buttonFichaFlotante: {
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: 20,
            padding: 10,
            width: 40,
            height: 40            
        },
        headerFiltro: {
          color: '#192f6a',
          marginLeft: 5,
          paddingHorizontal: 10,
          marginBottom: 10,
          fontFamily: 'FiraSans_400Regular',
        },
        itemContainer: {
            padding: 5,
            borderBottomWidth: 1,
            borderBottomColor: '#e0e0e0',
            marginBottom: 10,
        },
        detallesItemContainer: {
            backgroundColor: '#ebf8fd',
            borderRadius: 3,
            paddingHorizontal: 10,
            margin: 2,
        },

        detallesItemPartidas: {
            backgroundColor: '#ffffff',
            borderRadius: 5,
            paddingHorizontal: 10,
            paddingBottom: 10,
            margin: 5,
        },
         detallesObrasContainer: {
            backgroundColor: '#ffffff',
            borderRadius: 5,
            padding: 12,
            margin: 5,
        },
        actividadItemText: {
            fontSize: 16,
            marginBottom: 4,
        },
        actividadItemButton: {
            backgroundColor: '#4c669f',
            padding: 8,
            borderRadius: 5,
            alignItems: 'center',
            marginTop: 8,
        },
        actividadItemButtonText: {
            color: '#ffffff',
            fontWeight: 'bold',
        },
        gradienteResumenContainer: {
            alignItems: 'center',
            backgroundColor: '#4c669f', // Fallback color
            borderRadius: 10,
            padding: 10,
            width: '30%',
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowRadius: 5,
            elevation: 3,
          },          
       
        pickerContainer: {
            borderWidth: 1,
            borderColor: '#999',
            borderRadius: 6,
            marginBottom: 8,
            overflow: 'hidden', // importante para que el borde redondeado funcione
        },
        pickerLabel: {
            paddingLeft: 4,
            color: 'gray'
        },
        pickerIOS: {
            height: 150,
            backgroundColor: 'white',
            paddingLeft: 8,
        },
        pickerAndroid: {
            height: 50,
            width: '100%',
            backgroundColor: 'white',
            paddingLeft: 8,
        },

        resumenContainer: {
            backgroundColor: '#ffffff',
            borderRadius: 5,
            padding: 12,
            margin: 5,
            
        },

        
  modalOverlay: {
    flex:1,
    backgroundColor: 'rgba(0,0,0,0.5)', // Semi transparente para modal
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },

  etiquetaCosto: {
    position: 'absolute',
    right: 10,
    top: 0,
    backgroundColor: '#4c669f',
    borderEndEndRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    elevation: 3,
    minWidth: 100,
    alignItems: 'center',
  },
   etiquetaPrecio: {
    position: 'absolute',
    right: 10,
    top: 0,
    backgroundColor: '#f9f9f9',
    borderEndEndRadius: 8,
    borderBottomStartRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    elevation: 2,
    minWidth: 100,
    alignItems: 'center',
    height: 28,
  },
  
  etiquetaObraActiva: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    position: 'absolute',
    right: 10,
    top: 0,
    backgroundColor: '#4b86b4',
    borderEndEndRadius: 8,
    borderBottomStartRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 2,
    elevation: 2,
    minWidth: 100,
    alignItems: 'center',
    height: 20,
  },
   etiquetaObraInactiva: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    position: 'absolute',
    right: 10,
    top: 0,
    backgroundColor: '#fff',
    borderEndEndRadius: 8,
    borderBottomStartRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 2,
    elevation: 2,
    minWidth: 100,
    alignItems: 'center',
    height: 20,
  },


  eliminarItemDetalles: {
    position: 'absolute',
    right: 0,
    top: 50,
    borderRadius: 16,
    paddingHorizontal: 0,
    paddingVertical: 4,               
    minWidth: 70,
    alignItems: 'center',
  },

  editarItemListadoEquipos: {
    position: 'absolute',
    right: 35,
    top: 60,
    borderRadius: 16,
    alignItems: 'center',
  },

   eliminarItemListadoRecursos: {
    position: 'absolute',
    right: 10,
    bottom: 30,
    borderRadius: 16,
    alignItems: 'center',
  },

  editarItemListadoRecursos: {
    position: 'absolute',
    right: 35,
    bottom: 30,
    borderRadius: 16,
    alignItems: 'center',
  },

   eliminarItemListadoEquipos: {
    position: 'absolute',
    right: 10,
    top: 60,
    borderRadius: 16,
    alignItems: 'center',
  },

  eliminarItemDetallesRecursos: {
    position: 'absolute',
    right: 0,
    top: 35,
    borderRadius: 16,
    paddingHorizontal: 0,
    paddingVertical: 4,               
    minWidth: 70,
    alignItems: 'center',
  },

   editarItemListadoActividades: {
    position: 'absolute',
    right: 35,
    bottom: 8,
    borderRadius: 16,
    alignItems: 'center',
  },
   eliminarItemListadoActividades: {
    position: 'absolute',
    right: 10,
    bottom: 8,
    borderRadius: 16,
    alignItems: 'center',
  },

   editarItemListadoClientes: {
    position: 'absolute',
    right: 35,
    bottom: 20,
    borderRadius: 16,
    paddingHorizontal: 0,
    alignItems: 'center',
  },

   eliminarItemListadoClientes: {
    position: 'absolute',
    right: 10,
    bottom: 20,
    borderRadius: 16,
    paddingHorizontal: 0,
    alignItems: 'center',
  },

  editarItemListados: {
    position: 'absolute',
    right: 30,
    top: 25,
    borderRadius: 16,
    paddingHorizontal: 0,
    paddingVertical: 4,               
    minWidth: 70,
    alignItems: 'center',
  },

   eliminarItemListados: {
    position: 'absolute',
    right: 0,
    top: 35,
    borderRadius: 16,
    paddingHorizontal: 0,
    paddingVertical: 4,               
    minWidth: 70,
    alignItems: 'center',
  },

   campoCodigo: { 
    fontSize: 16,
    marginBottom: 5 ,
    fontWeight: 'bold',

  },
  campoCodigo2: { 
    fontSize: 12,
    marginBottom: 5 ,
  },

  buttonAgregar: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,  // Borde redondeado de 5px
    alignItems: 'center',
  },
  buttonCancelar: {
    backgroundColor: '#bf040d',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,  // Borde redondeado de 5px
    alignItems: 'center',
  },
  buttonTextAgregar: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

});