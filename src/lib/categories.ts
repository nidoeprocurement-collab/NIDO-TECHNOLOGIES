/**
 * Canonical product/vendor/client category list for the NIDO platform.
 * All pages that show a category dropdown should import from here.
 */

export const PRODUCT_CATEGORIES = [
  'Computers',
  'Networking',
  'Office Supplies',
  'Furniture',
  'Electrical',
  'Cloud Software',
  'Stationery',
  'Pantry',
  'Cleaning Supplies',
  'Medical Supplies',
  'Services',
] as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[number];

/** Default subcategories keyed by category name. */
export const CATEGORY_SUBCATEGORIES: Record<string, string[]> = {
  'Computers': ['Laptops', 'Desktops', 'Monitors', 'Peripherals', 'Storage', 'Accessories'],
  'Networking': ['Routers', 'Switches', 'Access Points', 'Cables', 'Modems', 'Firewalls'],
  'Office Supplies': ['Paper', 'Desk Accessories', 'Filing', 'Adhesives', 'Labels', 'Miscellaneous'],
  'Furniture': ['Chairs', 'Desks', 'Cabinets', 'Shelving', 'Conference Tables', 'Storage Units'],
  'Electrical': ['Cables & Wiring', 'Switches & Sockets', 'Lighting', 'UPS & Inverters', 'Power Strips', 'Batteries'],
  'Cloud Software': ['Productivity', 'Security', 'Storage', 'Communication', 'ERP / CRM', 'Development Tools'],
  'Stationery': ['Pens & Pencils', 'Notebooks', 'Envelopes', 'Stamps', 'Binders', 'Whiteboards'],
  'Pantry': ['Beverages', 'Snacks', 'Condiments', 'Crockery', 'Disposables', 'Grocery'],
  'Cleaning Supplies': ['Detergents', 'Disinfectants', 'Mops & Brooms', 'Trash Bags', 'Gloves', 'Air Fresheners'],
  'Medical Supplies': ['First Aid', 'PPE', 'Medicines', 'Sanitizers', 'Diagnostic Equipment', 'Miscellaneous'],
  'Services': ['IT Services', 'Facility Management', 'Security Services', 'Consulting', 'Maintenance', 'Others'],
};

/** Flat list of category strings (for simple Select dropdowns). */
export const CATEGORY_LIST: string[] = [...PRODUCT_CATEGORIES];
