ALTER TABLE "played_artists" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "played_artists" ADD COLUMN "image_looked_up" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "played_tracks" ADD COLUMN "unavailable" boolean DEFAULT false NOT NULL;