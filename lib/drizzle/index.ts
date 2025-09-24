import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"

const connectionString = process.env.CONNECTION_STRING!
const pool = postgres(connectionString, { max: 100 })

export const db = drizzle(pool)
