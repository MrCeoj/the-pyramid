ALTER TABLE "match_scores" ALTER COLUMN "defender_team_agreed" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "match_scores" ALTER COLUMN "defender_team_agreed" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "match_scores" ALTER COLUMN "attacker_team_agreed" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "match_scores" ALTER COLUMN "attacker_team_agreed" DROP NOT NULL;