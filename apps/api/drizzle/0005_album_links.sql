-- Turns red text in reviews into album links when the text is the name of exactly one reviewed album.
-- The match ignores case and outer spaces. Outer spaces go outside the link, so they aren't underlined.
-- Red text that matches no album, or a name two albums share, stays as it is.
DO $$
DECLARE
  mention RECORD;
BEGIN
  FOR mention IN
    WITH album_names AS (
      SELECT lower(trim(name)) AS name_key, min(spotify_id) AS spotify_id
      FROM reviewed_albums
      GROUP BY lower(trim(name))
      HAVING count(*) = 1
    ),
    red_text AS (
      SELECT DISTINCT reviewed_albums.spotify_id AS review_id, match[1] AS mention_text
      FROM reviewed_albums, regexp_matches(reviewed_albums.review_content, '\{color:#fb2c36\}([^{]+)\{color\}', 'g') AS match
    )
    SELECT red_text.review_id, red_text.mention_text, album_names.spotify_id AS album_id
    FROM red_text
    JOIN album_names ON album_names.name_key = lower(trim(red_text.mention_text))
  LOOP
    UPDATE reviewed_albums
    SET review_content = replace(
      review_content,
      '{color:#fb2c36}' || mention.mention_text || '{color}',
      substring(mention.mention_text from '^\s*') || '{album:' || mention.album_id || '}' || trim(mention.mention_text) || '{album}' || substring(mention.mention_text from '\s*$')
    )
    WHERE spotify_id = mention.review_id;
  END LOOP;
END $$;
