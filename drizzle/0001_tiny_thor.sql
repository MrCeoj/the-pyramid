CREATE TYPE "public"."role" AS ENUM('player', 'admin');--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" "role" DEFAULT 'player' NOT NULL;