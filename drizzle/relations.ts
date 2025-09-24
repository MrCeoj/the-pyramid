import { relations } from "drizzle-orm/relations";
import { users, authenticators, sessions, pyramid, position, team, positionHistory, match, accounts, profile, matchViews, category, pyramidCategory } from "./schema";

export const authenticatorsRelations = relations(authenticators, ({one}) => ({
	user: one(users, {
		fields: [authenticators.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	authenticators: many(authenticators),
	sessions: many(sessions),
	accounts: many(accounts),
	profiles: many(profile),
	matchViews: many(matchViews),
}));

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
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
	positionHistories_challengerTeamId: many(positionHistory, {
		relationName: "positionHistory_challengerTeamId_team_id"
	}),
	positionHistories_defenderTeamId: many(positionHistory, {
		relationName: "positionHistory_defenderTeamId_team_id"
	}),
	profiles: many(profile),
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
	team_challengerTeamId: one(team, {
		fields: [positionHistory.challengerTeamId],
		references: [team.id],
		relationName: "positionHistory_challengerTeamId_team_id"
	}),
	team_defenderTeamId: one(team, {
		fields: [positionHistory.defenderTeamId],
		references: [team.id],
		relationName: "positionHistory_defenderTeamId_team_id"
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
	matchViews: many(matchViews),
}));

export const accountsRelations = relations(accounts, ({one}) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id]
	}),
}));

export const profileRelations = relations(profile, ({one}) => ({
	user: one(users, {
		fields: [profile.userId],
		references: [users.id]
	}),
	team: one(team, {
		fields: [profile.teamId],
		references: [team.id]
	}),
}));

export const matchViewsRelations = relations(matchViews, ({one}) => ({
	match: one(match, {
		fields: [matchViews.matchId],
		references: [match.id]
	}),
	user: one(users, {
		fields: [matchViews.userId],
		references: [users.id]
	}),
}));

export const categoryRelations = relations(category, ({many}) => ({
	teams: many(team),
	pyramidCategories: many(pyramidCategory),
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