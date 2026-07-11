import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldCheck, Plus, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface RolePermission {
  module: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: RolePermission[];
}

const MODULES = ['Dashboard', 'Catalog', 'Orders', 'Services', 'Invoices', 'Reports', 'Notifications', 'Addresses', 'Contracts'];

const DEFAULT_ROLE_TEMPLATES: Role[] = [
  {
    id: 'r1',
    name: 'Client Admin',
    description: 'Full access to all portal modules',
    permissions: MODULES.map(m => ({ module: m, view: true, create: true, edit: true, delete: true })),
  },
  {
    id: 'r2',
    name: 'Procurement Manager',
    description: 'Can manage orders and catalog',
    permissions: MODULES.map(m => ({
      module: m,
      view: true,
      create: ['Catalog', 'Orders'].includes(m),
      edit: ['Catalog', 'Orders'].includes(m),
      delete: false,
    })),
  },
  {
    id: 'r3',
    name: 'Purchase Executive',
    description: 'Can place and track orders',
    permissions: MODULES.map(m => ({
      module: m,
      view: true,
      create: m === 'Orders',
      edit: m === 'Orders',
      delete: false,
    })),
  },
  {
    id: 'r4',
    name: 'Finance',
    description: 'Access to invoices and reports',
    permissions: MODULES.map(m => ({
      module: m,
      view: ['Dashboard', 'Invoices', 'Reports'].includes(m),
      create: false,
      edit: false,
      delete: false,
    })),
  },
  {
    id: 'r5',
    name: 'Store Manager',
    description: 'Manages catalog and services',
    permissions: MODULES.map(m => ({
      module: m,
      view: true,
      create: ['Catalog', 'Services'].includes(m),
      edit: ['Catalog', 'Services'].includes(m),
      delete: false,
    })),
  },
  {
    id: 'r6',
    name: 'Approver',
    description: 'Reviews and approves orders',
    permissions: MODULES.map(m => ({
      module: m,
      view: ['Dashboard', 'Orders', 'Services'].includes(m),
      create: false,
      edit: m === 'Orders',
      delete: false,
    })),
  },
  {
    id: 'r7',
    name: 'Employee',
    description: 'Browse catalog and submit requests',
    permissions: MODULES.map(m => ({
      module: m,
      view: ['Dashboard', 'Catalog', 'Orders', 'Services', 'Notifications'].includes(m),
      create: ['Orders'].includes(m),
      edit: false,
      delete: false,
    })),
  },
  {
    id: 'r8',
    name: 'Viewer',
    description: 'Read-only access across all modules',
    permissions: MODULES.map(m => ({ module: m, view: true, create: false, edit: false, delete: false })),
  },
];

const STORE_KEY_PREFIX = 'nido_portal_roles_';

function getRoles(clientId: string): Role[] {
  try {
    const raw = localStorage.getItem(`${STORE_KEY_PREFIX}${clientId}`);
    if (raw) return JSON.parse(raw);
  } catch { /* */ }
  return DEFAULT_ROLE_TEMPLATES;
}

function saveRoles(clientId: string, roles: Role[]): void {
  localStorage.setItem(`${STORE_KEY_PREFIX}${clientId}`, JSON.stringify(roles));
}

const Tick = ({ v }: { v: boolean }) =>
  v ? <Check size={14} className="text-green-600" /> : <X size={14} className="text-gray-300" />;

export default function ClientPortalRolesPage() {
  const { user } = useAuth();
  const clientId = user?.clientId ?? '';
  const isAdmin = user?.userType === 'client_admin' || user?.userType === 'nido_admin';

  const [roles, setRoles] = useState<Role[]>(() => getRoles(clientId));
  const [selected, setSelected] = useState<Role | null>(roles[0] ?? null);
  const [showAdd, setShowAdd] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');

  const handleAddRole = () => {
    if (!newRoleName.trim()) return;
    const r: Role = {
      id: `r-${Date.now()}`,
      name: newRoleName.trim(),
      description: newRoleDesc.trim(),
      permissions: MODULES.map(m => ({ module: m, view: false, create: false, edit: false, delete: false })),
    };
    const updated = [...roles, r];
    setRoles(updated);
    saveRoles(clientId, updated);
    setSelected(r);
    setShowAdd(false);
    setNewRoleName('');
    setNewRoleDesc('');
  };

  const togglePerm = (roleId: string, module: string, perm: keyof RolePermission) => {
    if (!isAdmin || perm === 'module') return;
    const updated = roles.map(r => {
      if (r.id !== roleId) return r;
      return {
        ...r,
        permissions: r.permissions.map(p =>
          p.module === module ? { ...p, [perm]: !p[perm as keyof RolePermission] } : p
        ),
      };
    });
    setRoles(updated);
    saveRoles(clientId, updated);
    setSelected(updated.find(r => r.id === roleId) ?? null);
  };

  return (
    <div className="min-h-screen bg-white p-6">
      {/* Header */}
      <div className="bg-transparent border-b border-gray-200/70 mb-8">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-start">
          <div>
            <p className="text-xs text-gray-500">Portal / Roles</p>
            <h1 className="text-2xl font-bold">Roles & Permissions</h1>
            <p className="text-sm text-gray-500">{user?.clientName}</p>
          </div>
          {isAdmin && (
            <Button onClick={() => setShowAdd(true)} className="flex items-center gap-2">
              <Plus size={16} /> Add Role
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 flex gap-6">
        {/* Role List */}
        <div className="w-64 shrink-0">
          <div className="space-y-1">
            {roles.map(r => (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all ${
                  selected?.id === r.id
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck size={15} className={selected?.id === r.id ? 'text-blue-600' : 'text-gray-400'} />
                  {r.name}
                </div>
                {r.description && (
                  <p className="text-xs text-gray-400 mt-0.5 pl-[23px] truncate">{r.description}</p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Permissions Table */}
        {selected && (
          <div className="flex-1">
            <Card>
              <CardContent className="p-0">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">{selected.name}</h2>
                  {selected.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{selected.description}</p>
                  )}
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b text-xs text-gray-500">
                      <th className="px-6 py-3 text-left">Module</th>
                      <th className="px-6 py-3 text-center">View</th>
                      <th className="px-6 py-3 text-center">Create</th>
                      <th className="px-6 py-3 text-center">Edit</th>
                      <th className="px-6 py-3 text-center">Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.permissions.map(p => (
                      <tr key={p.module} className="border-b last:border-b-0 hover:bg-gray-50">
                        <td className="px-6 py-3 font-medium text-gray-800">{p.module}</td>
                        {(['view', 'create', 'edit', 'delete'] as const).map(perm => (
                          <td
                            key={perm}
                            className="px-6 py-3 text-center"
                            onClick={() => togglePerm(selected.id, p.module, perm)}
                          >
                            <span className={isAdmin ? 'cursor-pointer' : ''}>
                              <Tick v={p[perm] as boolean} />
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {isAdmin && (
                  <div className="px-6 py-3 bg-gray-50 border-t rounded-b-xl">
                    <p className="text-xs text-gray-400">Click any permission cell to toggle it.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Add Role Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Add Role</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newRoleName}
                  onChange={e => setNewRoleName(e.target.value)}
                  placeholder="e.g. Department Head"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newRoleDesc}
                  onChange={e => setNewRoleDesc(e.target.value)}
                  placeholder="Brief description (optional)"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button onClick={handleAddRole}>Create Role</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
