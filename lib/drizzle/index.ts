import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

declare global {
  var dbClient: postgres.Sql | undefined;
}

const connectionString = process.env.CONNECTION_STRING!;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pool = (globalThis as any).dbClient || postgres(connectionString, { max: 10 });

// In development, we attach the client to the global object
if (process.env.NODE_ENV !== "production") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).dbClient = pool;
}

export const db = drizzle(pool);