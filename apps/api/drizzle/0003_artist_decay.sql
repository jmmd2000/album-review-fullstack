ALTER TABLE "reviewed_artists" DROP COLUMN "average_score";--> statement-breakpoint
ALTER TABLE "reviewed_artists" DROP COLUMN "bonus_points";--> statement-breakpoint
ALTER TABLE "reviewed_artists" DROP COLUMN "bonus_reason";--> statement-breakpoint
UPDATE "album_artists" SET "affects_score" = true;--> statement-breakpoint
UPDATE "reviewed_albums" SET "affectsArtistScore" = true;
