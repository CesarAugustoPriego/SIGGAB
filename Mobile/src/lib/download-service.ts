import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { env } from '@/src/config/env';
import { readSession } from '@/src/lib/session-storage';

export async function downloadAndShareReport(endpoint: string, format: 'pdf' | 'csv' = 'pdf') {
  try {
    const session = await readSession();
    const token = session?.accessToken;

    if (!token) {
      throw new Error('No estás autenticado o la sesión expiró.');
    }

    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `${env.apiBaseUrl}${endpoint}${separator}formato=${format}`;
    const filename = `Reporte_${new Date().getTime()}.${format}`;
    const fileUri = `${FileSystem.documentDirectory}${filename}`;

    // Descarga de archivo
    const downloadRes = await FileSystem.downloadAsync(url, fileUri, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (downloadRes.status !== 200) {
      throw new Error(`El servidor devolvió un error ${downloadRes.status} al generar el reporte.`);
    }

    // Compartir nativamente
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(downloadRes.uri, {
        mimeType: format === 'pdf' ? 'application/pdf' : 'text/csv',
        dialogTitle: 'Compartir reporte',
        UTI: format === 'pdf' ? 'com.adobe.pdf' : 'public.comma-separated-values-text'
      });
    } else {
      throw new Error('La función de compartir no está disponible en tu dispositivo, pero el archivo fue guardado localmente.');
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('No se pudo establecer conexión al backend o hubo un error inesperado al descargar');
  }
}
