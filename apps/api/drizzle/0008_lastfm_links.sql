DELETE FROM "artist_listener_links";--> statement-breakpoint
DROP INDEX "artist_listener_links_linked_deezer_id_idx";--> statement-breakpoint
DROP INDEX "reviewed_artists_deezer_id_key";--> statement-breakpoint
ALTER TABLE "artist_listener_links" ADD COLUMN "match" real NOT NULL;--> statement-breakpoint
ALTER TABLE "artist_listener_links" DROP COLUMN "linked_deezer_id";--> statement-breakpoint
ALTER TABLE "reviewed_artists" DROP COLUMN "deezer_id";