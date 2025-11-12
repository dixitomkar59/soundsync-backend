// backend/controllers/authController.js
const bcrypt = require('bcrypt');
const db = require('../config/db');

exports.signup = async (req, res) => {
  const { username, email, password } = req.body;
  
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert user into database
    const query = 'INSERT INTO Users (Username, Email, Password) VALUES (?, ?, ?)';
    db.query(query, [username, email, hashedPassword], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ message: 'Username or email already exists' });
        }
        return res.status(500).json({ message: 'Error creating user', error: err.message });
      }
      res.status(201).json({ message: 'User created successfully', userId: result.insertId });
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.login = (req, res) => {
  const { email, password } = req.body;
  
  const query = 'SELECT * FROM Users WHERE Email = ?';
  db.query(query, [email], async (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err.message });
    }
    
    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.Password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Store user in session
    req.session.userId = user.UserID;
    req.session.username = user.Username;
    
    res.json({ 
      message: 'Login successful',
      userId: user.UserID,
      username: user.Username
    });
  });
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Error logging out' });
    }
    res.json({ message: 'Logged out successfully' });
  });
};

exports.checkAuth = (req, res) => {
  if (req.session.userId) {
    res.json({ 
      authenticated: true, 
      userId: req.session.userId,
      username: req.session.username 
    });
  } else {
    res.json({ authenticated: false });
  }
};