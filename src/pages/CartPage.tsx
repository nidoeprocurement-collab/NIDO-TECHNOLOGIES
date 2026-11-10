import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Minus, Plus, ChevronLeft, ChevronRight,
  ShoppingCart, Lock, X, Phone, Mail, MessageCircle,
  CheckCircle2, RotateCcw, Headphones, BadgeCheck,
  Star, Clock, Check, ChevronDown,
} from "lucide-react";
import { useCart, type CartItem } from "@/contexts/CartContext";
import { releaseVendorReservation, getAllVendorProducts } from "@/lib/vendorStore";
import { getVendors } from "@/lib/vendorDataStore";
import {
  getSlabDiscountPct,
  getClientCartPricingSettings,
  getAllProductPricing,
  getRecommendedVendor,
  computeVendorComparisons,
  type VendorStockAllocation,
} from "@/lib/priceEngineStore";
import { getClientCatalog, type ClientCatalogEntry } from "@/lib/clientCatalogStore";
import { getCatalogProducts, type CatalogProduct } from "@/lib/catalogStore";
import { getEffectiveTaxPctForCategory, getProductCategoryTaxMap, getHsnCodes } from "@/lib/taxEngine";
import { getCartTaxRate, getCartUnitPriceExclGst, getCartUnitPriceInclusive } from "@/lib/vendorCartPricing";
import { useOrgConfig } from "@/contexts/ConfigContext";
import { useI18n } from "@/i18n/I18nProvider";
import OrderSummaryPanel from "./OrderSummaryPanel";
import { formatCurrency } from "@/lib/formatters";
import {
  getProductType,
  isDigitalOnlyType,
  isHybridType,
} from "@/lib/productTypeRules";
import {
  getProductConfigurationEntries,
  getProductSpecLines,
  formatConfigurationLabel,
} from "@/lib/productConfiguration";
import { toast } from "sonner";

function formatPrice(n: number) {
  return formatCurrency(n);
}

function getCartProductType(item: Pick<CartItem, "physicalType" | "productType" | "fulfillmentType">): string {
  return getProductType(
    item.physicalType
    || item.productType
    || (
      item.fulfillmentType === "digital"
        ? "Digital License"
        : item.fulfillmentType === "hybrid"
          ? "Hybrid Product"
          : "Physical Product"
    ),
  );
}

/** Determine the section group for a cart item (e.g. DIGITAL LICENSES, CLOUD CONSUMPTION) */
function getCartItemGroupKey(item: CartItem): string {
  const type = getCartProductType(item).toLowerCase();
  const cat = (item.category || "").toLowerCase();
  const name = item.name.toLowerCase();

  if (type.includes("cloud") || cat.includes("cloud") || name.includes("cloud") || name.includes("azure")) {
    return "CLOUD CONSUMPTION";
  }
  if (isDigitalOnlyType(getCartProductType(item))) {
    if (type.includes("subscription") || cat.includes("subscription")) {
      return "DIGITAL LICENSES";
    }
    return "DIGITAL LICENSES";
  }
  return "PHYSICAL PRODUCTS";
}

/** Initial badge text and styling for product avatar matching design */
function getProductBadgeInfo(name: string, image?: string): { text: string; bg: string; image?: string } {
  const lower = name.toLowerCase();
  if (lower.includes("365") || lower.includes("office") || lower.includes("microsoft 365")) {
    return { text: "M3", bg: "bg-[#0067b8]", image };
  }
  if (lower.includes("aws") || lower.includes("amazon")) {
    return { text: "AW", bg: "bg-[#b85226]", image };
  }
  if (lower.includes("adobe") || lower.includes("acrobat")) {
    return { text: "Ac", bg: "bg-[#b31412]", image };
  }
  if (lower.includes("azure")) {
    return { text: "Az", bg: "bg-[#0078d4]", image };
  }
  if (lower.includes("google")) {
    return { text: "GW", bg: "bg-[#0f9d58]", image };
  }
  if (lower.includes("zoom")) {
    return { text: "Zm", bg: "bg-[#2d8cff]", image };
  }

  const words = name.trim().split(/\s+/);
  const text = words.length >= 2 ? (words[0][0] + words[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
  return { text, bg: "bg-blue-600", image };
}

interface VariationOption {
  label: string;
  priceAdjustment: number;
}

interface ConfigurableField {
  label: string;
  options: VariationOption[];
}

/** Determine configurable options for a cart item based on real product variations / configuration */
function getConfigurableFieldsForItem(
  item: CartItem,
  catalogMap: Map<string, CatalogProduct>,
): ConfigurableField[] {
  // 1. Check if vendor product has variations in vendorStore
  const allVendors = getAllVendorProducts();
  const vendorProducts = item.selectedVendorId ? allVendors[item.selectedVendorId] || [] : [];
  const vp = vendorProducts.find(
    (p) => p.masterProductCode === item.productCode || p.id === item.vendorProductCode
  );
  if (vp?.variations && vp.variations.length > 0) {
    return vp.variations.map((v) => ({
      label: v.name,
      options: v.options.map((o) => ({
        label: o.label.trim(),
        priceAdjustment: Number(o.priceAdjustment) || 0,
      })),
    }));
  }

  // 2. Check catalog products
  const cp = catalogMap.get(item.productCode || "");
  if (cp?.variations && cp.variations.length > 0) {
    return cp.variations.map((v) => ({
      label: v.name,
      options: v.options.map((o) => ({
        label: o.label.trim(),
        priceAdjustment: Number(o.priceAdjustment) || 0,
      })),
    }));
  }

  // 3. Check client catalog
  const clientCatalog = getClientCatalog(item.clientId || "");
  const ccp = clientCatalog.find((p) => p.productCode === item.productCode);
  if (ccp?.variations && ccp.variations.length > 0) {
    return ccp.variations.map((v) => ({
      label: v.name,
      options: v.options.map((o) => ({
        label: o.label.trim(),
        priceAdjustment: Number(o.priceAdjustment) || 0,
      })),
    }));
  }

  // 4. If item already has a structured configuration, provide options for those exact keys
  const configKeys = Object.keys(item.configuration || {});
  if (configKeys.length > 0) {
    return configKeys.map((key) => {
      const curVal = item.configuration?.[key] || "";
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes("user")) {
        const defaultOpts = [
          { label: "1 User", priceAdjustment: 5999 },
          { label: "2 Users", priceAdjustment: 9999 },
          { label: "5 Users", priceAdjustment: 19999 },
          { label: "10 Users", priceAdjustment: 34999 },
        ];
        const hasCurrent = defaultOpts.some((o) => o.label.toLowerCase() === curVal.toLowerCase());
        const options = hasCurrent ? defaultOpts : [{ label: curVal, priceAdjustment: 0 }, ...defaultOpts];
        return { label: key, options };
      }
      if (lowerKey.includes("ram") || lowerKey.includes("memory")) {
        const defaultOpts = [
          { label: "2 GB", priceAdjustment: 599 },
          { label: "4 GB", priceAdjustment: 1199 },
          { label: "8 GB", priceAdjustment: 2399 },
          { label: "16 GB", priceAdjustment: 4799 },
        ];
        const hasCurrent = defaultOpts.some((o) => o.label.toLowerCase() === curVal.toLowerCase());
        const options = hasCurrent ? defaultOpts : [{ label: curVal, priceAdjustment: 0 }, ...defaultOpts];
        return { label: key, options };
      }
      if (lowerKey.includes("storage") || lowerKey.includes("disk")) {
        const defaultOpts = [
          { label: "20 GB", priceAdjustment: 1999 },
          { label: "50 GB", priceAdjustment: 3999 },
          { label: "100 GB", priceAdjustment: 6999 },
          { label: "250 GB", priceAdjustment: 14999 },
        ];
        const hasCurrent = defaultOpts.some((o) => o.label.toLowerCase() === curVal.toLowerCase());
        const options = hasCurrent ? defaultOpts : [{ label: curVal, priceAdjustment: 0 }, ...defaultOpts];
        return { label: key, options };
      }
      if (lowerKey.includes("license") || lowerKey.includes("tier") || lowerKey.includes("plan")) {
        const defaultLabels = ["Subscription - 1 Year", "Subscription - 2 Years", "Subscription - 3 Years"];
        const labels = Array.from(new Set([curVal, ...defaultLabels])).filter(Boolean);
        return {
          label: key,
          options: labels.map((lbl, idx) => ({
            label: lbl,
            priceAdjustment: idx === 0 ? 0 : idx === 1 ? -500 : -1200,
          })),
        };
      }
      if (lowerKey.includes("metric")) {
        const defaultLabels = ["Per User", "Per Device", "Per Consumption"];
        const labels = Array.from(new Set([curVal, ...defaultLabels])).filter(Boolean);
        return {
          label: key,
          options: labels.map((lbl) => ({ label: lbl, priceAdjustment: 0 })),
        };
      }
      if (lowerKey.includes("delivery") || lowerKey.includes("provisioning")) {
        const defaultLabels = ["Digital", "Instant - Digital", "Managed Setup"];
        const labels = Array.from(new Set([curVal, ...defaultLabels])).filter(Boolean);
        return {
          label: key,
          options: labels.map((lbl) => ({ label: lbl, priceAdjustment: 0 })),
        };
      }
      if (lowerKey.includes("billing")) {
        const defaultLabels = ["Pay-As-You-Go", "1-Year Reserved", "3-Year Reserved"];
        const labels = Array.from(new Set([curVal, ...defaultLabels])).filter(Boolean);
        return {
          label: key,
          options: labels.map((lbl, idx) => ({
            label: lbl,
            priceAdjustment: idx === 0 ? 0 : idx === 1 ? -1000 : -2500,
          })),
        };
      }
      if (lowerKey.includes("commitment")) {
        const defaultLabels = ["₹10,000 min", "₹25,000 min", "₹50,000 min"];
        const labels = Array.from(new Set([curVal, ...defaultLabels])).filter(Boolean);
        return {
          label: key,
          options: labels.map((lbl, idx) => ({
            label: lbl,
            priceAdjustment: idx === 0 ? 0 : idx * 5000,
          })),
        };
      }
      const defaultLabels = [curVal, "Standard", "Advanced", "Enterprise"].filter(Boolean);
      const labels = Array.from(new Set(defaultLabels));
      return {
        label: key,
        options: labels.map((lbl, idx) => ({
          label: lbl,
          priceAdjustment: idx === 0 ? 0 : idx * 1000,
        })),
      };
    });
  }

  // 5. Contextual variation fields for digital / cloud products
  const nameLower = item.name.toLowerCase();
  const typeLower = (item.productType || "").toLowerCase();

  if (nameLower.includes("aws") || nameLower.includes("cloud") || typeLower.includes("cloud")) {
    return [
      {
        label: "User",
        options: [
          { label: "1 User", priceAdjustment: 5999 },
          { label: "2 Users", priceAdjustment: 9999 },
          { label: "5 Users", priceAdjustment: 19999 },
          { label: "10 Users", priceAdjustment: 34999 },
        ],
      },
      {
        label: "RAM",
        options: [
          { label: "2 GB", priceAdjustment: 599 },
          { label: "4 GB", priceAdjustment: 1199 },
          { label: "8 GB", priceAdjustment: 2399 },
          { label: "16 GB", priceAdjustment: 4799 },
        ],
      },
      {
        label: "Storage",
        options: [
          { label: "20 GB", priceAdjustment: 1999 },
          { label: "50 GB", priceAdjustment: 3999 },
          { label: "100 GB", priceAdjustment: 6999 },
          { label: "250 GB", priceAdjustment: 14999 },
        ],
      },
    ];
  }

  if (nameLower.includes("365") || nameLower.includes("office") || nameLower.includes("adobe") || nameLower.includes("license") || typeLower.includes("digital")) {
    return [
      {
        label: "License",
        options: [
          { label: "Subscription - 1 Year", priceAdjustment: 0 },
          { label: "Subscription - 2 Years", priceAdjustment: -500 },
          { label: "Subscription - 3 Years", priceAdjustment: -1200 },
        ],
      },
      {
        label: "Metric",
        options: [
          { label: "Per User", priceAdjustment: 0 },
          { label: "Per Device", priceAdjustment: 0 },
        ],
      },
      {
        label: "Users",
        options: [
          { label: "1 User", priceAdjustment: 0 },
          { label: "5 Users", priceAdjustment: 4999 },
          { label: "10 Users", priceAdjustment: 9499 },
          { label: "25 Users", priceAdjustment: 21999 },
        ],
      },
      {
        label: "Delivery",
        options: [
          { label: "Digital", priceAdjustment: 0 },
          { label: "Instant - Digital", priceAdjustment: 0 },
        ],
      },
    ];
  }

  return [];
}

/** Suggested items carousel card */
function SuggestedCard({
  product, clientId, productBasePath,
}: {
  product: ClientCatalogEntry;
  clientId?: string;
  productBasePath: string;
}) {
  const navigate = useNavigate();
  const image = product.img ?? "";
  const priceNum = product.priceNum ?? parseFloat(product.price) ?? 0;

  return (
    <div className="min-w-[190px] max-w-[190px] border border-gray-200 rounded-xl bg-white overflow-hidden flex flex-col">
      {image ? (
        <img src={image} alt={product.name} className="w-full h-28 object-cover bg-gray-100" />
      ) : (
        <div className="w-full h-28 bg-gray-100 flex items-center justify-center text-gray-300">
          <ShoppingCart size={28} />
        </div>
      )}
      <div className="p-3 flex flex-col flex-1">
        <p className="text-xs text-gray-400 mb-0.5">{product.category}</p>
        <p className="text-xs font-semibold text-gray-800 mb-1 line-clamp-2 leading-snug">{product.name}</p>
        <p className="text-sm font-bold text-gray-900 mb-2">
          {formatPrice(priceNum)}
          {priceNum > 0 && <span className="text-[11px] font-normal text-gray-500"> / each</span>}
        </p>
        <button
          onClick={() => navigate(`${productBasePath}/${product.productCode}`, { state: { product: { id: product.productCode, productCode: product.productCode, name: product.name, category: product.category, image: product.img || "", specs: product.specs || [], leadTime: product.leadTime || "", moq: product.moq ?? 1, priceNum, inStock: (product as any).totalStock !== 0 }, clientId } })}
          className="mt-auto flex items-center justify-center gap-1 text-xs font-semibold rounded-lg py-1.5 transition-colors bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
        >
          <ShoppingCart size={12} />
          View &amp; Select Vendor →
        </button>
      </div>
    </div>
  );
}

/** Vendor switch modal */
function VendorSwitchModal({
  item,
  onClose,
  onSelectVendor,
}: {
  item: CartItem;
  onClose: () => void;
  onSelectVendor: (vendor: { id: string; name: string; price: number }) => void;
}) {
  const comps = computeVendorComparisons(item.productCode || "", item.category);

  const liveActiveVendors = getVendors()
    .filter((v) => !v.archived && v.status !== "Inactive")
    .map((v) => ({
      vendorId: v.id,
      vendorName: v.name,
      basePrice: item.vendorPrice || item.priceNum,
      rating: v.rating || 0,
      leadTime: 3,
    }));

  const vendorsList = comps.length > 0 ? comps : liveActiveVendors;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 border border-gray-100">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">Change Vendor</h3>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{item.name}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {vendorsList.length === 0 ? (
            <div className="py-8 px-4 text-center text-xs text-gray-500 border border-dashed border-gray-200 rounded-xl">
              No active vendors available. Onboard a vendor in Vendor Management to assign here.
            </div>
          ) : vendorsList.map((v) => {
            const isSelected = item.selectedVendorId === v.vendorId || item.selectedVendorName === v.vendorName;
            return (
              <div
                key={v.vendorId}
                className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${isSelected ? "border-blue-500 bg-blue-50/50" : "border-gray-200 hover:border-gray-300"
                  }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-gray-900">{v.vendorName}</span>
                    <span className="flex items-center text-[10px] font-medium text-amber-600">
                      <Star size={11} className="fill-amber-400 text-amber-400 mr-0.5" />
                      {v.rating || 4.8}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> {v.leadTime} days delivery
                    </span>
                    <span className="font-semibold text-gray-800">{formatPrice(v.basePrice)}</span>
                  </div>
                </div>

                {isSelected ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full">
                    <Check size={12} /> Selected
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectVendor({ id: v.vendorId, name: v.vendorName, price: v.basePrice });
                      onClose();
                    }}
                    className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Select
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  useI18n();
  const {
    items: cart,
    updateQuantity: onUpdateQuantity,
    updateItem,
    removeItem: onRemove,
    addItem,
  } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const isPortalFlow = location.pathname.startsWith("/portal/");
  const catalogPath = isPortalFlow ? "/portal/catalog" : "/shop";
  const productPath = isPortalFlow ? "/portal/shop/product" : "/shop/product";
  const checkoutPath = isPortalFlow ? "/portal/shop/checkout" : "/shop/checkout";
  const [scrollIdx, setScrollIdx] = useState(0);

  // Editing state for item configuration
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [draftConfig, setDraftConfig] = useState<Record<string, string>>({});

  // Vendor switch modal state
  const [vendorModalItem, setVendorModalItem] = useState<CartItem | null>(null);

  // Catalog cache
  const catalogMap = useMemo(() => {
    const map = new Map<string, CatalogProduct>();
    getCatalogProducts().forEach((p) => {
      map.set(p.masterProductCode || p.skuCode || "", p);
    });
    return map;
  }, []);

  // Vendor pricing match cache
  const [vendorMatchMap, setVendorMatchMap] = useState<Map<string, any>>(() => new Map());
  useEffect(() => {
    const buildMap = () => {
      const map = new Map<string, any>();
      getAllProductPricing().forEach((p) => {
        map.set(p.masterProductCode, {
          recommendedVendorId: getRecommendedVendor(p.vendorComparisons)?.vendorId,
        });
      });
      return map;
    };
    setVendorMatchMap(buildMap());
  }, []);

  // Suggested products
  const enrich = (entries: ClientCatalogEntry[]): ClientCatalogEntry[] =>
    entries.map((e) => {
      const moq = e.moq && e.moq > 0 ? e.moq : 1;
      const leadTime = e.leadTime || "2 Days";
      return { ...e, moq, leadTime, totalStock: 50 };
    });

  const [suggested, setSuggested] = useState<ClientCatalogEntry[]>([]);
  useEffect(() => {
    const clientId = cart.find((i) => i.clientId)?.clientId;
    if (clientId) {
      const all = getClientCatalog(clientId);
      const cartCodes = new Set(cart.map((i) => i.productCode).filter(Boolean));
      const notInCart = all.filter((p) => !cartCodes.has(p.productCode));
      setSuggested(enrich(notInCart.slice(0, 6)));
    }
  }, [cart]);

  const visibleCount = 4;
  const maxScroll = Math.max(0, suggested.length - visibleCount);

  // Group cart items as shown in the screenshot
  const groupedCart = useMemo(() => {
    const groups: Record<string, CartItem[]> = {};
    cart.forEach((item) => {
      const key = getCartItemGroupKey(item);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }, [cart]);

  const groupOrder = ["DIGITAL LICENSES", "CLOUD CONSUMPTION", "SUBSCRIPTIONS", "PHYSICAL PRODUCTS"];

  // Active editable item configuration details
  const activeEditingItem = useMemo(() => {
    if (editingItemId === null) return null;
    return cart.find((i) => i.id === editingItemId) || null;
  }, [cart, editingItemId]);

  const activeConfigurableFields = useMemo(() => {
    if (!activeEditingItem) return [];
    return getConfigurableFieldsForItem(activeEditingItem, catalogMap);
  }, [activeEditingItem, catalogMap]);

  // Start editing an item
  const handleStartEditing = (item: CartItem) => {
    const fields = getConfigurableFieldsForItem(item, catalogMap);
    if (fields.length === 0) return;
    setEditingItemId(item.id);
    const initialConfig: Record<string, string> = {};
    const itemConfig = item.configuration || {};
    fields.forEach((field) => {
      const exactVal = itemConfig[field.label];
      if (exactVal !== undefined) {
        initialConfig[field.label] = exactVal;
      } else {
        const foundKey = Object.keys(itemConfig).find(
          (k) => k.trim().toLowerCase() === field.label.trim().toLowerCase()
        );
        initialConfig[field.label] = foundKey ? itemConfig[foundKey] : (field.options[0]?.label || "");
      }
    });
    setDraftConfig(initialConfig);
  };

  // Cancel editing
  const handleCancelConfig = () => {
    setEditingItemId(null);
    setDraftConfig({});
  };

  // Save updated configuration
  const handleSaveConfig = (item: CartItem) => {
    const fields = activeConfigurableFields;
    let totalAdjustment = 0;
    fields.forEach((field) => {
      const selectedLabel = draftConfig[field.label] || field.options[0]?.label;
      const opt = field.options.find((o) => o.label === selectedLabel);
      if (opt) totalAdjustment += opt.priceAdjustment;
    });

    const oldAdjustment = item.configurationPriceAdjustment || 0;
    const baseVendor = Math.max(0, (item.vendorPrice || item.priceNum) - oldAdjustment);
    const newUnitPrice = baseVendor > 0 ? baseVendor + totalAdjustment : totalAdjustment;

    updateItem(item.id, {
      configuration: draftConfig,
      configurationPriceAdjustment: totalAdjustment,
      clientSellingPriceExclGst: newUnitPrice,
      priceNum: newUnitPrice,
      vendorPrice: newUnitPrice,
    });

    setEditingItemId(null);
    toast.success("Configuration updated successfully");
  };

  // Change vendor for item
  const handleVendorChanged = (vendor: { id: string; name: string; price: number }) => {
    if (!vendorModalItem) return;
    updateItem(vendorModalItem.id, {
      selectedVendorId: vendor.id,
      selectedVendorName: vendor.name,
      vendorPrice: vendor.price,
      clientSellingPriceExclGst: vendor.price,
      priceNum: vendor.price,
    });
    toast.success(`Vendor changed to ${vendor.name}`);
    setVendorModalItem(null);
  };

  // Load sample items matching screenshot if cart is empty
  const handleLoadSampleItems = () => {
    const activeVendors = getVendors().filter((v) => !v.archived && v.status !== "Inactive");
    const v0 = activeVendors[0];
    const v1 = activeVendors[1] ?? v0;
    const v2 = activeVendors[2] ?? v0;
    const sampleItems = [
      {
        id: Date.now() + 1,
        name: "Microsoft 365 Business Standard",
        productCode: "LIC-M365-BS",
        category: "Software & Licenses",
        image: "",
        specs: [],
        moq: 1,
        totalStock: 999,
        priceNum: 15300,
        quantity: 1,
        productType: "Digital License",
        physicalType: "Digital License",
        fulfillmentType: "digital" as const,
        selectedVendorId: v0?.id || "",
        selectedVendorName: v0?.name || "Unassigned Vendor",
        vendorPrice: 15300,
        clientSellingPriceExclGst: 15300,
        configuration: {
          "License": "Subscription - 1 Year",
          "Metric": "Per User",
          "Users": "1 User",
          "Delivery": "Digital",
        },
        configurationPriceAdjustment: 0,
      },
      {
        id: Date.now() + 2,
        name: "AWS Activate Business Support",
        productCode: "SUB-AWS-ACT",
        category: "Cloud Services",
        image: "",
        specs: [],
        moq: 1,
        totalStock: 999,
        priceNum: 8940.88,
        quantity: 1,
        productType: "Cloud Service",
        physicalType: "Cloud Service",
        fulfillmentType: "digital" as const,
        selectedVendorId: v0?.id || "",
        selectedVendorName: v0?.name || "Unassigned Vendor",
        vendorPrice: 8940.88,
        clientSellingPriceExclGst: 8940.88,
        configuration: {
          "User": "1 User",
          "RAM": "2 GB",
          "Storage": "20 GB",
        },
        configurationPriceAdjustment: 8597,
      },
      {
        id: Date.now() + 3,
        name: "Adobe Acrobat Pro DC",
        productCode: "LIC-ACR-PRO",
        category: "Software & Licenses",
        image: "",
        specs: [],
        moq: 1,
        totalStock: 999,
        priceNum: 3118.96,
        quantity: 1,
        productType: "Digital License",
        physicalType: "Digital License",
        fulfillmentType: "digital" as const,
        selectedVendorId: v1?.id || "",
        selectedVendorName: v1?.name || "Unassigned Vendor",
        vendorPrice: 3118.96,
        clientSellingPriceExclGst: 3118.96,
        configuration: {
          "License": "Subscription - 1 Year",
          "Metric": "Per User",
          "Users": "1 User",
          "Delivery": "Digital",
        },
        configurationPriceAdjustment: 0,
      },
      {
        id: Date.now() + 4,
        name: "Microsoft Azure Cloud Credits",
        productCode: "AZURE-CRED",
        category: "Cloud Services",
        image: "",
        specs: [],
        moq: 1,
        totalStock: 999,
        priceNum: 20337.20,
        quantity: 1,
        productType: "Cloud Service",
        physicalType: "Cloud Service",
        fulfillmentType: "digital" as const,
        selectedVendorId: v2?.id || "",
        selectedVendorName: v2?.name || "Unassigned Vendor",
        vendorPrice: 20337.20,
        clientSellingPriceExclGst: 20337.20,
        configuration: {
          "Billing": "Pay-As-You-Go",
          "Metric": "Per Consumption",
          "Commitment": "₹10,000 min",
          "Provisioning": "Instant - Digital",
        },
        configurationPriceAdjustment: 0,
      },
    ];

    sampleItems.forEach((item) => addItem(item, 1));
    toast.success("Sample items loaded into cart");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Breadcrumb Bar ─────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <p className="text-sm text-gray-500">Review your items before checkout</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-0 min-h-[calc(100vh-49px)]">
        {/* ── Left Column: Products List + Badges + Suggestions ─────── */}
        <div className="flex-1 min-w-0 p-4 sm:p-6 space-y-6">
          {/* Page Title */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Cart</h1>
            <p className="text-xs text-gray-500 mt-1">
              {cart.length} item{cart.length !== 1 ? "s" : ""} · review configurations and pricing before checkout
            </p>
          </div>

          {/* Cart Items List */}
          {cart.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl py-16 px-4 text-center">
              <ShoppingCart size={44} className="mx-auto mb-3 text-gray-300" />
              <p className="font-semibold text-base text-gray-800">Your cart is empty</p>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Explore our digital licenses, cloud services, and hardware products to get started.
              </p>
              <div className="flex items-center justify-center gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => navigate(catalogPath)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Continue shopping →
                </button>
                <button
                  type="button"
                  onClick={handleLoadSampleItems}
                  className="px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
                >
                  Preview sample cart
                </button>
              </div>
            </div>
          ) : (
            <div>
              {groupOrder.map((groupKey) => {
                const groupItems = groupedCart[groupKey];
                if (!groupItems || groupItems.length === 0) return null;

                return (
                  <div key={groupKey} className="mb-6 last:mb-0">
                    {/* Section Header */}
                    <div className="flex items-center gap-2 mb-3">
                      <h2 className="text-xs font-bold tracking-wider text-gray-600 uppercase">
                        {groupKey}
                      </h2>
                      <span className="text-[11px] font-bold text-gray-600 bg-gray-200/80 px-2 py-0.5 rounded-full">
                        {groupItems.length}
                      </span>
                    </div>

                    {/* Cards in this group */}
                    <div className="space-y-3.5">
                      {groupItems.map((item) => {
                        const isEditing = editingItemId === item.id;
                        const productType = getCartProductType(item);
                        const isDigital = isDigitalOnlyType(productType);
                        const taxRate = getCartTaxRate(item) ?? getEffectiveTaxPctForCategory(item.category || "");
                        const itemMoq = item.moq > 0 ? item.moq : 1;

                        // Dynamic recalculation when editing
                        let calculatedUnit = item.clientSellingPriceExclGst || item.priceNum;
                        let formulaBreakdown: { label: string; amount: number }[] = [];

                        if (isEditing && activeConfigurableFields.length > 0) {
                          let totalDraftAdj = 0;
                          formulaBreakdown = activeConfigurableFields.map((field) => {
                            const selectedLabel = draftConfig[field.label] || field.options[0]?.label;
                            const opt = field.options.find((o) => o.label === selectedLabel);
                            const adj = opt?.priceAdjustment || 0;
                            totalDraftAdj += adj;
                            return { label: field.label, amount: adj };
                          });

                          const oldAdj = item.configurationPriceAdjustment || 0;
                          const base = Math.max(0, (item.vendorPrice || item.priceNum) - oldAdj);
                          calculatedUnit = base > 0 ? base + totalDraftAdj : totalDraftAdj;
                        }

                        const inclusiveTotal = calculatedUnit * item.quantity * (1 + taxRate / 100);
                        const gstAmount = inclusiveTotal - calculatedUnit * item.quantity;
                        const badgeInfo = getProductBadgeInfo(item.name, item.image);

                        // Actual configuration & specifications — NO mock data
                        const configEntries = getProductConfigurationEntries(item.configuration);
                        const specLines = configEntries.length === 0 ? getProductSpecLines(item.specs, item.configuration) : [];
                        const itemConfigurableFields = getConfigurableFieldsForItem(item, catalogMap);
                        const canEditConfig = itemConfigurableFields.length > 0;

                        return (
                          <div
                            key={item.id}
                            className={`bg-white rounded-2xl transition-all shadow-sm p-4 sm:p-5 ${isEditing
                                ? "border-2 border-blue-400 ring-2 ring-blue-50/50"
                                : "border border-gray-200 hover:border-gray-300"
                              }`}
                          >
                            {/* Card Top Row */}
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                              {/* Left: Thumbnail & Details */}
                              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                                {/* Thumbnail / Avatar */}
                                {badgeInfo.image ? (
                                  <img
                                    src={badgeInfo.image}
                                    alt={item.name}
                                    className="w-12 h-12 rounded-xl object-contain bg-slate-50 border border-gray-200 p-1 shrink-0"
                                  />
                                ) : (
                                  <div
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-base shrink-0 shadow-sm ${badgeInfo.bg}`}
                                  >
                                    {badgeInfo.text}
                                  </div>
                                )}

                                {/* Product Info */}
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-snug truncate">
                                    {item.name}
                                  </h3>

                                  {/* Badges & SKU */}
                                  <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${groupKey === "CLOUD CONSUMPTION"
                                          ? "bg-sky-50 text-sky-700 border border-sky-100"
                                          : isDigital
                                            ? "bg-violet-50 text-violet-700 border border-violet-100"
                                            : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                        }`}
                                    >
                                      {productType}
                                    </span>
                                    <span className="text-xs text-gray-500 font-medium truncate">
                                      SKU {item.productCode || item.vendorProductCode || "SKU"} · {item.category || productType}
                                    </span>
                                  </div>

                                  {/* Vendor line with Change button */}
                                  <p className="text-xs text-gray-500 mt-1">
                                    Vendor:{" "}
                                    <span className="font-medium text-gray-700">
                                      {item.selectedVendorName || "Preferred Vendor"}
                                    </span>
                                    {" · "}
                                    <button
                                      type="button"
                                      onClick={() => setVendorModalItem(item)}
                                      className="text-blue-600 hover:underline font-semibold"
                                    >
                                      Change
                                    </button>
                                  </p>
                                </div>
                              </div>

                              {/* Middle: Stepper Counter */}
                              <div className="flex flex-col items-center shrink-0 self-start sm:self-auto">
                                <div className="flex items-center rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
                                  <button
                                    type="button"
                                    onClick={() => onUpdateQuantity(item.id, Math.max(itemMoq, item.quantity - 1))}
                                    className="px-2.5 py-1 text-gray-500 hover:bg-gray-100 font-semibold transition-colors"
                                  >
                                    −
                                  </button>
                                  <span className="min-w-8 text-center text-xs font-semibold text-gray-800">
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                    className="px-2.5 py-1 text-gray-500 hover:bg-gray-100 font-semibold transition-colors"
                                  >
                                    +
                                  </button>
                                </div>
                                <p className="text-[11px] text-gray-400 text-center mt-1">
                                  Min. order {itemMoq}
                                </p>
                              </div>

                              {/* Right: Pricing Display */}
                              <div className="text-right shrink-0">
                                <div className="text-sm font-bold text-gray-900">
                                  {formatPrice(calculatedUnit)}
                                </div>
                                <div className="text-base sm:text-lg font-bold text-gray-900 mt-0.5">
                                  {formatPrice(inclusiveTotal)}
                                </div>
                                <div className="text-[11px] text-gray-500 leading-tight mt-0.5">
                                  <span>incl. GST {taxRate}%</span>
                                  <span className="block text-gray-400">({formatPrice(gstAmount)})</span>
                                </div>
                              </div>
                            </div>

                            {/* Card Bottom: Normal State Badges OR Inline Configuration (editing) Panel */}
                            {isEditing ? (
                              /* ── Configuration (editing) Panel ───────── */
                              <div className="border-t border-gray-100 pt-4 mt-4 animate-in fade-in duration-150">
                                <h4 className="text-xs font-bold text-gray-900 mb-3">
                                  Configuration (editing)
                                </h4>

                                {/* Dropdowns Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                                  {activeConfigurableFields.map((field) => (
                                    <div key={field.label} className="min-w-0">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-medium text-gray-700 truncate">
                                          {field.label}
                                        </span>
                                        <span className="text-[10px] text-gray-400 shrink-0">
                                          + price
                                        </span>
                                      </div>
                                      <select
                                        value={draftConfig[field.label] ?? field.options[0]?.label}
                                        onChange={(e) =>
                                          setDraftConfig((prev) => ({
                                            ...prev,
                                            [field.label]: e.target.value,
                                          }))
                                        }
                                        className="w-full text-xs border border-gray-300 rounded-lg px-2.5 py-2 bg-white text-gray-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                      >
                                        {field.options.map((opt) => (
                                          <option key={opt.label} value={opt.label}>
                                            {opt.label}
                                            {opt.priceAdjustment > 0
                                              ? ` (+${formatCurrency(opt.priceAdjustment)})`
                                              : opt.priceAdjustment < 0
                                                ? ` (${formatCurrency(opt.priceAdjustment)})`
                                                : ""}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  ))}
                                </div>

                                {/* Calculation formula breakdown */}
                                {formulaBreakdown.length > 0 && (
                                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-2 mb-2">
                                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-600">
                                      {formulaBreakdown.map((part, pIdx) => (
                                        <React.Fragment key={part.label}>
                                          <span className="bg-white border border-gray-200 rounded px-2 py-0.5 text-xs font-medium text-gray-800 shadow-2xs">
                                            {part.label} {formatPrice(part.amount)}
                                          </span>
                                          {pIdx < formulaBreakdown.length - 1 && (
                                            <span className="text-gray-400 font-bold">+</span>
                                          )}
                                        </React.Fragment>
                                      ))}
                                      <span className="text-gray-400 font-bold">=</span>
                                    </div>
                                    <div className="text-sm font-bold text-gray-900">
                                      {formatPrice(calculatedUnit)} / unit
                                    </div>
                                  </div>
                                )}

                                <p className="text-[11px] text-gray-500 mb-3.5">
                                  Changing an option re-prices this line instantly. The same product with a different configuration is kept as a separate cart line.
                                </p>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleSaveConfig(item)}
                                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                                  >
                                    Save configuration
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleCancelConfig}
                                    className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* ── Normal State Configuration & Specifications (NO Mock Data) ── */
                              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3 mt-3">
                                {/* Actual Configuration / Specification Badges */}
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {configEntries.length > 0 ? (
                                    configEntries.map(([label, value]) => {
                                      const isRedundant = value.toLowerCase().startsWith(label.toLowerCase() + " ");
                                      return (
                                        <span
                                          key={label}
                                          className="bg-gray-50 border border-gray-200/80 rounded-md px-2.5 py-1 text-[11px] font-medium text-gray-700"
                                        >
                                          {!isRedundant && <span className="text-gray-500 font-normal">{label}: </span>}
                                          <span className="text-gray-900 font-semibold">{value}</span>
                                        </span>
                                      );
                                    })
                                  ) : specLines.length > 0 ? (
                                    specLines.map((line, idx) => {
                                      const colonIdx = line.indexOf(":");
                                      const sLabel = colonIdx > -1 ? line.slice(0, colonIdx).trim() : "";
                                      const sVal = colonIdx > -1 ? line.slice(colonIdx + 1).trim() : line;
                                      return (
                                        <span
                                          key={idx}
                                          className="bg-gray-50 border border-gray-200/80 rounded-md px-2.5 py-1 text-[11px] font-medium text-gray-700"
                                        >
                                          {sLabel && <span className="text-gray-500 font-normal">{sLabel}: </span>}
                                          <span className="text-gray-900 font-semibold">{sVal}</span>
                                        </span>
                                      );
                                    })
                                  ) : null}

                                  {/* Lead Time badge if available on item */}
                                  {item.leadTime && (
                                    <span className="bg-gray-50 border border-gray-200/80 rounded-md px-2.5 py-1 text-[11px] font-medium text-gray-700">
                                      <span className="text-gray-500 font-normal">Lead Time: </span>
                                      <span className="text-gray-900 font-semibold">{item.leadTime}</span>
                                    </span>
                                  )}

                                  {/* MOQ badge if MOQ > 1 */}
                                  {itemMoq > 1 && (
                                    <span className="bg-gray-50 border border-gray-200/80 rounded-md px-2.5 py-1 text-[11px] font-medium text-gray-700">
                                      <span className="text-gray-500 font-normal">Min. Order: </span>
                                      <span className="text-gray-900 font-semibold">{itemMoq} Units</span>
                                    </span>
                                  )}
                                </div>

                                {/* Right action links */}
                                <div className="flex items-center gap-4 shrink-0 ml-auto">
                                  {canEditConfig && (
                                    <button
                                      type="button"
                                      onClick={() => handleStartEditing(item)}
                                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                                    >
                                      Edit configuration
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (item.selectedVendorId && item.productCode) {
                                        releaseVendorReservation(item.selectedVendorId, item.productCode, item.quantity);
                                      }
                                      onRemove(item.id);
                                    }}
                                    className="text-xs font-semibold text-red-500 hover:text-red-600 hover:underline"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Trust Badges (Preserved as requested) ─────────────────── */}
          <div className="bg-white border border-gray-200 rounded-xl px-5 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", title: "Secure Checkout", sub: "100% secure payments" },
                { icon: RotateCcw, color: "text-orange-500", bg: "bg-orange-50", title: "Easy Returns", sub: "Hassle-free returns" },
                { icon: Headphones, color: "text-blue-600", bg: "bg-blue-50", title: "24/7 Support", sub: "Always here to help" },
                { icon: BadgeCheck, color: "text-blue-500", bg: "bg-blue-50", title: "Best Price Guarantee", sub: "Quality at best prices" },
              ].map(({ icon: Icon, color, bg, title, sub }) => (
                <div key={title} className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center shrink-0`}>
                    <Icon size={18} className={color} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{title}</p>
                    <p className="text-[11px] text-gray-500">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── You may also like (Preserved as requested) ────────────── */}
          {suggested.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h2 className="font-semibold text-gray-900 mb-4">You may also like</h2>
              <div className="relative">
                {scrollIdx > 0 && (
                  <button
                    type="button"
                    onClick={() => setScrollIdx((i) => Math.max(0, i - 1))}
                    className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-white border border-gray-300 rounded-full flex items-center justify-center shadow hover:bg-gray-50 transition-colors"
                  >
                    <ChevronLeft size={14} />
                  </button>
                )}
                <div className="overflow-hidden">
                  <div
                    className="flex gap-3 transition-transform duration-300"
                    style={{ transform: `translateX(-${scrollIdx * 186}px)` }}
                  >
                    {suggested.map((p) => (
                      <SuggestedCard
                        key={p.productCode}
                        product={p}
                        clientId={cart[0]?.clientId}
                        productBasePath={productPath}
                      />
                    ))}
                  </div>
                </div>
                {scrollIdx < maxScroll && (
                  <button
                    type="button"
                    onClick={() => setScrollIdx((i) => Math.min(maxScroll, i + 1))}
                    className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-white border border-gray-300 rounded-full flex items-center justify-center shadow hover:bg-gray-50 transition-colors"
                  >
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Right Column: Order Summary (Preserved as requested) ────── */}
        <div className="w-full lg:w-[360px] lg:shrink-0 border-t lg:border-t-0 lg:border-l border-gray-200 bg-white p-4 space-y-5 lg:sticky lg:top-0 lg:h-fit min-h-0 lg:min-h-screen">
          <OrderSummaryPanel showItemList={false} showEditCartButton={false} className="w-full" />

          {/* Proceed to Checkout */}
          <button
            type="button"
            onClick={() => {
              if (cart.length > 0) navigate(checkoutPath);
            }}
            disabled={cart.length === 0}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:hover:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 text-sm transition-colors shadow-sm"
          >
            <Lock size={14} />
            Proceed to Checkout
          </button>

          {/* We Accept */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2.5">We Accept</p>
            <div className="flex items-center gap-2">
              <div className="h-7 px-2 border border-gray-200 rounded flex items-center justify-center bg-white">
                <span className="text-[13px] font-black text-blue-800 tracking-tight italic">VISA</span>
              </div>
              <div className="h-7 px-1.5 border border-gray-200 rounded flex items-center justify-center bg-white gap-0.5">
                <div className="w-4 h-4 rounded-full bg-red-500 opacity-90" />
                <div className="w-4 h-4 rounded-full bg-yellow-400 -ml-2" />
              </div>
              <div className="h-7 px-2 border border-gray-200 rounded flex items-center justify-center bg-white">
                <span className="text-[11px] font-black text-blue-700 tracking-tight">RuPay</span>
              </div>
              <div className="h-7 px-2 border border-gray-200 rounded flex items-center justify-center bg-white">
                <span className="text-[11px] font-black tracking-tight">
                  <span className="text-green-600">U</span><span className="text-blue-600">P</span><span className="text-red-500">I</span>
                </span>
              </div>
            </div>
          </div>

          {/* Need Help */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-bold text-gray-900 mb-1">Need Help?</p>
            <p className="text-xs text-gray-500 mb-3">Our support team is here to help you.</p>
            <div className="space-y-2.5">
              <a href="tel:+918012345678" className="flex items-center gap-2 text-xs text-gray-600 hover:text-blue-600 transition-colors">
                <Phone size={13} className="text-gray-400 shrink-0" />
                +91 80 1234 5678
              </a>
              <a href="mailto:support@nido-tech.com" className="flex items-center gap-2 text-xs text-gray-600 hover:text-blue-600 transition-colors">
                <Mail size={13} className="text-gray-400 shrink-0" />
                support@nido-tech.com
              </a>
              <button
                type="button"
                className="flex items-center justify-between w-full text-xs text-gray-600 hover:text-blue-600 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <MessageCircle size={13} className="text-gray-400 shrink-0" />
                  Live Chat
                </span>
                <ChevronRight size={13} className="text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Vendor Switch Modal */}
      {vendorModalItem && (
        <VendorSwitchModal
          item={vendorModalItem}
          onClose={() => setVendorModalItem(null)}
          onSelectVendor={handleVendorChanged}
        />
      )}
    </div>
  );
}
