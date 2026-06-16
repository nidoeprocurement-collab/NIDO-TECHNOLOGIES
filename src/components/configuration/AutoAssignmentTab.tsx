import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Plus, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const analysts = [
  { name: 'Analyst A', department: 'IT', maxTickets: 20, currentTickets: 12, status: 'Active' },
  { name: 'Analyst B', department: 'IT', maxTickets: 20, currentTickets: 18, status: 'Active' },
  { name: 'Analyst C', department: 'Facility', maxTickets: 15, currentTickets: 5, status: 'Active' },
  { name: 'Analyst D', department: 'Equipment', maxTickets: 15, currentTickets: 8, status: 'Active' },
];

export default function AutoAssignmentTab() {
  const [enabled, setEnabled] = useState(true);
  const [method, setMethod] = useState('round-robin');
  const [scope, setScope] = useState({ orders: true, repairTickets: true, amcRequests: true, returns: true, recycleRequests: true });
  const [businessHoursOnly, setBusinessHoursOnly] = useState(true);
  const [backupAnalyst, setBackupAnalyst] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Auto Assignment</h2>
        <div className="flex gap-2">
          <Button variant="outline">Cancel</Button>
          <Button className="gap-1.5" onClick={() => toast({ title: 'Saved', description: 'Auto assignment settings saved' })}>
            <Save size={14} /> Save
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="analyst-pool">Analyst Pool</TabsTrigger>
          <TabsTrigger value="priority">Priority Override</TabsTrigger>
          <TabsTrigger value="working-hours">Working Hours Rule</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center gap-3">
                <Switch checked={enabled} onCheckedChange={setEnabled} />
                <Label className="font-medium">Enable Auto Assignment</Label>
              </div>
              <p className="text-sm text-muted-foreground">Automatically assign new orders, service tickets, and requests to internal analysts based on defined rules.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="font-medium text-sm">Assignment Scope</Label>
                    <div className="flex flex-wrap gap-3 mt-2">
                      {Object.entries(scope).map(([key, val]) => (
                        <div key={key} className="flex items-center gap-1.5">
                          <Checkbox checked={val} onCheckedChange={v => setScope(p => ({ ...p, [key]: !!v }))} />
                          <Label className="text-xs capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="font-medium text-sm">Assignment Method</Label>
                    <Select value={method} onValueChange={setMethod}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="round-robin">Round Robin</SelectItem>
                        <SelectItem value="load-balanced">Load Balanced</SelectItem>
                        <SelectItem value="skill-based">Skill Based</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">Analysts are cycled in a rotational sequence.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Working Hours Rule</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox checked={businessHoursOnly} onCheckedChange={v => setBusinessHoursOnly(!!v)} />
                        <Label className="text-xs">Assign Only During Business Hours</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox checked={backupAnalyst} onCheckedChange={v => setBackupAnalyst(!!v)} />
                        <Label className="text-xs">Enable Backup Analyst After Hours</Label>
                      </div>
                      {backupAnalyst && <Button variant="outline" size="sm"><Plus size={12} className="mr-1" /> Add Backup Analyst</Button>}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm">Assignment Rules</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span>Priority</span><Badge variant="outline">Priority</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Assign To</span>
                        <Select defaultValue="choose"><SelectTrigger className="w-36 h-7 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="choose">Choose Analyst</SelectItem></SelectContent></Select>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Analyst Availability</span><span className="text-muted-foreground">During Working Hours</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analyst-pool">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Analyst Pool Selection</CardTitle>
                <Button variant="outline" size="sm"><Plus size={12} className="mr-1" /> Add Analyst</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Analyst</TableHead><TableHead>Department</TableHead><TableHead>Max Tickets</TableHead><TableHead>Current Tickets</TableHead><TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analysts.map(a => (
                    <TableRow key={a.name}>
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell>{a.department}</TableCell>
                      <TableCell>{a.maxTickets}</TableCell>
                      <TableCell>{a.currentTickets} {a.currentTickets >= a.maxTickets - 2 && <Badge variant="outline" className="ml-1 text-warning border-warning">Full</Badge>}</TableCell>
                      <TableCell><Badge className="bg-success text-success-foreground border-none">{a.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="priority"><Card><CardContent className="pt-4"><p className="text-muted-foreground">Priority override rules configuration coming soon.</p></CardContent></Card></TabsContent>
        <TabsContent value="working-hours"><Card><CardContent className="pt-4"><p className="text-muted-foreground">Working hours configuration coming soon.</p></CardContent></Card></TabsContent>
      </Tabs>
    </div>
  );
}
