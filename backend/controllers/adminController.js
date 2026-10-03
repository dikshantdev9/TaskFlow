const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Task = require('../models/Task');
const Subtask = require('../models/Subtask');
const { asyncHandler } = require('../middleware/errorMiddleware');

const JWT_SECRET = process.env.JWT_SECRET || '98ee51da6536ff874401fbb2467c28673b795a626c533c6c71ea6727cad389d5';

const signToken = (id) =>
  jwt.sign({ id }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '30d' });

// @route   POST /api/admin/login
// @desc    Exclusive Admin Login Endpoint
exports.adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error('Admin email and password are required');
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const adminEmail = (process.env.ADMIN_EMAIL || 'dikshantgaikwad99@gmail.com').toLowerCase();

  // Enforce that only the designated admin email can access the admin portal
  if (normalizedEmail !== adminEmail) {
    res.status(403);
    throw new Error('Access denied: Account does not have administrator privileges.');
  }

  let user = await User.findOne({ email: normalizedEmail }).select('+password');
  
  // Auto-provision admin user if not exists yet
  if (!user) {
    if (password === '991983') {
      user = await User.create({
        name: 'Dikshant Gaikwad (Admin)',
        email: normalizedEmail,
        password: '991983',
        avatarColor: '#10b981',
        role: 'admin',
        loginCount: 1,
        lastLogin: new Date(),
      });
    } else {
      res.status(401);
      throw new Error('Invalid administrator credentials');
    }
  } else {
    // If user exists, check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch && password === '991983') {
      // Allow syncing password to master password
      user.password = '991983';
      user.role = 'admin';
      await user.save();
    } else if (!isMatch) {
      res.status(401);
      throw new Error('Invalid administrator credentials');
    }
  }

  // Ensure role is admin
  if (user.role !== 'admin') {
    user.role = 'admin';
  }
  user.loginCount = (user.loginCount || 0) + 1;
  user.lastLogin = new Date();
  await user.save();

  res.json({
    success: true,
    token: signToken(user._id),
    admin: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: 'admin',
    },
  });
});

// @route   GET /api/admin/me
// @desc    Verify current admin session
exports.getAdminMe = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    admin: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

// @route   GET /api/admin/overview
// @desc    Get system-wide summary & user login stats (Admin only)
exports.getOverview = asyncHandler(async (req, res) => {
  const users = await User.find({}, '-password').sort({ createdAt: -1 });
  const totalTasks = await Task.countDocuments();
  const totalSubtasks = await Subtask.countDocuments();

  const totalUsers = users.length;
  const totalLogins = users.reduce((sum, u) => sum + (u.loginCount || 0), 0);

  // Active today (logged in within last 24h)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const activeToday = users.filter((u) => u.lastLogin && new Date(u.lastLogin) >= oneDayAgo).length;

  const pendingRequests = users.filter((u) => u.subscription && u.subscription.status === 'pending_approval');
  const proSubscribers = users.filter((u) => u.isPro || u.plan === 'pro').length;

  res.json({
    success: true,
    data: {
      stats: {
        totalUsers,
        totalLogins,
        activeToday,
        proSubscribers,
        pendingApprovals: pendingRequests.length,
        totalTasks,
        totalSubtasks,
      },
      paymentRequests: pendingRequests.map((u) => ({
        userId: u._id,
        name: u.name,
        email: u.email,
        plan: u.subscription.plan || 'pro',
        billingCycle: u.subscription.billingCycle || 'monthly',
        transactionId: u.subscription.transactionId,
        amount: u.subscription.amount,
        requestedAt: u.subscription.requestedAt,
      })),
      users: users.map((u) => ({
        id: u._id,
        name: u.name,
        email: u.email,
        phone: u.phone || '',
        role: u.role || 'user',
        plan: u.plan || 'free',
        isPro: !!u.isPro,
        subscriptionStatus: u.subscription ? u.subscription.status : 'inactive',
        transactionId: u.subscription ? u.subscription.transactionId : null,
        loginCount: u.loginCount || 0,
        lastLogin: u.lastLogin,
        createdAt: u.createdAt,
        streak: u.streak ? u.streak.current : 0,
      })),
    },
  });
});

// @route   POST /api/admin/approve-subscription
// @desc    Admin 1-Click Approve Pro Subscription
exports.approveSubscription = asyncHandler(async (req, res) => {
  const { userId, days = 30 } = req.body;
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const cycle = (user.subscription && user.subscription.billingCycle) || 'monthly';
  const cycleDays = cycle === 'yearly' ? 365 : cycle === 'quarterly' ? 90 : Number(days) || 30;
  const expiresAt = new Date(Date.now() + cycleDays * 24 * 60 * 60 * 1000);

  user.isPro = true;
  user.plan = 'pro';
  user.subscription = {
    ...(user.subscription ? user.subscription.toObject() : {}),
    status: 'active',
    plan: 'pro',
    approvedAt: new Date(),
    expiresAt,
  };

  await user.save();

  res.json({
    success: true,
    message: `Pro subscription approved for ${user.email} (${cycleDays} days access granted).`,
    user: user.toPublic(),
  });
});

// @route   POST /api/admin/reject-subscription
// @desc    Admin Reject / Revoke Subscription
exports.rejectSubscription = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.isPro = false;
  user.plan = 'free';
  if (user.subscription) {
    user.subscription.status = 'inactive';
  }

  await user.save();

  res.json({
    success: true,
    message: `Subscription rejected/revoked for ${user.email}.`,
    user: user.toPublic(),
  });
});

// @route   POST /api/admin/set-plan
// @desc    Directly change user plan (free, pro, team)
exports.setUserPlan = asyncHandler(async (req, res) => {
  const { userId, plan = 'pro' } = req.body;
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.plan = plan;
  user.isPro = plan === 'pro' || plan === 'team';
  if (user.isPro) {
    user.subscription = {
      status: 'active',
      plan,
      billingCycle: 'lifetime',
      transactionId: 'ADMIN_MANUAL_OVERRIDE',
      amount: 0,
      approvedAt: new Date(),
      expiresAt: new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000), // 10 years
    };
  } else {
    user.subscription = { status: 'inactive', plan: 'free' };
  }

  await user.save();

  res.json({
    success: true,
    message: `User plan updated to ${plan}.`,
  });
});

// @route   GET /api/admin/plans
// @desc    Get all configurable plans
exports.getAdminPlans = asyncHandler(async (req, res) => {
  const PlanConfig = require('../models/PlanConfig');
  const plans = await PlanConfig.getOrSeedPlans();
  res.json({
    success: true,
    plans,
  });
});

// @route   PUT /api/admin/plans/:key
// @desc    Update price, days, badge, and description for a plan
exports.updateAdminPlan = asyncHandler(async (req, res) => {
  const PlanConfig = require('../models/PlanConfig');
  const { key } = req.params;
  const { price, days, name, badge, description, equivalentText, active } = req.body;

  await PlanConfig.getOrSeedPlans();
  let plan = await PlanConfig.findOne({ key });
  if (!plan) {
    res.status(404);
    throw new Error(`Plan ${key} not found`);
  }

  if (price !== undefined) plan.price = Number(price);
  if (days !== undefined) plan.days = Number(days);
  if (name !== undefined) plan.name = String(name).trim();
  if (badge !== undefined) plan.badge = String(badge).trim();
  if (description !== undefined) plan.description = String(description).trim();
  if (equivalentText !== undefined) plan.equivalentText = String(equivalentText).trim();
  if (active !== undefined) plan.active = Boolean(active);

  await plan.save();

  res.json({
    success: true,
    message: `Plan ${plan.name} (${key}) updated successfully!`,
    plan,
  });
});

// @route   DELETE /api/admin/users/:userId
// @desc    Permanently delete a user and their tasks, subtasks, categories, reminders
exports.deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const adminEmail = (process.env.ADMIN_EMAIL || 'dikshantgaikwad99@gmail.com').toLowerCase();
  if (user.email.toLowerCase() === adminEmail) {
    res.status(400);
    throw new Error('Cannot delete the Master Admin account.');
  }

  if (String(user._id) === String(req.user._id)) {
    res.status(400);
    throw new Error('Cannot delete your own active administrator account.');
  }

  const Category = require('../models/Category');
  const Reminder = require('../models/Reminder');

  // Cascade delete all user-related data
  await Promise.all([
    Task.deleteMany({ user: user._id }),
    Subtask.deleteMany({ user: user._id }),
    Category.deleteMany({ user: user._id }),
    Reminder.deleteMany({ user: user._id }),
    User.findByIdAndDelete(user._id),
  ]);

  res.json({
    success: true,
    message: `User ${user.name} (${user.email}) and all associated tasks permanently deleted.`,
  });
});
