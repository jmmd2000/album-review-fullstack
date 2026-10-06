CREATE TYPE "public"."track_pick" AS ENUM('best', 'worst');--> statement-breakpoint
ALTER TABLE "reviewed_tracks" ADD COLUMN "pick" "track_pick";--> statement-breakpoint
ALTER TABLE "reviewed_albums" DROP COLUMN "best_song";--> statement-breakpoint
ALTER TABLE "reviewed_albums" DROP COLUMN "worst_song";