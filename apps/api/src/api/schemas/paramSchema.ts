import { z } from "zod";

const spotifyIDSchema = (notFoundMessage: string) => z.string().regex(/^[A-Za-z0-9]{22}$/, notFoundMessage);

export const albumParamSchema = z.object({
  albumID: spotifyIDSchema("Album not found."),
});

export const includeGenresSchema = z.object({
  includeGenres: z.enum(["true", "false"], { error: "includeGenres must be true or false." }).optional(),
});
