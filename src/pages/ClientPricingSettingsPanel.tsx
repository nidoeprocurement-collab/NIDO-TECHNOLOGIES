import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import {
  getClientCommonSettings,
  saveClientCommonSettings,
  type ClientCommonSettings,
  type ChargeItem,
} from '@/lib/priceEngineStore';

export default function ClientPricingSettingsPanel({ clientId }: { clientId: string }) {
  const [settings, setSettings] = useState<ClientCommonSettings>(() => getClientCommonSettings(clientId));

  useEffect(() => {
    setSettings(getClientCommonSettings(clientId));
  }, [clientId]);

  const persist = (next: ClientCommonSettings) => {
    setSettings(next);
    saveClientCommonSettings(clientId, next);
  };

  const updateField = <K extends keyof ClientCommonSettings>(field: K, value: ClientCommonSettings[K]) => {
    persist({ ...settings, [field]: value });
  };

  const addCharge = () => {
    const charge: ChargeItem = { id: `chg-${Date.now()}`, name: '', value: 0 };
    persist({ ...settings, perUnitCharges: [...settings.perUnitCharges, charge] });
  };

  const updateCharge = (id: string, patch: Partial<ChargeItem>) => {
    persist({
      ...settings,
      perUnitCharges: settings.perUnitCharges.map(c => (c.id === id ? { ...c, ...patch } : c)),
    });
  };

  const removeCharge = (id: string) => {
    persist({ ...settings, perUnitCharges: settings.perUnitCharges.filter(c => c.id !== id) });
  };

  return (
    <div className="border border-blue-200 bg-blue-50/40 rounded-xl p-5">
      <h2 className="text-sm font-bold text-blue-700 uppercase mb-1">Pricing Settings (This Client Only)</h2>
      <p className="text-xs text-gray-500 mb-4">
        Vendor landed cost is pulled automatically from the Vendor Price Engine. These margin/tax settings apply
        only to this client and are used to compute the Selling Price shown in the catalog below.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2mb-4">
        <div>
          <Label className="text-xs text-gray-600">Overhead (% of Landed Cost)</Label>
          <div className="flex items-center gap-1 mt-1">
            <Input type="number" value={settings.overheadPct}
              onChange={e => updateField('overheadPct', parseFloat(e.target.value) || 0)} className="h-8 text-xs bg-white" />
            <span className="text-gray-400 text-xs">%</span>
          </div>
        </div>
        <div>
          <Label className="text-xs text-gray-600">Profit Margin (%)</Label>
          <div className="flex items-center gap-1 mt-1">
            <Input type="number" value={settings.profitPct}
              onChange={e => updateField('profitPct', parseFloat(e.target.value) || 0)} className="h-8 text-xs bg-white" />
            <span className="text-gray-400 text-xs">%</span>
          </div>
        </div>
        <div>
          <Label className="text-xs text-gray-600">Discount (%)</Label>
          <div className="flex items-center gap-1 mt-1">
            <Input type="number" value={settings.discountPct}
              onChange={e => updateField('discountPct', parseFloat(e.target.value) || 0)} className="h-8 text-xs bg-white" />
            <span className="text-gray-400 text-xs">%</span>
          </div>
        </div>
        <div>
          <Label className="text-xs text-gray-600">Tax (%)</Label>
          <div className="flex items-center gap-1 mt-1">
            <Input type="number" value={settings.taxPct}
              onChange={e => updateField('taxPct', parseFloat(e.target.value) || 0)} className="h-8 text-xs bg-white" />
            <span className="text-gray-400 text-xs">%</span>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs text-gray-600">Additional Charges (% of Landed Cost)</Label>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1 bg-white" onClick={addCharge}>
            <Plus size={12} /> Add Charge
          </Button>
        </div>
        {settings.perUnitCharges.length === 0 ? (
          <p className="text-xs text-gray-400">No additional charges configured.</p>
        ) : (
          <div className="space-y-2">
            {settings.perUnitCharges.map(c => (
              <div key={c.id} className="flex items-center gap-2">
                <Input placeholder="Charge name" value={c.name}
                  onChange={e => updateCharge(c.id, { name: e.target.value })} className="h-8 text-xs flex-1 bg-white" />
                <div className="flex items-center gap-1">
                  <Input type="number" value={c.value}
                    onChange={e => updateCharge(c.id, { value: parseFloat(e.target.value) || 0 })}
                    className="h-8 text-xs w-28 bg-white" />
                  <span className="text-gray-400 text-xs">%</span>
                </div>
                <button onClick={() => removeCharge(c.id)} className="text-red-500 hover:text-red-700">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 max-w-xs">
        <Label className="text-xs text-gray-600">Round Off Final Price</Label>
        <select
          value={settings.roundOff}
          onChange={e => updateField('roundOff', e.target.value as ClientCommonSettings['roundOff'])}
          className="w-full h-8 text-xs border border-gray-300 rounded mt-1 px-2 bg-white"
        >
          <option value="none">No Rounding</option>
          <option value="nearest">Nearest Whole Number</option>
          <option value="up">Round Up</option>
          <option value="down">Round Down</option>
        </select>
      </div>
    </div>
  );
}
