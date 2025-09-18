import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: process.env.DATABASE_PASSWORD!,
    database: "the_pyramid",
    ssl: false
  },
  schemaFilter: ['public'],
  verbose: true,
  strict: true,
});
