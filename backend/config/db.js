const mongoose = require('mongoose');
const JWT_FALLBACK_SECRET = '98ee51da6536ff874401fbb2467c28673b795a626c533c6c71ea6727cad389d5';

/**
 * Connect to MongoDB.
 *
 * Uses process.env.MONGO_URI when present (local mongod or MongoDB Atlas).
 * If MONGO_URI is missing AND USE_MEMORY_DB=true, an ephemeral in-process
 * MongoDB is started instead so the app can run with zero setup.
 */
async function connectDB() {
  if (mongoose.connection && mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  const rawUri = String(process.env.MONGO_URI || '').trim();
  const useMemoryEnv = String(process.env.USE_MEMORY_DB || '').toLowerCase();
  const isPlaceholderUri =
    !rawUri ||
    /YOUR_CLUSTER|your_cluster|<|>/.test(rawUri) ||
    (rawUri.includes('mongodb.net') && /YOUR_CLUSTER|your_cluster/.test(rawUri));

  const uri = isPlaceholderUri ? undefined : rawUri;

  if (!uri) {
    if (useMemoryEnv !== 'true' && !process.env.VERCEL) {
      console.warn('[db] ⚠️  MONGO_URI not configured. For local development, set USE_MEMORY_DB=true.');
      console.warn('[db] For Vercel/production, configure MONGO_URI in environment variables.');
      throw new Error(
        'MONGO_URI is required. Please set MONGO_URI in your Vercel Environment Variables.'
      );
    }
    
    // In-memory fallback for local dev or initial preview
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const os = require('os');
      const tmp = os.tmpdir();
      const mem = await MongoMemoryServer.create({ binary: { downloadDir: tmp } });
      const memoryUri = mem.getUri('taskflow');
      global.__MEMORY_MONGO__ = mem;
      console.log('[db] Starting in-memory database fallback');

      mongoose.set('strictQuery', true);
      const conn = await mongoose.connect(memoryUri, {
        autoIndex: true,
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`[db] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    } catch (memErr) {
      throw new Error('MONGO_URI is required for Vercel deployment. Please add MONGO_URI in your Vercel project Settings -> Environment Variables.');
    }
  }

  console.log('[db] Connecting to MongoDB...');
  mongoose.set('strictQuery', true);
  const conn = await mongoose.connect(uri, {
    autoIndex: true,
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 10000,
  });
  console.log(`[db] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  return conn;
}

module.exports = connectDB;
