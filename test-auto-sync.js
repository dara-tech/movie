#!/usr/bin/env node

/**
 * Test script for auto-sync functionality
 * Usage: node test-auto-sync.js
 */

require('dotenv').config();
const autoSyncService = require('./server/services/autoSyncService');

async function testAutoSync() {
  console.log('🧪 Testing Auto Sync Service...\n');

  try {
    // Test 1: Get status
    console.log('1️⃣ Testing status retrieval...');
    const status = autoSyncService.getStatus();
    console.log('✅ Status:', status);

    // Test 2: Get schedules
    console.log('\n2️⃣ Testing schedule retrieval...');
    const schedules = autoSyncService.getSchedules();
    console.log('✅ Schedules:', schedules);

    // Test 3: Test sync (small batch)
    console.log('\n3️⃣ Testing manual sync (1 page)...');
    const result = await autoSyncService.performSync({
      pages: 1,
      includeTrending: true,
      includePopular: false,
      includeTopRated: false,
      includeUpcoming: false
    });
    console.log('✅ Sync result:', result);

    // Test 4: Test scheduling
    console.log('\n4️⃣ Testing schedule setup...');
    autoSyncService.startAutoSync({
      schedule: '0 */6 * * *', // Every 6 hours
      pages: 2,
      includeTrending: true,
      includePopular: true,
      includeTopRated: false,
      includeUpcoming: false
    });
    console.log('✅ Auto-sync scheduled');

    // Test 5: Get updated status
    console.log('\n5️⃣ Testing updated status...');
    const updatedStatus = autoSyncService.getStatus();
    console.log('✅ Updated status:', updatedStatus);

    // Test 6: Stop auto-sync
    console.log('\n6️⃣ Testing stop auto-sync...');
    autoSyncService.stopAutoSync();
    console.log('✅ Auto-sync stopped');

    console.log('\n🎉 All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run tests
testAutoSync();
