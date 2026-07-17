// ── Role Permissions Dialog ───────────────────────────────────────────────────
// Full module × action permission matrix editor for a single role.
// Super Admin (System Owner) role shows all permissions as locked/enabled.
// Supports adding custom permission modules.

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Shield, CheckSquare, Square, Plus, X, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ACTIONS,
  getRolePermissions,
  saveRolePermissions,
  isSuperAdmin,
  getAllModules,
  addCustomModule,
  deleteCustomModule,
  CUSTOM_MODULES_EVENT,
  type ActionKey,
  type ModulePermissions,
} from '@/lib/permissionsStore';
import type { NidoRole } from '@/lib/nidoUsersStore';

interface RolePermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: NidoRole | null;
}

type PermMatrix = Record<string, ModulePermissions>;

export default function RolePermissionsDialog({ open, onOpenChange, role }: RolePermissionsDialogProps) {
  const [matrix, setMatrix] = useState<PermMatrix>({});
  const [modules, setModules] = useState(getAllModules());
  const [showAddModule, setShowAddModule] = useState(false);
  const [newModuleName, setNewModuleName] = useState('');
  const [addError, setAddError] = useState('');

  const superAdmin = !!(role && isSuperAdmin(role.name));

  useEffect(() => {
    const handler = () => setModules(getAllModules());
    window.addEventListener(CUSTOM_MODULES_EVENT, handler);
    return () => window.removeEventListener(CUSTOM_MODULES_EVENT, handler);
  }, []);

  useEffect(() => {
    if (open && role) {
      setModules(getAllModules());
      const perms = getRolePermissions(role.name);
      const full: PermMatrix = {};
      for (const m of getAllModules()) {
        full[m.key] = { ...(perms[m.key] ?? {}) };
      }
      setMatrix(full);
      setShowAddModule(false);
      setNewModuleName('');
      setAddError('');
    }
  }, [open, role]);

  const toggle = (moduleKey: string, action: ActionKey) => {
    if (superAdmin) return;
    setMatrix(prev => ({
      ...prev,
      [moduleKey]: { ...prev[moduleKey], [action]: !prev[moduleKey]?.[action] },
    }));
  };

  const toggleRow = (moduleKey: string) => {
    if (superAdmin) return;
    const current = matrix[moduleKey] ?? {};
    const anyOn = ACTIONS.some(a => current[a.key]);
    const next: ModulePermissions = {};
    if (!anyOn) ACTIONS.forEach(a => { next[a.key] = true; });
    setMatrix(prev => ({ ...prev, [moduleKey]: next }));
  };

  const toggleColumn = (action: ActionKey) => {
    if (superAdmin) return;
    const anyOn = modules.some(m => matrix[m.key]?.[action]);
    setMatrix(prev => {
      const next = { ...prev };
      modules.forEach(m => { next[m.key] = { ...next[m.key], [action]: !anyOn }; });
      return next;
    });
  };

  const handleAddModule = () => {
    const trimmed = newModuleName.trim();
    if (!trimmed) { setAddError('Module name is required.'); return; }
    const mod = addCustomModule(trimmed);
    if (!mod) { setAddError('A module with that name already exists.'); return; }
    setMatrix(prev => ({ ...prev, [mod.key]: {} }));
    setModules(getAllModules());
    setNewModuleName('');
    setAddError('');
    setShowAddModule(false);
    toast.success('Module added', { description: `"${mod.label}" is now available in all role permission editors.` });
  };

  const handleDeleteCustomModule = (key: string, label: string) => {
    deleteCustomModule(key);
    setMatrix(prev => { const next = { ...prev }; delete next[key]; return next; });
    setModules(getAllModules());
    toast.info('Module removed', { description: `"${label}" has been removed from the permissions matrix.` });
  };

  const handleSave = () => {
    if (!role) return;
    saveRolePermissions(role.name, matrix);
    toast.success('Permissions saved', { description: `Permissions for "${role.name}" have been updated.` });
    onOpenChange(false);
  };

  if (!role) return null;

  const customModules = modules.filter(m => 'custom' in m && m.custom);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Full-screen dialog split into 3 fixed sections: header / scroll-body / footer */}
      <DialogContent className="w-screen h-screen max-w-none max-h-none sm:rounded-none p-0 flex flex-col overflow-hidden">

        {/* ── Header (fixed, never scrolls) ── */}
        <div className="shrink-0 px-6 pt-6 pb-4 border-b border-border">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg">Permissions — {role.name}</DialogTitle>
                <DialogDescription>
                  {superAdmin
                    ? 'System Owner has unrestricted access to all modules.'
                    : 'Toggle permissions for each module. Click a module name to toggle its entire row.'}
                </DialogDescription>
              </div>
            </div>
            {superAdmin && (
              <Badge className="w-fit bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 mt-3">
                Super Administrator — All permissions always granted
              </Badge>
            )}
          </DialogHeader>
        </div>

        {/* ── Scrollable table body ── */}
        <div className="flex-1 overflow-auto px-6 py-4">
          <table className="w-full border-collapse text-sm min-w-[700px]">
            <thead className="sticky top-0 bg-background z-10">
              <tr>
                <th className="py-3 px-3 text-left font-semibold text-foreground border-b border-border w-52">
                  Module
                </th>
                {ACTIONS.map(a => (
                  <th key={a.key} className="py-3 px-2 text-center font-semibold text-foreground border-b border-border">
                    <button
                      className={`flex flex-col items-center gap-1 mx-auto text-xs ${superAdmin ? 'cursor-default' : 'hover:text-primary transition-colors cursor-pointer'}`}
                      onClick={() => toggleColumn(a.key)}
                      title={superAdmin ? undefined : `Toggle all ${a.label}`}
                    >
                      {a.label}
                    </button>
                  </th>
                ))}
                <th className="w-8 border-b border-border" />
              </tr>
            </thead>
            <tbody>
              {modules.map((m, idx) => {
                const modPerms = matrix[m.key] ?? {};
                const isCustom = 'custom' in m && m.custom;
                return (
                  <tr key={m.key} className={idx % 2 === 0 ? 'bg-muted/20' : ''}>
                    <td className="py-2.5 px-3 border-b border-border">
                      <div className="flex items-center gap-2">
                        <button
                          className={`text-left font-medium text-foreground ${superAdmin ? 'cursor-default' : 'hover:text-primary transition-colors cursor-pointer'}`}
                          onClick={() => toggleRow(m.key)}
                          title={superAdmin ? undefined : `Toggle all actions for ${m.label}`}
                        >
                          {m.label}
                        </button>
                        {isCustom && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 text-blue-600 border-blue-300">
                            custom
                          </Badge>
                        )}
                      </div>
                    </td>
                    {ACTIONS.map(a => {
                      const enabled = superAdmin || !!modPerms[a.key];
                      return (
                        <td key={a.key} className="py-2.5 px-2 text-center border-b border-border">
                          <button
                            className={`mx-auto flex items-center justify-center w-5 h-5 transition-colors ${
                              superAdmin
                                ? 'cursor-default text-primary'
                                : enabled
                                  ? 'text-primary hover:text-primary/80 cursor-pointer'
                                  : 'text-muted-foreground/30 hover:text-muted-foreground cursor-pointer'
                            }`}
                            onClick={() => toggle(m.key, a.key)}
                            disabled={superAdmin}
                          >
                            {enabled ? <CheckSquare size={16} /> : <Square size={16} />}
                          </button>
                        </td>
                      );
                    })}
                    <td className="py-2.5 px-1 border-b border-border text-center">
                      {isCustom && !superAdmin && (
                        <button
                          onClick={() => handleDeleteCustomModule(m.key, m.label)}
                          className="text-muted-foreground/40 hover:text-red-500 transition-colors"
                          title={`Remove "${m.label}" module`}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* Add Module inline input row */}
              {showAddModule && !superAdmin && (
                <tr className="bg-blue-50/60 dark:bg-blue-950/20">
                  <td colSpan={ACTIONS.length + 2} className="px-3 py-3 border-b border-border">
                    <div className="flex items-center gap-2 max-w-sm">
                      <Input
                        autoFocus
                        value={newModuleName}
                        onChange={e => { setNewModuleName(e.target.value); setAddError(''); }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleAddModule();
                          if (e.key === 'Escape') { setShowAddModule(false); setNewModuleName(''); setAddError(''); }
                        }}
                        placeholder="Module name (e.g. Inventory)"
                        className="h-8 text-sm"
                      />
                      <Button size="sm" onClick={handleAddModule} className="h-8 shrink-0">Add</Button>
                      <button
                        onClick={() => { setShowAddModule(false); setNewModuleName(''); setAddError(''); }}
                        className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    {addError && <p className="text-xs text-red-600 mt-1">{addError}</p>}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Module count summary */}
          <p className="text-xs text-muted-foreground mt-3 px-1">
            {modules.filter(m => !('custom' in m && m.custom)).length} built-in modules
            {customModules.length > 0 && ` · ${customModules.length} custom module${customModules.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* ── Footer (fixed, never scrolls) ── */}
        <div className="shrink-0 border-t border-border bg-background px-6 py-4 flex flex-row items-center justify-between gap-3">
          {/* Left: Add Module button */}
          {!superAdmin ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setShowAddModule(v => !v); setNewModuleName(''); setAddError(''); }}
              className="flex items-center gap-1.5"
            >
              <Plus size={14} />
              {showAddModule ? 'Cancel' : 'Add Module'}
            </Button>
          ) : (
            <div />
          )}

          {/* Right: Cancel + Save */}
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            {!superAdmin && (
              <Button onClick={handleSave}>Save Permissions</Button>
            )}
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
