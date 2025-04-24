import { getAdminCookie } from "@/helpers/getAdminCookie";
import { ReviewedAlbum, ReviewedArtist } from "@shared/types";
import "dotenv/config";

const wipe = async () => {
  const cookie = await getAdminCookie();
  console.log("Logged in, got cookie...");
  console.log(`\x1b[34mWipe:\x1b[0m Fetching albums to delete...`);
  const albumResponse = await fetch(`http://localhost:4000/api/albums/all?includeCounts=false`);
  const data = await albumResponse.json();
  const albums: ReviewedAlbum[] = data.albums;
  if (albums.length === 0) {
    console.log(`\x1b[34mWipe:\x1b[0m \x1b[33mNo albums to delete\x1b[0m`);
  } else {
    for (let album of albums) {
      console.log(`\x1b[34mWipe:\x1b[0m Deleting album \x1b[33m${album.name}\x1b[0m`);
      try {
        await fetch(`http://localhost:4000/api/albums/${album.spotifyID}`, {
          method: "DELETE",
          headers: { Cookie: cookie },
        });
        console.log(`\x1b[34mWipe:\x1b[0m \x1b[32mDeleted album ${album.name}\x1b[0m`);
      } catch (error) {
        console.log(`\x1b[34mWipe:\x1b[0m \x1b[31mFailed to delete album ${album.name}\x1b[0m`);
      }
    }
  }

  console.log(`\x1b[34mWipe:\x1b[0m Fetching artists to delete...`);
  const artistResponse = await fetch(`http://localhost:4000/api/artists`);
  const artistsData = await artistResponse.json();
  const artists: ReviewedArtist[] = artistsData.artists;

  if (artists.length === 0) {
    console.log(`\x1b[34mWipe:\x1b[0m \x1b[33mNo artists to delete\x1b[0m`);
  } else {
    for (let artist of artists) {
      console.log(`\x1b[34mWipe:\x1b[0m Deleting artist \x1b[33m${artist.name}\x1b[0m`);
      try {
        await fetch(`http://localhost:4000/api/artists/${artist.spotifyID}`, {
          method: "DELETE",
          headers: { Cookie: cookie },
        });
        console.log(`\x1b[34mWipe:\x1b[0m \x1b[32mDeleted artist ${artist.name}\x1b[0m`);
      } catch (error) {
        console.log(`\x1b[34mWipe:\x1b[0m \x1b[31mFailed to delete artist ${artist.name}\x1b[0m`);
      }
    }
  }

  console.log(`\x1b[34mWipe:\x1b[0m \x1b[32mWiping complete.\x1b[0m`);
};

wipe();
