import jwt from "jsonwebtoken";
import { env } from "@/config/env";

export const adminCookie = () => `token=${jwt.sign({ role: "admin" }, env.JWT_SECRET)}`;
