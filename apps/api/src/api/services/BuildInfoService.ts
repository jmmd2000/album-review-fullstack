import { readFileSync } from "fs";
import path from "path";
import { query } from "@/db/client";

/**
 * Reads an installed package's version straight off its package.json on disk.
 * Plain fs rather than module resolution, so packages that lock down their
 * exports still report a version.
 */
const packageVersion = (name: string): string | null => {
  try {
    const raw = readFileSync(path.join(process.cwd(), "node_modules", name, "package.json"), "utf8");
    return (JSON.parse(raw) as { version: string }).version;
  } catch {
    return null;
  }
};

// Baked into the image as env by the docker build, "dev" outside a built image
const api = {
  sha: process.env.GIT_SHA ?? "dev",
  message: process.env.GIT_MESSAGE_B64 ? Buffer.from(process.env.GIT_MESSAGE_B64, "base64").toString("utf8") : null,
  builtAt: process.env.BUILT_AT || null,
};

export class BuildInfoService {
  /**
   * What is actually running right now. The commit info comes from the image
   * build, node and postgres are observed live, and the package versions are
   * read from the installed modules.
   */
  static async getBuildInfo() {
    let postgres: string | null = null;
    try {
      const result = await query("SHOW server_version");
      postgres = (result.rows[0]?.server_version as string) ?? null;
    } catch {
      postgres = null;
    }

    return {
      api,
      versions: {
        node: process.version,
        postgres,
        packages: {
          hono: packageVersion("hono"),
          "drizzle-orm": packageVersion("drizzle-orm"),
          pg: packageVersion("pg"),
          zod: packageVersion("zod"),
        },
      },
    };
  }
}
