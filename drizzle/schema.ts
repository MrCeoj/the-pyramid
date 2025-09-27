import { pgTable, foreignKey, unique, text, integer, boolean, serial, timestamp, uniqueIndex, primaryKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const matchStatus = pgEnum("match_status", ['pending', 'accepted', 'played', 'rejected', 'cancelled'])
export const role = pgEnum("role", ['player', 'admin'])
export const teamStatus = pgEnum("team_status", ['looser', 'winner', 'idle', 'risky'])


export const authenticators = pgTable("authenticators", {
	credentialId: text().notNull(),
	userId: text().notNull(),
	providerAccountId: text().notNull(),
	credentialPublicKey: text().notNull(),
	counter: integer().notNull(),
	credentialDeviceType: text().notNull(),
	credentialBackedUp: boolean().notNull(),
	transports: text(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "authenticators_userId_users_id_fk"
		}).onDelete("cascade"),
	unique("authenticators_credentialID_unique").on(table.credentialId),
]);

export const pyramid = pgTable("pyramid", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	rowAmount: integer("row_amount").default(1),
	active: boolean().default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const sessions = pgTable("sessions", {
	sessionToken: text().primaryKey().notNull(),
	userId: text().notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "sessions_userId_users_id_fk"
		}).onDelete("cascade"),
]);

export const position = pgTable("position", {
	id: serial().primaryKey().notNull(),
	pyramidId: integer("pyramid_id").notNull(),
	teamId: integer("team_id").notNull(),
	row: integer().notNull(),
	col: integer().notNull(),
}, (table) => [
	uniqueIndex("unique_pyramid_row_col").using("btree", table.pyramidId.asc().nullsLast().op("int4_ops"), table.row.asc().nullsLast().op("int4_ops"), table.col.asc().nullsLast().op("int4_ops")),
	uniqueIndex("unique_pyramid_team").using("btree", table.pyramidId.asc().nullsLast().op("int4_ops"), table.teamId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.pyramidId],
			foreignColumns: [pyramid.id],
			name: "position_pyramid_id_pyramid_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [team.id],
			name: "position_team_id_team_id_fk"
		}).onDelete("cascade"),
]);

export const positionHistory = pgTable("position_history", {
	id: serial().primaryKey().notNull(),
	pyramidId: integer("pyramid_id").notNull(),
	matchId: integer("match_id"),
	challengerTeamId: integer("challenger_team_id").notNull(),
	defenderTeamId: integer("defender_team_id").notNull(),
	challengerOldRow: integer("challenger_old_row"),
	challengerOldCol: integer("challenger_old_col"),
	defenderOldRow: integer("defender_old_row"),
	defenderOldCol: integer("defender_old_col"),
	challengerNewRow: integer("challenger_new_row"),
	challengerNewCol: integer("challenger_new_col"),
	defenderNewRow: integer("defender_new_row"),
	defenderNewCol: integer("defender_new_col"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	effectiveDate: timestamp({ withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.pyramidId],
			foreignColumns: [pyramid.id],
			name: "position_history_pyramid_id_pyramid_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.matchId],
			foreignColumns: [match.id],
			name: "position_history_match_id_match_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.challengerTeamId],
			foreignColumns: [team.id],
			name: "position_history_challenger_team_id_team_id_fk"
		}),
	foreignKey({
			columns: [table.defenderTeamId],
			foreignColumns: [team.id],
			name: "position_history_defender_team_id_team_id_fk"
		}),
]);

export const accounts = pgTable("accounts", {
	userId: text().notNull(),
	type: text().notNull(),
	provider: text().notNull(),
	providerAccountId: text().notNull(),
	refreshToken: text("refresh_token"),
	accessToken: text("access_token"),
	expiresAt: integer("expires_at"),
	tokenType: text("token_type"),
	scope: text(),
	idToken: text("id_token"),
	sessionState: text("session_state"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "accounts_userId_users_id_fk"
		}).onDelete("cascade"),
]);

export const profile = pgTable("profile", {
	id: serial().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	nickname: text(),
	avatarUrl: text("avatar_url"),
	teamId: integer("team_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "profile_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [team.id],
			name: "profile_team_id_team_id_fk"
		}).onDelete("set null"),
	unique("profile_user_id_unique").on(table.userId),
]);

export const category = pgTable("category", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	unique("category_name_unique").on(table.name),
]);

export const verificationTokens = pgTable("verificationTokens", {
	identifier: text().notNull(),
	token: text().notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
});

export const users = pgTable("users", {
	id: text().primaryKey().notNull(),
	name: text(),
	email: text(),
	emailVerified: timestamp({ mode: 'string' }),
	image: text(),
	role: role().default('player').notNull(),
	passwordHash: text("password_hash"),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const match = pgTable("match", {
	id: serial().primaryKey().notNull(),
	pyramidId: integer("pyramid_id").notNull(),
	challengerTeamId: integer("challenger_team_id").notNull(),
	defenderTeamId: integer("defender_team_id").notNull(),
	winnerTeamId: integer("winner_team_id"),
	evidenceUrl: text("evidence_url"),
	status: matchStatus().default('pending').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	challengerViewedAt: timestamp("challenger_viewed_at", { withTimezone: true, mode: 'string' }),
	defenderViewedAt: timestamp("defender_viewed_at", { withTimezone: true, mode: 'string' }),
	lastStatusChange: timestamp("last_status_change", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.pyramidId],
			foreignColumns: [pyramid.id],
			name: "match_pyramid_id_pyramid_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.challengerTeamId],
			foreignColumns: [team.id],
			name: "match_challenger_team_id_team_id_fk"
		}),
	foreignKey({
			columns: [table.defenderTeamId],
			foreignColumns: [team.id],
			name: "match_defender_team_id_team_id_fk"
		}),
	foreignKey({
			columns: [table.winnerTeamId],
			foreignColumns: [team.id],
			name: "match_winner_team_id_team_id_fk"
		}),
]);

export const team = pgTable("team", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	categoryId: integer("category_id"),
	wins: integer().default(0),
	losses: integer().default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	status: teamStatus().default('idle'),
}, (table) => [
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [category.id],
			name: "team_category_id_category_id_fk"
		}).onDelete("set null"),
]);

export const matchViews = pgTable("match_views", {
	id: serial().primaryKey().notNull(),
	matchId: integer("match_id").notNull(),
	userId: text("user_id").notNull(),
	viewedAt: timestamp("viewed_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	uniqueIndex("unique_match_user_view").using("btree", table.matchId.asc().nullsLast().op("int4_ops"), table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.matchId],
			foreignColumns: [match.id],
			name: "match_views_match_id_match_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "match_views_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const pyramidCategory = pgTable("pyramid_category", {
	pyramidId: integer("pyramid_id").notNull(),
	categoryId: integer("category_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.pyramidId],
			foreignColumns: [pyramid.id],
			name: "pyramid_category_pyramid_id_pyramid_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [category.id],
			name: "pyramid_category_category_id_category_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.pyramidId, table.categoryId], name: "pyramid_category_pyramid_id_category_id_pk"}),
]);
