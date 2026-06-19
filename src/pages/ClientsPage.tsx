"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { MoreVertical, Users, Plus, Download, Upload, FileDown, Archive } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function ClientsPageUI() {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState("All")

  const stats = {
    premium: 0,
    active: 14,
    pending: 0,
    inactive: 0,
  }

  const clients = [
    {
      id: "CI-00024",
      name: "raj",
      rep: "raj",
      email: "raj@info.com",
      status: "active",
    },
    {
      id: "CI-00023",
      name: "veera industries",
      rep: "Veeru",
      email: "Veeru@indu.com",
      status: "active",
    },
    {
      id: "CI-00020",
      name: "Nitin Supplies",
      rep: "Nitin Shetty",
      email: "nitinshetty@gmail.com",
      status: "active",
    },
    {
      id: "CI-00021",
      name: "Mohan Textiles",
      rep: "Mohan Bhat",
      email: "mohanbhat@gmail.com",
      status: "active",
    },
    {
      id: "CI-00008",
      name: "Naveen Solutions",
      rep: "Naveen Kumar",
      email: "naveenkumar@gmail.com",
      status: "active",
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between">
          <div>
            <p className="text-xs text-gray-500">Clients / Client List</p>
            <h1 className="text-2xl font-bold">Clients</h1>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem className="cursor-pointer">
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Download className="h-4 w-4 mr-2" />
                Export Clients
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Bulk Import
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <FileDown className="h-4 w-4 mr-2" />
                Download Template
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Archive className="h-4 w-4 mr-2" />
                Archived Clients
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {/* Premium */}
          <Card>
            <CardContent className="p-6 flex justify-between">
              <div>
                <p className="text-sm text-gray-600">Premium Clients</p>
                <p className="text-3xl font-bold mt-2">
                  {stats.premium}
                </p>
              </div>
              <Users className="text-gray-400" />
            </CardContent>
          </Card>

          {/* Active */}
          <Card>
            <CardContent className="p-6 flex justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Clients</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {stats.active}
                </p>
              </div>
              <Users className="text-green-400" />
            </CardContent>
          </Card>

          {/* Pending */}
          <Card>
            <CardContent className="p-6 flex justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  {stats.pending}
                </p>
              </div>
              <Users className="text-orange-400" />
            </CardContent>
          </Card>

          {/* Inactive */}
          <Card>
            <CardContent className="p-6 flex justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactive</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {stats.inactive}
                </p>
              </div>
              <Users className="text-red-400" />
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b text-xs text-gray-600">
                  <th className="px-6 py-4 text-left">
                    <input type="checkbox" />
                  </th>
                  <th className="px-6 py-4 text-left">Client ID</th>
                  <th className="px-6 py-4 text-left">Client Name</th>
                  <th className="px-6 py-4 text-left">Representative</th>
                  <th className="px-6 py-4 text-left">Email</th>
                  <th className="px-6 py-4 text-left">Total Spend (USD)</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>

              <tbody>
                {clients.map((c, i) => (
                  <tr
                    key={i}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <input type="checkbox" />
                    </td>

                    <td 
                      className="px-6 py-4 text-blue-600 font-medium cursor-pointer hover:underline"
                      onClick={() => navigate(`/clients/${c.id}`)}
                    >
                      {c.id}
                    </td>

                    <td className="px-6 py-4">{c.name}</td>
                    <td className="px-6 py-4">{c.rep}</td>
                    <td className="px-6 py-4">{c.email}</td>
                    <td className="px-6 py-4">$0</td>

                    <td className="px-6 py-4">
                      <Badge className="bg-green-100 text-green-800">
                        {c.status}
                      </Badge>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            Archive
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="px-6 py-4 flex justify-between text-sm text-gray-600 border-t">
              <span>1-10 of 03 clients</span>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-gray-100 rounded">←</button>
                <button className="px-3 py-1 border rounded">1</button>
                <button className="p-2 hover:bg-gray-100 rounded">→</button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
