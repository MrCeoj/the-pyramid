import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";

export type DbTransaction = PgTransaction<
  PostgresJsQueryResultHKT,
  Record<string, never>,
  ExtractTablesWithRelations<Record<string, never>>
>;

import { object, string, email } from "zod";

export const LoginSchema = object({
  email: email({
    message: "Ingrese un correo electrónico válido.",
  }),
  password: string().min(1, {
    message: "Contraseña requerida.",
  }),
});