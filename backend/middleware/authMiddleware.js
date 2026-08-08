const jwt = require('jsonwebtoken');
const User = require('../models/User');

/** Verifies the Bearer JWT and attaches req.user. Every /api route below /auth uses this. */
async function protect(req, res, next) {
  try {
    let token = null;
    const header = req.headers.authorization || '';
    if (header.startsWith('Bearer ')) token = header.slice(7);
    if (!token && req.cookies && req.cookies.token) token = req.cookies.token;

    if (!token) {
      res.status(401);
      throw new Error('Not authorised — no token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401);
      throw new Error('Not authorised — user no longer exists');
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401);
    next(new Error(err.name === 'JsonWebTokenError' ? 'Invalid session token' : err.message));
  }
}

module.exports = { protect };
