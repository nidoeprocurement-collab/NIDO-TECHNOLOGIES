import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Download,
  Upload,
  MoreVertical,
  Users,
  Archive,
} from "lucide-react";

// Mock client data
const MOCK_CLIENTS = [
  {
    id: "cli_001",
    client_id: "CLI-001",
    company_name: "Tech Solutions Inc",
    category: "Technology",
    client_tier: "Premium Clients",
    contact_person: "John Smith",
    email: "john@techsolutions.com",
    phone: "+1-555-0100",
    mobile: "+1-555-0101",
    status: "active",
    client_logo_url: null,
    is_archived: false,
  },
  {
    id: "cli_002",
    client_id: "CLI-002",
    company_name: "Global Trading Ltd",
    category: "Import/Export",
    client_tier: "Premium Clients",
    contact_person: "Sarah Johnson",
    email: "sarah@globaltrading.com",
    phone: "+1-555-0200",
    mobile: "+1-555-0201",
    status: "active",
    client_logo_url: null,
    is_archived: false,
  },
  {
    id: "cli_003",
    client_id: "CLI-003",
    company_name: "Marketing Pro Agency",
    category: "Services",
    client_tier: "Standard Clients",
    contact_person: "Mike Davis",
    email: "mike@marketingpro.com",
    phone: "+1-555-0300",
    mobile: "+1-555-0301",
    status: "pending",
    client_logo_url: null,
    is_archived: false,
  },
  {
    id: "cli_004",
    client_id: "CLI-004",
    company_name: "Finance Corp",
    category: "Financial Services",
    client_tier: "Standard Clients",
    contact_person: "Emily Wilson",
    email: "emily@financecorp.com",
    phone: "+1-555-0400",
    mobile: "+1-555-0401",
    status: "inactive",
    client_logo_url: null,
    is_archived: false,
  },
];

export default function ClientsPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"All" | "Premium" | "Active" | "Pending" | "Inactive">("All");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const initializeClients = async () => {
      // Simulate loading with mock data
      await new Promise((resolve) => setTimeout(resolve, 300));
      setClients(MOCK_CLIENTS);
      setLoading(false);
    };
    initializeClients();
  }, []);

  const stats = {
    premium: clients.filter(
      (c) =>
        !c.is_archived &&
        (c.client_tier === "Premium Clients" ||
        c.status === "premium")
    ).length,
    active: clients.filter((c) => !c.is_archived && c.status === "active").length,
    pending: clients.filter((c) => !c.is_archived && c.status === "pending").length,
    inactive: clients.filter((c) => !c.is_archived && c.status === "inactive").length,
  };

  const filteredClients = clients.filter((c) => {
    if (c.is_archived) return false;
    
    const matchesSearch = 
      c.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.client_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (activeFilter === "All") {
      return true;
    } else if (activeFilter === "Premium") {
      return c.client_tier === "Premium Clients" || c.status === "premium";
    } else {
      return c.status?.toLowerCase() === activeFilter.toLowerCase();
    }
  });

  const exportCSV = () => {
    if (clients.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = [
      "Client ID",
      "Client Name",
      "Representative",
      "Email",
      "Phone",
      "Total Spend (USD)",
      "Status",
    ];

    const rows = clients.map((client) => [
      client.id,
      client.company_name,
      client.contact_person,
      client.email,
      client.phone,
      "$0",
      client.status,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `clients_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("CSV exported successfully");
  };

  const downloadTemplate = () => {
    const headers = [
      "Company Name",
      "Category",
      "Client Tier",
      "Contact Person",
      "Email",
      "Phone",
      "Mobile",
    ];

    const csv = headers.join(",");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `clients_template_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Template downloaded");
  };

  const handleEditClient = (clientId: string) => {
    navigate(`/clients/edit/${clientId}`);
  };

  const handleDeleteClient = async (clientId: string, clientName: string) => {
    if (window.confirm(`Are you sure you want to archive ${clientName}? You can restore it from the Archive tab.`)) {
      try {
        setClients(clients.map(c => 
          c.id === clientId ? { ...c, is_archived: true } : c
        ));
        toast.success("Client archived successfully");
      } catch (error) {
        console.error("[v0] Archive error:", error);
        toast.error("Failed to archive client");
      }
    }
  };

  const handleBulkImport = async (file: File) => {
    if (!file) {
      toast.error("Please select a CSV file");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const csv = event.target?.result as string;
        const lines = csv.split("\n").filter((line) => line.trim());

        if (lines.length < 2) {
          toast.error("CSV file is empty or has only headers");
          return;
        }

        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
        const clientsToInsert: any[] = [];
        const errors: string[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",").map((v) => v.trim());
          if (values.length === 1 && !values[0]) continue;

          const companyName = values[headers.indexOf("company name")] || "";
          const email = values[headers.indexOf("email")] || "";

          if (!companyName) {
            errors.push(`Row ${i + 1}: Missing company name`);
            continue;
          }
          if (!email) {
            errors.push(`Row ${i + 1}: Missing email`);
            continue;
          }

          const clientData: any = {
            id: `cli_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            client_id: `CLI-${String(clients.length + clientsToInsert.length + 1).padStart(3, "0")}`,
            company_name: companyName,
            category: values[headers.indexOf("category")] || "Miscellaneous",
            client_tier: values[headers.indexOf("client tier")] || "Standard Clients",
            contact_person: values[headers.indexOf("contact person")] || "",
            email: email,
            phone: values[headers.indexOf("phone")] || "",
            mobile: values[headers.indexOf("mobile")] || "",
            status: "active",
            client_logo_url: null,
            is_archived: false,
          };

          clientsToInsert.push(clientData);
        }

        if (clientsToInsert.length === 0) {
          const errorMsg =
            errors.length > 0
              ? `No valid records. Errors: ${errors.slice(0, 5).join("; ")}`
              : "No valid client records found in CSV";
          toast.error(errorMsg);
          return;
        }

        setClients([...clients, ...clientsToInsert]);
        toast.success(`Successfully imported ${clientsToInsert.length} clients`);
        setShowBulkImport(false);

        if (errors.length > 0) {
          toast.info(
            `Import complete. ${errors.length} rows had validation issues.`
          );
        }
      } catch (error) {
        console.error("[v0] CSV parsing error:", error);
        toast.error(
          `Failed to parse CSV file: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    };

    reader.readAsText(file);
  };

  if (loading) {
    return <div className="p-6 text-center">Loading clients...</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-orange-100 text-orange-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Clients / Client List</p>
            <h1 className="text-2xl font-bold">Clients</h1>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => navigate("/clients/add")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus size={18} />
              Add Client
            </button>
            <div className="relative group">
              <button className="px-3 py-2 rounded-lg hover:bg-gray-100">
                <MoreVertical size={20} />
              </button>
              <div className="hidden group-hover:flex absolute right-0 mt-0 bg-white border rounded-lg shadow-lg flex-col">
                <button onClick={exportCSV} className="px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2">
                  <Download size={16} />
                  Export
                </button>
                <button onClick={() => setShowBulkImport(true)} className="px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2">
                  <Upload size={16} />
                  Import
                </button>
                <button onClick={downloadTemplate} className="px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2">
                  <Download size={16} />
                  Template
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {[
            { label: "Premium Clients", value: stats.premium, color: "blue", filter: "Premium" },
            { label: "Active Clients", value: stats.active, color: "green", filter: "Active" },
            { label: "Pending", value: stats.pending, color: "orange", filter: "Pending" },
            { label: "Inactive", value: stats.inactive, color: "red", filter: "Inactive" },
          ].map((stat) => (
            <button
              key={stat.label}
              onClick={() => setActiveFilter(stat.filter as any)}
              className={`text-left p-6 bg-white rounded-lg border-2 transition-all ${
                activeFilter === stat.filter
                  ? `border-${stat.color}-500 shadow-lg`
                  : "border-gray-200 hover:shadow-md"
              }`}
            >
              <p className="text-gray-600 text-sm">{stat.label}</p>
              <p className={`text-3xl font-bold mt-2 text-${stat.color}-600`}>
                {stat.value}
              </p>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">
                    <input type="checkbox" className="rounded" />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">
                    Client ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">
                    Client Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">
                    Representative
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No clients found
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => (
                    <tr key={client.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input type="checkbox" className="rounded" />
                      </td>
                      <td
                        className="px-6 py-4 text-sm font-medium text-blue-600 cursor-pointer hover:underline"
                        onClick={() => navigate(`/clients/${client.id}`)}
                      >
                        {client.client_id}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        {client.company_name}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {client.contact_person}
                      </td>
                      <td className="px-6 py-4 text-sm">{client.email}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(client.status)}`}>
                          {client.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="relative group">
                          <button className="p-2 hover:bg-gray-200 rounded">
                            <MoreVertical size={16} />
                          </button>
                          <div className="hidden group-hover:flex absolute right-0 mt-0 bg-white border rounded-lg shadow-lg flex-col z-10">
                            <button
                              onClick={() => navigate(`/clients/${client.id}`)}
                              className="px-4 py-2 text-left text-sm hover:bg-gray-100"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => handleEditClient(client.id)}
                              className="px-4 py-2 text-left text-sm hover:bg-gray-100"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteClient(client.id, client.company_name)
                              }
                              className="px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600"
                            >
                              Archive
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t flex items-center justify-between text-sm text-gray-600">
            <span>{filteredClients.length}-{filteredClients.length} of {clients.filter(c => !c.is_archived).length} clients</span>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-100 rounded">←</button>
              <button className="px-3 py-1 rounded border">1</button>
              <button className="p-2 hover:bg-gray-100 rounded">→</button>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold mb-2">Bulk Import Clients</h2>
                <p className="text-sm text-gray-600">
                  Upload a CSV file to import multiple clients at once
                </p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleBulkImport(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="h-8 w-8 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    Click to upload CSV
                  </span>
                  <span className="text-xs text-gray-500">
                    or drag and drop
                  </span>
                </label>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-xs text-blue-800">
                  <strong>Tip:</strong> Download the template to see the required CSV format
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowBulkImport(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={downloadTemplate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Download Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
