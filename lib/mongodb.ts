import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri && process.env.NODE_ENV === "production") {
  throw new Error("MONGODB_URI is required in production.");
}

type MongooseCache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const globalWithMongoose = globalThis as typeof globalThis & { mongooseCache?: MongooseCache };
const cache = (globalWithMongoose.mongooseCache ??= { conn: null, promise: null });

export async function connectToDatabase() {
  if (!uri) throw new Error("Database is not configured yet.");
  if (cache.conn) return cache.conn;
  cache.promise ??= mongoose.connect(uri, { bufferCommands: false });
  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }
  return cache.conn;
}
