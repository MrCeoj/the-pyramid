CREATE TYPE "public"."team_status" AS ENUM('looser', 'winner', 'idle', 'risky');--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "status" "team_status" DEFAULT 'idle';