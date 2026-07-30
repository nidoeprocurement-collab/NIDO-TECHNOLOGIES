"use client"

import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
  getClients as getStoredClients,
  saveClients as saveStoredClients,
  getArchivedClients,
  saveArchivedClients,
  type StoredClient,
  type ArchivedClient,
} from "@/lib/clientStore"
import { provisionClientPortal, isClientProvisioned, type ProvisionResult } from "@/lib/portalUserStore"
import { MoreVertical, Users, Plus, Download, Upload, FileDown, Archive, Zap, Copy, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const STATUS_FILTERS = ["All", "Active", "Pending", "Inactive", "Premium"]

function statusBadgeClass(status: string) {
  switch ((status || "").toLowerCase()) {
    case "active":   return "bg-green-100 text-green-800"
    case "pending":  return "bg-orange-100 text-orange-800"
    case "inactive": return "bg-red-100 text-red-800"
    case "archived": return "bg-red-100 text-red-800"
    default:         return "bg-gray-100 text-gray-800"
  }
}

function formatCurrency(value: any): string {
  const num = parseFloat(value)
  if (isNaN(num)) return "₹0"
  return `₹${num.toLocaleString("en-IN")}`
}

export default function ClientsPageUI() {
  const navigate = useNavigate()

  const [activeFilter, setActiveFilter] = useState("All")
  const [showArchivedClients, setShowArchivedClients] = useState(false)
  const [selectedArchivedClient, setSelectedArchivedClient] = useState<any>(null)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [allClients, setAllClientsState] = useState<StoredClient[]>(() => getStoredClients())
  const [archivedClientsList, setArchivedClientsList] = useState<ArchivedClient[]>(() => getArchivedClients())

  // Portal provisioning
  const [provisionResult, setProvisionResult] = useState<(ProvisionResult & { clientName: string }) | null>(null)
  const [copiedField, setCopiedField] = useState<"email" | "password" | null>(null)

  const setAllClients = (clients: StoredClient[]) => {
    setAllClientsState(clients)
    saveStoredClients(clients)
  }

  const setArchivedClients = (clients: ArchivedClient[]) => {
    setArchivedClientsList(clients)
    saveArchivedClients(clients)
  }

  const handleProvision = (c: StoredClient) => {
    const result = provisionClientPortal(c.id, c.name)
    setProvisionResult({ ...result, clientName: c.name })
  }

  const copyToClipboard = (text: string, field: "email" | "password") => {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  useEffect(() => {
    setAllClientsState(getStoredClients())
    setArchivedClientsList(getArchivedClients())
    const onUpdate = () => setAllClientsState(getStoredClients())
    window.addEventListener("nidoClientsUpdated", onUpdate)
    return () => window.removeEventListener("nidoClientsUpdated", onUpdate)
  }, [])

  // Computed stats from real data
  const stats = useMemo(() => ({
    premium:  allClients.filter(c => (c.tier || "").toLowerCase() === "premium").length,
    active:   allClients.filter(c => (c.status || "").toLowerCase() === "active").length,
    pending:  allClients.filter(c => (c.status || "").toLowerCase() === "pending").length,
    inactive: allClients.filter(c => (c.status || "").toLowerCase() === "inactive").length,
  }), [allClients])

  // Filtered clients based on activeFilter
  const displayedClients = useMemo(() => {
    switch (activeFilter) {
      case "Active":   return allClients.filter(c => (c.status || "").toLowerCase() === "active")
      case "Pending":  return allClients.filter(c => (c.status || "").toLowerCase() === "pending")
      case "Inactive": return allClients.filter(c => (c.status || "").toLowerCase() === "inactive")
      case "Premium":  return allClients.filter(c => (c.tier || "").toLowerCase() === "premium")
      default:         return allClients
    }
  }, [allClients, activeFilter])

  const handleDownloadTemplate = () => {
    const template = `Client ID,Company Name,Category,Client Tier,Contact Person,Email,Phone,Mobile,Website,Contract Start Date,Contract End Date,GST Treatment,GSTIN,Source of Supply,PAN Number,Currency,Opening Balance,Payment Terms,TDS Rate,Bank Name,Account Number,IFSC Code,Branch,Billing Address,Billing City,Billing State,Billing Pincode,Shipping Address,Shipping City,Shipping State,Shipping Pincode
CL-00001,Company Name,IT Hardware,Premium,John Doe,john@company.com,+91 98765 43210,+91 99876 54321,www.company.com,2024-01-01,2025-01-01,Registered Business,27AABCT1234A1Z5,Maharashtra,AAAAA0000A,INR,50000,Net 30,1.0,ICICI Bank,9876543210,ICIC0001234,Mumbai,123 Business Street,Mumbai,Maharashtra,400001,123 Business Street,Mumbai,Maharashtra,400001`
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "client-template.csv"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportClients = () => {
    const headers = "Client ID,Company Name,Category,Client Tier,Representative,Email,Phone,Status,Opening Balance,Contract Start,Contract End,Billing City,Billing State\n"
    const rows = allClients.map(c =>
      [
        c.id, c.name, c.category || "", c.tier || "", c.rep || "",
        c.email || "", c.phone || "", c.status || "",
        c.openingBalance || "0", c.contractStartDate || "",
        c.contractEndDate || "", c.billingCity || "", c.billingState || "",
      ].join(",")
    ).join("\n")
    const blob = new Blob([headers + rows], { type: "text/csv" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "clients-export.csv"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleBulkImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string
        const lines = csv.split("\n")
        const headers = lines[0].split(",").map(h => h.trim())

        const maxId = allClients.length > 0
          ? Math.max(...allClients.map(c => parseInt(c.id.replace("CI-", "")) || 0))
          : 0

        const newClients: StoredClient[] = lines.slice(1)
          .filter(line => line.trim())
          .map((line, index) => {
            const values = line.split(",").map(v => v.trim())
            const clientData: Record<string, string> = {}
            headers.forEach((header, idx) => { clientData[header] = values[idx] || "" })
            const id = clientData["Client ID"] || `CI-${String(maxId + index + 1).padStart(5, "0")}`
            return {
              id,
              name: clientData["Company Name"] || "",
              category: clientData["Category"] || "",
              tier: clientData["Client Tier"] || "",
              rep: clientData["Contact Person"] || "",
              email: clientData["Email"] || "",
              phone: clientData["Phone"] || "",
              mobile: clientData["Mobile"] || "",
              website: clientData["Website"] || "",
              contractStartDate: clientData["Contract Start Date"] || "",
              contractEndDate: clientData["Contract End Date"] || "",
              gstTreatment: clientData["GST Treatment"] || "",
              gstin: clientData["GSTIN"] || "",
              sourceOfSupply: clientData["Source of Supply"] || "",
              pan: clientData["PAN Number"] || "",
              currency: clientData["Currency"] || "",
              openingBalance: clientData["Opening Balance"] || "",
              paymentTerms: clientData["Payment Terms"] || "",
              tdsRate: clientData["TDS Rate"] || "",
              bankName: clientData["Bank Name"] || "",
              accountNumber: clientData["Account Number"] || "",
              ifscCode: clientData["IFSC Code"] || "",
              branch: clientData["Branch"] || "",
              billingAddress: clientData["Billing Address"] || "",
              billingCity: clientData["Billing City"] || "",
              billingState: clientData["Billing State"] || "",
              billingPincode: clientData["Billing Pincode"] || "",
              shippingAddress: clientData["Shipping Address"] || "",
              shippingCity: clientData["Shipping City"] || "",
              shippingState: clientData["Shipping State"] || "",
              shippingPincode: clientData["Shipping Pincode"] || "",
              status: "active",
            }
          })

        // Merge imported clients into the store (skip duplicates by ID)
        const existingIds = new Set(allClients.map(c => c.id))
        const toAdd = newClients.filter(c => !existingIds.has(c.id))
        setAllClients([...allClients, ...toAdd])
        setShowBulkImport(false)
      } catch (error) {
        console.error("Error parsing CSV:", error)
        alert("Error parsing CSV file. Please check the format.")
      }
    }
    reader.readAsText(file)
  }

  const handleArchive = (client: StoredClient) => {
    setAllClients(allClients.filter(c => c.id !== client.id))
    const archived: ArchivedClient = { ...client, status: "archived", archivedOn: new Date().toISOString().split("T")[0] }
    setArchivedClients([...archivedClientsList, archived])
  }

  return (
    <div className="min-h-screen bg-white p-2">
      {/* Header */}
      <div className="bg-transparent border-b border-gray-200/70">
        <div className="w-full px-2 py-2 flex justify-between">
          <div>
            <p className="text-xs text-gray-500">Clients / Client List</p>
            <h1 className="text-2xl font-bold">Clients</h1>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/clients/add")}>
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={handleExportClients}>
                <Download className="h-4 w-4 mr-2" />
                Export Clients
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => setShowBulkImport(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Bulk Import
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={handleDownloadTemplate}>
                <FileDown className="h-4 w-4 mr-2" />
                Download Template
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => setShowArchivedClients(true)}>
                <Archive className="h-4 w-4 mr-2" />
                Archived Clients ({archivedClientsList.length})
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="w-full px-2 py-2">
        {/* Stats tiles — computed from real data */}
        <div className="grid grid-cols-4 gap-2 mb-2">
          <Card className={`cursor-pointer transition-shadow hover:shadow-md ${activeFilter === "Premium" ? "ring-2 ring-blue-400" : ""}`} onClick={() => setActiveFilter(activeFilter === "Premium" ? "All" : "Premium")}>
            <CardContent className="p-3 flex justify-between">
              <div>
                <p className="text-sm text-gray-600">Premium Clients</p>
                <p className="text-3xl font-bold mt-2">{stats.premium}</p>
              </div>
              <Users className="text-gray-400" />
            </CardContent>
          </Card>

          <Card className={`cursor-pointer transition-shadow hover:shadow-md ${activeFilter === "Active" ? "ring-2 ring-green-400" : ""}`} onClick={() => setActiveFilter(activeFilter === "Active" ? "All" : "Active")}>
            <CardContent className="p-3 flex justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Clients</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.active}</p>
              </div>
              <Users className="text-green-400" />
            </CardContent>
          </Card>

          <Card className={`cursor-pointer transition-shadow hover:shadow-md ${activeFilter === "Pending" ? "ring-2 ring-orange-400" : ""}`} onClick={() => setActiveFilter(activeFilter === "Pending" ? "All" : "Pending")}>
            <CardContent className="p-3 flex justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{stats.pending}</p>
              </div>
              <Users className="text-orange-400" />
            </CardContent>
          </Card>

          <Card className={`cursor-pointer transition-shadow hover:shadow-md ${activeFilter === "Inactive" ? "ring-2 ring-red-400" : ""}`} onClick={() => setActiveFilter(activeFilter === "Inactive" ? "All" : "Inactive")}>
            <CardContent className="p-3 flex justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactive</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{stats.inactive}</p>
              </div>
              <Users className="text-red-400" />
            </CardContent>
          </Card>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 mb-2">
          {STATUS_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                activeFilter === f
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b text-xs text-gray-600">
                  <th className="px-6 py-2 text-left"><input type="checkbox" /></th>
                  <th className="px-6 py-2 text-left">Client ID</th>
                  <th className="px-6 py-2 text-left">Client Name</th>
                  <th className="px-6 py-2 text-left">Categories</th>
                  <th className="px-6 py-2 text-left">Representative</th>
                  <th className="px-6 py-2 text-left">Email</th>
                  <th className="px-6 py-2 text-left">Opening Balance</th>
                  <th className="px-6 py-2 text-left">Status</th>
                  <th className="px-6 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedClients.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-gray-400 text-sm">
                      No clients found{activeFilter !== "All" ? ` for filter "${activeFilter}"` : ""}.
                    </td>
                  </tr>
                ) : (
                  displayedClients.map((c, i) => (
                    <tr key={c.id ?? i} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4"><input type="checkbox" /></td>
                      <td
                        className="px-6 py-2 text-blue-600 font-medium cursor-pointer hover:underline"
                        onClick={() => navigate(`/clients/${c.id}`)}
                      >
                        {c.id}
                      </td>
                      <td className="px-6 py-4">{c.name}</td>
                      <td className="px-6 py-4">{c.category || "-"}</td>
                      <td className="px-6 py-4">{c.rep || "-"}</td>
                      <td className="px-6 py-4">{c.email || "-"}</td>
                      <td className="px-6 py-4">{formatCurrency(c.openingBalance)}</td>
                      <td className="px-6 py-4">
                        <Badge className={statusBadgeClass(c.status || "")}>
                          {c.status || "unknown"}
                        </Badge>
                      </td>
                      <td className="px-6 py-2 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/clients/${c.id}/edit`)}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer" onClick={() => handleProvision(c)}>
                              <Zap className="h-4 w-4 mr-2 text-purple-600" />
                              {isClientProvisioned(c.id) ? "Re-provision Portal" : "Provision Client Portal"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600 cursor-pointer"
                              onClick={() => handleArchive(c)}
                            >
                              Archive
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination — dynamic */}
            <div className="px-6 py-2 flex justify-between text-sm text-gray-600 border-t">
              <span>
                {displayedClients.length} of {allClients.length} client{allClients.length !== 1 ? "s" : ""}
                {activeFilter !== "All" ? ` (filtered: ${activeFilter})` : ""}
              </span>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-gray-100 rounded">←</button>
                <button className="px-3 py-1 border rounded">1</button>
                <button className="p-2 hover:bg-gray-100 rounded">→</button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Archived Clients Modal */}
      {showArchivedClients && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between p-4 border-b bg-white">
              <h2 className="text-lg font-semibold">Archived Clients ({archivedClientsList.length})</h2>
              <button onClick={() => setShowArchivedClients(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2 font-semibold text-sm">Client ID</th>
                      <th className="text-left py-2 px-2 font-semibold text-sm">Company Name</th>
                      <th className="text-left py-2 px-2 font-semibold text-sm">Categories</th>
                      <th className="text-left py-2 px-2 font-semibold text-sm">Representative</th>
                      <th className="text-left py-2 px-2 font-semibold text-sm">Email</th>
                      <th className="text-left py-2 px-2 font-semibold text-sm">Archived On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {archivedClientsList.map((client) => (
                      <tr key={client.id} className="border-b hover:bg-gray-50">
                        <td
                          className="py-3 px-2 text-sm text-blue-600 font-medium cursor-pointer hover:underline"
                          onClick={() => setSelectedArchivedClient(client)}
                        >
                          {client.id}
                        </td>
                        <td className="py-3 px-2 text-sm font-medium">{client.name}</td>
                        <td className="py-3 px-2 text-sm">{client.category || "-"}</td>
                        <td className="py-3 px-2 text-sm">{client.rep || "-"}</td>
                        <td className="py-3 px-2 text-sm">{client.email || "-"}</td>
                        <td className="py-3 px-2 text-sm">{client.archivedOn}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {archivedClientsList.length === 0 && (
                <div className="text-center py-8 text-gray-500">No archived clients found</div>
              )}
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <button onClick={() => setShowArchivedClients(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Archived Client Detail Modal */}
      {selectedArchivedClient && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between p-4 border-b bg-white">
              <h2 className="text-lg font-semibold">Client Details — {selectedArchivedClient.id}</h2>
              <button onClick={() => setSelectedArchivedClient(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    ["Client ID", selectedArchivedClient.id],
                    ["Company Name", selectedArchivedClient.name],
                    ["Category", selectedArchivedClient.category],
                    ["Tier", selectedArchivedClient.tier],
                    ["Contact Person", selectedArchivedClient.rep],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
                      <p className="text-sm text-gray-900">{value || "-"}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    ["Email", selectedArchivedClient.email],
                    ["Phone", selectedArchivedClient.phone],
                    ["Mobile", selectedArchivedClient.mobile],
                    ["Website", selectedArchivedClient.website],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
                      <p className="text-sm text-gray-900">{value || "-"}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Billing Address</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 font-medium mb-1">Address</p>
                    <p className="text-sm text-gray-900">{selectedArchivedClient.billingAddress || "-"}</p>
                  </div>
                  {[
                    ["City", selectedArchivedClient.billingCity],
                    ["State", selectedArchivedClient.billingState],
                    ["Pincode", selectedArchivedClient.billingPincode],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
                      <p className="text-sm text-gray-900">{value || "-"}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Archive Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    ["Archived On", selectedArchivedClient.archivedOn],
                    ["Contract End Date", selectedArchivedClient.contractEndDate],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
                      <p className="text-sm text-gray-900">{value || "-"}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 font-medium mb-2">Status</p>
                <Badge className={statusBadgeClass(selectedArchivedClient.status || "")}>
                  {selectedArchivedClient.status || "archived"}
                </Badge>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <button onClick={() => setSelectedArchivedClient(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Provision Portal — Credentials Dialog */}
      {provisionResult && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-start mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Zap size={20} className="text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Portal Provisioned</h2>
                  <p className="text-xs text-gray-500">{provisionResult.clientName}</p>
                </div>
              </div>
              <button onClick={() => setProvisionResult(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-5">
              <p className="text-sm text-green-800 font-medium">Client portal is ready!</p>
              <p className="text-xs text-green-700 mt-1">Share the credentials below with the client admin.</p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Login Email</p>
                <div className="flex items-center justify-between gap-3">
                  <code className="text-sm font-mono text-gray-900 break-all">{provisionResult.email}</code>
                  <button onClick={() => copyToClipboard(provisionResult.email, "email")} className="shrink-0 p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors">
                    {copiedField === "email" ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
                  </button>
                </div>
              </div>
              <div className="border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Temporary Password</p>
                <div className="flex items-center justify-between gap-3">
                  <code className="text-sm font-mono text-gray-900">{provisionResult.password}</code>
                  <button onClick={() => copyToClipboard(provisionResult.password, "password")} className="shrink-0 p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors">
                    {copiedField === "password" ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5">
              <p className="text-xs text-amber-800">
                <strong>Important:</strong> Save these credentials now — the password cannot be recovered later.
              </p>
            </div>

            <Button className="w-full" onClick={() => setProvisionResult(null)}>Done</Button>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Bulk Import Clients</h2>
              <button onClick={() => setShowBulkImport(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Upload CSV File</label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-gray-400 transition-colors">
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">Click to upload or drag and drop</span>
                  <span className="text-xs text-gray-500 mt-1">CSV file only</span>
                  <input type="file" accept=".csv" onChange={handleBulkImport} className="hidden" />
                </label>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-700">
                  <strong>Note:</strong> Use the template from "Download Template". Duplicate Client IDs will be skipped. New clients are saved immediately.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <button onClick={() => setShowBulkImport(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
