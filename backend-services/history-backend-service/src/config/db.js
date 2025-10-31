import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const DEFAULT_DB_NAME = "history-service";

export async function connectDB() {
  const mongoUri = process.env.MONGO_URI;
  const dbName = process.env.MONGO_DB_NAME || DEFAULT_DB_NAME;

  if (!mongoUri) {
    throw new Error("MONGO_URI environment variable is not set");
  }

  await mongoose.connect(mongoUri, {
    dbName,
  });

  console.log(`Connected to MongoDB database "${dbName}"`);
  return mongoose.connection;
}

export default mongoose;
