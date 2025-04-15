import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";
import spotifyRoutes from "@/api/routes/spotifyRoutes";
import albumRoutes from "@/api/routes/albumRoutes";
import trackRoutes from "@/api/routes/trackRoutes";
import artistRoutes from "@/api/routes/artistRoutes";
import { drizzle } from "drizzle-orm/node-postgres";

export const db = drizzle(process.env.DATABASE_URL!);

export const app = express();

const corsOptions = {
  origin: ["http://localhost:8080", "http://localhost:5173"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

app.use("/api/spotify", spotifyRoutes);
app.use("/api/albums", albumRoutes);
app.use("/api/tracks", trackRoutes);
app.use("/api/artists", artistRoutes);

app.listen(4000, "0.0.0.0", () => {
  console.log("Server is running on port 4000");
});
