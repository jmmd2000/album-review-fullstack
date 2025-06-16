export const resetTables = async (query: (text: string, params?: any[]) => Promise<any>) => {
  await query("TRUNCATE reviewed_tracks, reviewed_albums, reviewed_artists, bookmarked_albums, genres, album_genres, related_genres RESTART IDENTITY CASCADE;");
};
