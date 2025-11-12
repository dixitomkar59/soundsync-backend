// backend/controllers/songController.js
const db = require('../config/db');
const path = require('path');
const fs = require('fs');

exports.getAllSongs = (req, res) => {
  const query = 'SELECT * FROM Songs ORDER BY Title';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching songs', error: err.message });
    }
    res.json(results);
  });
};

exports.getSongById = (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM Songs WHERE TrackID = ?';
  
  db.query(query, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error fetching song', error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Song not found' });
    }
    res.json(results[0]);
  });
};

exports.searchSongs = (req, res) => {
  const { query } = req.query;
  
  if (!query) {
    return res.status(400).json({ message: 'Search query is required' });
  }
  
  const searchQuery = `
    SELECT * FROM Songs 
    WHERE Title LIKE ? OR Artist LIKE ? OR Album LIKE ? OR Genre LIKE ?
    ORDER BY Title
  `;
  const searchTerm = `%${query}%`;
  
  db.query(searchQuery, [searchTerm, searchTerm, searchTerm, searchTerm], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error searching songs', error: err.message });
    }
    res.json(results);
  });
};

exports.streamSong = (req, res) => {
  const { id } = req.params;
  const query = 'SELECT FilePath FROM Songs WHERE TrackID = ?';
  
  db.query(query, [id], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ message: 'Song not found' });
    }
    
    const filePath = path.join(__dirname, '../songs', results[0].FilePath);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Audio file not found on server' });
    }
    
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/mpeg',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'audio/mpeg',
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  });
};