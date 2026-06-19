"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Key, Lock, Bell } from "lucide-react";

export function ClientConfigurationTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Configuration</h3>
        <p className="text-sm text-slate-600">Manage client settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* API Keys */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-slate-600" />
              <CardTitle className="text-base">API Keys</CardTitle>
              <Badge variant="secondary">2 active</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded">
                <div>
                  <p className="text-sm font-medium">Production Key</p>
                  <p className="text-xs text-slate-600">sk_live_****...****</p>
                </div>
                <Button variant="outline" size="sm">Rotate</Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded">
                <div>
                  <p className="text-sm font-medium">Development Key</p>
                  <p className="text-xs text-slate-600">sk_test_****...****</p>
                </div>
                <Button variant="outline" size="sm">Rotate</Button>
              </div>
            </div>
            <Button className="w-full">Generate New Key</Button>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-slate-600" />
              <CardTitle className="text-base">Security</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded">
              <div>
                <p className="text-sm font-medium">Two-Factor Authentication</p>
                <p className="text-xs text-slate-600">Enhance account security</p>
              </div>
              <Badge variant="outline">Disabled</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded">
              <div>
                <p className="text-sm font-medium">IP Whitelisting</p>
                <p className="text-xs text-slate-600">Restrict API access by IP</p>
              </div>
              <Badge variant="outline">Not Set</Badge>
            </div>
            <Button className="w-full">Configure Security</Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-slate-600" />
              <CardTitle className="text-base">Notifications</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 bg-slate-50 rounded cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Order Updates</p>
                  <p className="text-xs text-slate-600">Notify on order status changes</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 bg-slate-50 rounded cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded" />
                <div className="flex-1">
                  <p className="text-sm font-medium">System Alerts</p>
                  <p className="text-xs text-slate-600">Critical system notifications</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 bg-slate-50 rounded cursor-pointer">
                <input type="checkbox" className="rounded" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Weekly Report</p>
                  <p className="text-xs text-slate-600">Receive weekly summary email</p>
                </div>
              </label>
            </div>
            <Button className="w-full">Save Preferences</Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-red-600" />
              <CardTitle className="text-base text-red-600">Danger Zone</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="destructive" className="w-full">Deactivate Client</Button>
            <Button variant="destructive" className="w-full">Delete Client</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
