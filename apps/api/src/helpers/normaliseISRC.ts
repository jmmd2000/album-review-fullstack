/** Writes an ISRC as its 12 letters and digits, uppercase, without the dashes or spaces some releases use. Gives null for anything that isn't a valid ISRC. */
export function normaliseISRC(isrc: string | undefined): string | null {
  if (!isrc) return null;
  const normalised = isrc.replace(/[\s-]/g, "").toUpperCase();
  return /^[A-Z0-9]{12}$/.test(normalised) ? normalised : null;
}
