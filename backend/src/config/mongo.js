import mongoose from "mongoose";

let isConnected = false;

/**
 * Establish (and cache) a single Mongoose connection for the process.
 * Safe to call multiple times — subsequent calls are no-ops once connected.
 */
export const connectMongo = async () => {
  if (isConnected) return mongoose.connection;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not configured in backend/.env (e.g. mongodb+srv://user:pass@cluster/dbname)"
    );
  }

  await mongoose.connect(uri);
  isConnected = true;
  console.log("[MongoDB] Connected successfully.");

  mongoose.connection.on("error", (err) => {
    console.error("[MongoDB] Connection error:", err.message);
  });

  return mongoose.connection;
};