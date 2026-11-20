ALTER TABLE "played_tracks" ALTER COLUMN "duration_ms" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "plays" ADD COLUMN "ms_played" integer;