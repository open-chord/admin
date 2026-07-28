import { describe, expect, it } from "vitest";
import { formatDuration } from "./format";

describe("formatDuration", () => {
  it.each([
    [0, "0:00"],
    [1_000, "0:01"],
    [61_000, "1:01"],
    [3_599_000, "59:59"],
  ])("formats %i milliseconds as %s", (milliseconds, expected) => {
    expect(formatDuration(milliseconds)).toBe(expected);
  });

  it("rounds partial seconds", () => {
    expect(formatDuration(1_600)).toBe("0:02");
  });
});
