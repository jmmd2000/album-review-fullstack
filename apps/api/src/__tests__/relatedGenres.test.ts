import { closeDatabase, db, query } from "@/db/client";
import { genres, relatedGenres } from "@/db/schema";
import { GenreModel } from "@/api/models/Genre";
import { resetTables } from "./testUtils";
import { beforeEach, afterAll, test, expect } from "vitest";

beforeEach(async () => {
  await resetTables(query);
});

afterAll(async () => {
  await closeDatabase();
});

// Insert the named genres and hand back their ids in the same order.
async function seedGenres(names: string[]): Promise<number[]> {
  const rows = await db
    .insert(genres)
    .values(names.map(name => ({ name, slug: name })))
    .returning({ id: genres.id });
  return rows.map(r => r.id);
}

// Look up the stored strength for a pair, regardless of the order it was passed in.
function strengthOf(rows: { genreID: number; relatedGenreID: number; strength: number }[], a: number, b: number) {
  const [low, high] = a < b ? [a, b] : [b, a];
  return rows.find(r => r.genreID === low && r.relatedGenreID === high)?.strength;
}

test("incrementRelatedStrength upserts every genre pair in one call", async () => {
  const [pop, rock, jazz] = await seedGenres(["pop", "rock", "jazz"]);

  await GenreModel.incrementRelatedStrength([pop, rock, jazz]);

  const rows = await db.select().from(relatedGenres);
  // 3 genres -> 3 unordered pairs
  expect(rows).toHaveLength(3);
  expect(strengthOf(rows, pop, rock)).toBe(1);
  expect(strengthOf(rows, pop, jazz)).toBe(1);
  expect(strengthOf(rows, rock, jazz)).toBe(1);
});

test("incrementRelatedStrength accumulates across calls and is order independent", async () => {
  const [pop, rock, jazz] = await seedGenres(["pop", "rock", "jazz"]);

  await GenreModel.incrementRelatedStrength([pop, rock, jazz]);
  // a second album shares pop + rock, passed in the opposite order
  await GenreModel.incrementRelatedStrength([rock, pop]);

  const rows = await db.select().from(relatedGenres);
  expect(rows).toHaveLength(3);
  expect(strengthOf(rows, pop, rock)).toBe(2);
  expect(strengthOf(rows, pop, jazz)).toBe(1);
  expect(strengthOf(rows, rock, jazz)).toBe(1);
});

test("decrementRelatedStrength lowers every pair in one call and floors at zero", async () => {
  const [pop, rock, jazz] = await seedGenres(["pop", "rock", "jazz"]);

  await GenreModel.incrementRelatedStrength([pop, rock, jazz]); // all at 1
  await GenreModel.decrementRelatedStrength([pop, rock, jazz]); // back to 0

  const rows = await db.select().from(relatedGenres);
  expect(strengthOf(rows, pop, rock)).toBe(0);
  expect(strengthOf(rows, pop, jazz)).toBe(0);
  expect(strengthOf(rows, rock, jazz)).toBe(0);

  // decrementing past zero stays at zero rather than going negative
  await GenreModel.decrementRelatedStrength([pop, rock, jazz]);
  const after = await db.select().from(relatedGenres);
  expect(strengthOf(after, pop, rock)).toBe(0);
});

test("duplicate genre ids are deduped rather than double counted", async () => {
  const [pop, rock] = await seedGenres(["pop", "rock"]);

  // pop repeated: batching dedupes so there is a single pop/rock row at strength 1
  await GenreModel.incrementRelatedStrength([pop, pop, rock]);

  const rows = await db.select().from(relatedGenres);
  expect(rows).toHaveLength(1);
  expect(strengthOf(rows, pop, rock)).toBe(1);
});

test("a single genre produces no pairs and no rows", async () => {
  const [pop] = await seedGenres(["pop"]);

  await GenreModel.incrementRelatedStrength([pop]);

  const rows = await db.select().from(relatedGenres);
  expect(rows).toHaveLength(0);
});
