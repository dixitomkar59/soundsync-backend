// backend/routes/playlistRoutes.js
const express = require('express');
const router = express.Router();
const playlistController = require('../controllers/playlistController');
const isAuthenticated = require('../middleware/auth');

// All playlist routes require authentication
router.use(isAuthenticated);

router.post('/', playlistController.createPlaylist);
router.get('/', playlistController.getUserPlaylists);
router.get('/:id/songs', playlistController.getPlaylistSongs);
router.post('/:id/songs', playlistController.addSongToPlaylist);
router.delete('/:id/songs/:trackId', playlistController.removeSongFromPlaylist);
router.delete('/:id', playlistController.deletePlaylist);

module.exports = router;