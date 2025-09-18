import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  primaryKey,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";
import { AdapterAccountType } from "@auth/core/adapters";

export const matchStatus = pgEnum("match_status", [
  "pending",
  "accepted",
  "played",
  "rejected",
  "cancelled",
]);

export const roles = pgEnum("role", [
  "player",
  "admin"
])

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  role: roles("role").notNull().default("player"),
  passwordHash: text("password_hash"),
})
 
export const accounts = pgTable(
  "accounts",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    {
      compoundKey: primaryKey({
        columns: [account.provider, account.providerAccountId],
      }),
    },
  ]
)
 
export const sessions = pgTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
})
 
export const verificationTokens = pgTable(
  "verificationTokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => [
    {
      compositePk: primaryKey({
        columns: [verificationToken.identifier, verificationToken.token],
      }),
    },
  ]
)
 
export const authenticators = pgTable(
  "authenticators",
  {
    credentialID: text("credentialID").notNull().unique(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: text("providerAccountId").notNull(),
    credentialPublicKey: text("credentialPublicKey").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credentialDeviceType").notNull(),
    credentialBackedUp: boolean("credentialBackedUp").notNull(),
    transports: text("transports"),
  },
  (authenticator) => [
    {
      compositePK: primaryKey({
        columns: [authenticator.userId, authenticator.credentialID],
      }),
    },
  ]
)

// 1. Pyramid table
export const pyramid = pgTable("pyramid", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  row_amount: integer("row_amount").default(1),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// 2. Category table
export const category = pgTable("category", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// 3. Pyramid <-> Category (N:N)
export const pyramidCategory = pgTable(
  "pyramid_category",
  {
    pyramidId: integer("pyramid_id")
      .notNull()
      .references(() => pyramid.id, { onDelete: "cascade" }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => category.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.pyramidId, t.categoryId] }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  })
);

// 4. Team table
export const team = pgTable("team", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  categoryId: integer("category_id").references(() => category.id, {
    onDelete: "set null",
  }),
  wins: integer("wins").default(0),
  losses: integer("losses").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// 5. Profile table
export const profile = pgTable("profile", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  nickname: text("nickname").unique(),
  avatarUrl: text("avatar_url"),
  teamId: integer("team_id").references(() => team.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// 6. Position table
export const position = pgTable(
  "position",
  {
    id: serial("id").primaryKey(),
    pyramidId: integer("pyramid_id")
      .notNull()
      .references(() => pyramid.id, { onDelete: "cascade" }),
    teamId: integer("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    row: integer("row").notNull(),
    col: integer("col").notNull(),
  },
  (t) => ({
    uniquePyramidRowCol: uniqueIndex("unique_pyramid_row_col").on(
      t.pyramidId,
      t.row,
      t.col
    ),
    uniquePyramidTeam: uniqueIndex("unique_pyramid_team").on(
      t.pyramidId,
      t.teamId
    ),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  })
);

// 7. Match table
export const match = pgTable("match", {
  id: serial("id").primaryKey(),
  pyramidId: integer("pyramid_id")
    .notNull()
    .references(() => pyramid.id, { onDelete: "cascade" }),
  challengerTeamId: integer("challenger_team_id")
    .notNull()
    .references(() => team.id),
  defenderTeamId: integer("defender_team_id")
    .notNull()
    .references(() => team.id),
  winnerTeamId: integer("winner_team_id").references(() => team.id),
  evidenceUrl: text("evidence_url"),
  status: matchStatus("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// 8. Position history
export const positionHistory = pgTable("position_history", {
  id: serial("id").primaryKey(),
  pyramidId: integer("pyramid_id")
    .notNull()
    .references(() => pyramid.id, { onDelete: "cascade" }),
  matchId: integer("match_id").references(() => match.id, {
    onDelete: "set null",
  }),
  challengerTeamId: integer("challenger_team_id")
    .notNull()
    .references(() => team.id),
  defenderTeamId: integer("defender_team_id")
    .notNull()
    .references(() => team.id),

  challengerOldRow: integer("challenger_old_row"),
  challengerOldCol: integer("challenger_old_col"),
  defenderOldRow: integer("defender_old_row"),
  defenderOldCol: integer("defender_old_col"),

  challengerNewRow: integer("challenger_new_row"),
  challengerNewCol: integer("challenger_new_col"),
  defenderNewRow: integer("defender_new_row"),
  defenderNewCol: integer("defender_new_col"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
