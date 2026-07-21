# Archived migrations

These predate the drizzle migration history and are kept for reference only.

Their **structural** changes (the `album_artists` / `track_artists` tables and the
`reviewed_albums.album_artists` column) are captured in `schema.ts` and therefore
in the drizzle baseline at `../../drizzle/0000_*.sql`.

The `INSERT`/`UPDATE` statements were one-time **data** backfills, already applied
to production. They are not part of the schema and are not replayed by drizzle.

Do not run these. The source of truth is `backend/drizzle/`.
