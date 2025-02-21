import cors from "cors";
import dotenv from "dotenv";
import express from "express";

export const app = express();

dotenv.config();

const corsOptions = {
  origin: ["http://localhost:8080", "http://localhost:5173"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

app.listen(4000, "0.0.0.0", () => {
  console.log("Server is running on port 4000");
});
