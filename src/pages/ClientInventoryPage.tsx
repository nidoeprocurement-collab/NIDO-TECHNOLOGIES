import { useEffect, useMemo, useRef, useState } from "react";
import type { StoredClient } from "@/lib/clientStore";
import { useAuth } from "@/contexts/AuthContext";
import { useMyOrders } from "@/contexts/MyOrdersContext";
import { getPortalUsersByClient, type PortalUser } from "@/lib/portalUserStore";
import { getClientCatalog } from "@/lib/clientCatalogStore";
import { getServiceRequests } from "@/lib/serviceRequestsStore";
import { isDigitalOnlyType } from "@/lib/productTypeRules";
import {
  type ActivityCategory,
  type ClientInventoryData,
  type InventoryActivityRecord,
  type InventoryAssetType,
  type InventoryItemRecord,
  type RepairStatus,
  formatNowDateTime,
  formatTodayShort,
  getClientInventory,
  saveClientInventory,
  syncClientInventoryFromLiveSources,
} from "@/lib/clientInventoryStore";
import {
  AlertCircle,
  ArrowLeftRight,
  Box,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Info,
  Laptop,
  Layers,
  MapPin,
  MoreVertical,
  Mouse,
  Monitor,
  Plus,
  Printer,
  RotateCcw,
  Search,
  Smartphone,
  Upload,
  User,
  Users,
  Wrench,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

type InventorySubTab = "available" | "assigned" | "reserved" | "repair" | "activity";

interface Props {
  client: StoredClient;
}

function AssetIcon({ item, size = 15 }: { item: Pick<InventoryItemRecord, "name" | "type" | "category">; size?: number }) {
  const lower = item.name.toLowerCase();
  if (item.type === "Digital License") return <Layers size={size} className="text-blue-600" />;
  if (lower.includes("mouse")) return <Mouse size={size} className="text-slate-600" />;
  if (lower.includes("monitor")) return <Monitor size={size} className="text-blue-600" />;
  if (lower.includes("galaxy") || lower.includes("phone") || lower.includes("ups")) {
    return <Smartphone size={size} className="text-blue-600" />;
  }
  if (lower.includes("printer")) return <Printer size={size} className="text-slate-600" />;
  if (item.type === "Consumable") return <Box size={size} className="text-slate-600" />;
  return <Laptop size={size} className="text-blue-600" />;
}

function TypeBadge({ type }: { type: InventoryAssetType }) {
  if (type === "Digital License") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700">
        <Layers size={11} /> Digital License
      </span>
    );
  }
  if (type === "Consumable") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700">
        <Box size={11} /> Consumable
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700">
      <Laptop size={11} /> Physical Asset
    </span>
  );
}

function DeptBadge({ dept }: { dept?: string }) {
  if (!dept) return <span className="text-gray-400">—</span>;
  const styles: Record<string, string> = {
    Finance: "bg-purple-50 text-purple-700",
    Sales: "bg-blue-50 text-blue-700",
    Operations: "bg-amber-50 text-amber-700",
    IT: "bg-indigo-50 text-indigo-700",
    Support: "bg-sky-50 text-sky-700",
  };
  return (
    <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[11px] font-medium ${styles[dept] || "bg-gray-100 text-gray-700"}`}>
      {dept}
    </span>
  );
}

function ConditionBadge({ condition }: { condition: string }) {
  const cls =
    condition === "New" || condition === "Good" || condition === "Active"
      ? "bg-emerald-50 text-emerald-700"
      : "bg-amber-50 text-amber-700";
  return <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}>{condition}</span>;
}

function EventBadge({ event }: { event: InventoryActivityRecord["event"] }) {
  const map: Record<InventoryActivityRecord["event"], string> = {
    Returned: "bg-emerald-50 text-emerald-700",
    Allocated: "bg-blue-50 text-blue-700",
    Issued: "bg-blue-50 text-blue-700",
    Assigned: "bg-blue-50 text-blue-700",
    Transferred: "bg-purple-50 text-purple-700",
    Reserved: "bg-purple-50 text-purple-700",
    "Repair Updated": "bg-amber-50 text-amber-700",
    "Repair Completed": "bg-emerald-50 text-emerald-700",
    Added: "bg-indigo-50 text-indigo-700",
  };
  return (
    <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[11px] font-semibold ${map[event] || "bg-gray-100 text-gray-700"}`}>
      {event}
    </span>
  );
}

function RepairStatusBadge({ status }: { status?: RepairStatus }) {
  const map: Record<string, string> = {
    "In Progress": "bg-amber-50 text-amber-700",
    "Awaiting Parts": "bg-orange-50 text-orange-700",
    "Ready for Collection": "bg-emerald-50 text-emerald-700",
    "Awaiting Diagnosis": "bg-slate-100 text-slate-700",
  };
  return (
    <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[11px] font-semibold ${map[status || ""] || "bg-gray-100 text-gray-700"}`}>
      {status || "In Progress"}
    </span>
  );
}

function actionLabelForAvailable(item: InventoryItemRecord): string {
  if (item.type === "Digital License") return "Allocate";
  if (item.type === "Consumable") return "Issue";
  return "Assign";
}

function actionLabelForAssigned(item: InventoryItemRecord): string {
  if (item.type === "Digital License") return "Revoke";
  if (item.type === "Consumable") return "View";
  return "Return";
}

function exportRowsAsCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const csv = [
    headers.join(","),
    ...rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function ClientInventoryPage({ client }: Props) {
  const { user: authUser } = useAuth();
  const { orders } = useMyOrders();
  const actorName = authUser?.name || "System Admin";
  const actorRole = authUser?.role || "Admin";

  const [data, setData] = useState<ClientInventoryData>(() => getClientInventory(client.id));
  const [subTab, setSubTab] = useState<InventorySubTab>("available");
  const clientUsers = useMemo(
    () => getPortalUsersByClient(client.id).filter((u) => u.status !== "inactive"),
    [client.id],
  );
  const clientProducts = useMemo(() => getClientCatalog(client.id), [client.id]);

  // Sync live platform sources (delivered/fulfilled orders, user assigned devices, repair service requests)
  useEffect(() => {
    const runSync = () => {
      const synced = syncClientInventoryFromLiveSources(
        client,
        orders,
        getPortalUsersByClient(client.id).filter((u) => u.status !== "inactive"),
        getServiceRequests(),
      );
      setData(synced);
    };
    runSync();
    window.addEventListener("serviceRequestsUpdated", runSync);
    window.addEventListener("ordersUpdated", runSync);
    window.addEventListener("storage", runSync);
    return () => {
      window.removeEventListener("serviceRequestsUpdated", runSync);
      window.removeEventListener("ordersUpdated", runSync);
      window.removeEventListener("storage", runSync);
    };
  }, [client, orders]);

  // Filters
  const [typeFilter, setTypeFilter] = useState<"all" | InventoryAssetType>("all");
  const [repairPill, setRepairPill] = useState<"all" | RepairStatus>("all");
  const [activityPill, setActivityPill] = useState<"all" | ActivityCategory>("all");
  const [search, setSearch] = useState("");
  const [filterA, setFilterA] = useState("all"); // Category / Department / DateRange
  const [filterB, setFilterB] = useState("all"); // Location / Repair provider / PerformedBy
  const [filterC, setFilterC] = useState("all"); // Condition / AssignedTo / ReservedFor / AssetType
  const [filterD, setFilterD] = useState("all"); // IdlePeriod / AssignmentDate / Expiry / ExpectedReturn

  // Selection & pagination
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [assignModalItem, setAssignModalItem] = useState<InventoryItemRecord | null>(null);
  const [returnModalItem, setReturnModalItem] = useState<InventoryItemRecord | null>(null);
  const [transferModalItem, setTransferModalItem] = useState<InventoryItemRecord | null>(null);
  const [repairModalItem, setRepairModalItem] = useState<InventoryItemRecord | null>(null);
  const [detailItem, setDetailItem] = useState<InventoryItemRecord | null>(null);
  const [detailEvent, setDetailEvent] = useState<InventoryActivityRecord | null>(null);

  // Form states for modals
  const [addForm, setAddForm] = useState({
    productKey: "",
    name: "",
    type: "Physical Asset" as InventoryAssetType,
    category: "Laptops",
    serialNumber: "",
    location: "Bengaluru · Store A",
    quantity: 1,
    condition: "New" as "New" | "Good" | "Active" | "Fair",
    warranty: "In Warranty",
    brand: "",
  });

  const handleSelectCatalogProduct = (key: string) => {
    const product = clientProducts.find(
      (p) => (p.cpc || p.productCode || p.sku || p.name) === key,
    );
    if (!product) {
      setAddForm((prev) => ({
        ...prev,
        productKey: "",
        name: "",
        brand: "",
      }));
      return;
    }
    const rawType = product.physicalType || product.productType || "";
    const mappedType: InventoryAssetType = isDigitalOnlyType(rawType)
      ? "Digital License"
      : rawType.toLowerCase().includes("consumable")
        ? "Consumable"
        : "Physical Asset";
    const defaultCity = client.billingCity || client.locationDetails?.city || "Bengaluru";
    setAddForm({
      productKey: key,
      name: product.name,
      type: mappedType,
      category: product.category || "General",
      serialNumber: product.sku || product.cpc || product.productCode || "",
      location: mappedType === "Digital License" ? "Company-wide" : `${defaultCity} · Store A`,
      quantity: Math.max(1, product.moq || 1),
      condition: mappedType === "Digital License" ? "Active" : "New",
      warranty: product.warranty || "In Warranty",
      brand: product.brand || "",
    });
  };
  const [assignForm, setAssignForm] = useState({
    userId: "",
    assignee: "",
    employeeId: "",
    department: "IT",
    location: "Bengaluru",
    email: "",
    role: "",
  });

  const extractUserDetails = (user: PortalUser) => {
    const details = (user.details || {}) as Record<string, unknown>;
    const employeeId =
      String(details.employeeId || "").trim() ||
      `EMP-${user.id.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase() || "0101"}`;
    const department = String(details.department || "").trim() || "IT";
    const clientCity =
      client.billingCity ||
      client.locationDetails?.city ||
      "Bengaluru";
    const rawLoc = String(
      details.location ||
      details.homeLocation ||
      details.city ||
      (details.locationAccess && details.locationAccess !== "All Locations" ? details.locationAccess : "") ||
      "",
    ).trim();
    const location = rawLoc || clientCity;
    return {
      userId: user.id,
      assignee: user.name,
      employeeId,
      department,
      location,
      email: user.email || "",
      role: user.role || "",
    };
  };

  const openAssignModal = (item: InventoryItemRecord, prefillName?: string) => {
    const matchedUser = prefillName
      ? clientUsers.find((u) => u.name.toLowerCase() === prefillName.toLowerCase())
      : undefined;
    if (matchedUser) {
      setAssignForm(extractUserDetails(matchedUser));
    } else {
      setAssignForm({
        userId: "",
        assignee: prefillName || "",
        employeeId: "",
        department: item.department || "IT",
        location: item.location || client.billingCity || "Bengaluru",
        email: "",
        role: "",
      });
    }
    setAssignModalItem(item);
  };

  const handleRecipientUserChange = (userId: string) => {
    const user = clientUsers.find((u) => u.id === userId);
    if (!user) {
      setAssignForm((prev) => ({ ...prev, userId: "", assignee: "", employeeId: "", email: "", role: "" }));
      return;
    }
    setAssignForm(extractUserDetails(user));
  };
  const [returnCondition, setReturnCondition] = useState<"Good" | "New" | "Fair">("Good");
  const [transferLocation, setTransferLocation] = useState("Hyderabad · Store B");
  const [repairForm, setRepairForm] = useState({
    reportedIssue: "",
    repairProvider: "Dell Service Centre",
    expectedReturn: "25 Nov 2026",
    repairStatus: "In Progress" as RepairStatus,
  });

  const csvInputRef = useRef<HTMLInputElement | null>(null);

  const persist = (next: ClientInventoryData) => {
    setData(next);
    saveClientInventory(client.id, next);
  };

  const resetFiltersForTab = (tab: InventorySubTab) => {
    setSubTab(tab);
    setTypeFilter("all");
    setRepairPill("all");
    setActivityPill("all");
    setSearch("");
    setFilterA("all");
    setFilterB("all");
    setFilterC("all");
    setFilterD("all");
    setSelectedIds(new Set());
    setPage(1);
  };

  // KPI Totals (sum quantities)
  const kpis = useMemo(() => {
    const sumQty = (status: InventoryItemRecord["status"]) =>
      data.items.filter((i) => i.status === status).reduce((s, i) => s + i.quantity, 0);
    const available = sumQty("available");
    const assigned = sumQty("assigned");
    const reserved = sumQty("reserved");
    const repair = sumQty("repair");
    return {
      total: available + assigned + reserved + repair,
      available,
      assigned,
      reserved,
      repair,
      idleOver30: data.items
        .filter((i) => i.status === "available" && i.idleDays > 30)
        .reduce((s, i) => s + i.quantity, 0),
      expiringSoon: data.items.filter((i) => i.status === "reserved" && i.reservationStatus === "Expiring Soon").length,
      overdueRepairs: data.items.filter((i) => i.status === "repair" && i.repairOverdue).length,
    };
  }, [data.items]);

  // Tab item lists
  const tabItems = useMemo(() => {
    if (subTab === "activity") return [];
    const base = data.items.filter((i) => i.status === subTab);
    return base.filter((i) => {
      if (subTab !== "repair" && typeFilter !== "all" && i.type !== typeFilter) return false;
      if (subTab === "repair" && repairPill !== "all" && i.repairStatus !== repairPill) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = [
          i.name,
          i.assetId,
          i.serialNumber,
          i.assignedTo,
          i.reservedFor,
          i.reservationId,
          i.repairId,
          i.repairProvider,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }

      if (subTab === "available") {
        if (filterA !== "all" && i.category !== filterA) return false;
        if (filterB !== "all" && i.location !== filterB) return false;
        if (filterC !== "all" && i.condition !== filterC) return false;
        if (filterD === "over30" && i.idleDays <= 30) return false;
        if (filterD === "under30" && i.idleDays > 30) return false;
      } else if (subTab === "assigned") {
        if (filterA !== "all" && i.department !== filterA) return false;
        if (filterB !== "all" && i.location !== filterB) return false;
        if (filterC !== "all" && i.assignedTo !== filterC) return false;
      } else if (subTab === "reserved") {
        if (filterA !== "all" && i.department !== filterA) return false;
        if (filterB !== "all" && i.location !== filterB) return false;
        if (filterC !== "all" && i.reservedFor !== filterC) return false;
        if (filterD === "expiring" && i.reservationStatus !== "Expiring Soon") return false;
      } else if (subTab === "repair") {
        if (filterA !== "all" && i.category !== filterA) return false;
        if (filterB !== "all" && i.repairProvider !== filterB) return false;
        if (filterC !== "all" && i.location !== filterC) return false;
        if (filterD === "overdue" && !i.repairOverdue) return false;
      }
      return true;
    });
  }, [data.items, subTab, typeFilter, repairPill, search, filterA, filterB, filterC, filterD]);

  const filteredActivities = useMemo(() => {
    if (subTab !== "activity") return [];
    return data.activities.filter((a) => {
      if (activityPill !== "all" && a.category !== activityPill) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = `${a.itemName} ${a.eventId} ${a.assetId} ${a.performedBy} ${a.details}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filterB !== "all" && a.performedBy !== filterB) return false;
      if (filterC !== "all" && a.assetType !== filterC) return false;
      if (filterD !== "all" && a.location !== filterD) return false;
      return true;
    });
  }, [data.activities, subTab, activityPill, search, filterB, filterC, filterD]);

  const totalRows = subTab === "activity" ? filteredActivities.length : tabItems.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * rowsPerPage;
  const pagedItems = tabItems.slice(startIdx, startIdx + rowsPerPage);
  const pagedActivities = filteredActivities.slice(startIdx, startIdx + rowsPerPage);

  const selectedAsset = useMemo(() => {
    if (subTab === "activity") return null;
    return tabItems.find((i) => i.id === selectedAssetId) || pagedItems[0] || null;
  }, [subTab, tabItems, pagedItems, selectedAssetId]);

  const selectedEvent = useMemo(() => {
    if (subTab !== "activity") return null;
    return filteredActivities.find((a) => a.id === selectedEventId) || pagedActivities[0] || null;
  }, [subTab, filteredActivities, pagedActivities, selectedEventId]);

  // Unique dropdown option builders
  const currentTabBaseItems = useMemo(
    () => (subTab === "activity" ? [] : data.items.filter((i) => i.status === subTab)),
    [data.items, subTab],
  );
  const uniqueOpts = (fn: (i: InventoryItemRecord) => string | undefined) =>
    Array.from(new Set(currentTabBaseItems.map(fn).filter(Boolean) as string[]));

  const toggleAllVisible = (checked: boolean) => {
    if (!checked) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(pagedItems.map((i) => i.id)));
  };

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const nextEventCode = () => `EVT-${String(data.activities.length + 119).padStart(5, "0")}`;

  const pushActivity = (
    items: InventoryItemRecord[],
    act: Omit<InventoryActivityRecord, "id" | "eventId" | "dateTime">,
  ) => {
    const newAct: InventoryActivityRecord = {
      ...act,
      id: `act-${Date.now()}`,
      eventId: nextEventCode(),
      dateTime: formatNowDateTime(),
    };
    persist({ items, activities: [newAct, ...data.activities] });
  };

  // Actions
  const handleAddInventory = () => {
    if (!addForm.name.trim()) {
      toast.error("Please select a product");
      return;
    }
    const prefix = addForm.type === "Digital License" ? "LIC" : addForm.type === "Consumable" ? "STK" : "AST";
    const assetId = `${prefix}-${String(150 + data.items.length).padStart(5, "0")}`;
    const unitLabel =
      addForm.type === "Digital License"
        ? addForm.quantity > 1
          ? "seats"
          : "seat"
        : addForm.quantity > 1
          ? "units"
          : "unit";
    const newItem: InventoryItemRecord = {
      id: `inv-${Date.now()}`,
      assetId,
      name: addForm.name.trim(),
      type: addForm.type,
      category: addForm.category,
      serialNumber: addForm.serialNumber.trim() || `${prefix}-${Date.now().toString().slice(-4)}`,
      location: addForm.location,
      quantity: Math.max(1, addForm.quantity),
      unitLabel,
      condition: addForm.condition,
      status: "available",
      idleDays: 0,
      warranty: addForm.warranty || "In Warranty",
    };
    pushActivity([newItem, ...data.items], {
      itemName: newItem.name,
      assetId: newItem.assetId,
      assetType: newItem.type,
      location: newItem.location,
      event: "Added",
      category: "Assignments",
      details: `${newItem.quantity} ${newItem.unitLabel} added to ${newItem.location}`,
      performedBy: actorName,
      performedByRole: actorRole,
      previousStatus: "New",
      newStatus: "Available",
      summaryNote: `Added ${newItem.quantity} ${newItem.unitLabel} (${newItem.assetId}) to ${newItem.location}`,
    });
    setShowAddModal(false);
    setAddForm({
      productKey: "",
      name: "",
      type: "Physical Asset",
      category: "Laptops",
      serialNumber: "",
      location: "Bengaluru · Store A",
      quantity: 1,
      condition: "New",
      warranty: "In Warranty",
      brand: "",
    });
    toast.success(`${newItem.name} added to inventory`);
  };

  const handleConfirmAssign = () => {
    if (!assignModalItem || !assignForm.assignee.trim()) {
      toast.error("Please select a recipient user");
      return;
    }
    const prevStatus = assignModalItem.status === "reserved" ? "Reserved" : "Available";
    const nextStatusLabel =
      assignModalItem.type === "Digital License"
        ? "Active"
        : assignModalItem.type === "Consumable"
          ? "Issued"
          : "In Use";
    const updated = data.items.map((item) =>
      item.id === assignModalItem.id
        ? {
          ...item,
          status: "assigned" as const,
          idleDays: 0,
          assignedTo: assignForm.assignee.trim(),
          employeeId: assignForm.employeeId.trim() || "EMP-0190",
          department: assignForm.department,
          location: assignForm.location,
          assignedOn: formatTodayShort(),
          usageStatus: nextStatusLabel as InventoryItemRecord["usageStatus"],
        }
        : item,
    );
    pushActivity(updated, {
      itemName: assignModalItem.name,
      assetId: assignModalItem.assetId,
      assetType: assignModalItem.type,
      location: assignForm.location,
      event: assignModalItem.type === "Digital License" ? "Allocated" : assignModalItem.type === "Consumable" ? "Issued" : "Assigned",
      category: "Assignments",
      details: `${prevStatus} -> ${nextStatusLabel} / ${assignForm.assignee.trim()} · ${assignForm.department}`,
      performedBy: actorName,
      performedByRole: actorRole,
      previousStatus: prevStatus,
      newStatus: nextStatusLabel,
      summaryNote: `Assigned ${assignModalItem.name} (${assignModalItem.assetId}) to ${assignForm.assignee.trim()}`,
    });
    setAssignModalItem(null);
    setAssignForm({ userId: "", assignee: "", employeeId: "", department: "IT", location: "Bengaluru", email: "", role: "" });
    toast.success(`${assignModalItem.name} assigned to ${assignForm.assignee.trim()}`);
  };

  const handleConfirmReturn = () => {
    if (!returnModalItem) return;
    const prevOwner = returnModalItem.assignedTo || "Employee";
    const updated = data.items.map((item) =>
      item.id === returnModalItem.id
        ? {
          ...item,
          status: "available" as const,
          condition: returnCondition,
          idleDays: 0,
          location: item.location.includes("Store") ? item.location : `${item.location} · Store A`,
          assignedTo: undefined,
          employeeId: undefined,
          department: undefined,
          assignedOn: undefined,
          usageStatus: undefined,
        }
        : item,
    );
    pushActivity(updated, {
      itemName: returnModalItem.name,
      assetId: returnModalItem.assetId,
      assetType: returnModalItem.type,
      location: returnModalItem.location,
      event: "Returned",
      category: "Returns",
      details: `In Use -> Available / ${prevOwner} · ${returnModalItem.location}`,
      performedBy: actorName,
      performedByRole: actorRole,
      previousStatus: "In Use",
      newStatus: "Available",
      summaryNote: `Return recorded from ${prevOwner} · Condition: ${returnCondition} · Location: ${returnModalItem.location}`,
    });
    setReturnModalItem(null);
    toast.success(`${returnModalItem.name} returned to available stock`);
  };

  const handleReleaseReservation = (item: InventoryItemRecord) => {
    const updated = data.items.map((x) =>
      x.id === item.id
        ? {
          ...x,
          status: "available" as const,
          idleDays: 0,
          location: x.location.includes("Store") ? x.location : `${x.location} · Store A`,
          reservationId: undefined,
          reservedFor: undefined,
          reservedBy: undefined,
          reservedUntil: undefined,
          reservationPurpose: undefined,
          reservationStatus: undefined,
        }
        : x,
    );
    pushActivity(updated, {
      itemName: item.name,
      assetId: item.assetId,
      assetType: item.type,
      location: item.location,
      event: "Returned",
      category: "Reservations",
      details: `Reservation ${item.reservationId || ""} released -> Available`,
      performedBy: actorName,
      performedByRole: actorRole,
      previousStatus: "Reserved",
      newStatus: "Available",
      summaryNote: `Released reservation for ${item.reservedFor || "recipient"}`,
    });
    toast.success(`Reservation released for ${item.name}`);
  };

  const handleConfirmTransfer = () => {
    if (!transferModalItem) return;
    const prevLoc = transferModalItem.location;
    const updated = data.items.map((x) =>
      x.id === transferModalItem.id ? { ...x, location: transferLocation } : x,
    );
    pushActivity(updated, {
      itemName: transferModalItem.name,
      assetId: transferModalItem.assetId,
      assetType: transferModalItem.type,
      location: transferLocation,
      event: "Transferred",
      category: "Transfers",
      details: `${prevLoc} -> ${transferLocation}`,
      performedBy: actorName,
      performedByRole: actorRole,
      previousStatus: prevLoc,
      newStatus: transferLocation,
      summaryNote: `Transferred ${transferModalItem.name} from ${prevLoc} to ${transferLocation}`,
    });
    setTransferModalItem(null);
    toast.success(`Transferred to ${transferLocation}`);
  };

  const handleConfirmRepair = () => {
    if (!repairModalItem) return;
    const isExistingRepair = repairModalItem.status === "repair";
    const updated = data.items.map((x) =>
      x.id === repairModalItem.id
        ? {
          ...x,
          status: "repair" as const,
          repairId: x.repairId || `RPR-${String(37 + data.items.length).padStart(5, "0")}`,
          reportedIssue: repairForm.reportedIssue || x.reportedIssue || "Hardware inspection",
          repairProvider: repairForm.repairProvider,
          sentOn: x.sentOn || formatTodayShort(),
          expectedReturn: repairForm.expectedReturn,
          repairStatus: repairForm.repairStatus,
        }
        : x,
    );
    pushActivity(updated, {
      itemName: repairModalItem.name,
      assetId: repairModalItem.assetId,
      assetType: repairModalItem.type,
      location: repairModalItem.location,
      event: "Repair Updated",
      category: "Repairs",
      details: `${isExistingRepair ? repairModalItem.repairStatus : "Available"} -> ${repairForm.repairStatus} / ${repairForm.repairProvider}`,
      performedBy: actorName,
      performedByRole: actorRole,
      previousStatus: isExistingRepair ? repairModalItem.repairStatus || "In Progress" : "Available",
      newStatus: repairForm.repairStatus,
      summaryNote: `Repair updated for ${repairModalItem.name} (${repairForm.repairProvider})`,
    });
    setRepairModalItem(null);
    toast.success("Repair details updated");
  };

  const handleCompleteRepair = (item: InventoryItemRecord) => {
    const updated = data.items.map((x) =>
      x.id === item.id
        ? {
          ...x,
          status: "available" as const,
          condition: "Good" as const,
          idleDays: 0,
          repairId: undefined,
          reportedIssue: undefined,
          repairProvider: undefined,
          sentOn: undefined,
          expectedReturn: undefined,
          repairOverdue: undefined,
          repairStatus: undefined,
        }
        : x,
    );
    pushActivity(updated, {
      itemName: item.name,
      assetId: item.assetId,
      assetType: item.type,
      location: item.location,
      event: "Repair Completed",
      category: "Repairs",
      details: `Under Repair -> Available / ${item.repairProvider || "Service Centre"}`,
      performedBy: actorName,
      performedByRole: actorRole,
      previousStatus: "Under Repair",
      newStatus: "Available",
      summaryNote: `Repair completed for ${item.name} (${item.repairId || item.assetId}) and returned to stock`,
    });
    toast.success(`${item.name} repair completed and moved to Available stock`);
  };

  const handleExportCurrent = (onlySelected = false) => {
    if (subTab === "activity") {
      exportRowsAsCsv(
        `${client.name}-inventory-activity.csv`,
        ["Event ID", "Date & Time", "Item", "Asset ID", "Event", "Details", "Performed By"],
        filteredActivities.map((a) => [a.eventId, a.dateTime, a.itemName, a.assetId, a.event, a.details, a.performedBy]),
      );
      toast.success("Activity log exported");
      return;
    }
    const source = onlySelected && selectedIds.size > 0
      ? tabItems.filter((i) => selectedIds.has(i.id))
      : tabItems;
    exportRowsAsCsv(
      `${client.name}-inventory-${subTab}.csv`,
      ["Asset ID", "Item Name", "Type", "Location", "Qty", "Status", "Condition"],
      source.map((i) => [i.assetId, i.name, i.type, i.location, `${i.quantity} ${i.unitLabel}`, i.status, i.condition]),
    );
    toast.success(`Exported ${source.length} inventory records`);
  };

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const dataLines = lines.length > 1 && lines[0].toLowerCase().includes("name") ? lines.slice(1) : lines;
      if (dataLines.length === 0) {
        toast.error("CSV file is empty");
        return;
      }
      const imported: InventoryItemRecord[] = [];
      const newActs: InventoryActivityRecord[] = [];
      let seq = data.items.length + 1;
      let actSeq = data.activities.length + 1;
      const defaultCity = client.billingCity || client.locationDetails?.city || "Head Office";

      dataLines.forEach((line, idx) => {
        const cols = line.split(",").map((c) => c.replace(/^"|"$/g, "").trim());
        const itemName = cols[0];
        if (!itemName) return;
        const rawType = (cols[1] || "").toLowerCase();
        const type: InventoryAssetType = rawType.includes("license")
          ? "Digital License"
          : rawType.includes("consum")
            ? "Consumable"
            : "Physical Asset";
        const prefix = type === "Digital License" ? "LIC" : type === "Consumable" ? "STK" : "AST";
        const assetId = `${prefix}-${String(seq++).padStart(5, "0")}`;
        const qty = Math.max(1, parseInt(cols[5] || "1", 10) || 1);
        const location = cols[4] || (type === "Digital License" ? "Company-wide" : `${defaultCity} · Store A`);
        const unitLabel = type === "Digital License" ? (qty === 1 ? "seat" : "seats") : (qty === 1 ? "unit" : "units");

        const item: InventoryItemRecord = {
          id: `inv-csv-${Date.now()}-${idx}`,
          assetId,
          name: itemName,
          type,
          category: cols[2] || "General",
          serialNumber: cols[3] || `${prefix}-${Date.now().toString().slice(-4)}-${idx}`,
          location,
          quantity: qty,
          unitLabel,
          condition: (["New", "Good", "Active", "Fair"].includes(cols[6]) ? cols[6] : "New") as InventoryItemRecord["condition"],
          status: "available",
          idleDays: 0,
          warranty: "In Warranty",
        };
        imported.push(item);
        newActs.push({
          id: `act-csv-${Date.now()}-${idx}`,
          eventId: `EVT-${String(actSeq++).padStart(5, "0")}`,
          dateTime: formatNowDateTime(),
          itemName: item.name,
          assetId: item.assetId,
          assetType: item.type,
          location: item.location,
          event: "Added",
          category: "Assignments",
          details: `CSV Import · ${qty} ${unitLabel} added to ${location}`,
          performedBy: actorName,
          performedByRole: actorRole,
          previousStatus: "CSV Import",
          newStatus: "Available",
          summaryNote: `Imported ${item.name} (${item.assetId}) from ${file.name}`,
        });
      });

      if (imported.length === 0) {
        toast.error("No valid inventory rows found in CSV");
      } else {
        persist({
          items: [...imported, ...data.items],
          activities: [...newActs, ...data.activities],
        });
        toast.success(`Imported ${imported.length} inventory item(s) from "${file.name}"`);
      }
    } catch {
      toast.error("Failed to read CSV file");
    } finally {
      e.target.value = "";
    }
  };

  const clientCode = (client as unknown as { code?: string }).code || client.id.slice(0, 6).toUpperCase();

  return (
    <div className="p-4 sm:p-6 space-y-4 bg-[#fcfcfd]">
      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Inventory</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage your company&apos;s available stock, assignments and returns.
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2.5 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 font-semibold text-blue-700 border border-blue-100">
              <Building2 size={13} />
              {client.name} · {clientCode}
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500">Only your company&apos;s inventory</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input ref={csvInputRef} type="file" accept=".csv" className="hidden" onChange={handleCsvImport} />
          <button
            type="button"
            onClick={() => csvInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Upload size={14} /> Import CSV
          </button>
          <button
            type="button"
            onClick={() => handleExportCurrent(false)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download size={14} /> Export
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm transition-colors"
          >
            <Plus size={14} /> Add Inventory
          </button>
        </div>
      </div>

      {/* ── 5 KPI Summary Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          {
            label: "Total Units",
            value: kpis.total,
            icon: <Box size={18} className="text-blue-600" />,
            ring: "bg-blue-50 border-blue-100",
          },
          {
            label: "Available",
            value: kpis.available,
            icon: <CheckCircle2 size={18} className="text-emerald-600" />,
            ring: "bg-emerald-50 border-emerald-100",
          },
          {
            label: "Assigned / In Use",
            value: kpis.assigned,
            icon: <Users size={18} className="text-blue-600" />,
            ring: "bg-blue-50 border-blue-100",
          },
          {
            label: "Reserved",
            value: kpis.reserved,
            icon: <Calendar size={18} className="text-purple-600" />,
            ring: "bg-purple-50 border-purple-100",
          },
          {
            label: "Under Repair",
            value: kpis.repair,
            icon: <Wrench size={18} className="text-amber-600" />,
            ring: "bg-amber-50 border-amber-100",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="flex items-center gap-3.5 rounded-xl border border-gray-200 bg-white px-4 py-3.5 shadow-2xs"
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${card.ring}`}>
              {card.icon}
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900 leading-tight">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Contextual Banner ──────────────────────────────────────────────────── */}
      {subTab === "available" && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200/80 bg-amber-50/70 px-4 py-2.5 text-xs">
          <div className="flex items-center gap-2 text-gray-800 font-medium">
            <Clock size={15} className="text-amber-600 shrink-0" />
            <span>{kpis.idleOver30} available units idle for over 30 days.</span>
          </div>
          <button
            type="button"
            onClick={() => setFilterD(filterD === "over30" ? "all" : "over30")}
            className="font-semibold text-blue-600 hover:underline"
          >
            {filterD === "over30" ? "Show all stock" : "Review idle stock →"}
          </button>
        </div>
      )}
      {subTab === "assigned" && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-200/80 bg-blue-50/70 px-4 py-2.5 text-xs">
          <div className="flex items-center gap-2 text-gray-800 font-medium">
            <Info size={15} className="text-blue-600 shrink-0" />
            <span>{kpis.assigned} units currently assigned across your company.</span>
          </div>
          <button
            type="button"
            onClick={() => handleExportCurrent(false)}
            className="font-semibold text-blue-600 hover:underline"
          >
            Export assignment register →
          </button>
        </div>
      )}
      {subTab === "reserved" && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-purple-200/80 bg-purple-50/70 px-4 py-2.5 text-xs">
          <div className="flex items-center gap-2 text-gray-800 font-medium">
            <Info size={15} className="text-purple-600 shrink-0" />
            <span>{kpis.reserved} units reserved for upcoming assignments.</span>
          </div>
          <button
            type="button"
            onClick={() => setFilterD(filterD === "expiring" ? "all" : "expiring")}
            className="font-semibold text-purple-700 hover:underline"
          >
            {kpis.expiringSoon} reservations expire within 3 days
          </button>
        </div>
      )}
      {subTab === "repair" && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200/80 bg-amber-50/70 px-4 py-2.5 text-xs">
          <div className="flex items-center gap-2 text-gray-800 font-medium">
            <AlertCircle size={15} className="text-amber-600 shrink-0" />
            <span>{kpis.repair} assets currently under repair.</span>
          </div>
          <button
            type="button"
            onClick={() => setFilterD(filterD === "overdue" ? "all" : "overdue")}
            className="font-semibold text-blue-600 hover:underline"
          >
            {kpis.overdueRepairs} repairs overdue
          </button>
        </div>
      )}
      {subTab === "activity" && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-200/80 bg-blue-50/70 px-4 py-2.5 text-xs">
          <div className="flex items-center gap-2 text-gray-800">
            <Info size={15} className="text-blue-600 shrink-0" />
            <span className="font-semibold">Inventory activity history</span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-600">Track changes made to your company&apos;s inventory.</span>
          </div>
          <button
            type="button"
            onClick={() => handleExportCurrent(false)}
            className="font-semibold text-blue-600 hover:underline"
          >
            Export activity log
          </button>
        </div>
      )}

      {/* ── Main Card (Sub-tabs + Filters + Table + Pagination) ─────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-2xs overflow-hidden">
        {/* Sub-tabs */}
        <div className="flex items-center gap-6 overflow-x-auto border-b border-gray-200 px-5">
          {[
            { id: "available" as const, label: `Available / Unassigned (${kpis.available})` },
            { id: "assigned" as const, label: `Assigned / In Use (${kpis.assigned})` },
            { id: "reserved" as const, label: `Reserved (${kpis.reserved})` },
            { id: "repair" as const, label: `Under Repair (${kpis.repair})` },
            { id: "activity" as const, label: "Activity" },
          ].map((t) => {
            const active = subTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => resetFiltersForTab(t.id)}
                className={`relative whitespace-nowrap py-3.5 text-xs font-semibold transition-colors ${active ? "text-blue-600" : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                {t.label}
                {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
              </button>
            );
          })}
        </div>

        {/* Filter Pills + Search + Dropdowns */}
        <div className="space-y-3 border-b border-gray-100 px-5 py-3.5">
          {/* Pills row */}
          <div className="flex flex-wrap items-center gap-2">
            {(subTab === "available" || subTab === "assigned" || subTab === "reserved") &&
              [
                { key: "all" as const, label: "All Types", icon: null },
                { key: "Physical Asset" as const, label: "Physical Assets", icon: <Laptop size={13} /> },
                { key: "Digital License" as const, label: "Digital Licenses", icon: <Layers size={13} /> },
                { key: "Consumable" as const, label: "Consumables", icon: <Box size={13} /> },
              ].map((pill) => {
                const active = typeFilter === pill.key;
                return (
                  <button
                    key={pill.key}
                    type="button"
                    onClick={() => { setTypeFilter(pill.key); setPage(1); }}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${active
                        ? "border-blue-300 bg-blue-50 text-blue-700 font-semibold"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                  >
                    {pill.icon}
                    {pill.label}
                  </button>
                );
              })}

            {subTab === "repair" &&
              [
                { key: "all" as const, label: "All Repairs", icon: null },
                { key: "Awaiting Diagnosis" as const, label: "Awaiting Diagnosis", icon: <Wrench size={13} /> },
                { key: "In Progress" as const, label: "In Progress", icon: <Wrench size={13} /> },
                { key: "Ready for Collection" as const, label: "Ready for Collection", icon: <CheckCircle2 size={13} /> },
              ].map((pill) => {
                const active = repairPill === pill.key;
                return (
                  <button
                    key={pill.key}
                    type="button"
                    onClick={() => { setRepairPill(pill.key); setPage(1); }}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${active
                        ? "border-blue-300 bg-blue-50 text-blue-700 font-semibold"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                  >
                    {pill.icon}
                    {pill.label}
                  </button>
                );
              })}

            {subTab === "activity" &&
              [
                { key: "all" as const, label: "All Events", icon: null },
                { key: "Assignments" as const, label: "Assignments", icon: <Users size={13} /> },
                { key: "Returns" as const, label: "Returns", icon: <RotateCcw size={13} /> },
                { key: "Reservations" as const, label: "Reservations", icon: <Calendar size={13} /> },
                { key: "Transfers" as const, label: "Transfers", icon: <ArrowLeftRight size={13} /> },
                { key: "Repairs" as const, label: "Repairs", icon: <Wrench size={13} /> },
              ].map((pill) => {
                const active = activityPill === pill.key;
                return (
                  <button
                    key={pill.key}
                    type="button"
                    onClick={() => { setActivityPill(pill.key); setPage(1); }}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${active
                        ? "border-blue-300 bg-blue-50 text-blue-700 font-semibold"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                  >
                    {pill.icon}
                    {pill.label}
                  </button>
                );
              })}
          </div>

          {/* Search & 4 Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-[1.6fr_repeat(4,minmax(0,1fr))] gap-2.5">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder={
                  subTab === "available"
                    ? "Search item, asset tag or serial number"
                    : subTab === "assigned"
                      ? "Search item, asset tag, employee or serial number"
                      : subTab === "reserved"
                        ? "Search item, reservation ID or recipient"
                        : subTab === "repair"
                          ? "Search asset, repair ID or provider"
                          : "Search asset, event ID or user"
                }
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-xs text-gray-800 placeholder-gray-400 focus:border-blue-400 focus:outline-none"
              />
            </div>

            {subTab === "available" && (
              <>
                <select value={filterA} onChange={(e) => setFilterA(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700">
                  <option value="all">Category</option>
                  {uniqueOpts((i) => i.category).map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
                <select value={filterB} onChange={(e) => setFilterB(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700">
                  <option value="all">Location</option>
                  {uniqueOpts((i) => i.location).map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
                <select value={filterC} onChange={(e) => setFilterC(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700">
                  <option value="all">Condition</option>
                  {uniqueOpts((i) => i.condition).map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
                <select value={filterD} onChange={(e) => setFilterD(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700">
                  <option value="all">Idle period</option>
                  <option value="over30">Over 30 days</option>
                  <option value="under30">Within 30 days</option>
                </select>
              </>
            )}

            {subTab === "assigned" && (
              <>
                <select value={filterA} onChange={(e) => setFilterA(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700">
                  <option value="all">Department</option>
                  {uniqueOpts((i) => i.department).map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
                <select value={filterB} onChange={(e) => setFilterB(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700">
                  <option value="all">Location</option>
                  {uniqueOpts((i) => i.location).map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
                <select value={filterC} onChange={(e) => setFilterC(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700">
                  <option value="all">Assigned to</option>
                  {uniqueOpts((i) => i.assignedTo).map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
                <select value={filterD} onChange={(e) => setFilterD(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700">
                  <option value="all">Assignment date</option>
                  <option value="recent">This month</option>
                </select>
              </>
            )}

            {subTab === "reserved" && (
              <>
                <select value={filterA} onChange={(e) => setFilterA(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700">
                  <option value="all">Department</option>
                  {uniqueOpts((i) => i.department).map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
                <select value={filterB} onChange={(e) => setFilterB(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700">
                  <option value="all">Location</option>
                  {uniqueOpts((i) => i.location).map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
                <select value={filterC} onChange={(e) => setFilterC(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700">
                  <option value="all">Reserved for</option>
                  {uniqueOpts((i) => i.reservedFor).map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
                <select value={filterD} onChange={(e) => setFilterD(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700">
                  <option value="all">Expiry date</option>
                  <option value="expiring">Expiring soon</option>
                </select>
              </>
            )}

            {subTab === "repair" && (
              <>
                <select value={filterA} onChange={(e) => setFilterA(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700">
                  <option value="all">Category</option>
                  {uniqueOpts((i) => i.category).map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
                <select value={filterB} onChange={(e) => setFilterB(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700">
                  <option value="all">Repair provider</option>
                  {uniqueOpts((i) => i.repairProvider).map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
                <select value={filterC} onChange={(e) => setFilterC(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700">
                  <option value="all">Location</option>
                  {uniqueOpts((i) => i.location).map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
                <select value={filterD} onChange={(e) => setFilterD(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700">
                  <option value="all">Expected return</option>
                  <option value="overdue">Overdue only</option>
                </select>
              </>
            )}

            {subTab === "activity" && (
              <>
                <select value={filterA} onChange={(e) => setFilterA(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700">
                  <option value="all">Date range</option>
                  <option value="7d">Last 7 days</option>
                </select>
                <select value={filterB} onChange={(e) => setFilterB(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700">
                  <option value="all">Performed by</option>
                  {Array.from(new Set(data.activities.map((a) => a.performedBy))).map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
                <select value={filterC} onChange={(e) => setFilterC(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700">
                  <option value="all">Asset type</option>
                  <option value="Physical Asset">Physical Asset</option>
                  <option value="Digital License">Digital License</option>
                  <option value="Consumable">Consumable</option>
                </select>
                <select value={filterD} onChange={(e) => setFilterD(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700">
                  <option value="all">Location</option>
                  {Array.from(new Set(data.activities.map((a) => a.location))).map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </>
            )}
          </div>

          {/* Count + info strip */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 pt-0.5">
            {subTab === "available" && (
              <>
                <span className="font-semibold text-gray-800">{kpis.available} available units · {tabItems.length} records shown</span>
                <span className="text-gray-300">|</span>
                <span className="inline-flex items-center gap-1"><Info size={13} className="text-gray-400" /> Available items are unassigned and ready for use.</span>
              </>
            )}
            {subTab === "assigned" && (
              <>
                <span className="font-semibold text-gray-800">{kpis.assigned} assigned units · {tabItems.length} records shown</span>
                <span className="text-gray-300">|</span>
                <span className="inline-flex items-center gap-1"><Info size={13} className="text-gray-400" /> Track ownership, usage and returns for your company&apos;s inventory.</span>
              </>
            )}
            {subTab === "reserved" && (
              <>
                <span className="font-semibold text-gray-800">{kpis.reserved} reserved units · {tabItems.length} reservations shown</span>
                <span className="text-gray-300">|</span>
                <span className="inline-flex items-center gap-1"><Info size={13} className="text-gray-400" /> Reserved stock is unavailable for other assignments until released.</span>
              </>
            )}
            {subTab === "repair" && (
              <>
                <span className="font-semibold text-gray-800">{kpis.repair} assets under repair · {tabItems.length} records shown</span>
                <span className="text-gray-300">|</span>
                <span className="inline-flex items-center gap-1"><Info size={13} className="text-gray-400" /> Assets remain unavailable until repair completion and inspection.</span>
              </>
            )}
            {subTab === "activity" && (
              <>
                <span className="font-semibold text-gray-800">{filteredActivities.length} events · Last 7 days</span>
                <span className="text-gray-300">|</span>
                <span className="inline-flex items-center gap-1"><Info size={13} className="text-gray-400" /> Activity records show who changed what and when.</span>
              </>
            )}
          </div>
        </div>

        {/* ── Table ─────────────────────────────────────────────────────────────── */}
        <div className="overflow-x-auto">
          {subTab !== "activity" ? (
            <table className="w-full min-w-[980px] table-fixed text-xs">
              {subTab === "reserved" ? (
                <colgroup>
                  <col className="w-[44px]" />
                  <col className="w-[22%]" />
                  <col className="w-[20%]" />
                  <col className="w-[9%]" />
                  <col className="w-[14%]" />
                  <col className="w-[12%]" />
                  <col className="w-[11%]" />
                  <col className="w-[12%]" />
                </colgroup>
              ) : (
                <colgroup>
                  <col className="w-[44px]" />
                  <col className="w-[22%]" />
                  <col className="w-[15%]" />
                  <col className="w-[15%]" />
                  <col className="w-[12%]" />
                  <col className="w-[12%]" />
                  <col className="w-[12%]" />
                  <col className="w-[12%]" />
                </colgroup>
              )}
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/70 text-[11px] font-semibold text-gray-600">
                  <th className="pl-5 pr-2 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={pagedItems.length > 0 && pagedItems.every((i) => selectedIds.has(i.id))}
                      onChange={(e) => toggleAllVisible(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </th>
                  {subTab === "available" && (
                    <>
                      <th className="px-4 py-3 text-left">Item / Asset ID</th>
                      <th className="px-4 py-3 text-left">Type</th>
                      <th className="px-4 py-3 text-left">Location</th>
                      <th className="px-4 py-3 text-left">Available</th>
                      <th className="px-4 py-3 text-left">Condition</th>
                      <th className="px-4 py-3 text-left">Idle For</th>
                      <th className="pl-4 pr-8 py-3 text-left">Action</th>
                    </>
                  )}
                  {subTab === "assigned" && (
                    <>
                      <th className="px-4 py-3 text-left">Item / Asset ID</th>
                      <th className="px-4 py-3 text-left">Assigned To</th>
                      <th className="px-4 py-3 text-left">Department</th>
                      <th className="px-4 py-3 text-left">Location</th>
                      <th className="px-4 py-3 text-left">Assigned On</th>
                      <th className="px-4 py-3 text-left">Usage Status</th>
                      <th className="pl-4 pr-8 py-3 text-left">Action</th>
                    </>
                  )}
                  {subTab === "reserved" && (
                    <>
                      <th className="px-4 py-3 text-left">Item / Reservation ID</th>
                      <th className="px-4 py-3 text-left">Reserved For</th>
                      <th className="px-4 py-3 text-left">Qty</th>
                      <th className="px-4 py-3 text-left">Location</th>
                      <th className="px-4 py-3 text-left">Reserved Until</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="pl-4 pr-8 py-3 text-left">Action</th>
                    </>
                  )}
                  {subTab === "repair" && (
                    <>
                      <th className="px-4 py-3 text-left">Asset / Repair ID</th>
                      <th className="px-4 py-3 text-left">Reported Issue</th>
                      <th className="px-4 py-3 text-left">Repair Provider</th>
                      <th className="px-4 py-3 text-left">Sent On</th>
                      <th className="px-4 py-3 text-left">Expected Return</th>
                      <th className="px-4 py-3 text-left">Repair Status</th>
                      <th className="pl-4 pr-8 py-3 text-left">Action</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {pagedItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                      No matching inventory records found.
                    </td>
                  </tr>
                ) : (
                  pagedItems.map((item) => {
                    const isSelected = selectedAsset?.id === item.id;
                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedAssetId(item.id)}
                        className={`border-b border-gray-100 cursor-pointer transition-colors ${isSelected ? "bg-blue-50/50" : "hover:bg-gray-50/70"
                          }`}
                      >
                        <td className="pl-5 pr-2 py-2.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(item.id)}
                            onChange={() => toggleRow(item.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gray-100">
                              <AssetIcon item={item} size={14} />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{item.name}</p>
                              <p className="text-[11px] text-gray-500">
                                {subTab === "reserved"
                                  ? item.reservationId || item.assetId
                                  : subTab === "repair"
                                    ? item.repairId || item.assetId
                                    : subTab === "assigned" && item.type !== "Physical Asset"
                                      ? `${item.assetId} · ${item.quantity} ${item.unitLabel}`
                                      : item.assetId}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Available columns */}
                        {subTab === "available" && (
                          <>
                            <td className="px-4 py-2.5"><TypeBadge type={item.type} /></td>
                            <td className="px-4 py-2.5 text-gray-600">
                              <span className="inline-flex items-center gap-1">
                                {item.location === "Company-wide" ? <Users size={12} className="text-gray-400" /> : <MapPin size={12} className="text-gray-400" />}
                                {item.location}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 font-semibold text-gray-800">{item.quantity} {item.unitLabel}</td>
                            <td className="px-4 py-2.5"><ConditionBadge condition={item.condition} /></td>
                            <td className="px-4 py-2.5">
                              <span className={`inline-flex rounded-md px-2.5 py-0.5 text-[11px] font-semibold ${item.idleDays > 30 ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-700"
                                }`}>
                                {item.idleDays} days
                              </span>
                            </td>
                            <td className="pl-4 pr-8 py-2.5 text-left" onClick={(e) => e.stopPropagation()}>
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openAssignModal(item)}
                                  className="rounded-lg border border-blue-200 bg-white px-3.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-50"
                                >
                                  {actionLabelForAvailable(item)}
                                </button>
                                <RowActionsMenu
                                  onView={() => setDetailItem(item)}
                                  onTransfer={() => { setTransferLocation("Hyderabad · Store B"); setTransferModalItem(item); }}
                                  onRepair={() => {
                                    setRepairForm({
                                      reportedIssue: "",
                                      repairProvider: "Dell Service Centre",
                                      expectedReturn: "25 Nov 2026",
                                      repairStatus: "Awaiting Diagnosis",
                                    });
                                    setRepairModalItem(item);
                                  }}
                                />
                              </div>
                            </td>
                          </>
                        )}

                        {/* Assigned columns */}
                        {subTab === "assigned" && (
                          <>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <User size={13} className="text-gray-400 shrink-0" />
                                <div>
                                  <p className="font-semibold text-gray-800">{item.assignedTo}</p>
                                  <p className="text-[11px] text-gray-400">{item.employeeId}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-2.5"><DeptBadge dept={item.department} /></td>
                            <td className="px-4 py-2.5 text-gray-600">
                              <span className="inline-flex items-center gap-1">
                                <MapPin size={12} className="text-gray-400" /> {item.location}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-gray-700">{item.assignedOn}</td>
                            <td className="px-4 py-2.5">
                              <span className={`inline-flex rounded-md px-2.5 py-0.5 text-[11px] font-semibold ${item.usageStatus === "Issued" ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"
                                }`}>
                                {item.usageStatus || "In Use"}
                              </span>
                            </td>
                            <td className="pl-4 pr-8 py-2.5 text-left" onClick={(e) => e.stopPropagation()}>
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (item.type === "Consumable") setDetailItem(item);
                                    else setReturnModalItem(item);
                                  }}
                                  className="rounded-lg border border-blue-200 bg-white px-3.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-50"
                                >
                                  {actionLabelForAssigned(item)}
                                </button>
                                <RowActionsMenu
                                  onView={() => setDetailItem(item)}
                                  onTransfer={() => { setTransferLocation("Hyderabad"); setTransferModalItem(item); }}
                                />
                              </div>
                            </td>
                          </>
                        )}

                        {/* Reserved columns */}
                        {subTab === "reserved" && (
                          <>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <User size={13} className="text-gray-400 shrink-0" />
                                <span className="font-semibold text-gray-800">{item.reservedFor}</span>
                                <DeptBadge dept={item.department} />
                              </div>
                            </td>
                            <td className="px-4 py-2.5 font-semibold text-gray-800">{item.quantity} {item.unitLabel}</td>
                            <td className="px-4 py-2.5 text-gray-600">
                              <span className="inline-flex items-center gap-1">
                                <MapPin size={12} className="text-gray-400" /> {item.location}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-gray-700">{item.reservedUntil}</td>
                            <td className="px-4 py-2.5">
                              <span className={`inline-flex rounded-md px-2.5 py-0.5 text-[11px] font-semibold ${item.reservationStatus === "Expiring Soon"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-purple-50 text-purple-700"
                                }`}>
                                {item.reservationStatus || "Reserved"}
                              </span>
                            </td>
                            <td className="pl-4 pr-8 py-2.5 text-left" onClick={(e) => e.stopPropagation()}>
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openAssignModal(item, item.reservedFor)}
                                  className="rounded-lg border border-blue-200 bg-white px-3.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-50"
                                >
                                  {actionLabelForAvailable(item)}
                                </button>
                                <RowActionsMenu
                                  onView={() => setDetailItem(item)}
                                  onRelease={() => handleReleaseReservation(item)}
                                />
                              </div>
                            </td>
                          </>
                        )}

                        {/* Under Repair columns */}
                        {subTab === "repair" && (
                          <>
                            <td className="px-4 py-2.5 text-gray-700">{item.reportedIssue}</td>
                            <td className="px-4 py-2.5 text-gray-700">{item.repairProvider}</td>
                            <td className="px-4 py-2.5 text-gray-600">{item.sentOn}</td>
                            <td className="px-4 py-2.5">
                              <span className="text-gray-700">{item.expectedReturn}</span>
                              {item.repairOverdue && (
                                <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                                  Overdue
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2.5"><RepairStatusBadge status={item.repairStatus} /></td>
                            <td className="pl-4 pr-8 py-2.5 text-left" onClick={(e) => e.stopPropagation()}>
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (item.repairStatus === "Ready for Collection") {
                                      handleCompleteRepair(item);
                                    } else {
                                      setRepairForm({
                                        reportedIssue: item.reportedIssue || "",
                                        repairProvider: item.repairProvider || "Dell Service Centre",
                                        expectedReturn: item.expectedReturn || "25 Nov 2026",
                                        repairStatus: item.repairStatus || "In Progress",
                                      });
                                      setRepairModalItem(item);
                                    }
                                  }}
                                  className="rounded-lg border border-blue-200 bg-white px-3.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-50"
                                >
                                  {item.repairStatus === "Ready for Collection" ? "Receive" : "Update"}
                                </button>
                                <RowActionsMenu
                                  onView={() => setDetailItem(item)}
                                  onCompleteRepair={() => handleCompleteRepair(item)}
                                />
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            /* Activity Table */
            <table className="w-full min-w-[980px] table-fixed text-xs">
              <colgroup>
                <col className="w-[17%]" />
                <col className="w-[21%]" />
                <col className="w-[13%]" />
                <col className="w-[23%]" />
                <col className="w-[13%]" />
                <col className="w-[13%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/70 text-[11px] font-semibold text-gray-600">
                  <th className="pl-5 pr-4 py-3 text-left">Date &amp; Time</th>
                  <th className="px-4 py-3 text-left">Item / Event ID</th>
                  <th className="px-4 py-3 text-left">Event</th>
                  <th className="px-4 py-3 text-left">Change / Details</th>
                  <th className="px-4 py-3 text-left">Performed By</th>
                  <th className="pl-4 pr-8 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {pagedActivities.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      No matching activity events found.
                    </td>
                  </tr>
                ) : (
                  pagedActivities.map((act) => {
                    const isSelected = selectedEvent?.id === act.id;
                    return (
                      <tr
                        key={act.id}
                        onClick={() => setSelectedEventId(act.id)}
                        className={`border-b border-gray-100 cursor-pointer transition-colors ${isSelected ? "bg-blue-50/50" : "hover:bg-gray-50/70"
                          }`}
                      >
                        <td className="pl-5 pr-4 py-2.5 text-gray-600">
                          <span className="inline-flex items-center gap-2">
                            <Calendar size={13} className="text-gray-400" />
                            {act.dateTime.replace(" · ", " / ")}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gray-100">
                              <AssetIcon item={{ name: act.itemName, type: act.assetType, category: "" }} size={14} />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{act.itemName}</p>
                              <p className="text-[11px] text-gray-500">{act.eventId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2.5"><EventBadge event={act.event} /></td>
                        <td className="px-4 py-2.5 text-gray-700">{act.details}</td>
                        <td className="px-4 py-2.5">
                          <p className="font-semibold text-gray-800">{act.performedBy}</p>
                          <p className="text-[11px] text-gray-400">{act.performedByRole}</p>
                        </td>
                        <td className="pl-4 pr-8 py-2.5 text-left" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setDetailEvent(act)}
                            className="rounded-lg border border-blue-200 bg-white px-3.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-50"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Bulk Actions + Pagination Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-xs text-gray-600 bg-white">
          <div className="flex flex-wrap items-center gap-2">
            {subTab === "activity" ? (
              <span>Showing {totalRows === 0 ? 0 : startIdx + 1}–{Math.min(startIdx + rowsPerPage, totalRows)} of {totalRows} events</span>
            ) : (
              <>
                <span className="text-gray-500 font-medium">Bulk actions:</span>
                {subTab === "available" && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const first = tabItems.find((i) => selectedIds.has(i.id));
                        if (!first) toast.info("Select at least one item");
                        else setAssignModalItem(first);
                      }}
                      className="font-semibold text-blue-600 hover:underline"
                    >
                      Assign
                    </button>
                    <span className="text-gray-300">·</span>
                    <button
                      type="button"
                      onClick={() => {
                        const first = tabItems.find((i) => selectedIds.has(i.id));
                        if (!first) toast.info("Select at least one item");
                        else setTransferModalItem(first);
                      }}
                      className="font-semibold text-blue-600 hover:underline"
                    >
                      Transfer location
                    </button>
                    <span className="text-gray-300">·</span>
                  </>
                )}
                {subTab === "assigned" && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const first = tabItems.find((i) => selectedIds.has(i.id));
                        if (!first) toast.info("Select at least one item");
                        else setAssignModalItem(first);
                      }}
                      className="font-semibold text-blue-600 hover:underline"
                    >
                      Reassign
                    </button>
                    <span className="text-gray-300">·</span>
                  </>
                )}
                {subTab === "reserved" && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const first = tabItems.find((i) => selectedIds.has(i.id));
                        if (!first) toast.info("Select at least one reservation");
                        else handleReleaseReservation(first);
                      }}
                      className="font-semibold text-blue-600 hover:underline"
                    >
                      Release reservations
                    </button>
                    <span className="text-gray-300">·</span>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => handleExportCurrent(true)}
                  className="font-semibold text-blue-600 hover:underline"
                >
                  Export selected
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500">Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
                className="rounded border border-gray-200 bg-white px-2 py-1 text-xs"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            <span className="text-gray-500">
              {totalRows === 0 ? "0" : `${startIdx + 1}–${Math.min(startIdx + rowsPerPage, totalRows)}`} of {totalRows}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded border border-gray-200 p-1 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="rounded bg-blue-50 px-2.5 py-1 font-semibold text-blue-700">{safePage}</span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded border border-gray-200 p-1 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Selected Asset / Event Card ─────────────────────────────────── */}
      {subTab !== "activity" && selectedAsset && (
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-2xs space-y-3">
          <p className="text-xs font-bold text-gray-900">Selected Asset</p>
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                <AssetIcon item={selectedAsset} size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-gray-900">{selectedAsset.name}</p>
                  {subTab === "assigned" && (
                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      {selectedAsset.usageStatus || "In Use"}
                    </span>
                  )}
                  {subTab === "reserved" && (
                    <span className="rounded bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                      Reserved
                    </span>
                  )}
                  {subTab === "repair" && (
                    <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                      Under Repair
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">{selectedAsset.assetId}</p>
              </div>
            </div>

            {subTab === "available" && (
              <>
                <DetailStat label="Type" value={selectedAsset.type} />
                <DetailStat label="Location" value={selectedAsset.location} />
                <div className="text-xs">
                  <span className="text-gray-400">Status: </span>
                  <span className="rounded bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">Available</span>
                </div>
                <div className="text-xs">
                  <span className="text-gray-400">Idle For: </span>
                  <span className="rounded bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">{selectedAsset.idleDays} days</span>
                </div>
                <ConditionBadge condition={selectedAsset.condition} />
              </>
            )}

            {subTab === "assigned" && (
              <>
                <DetailStat label="Assigned To" value={selectedAsset.assignedTo || "—"} sub={selectedAsset.employeeId} />
                <DetailStat label="Department" value={selectedAsset.department || "—"} />
                <DetailStat label="Location" value={selectedAsset.location} />
                <DetailStat label="Assigned On" value={selectedAsset.assignedOn || "—"} />
                <div>
                  <p className="text-[10px] text-gray-400">Condition:</p>
                  <ConditionBadge condition={selectedAsset.condition} />
                </div>
              </>
            )}

            {subTab === "reserved" && (
              <>
                <DetailStat label="Reservation" value={selectedAsset.reservationId || "—"} />
                <DetailStat label="Reserved For" value={`${selectedAsset.reservedFor || "—"} / ${selectedAsset.department || "—"}`} />
                <DetailStat label="Reserved By" value={selectedAsset.reservedBy || actorName} />
                <DetailStat label="Location" value={selectedAsset.location} />
                <DetailStat label="Reserved Until" value={selectedAsset.reservedUntil || "—"} />
              </>
            )}

            {subTab === "repair" && (
              <>
                <DetailStat label="Repair ID" value={selectedAsset.repairId || "—"} />
                <DetailStat label="Provider" value={selectedAsset.repairProvider || "—"} />
                <DetailStat label="Sent On" value={selectedAsset.sentOn || "—"} />
                <DetailStat label="Expected Return" value={selectedAsset.expectedReturn || "—"} badge={selectedAsset.repairOverdue ? "Overdue" : undefined} />
                <DetailStat label="Warranty" value={selectedAsset.warranty || "In Warranty"} />
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <p className="inline-flex items-center gap-1.5 text-gray-500">
              <Info size={13} className="text-gray-400" />
              {subTab === "available" && "Assignment history and serial numbers available in item details."}
              {subTab === "assigned" && "Return records the condition and moves this asset back to available stock."}
              {subTab === "reserved" && `Purpose: ${selectedAsset.reservationPurpose || "Upcoming assignment"} · Releasing this reservation returns the asset to available stock.`}
              {subTab === "repair" && `Issue: ${selectedAsset.reportedIssue || "Hardware check"} · Inspect the asset before returning it to available stock.`}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setDetailItem(selectedAsset)}
                className="font-semibold text-blue-600 hover:underline mr-1"
              >
                {subTab === "repair" ? "View Repair Details →" : "View Item Details →"}
              </button>

              {subTab === "assigned" && (
                <>
                  <button
                    type="button"
                    onClick={() => openAssignModal(selectedAsset)}
                    className="rounded-lg border border-gray-200 bg-white px-3.5 py-1.5 font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Reassign
                  </button>
                  <button
                    type="button"
                    onClick={() => setReturnModalItem(selectedAsset)}
                    className="rounded-lg bg-blue-600 px-4 py-1.5 font-semibold text-white hover:bg-blue-700"
                  >
                    Record Return
                  </button>
                </>
              )}

              {subTab === "reserved" && (
                <>
                  <button
                    type="button"
                    onClick={() => handleReleaseReservation(selectedAsset)}
                    className="rounded-lg border border-gray-200 bg-white px-3.5 py-1.5 font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Release Reservation
                  </button>
                  <button
                    type="button"
                    onClick={() => openAssignModal(selectedAsset, selectedAsset.reservedFor)}
                    className="rounded-lg bg-blue-600 px-4 py-1.5 font-semibold text-white hover:bg-blue-700"
                  >
                    Assign Now
                  </button>
                </>
              )}

              {subTab === "repair" && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setRepairForm({
                        reportedIssue: selectedAsset.reportedIssue || "",
                        repairProvider: selectedAsset.repairProvider || "Dell Service Centre",
                        expectedReturn: selectedAsset.expectedReturn || "25 Nov 2026",
                        repairStatus: selectedAsset.repairStatus || "In Progress",
                      });
                      setRepairModalItem(selectedAsset);
                    }}
                    className="rounded-lg border border-gray-200 bg-white px-3.5 py-1.5 font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Update Repair
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCompleteRepair(selectedAsset)}
                    className="rounded-lg bg-blue-600 px-4 py-1.5 font-semibold text-white hover:bg-blue-700"
                  >
                    Complete Repair
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {subTab === "activity" && selectedEvent && (
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-2xs space-y-3">
          <p className="text-xs font-bold text-gray-900">Selected Event</p>
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                <AssetIcon item={{ name: selectedEvent.itemName, type: selectedEvent.assetType, category: "" }} size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-gray-900">{selectedEvent.itemName}</p>
                  <EventBadge event={selectedEvent.event} />
                </div>
                <p className="text-xs text-gray-500">{selectedEvent.assetId}</p>
              </div>
            </div>
            <DetailStat label="Event ID" value={selectedEvent.eventId} />
            <DetailStat label="Performed By" value={selectedEvent.performedBy} />
            <DetailStat label="Date & Time" value={selectedEvent.dateTime} />
            <DetailStat label="Previous Status" value={selectedEvent.previousStatus} />
            <DetailStat label="New Status" value={selectedEvent.newStatus} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <p className="inline-flex items-center gap-1.5 text-gray-500">
              <Info size={13} className="text-gray-400" />
              {selectedEvent.summaryNote}
            </p>
            <button
              type="button"
              onClick={() => setDetailEvent(selectedEvent)}
              className="font-semibold text-blue-600 hover:underline"
            >
              View Asset Details →
            </button>
          </div>
        </div>
      )}

      {/* ── Add Inventory Modal ────────────────────────────────────────────────── */}
      {showAddModal && (
        <ModalShell title="Add Inventory" onClose={() => setShowAddModal(false)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-gray-600 mb-1">Item Name *</label>
              <select
                value={addForm.productKey}
                onChange={(e) => handleSelectCatalogProduct(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 focus:border-blue-400 focus:outline-none"
              >
                <option value="">
                  {clientProducts.length > 0
                    ? "Select product from client catalog…"
                    : "No products added to this client catalog"}
                </option>
                {clientProducts.map((p) => {
                  const key = p.cpc || p.productCode || p.sku || p.name;
                  return (
                    <option key={key} value={key}>
                      {p.name}{p.cpc || p.sku ? ` (${p.cpc || p.sku})` : ""}
                    </option>
                  );
                })}
              </select>
              {addForm.productKey && (
                <p className="mt-1 text-[11px] text-gray-500">
                  {[addForm.brand, addForm.category, addForm.warranty].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
            <div>
              <label className="block font-semibold text-gray-600 mb-1">Type</label>
              <select
                value={addForm.type}
                onChange={(e) => setAddForm({ ...addForm, type: e.target.value as InventoryAssetType })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs"
              >
                <option value="Physical Asset">Physical Asset</option>
                <option value="Digital License">Digital License</option>
                <option value="Consumable">Consumable</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-gray-600 mb-1">Category</label>
              <input
                value={addForm.category}
                onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-600 mb-1">Serial / License Key</label>
              <input
                value={addForm.serialNumber}
                onChange={(e) => setAddForm({ ...addForm, serialNumber: e.target.value })}
                placeholder="Auto-generated if blank"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-600 mb-1">Location</label>
              <input
                value={addForm.location}
                onChange={(e) => setAddForm({ ...addForm, location: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-600 mb-1">Quantity / Seats</label>
              <input
                type="number"
                min={1}
                value={addForm.quantity}
                onChange={(e) => setAddForm({ ...addForm, quantity: Math.max(1, Number(e.target.value) || 1) })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-600 mb-1">Condition</label>
              <select
                value={addForm.condition}
                onChange={(e) => setAddForm({ ...addForm, condition: e.target.value as "New" | "Good" | "Active" | "Fair" })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs"
              >
                <option value="New">New</option>
                <option value="Good">Good</option>
                <option value="Active">Active</option>
                <option value="Fair">Fair</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setShowAddModal(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600">
              Cancel
            </button>
            <button type="button" onClick={handleAddInventory} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700">
              Add Inventory
            </button>
          </div>
        </ModalShell>
      )}

      {/* ── Assign / Allocate Modal ────────────────────────────────────────────── */}
      {assignModalItem && (
        <ModalShell title={`${actionLabelForAvailable(assignModalItem)} — ${assignModalItem.name}`} onClose={() => setAssignModalItem(null)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-gray-600 mb-1">Recipient Name *</label>
              <select
                value={assignForm.userId}
                onChange={(e) => handleRecipientUserChange(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 focus:border-blue-400 focus:outline-none"
              >
                <option value="">
                  {clientUsers.length > 0 ? "Select client user…" : "No client users found"}
                </option>
                {clientUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}{u.role ? ` — ${u.role}` : ""}
                  </option>
                ))}
              </select>
              {assignForm.email && (
                <p className="mt-1 text-[11px] text-gray-500">
                  {assignForm.role ? `${assignForm.role} · ` : ""}{assignForm.email}
                </p>
              )}
            </div>
            <div>
              <label className="block font-semibold text-gray-600 mb-1">Employee ID</label>
              <input
                value={assignForm.employeeId}
                onChange={(e) => setAssignForm({ ...assignForm, employeeId: e.target.value })}
                placeholder="Auto-filled on user selection"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs bg-gray-50/50"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-600 mb-1">Department</label>
              <select
                value={assignForm.department}
                onChange={(e) => setAssignForm({ ...assignForm, department: e.target.value })}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs"
              >
                {Array.from(new Set(["IT", "Finance", "Sales", "Operations", "Support", assignForm.department].filter(Boolean))).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-gray-600 mb-1">Location</label>
              <input
                value={assignForm.location}
                onChange={(e) => setAssignForm({ ...assignForm, location: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setAssignModalItem(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600">
              Cancel
            </button>
            <button type="button" onClick={handleConfirmAssign} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700">
              Confirm {actionLabelForAvailable(assignModalItem)}
            </button>
          </div>
        </ModalShell>
      )}

      {/* ── Return Modal ───────────────────────────────────────────────────────── */}
      {returnModalItem && (
        <ModalShell title={`Record Return — ${returnModalItem.name}`} onClose={() => setReturnModalItem(null)}>
          <div className="space-y-3 text-xs">
            <p className="text-gray-600">
              Returning <strong>{returnModalItem.assetId}</strong> from <strong>{returnModalItem.assignedTo}</strong>.
            </p>
            <div>
              <label className="block font-semibold text-gray-600 mb-1">Returned Condition</label>
              <select
                value={returnCondition}
                onChange={(e) => setReturnCondition(e.target.value as "Good" | "New" | "Fair")}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs"
              >
                <option value="Good">Good</option>
                <option value="New">New</option>
                <option value="Fair">Fair</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setReturnModalItem(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600">
              Cancel
            </button>
            <button type="button" onClick={handleConfirmReturn} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700">
              Record Return
            </button>
          </div>
        </ModalShell>
      )}

      {/* ── Transfer Location Modal ────────────────────────────────────────────── */}
      {transferModalItem && (
        <ModalShell title={`Transfer Location — ${transferModalItem.name}`} onClose={() => setTransferModalItem(null)}>
          <div className="space-y-3 text-xs">
            <p className="text-gray-600">Current Location: <strong>{transferModalItem.location}</strong></p>
            <div>
              <label className="block font-semibold text-gray-600 mb-1">New Location</label>
              <input
                value={transferLocation}
                onChange={(e) => setTransferLocation(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setTransferModalItem(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600">
              Cancel
            </button>
            <button type="button" onClick={handleConfirmTransfer} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700">
              Confirm Transfer
            </button>
          </div>
        </ModalShell>
      )}

      {/* ── Update / Send to Repair Modal ──────────────────────────────────────── */}
      {repairModalItem && (
        <ModalShell title={`Repair Details — ${repairModalItem.name}`} onClose={() => setRepairModalItem(null)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-gray-600 mb-1">Reported Issue</label>
              <input
                value={repairForm.reportedIssue}
                onChange={(e) => setRepairForm({ ...repairForm, reportedIssue: e.target.value })}
                placeholder="e.g. Battery not charging"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-600 mb-1">Repair Provider</label>
              <input
                value={repairForm.repairProvider}
                onChange={(e) => setRepairForm({ ...repairForm, repairProvider: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-600 mb-1">Expected Return</label>
              <input
                value={repairForm.expectedReturn}
                onChange={(e) => setRepairForm({ ...repairForm, expectedReturn: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-gray-600 mb-1">Repair Status</label>
              <select
                value={repairForm.repairStatus}
                onChange={(e) => setRepairForm({ ...repairForm, repairStatus: e.target.value as RepairStatus })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs"
              >
                <option value="Awaiting Diagnosis">Awaiting Diagnosis</option>
                <option value="Awaiting Parts">Awaiting Parts</option>
                <option value="In Progress">In Progress</option>
                <option value="Ready for Collection">Ready for Collection</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setRepairModalItem(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600">
              Cancel
            </button>
            <button type="button" onClick={handleConfirmRepair} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700">
              Save Repair Update
            </button>
          </div>
        </ModalShell>
      )}

      {/* ── Item Details Modal ─────────────────────────────────────────────────── */}
      {detailItem && (
        <ModalShell title={`Item Details — ${detailItem.name}`} onClose={() => setDetailItem(null)}>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <DetailRow label="Asset ID" value={detailItem.assetId} />
            <DetailRow label="Type" value={detailItem.type} />
            <DetailRow label="Category" value={detailItem.category} />
            <DetailRow label="Serial Number" value={detailItem.serialNumber} />
            <DetailRow label="Location" value={detailItem.location} />
            <DetailRow label="Quantity" value={`${detailItem.quantity} ${detailItem.unitLabel}`} />
            <DetailRow label="Condition" value={detailItem.condition} />
            <DetailRow label="Warranty" value={detailItem.warranty || "N/A"} />
            {detailItem.assignedTo && <DetailRow label="Assigned To" value={`${detailItem.assignedTo} (${detailItem.employeeId || ""})`} />}
            {detailItem.reservedFor && <DetailRow label="Reserved For" value={`${detailItem.reservedFor} (Until ${detailItem.reservedUntil})`} />}
            {detailItem.repairId && <DetailRow label="Repair ID" value={`${detailItem.repairId} · ${detailItem.repairStatus}`} />}
          </div>
          <div className="mt-4 flex justify-end">
            <button type="button" onClick={() => setDetailItem(null)} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white">
              Close
            </button>
          </div>
        </ModalShell>
      )}

      {/* ── Event Details Modal ────────────────────────────────────────────────── */}
      {detailEvent && (
        <ModalShell title={`Event Details — ${detailEvent.eventId}`} onClose={() => setDetailEvent(null)}>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <DetailRow label="Item" value={detailEvent.itemName} />
            <DetailRow label="Asset ID" value={detailEvent.assetId} />
            <DetailRow label="Event" value={detailEvent.event} />
            <DetailRow label="Date & Time" value={detailEvent.dateTime} />
            <DetailRow label="Performed By" value={`${detailEvent.performedBy} (${detailEvent.performedByRole})`} />
            <DetailRow label="Location" value={detailEvent.location} />
            <DetailRow label="Previous Status" value={detailEvent.previousStatus} />
            <DetailRow label="New Status" value={detailEvent.newStatus} />
            <div className="col-span-2">
              <DetailRow label="Summary" value={detailEvent.summaryNote} />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button type="button" onClick={() => setDetailEvent(null)} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white">
              Close
            </button>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

function DetailStat({ label, value, sub, badge }: { label: string; value: string; sub?: string; badge?: string }) {
  return (
    <div className="text-xs">
      <p className="text-[10px] text-gray-400">{label}:</p>
      <div className="flex items-center gap-1.5">
        <p className="font-semibold text-gray-900">{value}</p>
        {badge && (
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">{badge}</span>
        )}
      </div>
      {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2">
      <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-0.5 font-semibold text-gray-800">{value}</p>
    </div>
  );
}

function RowActionsMenu({
  onView,
  onTransfer,
  onRepair,
  onRelease,
  onCompleteRepair,
}: {
  onView: () => void;
  onTransfer?: () => void;
  onRepair?: () => void;
  onRelease?: () => void;
  onCompleteRepair?: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
          <MoreVertical size={14} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 text-xs">
        <DropdownMenuItem onSelect={onView}>View Details</DropdownMenuItem>
        {onTransfer && <DropdownMenuItem onSelect={onTransfer}>Transfer Location</DropdownMenuItem>}
        {onRepair && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onRepair}>Send to Repair</DropdownMenuItem>
          </>
        )}
        {onRelease && <DropdownMenuItem onSelect={onRelease}>Release Reservation</DropdownMenuItem>}
        {onCompleteRepair && <DropdownMenuItem onSelect={onCompleteRepair}>Complete Repair</DropdownMenuItem>}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          <button type="button" onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

