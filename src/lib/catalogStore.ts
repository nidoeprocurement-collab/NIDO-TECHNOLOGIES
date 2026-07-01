export interface CatalogSpec {
  id: string;
  specification: string;
  value: string;
  unit: string;
}

export interface GeneralSpec {
  id: string;
  category: string;
  attributeValue: string;
}

export interface CatalogProduct {
  id: string;
  masterProductCode: string;
  skuCode: string;
  productName: string;
  productType: string;
  physicalType: string;
  category: string;
  subcategory: string;
  brand: string;
  tags: string[];
  description: string;
  specifications: CatalogSpec[];
  generalSpecs: GeneralSpec[];
  productNotes: string;
  videoUrl: string;
  images: string[];
  publishStatus: 'draft' | 'published';
  price: number;
  moq: number;
  leadTime: string;
  warranty: string;
}

const STORE_KEY = 'nido_catalog_products';
const COUNTER_KEY = 'nido_mpc_counter';
const SEED_KEY = 'nido_catalog_seeded';

const SEED_PRODUCTS: CatalogProduct[] = [
  {
    id: 'seed-001', masterProductCode: 'MPC-2024-000001', skuCode: 'SKU-LAP-001',
    productName: 'Laptop 15" Business Pro', productType: 'Finished Good', physicalType: 'Non-Perishable',
    category: 'Electronics', subcategory: 'Computers', brand: 'TechCorp',
    tags: ['laptop', 'business', 'computer'], description: 'High-performance business laptop with 15" display, Intel Core i7, 16GB RAM, 512GB SSD.',
    specifications: [], generalSpecs: [], productNotes: '', videoUrl: '', images: [],
    publishStatus: 'published', price: 75000, moq: 5, leadTime: '7 days', warranty: '1 Year',
  },
  {
    id: 'seed-002', masterProductCode: 'MPC-2024-000002', skuCode: 'SKU-MON-001',
    productName: '27" 4K Monitor', productType: 'Finished Good', physicalType: 'Non-Perishable',
    category: 'Electronics', subcategory: 'Displays', brand: 'ViewMax',
    tags: ['monitor', '4k', 'display'], description: '27-inch 4K UHD monitor with IPS panel, 144Hz refresh rate and USB-C connectivity.',
    specifications: [], generalSpecs: [], productNotes: '', videoUrl: '', images: [],
    publishStatus: 'published', price: 32000, moq: 2, leadTime: '5 days', warranty: '2 Years',
  },
  {
    id: 'seed-003', masterProductCode: 'MPC-2024-000003', skuCode: 'SKU-KEY-001',
    productName: 'Mechanical Keyboard Wireless', productType: 'Finished Good', physicalType: 'Non-Perishable',
    category: 'Peripherals', subcategory: 'Input Devices', brand: 'KeyMaster',
    tags: ['keyboard', 'wireless', 'mechanical'], description: 'Full-size wireless mechanical keyboard with RGB backlight, blue switches and 2.4GHz connectivity.',
    specifications: [], generalSpecs: [], productNotes: '', videoUrl: '', images: [],
    publishStatus: 'published', price: 4500, moq: 10, leadTime: '3 days', warranty: '1 Year',
  },
  {
    id: 'seed-004', masterProductCode: 'MPC-2024-000004', skuCode: 'SKU-MOU-001',
    productName: 'Ergonomic Wireless Mouse', productType: 'Finished Good', physicalType: 'Non-Perishable',
    category: 'Peripherals', subcategory: 'Input Devices', brand: 'ErgoTech',
    tags: ['mouse', 'wireless', 'ergonomic'], description: 'Ergonomic wireless mouse with adjustable DPI up to 4000, silent clicks and long battery life.',
    specifications: [], generalSpecs: [], productNotes: '', videoUrl: '', images: [],
    publishStatus: 'published', price: 2200, moq: 10, leadTime: '2 days', warranty: '1 Year',
  },
  {
    id: 'seed-005', masterProductCode: 'MPC-2024-000005', skuCode: 'SKU-CAM-001',
    productName: 'HD Webcam 1080p', productType: 'Finished Good', physicalType: 'Non-Perishable',
    category: 'Electronics', subcategory: 'Cameras', brand: 'CamPro',
    tags: ['webcam', 'hd', 'video'], description: 'Full HD 1080p webcam with built-in microphone, autofocus and wide-angle lens for video conferencing.',
    specifications: [], generalSpecs: [], productNotes: '', videoUrl: '', images: [],
    publishStatus: 'published', price: 3800, moq: 5, leadTime: '3 days', warranty: '1 Year',
  },
  {
    id: 'seed-006', masterProductCode: 'MPC-2024-000006', skuCode: 'SKU-HDG-001',
    productName: 'USB-C Hub 7-in-1', productType: 'Finished Good', physicalType: 'Non-Perishable',
    category: 'Peripherals', subcategory: 'Connectivity', brand: 'HubLink',
    tags: ['usb-c', 'hub', 'adapter'], description: '7-in-1 USB-C hub with HDMI 4K, 3x USB-A 3.0, SD card reader, TF card reader and PD charging.',
    specifications: [], generalSpecs: [], productNotes: '', videoUrl: '', images: [],
    publishStatus: 'published', price: 1800, moq: 20, leadTime: '2 days', warranty: '1 Year',
  },
  {
    id: 'seed-007', masterProductCode: 'MPC-2024-000007', skuCode: 'SKU-HDH-001',
    productName: 'Noise Cancelling Headphones', productType: 'Finished Good', physicalType: 'Non-Perishable',
    category: 'Electronics', subcategory: 'Audio', brand: 'SoundElite',
    tags: ['headphones', 'anc', 'wireless'], description: 'Premium over-ear headphones with active noise cancellation, 30-hour battery, and foldable design.',
    specifications: [], generalSpecs: [], productNotes: '', videoUrl: '', images: [],
    publishStatus: 'published', price: 12000, moq: 5, leadTime: '4 days', warranty: '1 Year',
  },
  {
    id: 'seed-008', masterProductCode: 'MPC-2024-000008', skuCode: 'SKU-DSK-001',
    productName: 'Height Adjustable Desk', productType: 'Finished Good', physicalType: 'Non-Perishable',
    category: 'Furniture', subcategory: 'Desks', brand: 'ErgoFurniture',
    tags: ['desk', 'standing', 'adjustable'], description: 'Electric height-adjustable standing desk with memory presets, 120x60cm tabletop and steel frame.',
    specifications: [], generalSpecs: [], productNotes: '', videoUrl: '', images: [],
    publishStatus: 'published', price: 28000, moq: 1, leadTime: '14 days', warranty: '3 Years',
  },
  {
    id: 'seed-009', masterProductCode: 'MPC-2024-000009', skuCode: 'SKU-CHR-001',
    productName: 'Ergonomic Office Chair', productType: 'Finished Good', physicalType: 'Non-Perishable',
    category: 'Furniture', subcategory: 'Seating', brand: 'ComfortSeat',
    tags: ['chair', 'ergonomic', 'office'], description: 'Fully adjustable ergonomic office chair with lumbar support, mesh back and armrests.',
    specifications: [], generalSpecs: [], productNotes: '', videoUrl: '', images: [],
    publishStatus: 'published', price: 18500, moq: 2, leadTime: '10 days', warranty: '2 Years',
  },
  {
    id: 'seed-010', masterProductCode: 'MPC-2024-000010', skuCode: 'SKU-PRT-001',
    productName: 'Laser Printer A4 Color', productType: 'Finished Good', physicalType: 'Non-Perishable',
    category: 'Office Equipment', subcategory: 'Printers', brand: 'PrintMaster',
    tags: ['printer', 'laser', 'color'], description: 'A4 color laser printer with duplex printing, Wi-Fi, 22ppm color and 1200dpi resolution.',
    specifications: [], generalSpecs: [], productNotes: '', videoUrl: '', images: [],
    publishStatus: 'published', price: 22000, moq: 1, leadTime: '5 days', warranty: '1 Year',
  },
  {
    id: 'seed-011', masterProductCode: 'MPC-2024-000011', skuCode: 'SKU-SWT-001',
    productName: 'Network Switch 24-Port', productType: 'Finished Good', physicalType: 'Non-Perishable',
    category: 'Networking', subcategory: 'Switches', brand: 'NetCore',
    tags: ['switch', 'network', 'gigabit'], description: '24-port gigabit managed network switch with VLAN support, QoS and rack-mount kit included.',
    specifications: [], generalSpecs: [], productNotes: '', videoUrl: '', images: [],
    publishStatus: 'published', price: 15000, moq: 1, leadTime: '7 days', warranty: '2 Years',
  },
  {
    id: 'seed-012', masterProductCode: 'MPC-2024-000012', skuCode: 'SKU-UPS-001',
    productName: 'UPS 1500VA Online', productType: 'Finished Good', physicalType: 'Non-Perishable',
    category: 'Power', subcategory: 'UPS', brand: 'PowerGuard',
    tags: ['ups', 'power', 'battery'], description: 'Online double-conversion UPS 1500VA/1350W with pure sine wave output and LCD display.',
    specifications: [], generalSpecs: [], productNotes: '', videoUrl: '', images: [],
    publishStatus: 'published', price: 18000, moq: 1, leadTime: '5 days', warranty: '2 Years',
  },
  {
    id: 'seed-013', masterProductCode: 'MPC-2024-000013', skuCode: 'SKU-SRV-001',
    productName: 'Tower Server Xeon 32GB', productType: 'Finished Good', physicalType: 'Non-Perishable',
    category: 'Electronics', subcategory: 'Servers', brand: 'ServerPro',
    tags: ['server', 'xeon', 'tower'], description: 'Tower server with Intel Xeon E-2300 CPU, 32GB ECC RAM, 2TB HDD and RAID controller.',
    specifications: [], generalSpecs: [], productNotes: '', videoUrl: '', images: [],
    publishStatus: 'published', price: 185000, moq: 1, leadTime: '21 days', warranty: '3 Years',
  },
  {
    id: 'seed-014', masterProductCode: 'MPC-2024-000014', skuCode: 'SKU-PHN-001',
    productName: 'IP Desk Phone HD', productType: 'Finished Good', physicalType: 'Non-Perishable',
    category: 'Telecommunications', subcategory: 'Phones', brand: 'TeleLink',
    tags: ['phone', 'ip', 'voip'], description: 'HD voice IP desk phone with 2.4" color display, 6 SIP accounts and PoE support.',
    specifications: [], generalSpecs: [], productNotes: '', videoUrl: '', images: [],
    publishStatus: 'published', price: 6500, moq: 5, leadTime: '5 days', warranty: '1 Year',
  },
  {
    id: 'seed-015', masterProductCode: 'MPC-2024-000015', skuCode: 'SKU-SCN-001',
    productName: 'Flatbed Document Scanner A4', productType: 'Finished Good', physicalType: 'Non-Perishable',
    category: 'Office Equipment', subcategory: 'Scanners', brand: 'ScanMax',
    tags: ['scanner', 'document', 'a4'], description: 'A4 flatbed scanner with ADF for 50 sheets, 600dpi optical resolution and USB/Wi-Fi connectivity.',
    specifications: [], generalSpecs: [], productNotes: '', videoUrl: '', images: [],
    publishStatus: 'published', price: 9500, moq: 2, leadTime: '4 days', warranty: '1 Year',
  },
  {
    id: 'seed-016', masterProductCode: 'MPC-2024-000016', skuCode: 'SKU-PRJ-001',
    productName: 'Full HD Projector 3500 Lumens', productType: 'Finished Good', physicalType: 'Non-Perishable',
    category: 'Electronics', subcategory: 'Projectors', brand: 'LightPro',
    tags: ['projector', 'full hd', 'presentation'], description: 'Full HD 1080p business projector with 3500 lumens brightness, HDMI, VGA and wireless screen mirroring.',
    specifications: [], generalSpecs: [], productNotes: '', videoUrl: '', images: [],
    publishStatus: 'published', price: 38000, moq: 1, leadTime: '7 days', warranty: '2 Years',
  },
  {
    id: 'seed-017', masterProductCode: 'MPC-2024-000017', skuCode: 'SKU-WHB-001',
    productName: 'Interactive Whiteboard 75"', productType: 'Finished Good', physicalType: 'Non-Perishable',
    category: 'Office Equipment', subcategory: 'Displays', brand: 'SmartBoard',
    tags: ['whiteboard', 'interactive', 'display'], description: '75-inch 4K interactive whiteboard with built-in Android, multi-touch support and wireless screen sharing.',
    specifications: [], generalSpecs: [], productNotes: '', videoUrl: '', images: [],
    publishStatus: 'published', price: 155000, moq: 1, leadTime: '21 days', warranty: '3 Years',
  },
  {
    id: 'seed-018', masterProductCode: 'MPC-2024-000018', skuCode: 'SKU-TAB-001',
    productName: 'Android Tablet 10" Business', productType: 'Finished Good', physicalType: 'Non-Perishable',
    category: 'Electronics', subcategory: 'Tablets', brand: 'TabPro',
    tags: ['tablet', 'android', 'business'], description: '10-inch Android 13 tablet with 6GB RAM, 128GB storage, Octa-core processor and 5G support.',
    specifications: [], generalSpecs: [], productNotes: '', videoUrl: '', images: [],
    publishStatus: 'published', price: 22000, moq: 3, leadTime: '5 days', warranty: '1 Year',
  },
  {
    id: 'seed-019', masterProductCode: 'MPC-2024-000019', skuCode: 'SKU-EXT-001',
    productName: 'External SSD 1TB USB-C', productType: 'Finished Good', physicalType: 'Non-Perishable',
    category: 'Storage', subcategory: 'External Drives', brand: 'SwiftDrive',
    tags: ['ssd', 'external', 'storage'], description: 'Portable external SSD 1TB with USB-C 3.2 Gen2, read speed up to 1050MB/s and shock-resistant casing.',
    specifications: [], generalSpecs: [], productNotes: '', videoUrl: '', images: [],
    publishStatus: 'published', price: 8500, moq: 5, leadTime: '3 days', warranty: '3 Years',
  },
  {
    id: 'seed-020', masterProductCode: 'MPC-2024-000020', skuCode: 'SKU-RTR-001',
    productName: 'Wi-Fi 6 Router Enterprise', productType: 'Finished Good', physicalType: 'Non-Perishable',
    category: 'Networking', subcategory: 'Routers', brand: 'NetCore',
    tags: ['router', 'wifi6', 'enterprise'], description: 'Wi-Fi 6 (802.11ax) enterprise router with dual-band 6000Mbps, MU-MIMO and supports 200+ devices.',
    specifications: [], generalSpecs: [], productNotes: '', videoUrl: '', images: [],
    publishStatus: 'published', price: 12000, moq: 2, leadTime: '4 days', warranty: '2 Years',
  },
];

function seedCatalog(): void {
  if (localStorage.getItem(SEED_KEY)) return;
  const existing = (() => { try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); } catch { return []; } })();
  if (existing.length === 0) {
    localStorage.setItem(STORE_KEY, JSON.stringify(SEED_PRODUCTS));
    localStorage.setItem(COUNTER_KEY, String(SEED_PRODUCTS.length));
  }
  localStorage.setItem(SEED_KEY, '1');
}

seedCatalog();

export function getCatalogProducts(): CatalogProduct[] {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveCatalogProduct(product: CatalogProduct): void {
  const products = getCatalogProducts();
  const idx = products.findIndex(p => p.id === product.id);
  if (idx >= 0) {
    products[idx] = product;
  } else {
    products.push(product);
  }
  localStorage.setItem(STORE_KEY, JSON.stringify(products));
  window.dispatchEvent(new Event('catalogUpdated'));
}

export function deleteCatalogProduct(id: string): void {
  const products = getCatalogProducts().filter(p => p.id !== id);
  localStorage.setItem(STORE_KEY, JSON.stringify(products));
  window.dispatchEvent(new Event('catalogUpdated'));
}

export function generateMasterProductCode(): string {
  const year = new Date().getFullYear();
  const counter = parseInt(localStorage.getItem(COUNTER_KEY) || '0', 10) + 1;
  localStorage.setItem(COUNTER_KEY, String(counter));
  return `MPC-${year}-${String(counter).padStart(6, '0')}`;
}
