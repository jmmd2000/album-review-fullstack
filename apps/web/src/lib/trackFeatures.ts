interface Feature {
  name: string;
}

/** "Song (feat. X)", "Song [feat. X]" or "Song (with X)" */
const BRACKETED_CREDIT = /\s*[([](?:feat\.?|ft\.|featuring|with)\s+([^)\]]+)[)\]]$/i;
/** "Song feat. X" or "Song - feat. X" */
const TRAILING_CREDIT = /\s+(?:-\s+)?(?:feat\.?|ft\.|featuring)\s+(.+)$/i;

/** Returns the features that the track's title doesn't already name. */
export function extraFeatures(trackName: string, features: Feature[]): Feature[] {
  const title = trackName.toLowerCase();
  return features.filter(feature => !title.includes(feature.name.toLowerCase()));
}

/**
 * Splits a track name into its title and its featured artists
 * It removes a feature credit from the end of the name, then lists the features the title doesn't name.
 * When the track has no feature list, it uses the credit text from the name.
 *
 * @param leaveOut An artist to leave out of the list, such as the artist whose page shows the track
 */
export function splitFeatures(trackName: string, features: Feature[], leaveOut?: string): { title: string; featuring: string[] } {
  const credit = trackName.match(BRACKETED_CREDIT) ?? trackName.match(TRAILING_CREDIT);
  const title = credit ? trackName.slice(0, credit.index) : trackName;

  if (credit && features.length === 0) return { title, featuring: [credit[1]] };

  const featuring = extraFeatures(title, features)
    .map(feature => feature.name)
    .filter(name => name !== leaveOut);
  return { title, featuring };
}
