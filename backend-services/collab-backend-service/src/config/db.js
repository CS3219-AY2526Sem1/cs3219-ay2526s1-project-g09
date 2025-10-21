import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import { connect } from "mongoose";

const DB_NAME = process.env.MONGO_DB_NAME || "collaborative-service";

export async function connectDB() {
  let mongoDBUri = process.env.MONGO_URI;

  await connect(mongoDBUri, {
    dbName: DB_NAME,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  console.log(`Connected to MongoDB database "${DB_NAME}"`);
  return mongoose.connection;
}
