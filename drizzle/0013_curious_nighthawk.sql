ALTER TABLE "position_history" DROP CONSTRAINT "position_history_affected_team_id_team_id_fk";
--> statement-breakpoint
ALTER TABLE "position_history" ADD CONSTRAINT "position_history_affected_team_id_team_id_fk" FOREIGN KEY ("affected_team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;