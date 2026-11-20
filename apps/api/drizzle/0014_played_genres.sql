CREATE TABLE "played_artist_genres" (
	"artist_spotify_id" varchar(255) NOT NULL,
	"genre_id" integer NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "played_artist_genres_artist_spotify_id_genre_id_pk" PRIMARY KEY("artist_spotify_id","genre_id")
);
--> statement-breakpoint
ALTER TABLE "played_artists" ADD COLUMN "genres_looked_up" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "played_artist_genres" ADD CONSTRAINT "played_artist_genres_artist_spotify_id_played_artists_spotify_id_fk" FOREIGN KEY ("artist_spotify_id") REFERENCES "public"."played_artists"("spotify_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "played_artist_genres" ADD CONSTRAINT "played_artist_genres_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "played_artist_genres_genre_idx" ON "played_artist_genres" USING btree ("genre_id");