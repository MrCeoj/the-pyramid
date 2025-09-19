import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    host: "193.203.165.62",
    port: 5432,
    user: "marce",
    password: process.env.DATABASE_PASSWORD!,
    database: "the_pyramid",
    ssl: false
  },
  verbose: true,
  strict: true,
});
