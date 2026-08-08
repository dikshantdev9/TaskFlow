const mongoose = require('mongoose');
const Task = require('../models/Task');
const Subtask = require('../models/Subtask');
const Category = require('../models/Category');
const Reminder = require('../models/Reminder');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { recalcTaskProgress, dayKey } = require('../utils/calculateProgress');

/* ------------------------------------------------------------------ helpers */

const startOfDay = (d = new Date()) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const endOfDay = (d = new Date()) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};
const addDays = (d, n) => new Date(new Date(d).getTime() + n * 86400000);

/** Every query is scoped to req.user._id — this is what keeps users' data separate. */
const scope = (req, extra = {}) => ({ user: req.user._id, deleted: false, ...extra });

/* -------------------------------------------------------------------- tasks */

// @route GET /api/tasks
exports.getTasks = asyncHandler(async (req, res) => {
  const { search, priority, status, category, tag, view, sort = '-pinned', trash } = req.query;

  const filter = { user: req.user._id, deleted: trash === 'true' };

  if (priority && priority !== 'all') filter.priority = priority;
  if (status && status !== 'all') filter.status = status;
  if (category && category !== 'all') filter.category = category;
  if (tag) filter.tags = tag;
  if (search) {
    const rx = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ title: rx }, { description: rx }, { tags: rx }, { notes: rx }];
  }
  if (view === 'pinned') filter.pinned = true;
  if (view === 'overdue') {
    filter.dueDate = { $lt: new Date() };
    filter.status = 'active';
  }

  const sortMap = {
    '-pinned': { pinned: -1, updatedAt: -1 },
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    due: { dueDate: 1 },
    progress: { progress: -1 },
    priority: { priority: 1 },
    title: { title: 1 },
  };

  let tasks = await Task.find(filter).populate('category', 'name color icon').sort(sortMap[sort] || sortMap['-pinned']).lean();

  // "Today" view keeps only tasks that have a subtask scheduled for today
  if (view === 'today') {
    const todays = await Subtask.find({
      user: req.user._id,
      date: { $gte: startOfDay(), $lte: endOfDay() },
    }).select('task').lean();
    const ids = new Set(todays.map((s) => String(s.task)));
    tasks = tasks.filter((t) => ids.has(String(t._id)));
  }

  res.json({ success: true, count: tasks.length, tasks });
});

// @route GET /api/tasks/:id
exports.getTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, user: req.user._id }).populate('category', 'name color icon');
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }
  const subtasks = await Subtask.find({ task: task._id }).sort({ date: 1, order: 1, createdAt: 1 });
  res.json({ success: true, task, subtasks });
});

// @route POST /api/tasks
exports.createTask = asyncHandler(async (req, res) => {
  const { title, description, notes, category, tags, priority, startDate, dueDate, color, subtasks } = req.body;

  if (!title || !String(title).trim()) {
    res.status(400);
    throw new Error('Task title is required');
  }

  const task = await Task.create({
    user: req.user._id,
    title: String(title).trim(),
    description: description || '',
    notes: notes || '',
    category: category || null,
    tags: Array.isArray(tags) ? tags.filter(Boolean) : [],
    priority: priority || 'medium',
    startDate: startDate || null,
    dueDate: dueDate || null,
    color: color || '#0F7A52',
  });

  // Optional: create the date-wise subtasks in the same request
  if (Array.isArray(subtasks) && subtasks.length) {
    await Subtask.insertMany(
      subtasks
        .filter((s) => s && s.title && s.date)
        .map((s, i) => ({
          task: task._id,
          user: req.user._id,
          title: String(s.title).trim(),
          date: s.date,
          notes: s.notes || '',
          order: i,
        }))
    );
    await recalcTaskProgress(task._id);
  }

  const fresh = await Task.findById(task._id).populate('category', 'name color icon');
  res.status(201).json({ success: true, task: fresh });
});

// @route PUT /api/tasks/:id
exports.updateTask = asyncHandler(async (req, res) => {
  const allowed = ['title', 'description', 'notes', 'category', 'tags', 'priority', 'startDate', 'dueDate', 'pinned', 'color', 'status'];
  const patch = {};
  allowed.forEach((k) => {
    if (k in req.body) patch[k] = req.body[k];
  });
  if (patch.category === '' || patch.category === 'none') patch.category = null;
  if (patch.status === 'completed') patch.completedAt = new Date();

  const task = await Task.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, patch, {
    returnDocument: 'after',
    runValidators: true,
  }).populate('category', 'name color icon');

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }
  res.json({ success: true, task });
});

// @route PATCH /api/tasks/:id/pin
exports.togglePin = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }
  task.pinned = !task.pinned;
  await task.save();
  res.json({ success: true, task });
});

// @route DELETE /api/tasks/:id  — soft delete into Trash
exports.deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { deleted: true, deletedAt: new Date(), pinned: false },
    { returnDocument: 'after' }
  );
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }
  res.json({ success: true, message: 'Task moved to Trash', task });
});

// @route PATCH /api/tasks/:id/restore
exports.restoreTask = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { deleted: false, deletedAt: null },
    { returnDocument: 'after' }
  );
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }
  res.json({ success: true, message: 'Task restored', task });
});

// @route DELETE /api/tasks/:id/permanent
exports.destroyTask = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }
  await Subtask.deleteMany({ task: task._id });
  await Reminder.deleteMany({ task: task._id });
  res.json({ success: true, message: 'Task permanently deleted' });
});

// @route DELETE /api/tasks/trash/empty
exports.emptyTrash = asyncHandler(async (req, res) => {
  const tasks = await Task.find({ user: req.user._id, deleted: true }).select('_id').lean();
  const ids = tasks.map((t) => t._id);
  await Subtask.deleteMany({ task: { $in: ids } });
  await Reminder.deleteMany({ task: { $in: ids } });
  await Task.deleteMany({ _id: { $in: ids } });
  res.json({ success: true, message: `Deleted ${ids.length} task(s) permanently` });
});

/* --------------------------------------------------------------- categories */

// @route GET /api/tasks/meta/categories
exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ user: req.user._id }).sort({ name: 1 }).lean();
  const counts = await Task.aggregate([
    { $match: { user: req.user._id, deleted: false } },
    { $group: { _id: '$category', n: { $sum: 1 } } },
  ]);
  const map = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));
  res.json({ success: true, categories: categories.map((c) => ({ ...c, taskCount: map[String(c._id)] || 0 })) });
});

// @route POST /api/tasks/meta/categories
exports.createCategory = asyncHandler(async (req, res) => {
  const { name, color, icon } = req.body;
  if (!name || !String(name).trim()) {
    res.status(400);
    throw new Error('Category name is required');
  }
  const category = await Category.create({ user: req.user._id, name: String(name).trim(), color, icon });
  res.status(201).json({ success: true, category });
});

// @route DELETE /api/tasks/meta/categories/:id
exports.deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  await Task.updateMany({ user: req.user._id, category: category._id }, { category: null });
  res.json({ success: true, message: 'Category deleted' });
});

// @route GET /api/tasks/meta/tags
exports.getTags = asyncHandler(async (req, res) => {
  const tags = await Task.aggregate([
    { $match: { user: req.user._id, deleted: false } },
    { $unwind: '$tags' },
    { $group: { _id: '$tags', n: { $sum: 1 } } },
    { $sort: { n: -1 } },
    { $limit: 40 },
  ]);
  res.json({ success: true, tags: tags.map((t) => ({ name: t._id, count: t.n })) });
});

/* ------------------------------------------------------- stats / dashboard */

// @route GET /api/tasks/stats/overview
exports.getStats = asyncHandler(async (req, res) => {
  const uid = req.user._id;

  const [tasks, subtasks] = await Promise.all([
    Task.find({ user: uid, deleted: false }).populate('category', 'name color').lean(),
    Subtask.find({ user: uid }).lean(),
  ]);

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const pending = total - completed;
  const pinned = tasks.filter((t) => t.pinned).length;

  const totalSub = subtasks.length;
  const doneSub = subtasks.filter((s) => s.completed).length;
  const overallProgress = totalSub === 0 ? 0 : Math.round((doneSub / totalSub) * 100);

  const todayStart = startOfDay();
  const todayEnd = endOfDay();
  const taskById = Object.fromEntries(tasks.map((t) => [String(t._id), t]));

  const decorate = (s) => ({
    ...s,
    taskTitle: taskById[String(s.task)]?.title || 'Untitled task',
    taskColor: taskById[String(s.task)]?.color || '#0F7A52',
    priority: taskById[String(s.task)]?.priority || 'medium',
  });

  const todaySubtasks = subtasks
    .filter((s) => taskById[String(s.task)] && new Date(s.date) >= todayStart && new Date(s.date) <= todayEnd)
    .sort((a, b) => Number(a.completed) - Number(b.completed))
    .map(decorate);

  const upcoming = subtasks
    .filter((s) => taskById[String(s.task)] && !s.completed && new Date(s.date) > todayEnd && new Date(s.date) <= addDays(todayEnd, 7))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 8)
    .map(decorate);

  const overdue = subtasks.filter(
    (s) => taskById[String(s.task)] && !s.completed && new Date(s.date) < todayStart
  ).length;

  // Last 7 days completion chart
  const weekly = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = addDays(new Date(), -i);
    const key = dayKey(d);
    const n = subtasks.filter((s) => s.completed && s.completedAt && dayKey(s.completedAt) === key).length;
    weekly.push({ date: key, label: d.toLocaleDateString('en-US', { weekday: 'short' }), completed: n });
  }

  const byPriority = ['low', 'medium', 'high', 'urgent'].map((p) => ({
    priority: p,
    count: tasks.filter((t) => t.priority === p && t.status === 'active').length,
  }));

  res.json({
    success: true,
    stats: {
      total,
      completed,
      pending,
      pinned,
      overdue,
      overallProgress,
      totalSubtasks: totalSub,
      completedSubtasks: doneSub,
      streak: req.user.streak,
      weekly,
      byPriority,
      todaySubtasks,
      upcoming,
      recentTasks: tasks
        .slice()
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 6),
    },
  });
});

// @route GET /api/tasks/stats/analytics?range=30
exports.getAnalytics = asyncHandler(async (req, res) => {
  const days = Math.min(Math.max(parseInt(req.query.range, 10) || 30, 7), 365);
  const uid = req.user._id;
  const from = startOfDay(addDays(new Date(), -(days - 1)));

  const [subtasks, tasks, categories] = await Promise.all([
    Subtask.find({ user: uid }).lean(),
    Task.find({ user: uid, deleted: false }).lean(),
    Category.find({ user: uid }).lean(),
  ]);

  const series = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = addDays(new Date(), -i);
    const key = dayKey(d);
    series.push({
      date: key,
      completed: subtasks.filter((s) => s.completed && s.completedAt && dayKey(s.completedAt) === key).length,
      scheduled: subtasks.filter((s) => dayKey(s.date) === key).length,
    });
  }

  const catMap = Object.fromEntries(categories.map((c) => [String(c._id), c]));
  const byCategory = Object.values(
    tasks.reduce((acc, t) => {
      const id = t.category ? String(t.category) : 'none';
      const name = catMap[id]?.name || 'Uncategorised';
      const color = catMap[id]?.color || '#9AA69F';
      acc[id] = acc[id] || { name, color, total: 0, completed: 0 };
      acc[id].total += 1;
      if (t.status === 'completed') acc[id].completed += 1;
      return acc;
    }, {})
  );

  // Completion rate per weekday (which day are you most productive?)
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const byWeekday = weekdays.map((label, idx) => ({
    label,
    completed: subtasks.filter((s) => s.completed && s.completedAt && new Date(s.completedAt).getDay() === idx).length,
  }));

  const inRange = subtasks.filter((s) => new Date(s.date) >= from);
  const completionRate = inRange.length ? Math.round((inRange.filter((s) => s.completed).length / inRange.length) * 100) : 0;

  const best = series.reduce((m, s) => (s.completed > m.completed ? s : m), { date: null, completed: 0 });

  res.json({
    success: true,
    analytics: {
      range: days,
      series,
      byCategory,
      byWeekday,
      completionRate,
      totalCompleted: series.reduce((n, s) => n + s.completed, 0),
      dailyAverage: Math.round((series.reduce((n, s) => n + s.completed, 0) / days) * 10) / 10,
      bestDay: best,
      streak: req.user.streak,
      byPriority: ['low', 'medium', 'high', 'urgent'].map((p) => ({
        priority: p,
        total: tasks.filter((t) => t.priority === p).length,
        completed: tasks.filter((t) => t.priority === p && t.status === 'completed').length,
      })),
    },
  });
});

// @route GET /api/tasks/stats/calendar?year=2026&month=8   (month is 1-12)
exports.getCalendar = asyncHandler(async (req, res) => {
  const now = new Date();
  const year = parseInt(req.query.year, 10) || now.getFullYear();
  const month = (parseInt(req.query.month, 10) || now.getMonth() + 1) - 1;

  const from = new Date(year, month, 1, 0, 0, 0, 0);
  const to = new Date(year, month + 1, 0, 23, 59, 59, 999);

  const subtasks = await Subtask.find({ user: req.user._id, date: { $gte: from, $lte: to } })
    .populate({ path: 'task', select: 'title color priority deleted' })
    .sort({ date: 1, order: 1 })
    .lean();

  const days = {};
  subtasks
    .filter((s) => s.task && !s.task.deleted)
    .forEach((s) => {
      const key = dayKey(s.date);
      days[key] = days[key] || [];
      days[key].push({
        _id: s._id,
        title: s.title,
        completed: s.completed,
        taskId: s.task._id,
        taskTitle: s.task.title,
        color: s.task.color,
        priority: s.task.priority,
      });
    });

  res.json({ success: true, year, month: month + 1, days });
});

/* ---------------------------------------------------------------- reminders */

// @route GET /api/tasks/meta/reminders
exports.getReminders = asyncHandler(async (req, res) => {
  const now = new Date();
  const soon = addDays(now, 3);

  const dueTasks = await Task.find({
    user: req.user._id,
    deleted: false,
    status: 'active',
    dueDate: { $ne: null, $lte: soon },
  })
    .select('title dueDate priority progress')
    .sort({ dueDate: 1 })
    .lean();

  const stored = await Reminder.find({ user: req.user._id, remindAt: { $lte: soon } })
    .sort({ remindAt: -1 })
    .limit(20)
    .lean();

  const notifications = [
    ...dueTasks.map((t) => ({
      _id: `due-${t._id}`,
      kind: new Date(t.dueDate) < now ? 'overdue' : 'due',
      message:
        new Date(t.dueDate) < now
          ? `"${t.title}" is overdue`
          : `"${t.title}" is due ${new Date(t.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
      taskId: t._id,
      remindAt: t.dueDate,
      read: false,
    })),
    ...stored.map((r) => ({ ...r, kind: r.kind })),
  ].sort((a, b) => new Date(a.remindAt) - new Date(b.remindAt));

  res.json({ success: true, notifications });
});

// @route POST /api/tasks/meta/reminders
exports.createReminder = asyncHandler(async (req, res) => {
  const { message, remindAt, task, subtask } = req.body;
  if (!message || !remindAt) {
    res.status(400);
    throw new Error('message and remindAt are required');
  }
  const reminder = await Reminder.create({ user: req.user._id, message, remindAt, task: task || null, subtask: subtask || null });
  res.status(201).json({ success: true, reminder });
});

exports._helpers = { startOfDay, endOfDay, addDays, scope, mongoose };
