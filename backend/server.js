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

// ============================================================
// BASIC CONFIGURATION
// ============================================================

app.set('trust proxy', 1);

// ============================================================
// CORS
// ============================================================

const allowedOrigin =
  process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || 'https://dikshantdev9.github.io'
    : true;

const corsOptions = {
  origin: allowedOrigin,
  credentials: true,
};

app.use(cors(corsOptions));

console.log('[server] CORS origin:', allowedOrigin);

// ============================================================
// BODY PARSING
// ============================================================

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ============================================================
// RATE LIMITING
// ============================================================

app.use(
  '/api/auth',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ============================================================
// HEALTH CHECK
// This does NOT require MongoDB.
// Useful for Render health checks.
// ============================================================

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    message: 'TaskFlow backend is running',
    time: new Date().toISOString(),
  });
});

// Also keep API health endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    message: 'TaskFlow API is running',
    time: new Date().toISOString(),
  });
});

// ============================================================
// DATABASE CONNECTION
// Only API requests require MongoDB.
// ============================================================

let dbPromise = null;

function connectDatabase() {
  if (!dbPromise) {
    dbPromise = connectDB().catch((err) => {
      // Allow another request to retry the connection
      dbPromise = null;
      throw err;
    });
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

// ============================================================
// API ROUTES
// ============================================================

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/subtasks', require('./routes/subtaskRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// ============================================================
// FRONTEND
// ============================================================

const FRONTEND = path.join(__dirname, '..', 'frontend');

app.use(express.static(FRONTEND));

app.get('/', (req, res) => {
  res.sendFile(path.join(FRONTEND, 'index.html'));
});

// ============================================================
// ERROR HANDLING
// ============================================================

app.use(notFound);
app.use(errorHandler);

// ============================================================
// START SERVER
// IMPORTANT:
// Start Express FIRST.
// MongoDB connection happens separately.
// This prevents Render from waiting for MongoDB before
// the HTTP server starts.
// ============================================================

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', async () => {
    console.log(
      `[server] TaskFlow running on port ${PORT}`
    );

    try {
      await connectDatabase();

      console.log('[db] MongoDB connected successfully');

      if (process.env.SEED_DEMO === 'true') {
        console.log('[db] Seeding demo data...');
        await require('./seed')();
        console.log('[db] Demo data seeded successfully');
      }
    } catch (err) {
      console.error(
        '[db] Initial database connection failed:',
        err.message
      );

      console.error(
        '[db] The server is still running. API requests will retry the database connection.'
      );
    }
  });
}

// ============================================================
// VERCEL / SERVERLESS EXPORT
// ============================================================

module.exports = app;