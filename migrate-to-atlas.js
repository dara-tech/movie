#!/usr/bin/env node

/**
 * Database Migration Script
 * 
 * Migrates TV shows and movies from local MongoDB to MongoDB Atlas
 * 
 * Usage:
 *   node migrate-to-atlas.js
 *   MONGODB_URI_LOCAL="..." MONGODB_URI_REMOTE="..." node migrate-to-atlas.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const LOCAL_MONGODB_URI = process.env.MONGODB_URI_LOCAL || process.env.MONGODB_URI || 'mongodb://localhost:27017/movie-app';
const REMOTE_MONGODB_URI = process.env.MONGODB_URI_REMOTE || process.env.MONGODB_URI || 'mongodb://localhost:27017/movie-app';

console.log('📊 Migration Configuration:');
console.log(`   Local DB: ${LOCAL_MONGODB_URI}`);
console.log(`   Remote DB: ${REMOTE_MONGODB_URI.split('@')[1] || 'Hidden'}`);
console.log('');

// Models
const TvShow = require('./server/models/TvShow');
const Movie = require('./server/models/Movie');
const Genre = require('./server/models/Genre');
const User = require('./server/models/User');
const Watchlist = require('./server/models/Watchlist');
const WatchHistory = require('./server/models/WatchHistory');

let localConnection;
let remoteConnection;

async function connectToLocal() {
  try {
    localConnection = await mongoose.createConnection(LOCAL_MONGODB_URI);
    console.log('✅ Connected to local database');
  } catch (error) {
    console.error('❌ Failed to connect to local database:', error.message);
    process.exit(1);
  }
}

async function connectToRemote() {
  try {
    remoteConnection = await mongoose.createConnection(REMOTE_MONGODB_URI);
    console.log('✅ Connected to remote database');
  } catch (error) {
    console.error('❌ Failed to connect to remote database:', error.message);
    process.exit(1);
  }
}

async function migrateGenres() {
  console.log('📝 Migrating genres...');
  
  const LocalGenre = localConnection.model('Genre', require('./server/models/Genre').schema);
  const RemoteGenre = remoteConnection.model('Genre', require('./server/models/Genre').schema);
  
  const genres = await LocalGenre.find({});
  let synced = 0;
  let skipped = 0;
  
  for (const genre of genres) {
    try {
      const existing = await RemoteGenre.findOne({ tmdbId: genre.tmdbId });
      if (existing) {
        skipped++;
        continue;
      }
      
      await RemoteGenre.create(genre.toObject());
      synced++;
    } catch (error) {
      console.error(`Error migrating genre ${genre.name}:`, error.message);
    }
  }
  
  console.log(`✅ Genres: ${synced} synced, ${skipped} already existed`);
  return { synced, skipped };
}

async function migrateTvShows() {
  console.log('📺 Migrating TV shows...');
  
  const LocalTvShow = localConnection.model('TvShow', require('./server/models/TvShow').schema);
  const RemoteTvShow = remoteConnection.model('TvShow', require('./server/models/TvShow').schema);
  const RemoteGenre = remoteConnection.model('Genre');
  
  // Get all genres from remote to map genre IDs
  const remoteGenres = await RemoteGenre.find({});
  const genreMap = new Map();
  for (const genre of remoteGenres) {
    if (genre.tmdbId !== undefined && genre.tmdbId !== null) {
      genreMap.set(genre.tmdbId.toString(), genre._id);
    }
  }
  
  const tvShows = await LocalTvShow.find({}).populate('genres');
  let synced = 0;
  let skipped = 0;
  
  for (let i = 0; i < tvShows.length; i++) {
    const tvShow = tvShows[i];
    
    try {
      const existing = await RemoteTvShow.findOne({ tmdbId: tvShow.tmdbId });
      if (existing) {
        skipped++;
        continue;
      }
      
      // Convert TV show data and map genres
      const tvShowData = tvShow.toObject();
      
      // Handle genres - map local genre IDs to remote genre IDs
      if (tvShowData.genres && Array.isArray(tvShowData.genres)) {
        const mappedGenres = [];
        for (const genre of tvShowData.genres) {
          // If genre is an object with tmdbId, use that
          if (genre && genre.tmdbId) {
            const remoteGenreId = genreMap.get(genre.tmdbId.toString());
            if (remoteGenreId) {
              mappedGenres.push(remoteGenreId);
            }
          }
        }
        tvShowData.genres = mappedGenres;
      } else {
        // If genres is not an array or doesn't exist, set to empty array
        tvShowData.genres = [];
      }
      
      // Remove _id to let MongoDB generate new one
      delete tvShowData._id;
      
      await RemoteTvShow.create(tvShowData);
      synced++;
      
      if (synced % 50 === 0) {
        console.log(`   Progress: ${synced + skipped} / ${tvShows.length} (${synced} synced)`);
      }
    } catch (error) {
      console.error(`Error migrating TV show ${tvShow.name}:`, error.message);
    }
  }
  
  console.log(`✅ TV Shows: ${synced} synced, ${skipped} already existed`);
  return { synced, skipped };
}

async function migrateMovies() {
  console.log('🎬 Migrating movies...');
  
  const LocalMovie = localConnection.model('Movie', require('./server/models/Movie').schema);
  const RemoteMovie = remoteConnection.model('Movie', require('./server/models/Movie').schema);
  const RemoteGenre = remoteConnection.model('Genre');
  
  // Get all genres from remote to map genre IDs
  const remoteGenres = await RemoteGenre.find({});
  const genreMap = new Map();
  for (const genre of remoteGenres) {
    if (genre.tmdbId !== undefined && genre.tmdbId !== null) {
      genreMap.set(genre.tmdbId.toString(), genre._id);
    }
  }
  
  const movies = await LocalMovie.find({}).populate('genres');
  let synced = 0;
  let skipped = 0;
  
  for (let i = 0; i < movies.length; i++) {
    const movie = movies[i];
    
    try {
      const existing = await RemoteMovie.findOne({ tmdbId: movie.tmdbId });
      if (existing) {
        skipped++;
        continue;
      }
      
      // Convert movie data and map genres
      const movieData = movie.toObject();
      
      // Handle genres - map local genre IDs to remote genre IDs
      if (movieData.genres && Array.isArray(movieData.genres)) {
        const mappedGenres = [];
        for (const genre of movieData.genres) {
          // If genre is an object with tmdbId, use that
          if (genre && genre.tmdbId) {
            const remoteGenreId = genreMap.get(genre.tmdbId.toString());
            if (remoteGenreId) {
              mappedGenres.push(remoteGenreId);
            }
          }
        }
        movieData.genres = mappedGenres;
      } else {
        // If genres is not an array or doesn't exist, set to empty array
        movieData.genres = [];
      }
      
      // Remove _id to let MongoDB generate new one
      delete movieData._id;
      
      await RemoteMovie.create(movieData);
      synced++;
      
      if (synced % 50 === 0) {
        console.log(`   Progress: ${synced + skipped} / ${movies.length} (${synced} synced)`);
      }
    } catch (error) {
      console.error(`Error migrating movie ${movie.title}:`, error.message);
    }
  }
  
  console.log(`✅ Movies: ${synced} synced, ${skipped} already existed`);
  return { synced, skipped };
}

async function migrateUsers() {
  console.log('👥 Migrating users...');
  
  const LocalUser = localConnection.model('User', require('./server/models/User').schema);
  const RemoteUser = remoteConnection.model('User', require('./server/models/User').schema);
  
  const users = await LocalUser.find({});
  let synced = 0;
  let skipped = 0;
  
  for (const user of users) {
    try {
      const existing = await RemoteUser.findOne({ email: user.email });
      if (existing) {
        skipped++;
        continue;
      }
      
      await RemoteUser.create(user.toObject());
      synced++;
    } catch (error) {
      console.error(`Error migrating user ${user.email}:`, error.message);
    }
  }
  
  console.log(`✅ Users: ${synced} synced, ${skipped} already existed`);
  return { synced, skipped };
}

async function migrateWatchlists() {
  console.log('📋 Migrating watchlists...');
  
  const LocalWatchlist = localConnection.model('Watchlist', require('./server/models/Watchlist').schema);
  const RemoteWatchlist = remoteConnection.model('Watchlist', require('./server/models/Watchlist').schema);
  const RemoteUser = remoteConnection.model('User', require('./server/models/User').schema);
  
  const watchlists = await LocalWatchlist.find({}).populate('user');
  let synced = 0;
  let skipped = 0;
  
  for (const watchlist of watchlists) {
    try {
      if (!watchlist.user) continue;
      
      const remoteUser = await RemoteUser.findOne({ email: watchlist.user.email });
      if (!remoteUser) {
        skipped++;
        continue;
      }
      
      const existing = await RemoteWatchlist.findOne({ 
        user: remoteUser._id,
        movieId: watchlist.movieId,
        tvShowId: watchlist.tvShowId
      });
      
      if (existing) {
        skipped++;
        continue;
      }
      
      await RemoteWatchlist.create({
        ...watchlist.toObject(),
        user: remoteUser._id
      });
      
      synced++;
    } catch (error) {
      console.error(`Error migrating watchlist item:`, error.message);
    }
  }
  
  console.log(`✅ Watchlists: ${synced} synced, ${skipped} already existed`);
  return { synced, skipped };
}

async function migrateWatchHistory() {
  console.log('📜 Migrating watch history...');
  
  const LocalWatchHistory = localConnection.model('WatchHistory', require('./server/models/WatchHistory').schema);
  const RemoteWatchHistory = remoteConnection.model('WatchHistory', require('./server/models/WatchHistory').schema);
  const RemoteUser = remoteConnection.model('User', require('./server/models/User').schema);
  
  const histories = await LocalWatchHistory.find({}).populate('user');
  let synced = 0;
  let skipped = 0;
  
  for (const history of histories) {
    try {
      if (!history.user) continue;
      
      const remoteUser = await RemoteUser.findOne({ email: history.user.email });
      if (!remoteUser) {
        skipped++;
        continue;
      }
      
      const existing = await RemoteWatchHistory.findOne({ 
        user: remoteUser._id,
        movieId: history.movieId,
        tvShowId: history.tvShowId
      });
      
      if (existing) {
        skipped++;
        continue;
      }
      
      await RemoteWatchHistory.create({
        ...history.toObject(),
        user: remoteUser._id
      });
      
      synced++;
    } catch (error) {
      console.error(`Error migrating watch history item:`, error.message);
    }
  }
  
  console.log(`✅ Watch History: ${synced} synced, ${skipped} already existed`);
  return { synced, skipped };
}

async function showSummary(results) {
  console.log('');
  console.log('🎉 Migration completed!');
  console.log('📊 Summary:');
  console.log('');
  
  let totalSynced = 0;
  let totalSkipped = 0;
  
  for (const [type, result] of Object.entries(results)) {
    console.log(`   ${type}:`);
    console.log(`      - Synced: ${result.synced}`);
    console.log(`      - Skipped (already existed): ${result.skipped}`);
    totalSynced += result.synced;
    totalSkipped += result.skipped;
  }
  
  console.log('');
  console.log(`📈 Total:`);
  console.log(`   - Synced: ${totalSynced}`);
  console.log(`   - Skipped: ${totalSkipped}`);
}

async function main() {
  try {
    console.log('🚀 Starting database migration...');
    console.log('');
    
    await connectToLocal();
    await connectToRemote();
    console.log('');
    
    const startTime = Date.now();
    
    const results = {
      Genres: await migrateGenres(),
      'TV Shows': await migrateTvShows(),
      Movies: await migrateMovies(),
      Users: await migrateUsers(),
      Watchlists: await migrateWatchlists(),
      'Watch History': await migrateWatchHistory()
    };
    
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    await showSummary(results);
    console.log('');
    console.log(`⏱️  Duration: ${duration} seconds`);
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  } finally {
    if (localConnection) await localConnection.close();
    if (remoteConnection) await remoteConnection.close();
    console.log('👋 Disconnected from databases');
  }
}

process.on('SIGINT', async () => {
  console.log('\n🛑 Migration interrupted');
  process.exit(0);
});

main();

