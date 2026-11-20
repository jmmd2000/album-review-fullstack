import { linkOptions } from "@tanstack/react-router";
import { Card } from "@/components/ui/Card";

import type { DisplayArtist } from "@shared/types";

interface ArtistCardProps {
  artist: DisplayArtist;
  /** The artist's place in the current ranking, or null when the sort isn't a ranking */
  position: number | null;
  score: number;
  /** Replaces the album count under the name */
  subtitle?: string;
}

export function ArtistCard({ artist, position, score, subtitle }: ArtistCardProps) {
  return (
    <Card
      link={linkOptions({ to: "/artists/$artistID", params: { artistID: artist.spotifyID } })}
      title={artist.name}
      subtitle={subtitle ?? `${artist.albumCount} ${artist.albumCount === 1 ? "album" : "albums"}`}
      score={artist.unrated ? null : score}
      images={artist.imageURLs}
      rank={position ?? undefined}
      morph={{ kind: "artist", spotifyID: artist.spotifyID }}
    />
  );
}
