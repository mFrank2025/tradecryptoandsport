import axios from 'axios';
import toast from 'react-hot-toast';

const client = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor
client.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'Errore di connessione al server';

    if (error.response?.status === 401) {
      toast.error('Sessione scaduta. Effettua nuovamente il login.');
    } else if (error.response?.status === 403) {
      toast.error('Non hai i permessi per questa operazione.');
    } else if (error.response?.status === 404) {
      // 404s are handled per-component, don't show generic toast
    } else if (error.response?.status >= 500) {
      toast.error(`Errore del server: ${message}`);
    }

    return Promise.reject(error);
  }
);

export default client;
