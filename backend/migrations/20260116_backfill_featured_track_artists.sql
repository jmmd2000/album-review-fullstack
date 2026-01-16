-- Backfill track_artists for featured artists that already exist
INSERT INTO track_artists (track_spotify_id, artist_spotify_id)
SELECT t.spotify_id, feat->>'id'
FROM reviewed_tracks t
CROSS JOIN LATERAL jsonb_array_elements(t.features) feat
JOIN reviewed_artists a ON a.spotify_id = feat->>'id'
ON CONFLICT DO NOTHING;
