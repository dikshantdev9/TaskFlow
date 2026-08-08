const Task = require('../models/Task');
const Subtask = require('../models/Subtask');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { recalcTaskProgress, touchStreak } = require('../utils/calculateProgress');

/** Ensures the parent task belongs to the signed-in user before touching subtasks. */
async function ownedTask(req, taskId) {
  const task = await Task.findOne({ _id: taskId, user: req.user._id });
  if (!task) {
    const err = new Error('Task not found');
    err.statusCode = 404;
    throw err;
  }
  return task;
}

// @route GET /api/subtasks/task/:taskId
exports.getSubtasks = asyncHandler(async (req, res) => {
  await ownedTask(req, req.params.taskId);
  const subtasks = await Subtask.find({ task: req.params.taskId }).sort({ date: 1, order: 1, createdAt: 1 });
  res.json({ success: true, subtasks });
});

// @route POST /api/subtasks
exports.createSubtask = asyncHandler(async (req, res) => {
  const { task: taskId, title, date, notes, estimateMinutes } = req.body;

  if (!taskId || !title || !date) {
    res.status(400);
    throw new Error('task, title and date are required');
  }
  await ownedTask(req, taskId);

  const count = await Subtask.countDocuments({ task: taskId });
  const subtask = await Subtask.create({
    task: taskId,
    user: req.user._id,
    title: String(title).trim(),
    date,
    notes: notes || '',
    estimateMinutes: estimateMinutes || null,
    order: count,
  });

  const task = await recalcTaskProgress(taskId);
  res.status(201).json({ success: true, subtask, task });
});

// @route POST /api/subtasks/bulk  — add a whole date-wise plan at once
exports.createSubtasksBulk = asyncHandler(async (req, res) => {
  const { task: taskId, subtasks } = req.body;
  if (!taskId || !Array.isArray(subtasks) || !subtasks.length) {
    res.status(400);
    throw new Error('task and a non-empty subtasks array are required');
  }
  await ownedTask(req, taskId);

  const offset = await Subtask.countDocuments({ task: taskId });
  const docs = subtasks
    .filter((s) => s && s.title && s.date)
    .map((s, i) => ({
      task: taskId,
      user: req.user._id,
      title: String(s.title).trim(),
      date: s.date,
      notes: s.notes || '',
      order: offset + i,
    }));

  const created = await Subtask.insertMany(docs);
  const task = await recalcTaskProgress(taskId);
  res.status(201).json({ success: true, subtasks: created, task });
});

// @route PUT /api/subtasks/:id
exports.updateSubtask = asyncHandler(async (req, res) => {
  const subtask = await Subtask.findOne({ _id: req.params.id, user: req.user._id });
  if (!subtask) {
    res.status(404);
    throw new Error('Subtask not found');
  }

  ['title', 'date', 'notes', 'order', 'estimateMinutes'].forEach((k) => {
    if (k in req.body) subtask[k] = req.body[k];
  });
  await subtask.save();

  const task = await recalcTaskProgress(subtask.task);
  res.json({ success: true, subtask, task });
});

// @route PATCH /api/subtasks/:id/toggle  — the checkbox
exports.toggleSubtask = asyncHandler(async (req, res) => {
  const subtask = await Subtask.findOne({ _id: req.params.id, user: req.user._id });
  if (!subtask) {
    res.status(404);
    throw new Error('Subtask not found');
  }

  subtask.completed = typeof req.body.completed === 'boolean' ? req.body.completed : !subtask.completed;
  subtask.completedAt = subtask.completed ? new Date() : null;
  await subtask.save();

  const task = await recalcTaskProgress(subtask.task);
  let streak = req.user.streak;
  if (subtask.completed) {
    const user = await touchStreak(req.user);
    streak = user.streak;
  }

  res.json({ success: true, subtask, task, streak });
});

// @route DELETE /api/subtasks/:id
exports.deleteSubtask = asyncHandler(async (req, res) => {
  const subtask = await Subtask.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!subtask) {
    res.status(404);
    throw new Error('Subtask not found');
  }
  const task = await recalcTaskProgress(subtask.task);
  res.json({ success: true, message: 'Subtask deleted', task });
});
