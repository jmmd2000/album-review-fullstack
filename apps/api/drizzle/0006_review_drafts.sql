CREATE TABLE "review_drafts" (
	"spotify_id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"artist_name" varchar(255) NOT NULL,
	"artist_spotify_id" varchar(255) NOT NULL,
	"release_year" integer NOT NULL,
	"image_urls" jsonb NOT NULL,
	"form_values" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
