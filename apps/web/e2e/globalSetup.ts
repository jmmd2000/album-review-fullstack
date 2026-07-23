import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

// Every run starts from the same seeded library. This wipes and reseeds
// whatever DATABASE_URL points at.
export default function globalSetup() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(here, "../../..");
  execSync("pnpm --filter @album-reviews/api run db:wipe", { cwd: repoRoot, stdio: "inherit" });
  execSync("pnpm --filter @album-reviews/api run db:seed", { cwd: repoRoot, stdio: "inherit" });
}
