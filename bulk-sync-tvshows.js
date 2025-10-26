#!/usr/bin/env node

/**
 * Bulk TV Show Sync Script
 * 
 * This script syncs TV shows from TMDB to the database.
 * It can sync from multiple categories and pages to get a comprehensive collection.
 * 
 * Usage:
 *   node bulk-sync-tvshows.js
 *   node bulk-sync-tvshows.js --pages 10 --categories popular,trending,top_rated
 *   node bulk-sync-tvshows.js --help
 */

require('dotenv').config();
const mongoose = require('mongoose');
const tmdbService = require('./server/services/tmdbService');

// Command line argument parsing
const args = process.argv.slice(2);
const options = {
  maxPages: 5,
  categories: ['popular', 'trending', 'top_rated', 'on_the_air', 'airing_today'],
  includeGenres: true,
  help: false,
  top10k: false
};

// Parse command line arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  switch (arg) {
    case '--pages':
    case '-p':
      options.maxPages = parseInt(args[++i]) || 5;
      break;
    case '--categories':
    case '-c':
      options.categories = args[++i].split(',').map(cat => cat.trim());
      break;
    case '--no-genres':
      options.includeGenres = false;
      break;
    case '--top10k':
      options.top10k = true;
      options.maxPages = 500; // 500 pages × 20 per page = 10,000 TV shows
      options.categories = ['popular', 'top_rated', 'trending']; // Focus on top categories
      break;
    case '--help':
    case '-h':
      options.help = true;
      break;
  }
}

// Show help
if (options.help) {
  console.log(`
📺 Bulk TV Show Sync Script

This script syncs TV shows from TMDB to your database.

Usage:
  node bulk-sync-tvshows.js [options]

Options:
  --pages, -p <number>     Maximum pages to sync per category (default: 5)
  --categories, -c <list>  Comma-separated list of categories (default: all)
  --no-genres             Skip syncing TV show genres
  --top10k                Sync top 10,000 TV shows (popular, top_rated, trending)
  --all-categories        Use ALL available categories (default behavior)
  --help, -h              Show this help message

Available TV Show Categories:
  1. popular       - Most popular TV shows (high viewership)
  2. trending      - Currently trending this week
  3. top_rated     - Highest rated TV shows by users
  4. on_the_air    - Currently airing TV shows (new episodes)
  5. airing_today  - TV shows that have episodes airing today

Examples:
  # Sync all categories (default)
  node bulk-sync-tvshows.js
  
  # Sync top 10,000 TV shows (RECOMMENDED for production)
  node bulk-sync-tvshows.js --top10k
  
  # Sync with more pages per category
  node bulk-sync-tvshows.js --pages 10
  
  # Sync specific categories only
  node bulk-sync-tvshows.js --categories popular,trending,top_rated
  
  # Sync without genres (faster)
  node bulk-sync-tvshows.js --no-genres --pages 20
  
  # Sync all categories with 10 pages each
  node bulk-sync-tvshows.js --pages 10
`);
  process.exit(0);
}

async function connectToDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/movie-app';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
}

async function syncTvShows() {
  try {
    console.log('🚀 Starting bulk TV show sync...');
    if (options.top10k) {
      console.log('🎯 Mode: Top 10,000 TV Shows');
      console.log('   Focusing on the best TV shows from popular categories');
    }
    console.log(`📊 Configuration:`);
    console.log(`   - Max pages per category: ${options.maxPages}`);
    console.log(`   - Categories: ${options.categories.join(', ')}`);
    console.log(`   - Include genres: ${options.includeGenres}`);
    console.log('');

    const startTime = Date.now();
    
    // Sync TV shows using the comprehensive method
    const result = await tmdbService.syncTvShowsToDatabase({
      maxPages: options.maxPages,
      categories: options.categories,
      includeGenres: options.includeGenres
    });

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    console.log('');
    console.log('🎉 Bulk TV show sync completed!');
    console.log(`📈 Results:`);
    console.log(`   - TV shows synced: ${result.synced}`);
    console.log(`   - Errors: ${result.errors}`);
    console.log(`   - Duration: ${duration} seconds`);
    console.log(`   - Average: ${Math.round(result.synced / duration)} TV shows/second`);

    if (result.errors > 0) {
      console.log(`⚠️  ${result.errors} errors occurred during sync. Check logs for details.`);
    }

  } catch (error) {
    console.error('❌ Error during TV show sync:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

async function main() {
  try {
    await connectToDatabase();
    await syncTvShows();
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  await mongoose.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  await mongoose.disconnect();
  process.exit(0);
});

// Run the script
main();
