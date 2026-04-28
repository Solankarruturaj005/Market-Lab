import axios from 'axios';

// TASK 5 FIX: Always trim the env var and provide a hardcoded fallback.
const API_BASE_URL = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:5000'
).trim();

// Protected routes require JWT bearer token
const PROTECTED_ROUTE_PREFIXES = ['/watchlist', '/alerts', '/ai'];

const FALLBACK_NETWORK_MESSAGE =
  `Unable to reach the backend at ${API_BASE_URL}. ` +
  `Make sure the NestJS server is running (npm run start:dev inside /backend) ` +
  `and that VITE_API_BASE_URL is set to http://localhost:5000. ` +
  `You can verify the backend directly at ${API_BASE_URL}/test.`;

function getRequestPath(url = '') {
  if (!url) {
    return '';
  }

  if (url.startsWith('http')) {
    try {
      return new URL(url).pathname;
    } catch {
      return url;
    }
  }

  return url.startsWith('/') ? url : `/${url}`;
}

function getDisplayUrl(url = '') {
  const path = getRequestPath(url);
  return path ? `${API_BASE_URL}${path}` : API_BASE_URL;
}

function isProtectedRequest(url = '') {
  const path = getRequestPath(url);
  return PROTECTED_ROUTE_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function getStoredToken() {
  const directToken = localStorage.getItem('stock-dashboard-token');

  if (directToken) {
    return directToken;
  }

  try {
    const persistedAuth = JSON.parse(localStorage.getItem('stock-dashboard-auth') ?? '{}');
    return persistedAuth?.state?.token ?? null;
  } catch {
    return null;
  }
}

function getErrorMessage(error: any) {
  const backendMessage = error.response?.data?.message;
  const status = error.response?.status;

  if (Array.isArray(backendMessage) && backendMessage.length > 0) {
    return backendMessage.join(', ');
  }

  if (typeof backendMessage === 'string' && backendMessage.trim()) {
    return backendMessage;
  }

  if (status === 401) {
    return 'Your session is missing or expired. Sign in again and retry.';
  }

  if (status === 404) {
    return `The requested resource was not found: ${getDisplayUrl(error.config?.url)}.`;
  }

  if (!error.response || error.message === 'Network Error') {
    return FALLBACK_NETWORK_MESSAGE;
  }

  return error.message ?? `Request failed with status ${status ?? 'unknown'}.`;
}

export const getLiveStock = async (symbol: string) => {
  const res = await api.get(`/stocks/live/${symbol}`);
  return res.data;
};
// TASK 5 FIX: baseURL is now always a valid string — never undefined
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const requestUrl = config.url ?? '';
  const token = getStoredToken();
  const needsAuth = isProtectedRequest(requestUrl);

  // TASK 3: Attach token ONLY for protected routes
  if (needsAuth && token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // TASK 6: Surface missing-token warnings so they appear in browser DevTools
  if (needsAuth && !token) {
    console.warn(`[API] ⚠️  Missing JWT token for protected request: ${getDisplayUrl(requestUrl)}`);
  }

  // TASK 6: Log every outgoing request URL for easy debugging
  console.debug(`[API] → ${config.method?.toUpperCase()} ${getDisplayUrl(requestUrl)}`);

  return config;
});

api.interceptors.response.use(
  (response) => {
    console.debug(
      `[API] ← ${response.status} ${response.config.method?.toUpperCase()} ${getDisplayUrl(
        response.config.url,
      )}`,
      response.data,
    );
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const message = getErrorMessage(error);

    console.error(
      `[API] ✗ ${error.config?.method?.toUpperCase() ?? 'REQUEST'} ${getDisplayUrl(
        error.config?.url,
      )} failed (${status ?? 'no response'})`,
      error.response?.data ?? error.message,
    );

    // Auto-logout on 401 — token expired or missing
    if (status === 401) {
      localStorage.removeItem('stock-dashboard-token');
      localStorage.removeItem('stock-dashboard-auth');
      localStorage.removeItem('stock-dashboard-watchlist-cache');
      // Redirect to auth page if not already there
      if (!window.location.pathname.startsWith('/auth')) {
        window.location.href = '/auth';
      }
    }

    return Promise.reject(new Error(message));
  },
);

export default api;
