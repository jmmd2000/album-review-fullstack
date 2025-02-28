import { sql } from "drizzle-orm";
import { index, integer, pgTable, real, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const reviewedAlbums = pgTable(
  "reviewed_albums",
  {
    id: serial("id").primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`now()`)
      .notNull(), // Default to current time
    artistSpotifyID: varchar("artist_spotify_id")
      .notNull()
      .references(() => reviewedArtists.spotifyID), // Foreign key reference to `artists` table
    artistName: varchar("artist_name", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    spotifyID: varchar("spotify_id", { length: 255 }).notNull().unique(), // Unique constraint
    releaseDate: varchar("release_date", { length: 50 }).notNull(),
    releaseYear: integer("release_year").notNull(),
    imageURLs: text("image_urls").notNull(), // JSON string
    scoredTracks: text("scored_tracks").notNull(), // JSON string
    bestSong: varchar("best_song", { length: 255 }).notNull(),
    worstSong: varchar("worst_song", { length: 255 }).notNull(),
    runtime: varchar("runtime", { length: 50 }).notNull(),
    reviewContent: text("review_content"),
    reviewScore: real("review_score").notNull(),
    colors: text("colors").notNull(), // JSON string
  },
  (table) => [index("artist_spotify_id_album_idx").on(table.artistSpotifyID)]
);

export const reviewedTracks = pgTable(
  "reviewed_tracks",
  {
    id: serial("id").primaryKey(),
    artistSpotifyID: varchar("artist_spotify_id")
      .notNull()
      .references(() => reviewedArtists.spotifyID), // Foreign key reference to `artists` table
    artistName: varchar("artist_name", { length: 255 }).notNull(),
    albumSpotifyID: varchar("album_spotify_id")
      .notNull()
      .references(() => reviewedAlbums.spotifyID), // Foreign key reference to `albums
    name: varchar("name", { length: 255 }).notNull(),
    spotifyID: varchar("spotify_id", { length: 255 }).notNull().unique(), // Unique Spotify ID
    features: text("features").notNull(), // JSON object of features
    duration: integer("duration_ms").notNull(),
    rating: integer("rating").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`),
  },
  (table) => [
    index("spotify_id_track_idx").on(table.spotifyID), // Index on Spotify ID for faster lookups
    index("artist_spotify_id_track_idx").on(table.artistSpotifyID), // Index on artist DB ID for faster lookups
    index("album_spotify_id_track_idx").on(table.albumSpotifyID), // Index on album DB ID for faster lookups
  ]
);

export const reviewedArtists = pgTable(
  "reviewed_artists",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    spotifyID: varchar("spotify_id", { length: 255 }).notNull().unique(), // Unique Spotify ID
    imageURLs: text("image_urls").notNull(), // JSON object of image URLs
    averageScore: real("average_score").notNull(),
    leaderboardPosition: integer("leaderboard_position").notNull(),
    bonusPoints: real("bonus_points").notNull().default(0),
    bonusReason: text("bonus_reason"),
    totalScore: real("total_score").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    imageUpdatedAt: timestamp("image_updated_at", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (table) => [
    index("spotify_id_artist_idx").on(table.spotifyID), // Index on Spotify ID for faster lookups
    index("leaderboard_position_artist_idx").on(table.leaderboardPosition), // Index for leaderboard queries
  ]
);

export const bookmarkedAlbums = pgTable("bookmarked_albums", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  spotifyID: varchar("spotify_id", { length: 255 }).notNull().unique(),
  imageURL: text("image_url").notNull(), // JSON object of image URLs
  artistName: varchar("artist_name", { length: 255 }).notNull(),
  artistSpotifyID: varchar("artist_spotify_id", { length: 255 }).notNull(),
  releaseYear: integer("release_year").notNull(),
  releaseDate: varchar("release_date", { length: 50 }).notNull(),
});

export const concerts = pgTable(
  "concerts",
  {
    id: serial("id").primaryKey(),
    artistSpotifyID: varchar("artist_spotify_id")
      .notNull()
      .references(() => reviewedArtists.spotifyID),
    showName: varchar("show_name", { length: 255 }).notNull(),
    date: timestamp("date", { withTimezone: true }).notNull(),
    venue: varchar("venue", { length: 255 }).notNull(),
    city: varchar("city", { length: 25 }).notNull(),
    imageUrl: varchar("image_url", { length: 255 }).notNull(),
    setlistLink: varchar("setlist_link", { length: 255 }).notNull(),
    supportArtists: text("support_artists").notNull(), // JSON string of support artists
  },
  (table) => [index("artist_spotify_id_concert_idx").on(table.artistSpotifyID)]
);
