#!/usr/bin/env node

/**
 * Script to sync all movies from TMDB to the database with Vidsrc URLs
 * Usage: node sync-all-movies.js
 */

// Load environment variables
require('dotenv').config();

const mongoose = require('mongoose');
const tmdbService = require('./server/services/tmdbService');
const vidsrcService = require('./server/services/vidsrcService');
const Movie = require('./server/models/Movie');
const Genre = require('./server/models/Genre');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/moviestream');

async function syncAllMovies() {
  try {
    console.log('🎬 Starting TMDB movie sync with Vidsrc URLs...\n');

    // Test TMDB API first
    console.log('🔍 Testing TMDB API connection...');
    const testMovies = await tmdbService.getPopularMovies(1);
    console.log(`✅ TMDB API working! Found ${testMovies.results.length} movies on first page\n`);

    // Sync genres first
    console.log('📂 Syncing genres...');
    const genresResponse = await tmdbService.getGenres();
    for (const genre of genresResponse.genres) {
      await Genre.findOneAndUpdate(
        { tmdbId: genre.id },
        { name: genre.name, tmdbId: genre.id },
        { upsert: true, new: true }
      );
    }
    console.log(`✅ Synced ${genresResponse.genres.length} genres\n`);

    // Sync movies from multiple pages
    const totalPages = 5; // Sync first 5 pages (100 movies)
    let totalSynced = 0;
    let totalWithVidsrc = 0;

    for (let page = 1; page <= totalPages; page++) {
      console.log(`📥 Syncing page ${page}/${totalPages}...`);
      
      const moviesResponse = await tmdbService.getPopularMovies(page);
      const movies = moviesResponse.results;

      for (const movieData of movies) {
        try {
          // Get detailed movie info including external IDs
          const movieDetails = await tmdbService.getMovieDetails(movieData.id);
          
          // Generate Vidsrc URL
          let vidsrcUrl = null;
          if (movieDetails.external_ids?.imdb_id || movieData.id) {
            try {
              vidsrcUrl = vidsrcService.generateMovieStreamingUrl({
                tmdbId: movieData.id,
                imdbId: movieDetails.external_ids?.imdb_id
              });
              totalWithVidsrc++;
            } catch (error) {
              console.warn(`⚠️  Could not generate Vidsrc URL for ${movieData.title}: ${error.message}`);
            }
          }

          // Find genre IDs for this movie
          const genreIds = [];
          for (const genreId of movieData.genre_ids) {
            const genreDoc = await Genre.findOne({ tmdbId: genreId });
            if (genreDoc) {
              genreIds.push(genreDoc._id);
            }
          }

          const movie = {
            tmdbId: movieData.id,
            imdbId: movieDetails.external_ids?.imdb_id || null,
            title: movieData.title,
            overview: movieData.overview,
            releaseDate: new Date(movieData.release_date),
            posterPath: movieData.poster_path,
            backdropPath: movieData.backdrop_path,
            runtime: movieDetails.runtime,
            voteAverage: movieData.vote_average,
            voteCount: movieData.vote_count,
            adult: movieData.adult,
            originalLanguage: movieData.original_language,
            originalTitle: movieData.original_title,
            popularity: movieData.popularity,
            video: movieData.video,
            genres: genreIds,
            vidsrcUrl: vidsrcUrl,
            isAvailable: true
          };

          await Movie.findOneAndUpdate(
            { tmdbId: movieData.id },
            movie,
            { upsert: true, new: true }
          );

          totalSynced++;
          console.log(`✅ ${movieData.title} ${vidsrcUrl ? '(with Vidsrc)' : '(no Vidsrc)'}`);

        } catch (error) {
          console.error(`❌ Error syncing ${movieData.title}:`, error.message);
        }
      }

      console.log(`📄 Page ${page} complete. Total synced so far: ${totalSynced}\n`);
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('🎉 Sync complete!');
    console.log(`📊 Total movies synced: ${totalSynced}`);
    console.log(`🎬 Movies with Vidsrc URLs: ${totalWithVidsrc}`);
    console.log(`📈 Success rate: ${Math.round((totalWithVidsrc / totalSynced) * 100)}%`);

  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    if (error.message.includes('401')) {
      console.log('\n💡 The TMDB API key is invalid. Please:');
      console.log('1. Go to https://www.themoviedb.org/settings/api');
      console.log('2. Create an account and get a free API key');
      console.log('3. Update the TMDB_API_KEY in your .env file');
      console.log('4. Run this script again');
    }
  } finally {
    mongoose.connection.close();
  }
}

// Run the sync
syncAllMovies();
