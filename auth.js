// backend/middleware/auth.js
function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ message: 'Please log in first' });
  }
}

module.exports = isAuthenticated;