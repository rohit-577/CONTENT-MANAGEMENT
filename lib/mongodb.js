import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.warn("MONGODB_URI is not set — MongoDB connections will fail until it is configured.");
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null, memServer: null };
}

async function startMemoryServer() {
  if (cached.memServer) return cached.memServer;
  try {
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const mem = await MongoMemoryServer.create({
      instance: { dbName: "cms_content" },
    });
    cached.memServer = mem;
    const uri = mem.getUri();
    console.warn(`[mongo] No external MongoDB reachable — started in-memory server at ${uri}`);
    return mem;
  } catch (e) {
    console.error("[mongo] Failed to start in-memory server:", e.message);
    return null;
  }
}

export async function connectMongo() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("Missing required environment variable: MONGODB_URI");
    }

    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose
      .connect(uri, opts)
      .then((m) => m)
      .catch(async (err) => {
        // In dev, gracefully fall back to in-memory if localhost is down
        const isLocalhost = uri.includes("localhost") || uri.includes("127.0.0.1");
        const isDev = process.env.NODE_ENV !== "production";
        if (isLocalhost && isDev) {
          console.warn(`[mongo] Connect failed to ${uri} (${err.message}) — trying in-memory fallback…`);
          const mem = await startMemoryServer();
          if (mem) {
            const memUri = mem.getUri();
            // reset promise so we retry with mem uri
            cached.promise = null;
            const memOpts = { ...opts, serverSelectionTimeoutMS: 7000 };
            cached.promise = mongoose.connect(memUri, memOpts);
            cached.conn = await cached.promise;
            return cached.conn;
          }
        }
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    err.source = "mongodb";
    throw err;
  }

  return cached.conn;
}

export default connectMongo;
