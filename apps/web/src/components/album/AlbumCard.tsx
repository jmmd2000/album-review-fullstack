import { linkOptions } from "@tanstack/react-router";
import { Card } from "@/components/ui/Card";
import { usableCoverColours } from "@/lib/coverColours";

import type { ReactNode } from "react";
import type { DisplayAlbum } from "@shared/types";

interface AlbumCardProps {
  album: DisplayAlbum;
  /** Replaces the artist name under the title */
  subtitle?: string;
  /** A button in the cover's corner, such as the bookmark button */
  action?: ReactNode;
}

/** An album's card. An album without a score links to its review form instead of its page. */
export function AlbumCard({ album, subtitle, action }: AlbumCardProps) {
  const hasScore = album.finalScore !== null;
  const shade = usableCoverColours(album.colors ?? [])[0];

  const link = hasScore ? linkOptions({ to: "/albums/$albumID", params: { albumID: album.spotifyID } }) : linkOptions({ to: "/albums/$albumID/create", params: { albumID: album.spotifyID } });

  return (
    <Card
      link={link}
      title={album.name}
      subtitle={subtitle ?? album.artistName}
      score={album.finalScore}
      images={album.imageURLs}
      shade={shade}
      action={action}
      morph={{ kind: "album", spotifyID: album.spotifyID }}
    />
  );
}
