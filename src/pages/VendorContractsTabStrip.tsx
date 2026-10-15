const CLIENT_DETAIL_TAB_LABELS = [
  "Overview",
  "Roles",
  "Users",
  "Orders",
  "Services",
  "Contracts",
  "Catalog",
  "Activity",
  "Configuration",
  "Documents",
] as const;

export default function VendorContractsTabStrip() {
  return (
    <div className="border-b border-gray-200 bg-white px-3 sm:px-5" data-testid="vendor-contract-tab-row">
      <div className="flex w-full flex-wrap items-center gap-x-1">
        {CLIENT_DETAIL_TAB_LABELS.map(label => {
          const isActive = label === "Contracts";
          return (
            <span
              key={label}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex min-w-[84px] flex-1 items-center justify-center px-2 py-2.5 text-center text-[10px] font-semibold transition-colors ${
                isActive ? "text-blue-600" : "text-gray-600"
              }`}
            >
              {label}
              {isActive && <span className="absolute inset-x-1 bottom-0 h-0.5 rounded-t-full bg-blue-600" />}
            </span>
          );
        })}
      </div>
    </div>
  );
}
