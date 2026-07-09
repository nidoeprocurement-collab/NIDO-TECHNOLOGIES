import { useEffect, useRef, useState } from 'react';
import { Plus, X, Pencil, Trash2, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  getGlobalCategoryRules,
  saveGlobalCategoryRules,
  type CategoryPricingRule,
} from '@/lib/priceEngineStore';
import { getCatalogProducts } from '@/lib/catalogStore';

/** Pull the unique category names that actually exist in the master catalog
 *  so rules always match real product categories. */
function loadCatalogCategories(): string[] {
  const cats = getCatalogProducts().map(p => p.category).filter(Boolean);
  const unique = Array.from(new Set(cats)).sort();
  return unique.length > 0 ? unique : ['Office Supplies', 'Electronics', 'Furniture', 'Services'];
}

const ADD_NEW_SENTINEL = '__ADD_NEW__';

function emptyRule(category: string): CategoryPricingRule {
  return {
    id: `cat-rule-${Date.now()}`,
    category,
    marginPct: 10,
    bufferPct: 1,
  };
}

/** Dropdown + inline "new category" text input, used in both add and edit rows */
function CategorySelect({
  value,
  onChange,
  usedCategories,
  extraCategories,
  onNewCategory,
}: {
  value: string;
  onChange: (val: string) => void;
  usedCategories: Set<string>;
  extraCategories: string[];
  onNewCategory: (cat: string) => void;
}) {
  const [addingNew, setAddingNew] = useState(false);
  const [newCat, setNewCat] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const available = extraCategories.filter(c => !usedCategories.has(c) || c === value);

  const commitNew = () => {
    const trimmed = newCat.trim();
    if (!trimmed) return;
    onNewCategory(trimmed);
    onChange(trimmed);
    setAddingNew(false);
    setNewCat('');
  };

  const cancelNew = () => {
    setAddingNew(false);
    setNewCat('');
  };

  if (addingNew) {
    return (
      <div className="flex items-center gap-1">
        <Input
          ref={inputRef}
          autoFocus
          value={newCat}
          onChange={e => setNewCat(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') commitNew();
            if (e.key === 'Escape') cancelNew();
          }}
          placeholder="Category name…"
          className="h-8 text-xs bg-white w-36"
        />
        <button
          onClick={commitNew}
          className="text-blue-600 hover:text-blue-700 p-0.5"
          title="Confirm"
        >
          <Check size={14} />
        </button>
        <button
          onClick={cancelNew}
          className="text-gray-400 hover:text-gray-600 p-0.5"
          title="Cancel"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={e => {
        if (e.target.value === ADD_NEW_SENTINEL) {
          setAddingNew(true);
        } else {
          onChange(e.target.value);
        }
      }}
      className="h-8 text-xs border border-gray-300 rounded px-2 bg-white w-44"
    >
      {available.map(c => (
        <option key={c} value={c}>{c}</option>
      ))}
      <option disabled>──────────────</option>
      <option value={ADD_NEW_SENTINEL}>+ Add new category…</option>
    </select>
  );
}

/**
 * Category Pricing Rules — configured ONCE, globally, in the Price Engine.
 * These rules apply to every client (no per-client overrides). A category
 * rule's marginPct + bufferPct replaces a client's global Profit Margin for
 * matching products, for all clients.
 */
export default function GlobalCategoryPricingPanel() {
  const [rules, setRules] = useState<CategoryPricingRule[]>(() => getGlobalCategoryRules());
  const [catalogCategories, setCatalogCategories] = useState<string[]>(() => loadCatalogCategories());
  // User-typed custom categories not present in the catalog
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CategoryPricingRule | null>(null);
  const [isNew, setIsNew] = useState(false);

  // Refresh catalog categories whenever the master catalog changes
  useEffect(() => {
    const refresh = () => setCatalogCategories(loadCatalogCategories());
    window.addEventListener('catalogUpdated', refresh);
    return () => window.removeEventListener('catalogUpdated', refresh);
  }, []);

  const persist = (next: CategoryPricingRule[]) => {
    setRules(next);
    saveGlobalCategoryRules(next);
  };

  const addCustomCategory = (cat: string) => {
    setCustomCategories(prev => prev.includes(cat) ? prev : [...prev, cat]);
  };

  // All known categories = catalog ones + any user-typed custom ones
  const allKnown = Array.from(new Set([...catalogCategories, ...customCategories]));

  const startAdd = () => {
    const usedCats = new Set(rules.map(r => r.category));
    const first = allKnown.find(c => !usedCats.has(c)) ?? (allKnown[0] ?? '');
    const rule = emptyRule(first);
    setDraft(rule);
    setEditingId(rule.id);
    setIsNew(true);
  };

  const startEdit = (rule: CategoryPricingRule) => {
    setDraft({ ...rule });
    setEditingId(rule.id);
    setIsNew(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
    setIsNew(false);
  };

  const saveDraft = () => {
    if (!draft || !draft.category.trim()) return;
    if (isNew) {
      persist([...rules, draft]);
    } else {
      persist(rules.map(r => (r.id === draft.id ? draft : r)));
    }
    cancelEdit();
  };

  const removeRule = (id: string) => {
    persist(rules.filter(r => r.id !== id));
  };

  const usedCategories = new Set(rules.map(r => r.category));
  const hasAvailable = true; // always allow — user can type a new category

  return (
    <div className="border border-gray-300 rounded-lg p-4">
      <h2 className="text-xs font-bold text-blue-700 uppercase mb-3">Category Pricing Rules</h2>

      <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 mb-4">
        <p className="text-sm text-gray-700">
          Override the global margin with category-specific margin and buffer percentages. These
          rules apply to <span className="font-semibold text-gray-900">every client</span> and take
          priority over each client's Profit Margin setting for matching products.
        </p>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Category</th>
              <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Margin %</th>
              <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Buffer</th>
              <th className="text-left px-4 py-2.5 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.map(rule => {
              const editing = editingId === rule.id && draft;

              if (editing) {
                return (
                  <tr key={rule.id} className="border-b border-gray-100 last:border-0 bg-blue-50/30">
                    <td className="px-4 py-2">
                      <CategorySelect
                        value={draft.category}
                        onChange={val => setDraft({ ...draft, category: val })}
                        usedCategories={new Set([...usedCategories].filter(c => c !== rule.category))}
                        extraCategories={allKnown}
                        onNewCategory={cat => {
                          addCustomCategory(cat);
                          setDraft({ ...draft, category: cat });
                        }}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={draft.marginPct}
                          onChange={e => setDraft({ ...draft, marginPct: parseFloat(e.target.value) || 0 })}
                          className="h-8 text-xs w-20 bg-white"
                          min={0} max={100}
                        />
                        <span className="text-gray-400 text-xs">%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400 text-xs">+</span>
                        <Input
                          type="number"
                          value={draft.bufferPct}
                          onChange={e => setDraft({ ...draft, bufferPct: parseFloat(e.target.value) || 0 })}
                          className="h-8 text-xs w-20 bg-white"
                          min={0} max={100}
                        />
                        <span className="text-gray-400 text-xs">%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-3">
                        <button onClick={saveDraft} className="text-blue-600 hover:underline text-xs font-medium">Save</button>
                        <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={rule.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3 text-gray-800 font-medium">{rule.category}</td>
                  <td className="px-4 py-3 text-gray-700">{rule.marginPct}%</td>
                  <td className="px-4 py-3 text-gray-500">+{rule.bufferPct}%</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 text-xs">
                      <button onClick={() => startEdit(rule)} className="text-blue-600 hover:underline font-medium flex items-center gap-1">
                        <Pencil size={11} /> Edit
                      </button>
                      <span className="text-gray-200">|</span>
                      <button onClick={() => removeRule(rule.id)} className="text-red-500 hover:underline font-medium flex items-center gap-1">
                        <Trash2 size={11} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {isNew && draft && (
              <tr className="border-b border-gray-100 last:border-0 bg-blue-50/30">
                <td className="px-4 py-2">
                  <CategorySelect
                    value={draft.category}
                    onChange={val => setDraft({ ...draft, category: val })}
                    usedCategories={usedCategories}
                    extraCategories={allKnown}
                    onNewCategory={cat => {
                      addCustomCategory(cat);
                      setDraft({ ...draft, category: cat });
                    }}
                  />
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={draft.marginPct}
                      onChange={e => setDraft({ ...draft, marginPct: parseFloat(e.target.value) || 0 })}
                      className="h-8 text-xs w-20 bg-white"
                      min={0} max={100}
                    />
                    <span className="text-gray-400 text-xs">%</span>
                  </div>
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400 text-xs">+</span>
                    <Input
                      type="number"
                      value={draft.bufferPct}
                      onChange={e => setDraft({ ...draft, bufferPct: parseFloat(e.target.value) || 0 })}
                      className="h-8 text-xs w-20 bg-white"
                      min={0} max={100}
                    />
                    <span className="text-gray-400 text-xs">%</span>
                  </div>
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-3">
                    <button onClick={saveDraft} className="text-blue-600 hover:underline text-xs font-medium">Save</button>
                    <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                  </div>
                </td>
              </tr>
            )}

            {rules.length === 0 && !isNew && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-xs text-gray-400">
                  No category pricing rules configured yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!isNew && (
        <Button
          variant="outline"
          size="sm"
          className="mt-3 h-8 text-xs gap-1.5"
          onClick={startAdd}
          disabled={!hasAvailable}
        >
          <Plus size={13} /> Add Rule
        </Button>
      )}
    </div>
  );
}
