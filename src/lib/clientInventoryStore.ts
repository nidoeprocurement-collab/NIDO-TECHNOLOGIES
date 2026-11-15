import { safeReadJson } from "@/lib/utils";
import type { MyOrder } from "@/contexts/MyOrdersContext";
import type { PortalUser } from "@/lib/portalUserStore";
import type { StoredServiceRequest } from "@/lib/serviceRequestsStore";
import type { StoredClient } from "@/lib/clientStore";
import { isDigitalOnlyType } from "@/lib/productTypeRules";

export type InventoryAssetType = "Physical Asset" | "Digital License" | "Consumable";
export type InventoryStatus = "available" | "assigned" | "reserved" | "repair";
export type RepairStatus =
  | "Awaiting Diagnosis"
  | "Awaiting Parts"
  | "In Progress"
  | "Ready for Collection";
export type ActivityCategory =
  | "Assignments"
  | "Returns"
  | "Reservations"
  | "Transfers"
  | "Repairs";

export interface InventoryItemRecord {
  id: string;
  sourceKey?: string;
  assetId: string;
  name: string;
  type: InventoryAssetType;
  category: string;
  serialNumber: string;
  location: string;
  quantity: number;
  unitLabel: string;
  condition: "New" | "Good" | "Active" | "Fair";
  status: InventoryStatus;
  idleDays: number;
  createdAtTs?: number;
  warranty?: string;

  // Assigned fields
  assignedTo?: string;
  employeeId?: string;
  department?: string;
  assignedOn?: string;
  usageStatus?: "In Use" | "Active" | "Issued";

  // Reserved fields
  reservationId?: string;
  reservedFor?: string;
  reservedBy?: string;
  reservedUntil?: string;
  reservationPurpose?: string;
  reservationStatus?: "Reserved" | "Expiring Soon";

  // Repair fields
  repairId?: string;
  reportedIssue?: string;
  repairProvider?: string;
  sentOn?: string;
  expectedReturn?: string;
  repairOverdue?: boolean;
  repairStatus?: RepairStatus;
}

export interface InventoryActivityRecord {
  id: string;
  sourceKey?: string;
  eventId: string;
  dateTime: string;
  itemName: string;
  assetId: string;
  assetType: InventoryAssetType;
  location: string;
  event:
    | "Returned"
    | "Allocated"
    | "Transferred"
    | "Reserved"
    | "Repair Updated"
    | "Issued"
    | "Assigned"
    | "Added"
    | "Repair Completed";
  category: ActivityCategory;
  details: string;
  performedBy: string;
  performedByRole: string;
  previousStatus: string;
  newStatus: string;
  summaryNote: string;
}

export interface ClientInventoryData {
  items: InventoryItemRecord[];
  activities: InventoryActivityRecord[];
}

const STORAGE_PREFIX = "nido_client_inventory_v2_";

const FULFILLED_ORDER_STATUSES = new Set([
  "Delivered",
  "Partially Delivered",
  "Activated",
  "Provisioned",
  "Completed",
]);

function mapAssetType(rawType?: string): InventoryAssetType {
  if (!rawType) return "Physical Asset";
  if (isDigitalOnlyType(rawType)) return "Digital License";
  if (rawType.toLowerCase().includes("consumable")) return "Consumable";
  return "Physical Asset";
}

function mapUnitLabel(type: InventoryAssetType, qty: number): string {
  if (type === "Digital License") return qty === 1 ? "seat" : "seats";
  return qty === 1 ? "unit" : "units";
}

function computeIdleDays(dateStr?: string): number {
  if (!dateStr) return 0;
  const parsed = Date.parse(dateStr);
  if (!Number.isFinite(parsed)) return 0;
  const diff = Math.floor((Date.now() - parsed) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

function mapServiceStatusToRepairStatus(status?: string): RepairStatus {
  const s = (status || "").toLowerCase();
  if (s.includes("ready") || s.includes("collect")) return "Ready for Collection";
  if (s.includes("part") || s.includes("wait")) return "Awaiting Parts";
  if (s.includes("progress") || s.includes("active") || s.includes("diagnos") === false && s.includes("open")) {
    return "In Progress";
  }
  return "Awaiting Diagnosis";
}

export function getClientInventory(clientId: string): ClientInventoryData {
  const key = `${STORAGE_PREFIX}${clientId}`;
  const stored = safeReadJson<ClientInventoryData | null>(key, null);
  if (stored && Array.isArray(stored.items) && Array.isArray(stored.activities)) {
    return stored;
  }
  return { items: [], activities: [] };
}

export function saveClientInventory(clientId: string, data: ClientInventoryData): void {
  localStorage.setItem(`${STORAGE_PREFIX}${clientId}`, JSON.stringify(data));
}

/**
 * Merges live platform records (fulfilled client orders, user assigned devices,
 * and active repair service requests) into the client's inventory store without
 * overwriting any items already tracked or modified by the user.
 */
export function syncClientInventoryFromLiveSources(
  client: StoredClient,
  orders: MyOrder[],
  portalUsers: PortalUser[],
  serviceRequests: StoredServiceRequest[],
): ClientInventoryData {
  const current = getClientInventory(client.id);
  const existingKeys = new Set(current.items.map((i) => i.sourceKey).filter(Boolean));
  const existingActKeys = new Set(current.activities.map((a) => a.sourceKey).filter(Boolean));

  const addedItems: InventoryItemRecord[] = [];
  const addedActivities: InventoryActivityRecord[] = [];
  let seq = current.items.length + 1;
  let actSeq = current.activities.length + 1;

  const clientDefaultCity =
    client.billingCity || client.locationDetails?.city || "Head Office";

  // 1. Fulfilled / Delivered Client Orders -> Available stock
  const clientOrders = orders.filter((order) => {
    const matchesClient =
      order.clientId === client.id ||
      (order.clientName || "").trim().toLowerCase() === client.name.trim().toLowerCase() ||
      (order.cartItems || []).some((c) => c.clientId === client.id);
    return matchesClient && FULFILLED_ORDER_STATUSES.has(order.status);
  });

  clientOrders.forEach((order) => {
    (order.cartItems || []).forEach((cartItem, idx) => {
      const sourceKey = `order:${order.id}:${cartItem.id ?? idx}`;
      if (existingKeys.has(sourceKey)) return;

      const assetType = mapAssetType(cartItem.physicalType || cartItem.productType);
      const prefix = assetType === "Digital License" ? "LIC" : assetType === "Consumable" ? "STK" : "AST";
      const assetId = `${prefix}-${String(seq++).padStart(5, "0")}`;
      const qty = Math.max(1, Number(cartItem.quantity) || 1);
      const location =
        assetType === "Digital License"
          ? "Company-wide"
          : order.deliveryDetails?.city || clientDefaultCity;

      const item: InventoryItemRecord = {
        id: `inv-ord-${order.id}-${idx}`,
        sourceKey,
        assetId,
        name: cartItem.name,
        type: assetType,
        category: cartItem.category || "General",
        serialNumber: cartItem.productCode || `${order.id}-${idx + 1}`,
        location,
        quantity: qty,
        unitLabel: mapUnitLabel(assetType, qty),
        condition: assetType === "Digital License" ? "Active" : "New",
        status: "available",
        idleDays: computeIdleDays(order.orderDate),
        createdAtTs: Date.parse(order.orderDate) || Date.now(),
        warranty: cartItem.commercialTerms?.warrantyPeriod || "In Warranty",
      };
      addedItems.push(item);

      const actKey = `act-${sourceKey}`;
      if (!existingActKeys.has(actKey)) {
        addedActivities.push({
          id: `act-${Date.now()}-${actSeq}`,
          sourceKey: actKey,
          eventId: `EVT-${String(actSeq++).padStart(5, "0")}`,
          dateTime: `${order.orderDate}${order.orderTime ? ` · ${order.orderTime}` : ""}`,
          itemName: item.name,
          assetId: item.assetId,
          assetType: item.type,
          location: item.location,
          event: "Added",
          category: "Assignments",
          details: `Order ${order.id} (${order.status}) · ${qty} ${item.unitLabel} added`,
          performedBy: order.requesterName || client.name,
          performedByRole: order.requesterRole || "Client User",
          previousStatus: order.status,
          newStatus: "Available",
          summaryNote: `Received from order ${order.id} · Location: ${location}`,
        });
      }
    });
  });

  // 2. Client Users' assigned devices -> Assigned / In Use
  portalUsers.forEach((user) => {
    const details = (user.details || {}) as Record<string, unknown>;
    const rawDevices = Array.isArray(details.assignedDevices) ? details.assignedDevices : [];
    rawDevices.forEach((dev, idx) => {
      const devName =
        typeof dev === "string"
          ? dev.trim()
          : dev && typeof dev === "object"
            ? String((dev as Record<string, unknown>).name || (dev as Record<string, unknown>).device || "").trim()
            : "";
      if (!devName) return;

      const sourceKey = `user-device:${user.id}:${idx}:${devName}`;
      if (existingKeys.has(sourceKey)) return;

      const assetId = `AST-${String(seq++).padStart(5, "0")}`;
      const empId = String(details.employeeId || "").trim() || `EMP-${user.id.slice(-4).toUpperCase()}`;
      const dept = String(details.department || "").trim() || "Operations";
      const loc =
        String(details.location || details.homeLocation || details.city || "").trim() || clientDefaultCity;

      const item: InventoryItemRecord = {
        id: `inv-usr-${user.id}-${idx}`,
        sourceKey,
        assetId,
        name: devName,
        type: "Physical Asset",
        category: "Assigned Equipment",
        serialNumber: `${assetId}-${empId}`,
        location: loc,
        quantity: 1,
        unitLabel: "unit",
        condition: "Good",
        status: "assigned",
        idleDays: 0,
        assignedTo: user.name,
        employeeId: empId,
        department: dept,
        assignedOn: formatTodayShort(),
        usageStatus: "In Use",
        warranty: "In Warranty",
      };
      addedItems.push(item);

      const actKey = `act-${sourceKey}`;
      if (!existingActKeys.has(actKey)) {
        addedActivities.push({
          id: `act-${Date.now()}-${actSeq}`,
          sourceKey: actKey,
          eventId: `EVT-${String(actSeq++).padStart(5, "0")}`,
          dateTime: formatNowDateTime(),
          itemName: item.name,
          assetId: item.assetId,
          assetType: item.type,
          location: loc,
          event: "Assigned",
          category: "Assignments",
          details: `Assigned to ${user.name} · ${dept}`,
          performedBy: user.name,
          performedByRole: user.role || "Client User",
          previousStatus: "Available",
          newStatus: "In Use",
          summaryNote: `Synced assigned device for ${user.name} (${empId})`,
        });
      }
    });
  });

  // 3. Active Repair Service Requests -> Under Repair
  const userEmails = new Set(portalUsers.map((u) => (u.email || "").toLowerCase()).filter(Boolean));
  const userNames = new Set(portalUsers.map((u) => u.name.toLowerCase()));
  const repairRequests = serviceRequests.filter((req) => {
    const matchesClient =
      req.clientId === client.id ||
      (req.requestedByEmail && userEmails.has(req.requestedByEmail.toLowerCase())) ||
      (req.requestedBy && userNames.has(req.requestedBy.toLowerCase()));
    const isRepair = (req.requestType || "").toLowerCase().includes("repair");
    const isClosed = ["completed", "cancelled", "closed"].includes((req.status || "").toLowerCase());
    return matchesClient && isRepair && !isClosed;
  });

  repairRequests.forEach((req) => {
    const sourceKey = `service:${req.id}`;
    if (existingKeys.has(sourceKey)) return;

    const payload = (req.payload || {}) as Record<string, unknown>;
    const repairStatus = mapServiceStatusToRepairStatus(req.status);
    const assetId = req.assetTag || `AST-${String(seq++).padStart(5, "0")}`;
    const item: InventoryItemRecord = {
      id: `inv-svc-${req.id}`,
      sourceKey,
      assetId,
      repairId: req.id,
      name: req.itemAsset || "Equipment Repair",
      type: "Physical Asset",
      category: String(payload.category || "Hardware"),
      serialNumber: req.assetTag || req.id,
      location: req.location || clientDefaultCity,
      quantity: 1,
      unitLabel: "unit",
      condition: "Fair",
      status: "repair",
      idleDays: 0,
      warranty: "In Warranty",
      reportedIssue: String(payload.issueDescription || payload.issue || req.requestType || "Repair requested"),
      repairProvider: req.assignedTo && req.assignedTo !== "Unassigned" ? req.assignedTo : "NIDO Service Desk",
      sentOn: req.requestDate,
      expectedReturn: req.nextAppointment || "TBD",
      repairStatus,
    };
    addedItems.push(item);

    const actKey = `act-${sourceKey}`;
    if (!existingActKeys.has(actKey)) {
      addedActivities.push({
        id: `act-${Date.now()}-${actSeq}`,
        sourceKey: actKey,
        eventId: `EVT-${String(actSeq++).padStart(5, "0")}`,
        dateTime: req.requestDate,
        itemName: item.name,
        assetId: item.assetId,
        assetType: "Physical Asset",
        location: item.location,
        event: "Repair Updated",
        category: "Repairs",
        details: `Service Request ${req.id} -> ${repairStatus}`,
        performedBy: req.requestedBy || client.name,
        performedByRole: "Client User",
        previousStatus: "In Use",
        newStatus: repairStatus,
        summaryNote: `Repair request ${req.id}: ${item.reportedIssue}`,
      });
    }
  });

  if (addedItems.length === 0 && addedActivities.length === 0) {
    return current;
  }

  const next: ClientInventoryData = {
    items: [...addedItems, ...current.items],
    activities: [...addedActivities, ...current.activities],
  };
  saveClientInventory(client.id, next);
  return next;
}

export function formatNowDateTime(): string {
  const now = new Date();
  const datePart = now.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timePart = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${datePart} · ${timePart}`;
}

export function formatTodayShort(): string {
  return new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
