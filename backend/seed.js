/**
 * Optional demo seeder — runs at boot when SEED_DEMO=true.
 * Creates demo@taskflow.app / demo1234 with a realistic month of activity.
 */
const User = require('./models/User');
const Task = require('./models/Task');
const Subtask = require('./models/Subtask');
const Category = require('./models/Category');
const { recalcTaskProgress, dayKey } = require('./utils/calculateProgress');

const day = (offset) => {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d;
};

module.exports = async function seed() {
  const email = 'demo@taskflow.app';
  if (await User.findOne({ email })) return console.log('[seed] demo user already present');

  const user = await User.create({ name: 'Dikshant Gaikwad', email, password: 'demo1234', avatarColor: '#0F7A52' });

  const cats = await Category.insertMany([
    { user: user._id, name: 'Learning', color: '#0369A1', icon: 'book' },
    { user: user._id, name: 'Work', color: '#0F7A52', icon: 'briefcase' },
    { user: user._id, name: 'Personal', color: '#B45309', icon: 'heart' },
    { user: user._id, name: 'Health', color: '#BE123C', icon: 'activity' },
  ]);
  const cat = Object.fromEntries(cats.map((c) => [c.name, c._id]));

  const plan = [
    {
      title: 'Learn Full Stack Development',
      description: 'A focused two-week sprint from HTML fundamentals through a deployed MERN project.',
      category: cat.Learning,
      priority: 'high',
      tags: ['mern', 'javascript', 'career'],
      pinned: true,
      color: '#0369A1',
      start: -4,
      due: 8,
      subtasks: [
        ['Learn HTML — semantic tags & forms', -4],
        ['Learn CSS — flexbox, grid, custom properties', -3],
        ['Learn JavaScript — ES6, DOM, fetch', -2],
        ['Learn Node.js & Express routing', -1],
        ['Build the TaskFlow REST API', 0],
        ['Connect MongoDB with Mongoose', 1],
        ['Add JWT authentication', 2],
        ['Deploy the finished project', 4],
      ],
      done: 4,
    },
    {
      title: 'Ship TaskFlow v1.0',
      description: 'Polish, test and release the first public version.',
      category: cat.Work,
      priority: 'urgent',
      tags: ['product', 'release'],
      pinned: true,
      color: '#BE123C',
      start: -2,
      due: 5,
      subtasks: [
        ['Finalise the dashboard layout', -2],
        ['Write the analytics charts', -1],
        ['Mobile responsive pass', 0],
        ['Accessibility audit', 1],
        ['Write the README', 3],
      ],
      done: 2,
    },
    {
      title: 'Morning Fitness Routine',
      description: 'Rebuild the running habit — 30 minutes every morning.',
      category: cat.Health,
      priority: 'medium',
      tags: ['habit', 'running'],
      color: '#BE123C',
      start: -6,
      due: 6,
      subtasks: [
        ['5 km run', -3],
        ['Strength — upper body', -2],
        ['5 km run', -1],
        ['Rest & stretch', 0],
        ['7 km run', 2],
      ],
      done: 3,
    },
    {
      title: 'Read "Atomic Habits"',
      description: 'One chapter block per sitting, with notes.',
      category: cat.Personal,
      priority: 'low',
      tags: ['reading'],
      color: '#B45309',
      start: -5,
      due: 10,
      subtasks: [
        ['Chapters 1–3', -5],
        ['Chapters 4–7', -2],
        ['Chapters 8–12', 1],
        ['Chapters 13–20 + summary notes', 5],
      ],
      done: 2,
    },
    {
      title: 'Portfolio Website Refresh',
      description: 'New case studies, faster load, dark mode.',
      category: cat.Work,
      priority: 'medium',
      tags: ['design', 'portfolio'],
      color: '#0F7A52',
      start: 1,
      due: 14,
      subtasks: [
        ['Collect project screenshots', 1],
        ['Write three case studies', 3],
        ['Rebuild the layout', 6],
        ['Lighthouse performance pass', 9],
      ],
      done: 0,
    },
  ];

  for (const p of plan) {
    const task = await Task.create({
      user: user._id,
      title: p.title,
      description: p.description,
      category: p.category,
      priority: p.priority,
      tags: p.tags,
      pinned: !!p.pinned,
      color: p.color,
      startDate: day(p.start),
      dueDate: day(p.due),
      notes: '',
    });

    const docs = p.subtasks.map(([title, offset], i) => {
      const completed = i < p.done;
      return {
        task: task._id,
        user: user._id,
        title,
        date: day(offset),
        order: i,
        completed,
        completedAt: completed ? day(offset) : null,
      };
    });
    await Subtask.insertMany(docs);
    await recalcTaskProgress(task._id);
  }

  user.streak = { current: 5, longest: 12, lastActiveDate: dayKey() };
  await user.save();

  console.log('[seed] demo account ready → demo@taskflow.app / demo1234');
};
