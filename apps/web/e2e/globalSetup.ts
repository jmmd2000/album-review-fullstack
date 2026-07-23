import { execSync } from "child_process";
import path from "path";

// wipes and reseeds whatever DATABASE_URL points at
export default function globalSetup() {
  const repoRoot = path.resolve(__dirname, "../../..");
  execSync("pnpm --filter @album-reviews/api run db:wipe", { cwd: repoRoot, stdio: "inherit" });
  execSync("pnpm --filter @album-reviews/api run db:seed", { cwd: repoRoot, stdio: "inherit" });
}
