import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppError } from "../middleware/errorHandler";
import { env } from "@/index";

const TOKEN_EXPIRY = "7d";

export class AuthService {
  static async authenticate(password: string): Promise<string> {
    const valid = await bcrypt.compare(password, env.ADMIN_PASSWORD_HASH);
    if (!valid) throw new AppError("Invalid password", 401);
    return jwt.sign({ role: "admin" }, env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  }

  static verifyToken(token: string | undefined): boolean {
    if (!token) return false;
    try {
      jwt.verify(token, env.JWT_SECRET);
      return true;
    } catch {
      return false;
    }
  }
}
