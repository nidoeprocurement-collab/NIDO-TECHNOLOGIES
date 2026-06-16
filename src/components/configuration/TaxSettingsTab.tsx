import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Save, Pencil, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const defaultTaxes = [
  { id: '1', name: 'CGST', rate: 9, type: 'GST', status: 'Active' },
  { id: '2', name: 'SGST', rate: 9, type: 'GST', status: 'Active' },
  { id: '3', name: 'IGST', rate: 18, type: 'GST', status: 'Active' },
  { id: '4', name: 'VAT', rate: 5, type: 'VAT', status: 'Inactive' },
  { id: '5', name: 'Service Tax', rate: 12, type: 'Service', status: 'Active' },
];

export default function TaxSettingsTab() {
  const [taxes, setTaxes] = useState(defaultTaxes);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', rate: 0, type: 'GST', status: 'Active' });

  const handleAdd = () => {
    if (!form.name) return;
    setTaxes(prev => [...prev, { ...form, id: crypto.randomUUID() }]);
    setDialogOpen(false);
    toast({ title: 'Tax Added', description: `${form.name} added at ${form.rate}%` });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Tax Settings</h2>
          <p className="text-sm text-muted-foreground">Configure GST, VAT & tax rules</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Cancel</Button>
          <Button className="gap-1.5" onClick={() => toast({ title: 'Saved' })}><Save size={14} /> Save</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5"><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-primary">{taxes.filter(t => t.type === 'GST').length}</p><p className="text-xs text-muted-foreground">GST Components</p></CardContent></Card>
        <Card className="bg-success/5"><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-success">{taxes.filter(t => t.status === 'Active').length}</p><p className="text-xs text-muted-foreground">Active Taxes</p></CardContent></Card>
        <Card className="bg-warning/5"><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-warning">{taxes.filter(t => t.type === 'VAT').length}</p><p className="text-xs text-muted-foreground">VAT Rules</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Tax Configuration</CardTitle>
            <Button size="sm" className="gap-1.5" onClick={() => { setForm({ name: '', rate: 0, type: 'GST', status: 'Active' }); setDialogOpen(true); }}><Plus size={14} /> Add Tax</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tax Name</TableHead>
                <TableHead>Rate (%)</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taxes.map(tax => (
                <TableRow key={tax.id}>
                  <TableCell className="font-medium">{tax.name}</TableCell>
                  <TableCell>{tax.rate}%</TableCell>
                  <TableCell><Badge variant="outline">{tax.type}</Badge></TableCell>
                  <TableCell><Badge className={`${tax.status === 'Active' ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'} border-none`}>{tax.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon"><Pencil size={14} /></Button>
                    <Button variant="ghost" size="icon"><Trash2 size={14} className="text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Tax</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Tax Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g., CGST" /></div>
            <div><Label>Rate (%)</Label><Input type="number" value={form.rate} onChange={e => setForm(p => ({ ...p, rate: Number(e.target.value) }))} /></div>
            <div><Label>Type</Label>
              <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="GST">GST</SelectItem><SelectItem value="VAT">VAT</SelectItem><SelectItem value="Service">Service</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
