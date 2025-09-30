import { relations } from "drizzle-orm/relations";
import { users, accounts, pyramid, position, team, positionHistory, match, category, authenticators, profile, sessions, pyramidCategory } from "./schema";

export const accountsRelations = relations(accounts, ({one}) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	accounts: many(accounts),
	teams_player1Id: many(team, {
		relationName: "team_player1Id_users_id"
	}),
	teams_player2Id: many(team, {
		relationName: "team_player2Id_users_id"
	}),
	authenticators: many(authenticators),
	profiles: many(profile),
	sessions: many(sessions),
}));

export const positionRelations = relations(position, ({one}) => ({
	pyramid: one(pyramid, {
		fields: [position.pyramidId],
		references: [pyramid.id]
	}),
	team: one(team, {
		fields: [position.teamId],
		references: [team.id]
	}),
}));

export const pyramidRelations = relations(pyramid, ({many}) => ({
	positions: many(position),
	positionHistories: many(positionHistory),
	matches: many(match),
	pyramidCategories: many(pyramidCategory),
}));

export const teamRelations = relations(team, ({one, many}) => ({
	positions: many(position),
	positionHistories_teamId: many(positionHistory, {
		relationName: "positionHistory_teamId_team_id"
	}),
	positionHistories_affectedTeamId: many(positionHistory, {
		relationName: "positionHistory_affectedTeamId_team_id"
	}),
	matches_challengerTeamId: many(match, {
		relationName: "match_challengerTeamId_team_id"
	}),
	matches_defenderTeamId: many(match, {
		relationName: "match_defenderTeamId_team_id"
	}),
	matches_winnerTeamId: many(match, {
		relationName: "match_winnerTeamId_team_id"
	}),
	category: one(category, {
		fields: [team.categoryId],
		references: [category.id]
	}),
	user_player1Id: one(users, {
		fields: [team.player1Id],
		references: [users.id],
		relationName: "team_player1Id_users_id"
	}),
	user_player2Id: one(users, {
		fields: [team.player2Id],
		references: [users.id],
		relationName: "team_player2Id_users_id"
	}),
}));

export const positionHistoryRelations = relations(positionHistory, ({one}) => ({
	pyramid: one(pyramid, {
		fields: [positionHistory.pyramidId],
		references: [pyramid.id]
	}),
	match: one(match, {
		fields: [positionHistory.matchId],
		references: [match.id]
	}),
	team_teamId: one(team, {
		fields: [positionHistory.teamId],
		references: [team.id],
		relationName: "positionHistory_teamId_team_id"
	}),
	team_affectedTeamId: one(team, {
		fields: [positionHistory.affectedTeamId],
		references: [team.id],
		relationName: "positionHistory_affectedTeamId_team_id"
	}),
}));

export const matchRelations = relations(match, ({one, many}) => ({
	positionHistories: many(positionHistory),
	pyramid: one(pyramid, {
		fields: [match.pyramidId],
		references: [pyramid.id]
	}),
	team_challengerTeamId: one(team, {
		fields: [match.challengerTeamId],
		references: [team.id],
		relationName: "match_challengerTeamId_team_id"
	}),
	team_defenderTeamId: one(team, {
		fields: [match.defenderTeamId],
		references: [team.id],
		relationName: "match_defenderTeamId_team_id"
	}),
	team_winnerTeamId: one(team, {
		fields: [match.winnerTeamId],
		references: [team.id],
		relationName: "match_winnerTeamId_team_id"
	}),
}));

export const categoryRelations = relations(category, ({many}) => ({
	teams: many(team),
	pyramidCategories: many(pyramidCategory),
}));

export const authenticatorsRelations = relations(authenticators, ({one}) => ({
	user: one(users, {
		fields: [authenticators.userId],
		references: [users.id]
	}),
}));

export const profileRelations = relations(profile, ({one}) => ({
	user: one(users, {
		fields: [profile.userId],
		references: [users.id]
	}),
}));

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));

export const pyramidCategoryRelations = relations(pyramidCategory, ({one}) => ({
	pyramid: one(pyramid, {
		fields: [pyramidCategory.pyramidId],
		references: [pyramid.id]
	}),
	category: one(category, {
		fields: [pyramidCategory.categoryId],
		references: [category.id]
	}),
}));