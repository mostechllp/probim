import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
  },
});

export const getStorageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('data:')) return path;
  const baseUrl = API_BASE_URL?.replace('/api', '') || '';
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${baseUrl}/storage/${cleanPath}`;
};

// ---- Token storage helpers -------------------------------------------
// Same three login flows as before, but funneled through one place so a
// refresh always writes back to the exact key it was read from.
const TOKEN_KEYS = ['employee-token', 'auth-token', 'hr-token'];

const isEmptyToken = (value) => !value || value === 'null' || value === 'undefined';

const getActiveTokenKey = () =>
  TOKEN_KEYS.find((key) => !isEmptyToken(localStorage.getItem(key)));

const getToken = () => {
  const key = getActiveTokenKey();
  return key ? localStorage.getItem(key) : null;
};

const persistToken = (newToken) => {
  const key = getActiveTokenKey();
  if (key) localStorage.setItem(key, newToken);
};

const clearAuthAndRedirect = () => {
  localStorage.removeItem('auth-token');
  localStorage.removeItem('user-type');
  localStorage.removeItem('user-data');
  localStorage.removeItem('hr-token');
  localStorage.removeItem('hr-user');
  localStorage.removeItem('employee-token');
  localStorage.removeItem('employee-user');
  localStorage.removeItem('remember-me');
  localStorage.removeItem('remembered-email');
  localStorage.removeItem('userType');
  // Let the app react (router redirect, toast, etc.) instead of forcing a
  // hard navigation from inside the API layer.
  window.dispatchEvent(new CustomEvent('auth-expired'));
  // window.location.href = '/Mostech-HRMS/';
};

// ---- JWT helpers (no extra dependency needed) --------------------------
const decodeJwt = (token) => {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
};

const isExpiringSoon = (token, bufferSeconds = 30) => {
  const payload = decodeJwt(token);
  if (!payload?.exp) return false; // can't read exp, don't block the request
  return Date.now() >= payload.exp * 1000 - bufferSeconds * 1000;
};

// ---- Shared refresh logic ------------------------------------------------
// Both the proactive (before-request) and reactive (on-401) paths call this.
// Only one network call to /auth/refresh is ever in flight at a time; every
// other caller just awaits the same promise instead of firing its own.
let refreshPromise = null;

const doRefresh = async () => {
  const expiredToken = getToken();
  if (isEmptyToken(expiredToken)) {
    clearAuthAndRedirect();
    throw new Error('No token available to refresh');
  }

  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      { token: expiredToken },
      {
        headers: {
          Authorization: `Bearer ${expiredToken}`,
          Accept: 'application/json',
        },
      }
    );

    const newToken =
      response.data?.data?.access_token ||
      response.data?.access_token ||
      response.data?.token;

    if (isEmptyToken(newToken)) {
      throw new Error('Refresh response did not contain a token');
    }

    persistToken(newToken);
    apiClient.defaults.headers.common.Authorization = `Bearer ${newToken}`;
    return newToken;
  } catch (err) {
    console.log('Refresh failed:', err.response?.data || err.message);
    clearAuthAndRedirect();
    throw err;
  }
};

const refreshAccessToken = () => {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

// ---- Request interceptor: refresh BEFORE the token actually expires ------
apiClient.interceptors.request.use(
  async (config) => {
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    } else {
      config.headers['Content-Type'] = 'application/json';
    }

    if (config.url?.includes('/auth/refresh')) return config;

    let token = getToken();

    if (token && isExpiringSoon(token)) {
      try {
        token = await refreshAccessToken();
      } catch {
        // already cleared auth state inside doRefresh; let the request go
        // out without a valid token so it fails naturally instead of
        // throwing here and breaking the caller's flow.
      }
    }

    if (token) config.headers.Authorization = `Bearer ${token}`;

    return config;
  },
  (error) => Promise.reject(error)
);

// ---- Response interceptor: fallback for what proactive refresh can't
// catch (clock skew, app reopened after the token already expired) --------
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes('/auth/refresh') || originalRequest._retry) {
      clearAuthAndRedirect();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const newToken = await refreshAccessToken();
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);

export default apiClient;