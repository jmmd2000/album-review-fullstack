import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppError } from "../middleware/errorHandler";

const JWT_SECRET = process.env.JWT_SECRET!;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH!;
const TOKEN_EXPIRY = "7d";

export class AuthService {
  static async authenticate(password: string): Promise<string> {
    const valid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    if (!valid) throw new AppError("Invalid password", 401);
    return jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  }

  static verifyToken(token: string | undefined): boolean {
    if (!token) return false;
    try {
      jwt.verify(token, JWT_SECRET);
      return true;
    } catch {
      return false;
    }
  }
}
