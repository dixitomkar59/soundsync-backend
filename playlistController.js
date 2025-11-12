// backend/controllers/playlistController.js
const db = require('../config/db');

exports.createPlaylist = (req, res) => {
  const { playlistName } = req.body;
  const userId = req.session.userId;
  
  if (!playlistName) {
    return res.status(400).json({ message: 'Playlist name is required' });
  }
  
  const query = 'INSERT INTO Playlists (UserID, PlaylistName) VALUES (?, ?)';
  db.query(query, [userId, playlistName], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error creating playlist', error: err.message });
    }
    res.status(201).json({ 
      message: 'Playlist created successfully',
      playlistId: result.insertId,
      playlistName: playlistName
    });
  });
};

exports.getUserPlaylists = (req, res) => {
  const userId = req.session.userId;
  
  const query = 'SELECT * FROM Playlists WHERE UserID = ? ORDER BY CreationDate DESC';
  db.query(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching playlists', error: err.message });
    }
    res.json(results);
  });
};

exports.getPlaylistSongs = (req, res) => {
  const { id } = req.params;
  
  const query = `
    SELECT s.* 
    FROM Songs s
    INNER JOIN PlaylistTracks pt ON s.TrackID = pt.TrackID
    WHERE pt.PlaylistID = ?
    ORDER BY pt.AddedAt DESC
  `;
  
  db.query(query, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching playlist songs', error: err.message });
    }
    res.json(results);
  });
};

exports.addSongToPlaylist = (req, res) => {
  const { id } = req.params; // playlist ID
  const { trackId } = req.body;
  
  if (!trackId) {
    return res.status(400).json({ message: 'Track ID is required' });
  }
  
  // Check if song already exists in playlist
  const checkQuery = 'SELECT * FROM PlaylistTracks WHERE PlaylistID = ? AND TrackID = ?';
  db.query(checkQuery, [id, trackId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    if (results.length > 0) {
      return res.status(400).json({ message: 'Song already in playlist' });
    }
    
    // Add song to playlist
    const insertQuery = 'INSERT INTO PlaylistTracks (PlaylistID, TrackID) VALUES (?, ?)';
    db.query(insertQuery, [id, trackId], (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Error adding song to playlist', error: err.message });
      }
      res.status(201).json({ message: 'Song added to playlist successfully' });
    });
  });
};

exports.removeSongFromPlaylist = (req, res) => {
  const { id, trackId } = req.params;
  
  const query = 'DELETE FROM PlaylistTracks WHERE PlaylistID = ? AND TrackID = ?';
  db.query(query, [id, trackId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error removing song from playlist', error: err.message });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Song not found in playlist' });
    }
    
    res.json({ message: 'Song removed from playlist successfully' });
  });
};

exports.deletePlaylist = (req, res) => {
  const { id } = req.params;
  const userId = req.session.userId;
  
  // Check if playlist belongs to user
  const checkQuery = 'SELECT * FROM Playlists WHERE PlaylistID = ? AND UserID = ?';
  db.query(checkQuery, [id, userId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Playlist not found or unauthorized' });
    }
    
    // Delete playlist (PlaylistTracks will be deleted automatically due to CASCADE)
    const deleteQuery = 'DELETE FROM Playlists WHERE PlaylistID = ?';
    db.query(deleteQuery, [id], (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Error deleting playlist', error: err.message });
      }
      res.json({ message: 'Playlist deleted successfully' });
    });
  });
};