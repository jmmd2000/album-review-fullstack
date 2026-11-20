CREATE TABLE "played_albums" (
	"spotify_id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"image_url" text
);
--> statement-breakpoint
CREATE TABLE "played_artists" (
	"spotify_id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "played_track_artists" (
	"track_spotify_id" varchar(255) NOT NULL,
	"artist_spotify_id" varchar(255) NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "played_track_artists_track_spotify_id_artist_spotify_id_pk" PRIMARY KEY("track_spotify_id","artist_spotify_id")
);
--> statement-breakpoint
CREATE TABLE "played_tracks" (
	"spotify_id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"duration_ms" integer NOT NULL,
	"album_spotify_id" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "plays" (
	"id" serial PRIMARY KEY NOT NULL,
	"track_spotify_id" varchar(255) NOT NULL,
	"played_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "played_track_artists" ADD CONSTRAINT "played_track_artists_track_spotify_id_played_tracks_spotify_id_fk" FOREIGN KEY ("track_spotify_id") REFERENCES "public"."played_tracks"("spotify_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "played_track_artists" ADD CONSTRAINT "played_track_artists_artist_spotify_id_played_artists_spotify_id_fk" FOREIGN KEY ("artist_spotify_id") REFERENCES "public"."played_artists"("spotify_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "played_tracks" ADD CONSTRAINT "played_tracks_album_spotify_id_played_albums_spotify_id_fk" FOREIGN KEY ("album_spotify_id") REFERENCES "public"."played_albums"("spotify_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plays" ADD CONSTRAINT "plays_track_spotify_id_played_tracks_spotify_id_fk" FOREIGN KEY ("track_spotify_id") REFERENCES "public"."played_tracks"("spotify_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "played_track_artists_artist_idx" ON "played_track_artists" USING btree ("artist_spotify_id");--> statement-breakpoint
CREATE UNIQUE INDEX "plays_track_played_at_key" ON "plays" USING btree ("track_spotify_id","played_at");--> statement-breakpoint
CREATE INDEX "plays_played_at_idx" ON "plays" USING btree ("played_at");