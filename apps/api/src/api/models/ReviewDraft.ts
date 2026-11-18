import { eq } from "drizzle-orm";
import { reviewDrafts } from "@/db/schema";
import { db, type Executor } from "@/db/client";

export class ReviewDraftModel {
  static async deleteDraft(spotifyID: string, executor: Executor = db) {
    await executor.delete(reviewDrafts).where(eq(reviewDrafts.spotifyID, spotifyID));
  }
}
