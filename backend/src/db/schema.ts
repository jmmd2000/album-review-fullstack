import { sql } from "drizzle-orm";
import { index, integer, pgTable, real, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const reviewedAlbums = pgTable(
  "reviewed_albums",
  {
    id: serial("id").primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`), // Default to current time
    artistDBID: integer("artist_db_id")
      .notNull()
      .references(() => reviewedArtists.id), // Foreign key reference to `artists` table
    name: varchar("name", { length: 255 }).notNull(),
    spotifyID: varchar("spotify_id", { length: 255 }).notNull().unique(), // Unique constraint
    releaseDate: varchar("release_date", { length: 50 }).notNull(),
    releaseYear: integer("release_year").notNull(),
    imageURLs: text("image_urls").notNull(), // JSON string
    scoredTracks: text("scored_tracks").notNull(), // JSON string
    bestSong: varchar("best_song", { length: 255 }).notNull(),
    worstSong: varchar("worst_song", { length: 255 }).notNull(),
    runtime: varchar("runtime", { length: 50 }),
    reviewContent: text("review_content"),
    reviewScore: real("review_score").notNull(),
    reviewDate: varchar("review_date", { length: 50 }),
  },
  (table) => [index("artist_db_id_idx").on(table.artistDBID)]
);

export const reviewedArtists = pgTable(
  "reviewed_artists",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    spotifyID: varchar("spotify_id", { length: 255 }).notNull().unique(), // Unique Spotify ID
    imageURLs: text("image_urls").notNull(), // JSON object of image URLs
    averageScore: real("average_score").notNull(),
    leaderboardPosition: integer("leaderboard_position"),
    bonusPoints: real("bonus_points").notNull().default(0),
    bonusReason: text("bonus_reason"),
    totalScore: real("total_score").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
    imageUpdatedAt: timestamp("image_updated_at", { withTimezone: true }).default(sql`now()`),
  },
  (table) => [
    index("spotify_id_idx").on(table.spotifyID), // Index on Spotify ID for faster lookups
    index("leaderboard_position_idx").on(table.leaderboardPosition), // Index for leaderboard queries
  ]
);

export const bookmarkedAlbums = pgTable("bookmarked_albums", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  spotifyID: varchar("spotify_id", { length: 255 }).notNull().unique(),
  imageURL: text("image_url").notNull(),
  artistName: varchar("artist_name", { length: 255 }).notNull(),
  artistSpotifyID: varchar("artist_spotify_id", { length: 255 }).notNull(),
  releaseYear: integer("release_year").notNull(),
  releaseDate: varchar("release_date", { length: 50 }).notNull(),
});

export const concerts = pgTable(
  "concerts",
  {
    id: serial("id").primaryKey(),
    artistDBID: integer("artist_db_id")
      .notNull()
      .references(() => reviewedArtists.id),
    showName: varchar("show_name", { length: 255 }).notNull(),
    date: timestamp("date", { withTimezone: true }).notNull(),
    venue: varchar("venue", { length: 255 }).notNull(),
    city: varchar("city", { length: 25 }).notNull(),
    imageUrl: varchar("image_url", { length: 255 }).notNull(),
    setlistLink: varchar("setlist_link", { length: 255 }).notNull(),
    supportArtists: text("support_artists").notNull(), // JSON string of support artists
  },
  (table) => [index("artist_db_id_concert_idx").on(table.artistDBID)]
);
