const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '.env') });
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
    dbPromise = connectDB()
      .then(async (conn) => {
        if (process.env.SEED_DEMO === 'true') {
          try {
            await require('./seed')();
          } catch (seedErr) {
            console.error('[db] Seed error:', seedErr);
          }
        }
        return conn;
      })
      .catch((err) => {
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
      message: `Database connection error: ${err.message || 'Please verify MONGO_URI and IP access (0.0.0.0/0) in MongoDB Atlas.'}`,
      error: err.message,
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
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/billing', require('./routes/billingRoutes'));

// ============================================================
// FRONTEND
// ============================================================

const FRONTEND = path.join(__dirname, '..', 'frontend');

app.use(express.static(FRONTEND));

app.get('/', (req, res) => {
  res.sendFile(path.join(FRONTEND, 'index.html'));
});

// Prevent admin pages on User port 5000 only in local multi-port mode (allow on Vercel/serverless)
if (!process.env.VERCEL) {
  app.get(['/admin-login.html', '/admin.html'], (req, res) => {
    res.redirect(`http://${req.hostname}:5001`);
  });
}

// ============================================================
// ADMIN APP (PORT 5001)
// ============================================================

const adminApp = express();
const ADMIN_PORT = process.env.ADMIN_PORT || 5001;

adminApp.set('trust proxy', 1);
adminApp.use(cors({ origin: true, credentials: true }));
adminApp.use(express.json({ limit: '1mb' }));
adminApp.use(express.urlencoded({ extended: true }));
adminApp.use(cookieParser());

adminApp.use('/api', async (req, res, next) => {
  try {
    await connectDatabase();
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: 'Database connection failed' });
  }
});

adminApp.use('/api/admin', require('./routes/adminRoutes'));

// Admin root route serves admin-login.html
adminApp.get('/', (req, res) => {
  res.sendFile(path.join(FRONTEND, 'admin-login.html'));
});

// Serve Admin Frontend static files
adminApp.use(express.static(FRONTEND, { index: false }));

// ============================================================
// ERROR HANDLING
// ============================================================

app.use(notFound);
app.use(errorHandler);

adminApp.use(notFound);
adminApp.use(errorHandler);

// ============================================================
// START SERVERS
// ============================================================

if (require.main === module) {
  // 1. User Application Server
  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`[user-server] 👤 TaskFlow User Portal running on http://localhost:${PORT}`);

    try {
      await connectDatabase();
      console.log('[db] MongoDB connected successfully');

      if (process.env.SEED_DEMO === 'true') {
        console.log('[db] Seeding demo data...');
        await require('./seed')();
        console.log('[db] Demo data seeded successfully');
      }
    } catch (err) {
      console.error('[db] Initial database connection failed:', err.message);
    }
  });

  // 2. Admin Portal Server
  adminApp.listen(ADMIN_PORT, '0.0.0.0', () => {
    console.log(`[admin-server] 🛡️ TaskFlow Admin Portal running on http://localhost:${ADMIN_PORT}`);
  });
}

// ============================================================
// VERCEL / SERVERLESS EXPORT
// ============================================================

module.exports = app;