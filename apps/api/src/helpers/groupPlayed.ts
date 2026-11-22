/** A played album with the ISRCs of its played tracks */
export interface AlbumToGroup {
  spotifyID: string;
  name: string;
  /** "album", "single" or "compilation", or null when it isn't looked up yet */
  albumType: string | null;
  artistSpotifyID: string | null;
  plays: number;
  isrcs: string[];
}

/** A reviewed album with the ISRCs of its tracks */
export interface ReviewedAlbumToGroup {
  spotifyID: string;
  name: string;
  artistSpotifyID: string;
  isrcs: string[];
}

export interface TrackToGroup {
  spotifyID: string;
  name: string;
  isrc: string | null;
  albumSpotifyID: string | null;
  plays: number;
}

export interface ReviewedTrackToGroup {
  spotifyID: string;
  name: string;
  isrc: string | null;
  albumSpotifyID: string;
}

/** Where a played album or track belongs: the one its group shows as, and the reviewed one in its group */
export interface Grouping {
  mainSpotifyID: string;
  reviewedSpotifyID: string | null;
}

/** Keeps track of which items are joined, so that joining A to B and B to C puts all three together */
class Groups {
  private parents = new Map<string, string>();

  find(key: string): string {
    let root = key;
    while (this.parents.has(root) && this.parents.get(root) !== root) {
      root = this.parents.get(root) as string;
    }
    this.parents.set(key, root);
    return root;
  }

  join(first: string, second: string): void {
    const firstRoot = this.find(first);
    const secondRoot = this.find(second);
    if (firstRoot !== secondRoot) this.parents.set(secondRoot, firstRoot);
  }

  /** Joins every pair of items that share a value, such as an ISRC. */
  joinBySharedValue(items: { key: string; values: string[] }[]): void {
    const firstWithValue = new Map<string, string>();
    for (const item of items) {
      for (const value of item.values) {
        const first = firstWithValue.get(value);
        if (first) this.join(first, item.key);
        else firstWithValue.set(value, item.key);
      }
    }
  }
}

/**
 * True when two album names are the same album: the same name, or one name followed by an edition,
 * such as "Stoney" and "Stoney (Deluxe)", or "F-1 Trillion" and "F-1 Trillion: Long Bed".
 * "Weezer (Blue Album)" and "Weezer (Green Album)" aren't, since neither is the other's whole name.
 */
export function sameAlbumName(first: string, second: string): boolean {
  const [shorter, longer] = [first.toLowerCase().trim(), second.toLowerCase().trim()].sort((a, b) => a.length - b.length);
  if (shorter === longer) return true;
  return [" (", " [", ": ", " - "].some(separator => longer.startsWith(shorter + separator));
}

const trackName = (name: string) => name.toLowerCase().replace(/\s+/g, " ").trim();

const TYPE_ORDER: Record<string, number> = { album: 0, single: 1 };

/**
 * Puts each played album in a group with its other copies, its deluxe editions, its clean version and its singles.
 * - Albums by the same first artist whose names differ only by an edition are one group. A reviewed album counts as an album.
 *   Sharing a recording isn't enough, since a best-of that Spotify labels as an album shares recordings with the albums it takes them from.
 * - A single joins an album's group only when every recording of it that was played is on that album. So an EP with songs of its own stays apart.
 * - A compilation is never grouped, so a best-of doesn't join the albums it takes songs from.
 * The group shows as its reviewed album if that was played, then an album over a single, then the most played, then the lowest ID.
 */
export function groupAlbums(played: AlbumToGroup[], reviewed: ReviewedAlbumToGroup[]): Map<string, Grouping> {
  const groups = new Groups();
  const reviewedIDs = new Set(reviewed.map(album => album.spotifyID));
  const playedKey = (spotifyID: string) => `played:${spotifyID}`;
  const reviewedKey = (spotifyID: string) => `reviewed:${spotifyID}`;
  const recordings = (artistSpotifyID: string | null, isrcs: string[]) => (artistSpotifyID ? isrcs.map(isrc => `${artistSpotifyID}:${isrc}`) : []);

  const fullAlbums = [
    ...played
      .filter(album => album.albumType === "album")
      .map(album => ({ key: playedKey(album.spotifyID), artistSpotifyID: album.artistSpotifyID, name: album.name, recordings: recordings(album.artistSpotifyID, album.isrcs) })),
    ...reviewed.map(album => ({ key: reviewedKey(album.spotifyID), artistSpotifyID: album.artistSpotifyID, name: album.name, recordings: recordings(album.artistSpotifyID, album.isrcs) })),
  ];
  for (const album of played) {
    if (reviewedIDs.has(album.spotifyID)) groups.join(reviewedKey(album.spotifyID), playedKey(album.spotifyID));
  }
  const albumsByArtist = new Map<string, typeof fullAlbums>();
  for (const album of fullAlbums) {
    if (album.artistSpotifyID) albumsByArtist.set(album.artistSpotifyID, [...(albumsByArtist.get(album.artistSpotifyID) ?? []), album]);
  }
  for (const artistAlbums of albumsByArtist.values()) {
    for (const [index, first] of artistAlbums.entries()) {
      for (const second of artistAlbums.slice(index + 1)) {
        if (sameAlbumName(first.name, second.name)) groups.join(first.key, second.key);
      }
    }
  }

  // Copies of a single join each other first, then the copies join an album together
  const singles = played.filter(album => album.albumType === "single");
  groups.joinBySharedValue(singles.map(album => ({ key: playedKey(album.spotifyID), values: recordings(album.artistSpotifyID, album.isrcs) })));
  const albumGroupOfRecording = new Map<string, string>();
  for (const album of fullAlbums) {
    for (const recording of album.recordings) albumGroupOfRecording.set(recording, groups.find(album.key));
  }
  const singleRecordings = new Map<string, Set<string>>();
  for (const single of singles) {
    const root = groups.find(playedKey(single.spotifyID));
    singleRecordings.set(root, new Set([...(singleRecordings.get(root) ?? []), ...recordings(single.artistSpotifyID, single.isrcs)]));
  }
  for (const [singleRoot, singleRecordingSet] of singleRecordings) {
    const albumRoots = new Set([...singleRecordingSet].map(recording => albumGroupOfRecording.get(recording)));
    const [albumRoot] = albumRoots;
    if (singleRecordingSet.size > 0 && albumRoots.size === 1 && albumRoot) groups.join(albumRoot, singleRoot);
  }

  const members = new Map<string, AlbumToGroup[]>();
  for (const album of played) {
    const root = groups.find(playedKey(album.spotifyID));
    members.set(root, [...(members.get(root) ?? []), album]);
  }
  const reviewedInGroup = new Map<string, string[]>();
  for (const album of reviewed) {
    const root = groups.find(reviewedKey(album.spotifyID));
    reviewedInGroup.set(root, [...(reviewedInGroup.get(root) ?? []), album.spotifyID]);
  }

  const result = new Map<string, Grouping>();
  for (const [root, albums] of members) {
    const [main] = [...albums].sort(
      (first, second) =>
        Number(reviewedIDs.has(second.spotifyID)) - Number(reviewedIDs.has(first.spotifyID)) ||
        (TYPE_ORDER[first.albumType ?? ""] ?? 2) - (TYPE_ORDER[second.albumType ?? ""] ?? 2) ||
        second.plays - first.plays ||
        first.spotifyID.localeCompare(second.spotifyID)
    );
    const reviewedIDsInGroup = reviewedInGroup.get(root) ?? [];
    const reviewedSpotifyID = reviewedIDsInGroup.includes(main.spotifyID) ? main.spotifyID : ([...reviewedIDsInGroup].sort()[0] ?? null);
    for (const album of albums) result.set(album.spotifyID, { mainSpotifyID: main.spotifyID, reviewedSpotifyID });
  }
  return result;
}

/**
 * Puts each played track in a group with its other copies: the tracks with the same ISRC, and the tracks with the same name in the same album group,
 * such as a clean and an explicit version. A track with neither is a group of its own.
 * The group shows as the track that was reviewed, then the track on its album group's main album, then the most played, then the lowest ID.
 * Its reviewed track is the one with a member's ID, then one with a member's ISRC on the group's reviewed album, then the most recent with a member's ISRC,
 * then one with the same name on the group's reviewed album.
 * @param reviewedTracks Oldest review first.
 */
export function groupTracks(tracks: TrackToGroup[], reviewedTracks: ReviewedTrackToGroup[], albumGroups: Map<string, Grouping>): Map<string, Grouping> {
  const groups = new Groups();
  const albumGroupOf = (track: TrackToGroup) => (track.albumSpotifyID ? albumGroups.get(track.albumSpotifyID) : undefined);
  groups.joinBySharedValue(tracks.map(track => ({ key: track.spotifyID, values: track.isrc ? [track.isrc] : [] })));
  groups.joinBySharedValue(
    tracks.map(track => {
      const albumGroup = albumGroupOf(track);
      return { key: track.spotifyID, values: albumGroup ? [`${albumGroup.mainSpotifyID}:${trackName(track.name)}`] : [] };
    })
  );

  const members = new Map<string, TrackToGroup[]>();
  for (const track of tracks) {
    const root = groups.find(track.spotifyID);
    members.set(root, [...(members.get(root) ?? []), track]);
  }

  const reviewedIDs = new Set(reviewedTracks.map(track => track.spotifyID));
  const onMainAlbum = (track: TrackToGroup) => track.albumSpotifyID !== null && albumGroupOf(track)?.mainSpotifyID === track.albumSpotifyID;
  const result = new Map<string, Grouping>();
  for (const group of members.values()) {
    const [main] = [...group].sort(
      (first, second) =>
        Number(reviewedIDs.has(second.spotifyID)) - Number(reviewedIDs.has(first.spotifyID)) ||
        Number(onMainAlbum(second)) - Number(onMainAlbum(first)) ||
        second.plays - first.plays ||
        first.spotifyID.localeCompare(second.spotifyID)
    );

    const memberIDs = new Set(group.map(track => track.spotifyID));
    const memberISRCs = new Set(group.flatMap(track => (track.isrc ? [track.isrc] : [])));
    const memberNames = new Set(group.map(track => trackName(track.name)));
    const groupReviewedAlbum = albumGroupOf(main)?.reviewedSpotifyID ?? null;
    const sameRecording = reviewedTracks.filter(track => track.isrc !== null && memberISRCs.has(track.isrc));
    const reviewed =
      reviewedTracks.find(track => memberIDs.has(track.spotifyID)) ??
      sameRecording.find(track => track.albumSpotifyID === groupReviewedAlbum) ??
      sameRecording[sameRecording.length - 1] ??
      reviewedTracks.find(track => track.albumSpotifyID === groupReviewedAlbum && memberNames.has(trackName(track.name)));

    for (const track of group) result.set(track.spotifyID, { mainSpotifyID: main.spotifyID, reviewedSpotifyID: reviewed?.spotifyID ?? null });
  }
  return result;
}
