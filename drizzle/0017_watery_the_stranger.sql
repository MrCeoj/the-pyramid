CREATE TYPE "public"."team_last_result" AS ENUM('up', 'down', 'stayed', 'none');--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "last_result" "team_last_result" DEFAULT 'none';