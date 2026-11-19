CREATE TABLE "artist_listener_links" (
	"artist_spotify_id" varchar(255) NOT NULL,
	"position" integer NOT NULL,
	"linked_deezer_id" integer NOT NULL,
	"linked_name" varchar(255) NOT NULL,
	"fetched_at" timestamp with time zone NOT NULL,
	CONSTRAINT "artist_listener_links_artist_spotify_id_position_pk" PRIMARY KEY("artist_spotify_id","position")
);
--> statement-breakpoint
ALTER TABLE "reviewed_artists" ADD COLUMN "deezer_id" integer;--> statement-breakpoint
ALTER TABLE "artist_listener_links" ADD CONSTRAINT "artist_listener_links_artist_spotify_id_reviewed_artists_spotify_id_fk" FOREIGN KEY ("artist_spotify_id") REFERENCES "public"."reviewed_artists"("spotify_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "artist_listener_links_linked_deezer_id_idx" ON "artist_listener_links" USING btree ("linked_deezer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reviewed_artists_deezer_id_key" ON "reviewed_artists" USING btree ("deezer_id");