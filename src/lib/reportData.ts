import { getClients } from "@/lib/clientStore";
import { getVendors } from "@/lib/vendorDataStore";
import { getCatalogProducts } from "@/lib/catalogStore";
import { getOrders } from "@/lib/salesOrderStore";
import { getServiceRequests } from "@/lib/serviceRequestsStore";
import { getSupportTickets } from "@/lib/supportTicketStore";
import { getUsers } from "@/lib/nidoUsersStore";
import { formatCurrency, formatDate } from "@/lib/formatters";

export type ReportRecord = Record<string, unknown>;

export function getReportMonthKey(value: unknown): string {
  if (typeof value !== "string" && typeof value !== "number" && !(value instanceof Date)) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getRecentReportMonths(count = 7, referenceDate = new Date()): Array<{ key: string; label: string }> {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - count + index + 1, 1);
    return {
      key: getReportMonthKey(date),
      label: new Intl.DateTimeFormat(undefined, { month: "short", year: "2-digit" }).format(date),
    };
  });
}

function tagged<T extends object>(module: string, rows: T[]): ReportRecord[] {
  return rows.map((row) => ({ ...row, __module: module }));
}

export function getReportRecords(module: string): ReportRecord[] {
  switch (module) {
    case "Clients":
      return tagged("Clients", getClients());
    case "Vendors":
      return tagged("Vendors", getVendors());
    case "Catalog":
      return tagged("Catalog", getCatalogProducts());
    case "Orders":
      return tagged("Orders", getOrders());
    case "Services":
    case "Service Requests":
      return tagged("Services", getServiceRequests());
    case "Support":
    case "Support Tickets":
      return tagged("Support Tickets", getSupportTickets());
    case "Users":
      return tagged("Users", getUsers());
    case "All Modules":
      return [
        ...tagged("Clients", getClients()),
        ...tagged("Vendors", getVendors()),
        ...tagged("Catalog", getCatalogProducts()),
        ...tagged("Orders", getOrders()),
        ...tagged("Services", getServiceRequests()),
        ...tagged("Support Tickets", getSupportTickets()),
        ...tagged("Users", getUsers()),
      ];
    default:
      return [];
  }
}

const FIELD_ALIASES: Record<string, string[]> = {
  id: ["id", "clientId", "vendorId", "productId", "requestId", "number", "orderNumber", "poNumber"],
  createdon: ["createdAt", "createdOn", "createdOnDisplay", "created", "createdDate", "onboardedDate", "requestDate", "orderDate"],
  createdat: ["createdAt", "createdOn", "created", "requestDate", "orderDate"],
  createdby: ["createdByName", "createdBy", "requestedBy", "assignedTo"],
  clientname: ["clientName", "client", "name"],
  clientemail: ["email", "clientEmail"],
  clientphone: ["phone", "mobile", "clientPhone"],
  clientcity: ["city", "billingCity", "shippingCity"],
  clientstatus: ["status"],
  clienttier: ["tier"],
  contractstart: ["contractStartDate", "contractStart"],
  contractend: ["contractEndDate", "contractEnd"],
  vendorname: ["vendorName", "name"],
  vendoremail: ["email", "vendorEmail"],
  vendorphone: ["phone", "vendorPhone"],
  vendorcategory: ["category"],
  vendorstatus: ["status"],
  rating: ["rating"],
  itemname: ["productName", "itemName", "item", "itemAsset", "name"],
  sku: ["sku", "productCode", "masterProductCode", "itemCode"],
  category: ["category", "requestType"],
  price: ["price", "unitPrice", "unitCost", "sellingPrice"],
  stock: ["stock", "quantity", "qty", "onHand"],
  unit: ["unit", "uom"],
  orderid: ["orderNumber", "id", "orderId"],
  orderdate: ["orderDate", "createdAt", "createdOn"],
  orderstatus: ["status"],
  amount: ["grandTotal", "totalAmount", "amount", "subtotal", "total"],
  tax: ["totalTax", "taxAmount", "tax"],
  total: ["grandTotal", "totalAmount", "total", "amount"],
  servicename: ["requestType", "serviceName", "name"],
  requestdate: ["requestDate", "createdAt", "createdOn"],
  status: ["status"],
  priority: ["priority"],
  assignedto: ["assignedTo", "agent", "owner"],
  ticketid: ["number", "ticketId", "id"],
  subject: ["subject", "title"],
  resolutiondate: ["resolvedAt", "resolutionDate", "closedAt"],
  agent: ["assignedTo", "agent"],
};

function normalized(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function lookup(record: ReportRecord, keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null && record[key] !== "") return record[key];
    const normalizedKey = normalized(key);
    const matchingKey = Object.keys(record).find((candidate) => normalized(candidate) === normalizedKey);
    if (matchingKey && record[matchingKey] !== undefined && record[matchingKey] !== null && record[matchingKey] !== "") {
      return record[matchingKey];
    }
  }
  const payload = record.payload;
  if (payload && typeof payload === "object") {
    const nested = payload as Record<string, unknown>;
    for (const key of keys) {
      const matchingKey = Object.keys(nested).find((candidate) => normalized(candidate) === normalized(key));
      if (matchingKey && nested[matchingKey] !== undefined && nested[matchingKey] !== null && nested[matchingKey] !== "") {
        return nested[matchingKey];
      }
    }
  }
  return undefined;
}

export function getReportFieldValue(record: ReportRecord, column: string): string {
  const fieldKey = normalized(column);
  const module = String(record.__module ?? "");
  if (fieldKey.startsWith("client") && module && module !== "Clients") return "—";
  if (fieldKey.startsWith("vendor") && module && module !== "Vendors") return "—";
  if (["orderid", "orderdate", "orderstatus"].includes(fieldKey) && module && module !== "Orders") return "—";
  if (["itemname", "sku", "stock", "unit"].includes(fieldKey) && module && module !== "Catalog") return "—";
  if (["servicename", "requestdate"].includes(fieldKey) && module && module !== "Services") return "—";
  if (["ticketid", "subject", "resolutiondate", "agent", "priority"].includes(fieldKey) && module && module !== "Support Tickets") return "—";
  const aliases = FIELD_ALIASES[fieldKey] ?? [column];
  const raw = lookup(record, aliases);
  if (raw === undefined || raw === null || raw === "") return "—";

  if (["amount", "tax", "total", "price", "lineamount", "unitprice"].includes(fieldKey)) {
    const amount = Number(raw);
    return Number.isFinite(amount) ? formatCurrency(amount) : String(raw);
  }
  if (["createdon", "createdat", "orderdate", "requestdate", "resolutiondate", "contractstart", "contractend"].includes(fieldKey)) {
    return formatDate(String(raw));
  }
  if (typeof raw === "boolean") return raw ? "Yes" : "No";
  if (typeof raw === "object") return JSON.stringify(raw);
  return String(raw);
}

export function getReportRecordDate(record: ReportRecord): string {
  const value = lookup(record, FIELD_ALIASES.createdon);
  if (typeof value !== "string" && typeof value !== "number") return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

export function applyStoredReportFilters<T extends ReportRecord>(
  records: T[],
  filters: Array<{ field: string; operator: string; value: string }> = [],
): T[] {
  const activeFilters = filters.filter((filter) => filter.field && filter.operator && filter.value !== "");
  if (activeFilters.length === 0) return records;
  return records.filter((record) => activeFilters.every((filter) => {
    const current = getReportFieldValue(record, filter.field);
    const target = filter.value;
    const left = current.toLowerCase();
    const right = target.toLowerCase();
    switch (filter.operator.toLowerCase()) {
      case "contains":
        return left.includes(right);
      case "does not contain":
        return !left.includes(right);
      case "not equals":
      case "is not":
        return left !== right;
      case "greater than":
        return Number(current.replace(/[^\d.-]/g, "")) > Number(target);
      case "less than":
        return Number(current.replace(/[^\d.-]/g, "")) < Number(target);
      case "is empty":
        return current === "—";
      case "is not empty":
        return current !== "—";
      case "equals":
      case "is":
      default:
        return left === right;
    }
  }));
}
