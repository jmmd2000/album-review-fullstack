import type { CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { scoreTier } from "@shared/helpers/ratingTiers";
import type { Genre, Jsonified, ReviewedAlbum, ReviewedArtist } from "@shared/types";
import { heroBackground, readableOn } from "@/lib/heroColours";
import { tierColourVar } from "@/lib/tierColours";
import styles from "./AlbumHero.module.css";
import { ArrowLeftIcon } from "@phosphor-icons/react";

interface AlbumHeroProps {
  album: Jsonified<ReviewedAlbum>;
  artists: Jsonified<ReviewedArtist>[];
  genres: Jsonified<Genre>[];
  canEdit: boolean;
}

export function AlbumHero({ album, artists, genres, canEdit }: AlbumHeroProps) {
  const cover = album.imageURLs[0];
  const colours = album.colors ?? [];
  const dominant = colours[0]?.hex;
  const rated = album.finalScore > 0;
  const tier = scoreTier(album.finalScore);
  const ink = dominant ? readableOn(dominant) : "#f7f7f7";

  const primary = artists[0];
  const primaryPhoto = primary?.imageURLs[1] ?? primary?.imageURLs[0];

  const bannerStyle = {
    background: heroBackground(colours, ink),
    "--on-hero": ink,
  } as CSSProperties;

  return (
    <header className={styles.banner} style={bannerStyle} data-ink={ink === "#141414"}>
      <div className={styles.top}>
        <Link to="/albums" className={styles.back}>
          <ArrowLeftIcon weight="bold" size={8} /> Albums
        </Link>
        {canEdit && (
          <Link to="/albums/$albumID/edit" params={{ albumID: album.spotifyID }} className={styles.edit}>
            Edit
          </Link>
        )}
      </div>

      <div className={styles.content}>
        {cover && <img className={styles.cover} src={cover.url} alt={`${album.name} cover`} width={cover.width} height={cover.height} />}

        <div className={styles.identity}>
          <h1 className={styles.title}>{album.name}</h1>

          <div className={styles.byline}>
            {primaryPhoto && <img className={styles.artist_photo} src={primaryPhoto.url} alt={primary!.name} width={primaryPhoto.width} height={primaryPhoto.height} />}
            <p className={styles.artists}>
              <span className={styles.by}>by </span>
              {artists.length > 0
                ? artists.map((artist, index) => (
                    <span key={artist.spotifyID}>
                      {index > 0 && ", "}
                      <Link to="/artists/$artistID" params={{ artistID: artist.spotifyID }} className={styles.artist_link}>
                        {artist.name}
                      </Link>
                    </span>
                  ))
                : album.artistName}
            </p>
          </div>

          {genres.length > 0 && (
            <div className={styles.genres}>
              {genres.map(genre => (
                <Link key={genre.slug} to="/albums" search={{ genres: [genre.slug] }} className={styles.genre}>
                  {genre.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className={styles.score_block}>
          <div className={styles.score} data-unrated={!rated} style={rated ? { backgroundColor: tierColourVar(tier) } : undefined}>
            <div className={styles.score_value}>{rated ? album.finalScore : "-"}</div>
            {rated && <div className={styles.score_tier}>{tier}</div>}
          </div>
        </div>
      </div>
    </header>
  );
}
