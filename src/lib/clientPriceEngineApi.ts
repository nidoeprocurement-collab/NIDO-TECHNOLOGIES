import { supabase } from '@/lib/supabase';
import { isSupabaseUuid } from '@/lib/nidoRolesApi';
import { getCatalogProducts } from '@/lib/catalogStore';
import {
  getClientCommonSettings,
  getClientPriceSlabs,
  getClientProductProfitRules,
  getClientProfitSettings,
  getGlobalCategoryRules,
  getRetailMarketPrices,
  saveClientCommonSettings,
  saveClientPriceSlabs,
  saveClientProductProfitRules,
  saveClientProfitSettings,
  saveGlobalCategoryRules,
  saveRetailMarketPrices,
  type CategoryPricingRule,
  type ClientCommonSettings,
  type ClientProductProfitRule,
  type ClientProfitSettings,
  type PriceSlab,
} from '@/lib/priceEngineStore';

interface DbClientPricingSettingsRow {
  client_id: string;
  per_unit_charges: ClientCommonSettings['perUnitCharges'] | null;
  overhead_pct: number | string | null;
  profit_pct: number | string | null;
  discount_pct: number | string | null;
  shipping_delivery_fee: number | string | null;
  platform_fee: number | string | null;
  round_off: ClientCommonSettings['roundOff'] | null;
  min_profit_pct: number | string | null;
  min_profit_amount: number | string | null;
  max_discount_allowed: number | string | null;
  enable_manual_override: boolean | null;
  enable_market_price_validation: boolean | null;
  enable_smart_pricing: boolean | null;
}

interface DbClientPriceSlabRow {
  id: string;
  client_id: string;
  name: string;
  min_qty: number;
  max_qty: number;
  discount_pct: number | string;
  apply_to: string;
  status: 'Active' | 'Inactive';
}

interface DbGlobalCategoryRuleRow {
  id: string;
  category: string;
  margin_pct: number | string;
  buffer_pct: number | string;
}

interface DbClientProductProfitRow {
  id: string;
  client_id: string;
  master_catalogue_item_id: string;
  profit_pct: number | string | null;
  master_catalogue_items?: { master_product_code: string; product_name: string } | { master_product_code: string; product_name: string }[] | null;
}

interface DbRetailMarketPriceRow {
  master_catalogue_item_id: string;
  retail_price: number | string;
  master_catalogue_items?: { master_product_code: string } | { master_product_code: string }[] | null;
}

const PRICING_MIGRATED_PREFIX = 'nido_client_pricing_supabase_migrated_v1:';

function assertSupabaseFrom() {
  if (typeof (supabase as { from?: unknown })?.from !== 'function') {
    throw new Error('Supabase client is not initialized.');
  }
}

export async function loadClientPricingSettingsFromSupabase(clientId: string): Promise<{
  settings: ClientCommonSettings;
  profitSettings: ClientProfitSettings;
  slabs: PriceSlab[];
  globalCategoryRules: CategoryPricingRule[];
  productProfitRules: ClientProductProfitRule[];
  retailMarketPrices: Record<string, number>;
}> {
  if (!isSupabaseUuid(clientId)) {
    return {
      settings: getClientCommonSettings(clientId),
      profitSettings: getClientProfitSettings(clientId),
      slabs: getClientPriceSlabs(clientId),
      globalCategoryRules: getGlobalCategoryRules(),
      productProfitRules: getClientProductProfitRules(clientId),
      retailMarketPrices: getRetailMarketPrices(),
    };
  }
  assertSupabaseFrom();

  const [
    settingsRes,
    slabsRes,
    globalRulesRes,
    productRulesRes,
    retailRes,
  ] = await Promise.all([
    supabase.from('client_pricing_settings').select('*').eq('client_id', clientId).maybeSingle(),
    supabase.from('client_price_slabs').select('*').eq('client_id', clientId).order('min_qty', { ascending: true }),
    supabase.from('global_category_pricing_rules').select('*').order('category', { ascending: true }),
    supabase
      .from('client_product_profit_rules')
      .select('id,client_id,master_catalogue_item_id,profit_pct,master_catalogue_items(master_product_code,product_name)')
      .eq('client_id', clientId),
    supabase
      .from('retail_market_prices')
      .select('master_catalogue_item_id,retail_price,master_catalogue_items(master_product_code)'),
  ]);

  if (settingsRes.error) throw new Error(settingsRes.error.message);
  if (slabsRes.error) throw new Error(slabsRes.error.message);
  if (globalRulesRes.error) throw new Error(globalRulesRes.error.message);
  if (productRulesRes.error) throw new Error(productRulesRes.error.message);
  if (retailRes.error) throw new Error(retailRes.error.message);

  const sRow = settingsRes.data as DbClientPricingSettingsRow | null;
  const settings: ClientCommonSettings = sRow
    ? {
      perUnitCharges: Array.isArray(sRow.per_unit_charges) ? sRow.per_unit_charges : [],
      overheadPct: Number(sRow.overhead_pct) || 0,
      profitPct: Number(sRow.profit_pct) || 0,
      discountPct: Number(sRow.discount_pct) || 0,
      shippingDeliveryFee: Number(sRow.shipping_delivery_fee) || 0,
      platformFee: Number(sRow.platform_fee) || 0,
      roundOff: sRow.round_off || 'none',
    }
    : getClientCommonSettings(clientId);

  const profitSettings: ClientProfitSettings = sRow
    ? {
      minProfitPct: Number(sRow.min_profit_pct) || 0,
      minProfitAmount: Number(sRow.min_profit_amount) || 0,
      maxDiscountAllowed: Number(sRow.max_discount_allowed) || 0,
      enableManualOverride: Boolean(sRow.enable_manual_override),
      enableMarketPriceValidation: Boolean(sRow.enable_market_price_validation),
      enableSmartPricing: Boolean(sRow.enable_smart_pricing),
    }
    : getClientProfitSettings(clientId);

  const slabs: PriceSlab[] = (Array.isArray(slabsRes.data) ? (slabsRes.data as DbClientPriceSlabRow[]) : []).map(
    (r) => ({
      id: r.id,
      name: r.name,
      minQty: r.min_qty,
      maxQty: r.max_qty,
      discountPct: Number(r.discount_pct) || 0,
      applyTo: r.apply_to,
      status: r.status,
    }),
  );

  const globalCategoryRules: CategoryPricingRule[] = (
    Array.isArray(globalRulesRes.data) ? (globalRulesRes.data as DbGlobalCategoryRuleRow[]) : []
  ).map((r) => ({
    id: r.id,
    category: r.category,
    marginPct: Number(r.margin_pct) || 0,
    bufferPct: Number(r.buffer_pct) || 0,
  }));

  const productProfitRules: ClientProductProfitRule[] = (
    Array.isArray(productRulesRes.data) ? (productRulesRes.data as DbClientProductProfitRow[]) : []
  ).map((r) => {
    const joined = Array.isArray(r.master_catalogue_items)
      ? r.master_catalogue_items[0]
      : r.master_catalogue_items;
    return {
      masterProductCode: joined?.master_product_code || r.master_catalogue_item_id,
      productName: joined?.product_name || '',
      profitPct: r.profit_pct !== null ? Number(r.profit_pct) : null,
    };
  });

  const retailMarketPrices: Record<string, number> = { ...getRetailMarketPrices() };
  for (const r of Array.isArray(retailRes.data) ? (retailRes.data as DbRetailMarketPriceRow[]) : []) {
    const joined = Array.isArray(r.master_catalogue_items)
      ? r.master_catalogue_items[0]
      : r.master_catalogue_items;
    if (joined?.master_product_code) {
      retailMarketPrices[joined.master_product_code] = Number(r.retail_price) || 0;
    }
  }

  // Hydrate synchronous Price Engine caches so computeClientFinalPrice / resolveClientProfitPct stay 100% consistent
  if (globalCategoryRules.length > 0) saveGlobalCategoryRules(globalCategoryRules);
  if (sRow) {
    saveClientCommonSettings(clientId, settings);
    saveClientProfitSettings(clientId, profitSettings);
  }
  saveClientPriceSlabs(clientId, slabs);
  saveClientProductProfitRules(clientId, productProfitRules);
  saveRetailMarketPrices(retailMarketPrices);

  return {
    settings,
    profitSettings,
    slabs,
    globalCategoryRules,
    productProfitRules,
    retailMarketPrices,
  };
}

export async function saveClientPricingSettingsInSupabase(
  clientId: string,
  settings: ClientCommonSettings,
  profitSettings?: ClientProfitSettings,
): Promise<void> {
  if (!isSupabaseUuid(clientId)) {
    saveClientCommonSettings(clientId, settings);
    if (profitSettings) saveClientProfitSettings(clientId, profitSettings);
    return;
  }
  assertSupabaseFrom();
  const effectiveProfit = profitSettings ?? getClientProfitSettings(clientId);

  const { error } = await supabase.from('client_pricing_settings').upsert(
    {
      client_id: clientId,
      per_unit_charges: settings.perUnitCharges ?? [],
      overhead_pct: settings.overheadPct ?? 0,
      profit_pct: settings.profitPct ?? 0,
      discount_pct: settings.discountPct ?? 0,
      shipping_delivery_fee: settings.shippingDeliveryFee ?? 0,
      platform_fee: settings.platformFee ?? 0,
      round_off: settings.roundOff ?? 'none',
      min_profit_pct: effectiveProfit.minProfitPct ?? 0,
      min_profit_amount: effectiveProfit.minProfitAmount ?? 0,
      max_discount_allowed: effectiveProfit.maxDiscountAllowed ?? 0,
      enable_manual_override: Boolean(effectiveProfit.enableManualOverride),
      enable_market_price_validation: Boolean(effectiveProfit.enableMarketPriceValidation),
      enable_smart_pricing: Boolean(effectiveProfit.enableSmartPricing),
    },
    { onConflict: 'client_id' },
  );
  if (error) {
    throw new Error(error.message || 'Unable to save client pricing settings.');
  }
  saveClientCommonSettings(clientId, settings);
  if (profitSettings) saveClientProfitSettings(clientId, profitSettings);
}

export async function saveClientPriceSlabsInSupabase(
  clientId: string,
  slabs: PriceSlab[],
): Promise<void> {
  if (!isSupabaseUuid(clientId)) {
    saveClientPriceSlabs(clientId, slabs);
    return;
  }
  assertSupabaseFrom();

  const { error: delError } = await supabase
    .from('client_price_slabs')
    .delete()
    .eq('client_id', clientId);
  if (delError) {
    throw new Error(delError.message || 'Unable to update client price slabs.');
  }

  if (slabs.length > 0) {
    const { error: insError } = await supabase.from('client_price_slabs').insert(
      slabs.map((s) => ({
        ...(isSupabaseUuid(s.id) ? { id: s.id } : {}),
        client_id: clientId,
        name: s.name,
        min_qty: s.minQty,
        max_qty: s.maxQty,
        discount_pct: s.discountPct,
        apply_to: s.applyTo || 'All Products',
        status: s.status === 'Inactive' ? 'Inactive' : 'Active',
      })),
    );
    if (insError) {
      throw new Error(insError.message || 'Unable to save client price slabs.');
    }
  }
  saveClientPriceSlabs(clientId, slabs);
}

export async function saveGlobalCategoryRulesInSupabase(
  rules: CategoryPricingRule[],
): Promise<void> {
  assertSupabaseFrom();
  if (rules.length > 0) {
    const { error } = await supabase.from('global_category_pricing_rules').upsert(
      rules.map((r) => ({
        category: r.category,
        margin_pct: r.marginPct,
        buffer_pct: r.bufferPct,
      })),
      { onConflict: 'category' },
    );
    if (error) {
      throw new Error(error.message || 'Unable to save global category pricing rules.');
    }
  }
  saveGlobalCategoryRules(rules);
}

export async function saveRetailMarketPricesInSupabase(
  prices: Record<string, number>,
): Promise<void> {
  assertSupabaseFrom();
  const catalog = getCatalogProducts();
  const byCode = new Map(
    catalog
      .filter((c) => isSupabaseUuid(c.id) && c.masterProductCode)
      .map((c) => [c.masterProductCode, c.id]),
  );

  const rows = Object.entries(prices)
    .map(([code, retailPrice]) => {
      const masterId = isSupabaseUuid(code) ? code : byCode.get(code);
      if (!masterId) return null;
      return {
        master_catalogue_item_id: masterId,
        retail_price: Math.max(0, Number(retailPrice) || 0),
      };
    })
    .filter((r): r is { master_catalogue_item_id: string; retail_price: number } => r !== null);

  if (rows.length > 0) {
    const { error } = await supabase
      .from('retail_market_prices')
      .upsert(rows, { onConflict: 'master_catalogue_item_id' });
    if (error) {
      throw new Error(error.message || 'Unable to save retail market prices.');
    }
  }
  saveRetailMarketPrices(prices);
}

export async function migrateLocalClientPricingToSupabaseIfNeeded(clientId: string): Promise<void> {
  if (typeof window === 'undefined' || !isSupabaseUuid(clientId)) return;
  const flagKey = `${PRICING_MIGRATED_PREFIX}${clientId}`;
  if (localStorage.getItem(flagKey) === 'done') return;

  const { data: existing } = await supabase
    .from('client_pricing_settings')
    .select('client_id')
    .eq('client_id', clientId)
    .maybeSingle();

  if (!existing) {
    const localSettings = getClientCommonSettings(clientId);
    const localProfit = getClientProfitSettings(clientId);
    const hasCustom =
      localSettings.profitPct > 0 ||
      localSettings.overheadPct > 0 ||
      localSettings.discountPct > 0 ||
      localSettings.shippingDeliveryFee > 0 ||
      localSettings.platformFee > 0 ||
      localSettings.perUnitCharges.length > 0;
    if (hasCustom) {
      await saveClientPricingSettingsInSupabase(clientId, localSettings, localProfit);
    }
  }

  localStorage.setItem(flagKey, 'done');
}
