import { desc, eq, sql } from "drizzle-orm";
import { reviewDrafts } from "@/db/schema";
import { db, type Executor } from "@/db/client";

export class ReviewDraftModel {
  static async getDrafts() {
    return db.select().from(reviewDrafts).orderBy(desc(reviewDrafts.updatedAt));
  }

  static async findDraft(spotifyID: string) {
    return db
      .select()
      .from(reviewDrafts)
      .where(eq(reviewDrafts.spotifyID, spotifyID))
      .then(rows => rows[0]);
  }

  /** Saves a draft, replacing any draft the album already has. */
  static async saveDraft(values: Omit<typeof reviewDrafts.$inferInsert, "updatedAt">) {
    await db
      .insert(reviewDrafts)
      .values(values)
      .onConflictDoUpdate({
        target: reviewDrafts.spotifyID,
        set: { ...values, updatedAt: sql`now()` },
      });
  }

  static async deleteDraft(spotifyID: string, executor: Executor = db) {
    await executor.delete(reviewDrafts).where(eq(reviewDrafts.spotifyID, spotifyID));
  }
}
