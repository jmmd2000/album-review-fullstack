import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import spotifyRoutes from "@/api/routes/spotifyRoutes";
import albumRoutes from "@/api/routes/albumRoutes";
import trackRoutes from "@/api/routes/trackRoutes";
import artistRoutes from "@/api/routes/artistRoutes";
import { drizzle } from "drizzle-orm/node-postgres";
import authRoutes from "@/api/routes/authRoutes";
import bookmarkedAlbumRoutes from "@/api/routes/bookmarkedAlbumRoutes";

export const db = drizzle(process.env.DATABASE_URL!);

export const app = express();

const corsOptions = {
  origin: ["http://localhost:5173", process.env.CLIENT_ORIGIN || "http://localhost:8080"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.use("/api/spotify", spotifyRoutes);
app.use("/api/albums", albumRoutes);
app.use("/api/tracks", trackRoutes);
app.use("/api/artists", artistRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/bookmarks", bookmarkedAlbumRoutes);

app.listen(4000, "0.0.0.0", () => {
  console.log("Server is running on port 4000");
});
