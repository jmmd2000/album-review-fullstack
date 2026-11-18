import type { ReviewFormValues } from "@/lib/reviewForm";

/**
 * Fills a fresh form with a draft's values. Tracks come from the fresh form, in Spotify's current order:
 * a track the draft rated keeps its rating and pick, a track the draft doesn't have stays unrated,
 * and a draft track that's no longer on the album is dropped.
 */
export function restoreDraft(fresh: ReviewFormValues, draft: ReviewFormValues): ReviewFormValues {
  const draftTracks = new Map(draft.tracks.map(track => [track.spotifyID, track]));
  const tracks = fresh.tracks.map(track => {
    const saved = draftTracks.get(track.spotifyID);
    if (!saved) return track;
    return { ...track, rating: saved.rating ?? 0, pick: saved.pick ?? null };
  });

  return { ...draft, tracks };
}

/** How long ago a draft was saved: "just now", "5 min ago", "2 hours ago" or "3 days ago". */
export function savedAgo(savedAt: Date, now: Date): string {
  const minutes = Math.floor((now.getTime() - savedAt.getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;

  const days = Math.floor(hours / 24);
  return days === 1 ? "1 day ago" : `${days} days ago`;
}
