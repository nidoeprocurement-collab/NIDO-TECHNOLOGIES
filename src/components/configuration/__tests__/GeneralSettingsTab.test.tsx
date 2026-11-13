import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthProvider } from "@/contexts/AuthContext";
import { ConfigProvider } from "@/contexts/ConfigContext";
import GeneralSettingsTab from "../GeneralSettingsTab";

describe("GeneralSettingsTab", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders General Settings without throwing on initial mount", () => {
    render(
      <AuthProvider>
        <ConfigProvider>
          <GeneralSettingsTab />
        </ConfigProvider>
      </AuthProvider>,
    );

    expect(screen.getByText("General Settings")).toBeTruthy();
  });
});

