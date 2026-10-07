ALTER TABLE "reviewed_albums" ADD COLUMN "bonus" real DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE "reviewed_albums" SET "bonus" = COALESCE(("bonus_details"->>'totalBonus')::real, 0);--> statement-breakpoint
ALTER TABLE "reviewed_albums" DROP COLUMN "bonus_details";
