import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"

const connectionString = "postgres://postgres:postgres@localhost:5432/the_pyramid"
const pool = postgres(connectionString, { max: 1 })

export const db = drizzle(pool)
