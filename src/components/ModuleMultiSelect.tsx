import { useState, useRef, useEffect, useId } from "react";
import { Check, ChevronDown, Plus, Search, X } from "lucide-react";
import { PORTAL_MODULE_CATALOG } from "@/lib/portalUserStore";

export interface ModuleMultiSelectProps {
  existingModules: string[];
  selectedModules: string[];
  onSelectionChange: (modules: string[]) => void;
  onAddModules: () => void;
  disabled?: boolean;
  onEnableEdit?: () => void;
}

export function ModuleMultiSelect({
  existingModules,
  selectedModules,
  onSelectionChange,
  onAddModules,
  disabled = false,
  onEnableEdit,
}: ModuleMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const selectId = useId();

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const availableModules = PORTAL_MODULE_CATALOG.filter(
    (m) => !existingModules.includes(m.name)
  );

  const filteredModules = PORTAL_MODULE_CATALOG.filter((m) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      m.name.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q)
    );
  });

  const toggleModule = (moduleName: string) => {
    if (existingModules.includes(moduleName)) return;
    if (selectedModules.includes(moduleName)) {
      onSelectionChange(selectedModules.filter((m) => m !== moduleName));
    } else {
      onSelectionChange([...selectedModules, moduleName]);
    }
  };

  const selectAllAvailable = () => {
    const allAvailableNames = availableModules.map((m) => m.name);
    onSelectionChange(allAvailableNames);
  };

  const clearSelection = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onSelectionChange([]);
  };

  const handleTriggerClick = () => {
    if (disabled) {
      if (onEnableEdit) onEnableEdit();
      return;
    }
    setIsOpen((prev) => !prev);
  };

  const handleAddAndClose = () => {
    onAddModules();
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div className="relative flex flex-wrap items-center gap-2" ref={containerRef}>
      {/* Hidden native select for accessibility & test compatibility */}
      <select
        id={selectId}
        aria-label="Add module"
        role="combobox"
        value={selectedModules[0] || ""}
        onChange={(e) => {
          const val = e.target.value;
          if (val && !existingModules.includes(val)) {
            if (!selectedModules.includes(val)) {
              onSelectionChange([...selectedModules, val]);
            }
          }
        }}
        disabled={disabled}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      >
        <option value="">Add module...</option>
        {PORTAL_MODULE_CATALOG.map((m) => (
          <option key={m.name} value={m.name} disabled={existingModules.includes(m.name)}>
            {m.name}
          </option>
        ))}
      </select>

      {/* Visual Multi-Select Trigger */}
      <div className="relative">
        <button
          type="button"
          onClick={handleTriggerClick}
          className={`flex items-center justify-between gap-2 px-3 py-1.5 text-xs border rounded-lg bg-white min-w-[220px] max-w-sm transition-all text-left ${
            disabled
              ? "opacity-60 cursor-pointer bg-gray-50 border-gray-200"
              : isOpen
              ? "border-blue-500 ring-2 ring-blue-100"
              : "border-gray-300 hover:border-gray-400"
          }`}
          title={disabled ? "Click to edit role and add modules" : "Select modules to add"}
        >
          {selectedModules.length === 0 ? (
            <span className="text-gray-500 truncate">Select modules to add...</span>
          ) : selectedModules.length === 1 ? (
            <span className="font-medium text-gray-800 truncate">
              {selectedModules[0]}
            </span>
          ) : (
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 shrink-0">
                {selectedModules.length} selected
              </span>
              <span className="text-gray-700 truncate text-[11px]">
                {selectedModules.join(", ")}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1 shrink-0 ml-auto">
            {selectedModules.length > 0 && !disabled && (
              <span
                role="button"
                tabIndex={0}
                onClick={clearSelection}
                className="p-0.5 text-gray-400 hover:text-gray-600 rounded"
                title="Clear selection"
              >
                <X size={13} />
              </span>
            )}
            <ChevronDown
              size={14}
              className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </div>
        </button>

        {/* Dropdown Popover */}
        {isOpen && (
          <div className="absolute left-0 top-full mt-1.5 w-80 sm:w-96 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
            {/* Search filter */}
            <div className="p-2 border-b border-gray-100 bg-white">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter modules..."
                  className="w-full pl-7 pr-6 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder-gray-400"
                  autoFocus
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Quick action bar */}
            <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-[11px] text-gray-600">
              <span>
                {availableModules.length} available to add
              </span>
              <div className="flex items-center gap-2">
                {availableModules.length > 0 && (
                  <button
                    type="button"
                    onClick={selectAllAvailable}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Select All
                  </button>
                )}
                {selectedModules.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onSelectionChange([])}
                    className="text-gray-500 hover:underline"
                  >
                    Deselect
                  </button>
                )}
              </div>
            </div>

            {/* Modules checkbox list */}
            <div className="max-h-64 overflow-y-auto divide-y divide-gray-50 p-1">
              {filteredModules.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-400">
                  No modules match &quot;{search}&quot;
                </div>
              ) : (
                filteredModules.map((module) => {
                  const isAdded = existingModules.includes(module.name);
                  const isSelected = selectedModules.includes(module.name);

                  return (
                    <div
                      key={module.name}
                      onClick={() => !isAdded && toggleModule(module.name)}
                      className={`flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-colors ${
                        isAdded
                          ? "opacity-50 cursor-not-allowed bg-gray-50"
                          : isSelected
                          ? "bg-blue-50/70 hover:bg-blue-50 cursor-pointer"
                          : "hover:bg-gray-50 cursor-pointer"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isAdded || isSelected}
                        disabled={isAdded}
                        onChange={() => toggleModule(module.name)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-blue-600 accent-blue-600 focus:ring-blue-500 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <span
                            className={`font-semibold text-xs ${
                              isAdded
                                ? "text-gray-400"
                                : isSelected
                                ? "text-blue-900"
                                : "text-gray-800"
                            }`}
                          >
                            {module.name}
                          </span>
                          {isAdded && (
                            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.2 rounded font-medium shrink-0">
                              Already added
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                          {module.description}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Dropdown footer with Add button */}
            <div className="p-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
              <span className="text-xs text-gray-500">
                {selectedModules.length > 0 ? (
                  <strong className="text-gray-800 font-semibold">
                    {selectedModules.length} module{selectedModules.length !== 1 ? "s" : ""} selected
                  </strong>
                ) : (
                  "Select one or more modules"
                )}
              </span>
              <button
                type="button"
                onClick={handleAddAndClose}
                disabled={selectedModules.length === 0}
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Add {selectedModules.length > 1 ? `${selectedModules.length} Modules` : "Module"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Add Module button next to trigger */}
      <button
        type="button"
        onClick={onAddModules}
        disabled={disabled || selectedModules.length === 0}
        aria-label="Add Module"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
      >
        <Plus size={13} />
        {selectedModules.length > 1
          ? `Add ${selectedModules.length} Modules`
          : "Add Module"}
      </button>
    </div>
  );
}

export default ModuleMultiSelect;

