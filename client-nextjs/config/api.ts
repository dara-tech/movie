// API Configuration
import environment from './environment';

export const apiConfig = {
  baseURL: environment.API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

export default apiConfig;
