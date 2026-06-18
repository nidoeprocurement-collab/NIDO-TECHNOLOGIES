"use client"

import { useState } from "react"
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

export default function OrderStatusesPage() {
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)

  const [newStatus, setNewStatus] = useState("")

  const [statuses, setStatuses] = useState([
    {
      id: 1,
      color: "#f59e0b",
      name: "Pending",
      description: "Order awaiting review",
      sortOrder: 1,
      visible: true,
      default: true,
    },
    {
      id: 2,
      color: "#f97316",
      name: "Processing",
      description: "Order being processed",
      sortOrder: 2,
      visible: true,
      default: false,
    },
    {
      id: 3,
      color: "#10b981",
      name: "Approved",
      description: "Order approved",
      sortOrder: 3,
      visible: true,
      default: false,
    },
    {
      id: 4,
      color: "#3b82f6",
      name: "Shipped",
      description: "Order shipped",
      sortOrder: 4,
      visible: true,
      default: false,
    },
    {
      id: 5,
      color: "#059669",
      name: "Delivered",
      description: "Order delivered",
      sortOrder: 5,
      visible: true,
      default: false,
    },
    {
      id: 6,
      color: "#ef4444",
      name: "Cancelled",
      description: "Order cancelled",
      sortOrder: 6,
      visible: true,
      default: false,
    },
    {
      id: 7,
      color: "#6b7280",
      name: "On Hold",
      description: "Order on hold",
      sortOrder: 7,
      visible: true,
      default: false,
    },
    {
      id: 8,
      color: "#8b5cf6",
      name: "Returned",
      description: "Order returned",
      sortOrder: 8,
      visible: false,
      default: false,
    },
  ])

  const addStatus = () => {
    if (!newStatus.trim()) return

    const status = {
      id: Date.now(),
      color: "#3b82f6",
      name: newStatus,
      description: "New status",
      sortOrder: statuses.length + 1,
      visible: true,
      default: false,
    }

    setStatuses([...statuses, status])
    setNewStatus("")
    setOpen(false)
  }

  const deleteStatus = (id: number) => {
    setStatuses(statuses.filter((s) => s.id !== id))
  }

  const toggleVisible = (id: number) => {
    setStatuses(
      statuses.map((s) =>
        s.id === id
          ? { ...s, visible: !s.visible }
          : s
      )
    )
  }

  const filteredStatuses = statuses.filter((status) =>
    status.name
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 p-6">
      {/* Header */}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Order Statuses
          </h1>

          <p className="text-muted-foreground">
            Manage and configure order status workflow
          </p>
        </div>

        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Status
        </Button>
      </div>

      {/* Search */}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

        <Input
          placeholder="Search statuses..."
          className="pl-10"
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />
      </div>

      {/* Table */}

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="w-12"></th>

                <th className="px-4 py-4 text-left text-xs uppercase">
                  Color
                </th>

                <th className="px-4 py-4 text-left text-xs uppercase">
                  Status Name
                </th>

                <th className="px-4 py-4 text-left text-xs uppercase">
                  Description
                </th>

                <th className="px-4 py-4 text-left text-xs uppercase">
                  Sort Order
                </th>

                <th className="px-4 py-4 text-left text-xs uppercase">
                  Visible
                </th>

                <th className="px-4 py-4 text-left text-xs uppercase">
                  Default
                </th>

                <th className="px-4 py-4 text-center text-xs uppercase">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredStatuses.map((status) => (
                <tr
                  key={status.id}
                  className="border-b"
                >
                  <td className="px-4 py-4">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </td>

                  <td className="px-4 py-4">
                    <div
                      className="h-6 w-6 rounded-md"
                      style={{
                        backgroundColor:
                          status.color,
                      }}
                    />
                  </td>

                  <td className="px-4 py-4 font-medium">
                    {status.name}
                  </td>

                  <td className="px-4 py-4 text-muted-foreground">
                    {status.description}
                  </td>

                  <td className="px-4 py-4">
                    {status.sortOrder}
                  </td>

                  <td className="px-4 py-4">
                    <Switch
                      checked={status.visible}
                      onCheckedChange={() =>
                        toggleVisible(status.id)
                      }
                    />
                  </td>

                  <td className="px-4 py-4">
                    {status.default && (
                      <Badge variant="secondary">
                        Default
                      </Badge>
                    )}
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          deleteStatus(status.id)
                        }
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Add Status Dialog */}

      <Dialog
        open={open}
        onOpenChange={setOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add Status
            </DialogTitle>
          </DialogHeader>

          <Input
            placeholder="Status Name"
            value={newStatus}
            onChange={(e) =>
              setNewStatus(e.target.value)
            }
          />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>

            <Button onClick={addStatus}>
              Save Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
