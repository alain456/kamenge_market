import axios from 'axios';
import { keysToCamelCase, keysToSnakeCase } from './case-converter';
import { API_BASE_URL, API_AUTH_URL } from './config';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach token & Convert to snake_case
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.data) {
    config.data = keysToSnakeCase(config.data);
  }

  if (config.params) {
    config.params = keysToSnakeCase(config.params);
  }

  return config;
}, (error) => Promise.reject(error));

// Response Interceptor: Convert to camelCase + refresh token on 401
apiClient.interceptors.response.use((response) => {
  if (response.data) {
    response.data = keysToCamelCase(response.data);
  }
  return response;
}, async (error) => {
  const originalRequest = error.config;

  if (
    error.response?.status === 401 &&
    !originalRequest._retry &&
    !originalRequest.url?.includes('auth/login')
  ) {
    originalRequest._retry = true;
    const refreshToken = localStorage.getItem('refresh_token');

    if (refreshToken) {
      try {
        const { data } = await axios.post(`${API_AUTH_URL}refresh/`, {
          refresh: refreshToken,
        });
        localStorage.setItem('access_token', data.access);
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return apiClient(originalRequest);
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('mk_user_data');
        window.location.href = '/login';
      }
    }
  }

  if (error.response?.data) {
    error.response.data = keysToCamelCase(error.response.data);
  }
  return Promise.reject(error);
});

export default apiClient;
