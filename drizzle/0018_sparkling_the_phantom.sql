CREATE TABLE IF NOT EXISTS "match_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" integer NOT NULL,
	"defender_team_id" integer NOT NULL,
	"attacker_team_id" integer NOT NULL,
	"scores" jsonb NOT NULL,
	"submitted_by_team_id" integer NOT NULL,
	"defender_team_agreed" boolean DEFAULT false NOT NULL,
	"attacker_team_agreed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "match_scores_match_id_unique" UNIQUE("match_id"),
	CONSTRAINT "submited_by_match_team" CHECK ("match_scores"."submitted_by_team_id"="match_scores"."attacker_team_id" or "match_scores"."submitted_by_team_id"="match_scores"."defender_team_id")
);
--> statement-breakpoint
ALTER TABLE "team" DROP COLUMN "wins";--> statement-breakpoint
ALTER TABLE "team" DROP COLUMN "losses";--> statement-breakpoint
ALTER TABLE "team" DROP COLUMN "amount_rejected";--> statement-breakpoint
ALTER TABLE "team" DROP COLUMN "loosing_streak";--> statement-breakpoint
ALTER TABLE "team" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "team" DROP COLUMN "last_result";--> statement-breakpoint
ALTER TABLE "team" DROP COLUMN "defendable";
ALTER TABLE "match" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "match" ALTER COLUMN "status" SET DEFAULT 'pending'::text;--> statement-breakpoint
DROP TYPE "public"."match_status";--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('pending', 'accepted', 'rejected', 'cancelled', 'voided', 'scoring', 'scored', 'played');--> statement-breakpoint
ALTER TABLE "position" ADD COLUMN "status" "team_status" DEFAULT 'idle';--> statement-breakpoint
ALTER TABLE "match" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."match_status";--> statement-breakpoint
ALTER TABLE "match" ALTER COLUMN "status" SET DATA TYPE "public"."match_status" USING "status"::"public"."match_status";--> statement-breakpoint
ALTER TABLE "position" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "position" ALTER COLUMN "status" SET DEFAULT 'idle'::text;--> statement-breakpoint
DROP TYPE "public"."team_status";--> statement-breakpoint
CREATE TYPE "public"."team_status" AS ENUM('loser', 'winner', 'idle', 'risky');--> statement-breakpoint
ALTER TABLE "position" ALTER COLUMN "status" SET DEFAULT 'idle'::"public"."team_status";--> statement-breakpoint
ALTER TABLE "position" ALTER COLUMN "status" SET DATA TYPE "public"."team_status" USING "status"::"public"."team_status";--> statement-breakpoint
ALTER TABLE "pyramid_category" DROP CONSTRAINT "pyramid_category_pyramid_id_category_id_pk";--> statement-breakpoint
ALTER TABLE "match" ADD COLUMN "scoring_started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "match" ADD COLUMN "scoring_deadline_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "position" ADD COLUMN "wins" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "position" ADD COLUMN "losses" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "position" ADD COLUMN "score" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "position" ADD COLUMN "amount_rejected" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "position" ADD COLUMN "amount_accepted" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "position" ADD COLUMN "losing_streak" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "position" ADD COLUMN "winning_streak" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "position" ADD COLUMN "last_result" "team_last_result" DEFAULT 'none';--> statement-breakpoint
ALTER TABLE "position" ADD COLUMN "defendable" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "match_scores" ADD CONSTRAINT "match_scores_match_id_match_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."match"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_scores" ADD CONSTRAINT "match_scores_defender_team_id_team_id_fk" FOREIGN KEY ("defender_team_id") REFERENCES "public"."team"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_scores" ADD CONSTRAINT "match_scores_attacker_team_id_team_id_fk" FOREIGN KEY ("attacker_team_id") REFERENCES "public"."team"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_scores" ADD CONSTRAINT "match_scores_submitted_by_team_id_team_id_fk" FOREIGN KEY ("submitted_by_team_id") REFERENCES "public"."team"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_pyramid_id_challenger_team_id_position_pyramid_id_team_id_fk" FOREIGN KEY ("pyramid_id","challenger_team_id") REFERENCES "public"."position"("pyramid_id","team_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_pyramid_id_defender_team_id_position_pyramid_id_team_id_fk" FOREIGN KEY ("pyramid_id","defender_team_id") REFERENCES "public"."position"("pyramid_id","team_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match" DROP COLUMN "evidence_url";--> statement-breakpoint
