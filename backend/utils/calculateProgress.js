const Task = require('../models/Task');
const Subtask = require('../models/Subtask');

/**
 * Recalculate and persist a task's completion percentage.
 *
 *   progress = round(completedSubtasks / totalSubtasks * 100)
 *
 * A task with zero subtasks keeps whatever status it was given manually.
 * A task whose subtasks are all complete is auto-marked `completed`.
 */
async function recalcTaskProgress(taskId) {
  const subtasks = await Subtask.find({ task: taskId }).select('completed').lean();
  const total = subtasks.length;
  const done = subtasks.filter((s) => s.completed).length;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);

  const update = { progress, subtaskCount: total, completedCount: done };

  if (total > 0 && done === total) {
    update.status = 'completed';
    update.completedAt = new Date();
  } else {
    update.status = 'active';
    update.completedAt = null;
  }

  return Task.findByIdAndUpdate(taskId, update, { returnDocument: 'after' });
}

/** Local YYYY-MM-DD key for a date (used for streaks and calendar buckets). */
function dayKey(date = new Date()) {
  const d = new Date(date);
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/**
 * Bump the user's productivity streak. Called whenever a subtask is completed.
 * Same day  -> no change. Yesterday -> +1. Older/never -> reset to 1.
 */
async function touchStreak(user) {
  const today = dayKey();
  if (user.streak.lastActiveDate === today) return user;

  const yesterday = dayKey(new Date(Date.now() - 86400000));
  user.streak.current = user.streak.lastActiveDate === yesterday ? user.streak.current + 1 : 1;
  user.streak.longest = Math.max(user.streak.longest, user.streak.current);
  user.streak.lastActiveDate = today;
  await user.save();
  return user;
}

module.exports = { recalcTaskProgress, touchStreak, dayKey };
