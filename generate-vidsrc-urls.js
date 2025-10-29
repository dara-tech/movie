const mongoose = require('mongoose');
require('dotenv').config();

const Movie = require('./server/models/Movie');
const vidsrcService = require('./server/services/vidsrcService');
const tmdbService = require('./server/services/tmdbService');

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

// Generate vidsrc URLs for movies that don't have them
const generateVidsrcUrls = async () => {
  try {
    console.log('🔍 Finding movies without vidsrc URLs...\n');
    
    const movies = await Movie.find({ 
      $and: [
        {
          $or: [
            { vidsrcUrl: { $exists: false } },
            { vidsrcUrl: null },
            { vidsrcUrl: '' }
          ]
        },
        {
          $or: [
            { tmdbId: { $exists: true, $ne: null } },
            { imdbId: { $exists: true, $ne: null } }
          ]
        }
      ]
    }).limit(10000); // Limit to prevent memory issues

    console.log(`📊 Found ${movies.length} movies without vidsrc URLs\n`);

    if (movies.length === 0) {
      console.log('✅ All movies already have vidsrc URLs!');
      return;
    }

    let updatedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    let imdbIdFetchedCount = 0;

    for (let i = 0; i < movies.length; i++) {
      const movie = movies[i];
      
      try {
        // If movie doesn't have imdbId but has tmdbId, try to fetch it
        let imdbId = movie.imdbId;
        if (!imdbId && movie.tmdbId) {
          try {
            const movieDetails = await tmdbService.getMovieDetails(movie.tmdbId);
            if (movieDetails?.external_ids?.imdb_id) {
              imdbId = movieDetails.external_ids.imdb_id;
              // Update movie with IMDB ID for future use
              await Movie.findByIdAndUpdate(movie._id, { 
                imdbId,
                updatedAt: new Date()
              });
              imdbIdFetchedCount++;
            }
          } catch (error) {
            console.warn(`⚠️  Could not fetch IMDB ID for "${movie.title}" (TMDB ID: ${movie.tmdbId}):`, error.message);
          }
        }

        // Generate vidsrc URL if we have at least tmdbId or imdbId
        if (movie.tmdbId || imdbId) {
          const vidsrcUrl = vidsrcService.generateMovieStreamingUrl({
            tmdbId: movie.tmdbId,
            imdbId: imdbId
          });

          if (vidsrcUrl) {
            await Movie.findByIdAndUpdate(movie._id, { 
              vidsrcUrl,
              imdbId: imdbId || movie.imdbId, // Update IMDB ID if we fetched it
              updatedAt: new Date()
            });
            updatedCount++;
            
            if (updatedCount % 50 === 0) {
              console.log(`📈 Progress: ${updatedCount}/${movies.length} movies updated (${Math.round((updatedCount / movies.length) * 100)}%)...`);
            }
          } else {
            skippedCount++;
            console.warn(`⚠️  Could not generate vidsrc URL for "${movie.title}"`);
          }
        } else {
          skippedCount++;
          console.warn(`⚠️  Skipping "${movie.title}": No tmdbId or imdbId`);
        }

        // Rate limiting to avoid overwhelming TMDB API
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`❌ Error processing "${movie.title}":`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log(`   ✅ Updated: ${updatedCount} movies`);
    console.log(`   🔍 IMDB IDs fetched: ${imdbIdFetchedCount} movies`);
    console.log(`   ⏭️  Skipped: ${skippedCount} movies`);
    console.log(`   ❌ Errors: ${errorCount} movies`);
    console.log(`   📦 Total processed: ${movies.length} movies`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error generating vidsrc URLs:', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await generateVidsrcUrls();
    await mongoose.connection.close();
    console.log('\n✅ Done! Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

main();

