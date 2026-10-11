import type { ReportColumnGroup, ReportEntityType } from "@/components/reports/report-center/ReportsCenterUI";
import { getClients } from "@/lib/clientStore";
import { getCatalogProducts } from "@/lib/catalogStore";
import { getClientCatalog } from "@/lib/clientCatalogStore";
import {
  getClientActivities,
  getClientContract,
  getClientDocuments,
  getClientOrders,
  getClientServices,
} from "@/lib/clientDataStore";
import { getReportRecords, getReportFieldValue, type ReportRecord } from "@/lib/reportData";
import { buildOrderReportRows } from "@/lib/orderCsvExport";
import type { MyOrder } from "@/contexts/MyOrdersContext";
import { getInvoices } from "@/lib/invoiceStore";
import { getOrders } from "@/lib/salesOrderStore";
import { getServiceRequests } from "@/lib/serviceRequestsStore";
import { getSupportTickets } from "@/lib/supportTicketStore";
import { getRoles, getUsers } from "@/lib/nidoUsersStore";
import { getVendors } from "@/lib/vendorDataStore";
import { getAllPOs } from "@/lib/purchaseOrderStore";
import { getAllVendorProducts } from "@/lib/vendorStore";
import { getQuotes } from "@/lib/quoteStore";
import { getReceipts } from "@/lib/paymentReceiptStore";
import { getAllThresholds, getStockHistory } from "@/lib/stockHistoryStore";
import {
  getApprovalSLA,
  getBusinessCalendar,
  getClientSLA,
  getEscalationRules,
  getProcurementSLA,
  getServiceSLA,
  getSLAAuditLog,
  getVendorSLA,
} from "@/lib/slaEngine";
import { getTaxAuditLog } from "@/lib/taxEngine";
import { getImpersonationAudit } from "@/lib/impersonationStore";
import { getBuiltinReportViews, getCustomReports } from "@/lib/reportStore";
import { loadApprovalBootstrap } from "@/lib/approvalEngine";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { getPortalRoles, getPortalUsers } from "@/lib/portalUserStore";
import { getAllRolePermissions } from "@/lib/permissionsStore";
import { getUserDocuments } from "@/lib/nidoUserDocumentsStore";
import { getUserNotes } from "@/lib/nidoUserNotesStore";
import { getAutoAssignmentSettings } from "@/lib/autoAssignmentStore";
import { getAllClientPricing, getAllProductPricing, getClientPriceSlabs } from "@/lib/priceEngineStore";
import { getAllRecurring } from "@/lib/recurringInvoiceStore";
import { getOrderStatusConfig } from "@/lib/orderStatusStore";
import { getConfig } from "@/lib/configService";
import { getReportCenterHistory, getReportCenterSchedules } from "@/lib/reportCenterStore";
import { REPORT_WORKBOOK_COLUMNS, REPORT_WORKBOOK_MODULE_ORDER } from "@/lib/reportWorkbookColumns.generated";

const LIVE_MODULES_BY_TYPE: Record<ReportEntityType, Set<string>> = {
  client: new Set([
    "Client Orders", "Client Order Items", "Client Master and Onboarding", "Client Contracts",
    "Client Users and External Stakeholders", "Client Roles and Permissions", "Client Addresses",
    "Client Activity", "Client Documents", "Client Catalog", "Sales Quotes", "Sales Quote Items",
    "Sales Orders", "Sales Order Items", "Invoices and Proforma Invoices", "Invoice Items",
    "Invoice Payments and Activity", "Recurring Invoices", "Payment Receipts", "Receipt Allocations",
    "Credit Notes", "Credit Note Items", "Renewals", "Services Request Register", "AMC Requests",
    "Repair Requests", "Rental Requests", "Recycle and Disposal Requests", "Regular Purchase Requests",
    "Support Parent Tickets", "Support Child Tickets", "Ticket Conversations and Attachments",
    "Dashboard and Client Activity Summary",
  ]),
  vendor: new Set([
    "Vendor Orders", "Vendor Order Items", "Vendor PO Notes", "Vendor PO Documents", "Purchase Orders",
    "Purchase Order Items", "Bills", "Bill Items", "Payments Made", "Payment Made Allocations",
    "Vendor Credits", "Vendor Credit Items", "Vendor Master and Onboarding", "Vendor Categories",
    "Vendor Payments Overview", "Vendor Catalog", "Vendor SLA Policies",
    "Procurement SLA Stages", "Vendor Performance",
  ]),
  internal: new Set([
    "Nido Users", "Nido Roles", "Role Permissions", "Departments and Hierarchy",
    "User Login History", "User Notes", "User Documents", "Automatic Assignment Rules", "Master Catalog",
    "Product Specifications", "Product Variants", "Vendor Catalog", "Client Catalog", "Product Commercial Terms",
    "Price Engine and Vendor Comparison", "Client Pricing and Margins", "Pricing Slabs and Rules",
    "Vendor Pricing Charges", "Inventory Balances", "Stock Movements",
    "Returns and Cancellations", "Renewals", "Services Request Register", "AMC Requests", "Repair Requests",
    "Rental Requests", "Recycle and Disposal Requests", "Regular Purchase Requests", "AMC Visit Schedule",
    "Regular Purchase Items", "Service Appointments and Assignments", "Support Parent Tickets",
    "Support Child Tickets", "Ticket Conversations and Attachments", "Approval Workflows",
    "Approval Workflow Conditions", "Approval Workflow Levels", "Approval Requests",
    "Approval Decisions and History", "Vendor SLA Policies", "Client SLA Tiers", "Procurement SLA Stages",
    "Service SLA Policies", "Approval SLA Policies", "SLA Escalation Rules", "SLA Business Calendar",
    "SLA Audit History", "SLA Outcomes and Breaches", "Client and Vendor Spend", "Sales Revenue and Profit",
    "AR and AP Ageing", "Vendor Performance",
    "Organization and General Settings", "Order Status Configuration", "Tax Audit",
    "Tax Transaction Reconciliation", "Audit and Impersonation", "Report Definitions", "Scheduled Reports",
    "Report Download and Email History", "Product Categories Brands and Tags", "Expenses",
    "Transactions Ledger",
  ]),
};

export const REPORT_CENTER_MODULES: Record<ReportEntityType, string[]> = {
  client: REPORT_WORKBOOK_MODULE_ORDER.filter((module) => LIVE_MODULES_BY_TYPE.client.has(module)),
  vendor: REPORT_WORKBOOK_MODULE_ORDER.filter((module) => LIVE_MODULES_BY_TYPE.vendor.has(module)),
  internal: REPORT_WORKBOOK_MODULE_ORDER.filter((module) => LIVE_MODULES_BY_TYPE.internal.has(module)),
};

const group = (label: string, ...columns: string[]): ReportColumnGroup => ({ label, columns });

const LEGACY_REPORT_CENTER_COLUMNS: Record<string, ReportColumnGroup[]> = {
  "Products / Catalog": [group("PRODUCTS", "Vendor Name", "Product Name", "SKU", "Product Code", "Category", "Brand", "Unit Price", "Stock", "Reserved Stock", "Incoming Stock", "MOQ", "Lead Time", "Status", "Created date")],
  "Vendor Orders": [group("VENDOR ORDERS", "Vendor Name", "Order ID", "Order Date", "Order Status", "Amount", "PO Reference")],
  "Purchase Orders": [group("PURCHASE ORDERS", "Vendor Name", "PO Number", "Created On", "Status", "Amount", "Delivery Date")],
  RFQs: [group("RFQS", "RFQ Number", "Vendor Name", "Created On", "Status", "Amount")],
  "Client Orders": [group("CLIENT ORDERS", "Client Name", "Order ID", "Order Date", "Order Status", "Amount")],
  Catalog: [group("CATALOG", "Item Name", "SKU", "Category", "Price", "Stock", "Status")],
  Services: [group("SERVICES", "Service Name", "Request Date", "Client Name", "Status", "Assigned To")],
  "Invoices / Bills": [group("INVOICES AND BILLS", "Document Type", "Invoice / Bill Number", "Client Name", "Vendor Name", "Date", "Due Date", "Status", "Amount")],
  Payments: [group("PAYMENTS", "Payment Type", "Payment Number", "Client Name", "Vendor Name", "Payment Date", "Status", "Amount", "Method")],
  "Vendor Credits": [group("VENDOR CREDITS", "Credit Number", "Vendor Name", "Credit Date", "Status", "Amount", "Associated Bill")],
  SLA: [group("SLA", "Vendor Name", "Client Name", "Event", "Status", "Created On", "Description")],
  Users: [group("USERS", "Name", "Email", "Department", "Role", "Status", "Created date")],
  Departments: [group("DEPARTMENTS", "Department", "User Count", "Status")],
  Orders: [group("ORDERS", "Client Name", "Order ID", "Order Date", "Order Status", "Amount")],
  Approvals: [group("APPROVALS", "Record Type", "Name", "Module", "Status", "Created On", "Requested By")],
  Finance: [group("FINANCE", "Document Type", "Document Number", "Client Name", "Vendor Name", "Date", "Status", "Amount")],
  "Audit Trail": [group("AUDIT", "Event", "User", "Module", "Action", "Timestamp", "Status")],
  Inventory: [group("INVENTORY", "Product Name", "SKU", "Vendor Name", "Action", "Quantity", "Timestamp", "Reference")],
  Support: [group("SUPPORT", "Ticket ID", "Subject", "Client Name", "Priority", "Status", "Assigned To", "Created On")],
  Tax: [group("TAX", "Event", "Category", "Tax Type", "Rate", "Created On", "User")],
  "Sales Reports": [group("SALES", "Document Type", "Client Name", "Document Number", "Date", "Status", "Amount")],
  "Procurement Reports": [group("PROCUREMENT", "Vendor Name", "Document Type", "Document Number", "Date", "Status", "Amount")],
  "Vendor Performance": [group("VENDOR PERFORMANCE", "Vendor Name", "Category", "Status", "Rating", "PO Count", "Spend")],
  "Client Reports": [group("CLIENT REPORTS", "Client Name", "Document Type", "Document Number", "Date", "Status", "Amount")],
  "Internal Stakeholders": [group("INTERNAL STAKEHOLDERS", "Name", "Email", "Department", "Role", "Status")],
  "External Stakeholders": [group("EXTERNAL STAKEHOLDERS", "Name", "Entity Type", "Email", "Status", "Created date")],
  "Custom Reports": [group("SAVED REPORTS", "Name", "Report Type", "Module", "Frequency", "Last Run Status", "Created date")],
};

const CLIENT_ORDER_SUPPORTED_COLUMNS = new Set([
  "Report Date From", "Report Date To", "Report Date Basis", "Report Generated At", "Report Timezone",
  "ID", "Created By", "Requester ID", "Requester Email", "Created At", "Updated By", "Updated At",
  "Update Count", "Client ID", "Client", "PO Number", "Requester", "Ordered For", "Defer Purchase Orders",
  "Requester Role", "Assigned", "Assigned Role", "Order Date", "Order Time", "Status", "SLA Time",
  "SLA Alert", "Total Amount", "Cart Items", "Total Amount Num", "Payment Method", "Payment Detail",
  "Payment Terms", "Order Notes", "Delivery Address", "Delivery Details / Label",
  "Delivery Details / Attention Name", "Delivery Details / Line1", "Delivery Details / Line2",
  "Delivery Details / City", "Delivery Details / State", "Delivery Details / Country",
  "Delivery Details / Zip", "Delivery Details / Phone", "Delivery Details / Instructions", "Cancel Reason",
  "Approved By", "Approved Date", "Approval Status", "Ordered Item Count", "Total Quantity", "Last Comment",
]);

export const REPORT_CENTER_COLUMNS: Record<string, ReportColumnGroup[]> = {
  ...LEGACY_REPORT_CENTER_COLUMNS,
  ...Object.fromEntries(
    [...new Set(Object.values(REPORT_CENTER_MODULES).flat())].map((module) => [
      module,
      [group(
        "WORKBOOK COLUMN ORDER",
        ...(REPORT_WORKBOOK_COLUMNS[module] ?? []).filter((column) =>
          module !== "Client Orders" || CLIENT_ORDER_SUPPORTED_COLUMNS.has(column),
        ),
      )],
    ]),
  ),
};

export function orderReportCenterColumns(module: string, selectedColumns: string[]): string[] {
  const selected = new Set(selectedColumns);
  const canonical = REPORT_CENTER_COLUMNS[module]?.flatMap((columnGroup) => columnGroup.columns) ?? [];
  const ordered = canonical.filter((column) => selected.has(column));
  const canonicalSet = new Set(canonical);
  if (module === "Client Orders") return ordered;
  return [...ordered, ...selectedColumns.filter((column) => !canonicalSet.has(column))];
}

export function getReportCenterDefaultColumns(module: string, count = 6): string[] {
  return (REPORT_CENTER_COLUMNS[module]?.flatMap((columnGroup) => columnGroup.columns) ?? []).slice(0, count);
}

export function withReportRunMetadata(
  records: ReportRecord[],
  draft: Pick<{
    dateFrom: string;
    dateTo: string;
    dateBasis: string;
  }, "dateFrom" | "dateTo" | "dateBasis">,
  generatedAt = new Date(),
): ReportRecord[] {
  const timezone = getConfig().localization.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const metadata: ReportRecord = {
    reportDateFrom: draft.dateFrom,
    reportDateTo: draft.dateTo,
    reportDateBasis: draft.dateBasis,
    reportGeneratedAt: generatedAt.toISOString(),
    reportTimezone: timezone,
  };
  return records.map((record) => ({ ...record, ...metadata }));
}

const toRecords = <T extends object>(items: T[]): ReportRecord[] =>
  items.map((item) => ({ ...item }) as ReportRecord);

function readLocalArray(key: string): ReportRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return Array.isArray(value)
      ? value.filter((item): item is ReportRecord => Boolean(item) && typeof item === "object" && !Array.isArray(item))
      : [];
  } catch {
    return [];
  }
}

function readLocalObject(key: string): Record<string, unknown> {
  if (typeof window === "undefined") return {};
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(key) ?? "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function mapVendorProducts(): ReportRecord[] {
  const vendorsById = new Map(getVendors().map((vendor) => [String(vendor.id), vendor.name]));
  return Object.entries(getAllVendorProducts()).flatMap(([vendorId, products]) =>
    products.map((product) => ({
      ...(product as unknown as ReportRecord),
      vendorId,
      vendorName: vendorsById.get(vendorId) ?? "",
    })),
  );
}

function mapClientCatalogRecords(): ReportRecord[] {
  return getClients().flatMap((client) => {
    const clientId = String(client.id);
    const clientName = String(client.name ?? clientId);
    return getClientCatalog(clientId).map((product, index) => ({
      ...(product as unknown as ReportRecord),
      id: `${clientId}:${product.productCode || product.sku || index}`,
      clientId,
      clientName,
      productName: product.name,
      price: product.priceNum ?? product.price,
      stock: product.availability,
      status: product.availability,
    }));
  });
}

function mapClientOrderRecords(): ReportRecord[] {
  const clients = getClients();
  const clientsById = new Map(clients.map((client) => [String(client.id), String(client.name ?? client.id)]));
  const sourceOrders = readLocalArray("nido_my_orders");
  const sourceOrdersById = new Map(sourceOrders.map((order) => [String(order.id ?? ""), order]));
  const orderFieldsById = new Map<string, ReportRecord>();
  for (const row of buildOrderReportRows(sourceOrders as unknown as MyOrder[])) {
    if (!orderFieldsById.has(row.order.id)) orderFieldsById.set(row.order.id, row.fields);
  }

  return clients.flatMap((client) => {
    const clientId = String(client.id);
    const clientName = clientsById.get(clientId) ?? clientId;
    return getClientOrders(clientId, clientName).map((order) => {
      const sourceOrder = sourceOrdersById.get(String(order.id)) ?? {};
      const itemRecords = (Array.isArray(sourceOrder.cartItems)
        ? sourceOrder.cartItems
        : Array.isArray(order.productDetails)
          ? order.productDetails
          : []) as ReportRecord[];
      const totalQuantity = itemRecords.reduce(
        (sum, item) => sum + Number(item.quantity ?? item.qty ?? 0),
        0,
      );

      return {
        ...sourceOrder,
        ...(order as unknown as ReportRecord),
        ...(orderFieldsById.get(String(order.id)) ?? {}),
        clientId,
        clientName: order.client && order.client !== clientId ? order.client : clientName,
        orderDate: order.date || sourceOrder.orderDate || "",
        amount: order.amountNum,
        totalAmount: sourceOrder.totalAmountNum ?? order.amountNum,
        totalAmountNum: sourceOrder.totalAmountNum ?? order.amountNum,
        cartItems: itemRecords,
        orderedItemCount: itemRecords.length,
        totalQuantity: totalQuantity || Number(order.items) || 0,
      };
    });
  });
}

function mapClientServiceRecords(): ReportRecord[] {
  const clients = getClients();
  return clients.flatMap((client) => {
    const clientId = String(client.id);
    const clientName = String(client.name ?? clientId);
    return getClientServices(clientId).map((service) => ({
      ...(service as unknown as ReportRecord),
      clientId,
      clientName,
      serviceName: service.name,
      requestDate: service.startDate,
      assignedTo: service.provider,
    }));
  });
}

function getVendorStakeholderType(vendor: ReportRecord): "Vendor" | "Partner" | "Third Party" {
  const declared = String(
    vendor.stakeholderType ?? vendor.relationshipType ?? vendor.partnerType ?? "",
  ).toLowerCase();
  const category = String(vendor.category ?? "").toLowerCase();
  if (declared.includes("partner") || category.includes("partner")) return "Partner";
  if (declared.includes("third") || category.includes("third")) return "Third Party";
  return "Vendor";
}

function mapDepartments(): ReportRecord[] {
  const users = toRecords(getUsers());
  const counts = new Map<string, number>();
  for (const user of users) {
    const department = String(user.department ?? user.departmentName ?? "").trim();
    if (department) counts.set(department, (counts.get(department) ?? 0) + 1);
  }
  return [...counts.entries()].map(([department, userCount]) => ({
    id: department,
    department,
    userCount,
    status: "Active",
  }));
}

function getBills(): ReportRecord[] {
  return readLocalArray("nido_purchase_bills_v1").map((record) => ({ ...record, documentType: "Bill" }));
}

function getVendorCredits(): ReportRecord[] {
  return readLocalArray("nido_purchase_vendor_credits_v1");
}

function getPaymentsMade(): ReportRecord[] {
  return readLocalArray("nido_purchase_payments_made_v1").map((record) => ({ ...record, paymentType: "Vendor payment" }));
}

function getApprovalRecords(): ReportRecord[] {
  const store = readLocalObject("nido_local_approval_engine");
  const workflows = Array.isArray(store.workflows) ? store.workflows : [];
  const requests = Array.isArray(store.requests) ? store.requests : [];
  return [
    ...workflows.filter((record): record is ReportRecord => Boolean(record) && typeof record === "object").map((record) => ({ ...record, recordType: "Workflow" })),
    ...requests.filter((record): record is ReportRecord => Boolean(record) && typeof record === "object").map((record) => ({ ...record, recordType: "Request" })),
  ];
}

function approvalRecordsForModule(
  module: string,
  workflows: ReportRecord[],
  requests: ReportRecord[],
): ReportRecord[] {
  switch (module) {
    case "Approval Workflows":
      return workflows;
    case "Approval Workflow Conditions":
      return childRecords(workflows, ["conditions", "workflowConditions"]);
    case "Approval Workflow Levels":
      return childRecords(workflows, ["levels", "approvalLevels"]);
    case "Approval Requests":
      return requests;
    case "Approval Decisions and History":
      return childRecords(requests, ["decisions", "history", "steps"]);
    default:
      return [...workflows, ...requests];
  }
}

function getAuditRecords(): ReportRecord[] {
  return [
    ...toRecords(getStockHistory()).map((record) => ({ ...record, event: "Stock event" })),
    ...toRecords(getTaxAuditLog()).map((record) => ({ ...record, event: "Tax configuration event" })),
    ...toRecords(getSLAAuditLog()).map((record) => ({ ...record, event: "SLA event" })),
    ...toRecords(getImpersonationAudit()).map((record) => ({ ...record, event: "Impersonation event" })),
  ];
}

function getAllFinanceRecords(): ReportRecord[] {
  return [
    ...toRecords(getInvoices()).map((record) => ({ ...record, documentType: "Invoice" })),
    ...getBills(),
    ...toRecords(getReceipts()).map((record) => ({ ...record, paymentType: "Client receipt" })),
    ...getPaymentsMade(),
    ...getVendorCredits(),
  ];
}

function recordsFrom(value: unknown): ReportRecord[] {
  if (Array.isArray(value)) {
    return value.filter((record): record is ReportRecord =>
      Boolean(record) && typeof record === "object" && !Array.isArray(record),
    );
  }
  return value && typeof value === "object" && !Array.isArray(value)
    ? [value as ReportRecord]
    : [];
}

function childRecords(records: ReportRecord[], childKeys: string[]): ReportRecord[] {
  return records.flatMap((record) => {
    const payload = record.payload && typeof record.payload === "object" && !Array.isArray(record.payload)
      ? record.payload as ReportRecord
      : {};
    const details = record.details && typeof record.details === "object" && !Array.isArray(record.details)
      ? record.details as ReportRecord
      : {};
    const childKey = childKeys.find((key) =>
      [record[key], payload[key], details[key]].some((value) => Array.isArray(value) && value.length > 0),
    ) ?? childKeys.find((key) =>
      Array.isArray(record[key]) || Array.isArray(payload[key]) || Array.isArray(details[key]),
    );
    if (!childKey) return [];
    const parentId = String(record.id ?? record.number ?? record.poNumber ?? record.invoiceNumber ?? "");
    const children = [
      record[childKey],
      payload[childKey],
      details[childKey],
    ].find((value) => Array.isArray(value) && value.length > 0)
      ?? record[childKey]
      ?? payload[childKey]
      ?? details[childKey] as unknown[];
    return children.flatMap((child, index) => {
      if (!child || typeof child !== "object" || Array.isArray(child)) return [];
      return [{
        ...record,
        ...(child as ReportRecord),
        id: String((child as ReportRecord).id ?? `${parentId}:${childKey}:${index + 1}`),
        parentRecordId: parentId,
        parentRecordType: childKey,
        childIndex: index + 1,
      }];
    });
  });
}

function mapVendorCategories(): ReportRecord[] {
  const vendors = getVendors();
  const countByCategory = new Map<string, number>();
  vendors.forEach((vendor) => {
    const category = String(vendor.category ?? "").trim();
    if (category) countByCategory.set(category.toLowerCase(), (countByCategory.get(category.toLowerCase()) ?? 0) + 1);
  });
  return vendors.filter((vendor) => String(vendor.category ?? "").trim()).map((vendor) => ({
    ...vendor,
    vendorId: vendor.vendorId ?? vendor.id,
    vendorName: vendor.vendorName ?? vendor.name,
    categoryId: vendor.categoryId ?? `category-${String(vendor.category).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    categoryName: vendor.category,
    parentCategoryId: vendor.parentCategoryId ?? "",
    description: vendor.categoryDescription ?? "",
    vendorCount: countByCategory.get(String(vendor.category).toLowerCase()) ?? 0,
  }));
}

function mapVendorPerformance(): ReportRecord[] {
  const purchaseOrders = mapPurchaseOrders();
  const slaEvents = toRecords(getSLAAuditLog());
  const currency = getConfig().localization.currency;
  return toRecords(getVendors()).map((vendor) => {
    const vendorId = String(vendor.vendorId ?? vendor.id);
    const vendorName = String(vendor.vendorName ?? vendor.name ?? vendorId);
    const orders = purchaseOrders.filter((order) =>
      String(order.vendorId ?? "") === vendorId ||
      String(order.vendorName ?? "").toLowerCase() === vendorName.toLowerCase(),
    );
    const cancelledOrders = orders.filter((order) => /cancel/i.test(String(order.status ?? "")));
    const acceptedOrders = orders.filter((order) => /accept|process|deliver|complete/i.test(String(order.status ?? "")));
    const deliveredOrders = orders.filter((order) => /deliver|complete/i.test(String(order.status ?? "")));
    const items = orders.flatMap((order) => Array.isArray(order.items) ? order.items as ReportRecord[] : []);
    const quantityOf = (item: ReportRecord) => Number(item.qty ?? item.quantity ?? 0);
    const itemsOrdered = items.reduce((total, item) => total + quantityOf(item), 0)
      || orders.reduce((total, order) => total + Number(order.qty ?? 0), 0);
    const itemsDelivered = items.reduce((total, item) =>
      total + (/deliver|complete|received/i.test(String(item.status ?? "")) ? quantityOf(item) : 0), 0,
    ) || deliveredOrders.reduce((total, order) => total + Number(order.qty ?? 0), 0);
    const datedDeliveries = deliveredOrders.flatMap((order) => {
      const expected = order.requestedDelivery ?? order.expectedDeliveryDate;
      const actual = order.deliveredAt ?? order.actualDeliveryDate ?? order.deliveryDate;
      const expectedTime = expected ? new Date(String(expected)).getTime() : Number.NaN;
      const actualTime = actual ? new Date(String(actual)).getTime() : Number.NaN;
      return Number.isFinite(expectedTime) && Number.isFinite(actualTime) ? [{
        onTime: actualTime <= expectedTime,
      }] : [];
    });
    const matchingSlaEvents = slaEvents.filter((event) =>
      (String(event.vendorId ?? "") === vendorId ||
        String(event.vendorName ?? "").toLowerCase() === vendorName.toLowerCase()) &&
      /breach|missed|penalty/i.test(String(event.status ?? event.outcome ?? event.event ?? "")),
    );
    const poSpend = orders.reduce((total, order) => total + Number(order.grandTotal ?? order.totalAmount ?? 0), 0);
    const totalSpend = Number(vendor.totalSpend ?? 0) || poSpend;
    return {
      ...vendor,
      vendorId,
      vendorName,
      ordersReceived: orders.length,
      ordersAccepted: acceptedOrders.length,
      ordersCancelled: cancelledOrders.length,
      itemsOrdered,
      itemsDelivered,
      onTimeDeliveries: datedDeliveries.filter((delivery) => delivery.onTime).length,
      lateDeliveries: datedDeliveries.filter((delivery) => !delivery.onTime).length,
      onTimeDeliveryPercent: datedDeliveries.length
        ? datedDeliveries.filter((delivery) => delivery.onTime).length / datedDeliveries.length * 100
        : undefined,
      fulfillmentPercent: itemsOrdered ? itemsDelivered / itemsOrdered * 100 : undefined,
      averageResponseHours: vendor.averageResponseHours ?? vendor.responseHours,
      averageLeadTimeDays: vendor.averageLeadTimeDays ?? vendor.leadTimeDays,
      qualityScore: vendor.performanceQuality ?? vendor.rating,
      complianceScore: vendor.performanceCompliance,
      complaintCount: vendor.complianceIssues,
      slaBreachCount: matchingSlaEvents.length,
      penaltyAmount: matchingSlaEvents.reduce((total, event) => total + Number(event.penaltyAmount ?? 0), 0) || undefined,
      currency: vendor.currency ?? currency,
      totalSpend,
      performanceRating: vendor.rating ?? vendor.score,
    };
  });
}

function mapClientMasterRecords(): ReportRecord[] {
  return toRecords(getClients()).map((client) => {
    const onboarding = client.onboardingFormData ?? client.lastUpdatedFormData ?? {};
    return {
      ...client,
      clientId: client.clientId ?? client.id,
      clientName: client.clientName ?? client.name,
      onboarding: onboarding as ReportRecord,
    };
  });
}

function mapClientContracts(): ReportRecord[] {
  return getClients().flatMap((client) => {
    const contract = getClientContract(String(client.id));
    return contract ? [{
      ...(contract as unknown as ReportRecord),
      clientId: client.id,
      clientName: client.name,
    }] : [];
  });
}

function mapClientActivityRecords(): ReportRecord[] {
  return getClients().flatMap((client) =>
    getClientActivities(String(client.id)).map((activity) => ({
      ...(activity as unknown as ReportRecord),
      clientId: client.id,
      clientName: client.name,
    })),
  );
}

function mapClientDocumentRecords(): ReportRecord[] {
  return getClients().flatMap((client) =>
    getClientDocuments(String(client.id)).map((document) => ({
      ...(document as unknown as ReportRecord),
      clientId: client.id,
      clientName: client.name,
    })),
  );
}

function mapPortalUserRecords(): ReportRecord[] {
  const clientNames = new Map(getClients().map((client) => [String(client.id), String(client.name ?? client.id)]));
  return getPortalUsers().map((user) => ({
    ...(user as unknown as ReportRecord),
    clientName: clientNames.get(String(user.clientId)) ?? "",
  }));
}

function mapPortalRoleRecords(): ReportRecord[] {
  return getClients().flatMap((client) =>
    getPortalRoles(String(client.id)).map((role) => ({
      ...(role as unknown as ReportRecord),
      clientId: client.id,
      clientName: client.name,
    })),
  );
}

function mapUserNotesAndDocuments(kind: "notes" | "documents"): ReportRecord[] {
  return getUsers().flatMap((user) => {
    const details = kind === "notes" ? getUserNotes(String(user.id)) : getUserDocuments(String(user.id));
    return details.map((detail) => ({
      ...(detail as unknown as ReportRecord),
      userId: user.id,
      userName: user.name,
      department: user.department,
    }));
  });
}

function mapUserLoginHistory(): ReportRecord[] {
  return toRecords(getUsers()).flatMap((user) => {
    const history = Array.isArray(user.loginHistory) ? user.loginHistory as ReportRecord[] : [];
    return history.map((login) => ({
      ...user,
      loginHistory: login,
      login,
      userId: user.id,
      userName: user.name,
    }));
  });
}

function mapRolePermissions(): ReportRecord[] {
  return Object.entries(getAllRolePermissions()).flatMap(([roleName, modules]) =>
    Object.entries(modules).map(([module, actions]) => ({
      ...(actions as ReportRecord),
      roleName,
      module,
    })),
  );
}

function mapClientRolePermissions(): ReportRecord[] {
  const users = getPortalUsers();
  return mapPortalRoleRecords().flatMap((role) => {
    const permissions = Array.isArray(role.permissions) ? role.permissions : [];
    const assignedUserCount = users.filter((user) =>
      String(user.clientId) === String(role.clientId) && user.role === role.name,
    ).length;
    const rows = permissions.length ? permissions : [{}];
    return rows.map((permission) => ({
      ...role,
      permission,
      ...permission,
      permissions,
      assignedUserCount,
    }));
  });
}

function mapServiceRequests(module?: string): ReportRecord[] {
  const requests = toRecords(getServiceRequests()).map((request) => {
    const payload = request.payload && typeof request.payload === "object" && !Array.isArray(request.payload)
      ? request.payload as ReportRecord
      : {};
    return { ...payload, ...request, payload };
  });
  if (!module) return requests;
  const query = module.toLowerCase();
  const terms: Record<string, string[]> = {
    "AMC Requests": ["amc"],
    "Repair Requests": ["repair"],
    "Rental Requests": ["rental"],
    "Recycle and Disposal Requests": ["recycle", "disposal"],
    "Regular Purchase Requests": ["regular purchase", "purchase request"],
  };
  const matches = terms[module] ?? [];
  return requests.filter((request) => {
    const searchable = [request.type, request.requestType, request.category, request.serviceType, request.title]
      .map((value) => String(value ?? "").toLowerCase()).join(" ");
    return matches.some((term) => searchable.includes(term)) || searchable.includes(query);
  });
}

function mapPurchaseOrders(): ReportRecord[] {
  return toRecords(getAllPOs());
}

function mapInvoiceRecords(): ReportRecord[] {
  return toRecords(getInvoices()).map((record) => ({ ...record, documentType: "Invoice" }));
}

function mapInvoicePaymentAndActivityRecords(): ReportRecord[] {
  return mapInvoiceRecords().flatMap((invoice) => {
    const payments = Array.isArray(invoice.payments) ? invoice.payments as ReportRecord[] : [];
    const activities = [
      ...(Array.isArray(invoice.activity) ? invoice.activity as ReportRecord[] : []),
      ...(Array.isArray(invoice.activities) ? invoice.activities as ReportRecord[] : []),
    ];
    return [
      ...payments.map((payment) => ({
        ...invoice,
        payment,
        eventType: "Payment",
        recordedAt: payment.date ?? payment.createdAt,
      })),
      ...activities.map((activity) => ({
        ...invoice,
        activity,
        eventType: "Activity",
        recordedAt: activity.date ?? activity.createdAt,
      })),
    ];
  });
}

function mapReceiptAllocationRecords(): ReportRecord[] {
  const invoicesByNumber = new Map(
    getInvoices().map((invoice) => [String(invoice.invoiceNumber), invoice]),
  );
  return toRecords(getReceipts()).map((receipt) => {
    const invoice = invoicesByNumber.get(String(receipt.invoiceNumber));
    const amount = receipt.amountReceived;
    return {
      ...receipt,
      receiptId: receipt.id,
      clientId: invoice?.clientId,
      invoiceId: invoice?.id,
      allocationDate: receipt.paymentDate,
      allocatedAmount: amount,
      allocatedBy: receipt.createdBy,
      reversalReference: receipt.reference,
      allocation: {
        invoiceNumber: receipt.invoiceNumber,
        amount,
        date: receipt.paymentDate,
        status: receipt.status,
      },
    };
  });
}

function linkedChildRecords(
  records: ReportRecord[],
  childKeys: string[],
  relation: "clientOrder" | "quote" | "salesOrder" | "invoice" | "receipt" | "creditNote" | "purchaseOrder" | "bill" | "payment" | "vendorCredit" | "ticket" | "serviceRequest" | "product",
): ReportRecord[] {
  return childRecords(records, childKeys).map((child) => {
    const parentId = String(child.parentRecordId ?? "");
    const clientId = child.clientId ?? getClients().find(
      (client) => String(client.name).toLowerCase() === String(child.clientName ?? child.customerName ?? "").toLowerCase(),
    )?.id;
    const links: Record<typeof relation, ReportRecord> = {
      clientOrder: { clientOrderId: parentId, orderId: parentId },
      quote: { quoteId: parentId, quoteNumber: child.quoteNumber },
      salesOrder: { salesOrderId: parentId, orderId: parentId, clientId },
      invoice: { invoiceId: parentId, clientId },
      receipt: { receiptId: parentId },
      creditNote: { creditNoteId: parentId },
      purchaseOrder: { purchaseOrderId: parentId, poNumber: child.poNumber },
      bill: { billId: parentId },
      payment: { paymentId: parentId },
      vendorCredit: { vendorCreditId: parentId },
      ticket: { ticketId: parentId },
      serviceRequest: { serviceRequestId: parentId },
      product: { masterProductId: parentId, productId: parentId },
    };
    const linked = { ...child, ...links[relation], ...(clientId ? { clientId } : {}) };
    const quantity = Number(linked.qty ?? linked.quantity);
    const rate = Number(linked.rate ?? linked.unitPrice ?? linked.price);
    const discount = Number(linked.discount ?? 0);
    const taxPercent = Number(linked.taxPercent ?? linked.gstPct ?? 0);
    const hasLineAmountInputs =
      (linked.qty !== undefined || linked.quantity !== undefined) &&
      (linked.rate !== undefined || linked.unitPrice !== undefined || linked.price !== undefined) &&
      Number.isFinite(quantity) && Number.isFinite(rate);
    const taxableAmount = Number(linked.lineTaxableAmount ?? linked.lineSubtotal ?? linked.taxableAmount);
    const effectiveTaxable = Number.isFinite(taxableAmount)
      ? taxableAmount
      : hasLineAmountInputs
        ? Math.max(0, quantity * rate - (Number.isFinite(discount) ? discount : 0))
        : undefined;
    const lineTaxAmount = Number(linked.lineTaxAmount ?? linked.taxAmount);
    const effectiveTax = Number.isFinite(lineTaxAmount)
      ? lineTaxAmount
      : effectiveTaxable !== undefined && Number.isFinite(taxPercent)
        ? effectiveTaxable * taxPercent / 100
        : undefined;
    return {
      ...linked,
      ...(effectiveTaxable !== undefined ? { lineTaxableAmount: effectiveTaxable } : {}),
      ...(effectiveTax !== undefined ? { lineTaxAmount: effectiveTax } : {}),
      ...(effectiveTaxable !== undefined && effectiveTax !== undefined
        ? { lineTotal: Number(linked.lineTotal ?? effectiveTaxable + effectiveTax) }
        : {}),
    };
  });
}

function mapPaymentMadeRecords(): ReportRecord[] {
  return getPaymentsMade();
}

function mapCreditNotes(): ReportRecord[] {
  return readLocalArray("nido_credit_notes_v3");
}

function mapRenewals(): ReportRecord[] {
  return [
    ...readLocalArray("nidoRenewals").map((record) => ({ ...record, renewalSource: "Active" })),
    ...readLocalArray("nidoRenewalHistory").map((record) => ({ ...record, renewalSource: "History" })),
  ];
}

function mapExpenses(): ReportRecord[] {
  return readLocalArray("nido_expenses_v1");
}

function mapSlaRecords(module: string): ReportRecord[] {
  switch (module) {
    case "Vendor SLA Policies": return recordsFrom(getVendorSLA());
    case "Client SLA Tiers": return toRecords(getClientSLA());
    case "Procurement SLA Stages": return toRecords(getProcurementSLA());
    case "Service SLA Policies": return toRecords(getServiceSLA());
    case "Approval SLA Policies": return toRecords(getApprovalSLA());
    case "SLA Escalation Rules": return toRecords(getEscalationRules());
    case "SLA Business Calendar": return recordsFrom(getBusinessCalendar());
    case "SLA Audit History":
    case "SLA Outcomes and Breaches":
      return toRecords(getSLAAuditLog());
    default:
      return [];
  }
}

function mapTaxReconciliationRecords(): ReportRecord[] {
  return [
    ...mapInvoiceRecords().map((record) => ({ ...record, transactionType: "Sales invoice" })),
    ...getBills().map((record) => ({ ...record, transactionType: "Vendor bill" })),
    ...toRecords(getReceipts()).map((record) => ({ ...record, transactionType: "Payment receipt" })),
    ...getPaymentsMade().map((record) => ({ ...record, transactionType: "Vendor payment" })),
  ];
}

function mapClientDashboardRecords(): ReportRecord[] {
  const clients = mapClientMasterRecords();
  const orders = mapClientOrderRecords();
  const salesOrders = toRecords(getOrders());
  const services = mapClientServiceRecords();
  const tickets = toRecords(getSupportTickets());
  const invoices = mapInvoiceRecords();
  const purchaseOrders = mapPurchaseOrders();
  const vendors = getVendors();
  const allApprovals = getApprovalRecords();
  const renewals = mapRenewals();
  const activeClients = clients.filter((client) => !/inactive|archived/i.test(String(client.status ?? "")));
  const activeVendors = vendors.filter((vendor) => !/inactive|archived/i.test(String(vendor.status ?? "")));
  const now = new Date();
  const recentOrderCutoff = now.getTime() - 30 * 24 * 60 * 60 * 1000;
  const currency = getConfig().localization.currency;
  return clients.map((client) => {
    const clientId = String(client.clientId ?? client.id);
    const clientName = String(client.clientName ?? client.name ?? clientId);
    const belongsToClient = (record: ReportRecord) =>
      String(record.clientId ?? record.customerId ?? record.clientName ?? record.customerName ?? "") === clientId ||
      String(record.clientName ?? record.customerName ?? "") === clientName;
    const clientOrders = [...orders, ...salesOrders].filter(belongsToClient);
    const distinctOrders = [...new Map(clientOrders.map((order, index) => [
      `${order.id ?? order.orderNumber ?? index}`,
      order,
    ])).values()];
    const clientTickets = tickets.filter(belongsToClient);
    const clientInvoices = invoices.filter(belongsToClient);
    const clientPurchaseOrders = purchaseOrders.filter((order) => {
      const sourceOrder = salesOrders.find((salesOrder) =>
        String(salesOrder.id) === String(order.orderId),
      );
      return sourceOrder ? belongsToClient(sourceOrder) : false;
    });
    const isOpen = (status: unknown) => !/closed|resolved|cancelled|complete|paid/i.test(String(status ?? ""));
    const revenueRecords = clientInvoices.length
      ? clientInvoices
      : orders.filter(belongsToClient);
    const salesRevenue = revenueRecords.reduce(
      (total, record) => total + Number(record.grandTotal ?? record.totalAmount ?? record.amountNum ?? record.amount ?? 0),
      0,
    );
    const procurementSpend = clientPurchaseOrders.reduce(
      (total, record) => total + Number(record.grandTotal ?? record.totalAmount ?? 0),
      0,
    );
    const dueSoon = now.getTime() + 30 * 24 * 60 * 60 * 1000;
    return {
      ...client,
      clientId,
      clientName,
      activeClientCount: activeClients.length,
      activeVendorCount: activeVendors.length,
      newOrderCount: distinctOrders.filter((order) => {
        const rawDate = order.orderDate ?? order.date ?? order.createdAt;
        const dateTime = rawDate ? new Date(String(rawDate)).getTime() : Number.NaN;
        return Number.isFinite(dateTime) && dateTime >= recentOrderCutoff;
      }).length,
      pendingOrderCount: distinctOrders.filter((order) => isOpen(order.status)).length,
      deliveredOrderCount: distinctOrders.filter((order) => /deliver|complete/i.test(String(order.status ?? ""))).length,
      openTicketCount: clientTickets.filter((ticket) => isOpen(ticket.status)).length,
      overdueInvoiceCount: clientInvoices.filter((invoice) =>
        isOpen(invoice.status) && invoice.dueDate && new Date(String(invoice.dueDate)).getTime() < now.getTime(),
      ).length,
      salesRevenue,
      procurementSpend,
      grossMarginPercent: salesRevenue > 0
        ? ((salesRevenue - procurementSpend) / salesRevenue) * 100
        : undefined,
      pendingApprovalCount: allApprovals.filter((approval) =>
        belongsToClient(approval) && /pending|review|submitted/i.test(String(approval.status ?? "")),
      ).length,
      upcomingRenewalCount: renewals.filter((renewal) => {
        if (!belongsToClient(renewal)) return false;
        const rawDate = renewal.renewalDate ?? renewal.nextRenewalDate ?? renewal.endDate;
        const renewalTime = rawDate ? new Date(String(rawDate)).getTime() : Number.NaN;
        return Number.isFinite(renewalTime) && renewalTime >= now.getTime() && renewalTime <= dueSoon;
      }).length,
      currency,
      orderCount: distinctOrders.length,
      serviceRequestCount: services.filter(belongsToClient).length,
      supportTicketCount: clientTickets.length,
    };
  });
}

function mapServiceAppointmentRecords(): ReportRecord[] {
  return mapServiceRequests().flatMap((request) => {
    const assignment = request.assignment && typeof request.assignment === "object"
      ? request.assignment as ReportRecord
      : {};
    const appointments = [
      ...(Array.isArray(request.appointments) ? request.appointments as ReportRecord[] : []),
      ...(Array.isArray(request.visitSchedule) ? request.visitSchedule as ReportRecord[] : []),
      ...(Array.isArray(request.visits) ? request.visits as ReportRecord[] : []),
      ...(Array.isArray(request.payload) ? request.payload as ReportRecord[] : []),
    ];
    if (!appointments.length && !Object.keys(assignment).length) return [];
    return appointments.length
      ? appointments.map((appointment) => ({ ...request, assignment, appointment }))
      : [{ ...request, assignment, appointment: {} }];
  });
}

function getReportRunRecords(module: string, entityType?: ReportEntityType): ReportRecord[] | undefined {
  switch (module) {
    case "Client Master and Onboarding":
    case "Client Addresses":
      return mapClientMasterRecords();
    case "Client Contracts":
      return mapClientContracts();
    case "Client Users and External Stakeholders":
      return mapPortalUserRecords();
    case "Client Roles and Permissions":
      return mapClientRolePermissions();
    case "Client Activity":
      return mapClientActivityRecords();
    case "Client Documents":
      return mapClientDocumentRecords();
    case "Client Order Items":
      return linkedChildRecords(mapClientOrderRecords(), ["productDetails", "items", "cartItems"], "clientOrder");
    case "Sales Quotes":
      return toRecords(getQuotes());
    case "Sales Quote Items":
      return linkedChildRecords(toRecords(getQuotes()), ["lineItems", "items", "products"], "quote");
    case "Sales Orders":
      return toRecords(getOrders());
    case "Sales Order Items":
      return linkedChildRecords(toRecords(getOrders()), ["lineItems", "items", "cartItems"], "salesOrder");
    case "Invoices and Proforma Invoices":
      return mapInvoiceRecords();
    case "Invoice Items":
      return linkedChildRecords(mapInvoiceRecords(), ["lineItems", "items"], "invoice");
    case "Invoice Payments and Activity":
      return mapInvoicePaymentAndActivityRecords();
    case "Recurring Invoices":
      return toRecords(getAllRecurring());
    case "Payment Receipts":
      return toRecords(getReceipts()).map((record) => ({ ...record, paymentType: "Client receipt" }));
    case "Receipt Allocations":
      return mapReceiptAllocationRecords();
    case "Credit Notes":
      return mapCreditNotes();
    case "Credit Note Items":
      return childRecords(mapCreditNotes(), ["lineItems", "items", "products"]);
    case "Renewals":
      return mapRenewals();
    case "Client Catalog":
      return mapClientCatalogRecords();
    case "Services Request Register":
      return mapServiceRequests();
    case "AMC Requests":
    case "Repair Requests":
    case "Rental Requests":
    case "Recycle and Disposal Requests":
    case "Regular Purchase Requests":
      return mapServiceRequests(module);
    case "AMC Visit Schedule":
      return childRecords(mapServiceRequests("AMC Requests"), ["visits", "visitSchedule", "appointments"]);
    case "Regular Purchase Items":
      return linkedChildRecords(mapServiceRequests("Regular Purchase Requests"), ["items", "lineItems", "products"], "serviceRequest");
    case "Service Appointments and Assignments":
      return mapServiceAppointmentRecords();
    case "Support Parent Tickets":
      return toRecords(getSupportTickets());
    case "Support Child Tickets":
      return childRecords(toRecords(getSupportTickets()), ["children", "childTickets", "subTickets"]);
    case "Ticket Conversations and Attachments":
      return childRecords(toRecords(getSupportTickets()), ["conversations", "messages", "attachments", "replies"]);
    case "Vendor Orders":
    case "Purchase Orders":
      return mapPurchaseOrders();
    case "Vendor Order Items":
    case "Purchase Order Items":
      return linkedChildRecords(mapPurchaseOrders(), ["lineItems", "items", "products", "subOrders"], "purchaseOrder");
    case "Vendor PO Notes":
      return childRecords(mapPurchaseOrders(), ["notes", "activity", "activities"]);
    case "Vendor PO Documents":
      return childRecords(mapPurchaseOrders(), ["documents", "attachments", "files"]);
    case "Bills":
      return getBills();
    case "Bill Items":
      return linkedChildRecords(getBills(), ["lineItems", "items", "products"], "bill");
    case "Payments Made":
      return getPaymentsMade();
    case "Payment Made Allocations":
      return linkedChildRecords(getPaymentsMade(), ["allocations", "applications", "billAllocations"], "payment");
    case "Vendor Credits":
      return getVendorCredits();
    case "Vendor Credit Items":
      return linkedChildRecords(getVendorCredits(), ["lineItems", "items", "products"], "vendorCredit");
    case "Vendor Master and Onboarding":
      return toRecords(getVendors()).map((record) => ({
        ...record,
        vendorId: record.vendorId ?? record.id,
        vendorName: record.vendorName ?? record.name,
      }));
    case "Vendor Categories":
      return mapVendorCategories();
    case "Vendor Payments Overview":
      return [...getBills(), ...getPaymentsMade()];
    case "Vendor Catalog":
      return entityType === "client" ? mapClientCatalogRecords() : mapVendorProducts();
    case "Nido Users":
      return toRecords(getUsers());
    case "User Login History":
      return mapUserLoginHistory();
    case "Nido Roles":
      return toRecords(getRoles());
    case "Role Permissions":
      return mapRolePermissions();
    case "Departments and Hierarchy":
      return mapDepartments();
    case "User Notes":
      return mapUserNotesAndDocuments("notes");
    case "User Documents":
      return mapUserNotesAndDocuments("documents");
    case "Automatic Assignment Rules":
      return toRecords(getAutoAssignmentSettings().rules);
    case "Master Catalog":
    case "Product Specifications":
    case "Product Commercial Terms":
    case "Product Categories Brands and Tags":
      return toRecords(getCatalogProducts());
    case "Product Variants":
      return linkedChildRecords(toRecords(getCatalogProducts()), ["variants", "variations", "options"], "product");
    case "Price Engine and Vendor Comparison":
    case "Vendor Pricing Charges":
      return toRecords(getAllProductPricing());
    case "Client Pricing and Margins":
      return toRecords(getAllClientPricing());
    case "Pricing Slabs and Rules":
      return getClients().flatMap((client) =>
        getClientPriceSlabs(String(client.id)).map((slab) => ({
          ...(slab as unknown as ReportRecord),
          clientId: client.id,
          clientName: client.name,
        })),
      );
    case "Inventory Balances":
      return toRecords(getCatalogProducts()).map((product) => ({
        ...product,
        ...(getAllThresholds()[String(product.masterProductCode ?? product.id)] ?? {}),
      }));
    case "Stock Movements":
      return toRecords(getStockHistory());
    case "Returns and Cancellations": {
      const candidates = [
        ...toRecords(getOrders()).map((record) => ({ ...record, transactionType: "Sales order" })),
        ...mapPurchaseOrders().map((record) => ({ ...record, transactionType: "Purchase order" })),
        ...mapServiceRequests().map((record) => ({ ...record, transactionType: "Service request" })),
      ];
      return candidates.filter((record) => /cancel|return|refund/i.test(
        [record.status, record.type, record.requestType, record.reason].map((value) => String(value ?? "")).join(" "),
      ));
    }
    case "Approval Workflows":
    case "Approval Workflow Conditions":
    case "Approval Workflow Levels":
    case "Approval Requests":
    case "Approval Decisions and History":
    case "Approvals":
      return approvalRecordsForModule(
        module,
        getApprovalRecords().filter((record) => record.recordType === "Workflow"),
        getApprovalRecords().filter((record) => record.recordType === "Request"),
      );
    case "Vendor SLA Policies":
    case "Client SLA Tiers":
    case "Procurement SLA Stages":
    case "Service SLA Policies":
    case "Approval SLA Policies":
    case "SLA Escalation Rules":
    case "SLA Business Calendar":
    case "SLA Audit History":
    case "SLA Outcomes and Breaches":
      return mapSlaRecords(module);
    case "Client and Vendor Spend":
      return getAllFinanceRecords();
    case "Sales Revenue and Profit":
      return [
        ...toRecords(getOrders()).map((record) => ({ ...record, documentType: "Sales order" })),
        ...mapInvoiceRecords(),
        ...toRecords(getQuotes()).map((record) => ({ ...record, documentType: "Quote" })),
      ];
    case "AR and AP Ageing":
      return [...mapInvoiceRecords(), ...getBills()];
    case "Vendor Performance":
      return mapVendorPerformance();
    case "Dashboard and Client Activity Summary":
      return mapClientDashboardRecords();
    case "Organization and General Settings":
      return recordsFrom(getConfig());
    case "Order Status Configuration":
      return recordsFrom(getOrderStatusConfig());
    case "Tax Audit":
      return toRecords(getTaxAuditLog());
    case "Tax Transaction Reconciliation":
      return mapTaxReconciliationRecords();
    case "Audit and Impersonation":
    case "Audit Trail":
      return getAuditRecords();
    case "Report Definitions":
      return [...toRecords(getBuiltinReportViews()), ...toRecords(getCustomReports())];
    case "Scheduled Reports":
      return toRecords(getReportCenterSchedules());
    case "Report Download and Email History":
      return toRecords(getReportCenterHistory());
    case "Expenses":
      return mapExpenses();
    case "Transactions Ledger":
      return [
        ...getAllFinanceRecords(),
        ...mapExpenses(),
        ...toRecords(getOrders()).map((record) => ({ ...record, documentType: "Sales order" })),
      ];
    default:
      return undefined;
  }
}

export function getReportCenterRecords(module: string, entityType?: ReportEntityType): ReportRecord[] {
  const liveRecords = getReportRunRecords(module, entityType);
  if (liveRecords) return liveRecords;
  switch (module) {
    case "Products / Catalog":
      return mapVendorProducts();
    case "Vendor Orders":
    case "Purchase Orders":
    case "Procurement Reports":
      return toRecords(getAllPOs());
    case "RFQs":
      throw new Error("RFQ records cannot be loaded because this installation has no RFQ request data source.");
    case "Client Orders":
      return mapClientOrderRecords();
    case "Orders":
      return toRecords(getOrders());
    case "Catalog":
    case "Inventory":
      if (module === "Inventory") return toRecords(getStockHistory());
      return entityType === "client" ? mapClientCatalogRecords() : toRecords(getCatalogProducts());
    case "Services":
      if (entityType === "client") return mapClientServiceRecords();
      return toRecords(getServiceRequests());
    case "Support":
      return toRecords(getSupportTickets());
    case "Invoices / Bills":
      if (entityType === "client") {
        return toRecords(getInvoices()).map((record) => ({ ...record, documentType: "Invoice" }));
      }
      if (entityType === "vendor") return getBills();
      return [...toRecords(getInvoices()).map((record) => ({ ...record, documentType: "Invoice" })), ...getBills()];
    case "Payments":
      if (entityType === "client") {
        return toRecords(getReceipts()).map((record) => ({ ...record, paymentType: "Client receipt" }));
      }
      if (entityType === "vendor") return getPaymentsMade();
      return [...toRecords(getReceipts()).map((record) => ({ ...record, paymentType: "Client receipt" })), ...getPaymentsMade()];
    case "Vendor Credits":
      return getVendorCredits();
    case "SLA":
      return toRecords(getSLAAuditLog());
    case "Users":
    case "Internal Stakeholders":
      return toRecords(getUsers());
    case "Departments":
      return mapDepartments();
    case "Approvals":
      return getApprovalRecords();
    case "Finance":
      return getAllFinanceRecords();
    case "Audit Trail":
      return getAuditRecords();
    case "Tax":
      return toRecords(getTaxAuditLog());
    case "Sales Reports":
      return [
        ...toRecords(getOrders()).map((record) => ({ ...record, documentType: "Sales order" })),
        ...toRecords(getInvoices()).map((record) => ({ ...record, documentType: "Invoice" })),
        ...toRecords(getQuotes()).map((record) => ({ ...record, documentType: "Quote" })),
      ];
    case "Vendor Performance":
      return [
        ...toRecords(getVendors()).map((record) => ({
          ...record,
          vendorId: record.vendorId ?? record.id,
          vendorName: record.vendorName ?? record.name,
        })),
        ...toRecords(getAllPOs()),
      ];
    case "Client Reports":
      return [
        ...toRecords(getClients()).map((record) => ({
          ...record,
          clientId: record.clientId ?? record.id,
          clientName: record.clientName ?? record.name,
          documentType: "Client",
        })),
        ...toRecords(getOrders()),
        ...toRecords(getServiceRequests()),
        ...mapClientOrderRecords().map((record) => ({
          ...record,
          documentType: "Client order",
          documentNumber: record.orderNumber ?? record.orderId ?? record.id,
          date: record.orderDate ?? record.date,
        })),
        ...mapClientServiceRecords().map((record) => ({
          ...record,
          documentType: "Service",
          documentNumber: record.id,
          date: record.startDate,
        })),
      ];
    case "External Stakeholders":
      return [
        ...toRecords(getClients()).map((record) => ({
          ...record,
          clientId: record.clientId ?? record.id,
          clientName: record.clientName ?? record.name,
          entityType: "Client",
        })),
        ...toRecords(getVendors()).map((record) => ({
          ...record,
          vendorId: record.vendorId ?? record.id,
          vendorName: record.vendorName ?? record.name,
          entityType: getVendorStakeholderType(record),
        })),
      ];
    case "Executive Dashboard":
      return getReportRecords("All Modules");
    case "Custom Reports":
      return toRecords(getCustomReports());
    default:
      throw new Error(`Report data source is not configured for "${module}".`);
  }
}

export async function loadReportCenterRecords(module: string, entityType?: ReportEntityType): Promise<ReportRecord[]> {
  const approvalModules = new Set([
    "Approval Workflows",
    "Approval Workflow Conditions",
    "Approval Workflow Levels",
    "Approval Requests",
    "Approval Decisions and History",
    "Approvals",
  ]);
  if (!approvalModules.has(module)) return getReportCenterRecords(module, entityType);
  try {
    const bootstrap = await loadApprovalBootstrap();
    const workflows = bootstrap.workflows.map((record) => ({ ...record, recordType: "Workflow" })) as unknown as ReportRecord[];
    const requests = bootstrap.requests.map((record) => ({ ...record, recordType: "Request" })) as unknown as ReportRecord[];
    return approvalRecordsForModule(module, workflows, requests);
  } catch {
    return getReportCenterRecords(module, entityType);
  }
}

export function getReportCenterEntities(): Record<ReportEntityType, { id: string; name: string }[]> {
  return {
    client: getClients().map((client) => ({ id: String(client.id), name: String(client.name ?? client.id) })),
    vendor: getVendors().map((vendor) => ({ id: String(vendor.id), name: String(vendor.name ?? vendor.id) })),
    internal: mapDepartments().map((department) => ({ id: String(department.id), name: String(department.department) })),
  };
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const VALUE_ALIASES: Record<string, string[]> = {
  "Vendor Name": ["vendorName", "supplierName"],
  "Product Name": ["productName", "itemName", "item", "name"],
  "Item Name": ["productName", "itemName", "item", "name"],
  "Client Email": ["clientEmail", "customerEmail", "email"],
  "Vendor Email": ["vendorEmail", "supplierEmail", "email"],
  "Client Phone": ["clientPhone", "customerPhone", "phone", "mobile"],
  "Vendor Phone": ["vendorPhone", "supplierPhone", "phone", "mobile"],
  SKU: ["sku", "masterProductCode", "itemCode"],
  "Product Code": ["productCode", "masterProductCode"],
  "Unit Price": ["unitPrice", "unitCost", "price", "rate"],
  "Unit Cost": ["unitCost", "costPrice", "rate", "price"],
  Price: ["price", "unitPrice", "sellingPrice"],
  Stock: ["stock", "currentStock", "physicalStock", "quantity", "qty", "onHand"],
  "Reserved Stock": ["reservedStock", "reserved"],
  "Incoming Stock": ["incomingStock", "incoming"],
  MOQ: ["moq", "minimumOrderQuantity"],
  "Lead Time": ["leadTime", "leadTimeDays"],
  Quantity: ["quantity", "qty", "units"],
  Qty: ["qty", "quantity", "units"],
  Rate: ["rate", "unitPrice", "price", "unitCost"],
  "Tax Percent": ["taxPercent", "gstPct", "taxRate"],
  "Line Taxable Amount": ["lineTaxableAmount", "lineSubtotal", "taxableAmount"],
  "Line Tax Amount": ["lineTaxAmount", "taxAmount"],
  "Line Total": ["lineTotal", "lineAmount", "totalAmount"],
  "Sales Order ID": ["salesOrderId", "orderId", "parentRecordId"],
  "Purchase Order ID": ["purchaseOrderId", "poId", "parentRecordId"],
  "Invoice ID": ["invoiceId"],
  "Receipt ID": ["receiptId", "paymentReceiptId", "id"],
  "Payment ID": ["paymentId", "id"],
  "Credit Note ID": ["creditNoteId", "id"],
  "Ticket ID": ["ticketId", "number", "id"],
  "Client Name": ["clientName", "customerName", "client", "customer"],
  "Order ID": ["orderNumber", "orderId", "id"],
  "Order Date": ["orderDate", "date", "createdAt"],
  "Order Status": ["status"],
  "PO Reference": ["poNumber", "purchaseOrderNumber"],
  "PO Number": ["poNumber", "purchaseOrderNumber"],
  "Invoice / Bill Number": ["invoiceNumber", "billNumber", "number"],
  "Document Number": ["invoiceNumber", "billNumber", "orderNumber", "poNumber", "number"],
  "Payment Number": ["paymentNumber", "receiptNumber", "number", "reference", "id"],
  "Payment Date": ["paymentDate", "receiptDate", "date", "createdAt"],
  "Allocation Date": ["allocationDate", "paymentDate", "date", "createdAt"],
  "Allocated Amount": ["allocatedAmount", "amountAllocated", "amount"],
  "Allocated By": ["allocatedBy", "createdBy", "recordedBy"],
  "Reversal Reference": ["reversalReference", "reversalRef"],
  "Category ID": ["categoryId", "id"],
  "Category Name": ["categoryName", "category"],
  "Vendor Count": ["vendorCount"],
  "Assigned User Count": ["assignedUserCount"],
  "Permission / Module": ["module", "moduleName", "permissionModule"],
  "Permission / View": ["view"],
  "Permission / Create": ["create"],
  "Permission / Edit": ["edit"],
  "Permission / Delete": ["delete"],
  "Permission / Approve": ["approve"],
  "Permission / Export": ["export"],
  "Permission / Import": ["import"],
  "Permission / Manage": ["manage"],
  "Permission / Configure": ["configure"],
  "Credit Number": ["creditNoteNumber", "creditNumber", "number"],
  "Associated Bill": ["associatedBillNumber", "billNumber"],
  "Request Date": ["requestDate", "createdAt", "date"],
  "Service Name": ["serviceName", "requestType", "name"],
  "Assigned To": ["assignedTo", "agent", "owner"],
  "Created On": ["createdAt", "createdOn", "createdDate", "date", "timestamp"],
  "Created date": ["createdAt", "createdOn", "createdDate", "date", "timestamp"],
  "Approved Date": ["approvalDate", "approvedDate", "approvedAt"],
  "Due Date": ["dueDate", "paymentDueDate"],
  "Delivery Date": ["deliveryDate", "expectedDeliveryDate"],
  "Department": ["department", "departmentName"],
  "User Count": ["userCount"],
  "Record Type": ["recordType", "type"],
  "Document Type": ["documentType", "recordType", "type"],
  "Entity Type": ["entityType"],
  "Payment Type": ["paymentType", "type"],
  "Payment Method": ["paymentMethod", "method"],
  Amount: ["grandTotal", "totalAmount", "amount", "total", "subtotal", "creditAmount"],
  Spend: ["grandTotal", "totalAmount", "amount", "total", "spend"],
  Rating: ["rating", "score"],
  "PO Count": ["poCount", "orderCount"],
  Timestamp: ["timestamp", "createdAt", "date"],
};

const PATH_SEGMENT_ALIASES: Record<string, string[]> = {
  onboarding: ["onboarding", "onboardingFormData", "lastUpdatedFormData"],
  permission: ["permission"],
  payment: ["payment"],
  activity: ["activity"],
  assignment: ["assignment", "assignmentDetails"],
  appointment: ["appointment", "appointmentDetails"],
  loginhistory: ["loginHistory", "login"],
  data: ["data", "payload"],
};

function findNestedValue(value: unknown, aliases: string[], seen = new WeakSet<object>(), depth = 0): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value) || depth > 6 || seen.has(value)) return undefined;
  seen.add(value);
  const object = value as Record<string, unknown>;
  for (const alias of aliases) {
    const key = Object.keys(object).find((candidate) => normalize(candidate) === normalize(alias));
    const candidate = key ? object[key] : undefined;
    if (candidate !== null && candidate !== undefined && candidate !== "") return candidate;
  }
  for (const nested of Object.values(object)) {
    if (!nested || typeof nested !== "object" || Array.isArray(nested)) continue;
    const match = findNestedValue(nested, aliases, seen, depth + 1);
    if (match !== undefined && match !== null && match !== "") return match;
  }
  return undefined;
}

function findValue(record: ReportRecord, column: string): unknown {
  const aliases = VALUE_ALIASES[column] ?? [column];
  for (const alias of aliases) {
    const key = Object.keys(record).find((candidate) => normalize(candidate) === normalize(alias));
    if (key && record[key] !== null && record[key] !== undefined && record[key] !== "") return record[key];
  }
  const path = column.split("/").map((segment) => segment.trim()).filter(Boolean);
  if (path.length > 1) {
    let current: unknown = record;
    for (const segment of path) {
      if (!current || typeof current !== "object" || Array.isArray(current)) {
        current = undefined;
        break;
      }
      const candidates = PATH_SEGMENT_ALIASES[normalize(segment)] ?? [segment];
      const key = Object.keys(current).find((candidate) =>
        candidates.some((candidateAlias) => normalize(candidate) === normalize(candidateAlias)),
      );
      current = key ? (current as Record<string, unknown>)[key] : undefined;
    }
    if (current !== null && current !== undefined && current !== "") return current;
  }
  const nested = findNestedValue(record, aliases);
  if (nested !== undefined) return nested;
  const fallback = getReportFieldValue(record, column);
  return fallback === "—" ? undefined : fallback;
}

export function getReportCenterCellValue(record: ReportRecord, column: string): string {
  const value = findValue(record, column);
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  if (/(amount|price|total|spend|cost)$/i.test(column)) {
    const amount = Number(value);
    if (Number.isFinite(amount)) return formatCurrency(amount);
  }
  if (/(date|timestamp|created on)$/i.test(column)) {
    const timestamp = value instanceof Date ? value.toISOString() : String(value);
    if (!Number.isNaN(new Date(timestamp).getTime())) return formatDate(timestamp);
  }
  return String(value);
}

export function filterReportCenterRecords(
  records: ReportRecord[],
  draft: {
    entityType: ReportEntityType;
    entityIds: string[];
    allEntities: boolean;
    dateBasis: string;
    dateFrom: string;
    dateTo: string;
  },
  entities: Record<ReportEntityType, { id: string; name: string }[]>,
): ReportRecord[] {
  let filtered = records;
  if (!draft.allEntities) {
    if (!draft.entityIds.length) return [];
    const names = new Set(
      (entities[draft.entityType] ?? [])
        .filter((entity) => draft.entityIds.includes(entity.id))
        .map((entity) => normalize(entity.name)),
    );
    const ids = new Set(draft.entityIds.map(normalize));
    filtered = filtered.filter((record) => {
      const candidates = draft.entityType === "vendor"
        ? [record.vendorId, record.vendorName, record.supplierId, record.supplierName]
        : draft.entityType === "client"
          ? [record.clientId, record.clientName, record.customerId, record.customerName, record.client]
          : [record.departmentId, record.department, record.departmentName];
      return candidates.some((candidate) => {
        if (candidate === null || candidate === undefined) return false;
        const value = normalize(String(candidate));
        return ids.has(value) || names.has(value);
      });
    });
  }

  if (!draft.dateFrom && !draft.dateTo) return filtered;
  const dateKeys: Record<string, string[]> = {
    "Created date": ["createdAt", "createdOn", "createdDate", "orderDate", "requestDate", "startDate", "date", "timestamp"],
    "Updated date": ["updatedAt", "modifiedAt", "lastUpdatedAt"],
    "Order date": ["orderDate", "invoiceDate", "billDate", "requestDate", "startDate", "date", "createdAt"],
    "Delivery date": ["deliveryDate", "expectedDeliveryDate", "dueDate", "endDate"],
  };
  const keys = dateKeys[draft.dateBasis] ?? dateKeys["Created date"];
  return filtered.filter((record) => {
    const key = Object.keys(record).find((candidate) => keys.some((alias) => normalize(alias) === normalize(candidate)));
    const raw = key ? record[key] : undefined;
    if (!raw) return false;
    const value = raw instanceof Date ? raw.toISOString().slice(0, 10) : String(raw).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const parsed = new Date(String(raw));
      if (Number.isNaN(parsed.getTime())) return false;
      const localValue = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
      return (!draft.dateFrom || localValue >= draft.dateFrom) && (!draft.dateTo || localValue <= draft.dateTo);
    }
    return (!draft.dateFrom || value >= draft.dateFrom) && (!draft.dateTo || value <= draft.dateTo);
  });
}

export function getReportCenterPreview(
  records: ReportRecord[],
  columns: string[],
): { id: string; values: Record<string, string> }[] {
  return records.slice(0, 100).map((record, index) => ({
    id: String(record.id ?? record.number ?? record.poNumber ?? record.orderNumber ?? index),
    values: Object.fromEntries(columns.map((column) => [column, getReportCenterCellValue(record, column)])),
  }));
}

export function getReportCenterExportData(
  records: ReportRecord[],
  columns: string[],
): { key: string; label: string }[] {
  return columns.map((column) => ({ key: column, label: column }));
}

export function getReportCenterRows(
  records: ReportRecord[],
  columns: string[],
): Record<string, string>[] {
  return records.map((record) => Object.fromEntries(columns.map((column) => [column, getReportCenterCellValue(record, column)])));
}

