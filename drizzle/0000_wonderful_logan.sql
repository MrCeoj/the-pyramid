CREATE TYPE "public"."match_status" AS ENUM('pending', 'accepted', 'played', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TABLE "category" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "category_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "match" (
	"id" serial PRIMARY KEY NOT NULL,
	"pyramid_id" integer NOT NULL,
	"challenger_team_id" integer NOT NULL,
	"defender_team_id" integer NOT NULL,
	"winner_team_id" integer,
	"evidence_url" text,
	"status" "match_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "position" (
	"id" serial PRIMARY KEY NOT NULL,
	"pyramid_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"row" integer NOT NULL,
	"col" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "position_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"pyramid_id" integer NOT NULL,
	"match_id" integer,
	"challenger_team_id" integer NOT NULL,
	"defender_team_id" integer NOT NULL,
	"challenger_old_row" integer,
	"challenger_old_col" integer,
	"defender_old_row" integer,
	"defender_old_col" integer,
	"challenger_new_row" integer,
	"challenger_new_col" integer,
	"defender_new_row" integer,
	"defender_new_col" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "profile" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"nickname" text,
	"avatar_url" text,
	"team_id" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "profile_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "profile_nickname_unique" UNIQUE("nickname")
);
--> statement-breakpoint
CREATE TABLE "pyramid" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pyramid_category" (
	"pyramid_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	CONSTRAINT "pyramid_category_pyramid_id_category_id_pk" PRIMARY KEY("pyramid_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "team" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category_id" integer,
	"wins" integer DEFAULT 0,
	"losses" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_pyramid_id_pyramid_id_fk" FOREIGN KEY ("pyramid_id") REFERENCES "public"."pyramid"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_challenger_team_id_team_id_fk" FOREIGN KEY ("challenger_team_id") REFERENCES "public"."team"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_defender_team_id_team_id_fk" FOREIGN KEY ("defender_team_id") REFERENCES "public"."team"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_winner_team_id_team_id_fk" FOREIGN KEY ("winner_team_id") REFERENCES "public"."team"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "position" ADD CONSTRAINT "position_pyramid_id_pyramid_id_fk" FOREIGN KEY ("pyramid_id") REFERENCES "public"."pyramid"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "position" ADD CONSTRAINT "position_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "position_history" ADD CONSTRAINT "position_history_pyramid_id_pyramid_id_fk" FOREIGN KEY ("pyramid_id") REFERENCES "public"."pyramid"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "position_history" ADD CONSTRAINT "position_history_match_id_match_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."match"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "position_history" ADD CONSTRAINT "position_history_challenger_team_id_team_id_fk" FOREIGN KEY ("challenger_team_id") REFERENCES "public"."team"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "position_history" ADD CONSTRAINT "position_history_defender_team_id_team_id_fk" FOREIGN KEY ("defender_team_id") REFERENCES "public"."team"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pyramid_category" ADD CONSTRAINT "pyramid_category_pyramid_id_pyramid_id_fk" FOREIGN KEY ("pyramid_id") REFERENCES "public"."pyramid"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pyramid_category" ADD CONSTRAINT "pyramid_category_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_pyramid_row_col" ON "position" USING btree ("pyramid_id","row","col");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_pyramid_team" ON "position" USING btree ("pyramid_id","team_id");