/**
 * Makes an artist name comparable across services: lower case, no accents, "&" as "and", straight apostrophes and single spaces.
 * For example, "Beyoncé & Jay‐Z" and "beyonce and jay-z" give the same text.
 */
export function normaliseArtistName(name: string): string {
  return name.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[‘’]/g, "'").replace(/[‐‑]/g, "-").replace(/&/g, " and ").replace(/\s+/g, " ").trim();
}
