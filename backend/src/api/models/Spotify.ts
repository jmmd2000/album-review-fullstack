import dotenv from "dotenv";

dotenv.config();

export class Spotify {
  private static accessToken: string | null = null;
  private static expiresAt: number | null = null;

  static async getAccessToken() {
    // If token exists and is still valid, use it
    if (this.accessToken && this.expiresAt && Date.now() < this.expiresAt) {
      return this.accessToken;
    }

    const tokenEndpoint = "https://accounts.spotify.com/api/token";
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + btoa(process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET),
      },
      body: "grant_type=client_credentials",
    };

    console.log(process.env.SPOTIFY_CLIENT_ID, process.env.SPOTIFY_CLIENT_ID);

    const response = await fetch(tokenEndpoint, requestOptions);

    const data = await response.json();

    // Store token and expiration time (3600 seconds)
    this.accessToken = data.access_token;
    this.expiresAt = Date.now() + data.expires_in * 1000; // Convert to milliseconds

    console.log({ accessToken: this.accessToken, expiresAt: this.expiresAt });
    return this.accessToken;
  }
}
