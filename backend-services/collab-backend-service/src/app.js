import express from "express";
import cors from "cors";
import collabRoutes from "./routes/collab.routes.js";
import { connectDB } from "./config/db.js";

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.use("/api/v1/collab-service", collabRoutes);

export default app;
