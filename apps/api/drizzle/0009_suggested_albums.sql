CREATE TYPE "public"."suggestion_row" AS ENUM('new');--> statement-breakpoint
CREATE TABLE "suggested_albums" (
	"row" "suggestion_row" NOT NULL,
	"rank" integer NOT NULL,
	"spotify_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"artist_name" varchar(255) NOT NULL,
	"artist_spotify_id" varchar(255) NOT NULL,
	"image_urls" jsonb NOT NULL,
	"release_date" varchar(10) NOT NULL,
	"release_year" integer NOT NULL,
	CONSTRAINT "suggested_albums_row_spotify_id_pk" PRIMARY KEY("row","spotify_id")
);
