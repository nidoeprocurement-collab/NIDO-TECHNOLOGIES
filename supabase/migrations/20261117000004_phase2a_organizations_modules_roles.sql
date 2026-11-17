-- Phase 2A: Organizations, Module Catalogs, and Role Schema
-- Strictly Stage 2A only:
--   - Organization Management: nido_organizations, client_organizations, organization_settings
--   - Internal NIDO RBAC: nido_module_catalog, nido_roles, nido_role_permissions
--   - Client Portal RBAC: client_module_catalog, client_roles, client_role_permissions
-- No user tables, no user-role bridge tables, no fake users/clients/passwords,
-- and no browser-facing RLS policies yet (RLS enabled default-deny).

-- ============================================================================
-- 1. ORGANIZATION MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.nido_organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_code text NOT NULL UNIQUE,
  name text NOT NULL,
  legal_name text,
  tax_id text,
  is_default boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_nido_organizations_status
  ON public.nido_organizations (status);

CREATE UNIQUE INDEX IF NOT EXISTS uq_nido_organizations_single_default
  ON public.nido_organizations (is_default)
  WHERE is_default = true;

DROP TRIGGER IF EXISTS trg_nido_organizations_updated_at ON public.nido_organizations;
CREATE TRIGGER trg_nido_organizations_updated_at
  BEFORE UPDATE ON public.nido_organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.client_organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_code text NOT NULL UNIQUE CHECK (client_code ~ '^CL-[0-9]{5}$'),
  nido_org_id uuid REFERENCES public.nido_organizations(id) ON DELETE RESTRICT,
  name text NOT NULL,
  category text,
  tier text,
  rep_name text,
  email text,
  phone text,
  mobile text,
  website text,
  tax_id text,
  pan text,
  billing_address text,
  billing_city text,
  billing_state text,
  billing_pincode text,
  contract_start_date date,
  contract_end_date date,
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Archived')),
  archived_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_client_organizations_nido_org
  ON public.client_organizations (nido_org_id);
CREATE INDEX IF NOT EXISTS idx_client_organizations_status
  ON public.client_organizations (status);
CREATE INDEX IF NOT EXISTS idx_client_organizations_name
  ON public.client_organizations (name);

DROP TRIGGER IF EXISTS trg_client_organizations_updated_at ON public.client_organizations;
CREATE TRIGGER trg_client_organizations_updated_at
  BEFORE UPDATE ON public.client_organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.organization_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type text NOT NULL CHECK (scope_type IN ('nido_org', 'client_org')),
  nido_org_id uuid REFERENCES public.nido_organizations(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.client_organizations(id) ON DELETE CASCADE,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  CONSTRAINT chk_organization_settings_scope CHECK (
    (scope_type = 'nido_org' AND nido_org_id IS NOT NULL AND client_id IS NULL)
    OR
    (scope_type = 'client_org' AND client_id IS NOT NULL AND nido_org_id IS NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_organization_settings_nido_org
  ON public.organization_settings (nido_org_id)
  WHERE scope_type = 'nido_org';

CREATE UNIQUE INDEX IF NOT EXISTS uq_organization_settings_client_org
  ON public.organization_settings (client_id)
  WHERE scope_type = 'client_org';

DROP TRIGGER IF EXISTS trg_organization_settings_updated_at ON public.organization_settings;
CREATE TRIGGER trg_organization_settings_updated_at
  BEFORE UPDATE ON public.organization_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 2. INTERNAL NIDO RBAC
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.nido_module_catalog (
  module_key text PRIMARY KEY,
  label text NOT NULL,
  group_key text NOT NULL DEFAULT 'core_nido_modules',
  group_label text NOT NULL DEFAULT 'Core NIDO Modules',
  parent_module_key text REFERENCES public.nido_module_catalog(module_key) ON DELETE SET NULL,
  route_path text,
  source_origin text NOT NULL CHECK (source_origin IN ('core_24', 'workbook_63', 'platform_page', 'custom')),
  is_core_group boolean NOT NULL DEFAULT false,
  is_custom boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nido_module_catalog_parent
  ON public.nido_module_catalog (parent_module_key);
CREATE INDEX IF NOT EXISTS idx_nido_module_catalog_origin
  ON public.nido_module_catalog (source_origin, display_order);

DROP TRIGGER IF EXISTS trg_nido_module_catalog_updated_at ON public.nido_module_catalog;
CREATE TRIGGER trg_nido_module_catalog_updated_at
  BEFORE UPDATE ON public.nido_module_catalog
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.nido_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  department text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  is_system_owner boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_nido_roles_status
  ON public.nido_roles (status);

DROP TRIGGER IF EXISTS trg_nido_roles_updated_at ON public.nido_roles;
CREATE TRIGGER trg_nido_roles_updated_at
  BEFORE UPDATE ON public.nido_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.nido_role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES public.nido_roles(id) ON DELETE CASCADE,
  module_key text NOT NULL REFERENCES public.nido_module_catalog(module_key) ON DELETE CASCADE,
  can_view boolean NOT NULL DEFAULT false,
  can_create boolean NOT NULL DEFAULT false,
  can_edit boolean NOT NULL DEFAULT false,
  can_delete boolean NOT NULL DEFAULT false,
  can_approve boolean NOT NULL DEFAULT false,
  can_export boolean NOT NULL DEFAULT false,
  can_import boolean NOT NULL DEFAULT false,
  can_manage boolean NOT NULL DEFAULT false,
  can_configure boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  CONSTRAINT uq_nido_role_permissions_role_module UNIQUE (role_id, module_key)
);

CREATE INDEX IF NOT EXISTS idx_nido_role_permissions_role
  ON public.nido_role_permissions (role_id);
CREATE INDEX IF NOT EXISTS idx_nido_role_permissions_module
  ON public.nido_role_permissions (module_key);

DROP TRIGGER IF EXISTS trg_nido_role_permissions_updated_at ON public.nido_role_permissions;
CREATE TRIGGER trg_nido_role_permissions_updated_at
  BEFORE UPDATE ON public.nido_role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 3. CLIENT PORTAL RBAC (COMPLETELY SEPARATE FROM INTERNAL RBAC)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.client_module_catalog (
  module_key text PRIMARY KEY,
  label text NOT NULL,
  parent_module_key text REFERENCES public.client_module_catalog(module_key) ON DELETE SET NULL,
  display_order integer NOT NULL DEFAULT 0,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_module_catalog_parent
  ON public.client_module_catalog (parent_module_key);

DROP TRIGGER IF EXISTS trg_client_module_catalog_updated_at ON public.client_module_catalog;
CREATE TRIGGER trg_client_module_catalog_updated_at
  BEFORE UPDATE ON public.client_module_catalog
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.client_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.client_organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  CONSTRAINT uq_client_roles_client_name UNIQUE (client_id, name),
  CONSTRAINT uq_client_roles_id_client UNIQUE (id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_client_roles_client
  ON public.client_roles (client_id);

DROP TRIGGER IF EXISTS trg_client_roles_updated_at ON public.client_roles;
CREATE TRIGGER trg_client_roles_updated_at
  BEFORE UPDATE ON public.client_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.client_role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.client_organizations(id) ON DELETE CASCADE,
  client_role_id uuid NOT NULL,
  module_key text NOT NULL REFERENCES public.client_module_catalog(module_key) ON DELETE CASCADE,
  can_view boolean NOT NULL DEFAULT false,
  can_create boolean NOT NULL DEFAULT false,
  can_edit boolean NOT NULL DEFAULT false,
  can_delete boolean NOT NULL DEFAULT false,
  can_approve boolean NOT NULL DEFAULT false,
  can_export boolean NOT NULL DEFAULT false,
  can_import boolean NOT NULL DEFAULT false,
  can_manage boolean NOT NULL DEFAULT false,
  can_configure boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  CONSTRAINT fk_client_role_perm_role_tenant
    FOREIGN KEY (client_role_id, client_id)
    REFERENCES public.client_roles(id, client_id)
    ON DELETE CASCADE,
  CONSTRAINT uq_client_role_permissions_role_module UNIQUE (client_role_id, module_key)
);

CREATE INDEX IF NOT EXISTS idx_client_role_permissions_client
  ON public.client_role_permissions (client_id);
CREATE INDEX IF NOT EXISTS idx_client_role_permissions_role
  ON public.client_role_permissions (client_role_id);

DROP TRIGGER IF EXISTS trg_client_role_permissions_updated_at ON public.client_role_permissions;
CREATE TRIGGER trg_client_role_permissions_updated_at
  BEFORE UPDATE ON public.client_role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 4. SEED INTERNAL NIDO MODULE CATALOG (24 Core + 39 Workbook + 74 Page Keys)
-- ============================================================================

-- 4A. 24 Core Modules (permissionsStore.ts MODULES & Group 1 of Workbook 63)
INSERT INTO public.nido_module_catalog (
  module_key, label, group_key, group_label, parent_module_key, route_path,
  source_origin, is_core_group, is_custom, display_order, description
)
VALUES
  ('dashboard',                 'Dashboard',                 'core_nido_modules', 'Core NIDO Modules', NULL, '/dashboard',                 'core_24', true, false, 1,  'Executive dashboard and operational KPIs.'),
  ('shop',                      'Shop',                      'core_nido_modules', 'Core NIDO Modules', NULL, '/shop',                      'core_24', true, false, 2,  'Internal catalog browsing and shopping.'),
  ('services',                  'Services',                  'core_nido_modules', 'Core NIDO Modules', NULL, '/services',                  'core_24', true, false, 3,  'Service requests, AMC, repair, rental, and disposal.'),
  ('support',                   'Support',                   'core_nido_modules', 'Core NIDO Modules', NULL, '/support',                   'core_24', true, false, 4,  'Support tickets and customer issue resolution.'),
  ('clients',                   'Clients',                   'core_nido_modules', 'Core NIDO Modules', NULL, '/clients',                   'core_24', true, false, 5,  'Client organizations, onboarding, and client management.'),
  ('vendors',                   'Vendors',                   'core_nido_modules', 'Core NIDO Modules', NULL, '/vendors',                   'core_24', true, false, 6,  'Vendor directory, onboarding, categories, and vendor products.'),
  ('orders',                    'Orders',                    'core_nido_modules', 'Core NIDO Modules', NULL, '/orders',                    'core_24', true, false, 7,  'Customer orders, sub-orders, and fulfillment tracking.'),
  ('reports',                   'Reports',                   'core_nido_modules', 'Core NIDO Modules', NULL, '/reports',                   'core_24', true, false, 8,  'Analytics, scheduled reports, and exports.'),
  ('sales',                     'Sales',                     'core_nido_modules', 'Core NIDO Modules', NULL, '/transactions/sales',        'core_24', true, false, 9,  'Sales quotes, sales orders, receipts, credit notes, and challans.'),
  ('purchases',                 'Purchases',                 'core_nido_modules', 'Core NIDO Modules', NULL, '/transactions/purchase',     'core_24', true, false, 10, 'Purchase transactions, payments made, and vendor credits.'),
  ('expenses',                  'Expenses',                  'core_nido_modules', 'Core NIDO Modules', NULL, '/expenses',                  'core_24', true, false, 11, 'Operating expenses and recurring expense profiles.'),
  ('purchase_orders',           'Purchase Orders',           'core_nido_modules', 'Core NIDO Modules', NULL, '/purchase-orders',           'core_24', true, false, 12, 'Vendor purchase orders and procurement execution.'),
  ('bills',                     'Bills',                     'core_nido_modules', 'Core NIDO Modules', NULL, '/bills',                     'core_24', true, false, 13, 'Vendor bills and accounts payable.'),
  ('invoices',                  'Invoices',                  'core_nido_modules', 'Core NIDO Modules', NULL, '/invoices',                  'core_24', true, false, 14, 'Client invoices, proforma invoices, and recurring billing.'),
  ('contracts',                 'Contracts',                 'core_nido_modules', 'Core NIDO Modules', NULL, '/contracts',                 'core_24', true, false, 15, 'Client and vendor commercial contracts.'),
  ('approvals',                 'Approvals',                 'core_nido_modules', 'Core NIDO Modules', NULL, '/approvals',                 'core_24', true, false, 16, 'Approval workflows and approval decision queues.'),
  ('master_catalogue',          'Master Catalogue',          'core_nido_modules', 'Core NIDO Modules', NULL, '/master-catalogue',          'core_24', true, false, 17, 'Master product catalogue and variations.'),
  ('users',                     'Users',                     'core_nido_modules', 'Core NIDO Modules', NULL, '/users',                     'core_24', true, false, 18, 'NIDO internal employee user accounts and invitations.'),
  ('roles',                     'Roles',                     'core_nido_modules', 'Core NIDO Modules', NULL, '/configuration/nido-users',  'core_24', true, false, 19, 'Role definitions and permission matrices.'),
  ('departments',               'Departments',               'core_nido_modules', 'Core NIDO Modules', NULL, '/departments',               'core_24', true, false, 20, 'Internal department directory.'),
  ('audit_logs',                'Audit Logs',                'core_nido_modules', 'Core NIDO Modules', NULL, '/audit-logs',                'core_24', true, false, 21, 'System and security audit trails.'),
  ('notifications',             'Notifications',             'core_nido_modules', 'Core NIDO Modules', NULL, '/notifications',             'core_24', true, false, 22, 'Platform notification center and preferences.'),
  ('configuration',             'Configuration',             'core_nido_modules', 'Core NIDO Modules', NULL, '/configuration',             'core_24', true, false, 23, 'General, SLA, tax, pricing, security, and transaction settings.'),
  ('client_user_impersonation', 'Client User Impersonation', 'core_nido_modules', 'Core NIDO Modules', NULL, '/clients',                   'core_24', true, false, 24, 'View-only client portal user impersonation.')
ON CONFLICT (module_key) DO UPDATE SET
  label = EXCLUDED.label,
  group_key = EXCLUDED.group_key,
  group_label = EXCLUDED.group_label,
  parent_module_key = EXCLUDED.parent_module_key,
  route_path = EXCLUDED.route_path,
  source_origin = EXCLUDED.source_origin,
  is_core_group = EXCLUDED.is_core_group,
  display_order = EXCLUDED.display_order,
  description = EXCLUDED.description
WHERE public.nido_module_catalog.is_custom = false;

-- 4B. Remaining 39 Workbook Modules (Groups 2-6 of the 63-module catalogue)
INSERT INTO public.nido_module_catalog (
  module_key, label, group_key, group_label, parent_module_key, route_path,
  source_origin, is_core_group, is_custom, display_order
)
VALUES
  -- Group 2: Procurement (25-32)
  ('vendor_quotations',      'Vendor Quotations',      'procurement',    'Procurement',    'purchases',       NULL, 'workbook_63', false, false, 25),
  ('vendor_payments',        'Vendor Payments',        'procurement',    'Procurement',    'purchases',       NULL, 'workbook_63', false, false, 26),
  ('goods_receipt_notes',    'Goods Receipt Notes',    'procurement',    'Procurement',    'purchase_orders', NULL, 'workbook_63', false, false, 27),
  ('purchase_requisitions',  'Purchase Requisitions',  'procurement',    'Procurement',    'orders',          NULL, 'workbook_63', false, false, 28),
  ('stock_transfers',        'Stock Transfers',        'procurement',    'Procurement',    'configuration',   NULL, 'workbook_63', false, false, 29),
  ('procurement_analytics',  'Procurement Analytics',  'procurement',    'Procurement',    'reports',         NULL, 'workbook_63', false, false, 30),
  ('vendor_performance',     'Vendor Performance',     'procurement',    'Procurement',    'vendors',         NULL, 'workbook_63', false, false, 31),
  ('vendor_compliance',      'Vendor Compliance',      'procurement',    'Procurement',    'vendors',         NULL, 'workbook_63', false, false, 32),
  -- Group 3: Finance (33-40)
  ('payments',               'Payments',               'finance',        'Finance',        'sales',           NULL, 'workbook_63', false, false, 33),
  ('credit_notes',           'Credit Notes',           'finance',        'Finance',        'sales',           NULL, 'workbook_63', false, false, 34),
  ('debit_notes',            'Debit Notes',            'finance',        'Finance',        'purchases',       NULL, 'workbook_63', false, false, 35),
  ('tax_management',         'Tax Management',         'finance',        'Finance',        'configuration',   NULL, 'workbook_63', false, false, 36),
  ('budgets',                'Budgets',                'finance',        'Finance',        'expenses',        NULL, 'workbook_63', false, false, 37),
  ('cost_centres',           'Cost Centres',           'finance',        'Finance',        'expenses',        NULL, 'workbook_63', false, false, 38),
  ('financial_reports',      'Financial Reports',      'finance',        'Finance',        'reports',         NULL, 'workbook_63', false, false, 39),
  ('reconciliation',         'Reconciliation',         'finance',        'Finance',        'bills',           NULL, 'workbook_63', false, false, 40),
  -- Group 4: Operations (41-48)
  ('warehouses',             'Warehouses',             'operations',     'Operations',     'configuration',   NULL, 'workbook_63', false, false, 41),
  ('locations',              'Locations',              'operations',     'Operations',     'configuration',   NULL, 'workbook_63', false, false, 42),
  ('deliveries',             'Deliveries',             'operations',     'Operations',     'orders',          NULL, 'workbook_63', false, false, 43),
  ('shipments',              'Shipments',              'operations',     'Operations',     'orders',          NULL, 'workbook_63', false, false, 44),
  ('returns',                'Returns',                'operations',     'Operations',     'orders',          NULL, 'workbook_63', false, false, 45),
  ('quality_checks',         'Quality Checks',         'operations',     'Operations',     'purchase_orders', NULL, 'workbook_63', false, false, 46),
  ('service_requests',       'Service Requests',       'operations',     'Operations',     'services',        NULL, 'workbook_63', false, false, 47),
  ('maintenance',            'Maintenance',            'operations',     'Operations',     'services',        NULL, 'workbook_63', false, false, 48),
  -- Group 5: Administration (49-56)
  ('organization_settings',  'Organization Settings',  'administration', 'Administration', 'configuration',   NULL, 'workbook_63', false, false, 49),
  ('branches',               'Branches',               'administration', 'Administration', 'configuration',   NULL, 'workbook_63', false, false, 50),
  ('teams',                  'Teams',                  'administration', 'Administration', 'departments',     NULL, 'workbook_63', false, false, 51),
  ('user_groups',            'User Groups',            'administration', 'Administration', 'users',           NULL, 'workbook_63', false, false, 52),
  ('login_history',          'Login History',          'administration', 'Administration', 'audit_logs',      NULL, 'workbook_63', false, false, 53),
  ('security_settings',      'Security Settings',      'administration', 'Administration', 'configuration',   NULL, 'workbook_63', false, false, 54),
  ('api_access',             'API Access',             'administration', 'Administration', 'configuration',   NULL, 'workbook_63', false, false, 55),
  ('data_import_export',     'Data Import/Export',     'administration', 'Administration', 'configuration',   NULL, 'workbook_63', false, false, 56),
  -- Group 6: Client Portal Oversight (57-63)
  ('client_dashboard',       'Client Dashboard',       'client_portal',  'Client Portal',  'clients',         NULL, 'workbook_63', false, false, 57),
  ('client_catalogue',       'Client Catalogue',       'client_portal',  'Client Portal',  'clients',         NULL, 'workbook_63', false, false, 58),
  ('client_cart',            'Client Cart',            'client_portal',  'Client Portal',  'clients',         NULL, 'workbook_63', false, false, 59),
  ('client_checkout',        'Client Checkout',        'client_portal',  'Client Portal',  'clients',         NULL, 'workbook_63', false, false, 60),
  ('client_orders',          'Client Orders',          'client_portal',  'Client Portal',  'clients',         NULL, 'workbook_63', false, false, 61),
  ('client_documents',       'Client Documents',       'client_portal',  'Client Portal',  'clients',         NULL, 'workbook_63', false, false, 62),
  ('client_support_tickets', 'Client Support Tickets', 'client_portal',  'Client Portal',  'support',         NULL, 'workbook_63', false, false, 63)
ON CONFLICT (module_key) DO UPDATE SET
  label = EXCLUDED.label,
  group_key = EXCLUDED.group_key,
  group_label = EXCLUDED.group_label,
  parent_module_key = EXCLUDED.parent_module_key,
  route_path = EXCLUDED.route_path,
  source_origin = EXCLUDED.source_origin,
  is_core_group = EXCLUDED.is_core_group,
  display_order = EXCLUDED.display_order,
  description = EXCLUDED.description
WHERE public.nido_module_catalog.is_custom = false;

-- 4C. 74 Navigable Route-Level Page Keys (platformModuleCatalog.ts)
INSERT INTO public.nido_module_catalog (
  module_key, label, group_key, group_label, parent_module_key, route_path,
  source_origin, is_core_group, is_custom, display_order
)
VALUES
  ('platform_dashboard',                      'Dashboard',                                         'platform_pages', 'Platform Pages', 'dashboard',        '/dashboard',                      'platform_page', false, false, 101),
  ('platform_shop',                           'Shop',                                              'platform_pages', 'Platform Pages', 'shop',             '/shop',                           'platform_page', false, false, 102),
  ('platform_services',                       'Services',                                          'platform_pages', 'Platform Pages', 'services',         '/services',                       'platform_page', false, false, 103),
  ('platform_support',                        'Support',                                           'platform_pages', 'Platform Pages', 'support',          '/support',                        'platform_page', false, false, 104),
  ('platform_clients',                        'Clients',                                           'platform_pages', 'Platform Pages', 'clients',          '/clients',                        'platform_page', false, false, 105),
  ('platform_clients_add',                    'Clients › Add Client',                              'platform_pages', 'Platform Pages', 'clients',          '/clients/add',                    'platform_page', false, false, 106),
  ('platform_contracts',                      'Clients › Contracts',                               'platform_pages', 'Platform Pages', 'contracts',        '/contracts',                      'platform_page', false, false, 107),
  ('platform_clients_id_contracts',           'Clients › Contracts (Detail)',                      'platform_pages', 'Platform Pages', 'contracts',        '/clients/:id/contracts',          'platform_page', false, false, 108),
  ('platform_clients_roles',                  'Clients › Roles',                                   'platform_pages', 'Platform Pages', 'roles',            '/clients/roles',                  'platform_page', false, false, 109),
  ('platform_clients_users',                  'Clients › Users',                                   'platform_pages', 'Platform Pages', 'users',            '/clients/users',                  'platform_page', false, false, 110),
  ('platform_clients_orders',                 'Clients › Orders',                                  'platform_pages', 'Platform Pages', 'clients',          '/clients/orders',                 'platform_page', false, false, 111),
  ('platform_clients_services',               'Clients › Services',                                'platform_pages', 'Platform Pages', 'clients',          '/clients/services',               'platform_page', false, false, 112),
  ('platform_clients_catalog',                'Clients › Catalog',                                 'platform_pages', 'Platform Pages', 'clients',          '/clients/catalog',                'platform_page', false, false, 113),
  ('platform_clients_activity',               'Clients › Activity',                                'platform_pages', 'Platform Pages', 'clients',          '/clients/activity',               'platform_page', false, false, 114),
  ('platform_clients_configuration',          'Clients › Configuration',                           'platform_pages', 'Platform Pages', 'clients',          '/clients/configuration',          'platform_page', false, false, 115),
  ('platform_clients_documents',              'Clients › Documents',                               'platform_pages', 'Platform Pages', 'clients',          '/clients/documents',              'platform_page', false, false, 116),
  ('platform_vendors',                        'Vendors',                                           'platform_pages', 'Platform Pages', 'vendors',          '/vendors',                        'platform_page', false, false, 117),
  ('platform_vendors_orders',                 'Vendors › Orders',                                  'platform_pages', 'Platform Pages', 'vendors',          '/vendors/orders',                 'platform_page', false, false, 118),
  ('platform_vendors_dashboard',              'Vendors › Dashboard',                               'platform_pages', 'Platform Pages', 'vendors',          '/vendors/dashboard',              'platform_page', false, false, 119),
  ('platform_vendors_categories',             'Vendors › Categories',                              'platform_pages', 'Platform Pages', 'vendors',          '/vendors/categories',             'platform_page', false, false, 120),
  ('platform_vendors_onboarding',             'Vendors › Onboarding',                              'platform_pages', 'Platform Pages', 'vendors',          '/vendors/onboarding',             'platform_page', false, false, 121),
  ('platform_orders',                         'My Requests › Orders',                              'platform_pages', 'Platform Pages', 'orders',           '/orders',                         'platform_page', false, false, 122),
  ('platform_my_services',                    'My Requests › Services',                            'platform_pages', 'Platform Pages', 'services',         '/my-services',                    'platform_page', false, false, 123),
  ('platform_my_renewals',                    'My Requests › My Renewals',                         'platform_pages', 'Platform Pages', 'orders',           '/my-renewals',                    'platform_page', false, false, 124),
  ('platform_reports',                        'Reports',                                           'platform_pages', 'Platform Pages', 'reports',          '/reports',                        'platform_page', false, false, 125),
  ('platform_reports_executive',              'Reports › Executive',                               'platform_pages', 'Platform Pages', 'reports',          '/reports/executive',              'platform_page', false, false, 126),
  ('platform_reports_sales',                  'Reports › Sales',                                   'platform_pages', 'Platform Pages', 'reports',          '/reports/sales',                  'platform_page', false, false, 127),
  ('platform_reports_procurement',            'Reports › Procurement',                             'platform_pages', 'Platform Pages', 'reports',          '/reports/procurement',            'platform_page', false, false, 128),
  ('platform_reports_vendors',                'Reports › Vendors',                                 'platform_pages', 'Platform Pages', 'reports',          '/reports/vendors',                'platform_page', false, false, 129),
  ('platform_reports_clients',                'Reports › Clients',                                 'platform_pages', 'Platform Pages', 'reports',          '/reports/clients',                'platform_page', false, false, 130),
  ('platform_reports_inventory',              'Reports › Inventory',                               'platform_pages', 'Platform Pages', 'reports',          '/reports/inventory',              'platform_page', false, false, 131),
  ('platform_reports_finance',                'Reports › Finance',                                 'platform_pages', 'Platform Pages', 'reports',          '/reports/finance',                'platform_page', false, false, 132),
  ('platform_reports_support',                'Reports › Support',                                 'platform_pages', 'Platform Pages', 'reports',          '/reports/support',                'platform_page', false, false, 133),
  ('platform_reports_sla',                    'Reports › SLA',                                     'platform_pages', 'Platform Pages', 'reports',          '/reports/sla',                    'platform_page', false, false, 134),
  ('platform_reports_approvals',              'Reports › Approvals',                               'platform_pages', 'Platform Pages', 'reports',          '/reports/approvals',              'platform_page', false, false, 135),
  ('platform_reports_tax',                    'Reports › Tax',                                     'platform_pages', 'Platform Pages', 'reports',          '/reports/tax',                    'platform_page', false, false, 136),
  ('platform_reports_audit',                  'Reports › Audit Trail',                             'platform_pages', 'Platform Pages', 'audit_logs',       '/reports/audit',                  'platform_page', false, false, 137),
  ('platform_transactions',                   'Transactions',                                      'platform_pages', 'Platform Pages', 'purchases',        '/transactions',                   'platform_page', false, false, 138),
  ('platform_transactions_sales',             'Transactions › Sales',                              'platform_pages', 'Platform Pages', 'sales',            '/transactions/sales',             'platform_page', false, false, 139),
  ('platform_sales_quotes',                   'Transactions › Sales › Quotes',                     'platform_pages', 'Platform Pages', 'sales',            '/sales/quotes',                   'platform_page', false, false, 140),
  ('platform_sales_orders',                   'Transactions › Sales › Sales Orders',               'platform_pages', 'Platform Pages', 'sales',            '/sales/orders',                   'platform_page', false, false, 141),
  ('platform_invoices',                       'Transactions › Sales › Invoices',                   'platform_pages', 'Platform Pages', 'invoices',         '/invoices',                       'platform_page', false, false, 142),
  ('platform_recurring_invoices',             'Transactions › Sales › Recurring Invoices',         'platform_pages', 'Platform Pages', 'invoices',         '/recurring-invoices',             'platform_page', false, false, 143),
  ('platform_delivery_challans',              'Transactions › Sales › Delivery Challans',          'platform_pages', 'Platform Pages', 'sales',            '/delivery-challans',              'platform_page', false, false, 144),
  ('platform_payment_receipts',               'Transactions › Sales › Payment Receipts',           'platform_pages', 'Platform Pages', 'sales',            '/payment-receipts',               'platform_page', false, false, 145),
  ('platform_credit_notes',                   'Transactions › Sales › Credit Notes',               'platform_pages', 'Platform Pages', 'sales',            '/credit-notes',                   'platform_page', false, false, 146),
  ('platform_eway_bills',                     'Transactions › Sales › e-Way Bills',                'platform_pages', 'Platform Pages', 'sales',            '/eway-bills',                     'platform_page', false, false, 147),
  ('platform_transactions_purchase',          'Transactions › Purchases',                          'platform_pages', 'Platform Pages', 'purchases',        '/transactions/purchase',          'platform_page', false, false, 148),
  ('platform_expenses',                       'Transactions › Purchases › Expenses',               'platform_pages', 'Platform Pages', 'expenses',         '/expenses',                       'platform_page', false, false, 149),
  ('platform_recurring_expenses',             'Transactions › Purchases › Recurring Expenses',     'platform_pages', 'Platform Pages', 'expenses',         '/recurring-expenses',             'platform_page', false, false, 150),
  ('platform_purchase_orders',                'Transactions › Purchases › Purchase Orders',        'platform_pages', 'Platform Pages', 'purchase_orders',  '/purchase-orders',                'platform_page', false, false, 151),
  ('platform_bills',                          'Transactions › Purchases › Bills',                  'platform_pages', 'Platform Pages', 'bills',            '/bills',                          'platform_page', false, false, 152),
  ('platform_payments_made',                  'Transactions › Purchases › Payments Made',          'platform_pages', 'Platform Pages', 'purchases',        '/payments-made',                  'platform_page', false, false, 153),
  ('platform_vendor_credits',                 'Transactions › Purchases › Vendor Credits',         'platform_pages', 'Platform Pages', 'purchases',        '/vendor-credits',                 'platform_page', false, false, 154),
  ('platform_configuration',                  'Configuration',                                     'platform_pages', 'Platform Pages', 'configuration',    '/configuration',                  'platform_page', false, false, 155),
  ('platform_configuration_general_settings', 'Configuration › General Settings',                  'platform_pages', 'Platform Pages', 'configuration',    '/configuration/general-settings', 'platform_page', false, false, 156),
  ('platform_configuration_nido_users',       'Configuration › Nido Users › Roles & Users',        'platform_pages', 'Platform Pages', 'users',            '/configuration/nido-users',       'platform_page', false, false, 157),
  ('platform_configuration_email_settings',   'Configuration › Email Settings',                    'platform_pages', 'Platform Pages', 'configuration',    '/configuration/email-settings',   'platform_page', false, false, 158),
  ('platform_configuration_email_templates',  'Configuration › Email Templates',                   'platform_pages', 'Platform Pages', 'configuration',    '/configuration/email-templates',  'platform_page', false, false, 159),
  ('platform_configuration_email_logs',       'Configuration › Email Logs',                        'platform_pages', 'Platform Pages', 'configuration',    '/configuration/email-logs',       'platform_page', false, false, 160),
  ('platform_configuration_order_statuses',   'Configuration › Order Statuses',                    'platform_pages', 'Platform Pages', 'configuration',    '/configuration/order-statuses',   'platform_page', false, false, 161),
  ('platform_configuration_locations',        'Configuration › Locations',                         'platform_pages', 'Platform Pages', 'configuration',    '/configuration/locations',        'platform_page', false, false, 162),
  ('platform_configuration_notifications',    'Configuration › Notifications',                     'platform_pages', 'Platform Pages', 'notifications',    '/configuration/notifications',    'platform_page', false, false, 163),
  ('platform_configuration_workflows',        'Configuration › Approval Workflows',                'platform_pages', 'Platform Pages', 'approvals',        '/configuration/workflows',        'platform_page', false, false, 164),
  ('platform_configuration_pricing',          'Configuration › Pricing & Discounts',               'platform_pages', 'Platform Pages', 'configuration',    '/configuration/pricing',          'platform_page', false, false, 165),
  ('platform_configuration_tax_settings',     'Configuration › Tax Settings',                      'platform_pages', 'Platform Pages', 'configuration',    '/configuration/tax-settings',     'platform_page', false, false, 166),
  ('platform_configuration_sla_settings',     'Configuration › SLA Settings',                      'platform_pages', 'Platform Pages', 'configuration',    '/configuration/sla-settings',     'platform_page', false, false, 167),
  ('platform_configuration_stock_management', 'Configuration › Stock Management',                  'platform_pages', 'Platform Pages', 'configuration',    '/configuration/stock-management', 'platform_page', false, false, 168),
  ('platform_configuration_master_catalogue', 'Configuration › Master Catalogue',                  'platform_pages', 'Platform Pages', 'master_catalogue', '/configuration/master-catalogue', 'platform_page', false, false, 169),
  ('platform_integrations',                   'Configuration › Integrations',                      'platform_pages', 'Platform Pages', 'configuration',    '/integrations',                   'platform_page', false, false, 170),
  ('platform_users',                          'User Management › Users',                           'platform_pages', 'Platform Pages', 'users',            '/users',                          'platform_page', false, false, 171),
  ('platform_departments',                    'User Management › Departments',                     'platform_pages', 'Platform Pages', 'departments',      '/departments',                    'platform_page', false, false, 172),
  ('platform_user_invitations',               'User Management › Invitations',                     'platform_pages', 'Platform Pages', 'users',            '/user-invitations',               'platform_page', false, false, 173),
  ('platform_audit_logs',                     'User Management › Audit Trail',                     'platform_pages', 'Platform Pages', 'audit_logs',       '/audit-logs',                     'platform_page', false, false, 174)
ON CONFLICT (module_key) DO UPDATE SET
  label = EXCLUDED.label,
  group_key = EXCLUDED.group_key,
  group_label = EXCLUDED.group_label,
  parent_module_key = EXCLUDED.parent_module_key,
  route_path = EXCLUDED.route_path,
  source_origin = EXCLUDED.source_origin,
  is_core_group = EXCLUDED.is_core_group,
  display_order = EXCLUDED.display_order,
  description = EXCLUDED.description
WHERE public.nido_module_catalog.is_custom = false;

-- ============================================================================
-- 5. SEED CLIENT PORTAL MODULE CATALOG (34 Modules with Parent-Child Links)
-- ============================================================================

INSERT INTO public.client_module_catalog (
  module_key, label, parent_module_key, display_order, description
)
VALUES
  -- Parents & Standalone
  ('Dashboard',                       'Dashboard',                       NULL,        1,  'Client portal overview and account activity.'),
  ('Services',                        'Services',                        NULL,        18, 'Access the client portal Services Hub.'),
  -- Dashboard 16 child modules
  ('Overview - Total Orders',         'Overview - Total Orders',         'Dashboard', 2,  'Total Orders KPI card on the client portal overview.'),
  ('Overview - Total Spent',          'Overview - Total Spent',          'Dashboard', 3,  'Total Spent KPI card on the client portal overview.'),
  ('Overview - Products',             'Overview - Products',             'Dashboard', 4,  'Products KPI card on the client portal overview.'),
  ('Overview - Invoices',             'Overview - Invoices',             'Dashboard', 5,  'Invoices KPI card on the client portal overview.'),
  ('Overview - Open Support Tickets', 'Overview - Open Support Tickets', 'Dashboard', 6,  'Open Support Tickets KPI card on the client portal overview.'),
  ('Company Information',             'Company Information',             'Dashboard', 7,  'Company Information card on the client portal overview.'),
  ('Orders Overview',                 'Orders Overview',                 'Dashboard', 8,  'Orders Overview chart card on the client portal overview.'),
  ('Account Summary',                 'Account Summary',                 'Dashboard', 9,  'Account Summary card on the client portal overview.'),
  ('Business & Tax Details',          'Business & Tax Details',          'Dashboard', 10, 'Business & Tax Details card on the client portal overview.'),
  ('Financial & Bank Details',        'Financial & Bank Details',        'Dashboard', 11, 'Financial & Bank Details card on the client portal overview.'),
  ('Billing Address',                 'Billing Address',                 'Dashboard', 12, 'Billing Address card on the client portal overview.'),
  ('Shipping Address',                'Shipping Address',                'Dashboard', 13, 'Shipping Address card on the client portal overview.'),
  ('Documents',                       'Documents',                       'Dashboard', 14, 'Documents card on the client portal overview.'),
  ('Top Products',                    'Top Products',                    'Dashboard', 15, 'Top Products table card on the client portal overview.'),
  ('Recent Orders',                   'Recent Orders',                   'Dashboard', 16, 'Recent Orders table card on the client portal overview.'),
  ('Quick Links',                     'Quick Links',                     'Dashboard', 17, 'Quick Links section on the client portal overview.'),
  -- Services 6 child modules
  ('Services - My Services',          'Services - My Services',          'Services',  19, 'View service requests submitted by the signed-in user.'),
  ('Services - AMC',                  'Services - AMC',                  'Services',  20, 'Create and access Annual Maintenance Contract (AMC) service requests.'),
  ('Services - Repair Service',       'Services - Repair Service',       'Services',  21, 'Create and access Repair Service requests.'),
  ('Services - Recycle / Disposal',   'Services - Recycle / Disposal',   'Services',  22, 'Create and access Recycle / Disposal service requests.'),
  ('Services - Rental Service',       'Services - Rental Service',       'Services',  23, 'Create and access Rental Service requests.'),
  ('Services - Regular Purchase',     'Services - Regular Purchase',     'Services',  24, 'Create and access Regular Purchase service requests.'),
  -- Remaining 10 standalone modules
  ('Catalog',                         'Catalog',                         NULL,        25, 'Browse and manage the products available to this client.'),
  ('Orders',                          'Orders',                          NULL,        26, 'Create, review, and track client orders.'),
  ('Approvals',                       'Approvals',                       NULL,        27, 'Review and approve requests assigned for client approval.'),
  ('Invoices',                        'Invoices',                        NULL,        28, 'View invoices, balances, and payment status.'),
  ('Reports',                         'Reports',                         NULL,        29, 'View client purchasing and spend reports.'),
  ('Notifications',                   'Notifications',                   NULL,        30, 'View important account and order notifications.'),
  ('Addresses',                       'Addresses',                       NULL,        31, 'Manage delivery and billing addresses.'),
  ('Contracts',                       'Contracts',                       NULL,        32, 'View current client contracts and terms.'),
  ('Support',                         'Support',                         NULL,        33, 'Create and track client support requests.'),
  ('My Profile',                      'My Profile',                      NULL,        34, 'View and manage the signed-in client user profile.')
ON CONFLICT (module_key) DO UPDATE SET
  label = EXCLUDED.label,
  parent_module_key = EXCLUDED.parent_module_key,
  display_order = EXCLUDED.display_order,
  description = EXCLUDED.description;

-- ============================================================================
-- 6. SECURITY: ENABLE RLS (DEFAULT-DENY) & REVOKE ALL BROWSER PRIVILEGES
-- ============================================================================

ALTER TABLE public.nido_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nido_module_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nido_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nido_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_module_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_role_permissions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.nido_organizations FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.client_organizations FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.organization_settings FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.nido_module_catalog FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.nido_roles FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.nido_role_permissions FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.client_module_catalog FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.client_roles FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.client_role_permissions FROM PUBLIC, anon, authenticated;

