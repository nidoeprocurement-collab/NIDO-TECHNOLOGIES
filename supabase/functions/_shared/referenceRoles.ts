// Versioned backend source of truth for the 24 built-in non-System-Owner NIDO roles
// and their initial module permission matrices. Never depends on browser localStorage.

export const REFERENCE_ROLES_VERSION = 'rbac-reference-v2';

export type ReferenceActionKey =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'approve'
  | 'export'
  | 'import'
  | 'manage'
  | 'configure';

export type ReferenceModulePermissions = Partial<Record<ReferenceActionKey, boolean>>;

export interface ReferenceRoleDefinition {
  name: string;
  department: string;
  description: string;
  permissions: Record<string, ReferenceModulePermissions>;
}

export const REFERENCE_ROLES: ReferenceRoleDefinition[] = [
  {
    "name": "System Administrator",
    "department": "Platform / IT Administration",
    "description": "Platform configuration, users, security and integrations",
    "permissions": {
      "dashboard": {
        "view": true,
        "export": true,
        "manage": true,
        "configure": true
      },
      "reports": {
        "view": true,
        "export": true,
        "manage": true
      },
      "clients": {
        "view": true,
        "create": true,
        "edit": true,
        "delete": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "vendors": {
        "view": true,
        "create": true,
        "edit": true,
        "delete": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "orders": {
        "view": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true
      },
      "purchases": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "purchase_orders": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "bills": {
        "view": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true
      },
      "invoices": {
        "view": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true
      },
      "contracts": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true
      },
      "approvals": {
        "view": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true,
        "configure": true
      },
      "master_catalogue": {
        "view": true,
        "create": true,
        "edit": true,
        "delete": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true,
        "configure": true
      },
      "users": {
        "view": true,
        "create": true,
        "edit": true,
        "delete": true,
        "export": true,
        "import": true,
        "manage": true,
        "configure": true
      },
      "roles": {
        "view": true,
        "create": true,
        "edit": true,
        "delete": true,
        "export": true,
        "import": true,
        "manage": true,
        "configure": true
      },
      "departments": {
        "view": true,
        "create": true,
        "edit": true,
        "delete": true,
        "export": true,
        "import": true,
        "manage": true,
        "configure": true
      },
      "audit_logs": {
        "view": true,
        "export": true,
        "manage": true
      },
      "notifications": {
        "view": true,
        "create": true,
        "edit": true,
        "delete": true,
        "export": true,
        "import": true,
        "manage": true,
        "configure": true
      },
      "configuration": {
        "view": true,
        "create": true,
        "edit": true,
        "delete": true,
        "export": true,
        "import": true,
        "manage": true,
        "configure": true
      },
      "organization_settings": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "import": true,
        "manage": true,
        "configure": true
      },
      "branches": {
        "view": true,
        "create": true,
        "edit": true,
        "delete": true,
        "export": true,
        "import": true,
        "manage": true,
        "configure": true
      },
      "teams": {
        "view": true,
        "create": true,
        "edit": true,
        "delete": true,
        "export": true,
        "import": true,
        "manage": true,
        "configure": true
      },
      "user_groups": {
        "view": true,
        "create": true,
        "edit": true,
        "delete": true,
        "export": true,
        "import": true,
        "manage": true,
        "configure": true
      },
      "login_history": {
        "view": true,
        "export": true,
        "manage": true
      },
      "data_import_export": {
        "view": true,
        "export": true,
        "import": true,
        "manage": true,
        "configure": true
      },
      "client_dashboard": {
        "view": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "client_catalogue": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true,
        "configure": true
      },
      "client_orders": {
        "view": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true
      },
      "client_documents": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "client_support_tickets": {
        "view": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true
      }
    }
  },
  {
    "name": "Application Administrator",
    "department": "Platform / IT Administration",
    "description": "Day-to-day application administration and monitoring",
    "permissions": {
      "dashboard": {
        "view": true,
        "export": true,
        "manage": true,
        "configure": true
      },
      "reports": {
        "view": true,
        "export": true,
        "manage": true
      },
      "users": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "roles": {
        "view": true,
        "edit": true,
        "export": true,
        "manage": true,
        "configure": true
      },
      "departments": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "audit_logs": {
        "view": true,
        "export": true,
        "manage": true,
        "configure": true
      },
      "notifications": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "import": true,
        "manage": true,
        "configure": true
      },
      "configuration": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "import": true,
        "manage": true,
        "configure": true
      },
      "client_user_impersonation": {
        "view": true,
        "manage": true,
        "configure": true
      },
      "login_history": {
        "view": true,
        "export": true,
        "manage": true
      },
      "security_settings": {
        "view": true,
        "edit": true,
        "export": true,
        "manage": true,
        "configure": true
      },
      "api_access": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "import": true,
        "manage": true,
        "configure": true
      },
      "data_import_export": {
        "view": true,
        "export": true,
        "import": true,
        "manage": true,
        "configure": true
      },
      "client_dashboard": {
        "view": true,
        "export": true,
        "manage": true
      },
      "client_catalogue": {
        "view": true,
        "export": true,
        "manage": true
      },
      "client_cart": {
        "view": true,
        "export": true,
        "manage": true
      },
      "client_checkout": {
        "view": true,
        "export": true,
        "manage": true
      },
      "client_orders": {
        "view": true,
        "export": true,
        "manage": true
      },
      "client_documents": {
        "view": true,
        "export": true,
        "manage": true
      },
      "client_support_tickets": {
        "view": true,
        "export": true,
        "manage": true
      }
    }
  },
  {
    "name": "Head - Customer Relationships",
    "department": "Customer Relationship & Client Operations",
    "description": "Owns client relationship strategy and escalations",
    "permissions": {
      "dashboard": {
        "view": true,
        "export": true,
        "manage": true
      },
      "clients": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "orders": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "sales": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "invoices": {
        "view": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true
      },
      "contracts": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true
      },
      "approvals": {
        "view": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true
      },
      "client_dashboard": {
        "view": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "client_catalogue": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "client_cart": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "client_checkout": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true
      },
      "client_orders": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "client_documents": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "client_support_tickets": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true
      },
      "reports": {
        "view": true,
        "export": true,
        "manage": true
      }
    }
  },
  {
    "name": "CRM Manager / Team Lead",
    "department": "Customer Relationship & Client Operations",
    "description": "Manages CRM portfolio, assignments and escalations",
    "permissions": {
      "dashboard": {
        "view": true,
        "export": true,
        "manage": true
      },
      "clients": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "orders": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "sales": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "contracts": {
        "view": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "client_dashboard": {
        "view": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "client_catalogue": {
        "view": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "client_orders": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "client_documents": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "client_support_tickets": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "reports": {
        "view": true,
        "export": true,
        "manage": true
      }
    }
  },
  {
    "name": "Customer Relationship Manager",
    "department": "Customer Relationship & Client Operations",
    "description": "Primary face of Nido-Tech for assigned clients",
    "permissions": {
      "dashboard": {
        "view": true,
        "export": true
      },
      "clients": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "orders": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "sales": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "contracts": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "invoices": {
        "view": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "client_dashboard": {
        "view": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "client_catalogue": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "client_cart": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "client_checkout": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "client_orders": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "client_documents": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "client_support_tickets": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "manage": true
      }
    }
  },
  {
    "name": "Client Operations Analyst",
    "department": "Customer Relationship & Client Operations",
    "description": "Client onboarding and operational administration",
    "permissions": {
      "dashboard": {
        "view": true,
        "export": true
      },
      "clients": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "orders": {
        "view": true,
        "edit": true,
        "export": true
      },
      "sales": {
        "view": true,
        "edit": true,
        "export": true
      },
      "client_dashboard": {
        "view": true,
        "export": true
      },
      "client_catalogue": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "client_orders": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "client_documents": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "client_support_tickets": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "reports": {
        "view": true,
        "export": true
      }
    }
  },
  {
    "name": "Procurement Head",
    "department": "Procurement",
    "description": "Owns procurement policy and high-value approvals",
    "permissions": {
      "dashboard": {
        "view": true,
        "export": true,
        "manage": true
      },
      "reports": {
        "view": true,
        "export": true,
        "manage": true
      },
      "vendors": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "purchases": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "purchase_orders": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "approvals": {
        "view": true,
        "approve": true,
        "export": true,
        "manage": true
      },
      "vendor_quotations": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "vendor_payments": {
        "view": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "goods_receipt_notes": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "purchase_requisitions": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "stock_transfers": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "procurement_analytics": {
        "view": true,
        "export": true,
        "manage": true
      },
      "vendor_performance": {
        "view": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true
      },
      "vendor_compliance": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "warehouses": {
        "view": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "locations": {
        "view": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "deliveries": {
        "view": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "shipments": {
        "view": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "quality_checks": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true
      }
    }
  },
  {
    "name": "Procurement Manager / Lead",
    "department": "Procurement",
    "description": "Manages RFQ, sourcing, PO workflow and team",
    "permissions": {
      "dashboard": {
        "view": true,
        "export": true,
        "manage": true
      },
      "vendors": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "purchases": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "purchase_orders": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "vendor_quotations": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "goods_receipt_notes": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "purchase_requisitions": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "stock_transfers": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "procurement_analytics": {
        "view": true,
        "export": true
      },
      "vendor_performance": {
        "view": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "vendor_compliance": {
        "view": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "warehouses": {
        "view": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "locations": {
        "view": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "deliveries": {
        "view": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "shipments": {
        "view": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "quality_checks": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "manage": true
      }
    }
  },
  {
    "name": "Procurement Analyst",
    "department": "Procurement",
    "description": "Processes requirements, RFQs, comparisons and POs",
    "permissions": {
      "dashboard": {
        "view": true,
        "export": true
      },
      "vendors": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true
      },
      "purchases": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "import": true
      },
      "purchase_orders": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "import": true
      },
      "vendor_quotations": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "goods_receipt_notes": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "purchase_requisitions": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "stock_transfers": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true
      },
      "procurement_analytics": {
        "view": true,
        "export": true
      },
      "vendor_performance": {
        "view": true,
        "export": true
      },
      "vendor_compliance": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true
      },
      "warehouses": {
        "view": true,
        "export": true
      },
      "deliveries": {
        "view": true,
        "export": true
      }
    }
  },
  {
    "name": "Vendor Management Head",
    "department": "Vendor Management",
    "description": "Owns vendor governance and escalations",
    "permissions": {
      "dashboard": {
        "view": true,
        "export": true,
        "manage": true
      },
      "vendors": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "vendor_quotations": {
        "view": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true
      },
      "vendor_payments": {
        "view": true,
        "edit": true,
        "export": true
      },
      "vendor_performance": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "vendor_compliance": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "procurement_analytics": {
        "view": true,
        "export": true,
        "manage": true
      },
      "contracts": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true
      },
      "reports": {
        "view": true,
        "export": true,
        "manage": true
      }
    }
  },
  {
    "name": "Vendor Manager / Lead",
    "department": "Vendor Management",
    "description": "Manages vendor onboarding, performance and SLA",
    "permissions": {
      "dashboard": {
        "view": true,
        "export": true
      },
      "vendors": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "vendor_quotations": {
        "view": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "vendor_payments": {
        "view": true,
        "export": true
      },
      "vendor_performance": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "vendor_compliance": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "contracts": {
        "view": true,
        "edit": true,
        "export": true
      },
      "procurement_analytics": {
        "view": true,
        "export": true
      }
    }
  },
  {
    "name": "Vendor Coordinator",
    "department": "Vendor Management",
    "description": "Maintains vendor records, KYC, categories and follow-ups",
    "permissions": {
      "dashboard": {
        "view": true
      },
      "vendors": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "vendor_quotations": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "vendor_compliance": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "vendor_performance": {
        "view": true,
        "edit": true,
        "export": true
      },
      "contracts": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true
      },
      "procurement_analytics": {
        "view": true,
        "export": true
      }
    }
  },
  {
    "name": "Service Operations Head",
    "department": "Service Operations",
    "description": "Owns AMC, repair, rental and recycle operations",
    "permissions": {
      "dashboard": {
        "view": true,
        "export": true,
        "manage": true
      },
      "services": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "support": {
        "view": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true
      },
      "orders": {
        "view": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true
      },
      "deliveries": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "shipments": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "warehouses": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "locations": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "returns": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "quality_checks": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "service_requests": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "maintenance": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "reports": {
        "view": true,
        "export": true,
        "manage": true
      }
    }
  },
  {
    "name": "Service Manager / Lead",
    "department": "Service Operations",
    "description": "Manages service queues, vendors, SLA and scheduling",
    "permissions": {
      "dashboard": {
        "view": true,
        "export": true,
        "manage": true
      },
      "services": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true
      },
      "support": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true
      },
      "orders": {
        "view": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true
      },
      "deliveries": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true
      },
      "shipments": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true
      },
      "returns": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true
      },
      "quality_checks": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true
      },
      "service_requests": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true
      },
      "maintenance": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true
      },
      "reports": {
        "view": true,
        "export": true,
        "manage": true
      }
    }
  },
  {
    "name": "Service Coordinator",
    "department": "Service Operations",
    "description": "Coordinates service requests through closure",
    "permissions": {
      "dashboard": {
        "view": true
      },
      "services": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "support": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "orders": {
        "view": true,
        "edit": true,
        "export": true
      },
      "deliveries": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "shipments": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "service_requests": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "maintenance": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "returns": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true
      }
    }
  },
  {
    "name": "Support Head",
    "department": "Support",
    "description": "Owns support policy, escalations and service quality",
    "permissions": {
      "dashboard": {
        "view": true,
        "export": true,
        "manage": true
      },
      "support": {
        "view": true,
        "create": true,
        "edit": true,
        "delete": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "clients": {
        "view": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "orders": {
        "view": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "returns": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true
      },
      "quality_checks": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true
      },
      "service_requests": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true
      },
      "maintenance": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true
      },
      "client_support_tickets": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true
      },
      "client_orders": {
        "view": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "client_documents": {
        "view": true,
        "export": true,
        "manage": true
      },
      "reports": {
        "view": true,
        "export": true,
        "manage": true
      }
    }
  },
  {
    "name": "Support Lead",
    "department": "Support",
    "description": "Manages ticket queues, SLA and assignments",
    "permissions": {
      "dashboard": {
        "view": true,
        "export": true
      },
      "support": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true
      },
      "clients": {
        "view": true,
        "edit": true,
        "export": true
      },
      "orders": {
        "view": true,
        "edit": true,
        "export": true
      },
      "returns": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "quality_checks": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "service_requests": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true
      },
      "maintenance": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "client_support_tickets": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true
      },
      "client_orders": {
        "view": true,
        "edit": true,
        "export": true
      },
      "client_documents": {
        "view": true,
        "export": true
      }
    }
  },
  {
    "name": "Support Analyst",
    "department": "Support",
    "description": "Handles customer/application support tickets",
    "permissions": {}
  },
  {
    "name": "Finance Head",
    "department": "Finance & Accounts",
    "description": "Owns finance controls and approvals",
    "permissions": {
      "dashboard": {
        "view": true,
        "export": true,
        "manage": true
      },
      "reports": {
        "view": true,
        "export": true,
        "manage": true
      },
      "clients": {
        "view": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "vendors": {
        "view": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "orders": {
        "view": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true
      },
      "sales": {
        "view": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true
      },
      "purchases": {
        "view": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true
      },
      "expenses": {
        "view": true,
        "create": true,
        "edit": true,
        "delete": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "purchase_orders": {
        "view": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true
      },
      "bills": {
        "view": true,
        "create": true,
        "edit": true,
        "delete": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "invoices": {
        "view": true,
        "create": true,
        "edit": true,
        "delete": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "contracts": {
        "view": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true
      },
      "approvals": {
        "view": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true
      },
      "vendor_payments": {
        "view": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true
      },
      "payments": {
        "view": true,
        "create": true,
        "edit": true,
        "delete": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "credit_notes": {
        "view": true,
        "create": true,
        "edit": true,
        "delete": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "debit_notes": {
        "view": true,
        "create": true,
        "edit": true,
        "delete": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "tax_management": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true,
        "configure": true
      },
      "budgets": {
        "view": true,
        "create": true,
        "edit": true,
        "delete": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true,
        "configure": true
      },
      "cost_centres": {
        "view": true,
        "create": true,
        "edit": true,
        "delete": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true,
        "configure": true
      },
      "financial_reports": {
        "view": true,
        "approve": true,
        "export": true,
        "manage": true,
        "configure": true
      },
      "reconciliation": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      }
    }
  },
  {
    "name": "Finance Manager",
    "department": "Finance & Accounts",
    "description": "Manages receivables, payables and reconciliation",
    "permissions": {
      "dashboard": {
        "view": true,
        "export": true,
        "manage": true
      },
      "reports": {
        "view": true,
        "export": true,
        "manage": true
      },
      "sales": {
        "view": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true
      },
      "purchases": {
        "view": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true
      },
      "expenses": {
        "view": true,
        "create": true,
        "edit": true,
        "delete": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "purchase_orders": {
        "view": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true
      },
      "bills": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "invoices": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "contracts": {
        "view": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true
      },
      "approvals": {
        "view": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true
      },
      "vendor_payments": {
        "view": true,
        "edit": true,
        "approve": true,
        "export": true,
        "manage": true
      },
      "payments": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "credit_notes": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "debit_notes": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "tax_management": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "budgets": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "cost_centres": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "financial_reports": {
        "view": true,
        "export": true,
        "manage": true
      },
      "reconciliation": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      }
    }
  },
  {
    "name": "Finance Executive",
    "department": "Finance & Accounts",
    "description": "Processes invoices, receipts, bills and payments",
    "permissions": {
      "dashboard": {
        "view": true,
        "manage": true
      },
      "reports": {
        "view": true,
        "export": true
      },
      "sales": {
        "view": true,
        "edit": true,
        "export": true
      },
      "purchases": {
        "view": true,
        "edit": true,
        "export": true
      },
      "expenses": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "purchase_orders": {
        "view": true,
        "export": true
      },
      "bills": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "invoices": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "vendor_payments": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "payments": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "credit_notes": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "debit_notes": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "tax_management": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "reconciliation": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "financial_reports": {
        "view": true,
        "export": true
      }
    }
  },
  {
    "name": "Catalog & Pricing Head",
    "department": "Catalog & Pricing",
    "description": "Owns catalogue, pricing governance and margins",
    "permissions": {
      "dashboard": {
        "view": true,
        "export": true,
        "manage": true
      },
      "shop": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "services": {
        "view": true,
        "create": true,
        "edit": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "master_catalogue": {
        "view": true,
        "create": true,
        "edit": true,
        "delete": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true,
        "configure": true
      },
      "client_catalogue": {
        "view": true,
        "create": true,
        "edit": true,
        "delete": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true,
        "configure": true
      },
      "client_dashboard": {
        "view": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "client_orders": {
        "view": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "client_documents": {
        "view": true,
        "edit": true,
        "export": true,
        "manage": true
      },
      "reports": {
        "view": true,
        "export": true,
        "manage": true
      }
    }
  },
  {
    "name": "Catalog / Pricing Manager",
    "department": "Catalog & Pricing",
    "description": "Manages catalogue quality, price rules and approvals",
    "permissions": {
      "dashboard": {
        "view": true,
        "export": true
      },
      "shop": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "services": {
        "view": true,
        "create": true,
        "edit": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "master_catalogue": {
        "view": true,
        "create": true,
        "edit": true,
        "delete": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "client_catalogue": {
        "view": true,
        "create": true,
        "edit": true,
        "delete": true,
        "approve": true,
        "export": true,
        "import": true,
        "manage": true
      },
      "client_dashboard": {
        "view": true,
        "edit": true,
        "export": true
      },
      "client_orders": {
        "view": true,
        "edit": true,
        "export": true
      },
      "reports": {
        "view": true,
        "export": true
      }
    }
  },
  {
    "name": "Catalog & Pricing Analyst",
    "department": "Catalog & Pricing",
    "description": "Maintains products, vendor prices, MOQ, stock and client pricing",
    "permissions": {
      "dashboard": {
        "view": true
      },
      "shop": {
        "view": true,
        "edit": true,
        "export": true
      },
      "services": {
        "view": true,
        "edit": true,
        "export": true
      },
      "master_catalogue": {
        "view": true,
        "edit": true,
        "export": true
      },
      "client_catalogue": {
        "view": true,
        "edit": true,
        "export": true
      },
      "client_dashboard": {
        "view": true,
        "export": true
      },
      "client_orders": {
        "view": true,
        "export": true
      },
      "client_documents": {
        "view": true,
        "export": true
      },
      "reports": {
        "view": true,
        "export": true
      }
    }
  }
];
