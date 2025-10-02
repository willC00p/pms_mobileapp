// Small API helper used by the app to call the backend.
// Placed under app/_lib so the router ignores it.
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Prefer explicitly configured NEXT_PUBLIC_API_URL. When it's not set (Expo may not inject .env
// at runtime), fall back to the host LAN IP that we verified is reachable from this machine.
const ENV_BASE = (process.env?.NEXT_PUBLIC_API_URL as string) || 'http://172.17.162.198:8000';

// Map localhost to emulator-friendly host when running on Android emulators
let API_BASE = ENV_BASE;
try {
  if (Platform.OS === 'android') {
    API_BASE = ENV_BASE.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
  }
} catch (e) {
  API_BASE = ENV_BASE;
}

// Export the resolved API base so the app can use it for non-json calls (FormData, file uploads)
export { API_BASE };

// Debug: show the resolved API base at runtime so Metro/Expo logs reveal what the app will contact
try {
  // eslint-disable-next-line no-console
  console.log('[app/_lib/api] API_BASE =>', API_BASE);
} catch (e) {
  // ignore
}

// Dev-time connectivity probe: try to fetch the API base and if it fails on Android
// retry using the emulator loopback (10.0.2.2). This helps pick the correct host
// when Expo doesn't inject .env values the way we expect.
(async function probeApiBase() {
  try {
    const url = API_BASE.replace(/\/+$/, '/') ;
    // eslint-disable-next-line no-console
    console.log('[app/_lib/api] probing API base ->', url);
    const res = await fetch(url, { method: 'GET' });
    // eslint-disable-next-line no-console
    console.log('[app/_lib/api] probe result:', res.status, res.headers?.get?.('content-type'));
    return;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[app/_lib/api] probe failed for', API_BASE, err && (err as any).message);
  }

  // If probe failed and we are on Android, try the emulator loopback address
  try {
    // eslint-disable-next-line no-undef
    if (Platform.OS === 'android') {
      const alt = API_BASE.replace(/https?:\/\/[^\/]+/, 'http://10.0.2.2');
      // eslint-disable-next-line no-console
      console.log('[app/_lib/api] retrying with emulator loopback ->', alt);
      const r2 = await fetch(alt, { method: 'GET' });
      // eslint-disable-next-line no-console
      console.log('[app/_lib/api] emulator probe result:', r2.status);
      // If successful, update API_BASE for the rest of the app runtime
      if (r2 && r2.ok) {
        // eslint-disable-next-line no-console
        console.log('[app/_lib/api] switching API_BASE to', alt);
        // mutate exported value (best-effort) by writing to the module-level variable
        // @ts-ignore
        API_BASE = alt.replace(/\/+$/, '');
      }
    }
  } catch (err2) {
    // eslint-disable-next-line no-console
    console.warn('[app/_lib/api] emulator probe failed', err2 && (err2 as any).message);
  }
})();

export async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const base = API_BASE.replace(/\/+$/, '');
  const suffix = path.replace(/^\/+/, '');
  const url = `${base}/${suffix}`;

  const headersObj: Record<string,string> = { 'Content-Type': 'application/json', ...(options.headers as Record<string,string> || {}) };
  try {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) headersObj['Authorization'] = `Bearer ${token}`;
  } catch (e) {
    // ignore
  }

  const headers = new Headers(headersObj);

  const res = await fetch(url, { ...options, headers });

  const text = await res.text();
  const contentType = res.headers.get('content-type') || '';

  const body = contentType.includes('application/json') ? JSON.parse(text || '{}') : text;

  if (!res.ok) {
    const error = { status: res.status, body };
    throw error;
  }

  return body as T;
}
