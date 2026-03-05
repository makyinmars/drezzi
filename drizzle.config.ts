import { existsSync } from "node:fs";
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

const envFiles = [".env.franklin", ".env.local", ".env.development", ".env"];

for (const file of envFiles) {
  if (!existsSync(file)) {
    continue;
  }

  config({ path: file });
}

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error("DATABASE_URL is required for Drizzle Kit commands.");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./drizzle/migrations/schema.ts",
  out: "./drizzle/migrations",
  dbCredentials: {
    url,
  },
  verbose: true,
  strict: true,
});
