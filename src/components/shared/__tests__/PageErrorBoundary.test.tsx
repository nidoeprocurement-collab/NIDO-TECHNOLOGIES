// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PageErrorBoundary from "../PageErrorBoundary";

function BrokenPage(): never {
  throw new Error("test render failure");
}

describe("PageErrorBoundary", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the page fallback when a child throws during render", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <PageErrorBoundary title="Shop failed to load">
        <BrokenPage />
      </PageErrorBoundary>,
    );

    expect(screen.getByRole("alert").textContent).toContain("Shop failed to load");
    expect(screen.getByRole("button", { name: "Refresh page" })).toBeTruthy();
  });

  it("includes the caught exception in development builds", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <PageErrorBoundary title="Shop failed to load">
        <BrokenPage />
      </PageErrorBoundary>,
    );

    if (import.meta.env.DEV) {
      expect(screen.getByText(/test render failure/)).toBeTruthy();
    }
  });
});
