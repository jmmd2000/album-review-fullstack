export const resetTables = async (query: (text: string, params?: any[]) => Promise<any>) => {
  await query("TRUNCATE reviewed_tracks, reviewed_albums, reviewed_artists RESTART IDENTITY CASCADE;");
};
