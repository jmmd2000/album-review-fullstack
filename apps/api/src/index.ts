import "@/config/env";
import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { CORS_ORIGINS } from "@/config/cors";
import { errorHandler } from "./api/middleware/errorHandler";

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

app.use(errorHandler);

if (require.main === module) {
  app.listen(4000, () => {
    console.log("Server is running on port 4000");
  });
}
