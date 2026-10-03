const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Category = require('../models/Category');
const { asyncHandler } = require('../middleware/errorMiddleware');

const JWT_SECRET = process.env.JWT_SECRET || '98ee51da6536ff874401fbb2467c28673b795a626c533c6c71ea6727cad389d5';

const signToken = (id) =>
  jwt.sign({ id }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '30d' });

const DEFAULT_CATEGORIES = [
  { name: 'Learning', color: '#0369A1', icon: 'book' },
  { name: 'Work', color: '#0F7A52', icon: 'briefcase' },
  { name: 'Personal', color: '#B45309', icon: 'heart' },
  { name: 'Health', color: '#BE123C', icon: 'activity' },
];

// @route  POST /api/auth/signup
exports.signup = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

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

  // Check if first user or matching admin email
  const isFirstUser = (await User.countDocuments()) === 0;
  const adminEmail = process.env.ADMIN_EMAIL ? process.env.ADMIN_EMAIL.toLowerCase() : 'dikshantgaikwad99@gmail.com';
  const role = isFirstUser || (adminEmail && email.toLowerCase() === adminEmail) ? 'admin' : 'user';

  const user = await User.create({
    name,
    email,
    phone: phone ? String(phone).trim() : '',
    password,
    role,
    loginCount: 1,
    lastLogin: new Date(),
  });
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

  let user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');

  // If user not found and it is demo user or empty DB, auto-seed and try once
  if (!user && (String(email).toLowerCase() === 'demo@taskflow.app' || (await User.countDocuments()) === 0)) {
    try {
      await require('../seed')();
      user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
    } catch (e) {
      console.error('[auth] Auto-seed error:', e.message);
    }
  }

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  // Update login tracking and promote admin email if applicable
  const adminEmail = (process.env.ADMIN_EMAIL || 'dikshantgaikwad99@gmail.com').toLowerCase();
  if (user.email.toLowerCase() === adminEmail) {
    user.role = 'admin';
  }
  user.loginCount = (user.loginCount || 0) + 1;
  user.lastLogin = new Date();
  await user.save();

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
