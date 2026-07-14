// ── Role Permissions Dialog ───────────────────────────────────────────────────
// Full module × action permission matrix editor for a single role.
// Super Admin (System Owner) role shows all permissions as locked/enabled.

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Shield, CheckSquare, Square } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MODULES,
  ACTIONS,
  getRolePermissions,
  saveRolePermissions,
  isSuperAdmin,
  type ModuleKey,
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
  const superAdmin = !!(role && isSuperAdmin(role.name));

  useEffect(() => {
    if (open && role) {
      const perms = getRolePermissions(role.name);
      // Build a full matrix — ensure every module key exists
      const full: PermMatrix = {};
      for (const m of MODULES) {
        full[m.key] = { ...(perms[m.key] ?? {}) };
      }
      setMatrix(full);
    }
  }, [open, role]);

  const toggle = (moduleKey: string, action: ActionKey) => {
    if (superAdmin) return; // locked
    setMatrix(prev => ({
      ...prev,
      [moduleKey]: {
        ...prev[moduleKey],
        [action]: !prev[moduleKey]?.[action],
      },
    }));
  };

  const toggleRow = (moduleKey: string) => {
    if (superAdmin) return;
    const current = matrix[moduleKey] ?? {};
    const anyOn = ACTIONS.some(a => current[a.key]);
    const next: ModulePermissions = {};
    if (!anyOn) {
      ACTIONS.forEach(a => { next[a.key] = true; });
    }
    setMatrix(prev => ({ ...prev, [moduleKey]: next }));
  };

  const toggleColumn = (action: ActionKey) => {
    if (superAdmin) return;
    const anyOn = MODULES.some(m => matrix[m.key]?.[action]);
    setMatrix(prev => {
      const next = { ...prev };
      MODULES.forEach(m => {
        next[m.key] = { ...next[m.key], [action]: !anyOn };
      });
      return next;
    });
  };

  const handleSave = () => {
    if (!role) return;
    saveRolePermissions(role.name, matrix);
    toast.success('Permissions saved', { description: `Permissions for "${role.name}" have been updated.` });
    onOpenChange(false);
  };

  if (!role) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen h-screen max-w-none max-h-none sm:rounded-none overflow-hidden flex flex-col p-6">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg">
                Permissions — {role.name}
              </DialogTitle>
              <DialogDescription>
                {superAdmin
                  ? 'System Owner has unrestricted access to all modules.'
                  : 'Toggle permissions for each module. Changes take effect on next page load.'}
              </DialogDescription>
            </div>
          </div>
          {superAdmin && (
            <Badge className="w-fit bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 mt-2">
              Super Administrator — All permissions always granted
            </Badge>
          )}
        </DialogHeader>

        <div className="overflow-auto flex-1 -mx-6 px-6">
          <table className="w-full border-collapse text-sm min-w-[700px]">
            <thead className="sticky top-0 bg-background z-10">
              <tr>
                <th className="py-3 px-3 text-left font-semibold text-foreground border-b border-border w-48">
                  Module
                </th>
                {ACTIONS.map(a => (
                  <th key={a.key} className="py-3 px-2 text-center font-semibold text-foreground border-b border-border">
                    <button
                      className={`flex flex-col items-center gap-1 mx-auto ${superAdmin ? 'cursor-default' : 'hover:text-primary transition-colors cursor-pointer'}`}
                      onClick={() => toggleColumn(a.key)}
                      title={superAdmin ? undefined : `Toggle all ${a.label}`}
                    >
                      <span className="text-xs">{a.label}</span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODULES.map((m, idx) => {
                const modPerms = matrix[m.key] ?? {};
                const rowCount = ACTIONS.filter(a => modPerms[a.key]).length;
                const allOn = rowCount === ACTIONS.length;

                return (
                  <tr key={m.key} className={idx % 2 === 0 ? 'bg-muted/20' : ''}>
                    <td className="py-2.5 px-3 border-b border-border">
                      <button
                        className={`text-left font-medium text-foreground ${superAdmin ? 'cursor-default' : 'hover:text-primary transition-colors cursor-pointer'}`}
                        onClick={() => toggleRow(m.key)}
                        title={superAdmin ? undefined : `Toggle all actions for ${m.label}`}
                      >
                        {m.label}
                      </button>
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <DialogFooter className="border-t border-border pt-4 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          {!superAdmin && (
            <Button onClick={handleSave}>Save Permissions</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
