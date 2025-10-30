// Environment Configuration
const config = {
  development: {
    API_URL: 'http://localhost:5001',
    TMDB_API_KEY: process.env.REACT_APP_TMDB_API_KEY || 'your_tmdb_key_here',
  },
  production: {
    API_URL: process.env.REACT_APP_API_URL || 'https://movie-7zq4.onrender.com',
    TMDB_API_KEY: process.env.REACT_APP_TMDB_API_KEY || 'your_tmdb_key_here',
  },
};

const environment = process.env.NODE_ENV || 'development';
export default config[environment as keyof typeof config];
