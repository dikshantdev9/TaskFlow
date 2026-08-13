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

// -------------------------------------------------------------
// Middleware
// -------------------------------------------------------------

app.set('trust proxy', 1);

// Configure CORS: allow any origin in development, but require an explicit
// FRONTEND_URL in production. This prevents wide-open CORS in production.
const corsOptions = {
  origin:
    process.env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL || false
      : true,
  credentials: true,
};
app.use(cors(corsOptions));
console.log('[server] CORS origin:', corsOptions.origin);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// -------------------------------------------------------------
// Rate limiting
// -------------------------------------------------------------

app.use(
  '/api/auth',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// -------------------------------------------------------------
// Database connection
// Only API requests require MongoDB
// -------------------------------------------------------------

let dbPromise;

function connectDatabase() {
  if (!dbPromise) {
    dbPromise = connectDB();
  }

  return dbPromise;
}

app.use('/api', async (req, res, next) => {
  try {
    await connectDatabase();
    next();
  } catch (err) {
    console.error('[db] Connection failed:', err);

    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error:
        process.env.NODE_ENV === 'development'
          ? err.message
          : undefined,
    });
  }
});

// -------------------------------------------------------------
// API routes
// -------------------------------------------------------------

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    time: new Date(),
  });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/subtasks', require('./routes/subtaskRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// -------------------------------------------------------------
// Frontend
// -------------------------------------------------------------

const FRONTEND = path.join(__dirname, '..', 'frontend');

app.use(express.static(FRONTEND));

app.get('/', (req, res) => {
  res.sendFile(path.join(FRONTEND, 'index.html'));
});

// -------------------------------------------------------------
// Error handling
// -------------------------------------------------------------

app.use(notFound);
app.use(errorHandler);

// -------------------------------------------------------------
// Local development
// -------------------------------------------------------------

if (require.main === module) {
  (async () => {
    try {
      await connectDatabase();

      if (process.env.SEED_DEMO === 'true') {
        await require('./seed')();
      }

      app.listen(PORT, '0.0.0.0', () => {
        console.log(
          `[server] TaskFlow running on http://localhost:${PORT}`
        );
      });
    } catch (err) {
      console.error('[server] Failed to start:', err);
      process.exit(1);
    }
  })();
}

// -------------------------------------------------------------
// Vercel
// -------------------------------------------------------------

module.exports = app;