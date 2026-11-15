import { safeReadJson } from "@/lib/utils";

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
  assetId: string;
  name: string;
  type: InventoryAssetType;
  category: string;
  serialNumber: string;
  location: string;
  quantity: number;
  unitLabel: string; // e.g., "unit", "units", "seat", "seats"
  condition: "New" | "Good" | "Active" | "Fair";
  status: InventoryStatus;
  idleDays: number;
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

const STORAGE_PREFIX = "nido_client_inventory_v1_";

function seedInventoryData(): ClientInventoryData {
  const items: InventoryItemRecord[] = [
    // ── Available / Unassigned ──
    {
      id: "inv-avail-1",
      assetId: "AST-00124",
      name: "Dell Latitude 5450",
      type: "Physical Asset",
      category: "Laptops",
      serialNumber: "DL5450-IND-9821",
      location: "Bengaluru · Store A",
      quantity: 1,
      unitLabel: "unit",
      condition: "Good",
      status: "available",
      idleDays: 45,
      warranty: "In Warranty",
    },
    {
      id: "inv-avail-2",
      assetId: "AST-00125",
      name: "HP ProBook 440",
      type: "Physical Asset",
      category: "Laptops",
      serialNumber: "HP440-IND-4412",
      location: "Bengaluru · Store A",
      quantity: 1,
      unitLabel: "unit",
      condition: "New",
      status: "available",
      idleDays: 12,
      warranty: "In Warranty",
    },
    {
      id: "inv-avail-3",
      assetId: "AST-00130",
      name: "Dell 24-inch Monitor",
      type: "Physical Asset",
      category: "Monitors",
      serialNumber: "DLM24-HYD-3109",
      location: "Hyderabad · Store B",
      quantity: 1,
      unitLabel: "unit",
      condition: "Good",
      status: "available",
      idleDays: 32,
      warranty: "In Warranty",
    },
    {
      id: "inv-avail-4",
      assetId: "LIC-00018",
      name: "Microsoft 365 Business Standard",
      type: "Digital License",
      category: "Productivity Software",
      serialNumber: "M365-BS-2026-018",
      location: "Company-wide",
      quantity: 12,
      unitLabel: "seats",
      condition: "Active",
      status: "available",
      idleDays: 18,
    },
    {
      id: "inv-avail-5",
      assetId: "STK-00042",
      name: "Logitech Wireless Mouse",
      type: "Consumable",
      category: "Peripherals",
      serialNumber: "LOGI-MX-0042",
      location: "Bengaluru · Store A",
      quantity: 20,
      unitLabel: "units",
      condition: "New",
      status: "available",
      idleDays: 9,
    },
    {
      id: "inv-avail-6",
      assetId: "AST-00148",
      name: "Samsung Galaxy S25",
      type: "Physical Asset",
      category: "Mobile Devices",
      serialNumber: "SGS25-BLR-7741",
      location: "Bengaluru · Store A",
      quantity: 1,
      unitLabel: "unit",
      condition: "Good",
      status: "available",
      idleDays: 38,
      warranty: "In Warranty",
    },
    {
      id: "inv-avail-7",
      assetId: "AST-00152",
      name: "Lenovo ThinkPad T14",
      type: "Physical Asset",
      category: "Laptops",
      serialNumber: "LNVT14-BLR-6620",
      location: "Bengaluru · Store A",
      quantity: 6,
      unitLabel: "units",
      condition: "Good",
      status: "available",
      idleDays: 34,
      warranty: "In Warranty",
    },

    // ── Assigned / In Use ──
    {
      id: "inv-asgn-1",
      assetId: "AST-00124",
      name: "Dell Latitude 5450",
      type: "Physical Asset",
      category: "Laptops",
      serialNumber: "DL5450-IND-9801",
      location: "Bengaluru",
      quantity: 1,
      unitLabel: "unit",
      condition: "Good",
      status: "assigned",
      idleDays: 0,
      assignedTo: "Priya Sharma",
      employeeId: "EMP-0102",
      department: "Finance",
      assignedOn: "02 Nov 2026",
      usageStatus: "In Use",
      warranty: "In Warranty",
    },
    {
      id: "inv-asgn-2",
      assetId: "AST-00125",
      name: "HP ProBook 440",
      type: "Physical Asset",
      category: "Laptops",
      serialNumber: "HP440-IND-4402",
      location: "Bengaluru",
      quantity: 1,
      unitLabel: "unit",
      condition: "Good",
      status: "assigned",
      idleDays: 0,
      assignedTo: "Rahul Mehta",
      employeeId: "EMP-0108",
      department: "Sales",
      assignedOn: "04 Nov 2026",
      usageStatus: "In Use",
      warranty: "In Warranty",
    },
    {
      id: "inv-asgn-3",
      assetId: "AST-00130",
      name: "Dell 24-inch Monitor",
      type: "Physical Asset",
      category: "Monitors",
      serialNumber: "DLM24-HYD-3102",
      location: "Hyderabad",
      quantity: 1,
      unitLabel: "unit",
      condition: "Good",
      status: "assigned",
      idleDays: 0,
      assignedTo: "Sneha Rao",
      employeeId: "EMP-0114",
      department: "Operations",
      assignedOn: "05 Nov 2026",
      usageStatus: "In Use",
    },
    {
      id: "inv-asgn-4",
      assetId: "LIC-00018",
      name: "Microsoft 365 Business Standard",
      type: "Digital License",
      category: "Productivity Software",
      serialNumber: "M365-BS-2026-101",
      location: "Company-wide",
      quantity: 1,
      unitLabel: "seat",
      condition: "Active",
      status: "assigned",
      idleDays: 0,
      assignedTo: "Arun Demo",
      employeeId: "EMP-0001",
      department: "IT",
      assignedOn: "01 Nov 2026",
      usageStatus: "Active",
    },
    {
      id: "inv-asgn-5",
      assetId: "STK-00042",
      name: "Logitech Wireless Mouse",
      type: "Consumable",
      category: "Peripherals",
      serialNumber: "LOGI-MX-0042-A",
      location: "Bengaluru",
      quantity: 1,
      unitLabel: "unit",
      condition: "Good",
      status: "assigned",
      idleDays: 0,
      assignedTo: "Vikram Singh",
      employeeId: "EMP-0120",
      department: "Support",
      assignedOn: "06 Nov 2026",
      usageStatus: "Issued",
    },
    {
      id: "inv-asgn-6",
      assetId: "AST-00148",
      name: "Samsung Galaxy S25",
      type: "Physical Asset",
      category: "Mobile Devices",
      serialNumber: "SGS25-BLR-7704",
      location: "Bengaluru",
      quantity: 1,
      unitLabel: "unit",
      condition: "Good",
      status: "assigned",
      idleDays: 0,
      assignedTo: "Aisha Khan",
      employeeId: "EMP-0125",
      department: "Sales",
      assignedOn: "08 Nov 2026",
      usageStatus: "In Use",
    },
    {
      id: "inv-asgn-7",
      assetId: "LIC-00025",
      name: "Workspace Endpoint Security Seats",
      type: "Digital License",
      category: "Security Software",
      serialNumber: "WES-2026-025",
      location: "Company-wide",
      quantity: 62,
      unitLabel: "seats",
      condition: "Active",
      status: "assigned",
      idleDays: 0,
      assignedTo: "IT Operations Pool",
      employeeId: "EMP-0009",
      department: "IT",
      assignedOn: "01 Nov 2026",
      usageStatus: "Active",
    },

    // ── Reserved ──
    {
      id: "inv-res-1",
      assetId: "AST-00124",
      reservationId: "RES-00021",
      name: "Dell Latitude 5450",
      type: "Physical Asset",
      category: "Laptops",
      serialNumber: "DL5450-IND-9833",
      location: "Bengaluru",
      quantity: 1,
      unitLabel: "unit",
      condition: "Good",
      status: "reserved",
      idleDays: 0,
      reservedFor: "Priya Sharma",
      department: "Finance",
      reservedBy: "Arun Demo",
      reservedUntil: "17 Nov 2026",
      reservationPurpose: "Finance onboarding",
      reservationStatus: "Expiring Soon",
    },
    {
      id: "inv-res-2",
      assetId: "AST-00125",
      reservationId: "RES-00022",
      name: "HP ProBook 440",
      type: "Physical Asset",
      category: "Laptops",
      serialNumber: "HP440-IND-4429",
      location: "Bengaluru",
      quantity: 1,
      unitLabel: "unit",
      condition: "New",
      status: "reserved",
      idleDays: 0,
      reservedFor: "New Joiner",
      department: "Sales",
      reservedBy: "Arun Demo",
      reservedUntil: "23 Nov 2026",
      reservationPurpose: "Sales onboarding",
      reservationStatus: "Reserved",
    },
    {
      id: "inv-res-3",
      assetId: "AST-00130",
      reservationId: "RES-00023",
      name: "Dell 24-inch Monitor",
      type: "Physical Asset",
      category: "Monitors",
      serialNumber: "DLM24-HYD-3150",
      location: "Hyderabad",
      quantity: 1,
      unitLabel: "unit",
      condition: "Good",
      status: "reserved",
      idleDays: 0,
      reservedFor: "Sneha Rao",
      department: "Operations",
      reservedBy: "Neha Rao",
      reservedUntil: "20 Nov 2026",
      reservationPurpose: "Workstation expansion",
      reservationStatus: "Reserved",
    },
    {
      id: "inv-res-4",
      assetId: "LIC-00018",
      reservationId: "RES-00024",
      name: "Microsoft 365 Business Standard",
      type: "Digital License",
      category: "Productivity Software",
      serialNumber: "M365-BS-2026-024",
      location: "Company-wide",
      quantity: 4,
      unitLabel: "seats",
      condition: "Active",
      status: "reserved",
      idleDays: 0,
      reservedFor: "IT Onboarding",
      department: "IT",
      reservedBy: "Arun Demo",
      reservedUntil: "18 Nov 2026",
      reservationPurpose: "New hire batch allocation",
      reservationStatus: "Expiring Soon",
    },
    {
      id: "inv-res-5",
      assetId: "STK-00042",
      reservationId: "RES-00025",
      name: "Logitech Wireless Mouse",
      type: "Consumable",
      category: "Peripherals",
      serialNumber: "LOGI-MX-0042-R",
      location: "Bengaluru",
      quantity: 2,
      unitLabel: "units",
      condition: "New",
      status: "reserved",
      idleDays: 0,
      reservedFor: "Support Team",
      department: "Support",
      reservedBy: "Neha Rao",
      reservedUntil: "24 Nov 2026",
      reservationPurpose: "Support desk replacement",
      reservationStatus: "Reserved",
    },
    {
      id: "inv-res-6",
      assetId: "AST-00148",
      reservationId: "RES-00026",
      name: "Samsung Galaxy S25",
      type: "Physical Asset",
      category: "Mobile Devices",
      serialNumber: "SGS25-BLR-7789",
      location: "Bengaluru",
      quantity: 1,
      unitLabel: "unit",
      condition: "Good",
      status: "reserved",
      idleDays: 0,
      reservedFor: "Aisha Khan",
      department: "Sales",
      reservedBy: "Arun Demo",
      reservedUntil: "25 Nov 2026",
      reservationPurpose: "Field sales travel kit",
      reservationStatus: "Reserved",
    },

    // ── Under Repair ──
    {
      id: "inv-rep-1",
      assetId: "AST-00124",
      repairId: "RPR-00031",
      name: "Dell Latitude 5450",
      type: "Physical Asset",
      category: "Laptops",
      serialNumber: "DL5450-IND-9811",
      location: "Bengaluru · Store A",
      quantity: 1,
      unitLabel: "unit",
      condition: "Fair",
      status: "repair",
      idleDays: 0,
      warranty: "In Warranty",
      reportedIssue: "Battery not charging",
      repairProvider: "Dell Service Centre",
      sentOn: "06 Nov 2026",
      expectedReturn: "13 Nov 2026",
      repairOverdue: true,
      repairStatus: "In Progress",
    },
    {
      id: "inv-rep-2",
      assetId: "AST-00125",
      repairId: "RPR-00032",
      name: "HP ProBook 440",
      type: "Physical Asset",
      category: "Laptops",
      serialNumber: "HP440-IND-4419",
      location: "Bengaluru · Store A",
      quantity: 1,
      unitLabel: "unit",
      condition: "Fair",
      status: "repair",
      idleDays: 0,
      warranty: "In Warranty",
      reportedIssue: "Keyboard failure",
      repairProvider: "HP Care",
      sentOn: "09 Nov 2026",
      expectedReturn: "14 Nov 2026",
      repairOverdue: true,
      repairStatus: "Awaiting Parts",
    },
    {
      id: "inv-rep-3",
      assetId: "AST-00130",
      repairId: "RPR-00033",
      name: "Dell 24-inch Monitor",
      type: "Physical Asset",
      category: "Monitors",
      serialNumber: "DLM24-HYD-3118",
      location: "Hyderabad · Store B",
      quantity: 1,
      unitLabel: "unit",
      condition: "Fair",
      status: "repair",
      idleDays: 0,
      warranty: "In Warranty",
      reportedIssue: "Display flickering",
      repairProvider: "TechFix Services",
      sentOn: "10 Nov 2026",
      expectedReturn: "18 Nov 2026",
      repairOverdue: false,
      repairStatus: "In Progress",
    },
    {
      id: "inv-rep-4",
      assetId: "AST-00148",
      repairId: "RPR-00034",
      name: "Samsung Galaxy S25",
      type: "Physical Asset",
      category: "Mobile Devices",
      serialNumber: "SGS25-BLR-7752",
      location: "Bengaluru · Store A",
      quantity: 1,
      unitLabel: "unit",
      condition: "Good",
      status: "repair",
      idleDays: 0,
      warranty: "Out of Warranty",
      reportedIssue: "Cracked screen",
      repairProvider: "Samsung Service",
      sentOn: "11 Nov 2026",
      expectedReturn: "17 Nov 2026",
      repairOverdue: false,
      repairStatus: "Ready for Collection",
    },
    {
      id: "inv-rep-5",
      assetId: "AST-00161",
      repairId: "RPR-00035",
      name: "Canon Office Printer",
      type: "Physical Asset",
      category: "Printers",
      serialNumber: "CN-PRT-0161",
      location: "Bengaluru · Store A",
      quantity: 1,
      unitLabel: "unit",
      condition: "Fair",
      status: "repair",
      idleDays: 0,
      warranty: "In Warranty",
      reportedIssue: "Paper feed error",
      repairProvider: "Canon Care",
      sentOn: "12 Nov 2026",
      expectedReturn: "20 Nov 2026",
      repairOverdue: false,
      repairStatus: "Awaiting Diagnosis",
    },
    {
      id: "inv-rep-6",
      assetId: "AST-00166",
      repairId: "RPR-00036",
      name: "APC UPS 1100VA",
      type: "Physical Asset",
      category: "Power Backup",
      serialNumber: "APC-1100-0166",
      location: "Hyderabad · Store B",
      quantity: 3,
      unitLabel: "units",
      condition: "Fair",
      status: "repair",
      idleDays: 0,
      warranty: "In Warranty",
      reportedIssue: "Battery backup failure",
      repairProvider: "APC Service",
      sentOn: "13 Nov 2026",
      expectedReturn: "21 Nov 2026",
      repairOverdue: false,
      repairStatus: "In Progress",
    },
  ];

  const activities: InventoryActivityRecord[] = [
    {
      id: "act-1",
      eventId: "EVT-00124",
      dateTime: "15 Nov 2026 · 10:40 AM",
      itemName: "Dell Latitude 5450",
      assetId: "AST-00124",
      assetType: "Physical Asset",
      location: "Bengaluru Store A",
      event: "Returned",
      category: "Returns",
      details: "In Use -> Available / Priya Sharma · Bengaluru Store A",
      performedBy: "Arun Demo",
      performedByRole: "Client Admin",
      previousStatus: "In Use",
      newStatus: "Available",
      summaryNote: "Return recorded from Priya Sharma · Condition: Good · Location: Bengaluru Store A",
    },
    {
      id: "act-2",
      eventId: "EVT-00123",
      dateTime: "15 Nov 2026 · 09:15 AM",
      itemName: "Microsoft 365 Business Standard",
      assetId: "LIC-00018",
      assetType: "Digital License",
      location: "Company-wide",
      event: "Allocated",
      category: "Assignments",
      details: "3 seats allocated / IT Onboarding",
      performedBy: "Arun Demo",
      performedByRole: "Client Admin",
      previousStatus: "Available",
      newStatus: "Active",
      summaryNote: "3 seats allocated for IT Onboarding · License pool updated",
    },
    {
      id: "act-3",
      eventId: "EVT-00122",
      dateTime: "14 Nov 2026 · 04:20 PM",
      itemName: "Dell 24-inch Monitor",
      assetId: "AST-00130",
      assetType: "Physical Asset",
      location: "Hyderabad Store B",
      event: "Transferred",
      category: "Transfers",
      details: "Bengaluru Store A -> Hyderabad Store B",
      performedBy: "Neha Rao",
      performedByRole: "Inventory Manager",
      previousStatus: "Bengaluru Store A",
      newStatus: "Hyderabad Store B",
      summaryNote: "Inter-office stock transfer completed · Condition: Good",
    },
    {
      id: "act-4",
      eventId: "EVT-00121",
      dateTime: "14 Nov 2026 · 02:10 PM",
      itemName: "HP ProBook 440",
      assetId: "AST-00125",
      assetType: "Physical Asset",
      location: "Bengaluru Store A",
      event: "Reserved",
      category: "Reservations",
      details: "Available -> Reserved / Sales onboarding · Until 23 Nov 2026",
      performedBy: "Arun Demo",
      performedByRole: "Client Admin",
      previousStatus: "Available",
      newStatus: "Reserved",
      summaryNote: "Reserved for Sales onboarding until 23 Nov 2026",
    },
    {
      id: "act-5",
      eventId: "EVT-00120",
      dateTime: "14 Nov 2026 · 11:30 AM",
      itemName: "Samsung Galaxy S25",
      assetId: "AST-00148",
      assetType: "Physical Asset",
      location: "Bengaluru Store A",
      event: "Repair Updated",
      category: "Repairs",
      details: "In Progress -> Ready for Collection / Samsung Service",
      performedBy: "Neha Rao",
      performedByRole: "Inventory Manager",
      previousStatus: "In Progress",
      newStatus: "Ready for Collection",
      summaryNote: "Repair RPR-00034 marked Ready for Collection by Samsung Service",
    },
    {
      id: "act-6",
      eventId: "EVT-00119",
      dateTime: "13 Nov 2026 · 03:45 PM",
      itemName: "Logitech Wireless Mouse",
      assetId: "STK-00042",
      assetType: "Consumable",
      location: "Bengaluru Store A",
      event: "Issued",
      category: "Assignments",
      details: "1 unit issued / Vikram Singh · Support",
      performedBy: "Arun Demo",
      performedByRole: "Client Admin",
      previousStatus: "Available",
      newStatus: "Issued",
      summaryNote: "1 unit issued to Vikram Singh (Support) from Bengaluru Store A",
    },
  ];

  return { items, activities };
}

export function getClientInventory(clientId: string): ClientInventoryData {
  const key = `${STORAGE_PREFIX}${clientId}`;
  const stored = safeReadJson<ClientInventoryData | null>(key, null);
  if (stored && Array.isArray(stored.items) && Array.isArray(stored.activities)) {
    return stored;
  }
  const seeded = seedInventoryData();
  localStorage.setItem(key, JSON.stringify(seeded));
  return seeded;
}

export function saveClientInventory(clientId: string, data: ClientInventoryData): void {
  localStorage.setItem(`${STORAGE_PREFIX}${clientId}`, JSON.stringify(data));
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

