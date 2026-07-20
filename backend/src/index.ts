import "@/config/env";
import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import http from "http";
import { CORS_ORIGINS } from "@/config/cors";
import spotifyRoutes from "@/api/routes/spotifyRoutes";
import albumRoutes from "@/api/routes/albumRoutes";
import trackRoutes from "@/api/routes/trackRoutes";
import artistRoutes from "@/api/routes/artistRoutes";
import authRoutes from "@/api/routes/authRoutes";
import bookmarkedAlbumRoutes from "@/api/routes/bookmarkedAlbumRoutes";
import statsRoutes from "@/api/routes/statsRoutes";
import settingsRoutes from "@/api/routes/settingsRoutes";
import healthRoutes from "@/api/routes/healthRoutes";
import { initSocket } from "@/socket";
import { errorHandler } from "./api/middleware/errorHandler";
import testRoutes from "@/api/routes/testRoutes";

export const app = express();

// Behind nginx in production: trust the first proxy hop so the rate limiter and
// req.ip see the real client address rather than the proxy's.
app.set("trust proxy", 1);

const corsOptions = {
  origin: CORS_ORIGINS,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(helmet());

app.options("/ws/*", (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization,Cookie");
  res.sendStatus(200);
});

app.use("/api/health", healthRoutes);
app.use("/api/spotify", spotifyRoutes);
app.use("/api/albums", albumRoutes);
app.use("/api/tracks", trackRoutes);
app.use("/api/artists", artistRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/bookmarks", bookmarkedAlbumRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/settings", settingsRoutes);

// Dev/test only routes
if (process.env.NODE_ENV !== "production") {
  app.use("/api/test", testRoutes);
}

app.use(errorHandler);

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
initSocket(server);

if (require.main === module) {
  server.listen(4000, () => {
    console.log("Server is running on port 4000");
  });
}
