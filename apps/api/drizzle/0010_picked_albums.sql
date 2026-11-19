ALTER TYPE "public"."suggestion_row" ADD VALUE 'picked';--> statement-breakpoint
CREATE TABLE "dismissed_albums" (
	"spotify_id" varchar(255) PRIMARY KEY NOT NULL,
	"dismissed_at" timestamp with time zone DEFAULT now() NOT NULL
);
