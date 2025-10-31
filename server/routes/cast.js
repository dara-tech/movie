const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');

// Get cast member details (actor, director, etc.)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch person details from TMDB
    const axios = require('axios');
    const tmdbApiKey = process.env.TMDB_API_KEY;
    
    const personResponse = await axios.get(
      `https://api.themoviedb.org/3/person/${id}`,
      {
        params: {
          api_key: tmdbApiKey,
          language: 'en-US',
          append_to_response: 'movie_credits,tv_credits,external_ids'
        }
      }
    );

    const person = personResponse.data;

    // Format biography
    const biography = person.biography || 'No biography available.';

    // Helper function to check if movie is in database
    const enrichMovieData = async (movie) => {
      const dbMovie = await Movie.findOne({ tmdbId: movie.id });
      return {
        id: movie.id, // TMDB ID
        tmdbId: movie.id,
        _id: dbMovie?._id || null, // Our database ID
        inDatabase: !!dbMovie, // Whether we have it in our DB
        title: movie.title,
        posterPath: movie.poster_path,
        releaseDate: movie.release_date,
        voteAverage: movie.vote_average,
        character: movie.character,
        job: movie.job,
        popularity: movie.popularity
      };
    };

    // Get known for movies (most popular) and enrich with DB info
    const knownForRaw = person.movie_credits?.cast
      ?.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
      .slice(0, 10) || [];
    const knownFor = await Promise.all(knownForRaw.map(m => enrichMovieData(m)));

    // Get filmography (all movies as actor) and enrich with DB info
    const filmographyRaw = person.movie_credits?.cast || [];
    const filmography = await Promise.all(filmographyRaw.map(m => enrichMovieData(m)));

    // Get director/writer credits and enrich with DB info
    const directingCreditsRaw = person.movie_credits?.crew
      ?.filter(job => job.job === 'Director') || [];
    const directingCredits = await Promise.all(directingCreditsRaw.map(m => enrichMovieData(m)));

    // Calculate some stats
    const totalMovies = person.movie_credits?.cast?.length || 0;
    const totalShows = person.tv_credits?.cast?.length || 0;
    const averageRating = filmography.length > 0
      ? (filmography.reduce((sum, movie) => sum + (movie.voteAverage || 0), 0) / filmography.length).toFixed(1)
      : null;

    res.json({
      id: person.id,
      name: person.name,
      biography: biography,
      birthday: person.birthday,
      deathday: person.deathday,
      placeOfBirth: person.place_of_birth,
      profilePath: person.profile_path,
      knownForDepartment: person.known_for_department,
      popularity: person.popularity,
      knownFor: knownFor,
      filmography: filmography,
      directingCredits: directingCredits,
      stats: {
        totalMovies,
        totalShows,
        averageRating
      },
      externalIds: person.external_ids || {}
    });
  } catch (error) {
    console.error('Error fetching cast details:', error);
    res.status(500).json({ 
      message: 'Error fetching cast details', 
      error: error.message 
    });
  }
});

module.exports = router;
