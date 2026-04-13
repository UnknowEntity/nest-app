ALTER TABLE "users" ADD COLUMN "lockout_until" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "sign_in_attempts" integer DEFAULT 0;