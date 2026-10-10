import type { MyOrder } from "@/contexts/MyOrdersContext";
import type { OrderReportRow } from "@/lib/orderCsvExport";
import { formatCurrency, formatDate } from "@/lib/formatters";

export const MASTER_ORDER_REPORT_FIELDS = new Set([
  "Master Order ID", "Sub Order ID", "PO Reference", "Client", "Client ID", "Created At",
  "Requester", "Requester Role", "Ordered For", "Assigned To", "Assigned Role", "Order Time",
  "Current Order Status", "Approval Status", "Approval Workflow", "Approval Requested By",
  "Approval Date", "Approved By", "Updated By", "Last Updated By", "Last Updated At",
  "Updated At", "Update Count", "SLA Time", "SLA Alert", "Order Total", "Payment Method",
  "Payment Terms", "Delivery Attention", "Delivery Address", "City", "State", "Country",
  "ZIP Code", "Delivery Phone", "Delivery Notes", "Checkout Note", "Order Notes", "Cancel Reason",
  "Item Name", "SKU / Product Code", "Category", "Quantity", "Unit Price", "Line Amount",
  "Item Status", "Reference Number", "Serial Number", "Tracking Number", "Tracking Carrier",
  "Tracking Note", "Selected Vendor", "Vendor PO Numbers", "PO Created At",
  "Vendor PO Statuses", "Last Comment",
]);

export function isMasterOrderReport(module: string, columns: string[]): boolean {
  return module === "Orders" && columns.some((column) => MASTER_ORDER_REPORT_FIELDS.has(column));
}

export function readMasterReportOrders(): MyOrder[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem("nido_my_orders") || "[]");
    return Array.isArray(value) ? value as MyOrder[] : [];
  } catch {
    return [];
  }
}

function getMyOrderTax(order: MyOrder): number | undefined {
  const items = order.cartItems || [];
  if (!items.length || items.some((item) =>
    item.clientSellingPriceExclGst == null || item.gstSnapshot == null
  )) return undefined;
  return items.reduce((sum, item) => {
    const taxable = Number(item.clientSellingPriceExclGst) * Number(item.quantity);
    return sum + taxable * Number(item.gstSnapshot) / 100;
  }, 0);
}

/** Use the same order row aliases and formatting in preview and saved exports. */
export function getMasterOrderReportValue(row: OrderReportRow, column: string): string {
  const aliases: Record<string, string> = {
    ID: "Master Order ID",
    "Order ID": "Master Order ID",
    "PO Reference": "Client PO Reference",
    "Client Name": "Client",
    "Vendor Name": "Selected Vendor",
    "Order Status": "Current Order Status",
    Status: "Current Order Status",
    "Created On": "Created At",
    "Updated At": "Item Status Updated At",
    "Last Updated By": "Last Updated BY",
    "PO Created At": "PO Created AT",
    Total: "Order Total",
    Amount: "Order Total",
  };
  let value = row.fields[aliases[column] || column];

  if (column === "Tax") value = getMyOrderTax(row.order);
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (["Amount", "Tax", "Total", "Order Total", "Unit Price", "Line Amount"].includes(column)) {
    const amount = Number(value);
    return Number.isFinite(amount) ? formatCurrency(amount) : String(value);
  }
  if (column === "Created On" || column === "Order Date") return formatDate(String(value));
  return String(value);
}
