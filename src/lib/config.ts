/** Base URL for the Django REST API (must end with /api/) */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8002/api/';

export const API_AUTH_URL = `${API_BASE_URL}auth/`;
