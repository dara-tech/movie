#!/usr/bin/env node

/**
 * Test script to verify TMDB API key
 * Usage: node test-tmdb.js YOUR_API_KEY_HERE
 */

const axios = require('axios');

async function testTMDBKey(apiKey) {
  try {
    console.log('🔍 Testing TMDB API key...');
    
    const response = await axios.get('https://api.themoviedb.org/3/movie/popular', {
      params: {
        api_key: apiKey,
        page: 1,
        language: 'en-US'
      }
    });

    console.log('✅ API key is valid!');
    console.log(`📊 Found ${response.data.results.length} movies on first page`);
    console.log(`🎬 First movie: ${response.data.results[0].title}`);
    console.log(`🆔 TMDB ID: ${response.data.results[0].id}`);
    
    return true;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('❌ API key is invalid or unauthorized');
    } else {
      console.log('❌ Error:', error.message);
    }
    return false;
  }
}

// Get API key from command line argument
const apiKey = process.argv[2];

if (!apiKey) {
  console.log('Usage: node test-tmdb.js YOUR_API_KEY_HERE');
  console.log('Get your API key from: https://www.themoviedb.org/settings/api');
  process.exit(1);
}

testTMDBKey(apiKey);
