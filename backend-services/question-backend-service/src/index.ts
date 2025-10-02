import "dotenv/config";
import { buildServer } from "./server.js";

const port = 5275;

const app = await buildServer();
await app.listen({ port, host: "0.0.0.0" });
