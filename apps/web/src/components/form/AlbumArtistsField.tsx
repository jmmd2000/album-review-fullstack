import { Checkbox } from "@/components/ui/Checkbox";
import styles from "./AlbumArtistsField.module.css";

import type { AlbumArtist } from "@shared/types";

interface AlbumArtistsFieldProps {
  artists: AlbumArtist[];
  /** The artists the album is credited to */
  creditedIDs: string[];
  /** The credited artists whose score the album counts towards */
  scoreIDs: string[];
  onChange: (creditedIDs: string[], scoreIDs: string[]) => void;
}

/**
 * For an album by several artists: which of them it's credited to, and whose score it counts towards.
 * At least one artist stays credited. Crediting an artist counts the album towards their score too.
 */
export function AlbumArtistsField({ artists, creditedIDs, scoreIDs, onChange }: AlbumArtistsFieldProps) {
  const setCredited = (artistID: string, credited: boolean) => {
    if (credited) {
      onChange([...creditedIDs, artistID], [...scoreIDs, artistID]);
      return;
    }
    if (creditedIDs.length <= 1) return;
    onChange(
      creditedIDs.filter(id => id !== artistID),
      scoreIDs.filter(id => id !== artistID)
    );
  };

  const setCounts = (artistID: string, counts: boolean) => onChange(creditedIDs, counts ? [...scoreIDs, artistID] : scoreIDs.filter(id => id !== artistID));

  return (
    <ul className={styles.artists}>
      {artists.map(artist => {
        const photo = artist.imageURLs.at(-1);
        const credited = creditedIDs.includes(artist.spotifyID);

        return (
          <li key={artist.spotifyID} className={styles.artist}>
            {photo ? <img src={photo.url} alt="" width={40} height={40} /> : <span className={styles.photo} />}
            <span className={styles.name}>{artist.name}</span>
            <div className={styles.options}>
              <Checkbox label="Credited" checked={credited} onChange={checked => setCredited(artist.spotifyID, checked)} />
              {credited && <Checkbox label="Counts towards their score" checked={scoreIDs.includes(artist.spotifyID)} onChange={checked => setCounts(artist.spotifyID, checked)} />}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
