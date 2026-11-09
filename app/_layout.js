import { Slot } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Cambia import
import { SQLiteProvider } from 'expo-sqlite';
import { LicenciaProvider } from '../contexts/LicenciaContext';
import { Platform, Pressable, Text, View, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar'; 
import {
  FiraSans_400Regular,
  FiraSans_400Regular_Italic,
  FiraSans_600SemiBold,
  FiraSans_700Bold,
  FiraSans_800ExtraBold,
} from '@expo-google-fonts/fira-sans';
import { SuministroSelectionProvider } from '../contexts/SuministroSelectionContext';
import { migrarObras } from '../db/database';

function SQLiteAccessGuard({ children }) {
  const [status, setStatus] = useState(
    Platform.OS !== 'web' || typeof navigator === 'undefined' ? 'ready' : 'checking'
  );
  const [lockError, setLockError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      setStatus('ready');
      return undefined;
    }
    if (typeof navigator === 'undefined' || !navigator.locks) {
      setStatus('unsupported');
      return undefined;
    }

    let active = true;
    let releaseLock;
    setStatus('checking');
    setLockError('');

    navigator.locks
      .request('encodigo-sqlite-opfs', { mode: 'exclusive', ifAvailable: true }, async (lock) => {
        if (!active) return;
        if (!lock) {
          setStatus('busy');
          return;
        }

        setStatus('ready');
        await new Promise((resolve) => {
          releaseLock = resolve;
        });
      })
      .catch((error) => {
        if (active) {
          setLockError(error instanceof Error ? error.message : String(error));
          setStatus('error');
        }
      });

    return () => {
      active = false;
      releaseLock?.();
    };
  }, [retry]);

  if (status === 'ready') {
    return children;
  }

  const message =
    status === 'busy'
      ? 'La base de datos ya está abierta en otra pestaña. Cierra la otra pestaña y vuelve a intentarlo.'
      : status === 'error'
        ? `No se pudo comprobar el acceso a la base de datos: ${lockError}`
        : status === 'unsupported'
          ? 'Este navegador no permite coordinar el acceso a SQLite. Cierra las demás pestañas de la aplicación antes de continuar.'
        : 'Comprobando el acceso a la base de datos...';

  return (
    <View style={styles.accessGuard}>
      <Text style={styles.accessGuardMessage}>{message}</Text>
      {(status === 'busy' || status === 'error') && (
        <Pressable
          accessibilityRole="button"
          onPress={() => setRetry((currentRetry) => currentRetry + 1)}
          style={styles.accessGuardButton}
        >
          <Text style={styles.accessGuardButtonText}>Reintentar</Text>
        </Pressable>
      )}
      {status === 'unsupported' && (
        <Pressable
          accessibilityRole="button"
          onPress={() => setStatus('ready')}
          style={styles.accessGuardButton}
        >
          <Text style={styles.accessGuardButtonText}>Continuar en una sola pestaña</Text>
        </Pressable>
      )}
    </View>
  );
}

export default function Layout() {
  const insets = useSafeAreaInsets(); // Usa el hook
  const [fontsLoaded, fontError] = useFonts({
    FiraSans_400Regular,
    FiraSans_400Regular_Italic,
    FiraSans_600SemiBold,
    FiraSans_700Bold,
    FiraSans_800ExtraBold,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }
  
  return (
    <SQLiteAccessGuard>
      <SQLiteProvider
        databaseName="database.db"
        assetSource={{ assetId: require('../assets/database.db') }}
        onInit={migrarObras}
      >
        <LicenciaProvider>
          <View
            style={[
              styles.container,
              {
                paddingTop: insets.top,
                paddingBottom: insets.bottom,
                paddingLeft: insets.left,
                paddingRight: insets.right,
              },
            ]}
          >
            <StatusBar translucent backgroundColor="transparent" />
            <SuministroSelectionProvider>
              <Slot />
            </SuministroSelectionProvider>
          </View>
        </LicenciaProvider>
      </SQLiteProvider>
    </SQLiteAccessGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  accessGuard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f5f5f5',
  },
  accessGuardMessage: {
    color: '#192f6a',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  accessGuardButton: {
    backgroundColor: '#4a71c7',
    borderRadius: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  accessGuardButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});