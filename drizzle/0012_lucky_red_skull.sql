ALTER TABLE "match_notifications" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "match_notifications" CASCADE;--> statement-breakpoint
ALTER TABLE "position_history" RENAME COLUMN "challenger_team_id" TO "team_id";--> statement-breakpoint
ALTER TABLE "position_history" RENAME COLUMN "defender_team_id" TO "affected_team_id";--> statement-breakpoint
ALTER TABLE "position_history" RENAME COLUMN "challenger_old_row" TO "old_row";--> statement-breakpoint
ALTER TABLE "position_history" RENAME COLUMN "challenger_old_col" TO "old_col";--> statement-breakpoint
ALTER TABLE "position_history" RENAME COLUMN "challenger_new_row" TO "new_row";--> statement-breakpoint
ALTER TABLE "position_history" RENAME COLUMN "challenger_new_col" TO "new_col";--> statement-breakpoint
ALTER TABLE "position_history" RENAME COLUMN "defender_old_row" TO "affected_old_row";--> statement-breakpoint
ALTER TABLE "position_history" RENAME COLUMN "defender_old_col" TO "affected_old_col";--> statement-breakpoint
ALTER TABLE "position_history" RENAME COLUMN "defender_new_row" TO "affected_new_row";--> statement-breakpoint
ALTER TABLE "position_history" RENAME COLUMN "defender_new_col" TO "affected_new_col";--> statement-breakpoint
ALTER TABLE "position_history" RENAME COLUMN "effectiveDate" TO "effective_date";--> statement-breakpoint
ALTER TABLE "position_history" DROP CONSTRAINT "position_history_challenger_team_id_team_id_fk";
--> statement-breakpoint
ALTER TABLE "position_history" DROP CONSTRAINT "position_history_defender_team_id_team_id_fk";
--> statement-breakpoint
ALTER TABLE "position_history" ADD CONSTRAINT "position_history_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "position_history" ADD CONSTRAINT "position_history_affected_team_id_team_id_fk" FOREIGN KEY ("affected_team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match" DROP COLUMN "challenger_player1_viewed_at";--> statement-breakpoint
ALTER TABLE "match" DROP COLUMN "challenger_player2_viewed_at";--> statement-breakpoint
ALTER TABLE "match" DROP COLUMN "defender_player1_viewed_at";--> statement-breakpoint
ALTER TABLE "match" DROP COLUMN "defender_player2_viewed_at";--> statement-breakpoint
ALTER TABLE "match" DROP COLUMN "last_status_change";--> statement-breakpoint
ALTER TABLE "match" DROP COLUMN "notifications_sent";