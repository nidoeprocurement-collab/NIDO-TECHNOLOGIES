import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Filter } from 'lucide-react';
import { ORDER_STATUS_COLORS } from '@/types';

export default function OrderStatusesTab() {
  const { orderStatuses, addOrderStatus, updateOrderStatus, deleteOrderStatus } = useData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', color: ORDER_STATUS_COLORS[0].value, description: '', isDefault: false, order: 0 });
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredStatuses = filterStatus === 'all'
    ? orderStatuses
    : orderStatuses.filter(s => s.name.toLowerCase() === filterStatus.toLowerCase());

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: '', color: ORDER_STATUS_COLORS[0].value, description: '', isDefault: false, order: orderStatuses.length + 1 });
    setDialogOpen(true);
  };

  const openEdit = (id: string) => {
    const s = orderStatuses.find(s => s.id === id);
    if (!s) return;
    setEditingId(id);
    setForm({ name: s.name, color: s.color, description: s.description, isDefault: s.isDefault, order: s.order });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast({ title: 'Error', description: 'Status name is required', variant: 'destructive' });
      return;
    }
    if (editingId) {
      updateOrderStatus(editingId, form);
      toast({ title: 'Updated', description: `Status "${form.name}" updated` });
    } else {
      addOrderStatus(form);
      toast({ title: 'Created', description: `Status "${form.name}" created` });
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    const s = orderStatuses.find(s => s.id === id);
    if (s?.isDefault) {
      toast({ title: 'Error', description: 'Cannot delete default status', variant: 'destructive' });
      return;
    }
    deleteOrderStatus(id);
    toast({ title: 'Deleted', description: 'Status removed' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Order Statuses</h2>
          <p className="text-sm text-muted-foreground">Define and manage order status options with assigned colors</p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus size={14} /> Add Status
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Status List</CardTitle>
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-muted-foreground" />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40 h-8 text-xs">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {orderStatuses.map(s => (
                    <SelectItem key={s.id} value={s.name.toLowerCase()}>
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                        {s.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Status Name</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Default</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStatuses.map((status, idx) => (
                <TableRow key={status.id}>
                  <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell>
                    <Badge style={{ backgroundColor: status.color, color: '#fff', border: 'none' }}>
                      {status.name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded" style={{ backgroundColor: status.color }} />
                      <span className="text-xs text-muted-foreground">
                        {ORDER_STATUS_COLORS.find(c => c.value === status.color)?.label || 'Custom'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{status.description}</TableCell>
                  <TableCell>{status.isDefault ? <Badge variant="secondary">Default</Badge> : '–'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(status.id)}><Pencil size={14} /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(status.id)}><Trash2 size={14} className="text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-xs text-muted-foreground mt-3">Showing {filteredStatuses.length} of {orderStatuses.length} statuses</p>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Status' : 'Create New Status'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Status Name</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g., In Transit" />
            </div>
            <div>
              <Label>Assigned Color</Label>
              <Select value={form.color} onValueChange={v => setForm(p => ({ ...p, color: v }))}>
                <SelectTrigger>
                  <SelectValue>
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded" style={{ backgroundColor: form.color }} />
                      {ORDER_STATUS_COLORS.find(c => c.value === form.color)?.label || 'Custom'}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUS_COLORS.map(c => (
                    <SelectItem key={c.value} value={c.value}>
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded" style={{ backgroundColor: c.value }} />
                        {c.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.isDefault} onChange={e => setForm(p => ({ ...p, isDefault: e.target.checked }))} id="isDefault" />
              <Label htmlFor="isDefault">Set as default status</Label>
            </div>

            <div className="mt-2">
              <Label className="text-xs text-muted-foreground">Preview</Label>
              <div className="mt-1">
                <Badge style={{ backgroundColor: form.color, color: '#fff', border: 'none' }}>
                  {form.name || 'Status Name'}
                </Badge>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingId ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
