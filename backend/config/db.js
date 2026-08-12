const mongoose = require('mongoose');

/**
 * Connect to MongoDB.
 *
 * Uses process.env.MONGO_URI when present (local mongod or MongoDB Atlas).
 * If MONGO_URI is missing AND USE_MEMORY_DB=true, an ephemeral in-process
 * MongoDB is started instead so the app can run with zero setup.
 */
async function connectDB() {
  let uri = process.env.MONGO_URI;
  const useMemoryEnv = String(process.env.USE_MEMORY_DB || '').toLowerCase();
  const shouldUseMemoryDB =
    useMemoryEnv === 'true' ||
    (!uri && process.env.NODE_ENV === 'production');

  if (!uri && shouldUseMemoryDB) {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mem = await MongoMemoryServer.create();
    uri = mem.getUri('taskflow');
    global.__MEMORY_MONGO__ = mem;
    console.log('[db] No MONGO_URI found — started in-memory MongoDB');
  }

  if (!uri) {
    throw new Error(
      'MONGO_URI is not defined. Add it to backend/.env or set USE_MEMORY_DB=true'
    );
  }

  mongoose.set('strictQuery', true);
  const conn = await mongoose.connect(uri, { autoIndex: true });
  console.log(`[db] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  return conn;
}

module.exports = connectDB;
