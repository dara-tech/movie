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

// Sample video URLs for streaming
const sampleVideoUrls = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://commondatastorage.googleapis.com/gtv/videos-bucket/sample/TearsOfSteel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'
];

// Get genre IDs from database
const getGenreIds = async (tmdbGenreIds) => {
  const genres = await Genre.find({ tmdbId: { $in: tmdbGenreIds } });
  return genres.map(genre => genre._id);
};

// Process and save movie data
const processMovie = async (tmdbMovie) => {
  try {
    // Check if movie already exists
    const existingMovie = await Movie.findOne({ tmdbId: tmdbMovie.id });
    if (existingMovie) {
      return null; // Skip if already exists
    }
    
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
    
    // Save movie
    const movie = await Movie.create(movieData);
    await movie.populate('genres', 'name');
    return movie;
  } catch (error) {
    console.error(`❌ Error processing movie ${tmdbMovie.title}:`, error.message);
    return null;
  }
};

// Fetch movies by year
const fetchMoviesByYear = async (year, page = 1) => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/discover/movie`, {
      params: { 
        api_key: TMDB_API_KEY,
        page: page,
        language: 'en-US',
        year: year,
        sort_by: 'popularity.desc'
      }
    });
    
    return response.data.results;
  } catch (error) {
    console.error(`❌ Error fetching movies for year ${year} page ${page}:`, error.message);
    return [];
  }
};

// Fetch movies by genre
const fetchMoviesByGenre = async (genreId, page = 1) => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/discover/movie`, {
      params: { 
        api_key: TMDB_API_KEY,
        page: page,
        language: 'en-US',
        with_genres: genreId,
        sort_by: 'popularity.desc'
      }
    });
    
    return response.data.results;
  } catch (error) {
    console.error(`❌ Error fetching movies for genre ${genreId} page ${page}:`, error.message);
    return [];
  }
};

// Main function to fetch more movies
const fetchMoreMovies = async () => {
  try {
    await connectDB();
    
    // Get current movie count
    const currentCount = await Movie.countDocuments();
    console.log(`📊 Current movies in database: ${currentCount}`);
    
    let allMovies = [];
    
    // Fetch movies from different years (2020-2025)
    console.log('🎬 Fetching movies by year...');
    for (let year = 2020; year <= 2025; year++) {
      console.log(`   Fetching movies from ${year}...`);
      for (let page = 1; page <= 3; page++) { // 3 pages per year
        const movies = await fetchMoviesByYear(year, page);
        allMovies = allMovies.concat(movies);
        console.log(`     Page ${page}/3 - ${movies.length} movies`);
        await new Promise(resolve => setTimeout(resolve, 250)); // Rate limiting
      }
    }
    
    // Fetch movies by popular genres
    console.log('🎭 Fetching movies by genre...');
    const popularGenres = [28, 12, 16, 35, 80, 99, 18, 10751, 14, 36, 27, 10402, 9648, 10749, 878, 10770, 53, 10752, 37];
    
    for (const genreId of popularGenres) {
      console.log(`   Fetching movies for genre ${genreId}...`);
      for (let page = 1; page <= 2; page++) { // 2 pages per genre
        const movies = await fetchMoviesByGenre(genreId, page);
        allMovies = allMovies.concat(movies);
        console.log(`     Page ${page}/2 - ${movies.length} movies`);
        await new Promise(resolve => setTimeout(resolve, 250)); // Rate limiting
      }
    }
    
    // Remove duplicates based on TMDB ID
    const uniqueMovies = allMovies.filter((movie, index, self) => 
      index === self.findIndex(m => m.id === movie.id)
    );
    
    console.log(`\n📊 Total unique movies found: ${uniqueMovies.length}`);
    
    // Process and save movies
    console.log('💾 Processing and saving movies...');
    let savedCount = 0;
    let skippedCount = 0;
    
    for (let i = 0; i < uniqueMovies.length; i++) {
      const movie = uniqueMovies[i];
      const savedMovie = await processMovie(movie);
      
      if (savedMovie) {
        savedCount++;
      } else {
        skippedCount++;
      }
      
      if ((savedCount + skippedCount) % 50 === 0) {
        console.log(`   Processed ${savedCount + skippedCount}/${uniqueMovies.length} movies (${savedCount} saved, ${skippedCount} skipped)`);
      }
      
      // Rate limiting
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`\n✅ Successfully saved ${savedCount} new movies to database!`);
    console.log(`⏭️  Skipped ${skippedCount} movies (already existed)`);
    
    // Show updated statistics
    const totalMovies = await Movie.countDocuments();
    const totalGenres = await Genre.countDocuments();
    
    console.log('\n📈 Updated Database Statistics:');
    console.log(`   Movies: ${totalMovies}`);
    console.log(`   Genres: ${totalGenres}`);
    
  } catch (error) {
    console.error('❌ Error in main function:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the script
fetchMoreMovies();
