#!/usr/bin/env node

/**
 * Startup script that starts the server with auto-sync enabled
 * Usage: node start-with-sync.js
 */

require('dotenv').config();
const autoSyncService = require('./server/services/autoSyncService');

// Start the server
require('./server/index.js');

// Start auto-sync with default settings
console.log('🚀 Starting server with auto-sync...');

// Wait a moment for the server to start, then enable auto-sync
setTimeout(() => {
  autoSyncService.startAutoSync({
    schedule: '0 2 * * *', // Daily at 2 AM
    pages: 5,
    includeTrending: true,
    includePopular: true,
    includeTopRated: false,
    includeUpcoming: false
  });
  
  console.log('✅ Auto-sync enabled with daily schedule');
}, 2000);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down auto-sync...');
  autoSyncService.stopAutoSync();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down auto-sync...');
  autoSyncService.stopAutoSync();
  process.exit(0);
});
