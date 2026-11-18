import { AlbumModel } from "@/api/models/Album";
import { ReviewDraftModel } from "@/api/models/ReviewDraft";
import { AppError } from "@/api/AppError";
import { draftFormValuesSchema, type DraftFormValues, type SaveDraftData } from "@/api/schemas/reviewDraftSchema";

export interface AlbumDraft {
  /** The saved form values, or null when they no longer match the form and can't be loaded */
  formValues: DraftFormValues | null;
  updatedAt: string;
}

export class ReviewDraftService {
  /** The album's draft, or null when it has none. */
  static async getDraft(spotifyID: string): Promise<AlbumDraft | null> {
    const row = await ReviewDraftModel.findDraft(spotifyID);
    if (!row) return null;

    const parsed = draftFormValuesSchema.safeParse(row.formValues);
    return { formValues: parsed.success ? parsed.data : null, updatedAt: row.updatedAt.toISOString() };
  }

  /**
   * Saves the album's draft, replacing any earlier one.
   * @throws AppError 409 when the album has already been reviewed, so a late save can't bring back a draft the review removed.
   */
  static async saveDraft(spotifyID: string, { formValues, album }: SaveDraftData) {
    if (await AlbumModel.findBySpotifyID(spotifyID)) throw new AppError("This album has already been reviewed.", 409);

    await ReviewDraftModel.saveDraft({ spotifyID, formValues, ...album });
  }

  static async deleteDraft(spotifyID: string) {
    await ReviewDraftModel.deleteDraft(spotifyID);
  }
}
