import { drizzle } from "drizzle-orm/node-postgres";
import * as relations from "@/db/relations";
import * as schema from "@/db/schema";
import { pgPool } from "@/lib/postgres";

export const db = drizzle(pgPool, {
  schema: {
    ...schema,
    ...relations,
  },
});

export type Db = typeof db;
export type DbTx = Parameters<Parameters<Db["transaction"]>[0]>[0];
