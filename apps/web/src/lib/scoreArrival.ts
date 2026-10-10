/** The albums whose score has already counted up in this visit */
const arrivedAlbumIDs = new Set<string>();

/** Tells whether an album's score has yet to count up in this visit. It has no side effects, so it is safe to call while rendering. */
export function canScoreArrive(albumID: string): boolean {
  return !arrivedAlbumIDs.has(albumID);
}

/** Records that an album's score has shown, so it shows in place the next time its page opens. */
export function markScoreArrived(albumID: string): void {
  arrivedAlbumIDs.add(albumID);
}
