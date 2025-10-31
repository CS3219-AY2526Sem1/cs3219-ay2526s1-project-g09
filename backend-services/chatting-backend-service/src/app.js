import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// health check
app.get("/health", async (_req, reply) => {
  return reply.send({ ok: true });
});

export default app;
