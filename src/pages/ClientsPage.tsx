import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Plus,
  Download,
  Upload,
  MoreVertical,
  Archive,
  Edit,
  Eye,
} from "lucide-react";

// Mock client data
const MOCK_CLIENTS = [
  {
    id: "cli_001",
    client_id: "CLI-00024",
    company_name: "raj",
    category: "Technology",
    client_tier: "Premium Clients",
    contact_person: "raj",
    email: "raj@info.com",
    phone: "+1-555-0100",
    mobile: "+1-555-0101",
    status: "active",
    client_logo_url: null,
    is_archived: false,
    total_spend: 0,
  },
  {
    id: "cli_002",
    client_id: "CLI-00023",
    company_name: "veera industries",
    category: "Import/Export",
    client_tier: "Premium Clients",
    contact_person: "Veeru",
    email: "Veeru@indu.com",
    phone: "+1-555-0200",
    mobile: "+1-555-0201",
    status: "active",
    client_logo_url: null,
    is_archived: false,
    total_spend: 0,
  },
  {
    id: "cli_003",
    client_id: "CLI-00020",
    company_name: "Nitin Supplies",
    category: "Services",
    client_tier: "Standard Clients",
    contact_person: "Nitin Shetty",
    email: "nitin.shetty@gmail.com",
    phone: "+1-555-0300",
    mobile: "+1-555-0301",
    status: "active",
    client_logo_url: null,
    is_archived: false,
    total_spend: 0,
  },
  {
    id: "cli_004",
    client_id: "CLI-00021",
    company_name: "Mohan Textiles",
    category: "Financial Services",
    client_tier: "Standard Clients",
    contact_person: "Mohan Bhat",
    email: "mohan.bhat@gmail.com",
    phone: "+1-555-0400",
    mobile: "+1-555-0401",
    status: "active",
    client_logo_url: null,
    is_archived: false,
    total_spend: 0,
  },
];

export default function ClientsPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"All" | "Premium" | "Active" | "Pending" | "Inactive">("All");

  const [showMenu, setShowMenu] = useState(false);
  const [rowMenuOpen, setRowMenuOpen] = useState<string | null>(null);

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
      "Total Spend (INR)",
      "Status",
    ];

    const rows = clients.map((client) => [
      client.id,
      client.company_name,
      client.contact_person,
      client.email,
      client.phone,
      "₹0",
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
        <div className="w-full px-3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Clients / Client List</p>
            <h1 className="text-2xl font-bold">Clients</h1>
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="More options"
            >
              <MoreVertical size={20} className="text-gray-600" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-52 z-50">
                <button 
                  onClick={() => {
                    navigate("/clients/add");
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                >
                  <Plus size={16} />
                  Add Client
                </button>
                <button 
                  onClick={() => {
                    exportCSV();
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                >
                  <Download size={16} />
                  Export Clients
                </button>
                <button 
                  onClick={() => {
                    setShowBulkImport(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                >
                  <Upload size={16} />
                  Bulk Import
                </button>
                <button 
                  onClick={() => {
                    downloadTemplate();
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                >
                  <Download size={16} />
                  Download Template
                </button>
                <div className="border-t border-gray-200 my-1"></div>
                <button 
                  onClick={() => setShowMenu(false)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                >
                  <Archive size={16} />
                  Archive Clients
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-full px-3 sm:px-4 md:px-6 py-4 md:py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { label: "Premium Clients", value: "Premium", count: stats.premium },
            { label: "Active Clients", value: "Active", count: stats.active },
            { label: "Pending", value: "Pending", count: stats.pending },
            { label: "Inactive", value: "Inactive", count: stats.inactive },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveFilter(tab.value as any)}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium whitespace-nowrap rounded-lg transition-all ${
                activeFilter === tab.value
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto min-w-0">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600">
                    <input type="checkbox" className="rounded" />
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600">
                    Client ID
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600">
                    Client Name
                  </th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-600">
                    Representative
                  </th>
                  <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-600">
                    Email
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600">
                    Total Spend (INR)
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600">
                    Status
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-center text-xs font-semibold text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 sm:px-4 py-8 text-center text-gray-500 text-sm">
                      No clients found
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => (
                    <tr key={client.id} className="border-b hover:bg-gray-50">
                      <td className="px-3 sm:px-4 py-3">
                        <input type="checkbox" className="rounded" />
                      </td>
                      <td
                        className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium text-blue-600 cursor-pointer hover:underline"
                        onClick={() => navigate(`/clients/${client.id}`)}
                      >
                        {client.client_id}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium">
                        {client.company_name}
                      </td>
                      <td className="hidden md:table-cell px-4 py-3 text-xs sm:text-sm">
                        {client.contact_person}
                      </td>
                      <td className="hidden lg:table-cell px-4 py-3 text-xs sm:text-sm">
                        {client.email}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm">
                        ₹{client.total_spend || 0}
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(
                            client.status
                          )}`}
                        >
                          {client.status}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-center relative">
                        <button
                          onClick={() => setRowMenuOpen(rowMenuOpen === client.id ? null : client.id)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors inline-block"
                          title="Actions"
                        >
                          <MoreVertical size={18} className="text-gray-600" />
                        </button>
                        
                        {rowMenuOpen === client.id && (
                          <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-40 z-50">
                            <button
                              onClick={() => {
                                navigate(`/clients/${client.id}`);
                                setRowMenuOpen(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                            >
                              <Eye size={16} />
                              View Details
                            </button>
                            <button
                              onClick={() => {
                                handleEditClient(client.id);
                                setRowMenuOpen(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                            >
                              <Edit size={16} />
                              Edit
                            </button>
                            <div className="border-t border-gray-200 my-1"></div>
                            <button
                              onClick={() => {
                                handleDeleteClient(client.id, client.company_name);
                                setRowMenuOpen(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600"
                            >
                              <Archive size={16} />
                              Archive
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
