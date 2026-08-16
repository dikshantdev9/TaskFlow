const mongoose = require('mongoose');

/**
 * Connect to MongoDB.
 *
 * Uses process.env.MONGO_URI when present (local mongod or MongoDB Atlas).
 * If MONGO_URI is missing AND USE_MEMORY_DB=true, an ephemeral in-process
 * MongoDB is started instead so the app can run with zero setup.
 */
async function connectDB() {
  const rawUri = String(process.env.MONGO_URI || '').trim();
  const useMemoryEnv = String(process.env.USE_MEMORY_DB || '').toLowerCase();
  const isPlaceholderUri =
    !rawUri ||
    /YOUR_CLUSTER|your_cluster|<|>/.test(rawUri) ||
    (rawUri.includes('mongodb.net') && /YOUR_CLUSTER|your_cluster/.test(rawUri));

  const uri = isPlaceholderUri ? undefined : rawUri;

  if (!uri) {
    if (useMemoryEnv !== 'true') {
      throw new Error(
        'MONGO_URI is not defined and USE_MEMORY_DB is not enabled. Set USE_MEMORY_DB=true for demo deployments or add a valid MongoDB URI.'
      );
    }
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const os = require('os');
    const tmp = os.tmpdir();
    const mem = await MongoMemoryServer.create({ binary: { downloadDir: tmp } });
    const memoryUri = mem.getUri('taskflow');
    global.__MEMORY_MONGO__ = mem;
    console.log('[db] No MONGO_URI configured — started in-memory MongoDB for this deployment');
    console.log('[db] In-memory MongoDB URI hidden for security');

    mongoose.set('strictQuery', true);
    const conn = await mongoose.connect(memoryUri, { autoIndex: true });
    console.log(`[db] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  }

  console.log('[db] Connecting to MongoDB...');
  mongoose.set('strictQuery', true);
  const conn = await mongoose.connect(uri, { autoIndex: true });
  console.log(`[db] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  return conn;
}

module.exports = connectDB;
