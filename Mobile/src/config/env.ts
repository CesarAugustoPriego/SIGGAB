import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEFAULT_API_BASE_URL = Platform.OS === 'android'
  ? 'http://10.0.2.2:3000/api'
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
