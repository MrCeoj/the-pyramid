import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    host: "localhost",
    port: 5432,
    user: "marse",
    password: process.env.DATABASE_PASSWORD!,
    database: "the_pyramid",
    ssl: false
  },
  verbose: true,
  strict: true,
});
