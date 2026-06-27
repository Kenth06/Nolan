import { z } from "zod";

/** Validates the POST /api/search body. The query is trimmed and bounded at the HTTP boundary. */
export const searchSchema = z.object({
  q: z.string().trim().min(1, "Type something to search.").max(200, "Query is too long."),
});

export type SearchInput = z.infer<typeof searchSchema>;
