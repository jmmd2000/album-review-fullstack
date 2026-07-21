CREATE TABLE "album_artists" (
	"album_spotify_id" varchar(255) NOT NULL,
	"artist_spotify_id" varchar(255) NOT NULL,
	"affects_score" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "album_genres" (
	"album_spotify_id" varchar(255) NOT NULL,
	"genre_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookmarked_albums" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"spotify_id" varchar(255) NOT NULL,
	"image_urls" jsonb NOT NULL,
	"artist_name" varchar(255) NOT NULL,
	"artist_spotify_id" varchar(255) NOT NULL,
	"release_year" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookmarked_albums_spotify_id_unique" UNIQUE("spotify_id")
);
--> statement-breakpoint
CREATE TABLE "concerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"artist_spotify_id" varchar NOT NULL,
	"show_name" varchar(255) NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"venue" varchar(255) NOT NULL,
	"city" varchar(25) NOT NULL,
	"image_url" varchar(255) NOT NULL,
	"setlist_link" varchar(255) NOT NULL,
	"support_artists" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "genres" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "genres_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "related_genres" (
	"genre_id" integer NOT NULL,
	"related_genre_id" integer NOT NULL,
	"strength" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviewed_albums" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"artist_spotify_id" varchar NOT NULL,
	"artist_name" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"spotify_id" varchar(255) NOT NULL,
	"release_date" varchar(50) NOT NULL,
	"release_year" integer NOT NULL,
	"image_urls" jsonb NOT NULL,
	"best_song" varchar(255) NOT NULL,
	"worst_song" varchar(255) NOT NULL,
	"runtime" varchar(50) NOT NULL,
	"review_content" text,
	"review_score" real NOT NULL,
	"bonus_details" jsonb DEFAULT '{"qualityBonus":0,"perfectBonus":0,"consistencyBonus":0,"noWeakBonus":0,"terriblePenalty":0,"poorQualityPenalty":0,"noStrongPenalty":0,"totalBonus":0}'::jsonb,
	"final_score" real,
	"affectsArtistScore" boolean DEFAULT false NOT NULL,
	"colors" jsonb NOT NULL,
	"genres" text[] NOT NULL,
	"album_artists" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "reviewed_albums_spotify_id_unique" UNIQUE("spotify_id")
);
--> statement-breakpoint
CREATE TABLE "reviewed_artists" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"spotify_id" varchar(255) NOT NULL,
	"image_urls" jsonb NOT NULL,
	"header_image" varchar(255),
	"average_score" real NOT NULL,
	"leaderboard_position" integer,
	"peak_leaderboard_position" integer,
	"latest_leaderboard_position" integer,
	"bonus_points" real DEFAULT 0 NOT NULL,
	"bonus_reason" text,
	"total_score" real DEFAULT 0 NOT NULL,
	"peak_score" real DEFAULT 0 NOT NULL,
	"latest_score" real DEFAULT 0 NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"unrated" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"image_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviewed_artists_spotify_id_unique" UNIQUE("spotify_id")
);
--> statement-breakpoint
CREATE TABLE "reviewed_tracks" (
	"id" serial PRIMARY KEY NOT NULL,
	"artist_spotify_id" varchar NOT NULL,
	"artist_name" varchar(255) NOT NULL,
	"album_spotify_id" varchar NOT NULL,
	"name" varchar(255) NOT NULL,
	"spotify_id" varchar(255) NOT NULL,
	"features" jsonb NOT NULL,
	"duration_ms" integer NOT NULL,
	"rating" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviewed_tracks_spotify_id_unique" UNIQUE("spotify_id")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "track_artists" (
	"track_spotify_id" varchar(255) NOT NULL,
	"artist_spotify_id" varchar(255) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "album_artists" ADD CONSTRAINT "album_artists_album_spotify_id_reviewed_albums_spotify_id_fk" FOREIGN KEY ("album_spotify_id") REFERENCES "public"."reviewed_albums"("spotify_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "album_artists" ADD CONSTRAINT "album_artists_artist_spotify_id_reviewed_artists_spotify_id_fk" FOREIGN KEY ("artist_spotify_id") REFERENCES "public"."reviewed_artists"("spotify_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "album_genres" ADD CONSTRAINT "album_genres_album_spotify_id_reviewed_albums_spotify_id_fk" FOREIGN KEY ("album_spotify_id") REFERENCES "public"."reviewed_albums"("spotify_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "album_genres" ADD CONSTRAINT "album_genres_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concerts" ADD CONSTRAINT "concerts_artist_spotify_id_reviewed_artists_spotify_id_fk" FOREIGN KEY ("artist_spotify_id") REFERENCES "public"."reviewed_artists"("spotify_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "related_genres" ADD CONSTRAINT "related_genres_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "related_genres" ADD CONSTRAINT "related_genres_related_genre_id_genres_id_fk" FOREIGN KEY ("related_genre_id") REFERENCES "public"."genres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviewed_albums" ADD CONSTRAINT "reviewed_albums_artist_spotify_id_reviewed_artists_spotify_id_fk" FOREIGN KEY ("artist_spotify_id") REFERENCES "public"."reviewed_artists"("spotify_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviewed_tracks" ADD CONSTRAINT "reviewed_tracks_artist_spotify_id_reviewed_artists_spotify_id_fk" FOREIGN KEY ("artist_spotify_id") REFERENCES "public"."reviewed_artists"("spotify_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviewed_tracks" ADD CONSTRAINT "reviewed_tracks_album_spotify_id_reviewed_albums_spotify_id_fk" FOREIGN KEY ("album_spotify_id") REFERENCES "public"."reviewed_albums"("spotify_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_artists" ADD CONSTRAINT "track_artists_track_spotify_id_reviewed_tracks_spotify_id_fk" FOREIGN KEY ("track_spotify_id") REFERENCES "public"."reviewed_tracks"("spotify_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_artists" ADD CONSTRAINT "track_artists_artist_spotify_id_reviewed_artists_spotify_id_fk" FOREIGN KEY ("artist_spotify_id") REFERENCES "public"."reviewed_artists"("spotify_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "album_artists_album_idx" ON "album_artists" USING btree ("album_spotify_id");--> statement-breakpoint
CREATE INDEX "album_artists_artist_idx" ON "album_artists" USING btree ("artist_spotify_id");--> statement-breakpoint
CREATE UNIQUE INDEX "album_artists_album_artist_key" ON "album_artists" USING btree ("album_spotify_id","artist_spotify_id");--> statement-breakpoint
CREATE INDEX "album_genres_album_idx" ON "album_genres" USING btree ("album_spotify_id");--> statement-breakpoint
CREATE INDEX "album_genres_genre_idx" ON "album_genres" USING btree ("genre_id");--> statement-breakpoint
CREATE UNIQUE INDEX "album_genres_album_genre_key" ON "album_genres" USING btree ("album_spotify_id","genre_id");--> statement-breakpoint
CREATE INDEX "artist_spotify_id_concert_idx" ON "concerts" USING btree ("artist_spotify_id");--> statement-breakpoint
CREATE INDEX "genres_slug_idx" ON "genres" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "related_genres_key" ON "related_genres" USING btree ("genre_id","related_genre_id");--> statement-breakpoint
CREATE INDEX "artist_spotify_id_album_idx" ON "reviewed_albums" USING btree ("artist_spotify_id");--> statement-breakpoint
CREATE INDEX "spotify_id_artist_idx" ON "reviewed_artists" USING btree ("spotify_id");--> statement-breakpoint
CREATE INDEX "leaderboard_position_artist_idx" ON "reviewed_artists" USING btree ("leaderboard_position");--> statement-breakpoint
CREATE INDEX "spotify_id_track_idx" ON "reviewed_tracks" USING btree ("spotify_id");--> statement-breakpoint
CREATE INDEX "artist_spotify_id_track_idx" ON "reviewed_tracks" USING btree ("artist_spotify_id");--> statement-breakpoint
CREATE INDEX "album_spotify_id_track_idx" ON "reviewed_tracks" USING btree ("album_spotify_id");--> statement-breakpoint
CREATE INDEX "track_artists_track_idx" ON "track_artists" USING btree ("track_spotify_id");--> statement-breakpoint
CREATE INDEX "track_artists_artist_idx" ON "track_artists" USING btree ("artist_spotify_id");--> statement-breakpoint
CREATE UNIQUE INDEX "track_artists_track_artist_key" ON "track_artists" USING btree ("track_spotify_id","artist_spotify_id");