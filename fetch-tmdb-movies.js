const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Movie = require('./server/models/Movie');
const Genre = require('./server/models/Genre');

const TMDB_API_KEY = process.env.TMDB_API_KEY || '7d9244188acb73db0a7d510e90224756';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/moviestream');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Fetch genres from TMDB
const fetchGenres = async () => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/genre/movie/list`, {
      params: { api_key: TMDB_API_KEY }
    });
    
    const genres = response.data.genres;
    console.log(`📋 Found ${genres.length} genres`);
    
    // Save genres to database
    for (const genre of genres) {
      await Genre.findOneAndUpdate(
        { tmdbId: genre.id },
        { name: genre.name, tmdbId: genre.id },
        { upsert: true, new: true }
      );
    }
    
    console.log('✅ Genres saved to database');
    return genres;
  } catch (error) {
    console.error('❌ Error fetching genres:', error.message);
    throw error;
  }
};

// Fetch popular movies from TMDB
const fetchPopularMovies = async (page = 1) => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
      params: { 
        api_key: TMDB_API_KEY,
        page: page,
        language: 'en-US'
      }
    });
    
    return response.data.results;
  } catch (error) {
    console.error(`❌ Error fetching popular movies page ${page}:`, error.message);
    throw error;
  }
};

// Fetch trending movies from TMDB
const fetchTrendingMovies = async (page = 1) => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/trending/movie/week`, {
      params: { 
        api_key: TMDB_API_KEY,
        page: page,
        language: 'en-US'
      }
    });
    
    return response.data.results;
  } catch (error) {
    console.error(`❌ Error fetching trending movies page ${page}:`, error.message);
    throw error;
  }
};

// Fetch top rated movies from TMDB
const fetchTopRatedMovies = async (page = 1) => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/movie/top_rated`, {
      params: { 
        api_key: TMDB_API_KEY,
        page: page,
        language: 'en-US'
      }
    });
    
    return response.data.results;
  } catch (error) {
    console.error(`❌ Error fetching top rated movies page ${page}:`, error.message);
    throw error;
  }
};

// Get genre IDs from database
const getGenreIds = async (tmdbGenreIds) => {
  const genres = await Genre.find({ tmdbId: { $in: tmdbGenreIds } });
  return genres.map(genre => genre._id);
};

// Sample video URLs for streaming (you can replace these with real streaming URLs)
const sampleVideoUrls = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'
];

// Process and save movie data
const processMovie = async (tmdbMovie) => {
  try {
    // Get genre IDs from database
    const genreIds = await getGenreIds(tmdbMovie.genre_ids);
    
    // Select a random streaming URL
    const randomVideoUrl = sampleVideoUrls[Math.floor(Math.random() * sampleVideoUrls.length)];
    
    const movieData = {
      tmdbId: tmdbMovie.id,
      title: tmdbMovie.title,
      originalTitle: tmdbMovie.original_title,
      overview: tmdbMovie.overview,
      releaseDate: new Date(tmdbMovie.release_date),
      posterPath: tmdbMovie.poster_path,
      backdropPath: tmdbMovie.backdrop_path,
      voteAverage: tmdbMovie.vote_average,
      voteCount: tmdbMovie.vote_count,
      popularity: tmdbMovie.popularity,
      adult: tmdbMovie.adult,
      originalLanguage: tmdbMovie.original_language,
      video: tmdbMovie.video,
      genres: genreIds,
      streamingUrl: randomVideoUrl,
      isAvailable: true
    };
    
    // Save or update movie
    const movie = await Movie.findOneAndUpdate(
      { tmdbId: tmdbMovie.id },
      movieData,
      { upsert: true, new: true }
    );
    
    await movie.populate('genres', 'name');
    return movie;
  } catch (error) {
    console.error(`❌ Error processing movie ${tmdbMovie.title}:`, error.message);
    return null;
  }
};

// Main function to fetch and save movies
const fetchAndSaveMovies = async () => {
  try {
    await connectDB();
    
    // Clear existing movies
    console.log('🗑️  Clearing existing movies...');
    await Movie.deleteMany({});
    
    // Fetch and save genres
    console.log('📋 Fetching genres...');
    await fetchGenres();
    
    // Fetch movies from different categories
    const totalPages = 5; // Fetch 5 pages (100 movies) from each category
    let allMovies = [];
    
    console.log('🎬 Fetching popular movies...');
    for (let page = 1; page <= totalPages; page++) {
      const movies = await fetchPopularMovies(page);
      allMovies = allMovies.concat(movies);
      console.log(`   Page ${page}/${totalPages} - ${movies.length} movies`);
      await new Promise(resolve => setTimeout(resolve, 250)); // Rate limiting
    }
    
    console.log('🔥 Fetching trending movies...');
    for (let page = 1; page <= totalPages; page++) {
      const movies = await fetchTrendingMovies(page);
      allMovies = allMovies.concat(movies);
      console.log(`   Page ${page}/${totalPages} - ${movies.length} movies`);
      await new Promise(resolve => setTimeout(resolve, 250)); // Rate limiting
    }
    
    console.log('⭐ Fetching top rated movies...');
    for (let page = 1; page <= totalPages; page++) {
      const movies = await fetchTopRatedMovies(page);
      allMovies = allMovies.concat(movies);
      console.log(`   Page ${page}/${totalPages} - ${movies.length} movies`);
      await new Promise(resolve => setTimeout(resolve, 250)); // Rate limiting
    }
    
    // Remove duplicates based on TMDB ID
    const uniqueMovies = allMovies.filter((movie, index, self) => 
      index === self.findIndex(m => m.id === movie.id)
    );
    
    console.log(`\n📊 Total unique movies found: ${uniqueMovies.length}`);
    
    // Process and save movies
    console.log('💾 Processing and saving movies...');
    let savedCount = 0;
    
    for (let i = 0; i < uniqueMovies.length; i++) {
      const movie = uniqueMovies[i];
      const savedMovie = await processMovie(movie);
      
      if (savedMovie) {
        savedCount++;
        if (savedCount % 50 === 0) {
          console.log(`   Processed ${savedCount}/${uniqueMovies.length} movies`);
        }
      }
      
      // Rate limiting
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`\n✅ Successfully saved ${savedCount} movies to database!`);
    
    // Show some statistics
    const totalMovies = await Movie.countDocuments();
    const totalGenres = await Genre.countDocuments();
    
    console.log('\n📈 Database Statistics:');
    console.log(`   Movies: ${totalMovies}`);
    console.log(`   Genres: ${totalGenres}`);
    
    // Show some sample movies
    const sampleMovies = await Movie.find().populate('genres', 'name').limit(5);
    console.log('\n🎬 Sample Movies:');
    sampleMovies.forEach(movie => {
      console.log(`   - ${movie.title} (${movie.releaseDate.getFullYear()}) - ${movie.genres.map(g => g.name).join(', ')}`);
    });
    
  } catch (error) {
    console.error('❌ Error in main function:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the script
fetchAndSaveMovies();
