import path from "path";
import dotenv from "dotenv";

// Every app reads the one .env at the repo root. Production gets its env from compose, so there's no file to find there.
dotenv.config({ path: path.resolve(__dirname, "../../../../.env"), quiet: true });
