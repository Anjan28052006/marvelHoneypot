const DEFAULT_API_URL = 'http://localhost:5000/api/v1';

export const API_URL = import.meta.env.VITE_API_URL || DEFAULT_API_URL;

export function getSocketUrl(apiUrl = API_URL) {
  try {
    const url = new URL(apiUrl);
    return `${url.protocol}//${url.host}`;
  } catch (error) {
    console.error('[SentinelAI] Invalid API URL, falling back to localhost:5000', error);
    return 'http://localhost:5000';
  }
}

export const SOCKET_URL = getSocketUrl(API_URL);
