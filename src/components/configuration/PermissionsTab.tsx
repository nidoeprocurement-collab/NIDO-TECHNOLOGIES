import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search, Settings } from 'lucide-react';
import { MODULES } from '@/types';

const permTypes = ['General Permissions', 'Order Management', 'Vendor Management', 'Approval Workflows'];
const accessTypes = ['View', 'SMS', 'Edit', 'Approve', 'Delete'];

export default function PermissionsTab() {
  const { userRoles } = useData();
  const [selectedRole, setSelectedRole] = useState(userRoles[0]?.id || '');
  const [activePermTab, setActivePermTab] = useState('Order Management');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const role = userRoles.find(r => r.id === selectedRole);
  const filteredRoles = userRoles.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Permissions</h2>
          <p className="text-sm text-muted-foreground">Control user access levels and permissions for different roles in your organization.</p>
        </div>
        <Button variant="outline" className="gap-1.5"><Settings size={14} /> Permission Settings</Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="All Roles" /></SelectTrigger>
          <SelectContent>
            {userRoles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
          <Input className="pl-8 h-8 w-40 text-xs" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search" />
        </div>
        <Button className="gap-1.5"><span>+ Create New Role</span></Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Modules</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.map(r => (
                <TableRow key={r.id} className={r.id === selectedRole ? 'bg-accent/50' : ''}>
                  <TableCell><Checkbox checked={r.id === selectedRole} onCheckedChange={() => setSelectedRole(r.id)} /></TableCell>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{r.description}</TableCell>
                  <TableCell>{r.assignedUsers}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.name === 'System Admin' ? 'All Modules' : 'Dashboard | Selected'}</TableCell>
                  <TableCell><Badge className={`${r.status === 'Active' ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'} border-none`}>{r.status}</Badge></TableCell>
                  <TableCell><div className="flex gap-1">{['✏️','⚙️','👁️'].map((e,i)=><span key={i} className="cursor-pointer text-sm">{e}</span>)}</div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {role && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Permissions</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm font-medium">Role:</span>
              <Badge variant="secondary">{role.name}</Badge>
              <span className="text-xs text-muted-foreground italic">{role.description}</span>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activePermTab} onValueChange={setActivePermTab}>
              <TabsList className="h-auto gap-1 bg-muted p-1">
                {permTypes.map(t => (
                  <TabsTrigger key={t} value={t} className="text-xs px-3 py-1.5">{t}</TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value={activePermTab} className="mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Access</TableHead>
                      {MODULES.slice(0, 8).map(m => <TableHead key={m} className="text-center text-xs">{m}</TableHead>)}
                      <TableHead className="text-center">Config</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permTypes.map(pt => (
                      <TableRow key={pt}>
                        <TableCell className="text-sm font-medium">{pt}</TableCell>
                        {MODULES.slice(0, 8).map(m => (
                          <TableCell key={m} className="text-center"><Checkbox defaultChecked={Math.random() > 0.4} /></TableCell>
                        ))}
                        <TableCell className="text-center"><Settings size={14} className="mx-auto text-muted-foreground cursor-pointer" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
            <div className="flex justify-end mt-4">
              <Button>Save Changes</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-4 text-xs">
            <span className="font-medium">Key</span>
            {accessTypes.map((t, i) => (
              <span key={t} className="flex items-center gap-1">
                <span className={`w-3 h-3 rounded-full`} style={{ backgroundColor: ['hsl(210,80%,55%)', 'hsl(180,60%,50%)', 'hsl(142,60%,40%)', 'hsl(38,90%,55%)', 'hsl(0,60%,50%)'][i] }} />
                {t}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
