import express from "express";
import cors from "cors";
import historyRoutes from "./routes/history.routes.js";
import { connectDB } from "./config/db.js";

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.use("/api/v1/history-service", historyRoutes);

export default app;
