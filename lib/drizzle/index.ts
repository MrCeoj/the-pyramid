import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

declare global {
  var dbClient: postgres.Sql | undefined;
}

const connectionString = process.env.CONNECTION_STRING!;

const pool = global.dbClient || postgres(connectionString, { max: 10 });

// In development, we attach the client to the global object
if (process.env.NODE_ENV !== "production") {
  global.dbClient = pool;
}

export const db = drizzle(pool);