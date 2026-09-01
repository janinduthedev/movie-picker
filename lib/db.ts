import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("Please define the DATABASE_URL environment variable inside .env");
}

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  
  try {
    await mongoose.connect(MONGODB_URI);
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}