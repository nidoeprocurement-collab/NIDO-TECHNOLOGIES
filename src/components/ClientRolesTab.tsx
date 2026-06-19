"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Shield, Settings } from "lucide-react";

const roles = [
  {
    id: 1,
    name: "Admin",
    description: "Full administrative access",
    users: 2,
    permissions: ["Read", "Write", "Delete", "Manage Users"],
    color: "bg-red-100 text-red-800",
  },
  {
    id: 2,
    name: "Manager",
    description: "Management level access",
    users: 5,
    permissions: ["Read", "Write", "Manage Orders"],
    color: "bg-blue-100 text-blue-800",
  },
  {
    id: 3,
    name: "User",
    description: "Standard user access",
    users: 12,
    permissions: ["Read", "Write"],
    color: "bg-green-100 text-green-800",
  },
  {
    id: 4,
    name: "Viewer",
    description: "Read-only access",
    users: 8,
    permissions: ["Read"],
    color: "bg-gray-100 text-gray-800",
  },
];

export function ClientRolesTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Client Roles</h3>
          <p className="text-sm text-slate-600">Manage roles and permissions for this client</p>
        </div>
        <Button>Add New Role</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((role) => (
          <Card key={role.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{role.name}</CardTitle>
                  <p className="text-sm text-slate-600 mt-1">{role.description}</p>
                </div>
                <Shield className="h-5 w-5 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-600" />
                <span className="text-sm font-medium">{role.users} users</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-2">Permissions:</p>
                <div className="flex flex-wrap gap-2">
                  {role.permissions.map((perm) => (
                    <span key={perm} className={`text-xs px-2 py-1 rounded ${role.color}`}>
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">Edit</Button>
                <Button variant="outline" size="sm" className="flex-1">Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
