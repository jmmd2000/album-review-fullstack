import { randomBytes } from "crypto";
import path from "path";
import { createInterface } from "readline/promises";
import dotenv from "dotenv";
import { z } from "zod";

// A refresh token only works with the Spotify app that issued it, so this reads production's keys and not the local .env
const ENV_FILE = path.resolve(__dirname, "../../../../.env.prod");
// Spotify accepts plain http only for a loopback address, and this one must be listed in the app's dashboard
const REDIRECT_URI = "http://127.0.0.1:8888/callback";
const SCOPE = "user-read-recently-played";

const tokenReplySchema = z.object({
  refresh_token: z.string(),
  scope: z.string(),
});

function readKeys(): { clientID: string; clientSecret: string } {
  const loaded = dotenv.config({ path: ENV_FILE, processEnv: {}, quiet: true });
  if (loaded.error) throw new Error(`Can't read ${ENV_FILE}. It needs production's SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET.`);

  const clientID = loaded.parsed?.SPOTIFY_CLIENT_ID;
  const clientSecret = loaded.parsed?.SPOTIFY_CLIENT_SECRET;
  if (!clientID || !clientSecret) throw new Error(`${ENV_FILE} has no SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET.`);
  return { clientID, clientSecret };
}

/** Reads the code from the address Spotify sent the browser to, and checks the state matches the one this run sent. */
function readCode(pastedURL: string, expectedState: string): string {
  if (!URL.canParse(pastedURL)) throw new Error("That isn't an address. Copy the whole address from the browser's address bar.");

  const parameters = new URL(pastedURL).searchParams;
  const refusal = parameters.get("error");
  if (refusal) throw new Error(`Spotify refused the sign-in: ${refusal}`);
  if (parameters.get("state") !== expectedState) throw new Error("The address is from a different sign-in. Run the script again.");

  const code = parameters.get("code");
  if (!code) throw new Error("The address has no code in it.");
  return code;
}

async function exchangeCode(code: string, clientID: string, clientSecret: string): Promise<string> {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + btoa(clientID + ":" + clientSecret),
    },
    body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: REDIRECT_URI }),
  });
  if (!response.ok) throw new Error(`Spotify answered ${response.status} to the code exchange: ${await response.text()}`);

  const reply = tokenReplySchema.parse(await response.json());
  if (!reply.scope.split(" ").includes(SCOPE)) throw new Error(`Spotify didn't give permission for ${SCOPE}.`);
  return reply.refresh_token;
}

/**
 * Signs in to the admin's Spotify account and prints a refresh token for SPOTIFY_REFRESH_TOKEN.
 * The browser ends on an address that doesn't load. The script asks for that address and reads the code from it.
 */
async function run() {
  const { clientID, clientSecret } = readKeys();
  const state = randomBytes(16).toString("hex");
  const signInURL = new URL("https://accounts.spotify.com/authorize");
  signInURL.search = new URLSearchParams({ response_type: "code", client_id: clientID, scope: SCOPE, redirect_uri: REDIRECT_URI, state, show_dialog: "true" }).toString();

  console.log(`Open this address and sign in to Spotify:\n\n${signInURL}\n`);
  const terminal = createInterface({ input: process.stdin, output: process.stdout });
  const pastedURL = await terminal.question("The browser then goes to a page that won't load. Paste its address here: ");
  terminal.close();

  const refreshToken = await exchangeCode(readCode(pastedURL.trim(), state), clientID, clientSecret);
  console.log(`\nPut this in the production env:\n\nSPOTIFY_REFRESH_TOKEN=${refreshToken}`);
}

run().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
