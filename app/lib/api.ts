// Small API helper used by the app to call the backend.
// Reads base URL from NEXT_PUBLIC_API_URL (Next/Expo) and falls back to localhost:8000.
// Re-export the new shared helper from app/_lib so other parts of the app can import from either location.
export { apiFetch, API_BASE } from '../_lib/api';
