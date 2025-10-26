const express = require('express');
const router = express.Router();
const Genre = require('../models/Genre');
const TvShow = require('../models/TvShow');

// Get genres with TV show counts
router.get('/with-counts', async (req, res) => {
  try {
    const allGenres = await Genre.find().lean();
    
    // Count TV shows for each genre
    const genresWithCounts = await Promise.all(
      allGenres.map(async (genre) => {
        const count = await TvShow.countDocuments({ 
          genres: genre._id, 
          isAvailable: true 
        });
        return {
          ...genre,
          tvShowCount: count
        };
      })
    );
    
    // Filter out genres with 0 shows and sort by count descending
    const genresWithShows = genresWithCounts
      .filter(genre => genre.tvShowCount > 0)
      .sort((a, b) => b.tvShowCount - a.tvShowCount);
    
    res.json(genresWithShows);
  } catch (error) {
    console.error('Error fetching genres with counts:', error);
    res.status(500).json({ message: 'Error fetching genres with counts' });
  }
});

// Get all genres
router.get('/', async (req, res) => {
  try {
    const genres = await Genre.find().sort({ name: 1 });
    res.json(genres);
  } catch (error) {
    console.error('Error fetching genres:', error);
    res.status(500).json({ message: 'Error fetching genres' });
  }
});

// Get genre by ID
router.get('/:id', async (req, res) => {
  try {
    const genre = await Genre.findById(req.params.id);
    
    if (!genre) {
      return res.status(404).json({ message: 'Genre not found' });
    }

    res.json(genre);
  } catch (error) {
    console.error('Error fetching genre:', error);
    res.status(500).json({ message: 'Error fetching genre' });
  }
});

module.exports = router;
