require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

/* ------------------------------------------------------------- middleware */
app.set('trust proxy', 1);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Throttle auth endpoints against brute force
app.use(
  '/api/auth',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false })
);

/* ----------------------------------------------------------------- routes */
app.get('/api/health', (req, res) => res.json({ success: true, status: 'ok', time: new Date() }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/subtasks', require('./routes/subtaskRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

/* --------------------------------------------- serve the frontend as static */
const FRONTEND = path.join(__dirname, '..', 'frontend');
app.use(express.static(FRONTEND));
app.get('/', (req, res) => res.sendFile(path.join(FRONTEND, 'index.html')));

/* ------------------------------------------------------------ error layer */
app.use(notFound);
app.use(errorHandler);

/* ---------------------------------------------------------------- startup */
(async () => {
  try {
    await connectDB();
    if (process.env.SEED_DEMO === 'true') await require('./seed')();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[server] TaskFlow running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[server] Failed to start:', err);
    process.exit(1);
  }
})();

module.exports = app;
