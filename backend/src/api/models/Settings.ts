import "dotenv/config";
import { eq, sql } from "drizzle-orm";
import { settings } from "@/db/schema";
import { db } from "@/index";

export class SettingsModel {
  static async findByKey(key: string) {
    return db
      .select()
      .from(settings)
      .where(eq(settings.key, key))
      .then(r => r[0] || null);
  }

  static async upsert(key: string, value: any) {
    return db
      .insert(settings)
      .values({
        key,
        value,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: settings.key,
        set: {
          value,
          updatedAt: new Date(),
        },
      })
      .returning()
      .then(r => r[0]);
  }

  static async delete(key: string) {
    return db.delete(settings).where(eq(settings.key, key));
  }

  static async getAllSettings() {
    return db.select().from(settings);
  }

  static async getSettingsByPrefix(prefix: string) {
    return db
      .select()
      .from(settings)
      .where(sql`${settings.key} LIKE ${prefix + "%"}`);
  }

  static async findAllByKeyPattern(pattern: string) {
    return db
      .select()
      .from(settings)
      .where(sql`${settings.key} LIKE ${"%" + pattern + "%"}`);
  }
}
