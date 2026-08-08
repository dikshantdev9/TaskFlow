const User = require('../models/User');
const Task = require('../models/Task');
const Subtask = require('../models/Subtask');
const Category = require('../models/Category');
const Reminder = require('../models/Reminder');
const { asyncHandler } = require('../middleware/errorMiddleware');

// @route GET /api/users/profile
exports.getProfile = asyncHandler(async (req, res) => {
  const [taskCount, completedTasks, subtaskCount, completedSubtasks] = await Promise.all([
    Task.countDocuments({ user: req.user._id, deleted: false }),
    Task.countDocuments({ user: req.user._id, deleted: false, status: 'completed' }),
    Subtask.countDocuments({ user: req.user._id }),
    Subtask.countDocuments({ user: req.user._id, completed: true }),
  ]);

  res.json({
    success: true,
    user: req.user.toPublic(),
    stats: { taskCount, completedTasks, subtaskCount, completedSubtasks, memberSince: req.user.createdAt },
  });
});

// @route PUT /api/users/profile
exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, email, bio, avatarColor, timezone } = req.body;
  const user = await User.findById(req.user._id);

  if (email && email.toLowerCase() !== user.email) {
    const taken = await User.findOne({ email: email.toLowerCase() });
    if (taken) {
      res.status(409);
      throw new Error('That email is already in use');
    }
    user.email = email.toLowerCase();
  }
  if (name !== undefined) user.name = name;
  if (bio !== undefined) user.bio = bio;
  if (avatarColor !== undefined) user.avatarColor = avatarColor;
  if (timezone !== undefined) user.timezone = timezone;

  await user.save();
  res.json({ success: true, user: user.toPublic() });
});

// @route PUT /api/users/password
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error('Current and new password are both required');
  }
  if (String(newPassword).length < 6) {
    res.status(400);
    throw new Error('New password must be at least 6 characters');
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password updated' });
});

// @route PUT /api/users/settings
exports.updateSettings = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const s = req.body || {};

  if (s.theme) user.settings.theme = s.theme;
  if (s.accent) user.settings.accent = s.accent;
  if (s.weekStart) user.settings.weekStart = s.weekStart;
  if (typeof s.compactMode === 'boolean') user.settings.compactMode = s.compactMode;
  if (s.notifications) {
    ['dueSoon', 'dailyDigest', 'streakReminder'].forEach((k) => {
      if (typeof s.notifications[k] === 'boolean') user.settings.notifications[k] = s.notifications[k];
    });
  }

  await user.save();
  res.json({ success: true, user: user.toPublic() });
});

// @route GET /api/users/export  — download all of this user's data as JSON
exports.exportData = asyncHandler(async (req, res) => {
  const [tasks, subtasks, categories] = await Promise.all([
    Task.find({ user: req.user._id }).lean(),
    Subtask.find({ user: req.user._id }).lean(),
    Category.find({ user: req.user._id }).lean(),
  ]);
  res.json({ success: true, exportedAt: new Date(), user: req.user.toPublic(), tasks, subtasks, categories });
});

// @route DELETE /api/users/account
exports.deleteAccount = asyncHandler(async (req, res) => {
  const uid = req.user._id;
  await Promise.all([
    Task.deleteMany({ user: uid }),
    Subtask.deleteMany({ user: uid }),
    Category.deleteMany({ user: uid }),
    Reminder.deleteMany({ user: uid }),
  ]);
  await User.findByIdAndDelete(uid);
  res.json({ success: true, message: 'Account and all data deleted' });
});
