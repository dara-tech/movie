# MovieStream - Movie Streaming Platform

A modern movie streaming platform built with React, Node.js, and MongoDB. Discover, watch, and manage your favorite movies with a beautiful dark-themed interface.

## Features

- 🎬 **Movie Discovery**: Browse trending, popular, and new movies
- 🔍 **Advanced Search**: Search movies by title, genre, year, and more
- ❤️ **Watchlist Management**: Save movies to watch later with status tracking
- 📺 **Video Player**: Built-in video player with controls and progress tracking
- 📊 **Watch History**: Track your viewing history and continue watching
- 🎨 **Dark Theme**: Modern dark UI optimized for movie viewing
- 🔐 **User Authentication**: Secure user registration and login
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile devices

## Tech Stack

### Frontend
- React 19 with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- Axios for API calls
- Lucide React for icons

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- Socket.io for real-time features
- TMDB API integration

## Prerequisites

- Node.js (v16 or higher)
- MongoDB
- TMDB API key (optional, for movie data)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd movie
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/moviestream
   JWT_SECRET=your-jwt-secret-key
   TMDB_API_KEY=your-tmdb-api-key
   CLIENT_URL=http://localhost:3000
   ```

4. **Start the application**
   ```bash
   npm run dev
   ```

   This will start both the backend server (port 5000) and frontend development server (port 3000).

## API Endpoints

### Movies
- `GET /api/movies` - Get all movies with pagination and filtering
- `GET /api/movies/popular` - Get popular movies
- `GET /api/movies/trending` - Get trending movies
- `GET /api/movies/search/:query` - Search movies
- `GET /api/movies/:id` - Get movie details

### Watchlist
- `GET /api/watchlist` - Get user's watchlist
- `POST /api/movies/:id/watchlist` - Add movie to watchlist
- `DELETE /api/movies/:id/watchlist` - Remove movie from watchlist
- `PUT /api/movies/:id/watchlist` - Update watchlist item

### History
- `GET /api/history` - Get watch history
- `GET /api/history/recent` - Get recently watched movies
- `GET /api/history/continue` - Get continue watching movies
- `POST /api/movies/:id/watch` - Record watch history

### Sync (Admin)
- `POST /api/sync/movies` - Sync movies from TMDB
- `POST /api/sync/genres` - Sync genres from TMDB

## Database Models

### Movie
- Basic movie information (title, overview, release date, etc.)
- TMDB integration fields
- Genre relationships
- Streaming availability

### Watchlist
- User-movie relationships
- Status tracking (want to watch, watching, watched)
- Ratings and reviews
- Timestamps

### WatchHistory
- Viewing progress tracking
- Completion status
- Resume functionality

### Genre
- Movie genre information
- TMDB integration

## Development

### Project Structure
```
movie/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   └── ...
├── server/                 # Node.js backend
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── services/          # External services
│   └── ...
└── ...
```

### Available Scripts

- `npm run dev` - Start development servers
- `npm run server` - Start backend server only
- `npm run client` - Start frontend server only
- `npm run build` - Build for production
- `npm start` - Start production server

## TMDB Integration

To populate the database with real movie data:

1. Get a free API key from [TMDB](https://www.themoviedb.org/settings/api)
2. Add it to your `.env` file
3. Run the sync endpoint:
   ```bash
   curl -X POST http://localhost:5000/api/sync/movies
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Acknowledgments

- [The Movie Database (TMDB)](https://www.themoviedb.org/) for movie data
- [Lucide](https://lucide.dev/) for icons
- [Tailwind CSS](https://tailwindcss.com/) for styling
