import { config } from "dotenv";
import { resolve } from "node:path";
import { existsSync } from "node:fs";

const testEnv = resolve(process.cwd(), ".env.test");
// Load .env.test if it exists, otherwise fall back to .env
config({
  path: existsSync(testEnv) ? testEnv : resolve(process.cwd(), ".env"),
});
