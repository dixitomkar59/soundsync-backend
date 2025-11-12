// backend/routes/songRoutes.js
const express = require('express');
const router = express.Router();
const songController = require('../controllers/songController');
const isAuthenticated = require('../middleware/auth');

router.get('/', songController.getAllSongs);
router.get('/search', songController.searchSongs);
router.get('/:id', songController.getSongById);
router.get('/stream/:id', songController.streamSong);

module.exports = router;