import type { MyOrder, OrderCartItem } from "@/contexts/MyOrdersContext";
import type { ApprovalRequest } from "@/lib/approvalEngine";
import { getAllPOs, isPOConfirmed, type StoredPO } from "@/lib/purchaseOrderStore";

type ExportOptions = {
  approvalRequests?: ApprovalRequest[];
  hideInternal?: boolean;
};

type CsvRow = Record<string, unknown>;
type StoredNote = {
  id?: string;
  author?: string;
  date?: string;
  visibility?: string;
  text?: string;
  kind?: string;
};
type StoredDocument = {
  id?: string;
  name?: string;
  ext?: string;
  extension?: string;
  type?: string;
  size?: string;
  uploadedBy?: string;
  uploadedOn?: string;
  uploadedAt?: string;
  description?: string;
};
type LooseRecord = Record<string, unknown>;

const HEADERS = [
  "Record Type",
  "Master Order ID",
  "Client PO Reference",
  "Client",
  "Client ID",
  "Created By",
  "Created At",
  "Requester",
  "Requester Role",
  "Ordered For",
  "Assigned To",
  "Assigned Role",
  "Order Date",
  "Order Time",
  "Current Order Status",
  "Approval Status",
  "Approval Workflow",
  "Approval Request ID",
  "Approval Requested By",
  "Current Approver",
  "Approval Due At",
  "Approval Date",
  "Approved By",
  "Approval History",
  "Updated By",
  "Last Updated At",
  "Update Count",
  "Update History",
  "SLA Time",
  "SLA Alert",
  "Order Total",
  "Payment Method",
  "Payment Terms",
  "Delivery Address",
  "Delivery Details",
  "Checkout Note",
  "Order Notes",
  "Cancel Reason",
  "Sub Order ID",
  "Item Name",
  "Product ID",
  "SKU / Product Code",
  "Category",
  "Product Type",
  "Fulfillment Type",
  "Specifications",
  "Configuration",
  "Quantity",
  "Unit Price",
  "Line Amount",
  "Item Status",
  "Item Status Updated At",
  "Reference Number",
  "Serial Number",
  "Tracking Details",
  "Item Processing Details",
  "Selected Vendor",
  "Vendor PO Numbers",
  "Vendor PO Statuses",
  "Vendor PO Created At",
  "Vendor PO Details",
  "Order Documents",
  "Vendor PO Documents",
  "Vendor PO Notes",
];

function readLocalJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function jsonCell(value: unknown): string {
  if (value === undefined || value === null) return "";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function asRecord(value: unknown): LooseRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as LooseRecord
    : null;
}

function safeDocument(document: unknown) {
  const doc = asRecord(document);
  if (!doc) return null;
  return {
    id: doc.id ?? "",
    name: doc.name ?? "",
    extension: doc.ext ?? doc.extension ?? "",
    type: doc.type ?? "",
    size: doc.size ?? "",
    uploadedBy: doc.uploadedBy ?? "",
    uploadedAt: doc.uploadedOn ?? doc.uploadedAt ?? "",
    description: doc.description ?? "",
  };
}

function visibleRecords<T extends { visibility?: string }>(records: T[], hideInternal: boolean): T[] {
  return hideInternal ? records.filter((record) => record.visibility !== "Internal Note") : records;
}

function getOrderNotes(orderId: string, hideInternal: boolean) {
  const notes = readLocalJson<StoredNote[]>(`nido_notes_${orderId}`, []);
  return visibleRecords(Array.isArray(notes) ? notes : [], hideInternal)
    .map((note) => ({
      author: note.author ?? "",
      date: note.date ?? "",
      visibility: note.visibility ?? "",
      text: note.text ?? "",
      kind: note.kind ?? "",
    }));
}

function getOrderActivity(orderId: string, hideInternal: boolean) {
  const notes = readLocalJson<StoredNote[]>(`nido_notes_${orderId}`, []);
  const isCreationEvent = (note: StoredNote) =>
    note.id === `activity_order_placed_${orderId}`
    || note.text === `Order ${orderId} was placed.`;
  const allActivity = (Array.isArray(notes) ? notes : [])
    .filter((note) => Boolean(note.kind) && !isCreationEvent(note));
  return visibleRecords(allActivity, hideInternal);
}

function parseDate(value: unknown): number {
  if (!value) return 0;
  const time = new Date(String(value)).getTime();
  return Number.isFinite(time) ? time : 0;
}

function getApprovalRecords(order: MyOrder, requests: ApprovalRequest[]) {
  return requests
    .filter((request) => request.module === "Order" && request.reference === order.id)
    .sort((a, b) => parseDate(a.createdAt) - parseDate(b.createdAt));
}

function summarizeApproval(approval: ApprovalRequest | undefined) {
  if (!approval) {
    return {
      status: "",
      workflow: "",
      id: "",
      requestedBy: "",
      currentApprover: "",
      dueAt: "",
      approvalDate: "",
      approvedBy: "",
      history: "",
    };
  }
  const timeline: unknown[] = Array.isArray(approval.timeline)
    ? approval.timeline
    : Array.isArray(approval.steps) ? approval.steps : [];
  const approvedEvent = [...timeline]
    .reverse()
    .map(asRecord)
    .find((entry) => entry && /approv/i.test(String(entry.action ?? entry.status ?? entry.event ?? "")));
  const actor = approvedEvent?.actor
    ?? approvedEvent?.actedBy
    ?? approvedEvent?.approver
    ?? approvedEvent?.userName
    ?? approvedEvent?.user
    ?? "";
  const approvedAt = approvedEvent?.date
    ?? approvedEvent?.actedAt
    ?? approvedEvent?.timestamp
    ?? approvedEvent?.createdAt
    ?? "";
  return {
    status: approval.status ?? "",
    workflow: approval.workflow ?? "",
    id: approval.id ?? "",
    requestedBy: approval.requestedByName || approval.requestedBy || "",
    currentApprover: approval.currentApprover ?? "",
    dueAt: approval.dueAt ?? "",
    approvalDate: approvedAt,
    approvedBy: actor,
    history: jsonCell(timeline),
  };
}

function poMatchesItem(po: StoredPO, subOrderId: string, item: OrderCartItem): boolean {
  if (po.subOrderId === subOrderId || po.subOrderIds?.includes(subOrderId)) return true;
  return (po.items || []).some((line) => {
    if (line.subOrderId === subOrderId) return true;
    const productCode = String(item.productCode || "").trim();
    const sku = String(item.productCode || "").trim();
    const itemName = String(item.name || "").trim().toLowerCase();
    return Boolean(
      (productCode && String(line.productCode || "").trim() === productCode)
      || (sku && String(line.sku || "").trim() === sku)
      || (itemName && String(line.item || "").trim().toLowerCase() === itemName),
    );
  });
}

function safePo(po: StoredPO, subOrderId: string, hideInternal: boolean) {
  const lines = (po.items || []).filter((line) => line.subOrderId === subOrderId);
  const fallbackIndex = po.subOrderIds?.indexOf(subOrderId) ?? -1;
  const matchedLines = lines.length
    ? lines
    : fallbackIndex >= 0 && po.items?.[fallbackIndex]
      ? [po.items[fallbackIndex]]
      : po.items || [];
  return {
    poNumber: po.poNumber,
    status: po.status,
    createdAt: po.createdOn,
    createdDate: po.createdOnDisplay,
    requestedDelivery: po.requestedDelivery,
    vendor: {
      name: po.vendorName,
      id: po.vendorId,
      contact: po.vendorContact,
      email: po.vendorEmail,
      phone: po.vendorPhone,
      gstin: po.vendorGstin,
      address: po.vendorAddress,
    },
    paymentTerms: po.paymentTerms,
    subtotal: po.subtotal,
    sgst: po.sgstAmt,
    cgst: po.cgstAmt,
    total: po.grandTotal,
    cancelReason: po.cancelReason ?? "",
    items: matchedLines.map((line) => ({
      subOrderId: line.subOrderId,
      item: line.item,
      sku: line.sku,
      category: line.category,
      hsnCode: line.hsnCode,
      specs: line.specs,
      referenceNumber: line.referenceNumber,
      serialNumber: line.serialNumber,
      quantity: line.qty,
      unitPrice: line.unitPrice,
      subtotal: line.lineSubtotal,
      taxPercent: line.gstPct,
      status: line.status,
      cancelReason: line.cancelReason,
      tracking: line.tracking,
    })),
    documents: (po.documents || []).map(safeDocument).filter(Boolean),
    notes: visibleRecords(po.notes || [], hideInternal).map((note) => ({
      author: note.author,
      date: note.date,
      visibility: note.visibility,
      text: note.text,
      kind: note.kind ?? "",
    })),
  };
}

function toSubOrderId(order: MyOrder, item: OrderCartItem, index: number): string {
  return item.subOrderId || `SO-${order.id}-${String(index + 1).padStart(3, "0")}`;
}

function createRow(
  order: MyOrder,
  item: OrderCartItem | undefined,
  itemIndex: number,
  pos: StoredPO[],
  requests: ApprovalRequest[],
  hideInternal: boolean,
): CsvRow {
  const subOrderId = item ? toSubOrderId(order, item, itemIndex) : "";
  const relatedPos = item ? pos.filter((po) => po.orderId === order.id && poMatchesItem(po, subOrderId, item)) : [];
  const activity = getOrderActivity(order.id, hideInternal);
  const notes = getOrderNotes(order.id, hideInternal);
  const storedNotes = readLocalJson<StoredNote[]>(`nido_notes_${order.id}`, []);
  const creationEvent = (Array.isArray(storedNotes) ? storedNotes : [])
    .find((note) => note?.id === `activity_order_placed_${order.id}` || note?.text === `Order ${order.id} was placed.`);
  const latestEvent = [...activity].sort((a, b) => parseDate(b.date) - parseDate(a.date))[0];
  const orderUpdatedAt = order.updatedAt || "";
  const useStoredUpdate = parseDate(orderUpdatedAt) > parseDate(latestEvent?.date);
  const updatedCount = hideInternal
    ? activity.length
    : Math.max(activity.length, Number(order.updateCount) || 0);
  const createdAt = order.createdAt || creationEvent?.date || `${order.orderDate || ""} ${order.orderTime || ""}`.trim();
  const creator = order.createdBy || creationEvent?.author || order.requester || "";
  const approvalRecords = getApprovalRecords(order, requests);
  const approval = summarizeApproval(approvalRecords[approvalRecords.length - 1]);
  const storedSubItems = asRecord(readLocalJson<unknown>(`nido_subitems_${order.id}`, {})) || {};
  const subItemState = item ? asRecord(storedSubItems[subOrderId]) || {} : {};
  const poLines = relatedPos.flatMap((po) => {
    const direct = (po.items || []).filter((line) => line.subOrderId === subOrderId);
    if (direct.length) return direct;
    const idx = po.subOrderIds?.indexOf(subOrderId) ?? -1;
    return idx >= 0 && po.items?.[idx] ? [po.items[idx]] : [];
  });
  const itemStatus = subItemState.itemStatus
    || poLines.find((line) => line.status)?.status
    || (relatedPos.some((po) => isPOConfirmed(po)) ? "Processing" : "")
    || (order.status === "Cancelled" || order.status === "Draft" ? order.status : "Pending");
  const unitPrice = Number(item?.landedCost || item?.priceNum) || 0;
  const quantity = Number(item?.quantity) || 0;
  const storedDocuments = readLocalJson<StoredDocument[]>(`nido_docs_${order.id}`, []);
  const safeDocuments = (Array.isArray(storedDocuments) ? storedDocuments : []).map(safeDocument).filter(Boolean);
  const allVisibleActivity = activity.map((event) => ({
    actor: event.author ?? "",
    date: event.date ?? "",
    type: event.kind ?? "",
    visibility: event.visibility ?? "",
    change: event.text ?? "",
  }));
  const allVisibleNotes = notes.filter((note) => !note.kind);
  const itemProcessingDetails = item ? {
    ...subItemState,
    tracking: subItemState.tracking || poLines.map((line) => line.tracking).filter(Boolean),
    selectedVendorId: item.selectedVendorId || "",
    stockAllocations: item.vendorAllocations || [],
  } : null;

  return {
    "Record Type": item ? "Order Item" : "Order",
    "Master Order ID": order.id,
    "Client PO Reference": order.poNumber,
    "Client": order.client,
    "Client ID": order.clientId ?? "",
    "Created By": hideInternal ? order.requester : creator,
    "Created At": createdAt,
    "Requester": order.requester,
    "Requester Role": order.requesterRole,
    "Ordered For": order.orderedFor ?? "",
    "Assigned To": order.assigned,
    "Assigned Role": order.assignedRole,
    "Order Date": order.orderDate,
    "Order Time": order.orderTime,
    "Current Order Status": order.status,
    "Approval Status": approval.status,
    "Approval Workflow": approval.workflow,
    "Approval Request ID": approval.id,
    "Approval Requested By": approval.requestedBy,
    "Current Approver": hideInternal ? "" : approval.currentApprover,
    "Approval Due At": approval.dueAt,
    "Approval Date": approval.approvalDate,
    "Approved By": hideInternal ? "" : approval.approvedBy,
    "Approval History": hideInternal ? "" : approval.history,
    "Updated By": hideInternal ? "" : useStoredUpdate ? order.updatedBy ?? "" : latestEvent?.author ?? "",
    "Last Updated At": hideInternal ? "" : useStoredUpdate ? orderUpdatedAt : latestEvent?.date ?? "",
    "Update Count": updatedCount,
    "Update History": jsonCell(allVisibleActivity),
    "SLA Time": order.slaTime ?? "",
    "SLA Alert": order.slaAlert,
    "Order Total": order.totalAmountNum ?? order.totalAmount,
    "Payment Method": order.paymentMethod ?? "",
    "Payment Terms": order.paymentTerms ?? "",
    "Delivery Address": order.deliveryAddress ?? "",
    "Delivery Details": jsonCell(order.deliveryDetails),
    "Checkout Note": order.orderNotes ?? "",
    "Order Notes": jsonCell(allVisibleNotes),
    "Cancel Reason": order.cancelReason ?? "",
    "Sub Order ID": subOrderId,
    "Item Name": item?.name ?? "",
    "Product ID": item?.id ?? "",
    "SKU / Product Code": item?.productCode ?? "",
    "Category": item?.category ?? "",
    "Product Type": item?.productType ?? item?.physicalType ?? "",
    "Fulfillment Type": item?.fulfillmentType ?? "",
    "Specifications": jsonCell(item?.specs ?? []),
    "Configuration": jsonCell(item?.configuration ?? {}),
    "Quantity": item?.quantity ?? "",
    "Unit Price": item ? unitPrice : "",
    "Line Amount": item ? unitPrice * quantity : "",
    "Item Status": itemStatus,
    "Item Status Updated At": subItemState.updatedOn ?? "",
    "Reference Number": subItemState.referenceNumber ?? poLines.find((line) => line.referenceNumber)?.referenceNumber ?? "",
    "Serial Number": subItemState.serialNumber ?? poLines.find((line) => line.serialNumber)?.serialNumber ?? "",
    "Tracking Details": jsonCell(itemProcessingDetails?.tracking ?? {}),
    "Item Processing Details": jsonCell(itemProcessingDetails),
    "Selected Vendor": hideInternal ? "" : item?.selectedVendorName ?? relatedPos.map((po) => po.vendorName).filter(Boolean).join("; "),
    "Vendor PO Numbers": hideInternal ? "" : relatedPos.map((po) => po.poNumber).join("; "),
    "Vendor PO Statuses": hideInternal ? "" : relatedPos.map((po) => `${po.poNumber}: ${po.status}`).join("; "),
    "Vendor PO Created At": hideInternal ? "" : relatedPos.map((po) => `${po.poNumber}: ${po.createdOn}`).join("; "),
    "Vendor PO Details": hideInternal ? "" : jsonCell(relatedPos.map((po) => safePo(po, subOrderId, hideInternal))),
    "Order Documents": jsonCell(safeDocuments),
    "Vendor PO Documents": hideInternal ? "" : jsonCell(relatedPos.flatMap((po) => (po.documents || []).flatMap((doc) => {
      const metadata = safeDocument(doc);
      return metadata ? [{ poNumber: po.poNumber, ...metadata }] : [];
    }))),
    "Vendor PO Notes": hideInternal ? "" : jsonCell(relatedPos.flatMap((po) =>
      visibleRecords(po.notes || [], hideInternal).map((note) => ({
        poNumber: po.poNumber,
        author: note.author,
        date: note.date,
        visibility: note.visibility,
        text: note.text,
        kind: note.kind ?? "",
      })),
    )),
    __approvalRecords: hideInternal ? "" : jsonCell(approvalRecords.map((record) => ({
      id: record.id,
      workflow: record.workflow,
      status: record.status,
      requestedBy: record.requestedByName || record.requestedBy,
      currentApprover: record.currentApprover,
      createdAt: record.createdAt,
      dueAt: record.dueAt,
      timeline: record.timeline || record.steps || [],
    }))),
  };
}

export function buildOrdersCsv(
  orders: MyOrder[],
  { approvalRequests = [], hideInternal = false }: ExportOptions = {},
): string {
  const allPos = getAllPOs();
  const rows = orders.flatMap((order) => {
    const items = order.cartItems || [];
    return items.length
      ? items.map((item, index) => createRow(order, item, index, allPos, approvalRequests, hideInternal))
      : [createRow(order, undefined, -1, allPos, approvalRequests, hideInternal)];
  });
  const headers = [...HEADERS, "All Approval Requests"];
  const escape = (value: unknown) => {
    const text = value === null || value === undefined ? "" : String(value);
    const protectedText = typeof value === "string" && /^[\t\r ]*[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${protectedText.replace(/"/g, '""')}"`;
  };
  const csvRows = [
    headers,
    ...rows.map((row) => [
      ...HEADERS.map((header) => row[header]),
      row.__approvalRecords,
    ]),
  ];
  return `\uFEFF${csvRows.map((row) => row.map(escape).join(",")).join("\r\n")}`;
}