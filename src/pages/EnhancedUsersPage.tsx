"use client";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";


import {
  Users,
  Hourglass,
  X,
  MoreVertical,
  Plus,
  Mail,
  Phone,
} from "lucide-react";

export default function ClientUsersPage() {
  const users = [
    {
      id: "4dfca191-a84f-459f-98b5-52c5ecda333b",
      name: "lok",
      role: "Accounts Payable",
      email: "lok@gmail.com",
      phone: "9784547852",
      lastActive: "2026-06-10T11:57:33.202Z",
      avatar: "L",
    },
    {
      id: "3c57db4e-17c7-4a9c-a89d-8c8600298457",
      name: "ramesh",
      role: "Accounts Payable",
      email: "rame@info.com",
      phone: "81247854785",
      lastActive: "2026-06-10T11:51:13.659Z",
      avatar: "R",
    },
  ];

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <div className="text-sm text-muted-foreground">
          Clients / Veera Industries
        </div>

        {/* Page Title */}
        <div>
          <h1 className="text-3xl font-bold">
            Veera Industries
          </h1>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="overview">
              Overview
            </TabsTrigger>
            <TabsTrigger value="roles">
              Roles
            </TabsTrigger>
            <TabsTrigger value="users">
              Users
            </TabsTrigger>
            <TabsTrigger value="orders">
              Orders
            </TabsTrigger>
            <TabsTrigger value="services">
              Services
            </TabsTrigger>
            <TabsTrigger value="catalog">
              Catalog
            </TabsTrigger>
            <TabsTrigger value="activity">
              Activity
            </TabsTrigger>
            <TabsTrigger value="configuration">
              Configuration
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Users
          </h2>

          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Users
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100">
                <Users className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Total Users
                </p>
                <h3 className="text-2xl font-bold">
                  2
                </h3>
                <p className="text-xs text-green-600">
                  2 Active
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-yellow-100">
                <Hourglass className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Pending
                </p>
                <h3 className="text-2xl font-bold">
                  0
                </h3>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-red-100">
                <X className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Inactive
                </p>
                <h3 className="text-2xl font-bold">
                  0
                </h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Name / Role</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>

              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium text-blue-600">
                      {user.id}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-600">
                          {user.avatar}
                        </div>

                        <div>
                          <p className="font-medium">
                            {user.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {user.role}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {user.email}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {user.phone}
                      </div>
                    </TableCell>

                    <TableCell>
                      {user.lastActive}
                    </TableCell>

                    <TableCell>
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        Active
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
