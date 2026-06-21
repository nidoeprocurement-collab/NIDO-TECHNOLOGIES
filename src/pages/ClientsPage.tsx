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

  const archivedClientsData = [
    {
      id: "CI-00099",
      name: "Archived Client 1",
      rep: "Rep Name",
      email: "archived@example.com",
      phone: "+91 98765 43210",
      mobile: "+91 99876 54321",
      website: "www.archivedclient1.com",
      category: "IT Hardware",
      status: "archived",
      archivedOn: "2025-11-01",
      contractEndDate: "2025-11-01",
      billingAddress: "123 Business Street",
      billingCity: "Mumbai",
      billingState: "Maharashtra",
      billingPincode: "400001",
    },
    {
      id: "CI-00098",
      name: "Archived Client 2",
      rep: "Rep Name",
      email: "archived2@example.com",
      phone: "+91 99876 54321",
      mobile: "+91 98765 43210",
      website: "www.archivedclient2.com",
      category: "Cloud Servers",
      status: "archived",
      archivedOn: "2025-10-15",
      contractEndDate: "2025-10-15",
      billingAddress: "456 Corporate Plaza",
      billingCity: "Bangalore",
      billingState: "Karnataka",
      billingPincode: "560001",
    },
  ]

  const [activeFilter, setActiveFilter] = useState("All")
  const [showArchivedClients, setShowArchivedClients] = useState(false)
  const [selectedArchivedClient, setSelectedArchivedClient] = useState<any>(null)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [importedClients, setImportedClients] = useState<any[]>([])
  const [editingClient, setEditingClient] = useState<any>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editStep, setEditStep] = useState(0)
  const [allClients, setAllClients] = useState<any[]>([
    { id: "CI-00019", name: "Raj Manufacturing", category: "IT Hardware", tier: "Premium", rep: "Rajesh Kumar", email: "rajesh@gmail.com", phone: "+91 98765 43210", mobile: "+91 99876 54321", website: "www.rajmfg.com", contractStartDate: "2024-01-01", contractEndDate: "2025-01-01", status: "active", billingAddress: "123 Tech Street", billingCity: "Mumbai", billingState: "Maharashtra", billingPincode: "400001" },
    { id: "CI-00018", name: "Tech Solutions Ltd", category: "Cloud Servers", tier: "Standard", rep: "Amit Singh", email: "amit@gmail.com", phone: "+91 87654 32109", mobile: "+91 88765 43210", website: "www.techsol.com", contractStartDate: "2024-02-01", contractEndDate: "2025-02-01", status: "active", billingAddress: "456 IT Park", billingCity: "Bangalore", billingState: "Karnataka", billingPincode: "560001" },
    { id: "CI-00017", name: "Global Exports", category: "Office Supplies", tier: "Basic", rep: "Priya Sharma", email: "priya@gmail.com", phone: "+91 76543 21098", mobile: "+91 77654 32109", website: "www.globalexp.com", contractStartDate: "2024-03-01", contractEndDate: "2025-03-01", status: "pending", billingAddress: "789 Export Plaza", billingCity: "Delhi", billingState: "Delhi", billingPincode: "110001" },
    { id: "CI-00016", name: "Express IT Services", category: "IT Hardware", tier: "Premium", rep: "Vikram Patel", email: "vikram@gmail.com", phone: "+91 65432 10987", mobile: "+91 66543 21098", website: "www.expressit.com", contractStartDate: "2024-04-01", contractEndDate: "2025-04-01", status: "active", billingAddress: "321 Tech Hub", billingCity: "Hyderabad", billingState: "Telangana", billingPincode: "500001" },
    { id: "CI-00015", name: "Digital Innovations", category: "Cloud Servers", tier: "Standard", rep: "Anita Desai", email: "anita@gmail.com", phone: "+91 54321 09876", mobile: "+91 55432 10987", website: "www.diginnovate.com", contractStartDate: "2024-05-01", contractEndDate: "2025-05-01", status: "active", billingAddress: "654 Innovation Drive", billingCity: "Pune", billingState: "Maharashtra", billingPincode: "411001" },
    { id: "CI-00021", name: "Mohan Textiles", category: "Office Supplies", tier: "Basic", rep: "Mohan Bhat", email: "mohanbhat@gmail.com", phone: "+91 43210 98765", mobile: "+91 44321 09876", website: "www.mohantex.com", contractStartDate: "2024-06-01", contractEndDate: "2025-06-01", status: "active", billingAddress: "987 Textile Park", billingCity: "Surat", billingState: "Gujarat", billingPincode: "395001" },
    { id: "CI-00008", name: "Naveen Solutions", category: "IT Hardware", tier: "Standard", rep: "Naveen Kumar", email: "naveenkumar@gmail.com", phone: "+91 32109 87654", mobile: "+91 33210 98765", website: "www.naveensol.com", contractStartDate: "2024-07-01", contractEndDate: "2025-07-01", status: "active", billingAddress: "147 Business Plaza", billingCity: "Ahmedabad", billingState: "Gujarat", billingPincode: "380001" },
  ])
  const [archivedClientsList, setArchivedClientsList] = useState<any[]>(archivedClientsData)

  const stats = {
    premium: 0,
    active: 14,
    pending: 0,
    inactive: 0,
  }

  const handleDownloadTemplate = () => {
    // Create a CSV template with client onboarding details
    const template = `Client ID,Company Name,Category,Client Tier,Contact Person,Email,Phone,Mobile,Website,Contract Start Date,Contract End Date,GST Treatment,GSTIN,Source of Supply,PAN Number,Currency,Opening Balance,Payment Terms,TDS Rate,Bank Name,Account Number,IFSC Code,Branch,Billing Address,Billing City,Billing State,Billing Pincode,Shipping Address,Shipping City,Shipping State,Shipping Pincode
CL-00001,Company Name,IT Hardware,Premium Clients,John Doe,john@company.com,+91 98765 43210,+91 99876 54321,www.company.com,2024-01-01,2025-01-01,Registered Business,27AABCT1234A1Z5,Maharashtra,AAAAA0000A,INR,50000,Net 30,1.0,ICIC Bank,9876543210,ICIC0001234,Mumbai,123 Business Street,Mumbai,Maharashtra,400001,123 Business Street,Mumbai,Maharashtra,400001`

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'client-template.csv')
    link.style.visibility = 'hidden'
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
        const lines = csv.split('\n')
        const headers = lines[0].split(',').map(h => h.trim())
        
        // Get the highest existing client ID to auto-generate new ones
        const maxId = allClients.length > 0 
          ? Math.max(...allClients.map(c => parseInt(c.id.replace('CI-', '')))) 
          : 24

        const newClients = lines.slice(1)
          .filter(line => line.trim())
          .map((line, index) => {
            const values = line.split(',').map(v => v.trim())
            const clientData: any = {}
            
            headers.forEach((header, idx) => {
              const value = values[idx] || '' // Keep blank fields as empty strings
              clientData[header] = value
            })

            // Auto-generate client ID if not provided
            if (!clientData['Client ID'] || clientData['Client ID'] === '') {
              clientData['Client ID'] = `CI-${String(maxId + index + 1).padStart(5, '0')}`
            }

            return {
              id: clientData['Client ID'],
              name: clientData['Company Name'] || '',
              category: clientData['Category'] || '',
              tier: clientData['Client Tier'] || '',
              rep: clientData['Contact Person'] || '',
              email: clientData['Email'] || '',
              phone: clientData['Phone'] || '',
              mobile: clientData['Mobile'] || '',
              website: clientData['Website'] || '',
              contractStartDate: clientData['Contract Start Date'] || '',
              contractEndDate: clientData['Contract End Date'] || '',
              gstTreatment: clientData['GST Treatment'] || '',
              gstin: clientData['GSTIN'] || '',
              sourceOfSupply: clientData['Source of Supply'] || '',
              pan: clientData['PAN Number'] || '',
              currency: clientData['Currency'] || '',
              openingBalance: clientData['Opening Balance'] || '',
              paymentTerms: clientData['Payment Terms'] || '',
              tdsRate: clientData['TDS Rate'] || '',
              bankName: clientData['Bank Name'] || '',
              accountNumber: clientData['Account Number'] || '',
              ifscCode: clientData['IFSC Code'] || '',
              branch: clientData['Branch'] || '',
              billingAddress: clientData['Billing Address'] || '',
              billingCity: clientData['Billing City'] || '',
              billingState: clientData['Billing State'] || '',
              billingPincode: clientData['Billing Pincode'] || '',
              shippingAddress: clientData['Shipping Address'] || '',
              shippingCity: clientData['Shipping City'] || '',
              shippingState: clientData['Shipping State'] || '',
              shippingPincode: clientData['Shipping Pincode'] || '',
              status: 'active'
            }
          })

        setImportedClients(newClients)
        setShowBulkImport(false)
      } catch (error) {
        console.error('Error parsing CSV:', error)
        alert('Error parsing CSV file. Please check the format.')
      }
    }
    reader.readAsText(file)
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
              <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/clients/add')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => {
                const clientsData = [
                  { id: "CI-00019", name: "Raj Manufacturing", rep: "Rajesh Kumar", email: "rajesh@gmail.com", status: "active" },
                  { id: "CI-00018", name: "Tech Solutions Ltd", rep: "Amit Singh", email: "amit@gmail.com", status: "active" },
                  { id: "CI-00017", name: "Global Exports", rep: "Priya Sharma", email: "priya@gmail.com", status: "pending" },
                  { id: "CI-00016", name: "Express IT Services", rep: "Vikram Patel", email: "vikram@gmail.com", status: "active" },
                  { id: "CI-00015", name: "Digital Innovations", rep: "Anita Desai", email: "anita@gmail.com", status: "active" },
                  { id: "CI-00021", name: "Mohan Textiles", rep: "Mohan Bhat", email: "mohanbhat@gmail.com", status: "active" },
                  { id: "CI-00008", name: "Naveen Solutions", rep: "Naveen Kumar", email: "naveenkumar@gmail.com", status: "active" },
                ]
                const csv = clientsData.map(c => `${c.id},${c.name},${c.rep},${c.email},${c.status}`).join('\n')
                const headers = 'Client ID,Name,Representative,Email,Status\n'
                const blob = new Blob([headers + csv], { type: 'text/csv' })
                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = 'clients-export.csv'
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
              }}>
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
                {[...allClients, ...importedClients].map((c, i) => (
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
                          <DropdownMenuItem onClick={() => {
                            setEditingClient(c)
                            setShowEditModal(true)
                          }}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600 cursor-pointer"
                            onClick={() => {
                              setAllClients(allClients.filter(client => client.id !== c.id))
                              setArchivedClientsList([...archivedClientsList, { ...c, status: 'archived', archivedOn: new Date().toISOString().split('T')[0] }])
                            }}
                          >
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

      {/* Archived Clients Modal */}
      {showArchivedClients && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between p-6 border-b bg-white">
              <h2 className="text-lg font-semibold">Archived Clients</h2>
              <button onClick={() => setShowArchivedClients(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-sm">Client ID</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">Company Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">Representative</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">Archived On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {archivedClientsList.map((client) => (
                      <tr key={client.id} className="border-b hover:bg-gray-50">
                        <td 
                          className="py-3 px-4 text-sm text-blue-600 font-medium cursor-pointer hover:underline"
                          onClick={() => setSelectedArchivedClient(client)}
                        >
                          {client.id}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium">{client.name}</td>
                        <td className="py-3 px-4 text-sm">{client.rep}</td>
                        <td className="py-3 px-4 text-sm">{client.email}</td>
                        <td className="py-3 px-4 text-sm">{client.archivedOn}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {archivedClientsList.length === 0 && (
                <div className="text-center py-8 text-gray-500">No archived clients found</div>
              )}
            </div>
            <div className="flex justify-end gap-2 p-6 border-t">
              <button onClick={() => setShowArchivedClients(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Archived Client Detail Modal */}
      {selectedArchivedClient && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between p-6 border-b bg-white">
              <h2 className="text-lg font-semibold">Client Details - {selectedArchivedClient.id}</h2>
              <button 
                onClick={() => setSelectedArchivedClient(null)} 
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Client ID</p>
                    <p className="text-sm text-gray-900">{selectedArchivedClient.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Company Name</p>
                    <p className="text-sm text-gray-900">{selectedArchivedClient.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Category</p>
                    <p className="text-sm text-gray-900">{selectedArchivedClient.category}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Contact Person</p>
                    <p className="text-sm text-gray-900">{selectedArchivedClient.rep}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Email</p>
                    <p className="text-sm text-gray-900">{selectedArchivedClient.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Phone</p>
                    <p className="text-sm text-gray-900">{selectedArchivedClient.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Mobile</p>
                    <p className="text-sm text-gray-900">{selectedArchivedClient.mobile}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Website</p>
                    <p className="text-sm text-gray-900">{selectedArchivedClient.website}</p>
                  </div>
                </div>
              </div>

              {/* Billing Address */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Billing Address</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 font-medium mb-1">Address</p>
                    <p className="text-sm text-gray-900">{selectedArchivedClient.billingAddress}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">City</p>
                    <p className="text-sm text-gray-900">{selectedArchivedClient.billingCity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">State</p>
                    <p className="text-sm text-gray-900">{selectedArchivedClient.billingState}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Pincode</p>
                    <p className="text-sm text-gray-900">{selectedArchivedClient.billingPincode}</p>
                  </div>
                </div>
              </div>

              {/* Archive Information */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Archive Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Archived On</p>
                    <p className="text-sm text-gray-900">{selectedArchivedClient.archivedOn}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Contract End Date</p>
                    <p className="text-sm text-gray-900">{selectedArchivedClient.contractEndDate}</p>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-xs text-gray-500 font-medium mb-2">Status</p>
                <Badge className="bg-red-100 text-red-800 capitalize">{selectedArchivedClient.status}</Badge>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-6 border-t">
              <button 
                onClick={() => setSelectedArchivedClient(null)} 
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Bulk Import Clients</h2>
              <button onClick={() => setShowBulkImport(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Upload CSV File</label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 cursor-pointer hover:border-gray-400 transition-colors">
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">Click to upload or drag and drop</span>
                  <span className="text-xs text-gray-500 mt-1">CSV file</span>
                  <input 
                    type="file" 
                    accept=".csv" 
                    onChange={handleBulkImport}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-700">
                  <strong>Note:</strong> Use the template downloaded from "Download Template" option. Client IDs will be auto-generated if not provided. Blank fields will be kept as empty.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-6 border-t">
              <button onClick={() => setShowBulkImport(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Client Modal with Tabs */}
      {showEditModal && editingClient && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="sticky top-0 flex items-center justify-between p-6 border-b bg-white">
              <h2 className="text-lg font-semibold">Edit Client - {editingClient.id}</h2>
              <button 
                onClick={() => {
                  setShowEditModal(false)
                  setEditingClient(null)
                  setEditStep(0)
                }} 
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b bg-gray-50 px-6">
              {['Basic Info', 'Business', 'Financial', 'Address', 'Documents'].map((label, idx) => (
                <button
                  key={idx}
                  onClick={() => setEditStep(idx)}
                  className={`py-3 px-4 font-medium text-sm ${
                    editStep === idx
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {editStep === 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Company Name</label>
                      <input 
                        type="text" 
                        value={editingClient.name || ''}
                        onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                      <input 
                        type="text" 
                        value={editingClient.category || ''}
                        onChange={(e) => setEditingClient({ ...editingClient, category: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Client Tier</label>
                      <input 
                        type="text" 
                        value={editingClient.tier || ''}
                        onChange={(e) => setEditingClient({ ...editingClient, tier: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Contact Person</label>
                      <input 
                        type="text" 
                        value={editingClient.rep || ''}
                        onChange={(e) => setEditingClient({ ...editingClient, rep: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                      <input 
                        type="email" 
                        value={editingClient.email || ''}
                        onChange={(e) => setEditingClient({ ...editingClient, email: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                      <input 
                        type="tel" 
                        value={editingClient.phone || ''}
                        onChange={(e) => setEditingClient({ ...editingClient, phone: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Mobile</label>
                      <input 
                        type="tel" 
                        value={editingClient.mobile || ''}
                        onChange={(e) => setEditingClient({ ...editingClient, mobile: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Website</label>
                      <input 
                        type="url" 
                        value={editingClient.website || ''}
                        onChange={(e) => setEditingClient({ ...editingClient, website: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Contract Start Date</label>
                      <input 
                        type="date" 
                        value={editingClient.contractStartDate || ''}
                        onChange={(e) => setEditingClient({ ...editingClient, contractStartDate: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Contract End Date</label>
                      <input 
                        type="date" 
                        value={editingClient.contractEndDate || ''}
                        onChange={(e) => setEditingClient({ ...editingClient, contractEndDate: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {editStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Business Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">GST Treatment</label>
                      <input 
                        type="text" 
                        value={editingClient.gstTreatment || ''}
                        onChange={(e) => setEditingClient({ ...editingClient, gstTreatment: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                        placeholder="e.g., Registered Business"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">GSTIN</label>
                      <input 
                        type="text" 
                        value={editingClient.gstin || ''}
                        onChange={(e) => setEditingClient({ ...editingClient, gstin: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">PAN Number</label>
                      <input 
                        type="text" 
                        value={editingClient.pan || ''}
                        onChange={(e) => setEditingClient({ ...editingClient, pan: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Source of Supply</label>
                      <input 
                        type="text" 
                        value={editingClient.sourceOfSupply || ''}
                        onChange={(e) => setEditingClient({ ...editingClient, sourceOfSupply: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Currency</label>
                      <input 
                        type="text" 
                        value={editingClient.currency || 'INR'}
                        onChange={(e) => setEditingClient({ ...editingClient, currency: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Opening Balance</label>
                      <input 
                        type="text" 
                        value={editingClient.openingBalance || ''}
                        onChange={(e) => setEditingClient({ ...editingClient, openingBalance: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {editStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Financial Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Payment Terms</label>
                      <input 
                        type="text" 
                        value={editingClient.paymentTerms || ''}
                        onChange={(e) => setEditingClient({ ...editingClient, paymentTerms: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                        placeholder="e.g., Net 30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">TDS Rate (%)</label>
                      <input 
                        type="text" 
                        value={editingClient.tdsRate || ''}
                        onChange={(e) => setEditingClient({ ...editingClient, tdsRate: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Bank Name</label>
                      <input 
                        type="text" 
                        value={editingClient.bankName || ''}
                        onChange={(e) => setEditingClient({ ...editingClient, bankName: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Account Number</label>
                      <input 
                        type="text" 
                        value={editingClient.accountNumber || ''}
                        onChange={(e) => setEditingClient({ ...editingClient, accountNumber: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">IFSC Code</label>
                      <input 
                        type="text" 
                        value={editingClient.ifscCode || ''}
                        onChange={(e) => setEditingClient({ ...editingClient, ifscCode: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Branch</label>
                      <input 
                        type="text" 
                        value={editingClient.branch || ''}
                        onChange={(e) => setEditingClient({ ...editingClient, branch: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {editStep === 3 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Address Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Billing Address</label>
                      <input 
                        type="text" 
                        value={editingClient.billingAddress || ''}
                        onChange={(e) => setEditingClient({ ...editingClient, billingAddress: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Billing City</label>
                      <input 
                        type="text" 
                        value={editingClient.billingCity || ''}
                        onChange={(e) => setEditingClient({ ...editingClient, billingCity: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Billing State</label>
                      <input 
                        type="text" 
                        value={editingClient.billingState || ''}
                        onChange={(e) => setEditingClient({ ...editingClient, billingState: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Billing Pincode</label>
                      <input 
                        type="text" 
                        value={editingClient.billingPincode || ''}
                        onChange={(e) => setEditingClient({ ...editingClient, billingPincode: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Shipping Address</label>
                      <input 
                        type="text" 
                        value={editingClient.shippingAddress || ''}
                        onChange={(e) => setEditingClient({ ...editingClient, shippingAddress: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Shipping City</label>
                      <input 
                        type="text" 
                        value={editingClient.shippingCity || ''}
                        onChange={(e) => setEditingClient({ ...editingClient, shippingCity: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Shipping State</label>
                      <input 
                        type="text" 
                        value={editingClient.shippingState || ''}
                        onChange={(e) => setEditingClient({ ...editingClient, shippingState: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Shipping Pincode</label>
                      <input 
                        type="text" 
                        value={editingClient.shippingPincode || ''}
                        onChange={(e) => setEditingClient({ ...editingClient, shippingPincode: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {editStep === 4 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Documents</h3>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <p className="text-sm text-gray-600">Upload documents for this client (if any)</p>
                    <input 
                      type="file" 
                      multiple 
                      className="mt-4"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="sticky bottom-0 flex justify-between gap-2 p-6 border-t bg-white">
              <div className="flex gap-2">
                <button 
                  onClick={() => setEditStep(Math.max(0, editStep - 1))}
                  disabled={editStep === 0}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button 
                  onClick={() => setEditStep(Math.min(4, editStep + 1))}
                  disabled={editStep === 4}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingClient(null)
                    setEditStep(0)
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setAllClients(allClients.map(client => 
                      client.id === editingClient.id ? editingClient : client
                    ))
                    setShowEditModal(false)
                    setEditingClient(null)
                    setEditStep(0)
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
