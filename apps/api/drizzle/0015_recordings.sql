ALTER TABLE "played_albums" ADD COLUMN "large_image_url" text;--> statement-breakpoint
ALTER TABLE "played_albums" ADD COLUMN "album_type" varchar(20);--> statement-breakpoint
ALTER TABLE "played_albums" ADD COLUMN "artist_spotify_id" varchar(255);--> statement-breakpoint
ALTER TABLE "played_albums" ADD COLUMN "main_spotify_id" varchar(255);--> statement-breakpoint
ALTER TABLE "played_albums" ADD COLUMN "reviewed_spotify_id" varchar(255);--> statement-breakpoint
ALTER TABLE "played_artists" ADD COLUMN "large_image_url" text;--> statement-breakpoint
ALTER TABLE "played_tracks" ADD COLUMN "looked_up" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "played_tracks" ADD COLUMN "isrc" varchar(12);--> statement-breakpoint
ALTER TABLE "played_tracks" ADD COLUMN "main_spotify_id" varchar(255);--> statement-breakpoint
ALTER TABLE "played_tracks" ADD COLUMN "reviewed_spotify_id" varchar(255);--> statement-breakpoint
ALTER TABLE "reviewed_tracks" ADD COLUMN "isrc" varchar(12);--> statement-breakpoint
ALTER TABLE "reviewed_tracks" ADD COLUMN "isrc_looked_up" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "played_albums_main_idx" ON "played_albums" USING btree ("main_spotify_id");--> statement-breakpoint
CREATE INDEX "played_tracks_isrc_idx" ON "played_tracks" USING btree ("isrc");--> statement-breakpoint
CREATE INDEX "played_tracks_main_idx" ON "played_tracks" USING btree ("main_spotify_id");--> statement-breakpoint
CREATE INDEX "reviewed_tracks_isrc_idx" ON "reviewed_tracks" USING btree ("isrc");--> statement-breakpoint
UPDATE "played_artists" SET "image_looked_up" = false;
