import { SettingsModel } from "@/api/models/Settings";
import { AppError } from "../middleware/errorHandler";

export type SettingValue =
  | string
  | number
  | boolean
  | Date
  | { [key: string]: any };

export class SettingsService {
  static async get<T = SettingValue>(key: string): Promise<T | null> {
    const result = await SettingsModel.findByKey(key);
    return (result?.value as T) || null;
  }

  static async set(key: string, value: SettingValue): Promise<void> {
    if (value === undefined) {
      throw new AppError("Value is required", 400);
    }
    await SettingsModel.upsert(key, value);
  }

  // Artist updates specific methods
  static async getLastRun(
    type: "images" | "headers" | "scores"
  ): Promise<Date | null> {
    if (type !== "images" && type !== "headers" && type !== "scores") {
      throw new AppError("Type must be 'images', 'headers', or 'scores'", 400);
    }
    const result = await this.get<string>(`artist_${type}_last_run`);
    return result ? new Date(result) : null;
  }

  static async getAllLastRuns(): Promise<Record<string, Date | null>> {
    const results = await SettingsModel.findAllByKeyPattern("_last_run");
    const lastRuns: Record<string, Date | null> = {};

    for (const entry of results) {
      lastRuns[entry.key] = entry.value
        ? new Date(entry.value as string)
        : null;
    }

    return lastRuns;
  }

  static async setLastRun(
    type: "images" | "headers" | "scores",
    date: Date = new Date()
  ): Promise<void> {
    await this.set(`artist_${type}_last_run`, date.toISOString());
  }
}
