import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token'); 
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const res = await axios.get('http://localhost:5000/api/auth/refresh', { withCredentials: true });
        const { accessToken } = res.data;
        sessionStorage.setItem('token', accessToken);
        return api(originalRequest);
      } catch (refreshError) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;