import mongoose from "mongoose";

/**
 * Caching connection Mongoose để tránh tạo nhiều connection thừa
 * trong môi trường Next.js App Router và serverless.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

const connectToDatabase = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes("YOUR DB MONGODB HERE")) {
    console.warn("MONGODB_URI chưa được cấu hình hợp lệ.");
    return null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        bufferCommands: false,
      })
      .then((m) => {
        console.log("Connected to MongoDB successfully");
        return m;
      })
      .catch((err) => {
        console.error("Failed to connect to MongoDB:", err);
        cached!.promise = null;
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
};

export default connectToDatabase;
