import Constants from 'expo-constants';
import { Platform } from 'react-native';

function getExpoHostApiBaseUrl() {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return undefined;

  const host = hostUri.split(':')[0];
  if (!host) return undefined;

  return `http://${host}:3000/api`;
}

const DEFAULT_API_BASE_URL = Platform.OS === 'android'
  ? (getExpoHostApiBaseUrl() || 'http://10.0.2.2:3000/api')
  : 'http://localhost:3000/api';

function normalizeApiBaseUrl(url: string | undefined) {
  if (!url) return DEFAULT_API_BASE_URL;
  return url.replace(/\/+$/, '');
}

const fromPublicEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
const fromExpoConfig = Constants.expoConfig?.extra?.apiBaseUrl as string | undefined;

export const env = {
  apiBaseUrl: normalizeApiBaseUrl(fromPublicEnv || fromExpoConfig),
};
