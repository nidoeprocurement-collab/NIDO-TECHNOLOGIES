import { supabase } from '@/lib/supabase';
import { isSupabaseUuid } from '@/lib/nidoRolesApi';
import {
  getVendors,
  isLegacyDemoVendor,
  saveVendors,
  type StoredVendor,
  type VendorStatus,
} from '@/lib/vendorDataStore';

interface DbVendorRow {
  id: string;
  vendor_code: string;
  name: string;
  legal_business_name: string | null;
  vendor_type: string | null;
  category: string | null;
  primary_contact: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  rating: number | string | null;
  region: string | null;
  status: string | null;
  onboarding_status: string | null;
  onboarded_date: string | null;
  archived: boolean | null;
  archived_on: string | null;
  month_spend: number | string | null;
  total_spend: number | string | null;
  score: number | string | null;
  compliance_issues: number | null;
  address: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string | null;
  billing_address_line1: string | null;
  billing_address_line2: string | null;
  billing_city: string | null;
  billing_state: string | null;
  billing_zip: string | null;
  billing_country: string | null;
  shipping_address_line1: string | null;
  shipping_address_line2: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_zip: string | null;
  shipping_country: string | null;
  registration_no: string | null;
  tax_id: string | null;
  pan: string | null;
  founded: string | null;
  employees: string | null;
  annual_revenue: string | null;
  payment_mode: string | null;
  payment_terms: string | null;
  credit_period: string | null;
  bank_account: string | null;
  ifsc_code: string | null;
  bank_name: string | null;
  bank_branch: string | null;
  documents: unknown[] | null;
  notes: string | null;
  performance_quality: number | string | null;
  performance_delivery: number | string | null;
  performance_responsiveness: number | string | null;
  performance_compliance: number | string | null;
  onboarding_form_data: Record<string, unknown> | null;
  last_updated_form_data: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_by_name: string | null;
  created_by_employee_id: string | null;
  created_by_email: string | null;
  updated_by_name: string | null;
  updated_by_employee_id: string | null;
  updated_by_email: string | null;
  created_at: string;
  updated_at: string;
}

const LOCAL_VENDORS_MIGRATED_KEY = 'nido_vendors_supabase_migrated_v1';

const SELECT_COLUMNS =
  'id,vendor_code,name,legal_business_name,vendor_type,category,primary_contact,email,phone,website,rating,region,status,onboarding_status,onboarded_date,archived,archived_on,month_spend,total_spend,score,compliance_issues,address,address_line1,address_line2,city,state,zip_code,country,billing_address_line1,billing_address_line2,billing_city,billing_state,billing_zip,billing_country,shipping_address_line1,shipping_address_line2,shipping_city,shipping_state,shipping_zip,shipping_country,registration_no,tax_id,pan,founded,employees,annual_revenue,payment_mode,payment_terms,credit_period,bank_account,ifsc_code,bank_name,bank_branch,documents,notes,performance_quality,performance_delivery,performance_responsiveness,performance_compliance,onboarding_form_data,last_updated_form_data,metadata,created_by_name,created_by_employee_id,created_by_email,updated_by_name,updated_by_employee_id,updated_by_email,created_at,updated_at';

function normalizeVendorStatus(raw: unknown): VendorStatus {
  if (raw === 'Inactive' || raw === 'On Hold' || raw === 'Pending' || raw === 'Active') {
    return raw;
  }
  return 'Active';
}

export function mapDbVendorRowToStoredVendor(row: DbVendorRow): StoredVendor {
  const meta = (row.metadata ?? {}) as Record<string, unknown>;
  return {
    ...meta,
    id: String(row.id),
    vendorCode: String(row.vendor_code ?? ''),
    name: String(row.name ?? ''),
    legalBusinessName: row.legal_business_name ?? '',
    vendorType: row.vendor_type ?? '',
    category: row.category ?? '',
    primaryContact: row.primary_contact ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    website: row.website ?? '',
    rating: Number(row.rating) || 0,
    region: row.region ?? '',
    status: normalizeVendorStatus(row.status),
    onboardingStatus: row.onboarding_status ?? 'Approved',
    onboardedDate: row.onboarded_date ?? '',
    archived: Boolean(row.archived),
    archivedOn: row.archived_on ?? undefined,
    monthSpend: Number(row.month_spend) || 0,
    totalSpend: Number(row.total_spend) || 0,
    score: Number(row.score) || 0,
    complianceIssues: Number(row.compliance_issues) || 0,
    address: row.address ?? '',
    addressLine1: row.address_line1 ?? '',
    addressLine2: row.address_line2 ?? '',
    city: row.city ?? '',
    state: row.state ?? '',
    zipCode: row.zip_code ?? '',
    country: row.country ?? '',
    billingAddressLine1: row.billing_address_line1 ?? '',
    billingAddressLine2: row.billing_address_line2 ?? '',
    billingCity: row.billing_city ?? '',
    billingState: row.billing_state ?? '',
    billingZip: row.billing_zip ?? '',
    billingCountry: row.billing_country ?? '',
    shippingAddressLine1: row.shipping_address_line1 ?? '',
    shippingAddressLine2: row.shipping_address_line2 ?? '',
    shippingCity: row.shipping_city ?? '',
    shippingState: row.shipping_state ?? '',
    shippingZip: row.shipping_zip ?? '',
    shippingCountry: row.shipping_country ?? '',
    registrationNo: row.registration_no ?? '',
    taxId: row.tax_id ?? '',
    pan: row.pan ?? '',
    founded: row.founded ?? '',
    employees: row.employees ?? '',
    annualRevenue: row.annual_revenue ?? '',
    paymentMode: row.payment_mode ?? '',
    paymentTerms: row.payment_terms ?? '',
    creditPeriod: row.credit_period ?? '',
    bankAccount: row.bank_account ?? '',
    ifscCode: row.ifsc_code ?? '',
    bankName: row.bank_name ?? '',
    bankBranch: row.bank_branch ?? '',
    documents: Array.isArray(row.documents) ? row.documents : [],
    notes: row.notes ?? '',
    performanceQuality: row.performance_quality != null ? Number(row.performance_quality) : undefined,
    performanceDelivery: row.performance_delivery != null ? Number(row.performance_delivery) : undefined,
    performanceResponsiveness:
      row.performance_responsiveness != null ? Number(row.performance_responsiveness) : undefined,
    performanceCompliance:
      row.performance_compliance != null ? Number(row.performance_compliance) : undefined,
    onboardingFormData: row.onboarding_form_data ?? {},
    lastUpdatedFormData: row.last_updated_form_data ?? {},
    createdByName: row.created_by_name ?? undefined,
    createdByEmployeeId: row.created_by_employee_id ?? undefined,
    createdByEmail: row.created_by_email ?? undefined,
    updatedByName: row.updated_by_name ?? undefined,
    updatedByEmployeeId: row.updated_by_employee_id ?? undefined,
    updatedByEmail: row.updated_by_email ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function buildDbVendorPayload(v: Partial<StoredVendor>) {
  const rec = v as Record<string, unknown>;
  const payload: Record<string, unknown> = {};

  if (v.name !== undefined) payload.name = String(v.name).trim();
  if (rec.legalBusinessName !== undefined) payload.legal_business_name = String(rec.legalBusinessName ?? '');
  if (rec.vendorType !== undefined) payload.vendor_type = String(rec.vendorType ?? '');
  if (v.category !== undefined) payload.category = String(v.category ?? '');
  if (v.primaryContact !== undefined) payload.primary_contact = String(v.primaryContact ?? '');
  if (v.email !== undefined) payload.email = String(v.email ?? '');
  if (v.phone !== undefined) payload.phone = String(v.phone ?? '');
  if (v.website !== undefined) payload.website = String(v.website ?? '');
  if (v.rating !== undefined) payload.rating = Math.min(5, Math.max(0, Number(v.rating) || 0));
  if (v.region !== undefined) payload.region = String(v.region ?? '');
  if (v.status !== undefined) payload.status = normalizeVendorStatus(v.status);
  if (rec.onboardingStatus !== undefined) payload.onboarding_status = String(rec.onboardingStatus ?? 'Approved');
  if (v.onboardedDate !== undefined) payload.onboarded_date = String(v.onboardedDate ?? '');
  if (v.archived !== undefined) payload.archived = Boolean(v.archived);
  if (rec.archivedOn !== undefined) payload.archived_on = rec.archivedOn ? String(rec.archivedOn) : null;
  if (v.monthSpend !== undefined) payload.month_spend = Math.max(0, Number(v.monthSpend) || 0);
  if (v.totalSpend !== undefined) payload.total_spend = Math.max(0, Number(v.totalSpend) || 0);
  if (v.score !== undefined) payload.score = Math.max(0, Number(v.score) || 0);
  if (v.complianceIssues !== undefined) payload.compliance_issues = Math.max(0, Math.trunc(Number(v.complianceIssues) || 0));
  if (v.address !== undefined) payload.address = String(v.address ?? '');
  if (v.addressLine1 !== undefined) payload.address_line1 = String(v.addressLine1 ?? '');
  if (v.addressLine2 !== undefined) payload.address_line2 = String(v.addressLine2 ?? '');
  if (v.city !== undefined) payload.city = String(v.city ?? '');
  if (v.state !== undefined) payload.state = String(v.state ?? '');
  if (v.zipCode !== undefined) payload.zip_code = String(v.zipCode ?? '');
  if (v.country !== undefined) payload.country = String(v.country ?? '');
  if (v.billingAddressLine1 !== undefined) payload.billing_address_line1 = String(v.billingAddressLine1 ?? '');
  if (v.billingAddressLine2 !== undefined) payload.billing_address_line2 = String(v.billingAddressLine2 ?? '');
  if (v.billingCity !== undefined) payload.billing_city = String(v.billingCity ?? '');
  if (v.billingState !== undefined) payload.billing_state = String(v.billingState ?? '');
  if (v.billingZip !== undefined) payload.billing_zip = String(v.billingZip ?? '');
  if (v.billingCountry !== undefined) payload.billing_country = String(v.billingCountry ?? '');
  if (v.shippingAddressLine1 !== undefined) payload.shipping_address_line1 = String(v.shippingAddressLine1 ?? '');
  if (v.shippingAddressLine2 !== undefined) payload.shipping_address_line2 = String(v.shippingAddressLine2 ?? '');
  if (v.shippingCity !== undefined) payload.shipping_city = String(v.shippingCity ?? '');
  if (v.shippingState !== undefined) payload.shipping_state = String(v.shippingState ?? '');
  if (v.shippingZip !== undefined) payload.shipping_zip = String(v.shippingZip ?? '');
  if (v.shippingCountry !== undefined) payload.shipping_country = String(v.shippingCountry ?? '');
  if (v.registrationNo !== undefined) payload.registration_no = String(v.registrationNo ?? '');
  if (v.taxId !== undefined) payload.tax_id = String(v.taxId ?? '');
  if (v.pan !== undefined) payload.pan = String(v.pan ?? '');
  if (v.founded !== undefined) payload.founded = String(v.founded ?? '');
  if (v.employees !== undefined) payload.employees = String(v.employees ?? '');
  if (v.annualRevenue !== undefined) payload.annual_revenue = String(v.annualRevenue ?? '');
  if (v.paymentMode !== undefined) payload.payment_mode = String(v.paymentMode ?? '');
  if (v.paymentTerms !== undefined) payload.payment_terms = String(v.paymentTerms ?? '');
  if (rec.creditPeriod !== undefined) payload.credit_period = String(rec.creditPeriod ?? '');
  if (v.bankAccount !== undefined) payload.bank_account = String(v.bankAccount ?? '');
  if (v.ifscCode !== undefined) payload.ifsc_code = String(v.ifscCode ?? '');
  if (v.bankName !== undefined) payload.bank_name = String(v.bankName ?? '');
  if (v.bankBranch !== undefined) payload.bank_branch = String(v.bankBranch ?? '');
  if (rec.documents !== undefined) payload.documents = Array.isArray(rec.documents) ? rec.documents : [];
  if (rec.notes !== undefined) payload.notes = String(rec.notes ?? '');
  if (v.performanceQuality !== undefined) payload.performance_quality = Number(v.performanceQuality);
  if (v.performanceDelivery !== undefined) payload.performance_delivery = Number(v.performanceDelivery);
  if (v.performanceResponsiveness !== undefined) payload.performance_responsiveness = Number(v.performanceResponsiveness);
  if (v.performanceCompliance !== undefined) payload.performance_compliance = Number(v.performanceCompliance);
  if (v.onboardingFormData !== undefined) payload.onboarding_form_data = v.onboardingFormData ?? {};
  if (v.lastUpdatedFormData !== undefined) payload.last_updated_form_data = v.lastUpdatedFormData ?? {};
  if (v.createdByName !== undefined) payload.created_by_name = v.createdByName ?? null;
  if (v.createdByEmployeeId !== undefined) payload.created_by_employee_id = v.createdByEmployeeId ?? null;
  if (v.createdByEmail !== undefined) payload.created_by_email = v.createdByEmail ?? null;
  if (v.updatedByName !== undefined) payload.updated_by_name = v.updatedByName ?? null;
  if (v.updatedByEmployeeId !== undefined) payload.updated_by_employee_id = v.updatedByEmployeeId ?? null;
  if (v.updatedByEmail !== undefined) payload.updated_by_email = v.updatedByEmail ?? null;

  return payload;
}

function assertSupabaseFrom() {
  const fromFn = (supabase as unknown as { from?: (table: string) => unknown }).from;
  if (typeof fromFn !== 'function') {
    throw new Error('Supabase database client is unavailable.');
  }
}

export async function loadVendorsFromSupabase(): Promise<StoredVendor[]> {
  assertSupabaseFrom();
  const { data, error } = await supabase
    .from('vendors')
    .select(SELECT_COLUMNS)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Unable to load vendors from Supabase.');
  }

  const mapped = (Array.isArray(data) ? (data as DbVendorRow[]) : []).map(
    mapDbVendorRowToStoredVendor,
  );
  saveVendors(mapped);
  return mapped;
}

export async function loadVendorByIdFromSupabase(
  vendorId: string,
): Promise<StoredVendor | null> {
  if (!isSupabaseUuid(vendorId)) return null;
  assertSupabaseFrom();
  const { data, error } = await supabase
    .from('vendors')
    .select(SELECT_COLUMNS)
    .eq('id', vendorId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || 'Unable to load vendor from Supabase.');
  }

  return data ? mapDbVendorRowToStoredVendor(data as DbVendorRow) : null;
}

export async function createVendorInSupabase(
  vendor: Partial<StoredVendor> & { name: string },
): Promise<StoredVendor> {
  assertSupabaseFrom();
  const payload = buildDbVendorPayload(vendor);
  if (!payload.name) {
    throw new Error('Vendor name is required.');
  }
  const vendorCode = String((vendor as Record<string, unknown>).vendorCode ?? '').trim();
  const insertPayload = {
    ...payload,
    ...(vendorCode ? { vendor_code: vendorCode } : {}),
  };

  const { data, error } = await supabase
    .from('vendors')
    .insert(insertPayload)
    .select(SELECT_COLUMNS)
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error(`Vendor "${String(payload.name)}" already exists.`);
    }
    throw new Error(error.message || 'Unable to create vendor in Supabase.');
  }

  return mapDbVendorRowToStoredVendor(data as DbVendorRow);
}

export async function updateVendorInSupabase(
  vendorId: string,
  updates: Partial<StoredVendor>,
): Promise<StoredVendor> {
  if (!isSupabaseUuid(vendorId)) {
    throw new Error('Valid Supabase vendor ID is required to update.');
  }
  assertSupabaseFrom();
  const payload = buildDbVendorPayload(updates);

  const { data, error } = await supabase
    .from('vendors')
    .update(payload)
    .eq('id', vendorId)
    .select(SELECT_COLUMNS)
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error(`Vendor "${String(payload.name ?? '')}" already exists.`);
    }
    throw new Error(error.message || 'Unable to update vendor in Supabase.');
  }

  return mapDbVendorRowToStoredVendor(data as DbVendorRow);
}

export async function archiveVendorInSupabase(
  vendorId: string,
  archived: boolean,
  auditFields: Record<string, unknown> = {},
): Promise<StoredVendor> {
  return updateVendorInSupabase(vendorId, {
    ...auditFields,
    archived,
    archivedOn: archived ? new Date().toISOString().split('T')[0] : undefined,
  });
}

export async function deleteVendorInSupabase(vendorId: string): Promise<void> {
  if (!isSupabaseUuid(vendorId)) {
    throw new Error('Valid Supabase vendor ID is required to delete.');
  }
  assertSupabaseFrom();
  const { error } = await supabase.from('vendors').delete().eq('id', vendorId);
  if (error) {
    if (error.code === '23503') {
      throw new Error('Vendor cannot be deleted because it has assigned products or references. Archive it instead.');
    }
    throw new Error(error.message || 'Unable to delete vendor from Supabase.');
  }
}

export async function migrateLocalVendorsToSupabaseIfNeeded(): Promise<{
  migrated: number;
  skipped: number;
  invalid: number;
  idMap: Record<string, string>;
}> {
  const idMap: Record<string, string> = {};
  if (typeof window === 'undefined') {
    return { migrated: 0, skipped: 0, invalid: 0, idMap };
  }
  if (localStorage.getItem(LOCAL_VENDORS_MIGRATED_KEY) === 'done') {
    return { migrated: 0, skipped: 0, invalid: 0, idMap };
  }

  const localVendors = getVendors().filter((v) => !isSupabaseUuid(v.id));
  if (localVendors.length === 0) {
    localStorage.setItem(LOCAL_VENDORS_MIGRATED_KEY, 'done');
    return { migrated: 0, skipped: 0, invalid: 0, idMap };
  }

  const remoteExisting = await loadVendorsFromSupabase();
  const existingByName = new Map(
    remoteExisting.map((v) => [v.name.trim().replace(/\s+/g, ' ').toLowerCase(), v.id]),
  );

  let migrated = 0;
  let skipped = 0;
  let invalid = 0;

  for (const lv of localVendors) {
    if (isLegacyDemoVendor(lv) || !String(lv.name ?? '').trim()) {
      invalid += 1;
      continue;
    }
    const normName = lv.name.trim().replace(/\s+/g, ' ').toLowerCase();
    const existingId = existingByName.get(normName);
    if (existingId) {
      idMap[lv.id] = existingId;
      skipped += 1;
      continue;
    }

    try {
      const created = await createVendorInSupabase(lv);
      existingByName.set(normName, created.id);
      idMap[lv.id] = created.id;
      migrated += 1;
    } catch {
      skipped += 1;
    }
  }

  localStorage.setItem(LOCAL_VENDORS_MIGRATED_KEY, 'done');
  return { migrated, skipped, invalid, idMap };
}
