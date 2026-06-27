import { describe, it, expect } from "vitest";
import { searchSchema } from "../workers/schemas/search.schema";

describe("searchSchema", () => {
  it("accepts a normal query and trims it", () => {
    const parsed = searchSchema.parse({ q: "  rain at night  " });
    expect(parsed.q).toBe("rain at night");
  });

  it("rejects an empty / whitespace-only query", () => {
    expect(searchSchema.safeParse({ q: "" }).success).toBe(false);
    expect(searchSchema.safeParse({ q: "   " }).success).toBe(false);
  });

  it("rejects a query longer than 200 chars", () => {
    expect(searchSchema.safeParse({ q: "x".repeat(201) }).success).toBe(false);
    expect(searchSchema.safeParse({ q: "x".repeat(200) }).success).toBe(true);
  });

  it("rejects a missing or non-string q", () => {
    expect(searchSchema.safeParse({}).success).toBe(false);
    expect(searchSchema.safeParse({ q: 42 }).success).toBe(false);
  });
});
