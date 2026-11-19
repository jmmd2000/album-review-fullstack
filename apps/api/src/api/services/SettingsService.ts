import { SettingsModel } from "@/api/models/Settings";
import { artistJobResultSchema, type ArtistJobResult } from "@/api/schemas/artistJobResultSchema";

const REFRESH_INTERVAL_KEY = "artist_refresh_interval_days";
const DEFAULT_REFRESH_INTERVAL_DAYS = 7;

export class SettingsService {
  static async get(key: string): Promise<string | null> {
    const result = await SettingsModel.findByKey(key);
    return result?.value ?? null;
  }

  static async set(key: string, value: string): Promise<void> {
    await SettingsModel.upsert(key, value);
  }

  /** Gets when a job last finished, from the setting `<settingName>_last_run`. */
  static async getLastRun(settingName: string): Promise<Date | null> {
    const result = await this.get(`${settingName}_last_run`);
    return result ? new Date(result) : null;
  }

  /** Gets how many days the scheduled artist refresh waits between runs. 0 means the schedule is off. */
  static async getRefreshIntervalDays(): Promise<number> {
    const stored = await this.get(REFRESH_INTERVAL_KEY);
    if (stored === null) return DEFAULT_REFRESH_INTERVAL_DAYS;
    const days = Number(stored);
    return Number.isInteger(days) && days >= 0 ? days : DEFAULT_REFRESH_INTERVAL_DAYS;
  }

  static async setRefreshIntervalDays(days: number): Promise<void> {
    await this.set(REFRESH_INTERVAL_KEY, String(days));
  }

  static async getAllLastRuns(): Promise<Record<string, Date | null>> {
    const results = await SettingsModel.findAllByKeyPattern("_last_run");
    const lastRuns: Record<string, Date | null> = {};

    for (const entry of results) {
      lastRuns[entry.key] = entry.value ? new Date(entry.value) : null;
    }

    return lastRuns;
  }

  static async setJobResult(job: "images" | "headers", result: ArtistJobResult): Promise<void> {
    await this.set(`artist_${job}_last_result`, JSON.stringify(result));
  }

  /** Gets how each artist job's latest run went. A job that never ran, or a stored value the app can't read, gives null. */
  static async getJobResults(): Promise<Record<"images" | "headers", ArtistJobResult | null>> {
    return {
      images: await this.getJobResult("images"),
      headers: await this.getJobResult("headers"),
    };
  }

  private static async getJobResult(job: "images" | "headers"): Promise<ArtistJobResult | null> {
    // Drizzle parses a jsonb string again when the string holds JSON, so the value can arrive as an object
    let stored: unknown = await this.get(`artist_${job}_last_result`);
    if (typeof stored === "string") {
      try {
        stored = JSON.parse(stored);
      } catch {
        return null;
      }
    }
    const result = artistJobResultSchema.safeParse(stored);
    return result.success ? result.data : null;
  }

  static async setLastRun(settingName: string, date: Date = new Date()): Promise<void> {
    await this.set(`${settingName}_last_run`, date.toISOString());
  }
}
