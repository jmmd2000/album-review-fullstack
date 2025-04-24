export class AuthService {
  /**
   * Throws if password is invalid.
   */
  static authenticate(password: string) {
    const valid = password === process.env.ADMIN_PASSWORD;
    if (!valid) {
      throw new Error("Invalid password");
    }
  }

  /**
   * Reads admin flag from cookies.
   */
  static isAdmin(req: { cookies?: Record<string, string> }): boolean {
    return req.cookies?.isadmin === "true";
  }
}
