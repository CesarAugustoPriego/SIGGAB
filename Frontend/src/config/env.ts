const DEFAULT_API_BASE_URL = 'http://localhost:3000/api';

function normalizeApiBaseUrl(url: string | undefined) {
  if (!url) return DEFAULT_API_BASE_URL;
  return url.replace(/\/+$/, '');
}

export const env = {
  apiBaseUrl: normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
};

