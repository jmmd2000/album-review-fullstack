import dotenv from "dotenv";
dotenv.config();
import { drizzle } from "drizzle-orm/node-postgres";
import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import spotifyRoutes from "@/api/routes/spotifyRoutes";
import albumRoutes from "@/api/routes/albumRoutes";
import trackRoutes from "@/api/routes/trackRoutes";
import artistRoutes from "@/api/routes/artistRoutes";
import authRoutes from "@/api/routes/authRoutes";
import bookmarkedAlbumRoutes from "@/api/routes/bookmarkedAlbumRoutes";
import statsRoutes from "@/api/routes/statsRoutes";

export const db = drizzle(process.env.DATABASE_URL!);

export const app = express();

const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:8080", "https://jamesreviewsmusic.com", "http://jamesreviewsmusic.com", "https://www.jamesreviewsmusic.com", "http://www.jamesreviewsmusic.com"],
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
app.use("/api/stats", statsRoutes);

if (require.main === module) {
  app.listen(4000, () => {
    console.log("Server is running on port 4000");
  });
}
