ALTER TABLE "account" RENAME TO "accounts";--> statement-breakpoint
ALTER TABLE "authenticator" RENAME TO "authenticators";--> statement-breakpoint
ALTER TABLE "session" RENAME TO "sessions";--> statement-breakpoint
ALTER TABLE "user" RENAME TO "users";--> statement-breakpoint
ALTER TABLE "verificationToken" RENAME TO "verificationTokens";--> statement-breakpoint
ALTER TABLE "authenticators" DROP CONSTRAINT "authenticator_credentialID_unique";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "user_email_unique";--> statement-breakpoint
ALTER TABLE "accounts" DROP CONSTRAINT "account_userId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "authenticators" DROP CONSTRAINT "authenticator_userId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "profile" DROP CONSTRAINT "profile_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "sessions" DROP CONSTRAINT "session_userId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authenticators" ADD CONSTRAINT "authenticators_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authenticators" ADD CONSTRAINT "authenticators_credentialID_unique" UNIQUE("credentialID");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");