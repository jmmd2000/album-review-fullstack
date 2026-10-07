import { z } from "zod";

const spotifyIDSchema = (notFoundMessage: string) => z.string().regex(/^[A-Za-z0-9]{22}$/, notFoundMessage);

export const albumParamSchema = z.object({
  albumID: spotifyIDSchema("Album not found."),
});

export const artistParamSchema = z.object({
  artistID: spotifyIDSchema("Artist not found."),
});

export const jobParamSchema = z.object({
  id: z.uuid({ error: "Job not found" }),
});

export const includeGenresSchema = z.object({
  includeGenres: z.enum(["true", "false"], { error: "includeGenres must be true or false." }).optional(),
});
