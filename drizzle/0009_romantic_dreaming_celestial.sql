CREATE TABLE "match_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"notification_type" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "match_views" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "match_views" CASCADE;--> statement-breakpoint
ALTER TABLE "profile" DROP CONSTRAINT "profile_team_id_team_id_fk";
--> statement-breakpoint
ALTER TABLE "match" ADD COLUMN "challenger_player1_viewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "match" ADD COLUMN "challenger_player2_viewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "match" ADD COLUMN "defender_player1_viewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "match" ADD COLUMN "defender_player2_viewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "match" ADD COLUMN "notifications_sent" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "position" ADD COLUMN "created_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "position" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "pyramid_category" ADD COLUMN "created_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "pyramid_category" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "player1_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "player2_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "paternal_surname" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "maternal_surname" text NOT NULL;--> statement-breakpoint
ALTER TABLE "match_notifications" ADD CONSTRAINT "match_notifications_match_id_match_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."match"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_notifications" ADD CONSTRAINT "match_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_match_user_notification" ON "match_notifications" USING btree ("match_id","user_id","notification_type");--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_player1_id_users_id_fk" FOREIGN KEY ("player1_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_player2_id_users_id_fk" FOREIGN KEY ("player2_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_team_players" ON "team" USING btree ("player1_id","player2_id");--> statement-breakpoint
ALTER TABLE "match" DROP COLUMN "challenger_viewed_at";--> statement-breakpoint
ALTER TABLE "match" DROP COLUMN "defender_viewed_at";--> statement-breakpoint
ALTER TABLE "profile" DROP COLUMN "team_id";--> statement-breakpoint
ALTER TABLE "team" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "name";