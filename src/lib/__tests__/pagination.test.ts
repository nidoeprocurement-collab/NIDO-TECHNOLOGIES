import { describe, expect, it } from "vitest";
import { getPaginationItems } from "@/lib/pagination";

describe("getPaginationItems", () => {
  it("shows every page when the result fits in the pager", () => {
    expect(getPaginationItems(2, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("shows a live trailing range for early pages", () => {
    expect(getPaginationItems(2, 12)).toEqual([1, 2, 3, 4, 5, "ellipsis", 12]);
  });

  it("centers the current page and abbreviates both ends", () => {
    expect(getPaginationItems(6, 12)).toEqual([1, "ellipsis", 5, 6, 7, "ellipsis", 12]);
  });

  it("shows the final page window", () => {
    expect(getPaginationItems(11, 12)).toEqual([1, "ellipsis", 8, 9, 10, 11, 12]);
  });
});
