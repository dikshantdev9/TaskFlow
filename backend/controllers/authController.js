const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Category = require('../models/Category');
const { asyncHandler } = require('../middleware/errorMiddleware');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '30d' });

const DEFAULT_CATEGORIES = [
  { name: 'Learning', color: '#0369A1', icon: 'book' },
  { name: 'Work', color: '#0F7A52', icon: 'briefcase' },
  { name: 'Personal', color: '#B45309', icon: 'heart' },
  { name: 'Health', color: '#BE123C', icon: 'activity' },
];

// @route  POST /api/auth/signup
exports.signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Name, email and password are all required');
  }
  if (String(password).length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }

  const exists = await User.findOne({ email: String(email).toLowerCase() });
  if (exists) {
    res.status(409);
    throw new Error('An account with that email already exists');
  }

  const user = await User.create({ name, email, password });
  await Category.insertMany(DEFAULT_CATEGORIES.map((c) => ({ ...c, user: user._id })));

  res.status(201).json({ success: true, token: signToken(user._id), user: user.toPublic() });
});

// @route  POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  res.json({ success: true, token: signToken(user._id), user: user.toPublic() });
});

// @route  GET /api/auth/me
exports.me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toPublic() });
});

// @route  POST /api/auth/logout  (stateless JWT — client discards the token)
exports.logout = asyncHandler(async (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out' });
});
