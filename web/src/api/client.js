
import axios from "axios";

// Use the API URL from environment variable, or fall back to relative path (for proxy)
const baseURL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/` : "/";

console.log("API Base URL:", baseURL);

export const api = axios.create({
  baseURL,
  // If you're using cookies (session auth / CSRF), set true.
  // For JWT in headers only, keep false.
  withCredentials: false,
});

// ---------------------------------------------------------------------------
// JWT handling
// ---------------------------------------------------------------------------
// Attach the token from localStorage (if present) to every request. This keeps the
// authentication flow secure because the token is never hard‑coded and is only
// sent over HTTPS (the app should be served via HTTPS in production).
// The interceptor runs before each request, so even after a page reload the
// token will be added as long as it is stored in localStorage.
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('accessToken');
    if (token) {
      // Ensure the Authorization header follows the Bearer scheme expected by
      // Django Rest Framework SimpleJWT.
      config.headers.Authorization = `Bearer ${token}`;
      console.debug('Axios Request: Token attached to request');
    } else {
      console.debug('Axios Request: No token found in localStorage');
    }
  } catch (e) {
    // In case localStorage is unavailable (e.g., privacy mode), we simply
    // proceed without a token – the backend will reject the request.
    console.warn('Unable to read auth token from localStorage', e);
  }
  return config;
});

// Add response interceptor to log errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    });
    return Promise.reject(error);
  }
);

/**
 * Helper to clear the stored token on logout.
 * Call this function when the user logs out to remove the JWT from storage
 * and from the default axios headers.
 */
export function clearAuthToken() {
  localStorage.removeItem('accessToken');
  delete api.defaults.headers.common.Authorization;
}

/**
 * Set or remove Authorization header globally.
 * Call setAuthToken(accessToken) after login
 * Call setAuthToken(null) on logout
 */
export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}
