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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function OrderStatusesPage() {
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)

  const [statusName, setStatusName] = useState("")
  const [description, setDescription] = useState("")
  const [sortOrder, setSortOrder] = useState("0")
  const [visible, setVisible] = useState(true)
  const [color, setColor] = useState("#3B82F6")

  const colors = [
    { name: "Blue", value: "#3B82F6" },
    { name: "Red", value: "#EF4444" },
    { name: "Green", value: "#10B981" },
    { name: "Yellow", value: "#EAB308" },
    { name: "Orange", value: "#F97316" },
    { name: "Purple", value: "#8B5CF6" },
    { name: "Pink", value: "#EC4899" },
    { name: "Rose", value: "#F43F5E" },
    { name: "Indigo", value: "#6366F1" },
    { name: "Teal", value: "#14B8A6" },
    { name: "Cyan", value: "#06B6D4" },
    { name: "Emerald", value: "#059669" },
    { name: "Amber", value: "#F59E0B" },
    { name: "Lime", value: "#84CC16" },
    { name: "Gray", value: "#6B7280" },
    { name: "Slate", value: "#64748B" },
    { name: "Black", value: "#111827" },
  ]

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
  ])

  const addStatus = () => {
    if (!statusName.trim()) return

    const status = {
      id: Date.now(),
      color,
      name: statusName,
      description,
      sortOrder: Number(sortOrder),
      visible,
      default: false,
    }

    setStatuses([...statuses, status])

    setStatusName("")
    setDescription("")
    setSortOrder("0")
    setVisible(true)
    setColor("#3B82F6")

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

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="w-12"></th>
                <th className="px-4 py-2 text-left">Color</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2 text-left">Sort</th>
                <th className="px-4 py-2 text-left">Visible</th>
                <th className="px-4 py-2 text-left">Default</th>
                <th className="px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredStatuses.map((status) => (
                <tr key={status.id} className="border-b">
                  <td className="px-4 py-4">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </td>

                  <td className="px-4 py-4">
                    <div
                      className="h-6 w-6 rounded"
                      style={{
                        backgroundColor: status.color,
                      }}
                    />
                  </td>

                  <td className="px-4 py-2 font-medium">
                    {status.name}
                  </td>

                  <td className="px-4 py-4">
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
                      <Badge>Default</Badge>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Add Order Status
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div>
              <Label>Status Name</Label>
              <Input
                value={statusName}
                onChange={(e) =>
                  setStatusName(e.target.value)
                }
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
              />
            </div>

            <div>
              <Label>Color</Label>

              <div className="flex gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) =>
                    setColor(e.target.value)
                  }
                />

                <Select
                  value={color}
                  onValueChange={setColor}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {colors.map((item) => (
                      <SelectItem
                        key={item.value}
                        value={item.value}
                      >
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={sortOrder}
                onChange={(e) =>
                  setSortOrder(e.target.value)
                }
              />
            </div>

            <div className="flex items-center justify-between border rounded-lg p-4">
              <Label>Visible</Label>

              <Switch
                checked={visible}
                onCheckedChange={setVisible}
              />
            </div>

            <div>
              <Label>Preview</Label>

              <div className="mt-2">
                <Badge
                  style={{
                    backgroundColor: color,
                    color: "white",
                  }}
                >
                  {statusName || "New Status"}
                </Badge>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>

            <Button onClick={addStatus}>
              Create Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}