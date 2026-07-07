import { useEffect, useRef, useState } from 'react';
import { Plus, X, Pencil, Trash2, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  getClientCategoryRules,
  saveClientCategoryRules,
  type CategoryPricingRule,
} from '@/lib/priceEngineStore';

const BASE_CATEGORIES = [
  'Office Supplies',
  'Electronics',
  'Furniture',
  'Pantry',
  'Networking',
  'Services',
  'Stationery',
  'Cleaning',
  'IT Peripherals',
  'Other',
];

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

  const allKnown = [...BASE_CATEGORIES, ...extraCategories.filter(c => !BASE_CATEGORIES.includes(c))];
  const available = allKnown.filter(c => !usedCategories.has(c) || c === value);

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

export default function ClientCategoryPricingPanel({ clientId }: { clientId: string }) {
  const [rules, setRules] = useState<CategoryPricingRule[]>(() => getClientCategoryRules(clientId));
  // Extra categories created by the user (not in BASE_CATEGORIES)
  const [customCategories, setCustomCategories] = useState<string[]>(() =>
    getClientCategoryRules(clientId)
      .map(r => r.category)
      .filter(c => !BASE_CATEGORIES.includes(c))
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CategoryPricingRule | null>(null);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    const saved = getClientCategoryRules(clientId);
    setRules(saved);
    setCustomCategories(saved.map(r => r.category).filter(c => !BASE_CATEGORIES.includes(c)));
    setEditingId(null);
    setDraft(null);
    setIsNew(false);
  }, [clientId]);

  const persist = (next: CategoryPricingRule[]) => {
    setRules(next);
    saveClientCategoryRules(clientId, next);
  };

  const addCustomCategory = (cat: string) => {
    setCustomCategories(prev => prev.includes(cat) ? prev : [...prev, cat]);
  };

  const startAdd = () => {
    const usedCats = new Set(rules.map(r => r.category));
    const allKnown = [...BASE_CATEGORIES, ...customCategories];
    const first = allKnown.find(c => !usedCats.has(c)) ?? '';
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
  const allKnown = [...BASE_CATEGORIES, ...customCategories];
  const hasAvailable = allKnown.some(c => !usedCategories.has(c)) || true; // always allow (custom)

  return (
    <div className="mt-6">
      <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 mb-4">
        <p className="text-sm text-gray-700">
          <span className="font-semibold text-gray-900">Category Pricing Rules:</span> Override the
          global margin with category-specific margin and buffer percentages. These rules apply only
          to this client and take priority over the global Profit Margin setting for matching products.
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
                        extraCategories={customCategories}
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
                    extraCategories={customCategories}
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
