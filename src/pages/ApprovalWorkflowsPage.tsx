"use client"

import { useState } from "react"
import {
  Plus,
  Trash2,
  Clock,
  Mail,
  ArrowRight,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

import { Input } from "@/components/ui/input"

export default function ApprovalWorkflowsPage() {
  const [open, setOpen] = useState(false)

  const [workflows, setWorkflows] = useState([
    {
      id: 1,
      name: "Standard Purchase",
      module: "Procure",
      steps: 2,
      sla: "24h",
      escalation: "admin@nidotech.com",
      active: true,
    },
    {
      id: 2,
      name: "High Value Purchase",
      module: "Procure",
      steps: 3,
      sla: "48h",
      escalation: "owner@nidotech.com",
      active: true,
    },
    {
      id: 3,
      name: "Vendor Onboarding",
      module: "Vendors",
      steps: 2,
      sla: "72h",
      escalation: "admin@nidotech.com",
      active: true,
    },
  ])

  const [newWorkflow, setNewWorkflow] = useState("")

  const addWorkflow = () => {
    if (!newWorkflow.trim()) return

    const workflow = {
      id: Date.now(),
      name: newWorkflow,
      module: "Procure",
      steps: 1,
      sla: "24h",
      escalation: "admin@nidotech.com",
      active: true,
    }

    setWorkflows([...workflows, workflow])
    setNewWorkflow("")
    setOpen(false)
  }

  const deleteWorkflow = (id: number) => {
    setWorkflows(workflows.filter((w) => w.id !== id))
  }

  const toggleWorkflow = (id: number) => {
    setWorkflows(
      workflows.map((w) =>
        w.id === id
          ? { ...w, active: !w.active }
          : w
      )
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Approval Workflows
          </h1>

          <p className="text-muted-foreground">
            Configure approval chains and escalation rules
          </p>
        </div>

        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Workflow
        </Button>
      </div>

      {/* Workflow Table */}

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="px-4 py-4 text-left text-xs font-semibold uppercase">
                  Workflow Name
                </th>

                <th className="px-4 py-4 text-left text-xs font-semibold uppercase">
                  Module
                </th>

                <th className="px-4 py-4 text-left text-xs font-semibold uppercase">
                  Steps
                </th>

                <th className="px-4 py-4 text-left text-xs font-semibold uppercase">
                  SLA
                </th>

                <th className="px-4 py-4 text-left text-xs font-semibold uppercase">
                  Escalation
                </th>

                <th className="px-4 py-4 text-left text-xs font-semibold uppercase">
                  Status
                </th>

                <th className="px-4 py-4 text-center text-xs font-semibold uppercase">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {workflows.map((workflow) => (
                <tr
                  key={workflow.id}
                  className="border-b"
                >
                  <td className="px-4 py-4 font-medium">
                    {workflow.name}
                  </td>

                  <td className="px-4 py-4">
                    <Badge variant="outline">
                      {workflow.module}
                    </Badge>
                  </td>

                  <td className="px-4 py-4">
                    {workflow.steps} steps
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {workflow.sla}
                    </div>
                  </td>

                  <td className="px-4 py-4 text-muted-foreground">
                    {workflow.escalation}
                  </td>

                  <td className="px-4 py-4">
                    <Switch
                      checked={workflow.active}
                      onCheckedChange={() =>
                        toggleWorkflow(workflow.id)
                      }
                    />
                  </td>

                  <td className="px-4 py-4 text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        deleteWorkflow(workflow.id)
                      }
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Flow 1 */}

      <Card>
        <CardContent className="p-5">
          <h3 className="mb-4 font-semibold">
            Approver Flow: Standard Purchase
          </h3>

          <div className="flex items-center gap-4">
            <div className="rounded-xl border bg-blue-50 p-4 text-center">
              <p className="text-xs text-muted-foreground">
                STEP 1
              </p>
              <p className="font-medium">
                Procurement Manager
              </p>
            </div>

            <ArrowRight />

            <div className="rounded-xl border bg-blue-50 p-4 text-center">
              <p className="text-xs text-muted-foreground">
                STEP 2
              </p>
              <p className="font-medium">Admin</p>
            </div>

            <ArrowRight />

            <div className="rounded-xl border bg-green-50 p-4 text-center">
              <p className="text-xs text-muted-foreground">
                FINAL
              </p>
              <p className="font-medium text-green-600">
                Approved
              </p>
            </div>
          </div>

          <div className="mt-4 flex gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              SLA: 24 hours
            </div>

            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Escalation: admin@nidotech.com
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flow 2 */}

      <Card>
        <CardContent className="p-5">
          <h3 className="mb-4 font-semibold">
            Approver Flow: High Value Purchase
          </h3>

          <div className="flex items-center gap-4">
            <div className="rounded-xl border bg-blue-50 p-4 text-center">
              <p className="text-xs text-muted-foreground">
                STEP 1
              </p>
              <p className="font-medium">
                Procurement Manager
              </p>
            </div>

            <ArrowRight />

            <div className="rounded-xl border bg-blue-50 p-4 text-center">
              <p className="text-xs text-muted-foreground">
                STEP 2
              </p>
              <p className="font-medium">Admin</p>
            </div>

            <ArrowRight />

            <div className="rounded-xl border bg-blue-50 p-4 text-center">
              <p className="text-xs text-muted-foreground">
                STEP 3
              </p>
              <p className="font-medium">Owner</p>
            </div>

            <ArrowRight />

            <div className="rounded-xl border bg-green-50 p-4 text-center">
              <p className="text-xs text-muted-foreground">
                FINAL
              </p>
              <p className="font-medium text-green-600">
                Approved
              </p>
            </div>
          </div>

          <div className="mt-4 flex gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              SLA: 48 hours
            </div>

            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Escalation: owner@nidotech.com
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Workflow Dialog */}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add Workflow
            </DialogTitle>
          </DialogHeader>

          <Input
            placeholder="Workflow Name"
            value={newWorkflow}
            onChange={(e) =>
              setNewWorkflow(e.target.value)
            }
          />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>

            <Button onClick={addWorkflow}>
              Save Workflow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
```
