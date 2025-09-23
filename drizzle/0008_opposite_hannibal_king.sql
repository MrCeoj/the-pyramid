CREATE TABLE "match_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"viewed_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "match" ADD COLUMN "challenger_viewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "match" ADD COLUMN "defender_viewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "match" ADD COLUMN "last_status_change" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "match_views" ADD CONSTRAINT "match_views_match_id_match_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."match"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_views" ADD CONSTRAINT "match_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_match_user_view" ON "match_views" USING btree ("match_id","user_id");