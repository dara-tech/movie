require('dotenv').config();
const mongoose = require('mongoose');
const tmdbService = require('./server/services/tmdbService');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/moviestream', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Parse command line arguments
const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {
    maxPages: 50,
    startFromLastId: true,
    minTmdbId: null
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--pages' && args[i + 1]) {
      options.maxPages = parseInt(args[i + 1]);
    } else if (args[i] === '--from-id' && args[i + 1]) {
      options.startFromLastId = false;
      options.minTmdbId = parseInt(args[i + 1]);
    } else if (args[i] === '--start-over') {
      options.startFromLastId = false;
      options.minTmdbId = 0;
    }
  }

  return options;
};

// Main function
const main = async () => {
  try {
    const options = parseArgs();
    
    console.log('🎬 Starting TMDB Movie Sync');
    console.log('================================');
    console.log(`📊 Configuration:`);
    console.log(`   - Max pages per category: ${options.maxPages}`);
    console.log(`   - Start from last ID: ${options.startFromLastId}`);
    if (options.minTmdbId !== null) {
      console.log(`   - Starting from TMDB ID: ${options.minTmdbId}`);
    }
    console.log('');

    const startTime = Date.now();
    
    // Sync movies using the updated service
    const result = await tmdbService.syncMoviesToDatabase(options);

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    console.log('');
    console.log('🎉 Sync completed!');
    console.log('================================');
    console.log(`📈 Results:`);
    console.log(`   - Movies synced: ${result.synced}`);
    console.log(`   - Skipped (already exists): ${result.skipped}`);
    console.log(`   - Errors: ${result.errors}`);
    console.log(`   - Duration: ${duration} seconds`);
    if (result.synced > 0) {
      console.log(`   - Average: ${Math.round(result.synced / duration)} movies/second`);
    }
    console.log(`   - Started from TMDB ID: ${result.startTmdbId}`);

    if (result.errors > 0) {
      console.log(`⚠️  ${result.errors} errors occurred during sync. Check logs for details.`);
    }

  } catch (error) {
    console.error('❌ Error during sync:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

// Run the script
(async () => {
  await connectDB();
  await main();
  
  await mongoose.disconnect();
  console.log('\n👋 Disconnected from MongoDB');
  process.exit(0);
})();

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  await mongoose.disconnect();
  console.log('👋 Disconnected from MongoDB');
  process.exit(0);
});
