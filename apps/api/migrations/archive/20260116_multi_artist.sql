-- Multi-artist support: album artists + track artists
ALTER TABLE reviewed_albums
  ADD COLUMN IF NOT EXISTS album_artists JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS album_artists (
  album_spotify_id VARCHAR(255) NOT NULL REFERENCES reviewed_albums(spotify_id) ON DELETE CASCADE,
  artist_spotify_id VARCHAR(255) NOT NULL REFERENCES reviewed_artists(spotify_id) ON DELETE CASCADE,
  affects_score BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (album_spotify_id, artist_spotify_id)
);

ALTER TABLE album_artists
  ADD COLUMN IF NOT EXISTS affects_score BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS album_artists_album_idx ON album_artists (album_spotify_id);
CREATE INDEX IF NOT EXISTS album_artists_artist_idx ON album_artists (artist_spotify_id);

CREATE TABLE IF NOT EXISTS track_artists (
  track_spotify_id VARCHAR(255) NOT NULL REFERENCES reviewed_tracks(spotify_id) ON DELETE CASCADE,
  artist_spotify_id VARCHAR(255) NOT NULL REFERENCES reviewed_artists(spotify_id) ON DELETE CASCADE,
  UNIQUE (track_spotify_id, artist_spotify_id)
);

CREATE INDEX IF NOT EXISTS track_artists_track_idx ON track_artists (track_spotify_id);
CREATE INDEX IF NOT EXISTS track_artists_artist_idx ON track_artists (artist_spotify_id);

-- Backfill album_artists join table from existing primary artist data
INSERT INTO album_artists (album_spotify_id, artist_spotify_id, affects_score)
SELECT spotify_id, artist_spotify_id, "affectsArtistScore"
FROM reviewed_albums
ON CONFLICT DO NOTHING;

-- Backfill album_artists JSON snapshot with existing artist data
UPDATE reviewed_albums ra
SET album_artists = jsonb_build_array(
  jsonb_build_object(
    'spotifyID', ra.artist_spotify_id,
    'name', ra.artist_name,
    'imageURLs', COALESCE(art.image_urls, '[]'::jsonb)
  )
)
FROM reviewed_artists art
WHERE art.spotify_id = ra.artist_spotify_id;

-- Backfill track_artists join table from existing primary artist data
INSERT INTO track_artists (track_spotify_id, artist_spotify_id)
SELECT spotify_id, artist_spotify_id
FROM reviewed_tracks
ON CONFLICT DO NOTHING;
