import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ModuleMultiSelect } from "../ModuleMultiSelect";

describe("ModuleMultiSelect", () => {
  it("allows deselecting already-added modules when onRemoveModule is provided and selecting new modules", () => {
    const onSelectionChange = vi.fn();
    const onAddModules = vi.fn();
    const onRemoveModule = vi.fn();

    render(
      <ModuleMultiSelect
        existingModules={["Dashboard", "Orders"]}
        selectedModules={[]}
        onSelectionChange={onSelectionChange}
        onAddModules={onAddModules}
        onRemoveModule={onRemoveModule}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Select modules/i }));

    // Existing module row is clickable and deselects via onRemoveModule
    const dashboardLabel = screen.getByText("Dashboard", { selector: "span" });
    const dashboardRow = dashboardLabel.closest("div.cursor-pointer") as HTMLElement;
    expect(dashboardRow).toBeTruthy();
    const dashboardCheckbox = dashboardRow.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(dashboardCheckbox.disabled).toBe(false);
    expect(dashboardCheckbox.checked).toBe(true);

    fireEvent.click(dashboardCheckbox);
    expect(onRemoveModule).toHaveBeenCalledWith("Dashboard");

    // Non-added module can be selected
    fireEvent.click(screen.getByText("Catalog", { selector: "span" }));
    expect(onSelectionChange).toHaveBeenCalledWith(["Catalog"]);
  });
});

