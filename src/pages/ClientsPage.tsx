import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listDocuments, deleteDocument, updateDocument, COLLECTIONS } from "@/lib/appwrite";
import { Query } from "appwrite";
import { ensureClientsExist } from "@/lib/seed-clients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function ClientsPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"All" | "Premium" | "Active" | "Pending" | "Inactive">("All");

  useEffect(() => {
    const initializeClients = async () => {
      // Ensure sample clients exist if table is empty
      await ensureClientsExist();
      // Then fetch all clients
      await fetchClients();
    };
    initializeClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const documents = await listDocuments(COLLECTIONS.CLIENTS, [
        Query.orderDesc("$createdAt"),
      ]);
      setClients(documents || []);
    } catch (error) {
      console.error("[v0] Error fetching clients:", error);
      toast.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

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
    if (!c.is_archived) {
      if (activeFilter === "All") {
        return true;
      } else if (activeFilter === "Premium") {
        return c.client_tier === "Premium Clients" || c.status === "premium";
      } else {
        return c.status?.toLowerCase() === activeFilter.toLowerCase();
      }
    }
    return false;
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
      "$0", // Placeholder - link to actual spend data
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
      "Website",
      "Contract Start Date",
      "Contract End Date",
      "Client Logo URL",
      "GST Treatment",
      "GSTIN",
      "Source of Supply",
      "PAN Number",
      "Currency",
      "Opening Balance",
      "Payment Terms",
      "TDS Rate",
      "Bank Name",
      "Account Number",
      "IFSC Code",
      "Branch",
      "Billing Address",
      "Billing City",
      "Billing State",
      "Billing Pincode",
      "Shipping Address",
      "Shipping City",
      "Shipping State",
      "Shipping Pincode",
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
        await updateDocument(COLLECTIONS.CLIENTS, clientId, { is_archived: true });
        toast.success("Client archived successfully");
        await fetchClients(); // Refresh the list
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

        // Parse CSV headers
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
        const clientsToInsert: any[] = [];
        const errors: string[] = [];

        console.log("[v0] Headers found:", headers);

        // Parse each row
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",").map((v) => v.trim());
          if (values.length === 1 && !values[0]) continue; // Skip empty lines

          // Parse and validate data
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

          // Handle account number that might be in scientific notation
          let accountNumber = values[headers.indexOf("account number")] || "";
          if (accountNumber.includes("E")) {
            // Convert scientific notation to regular number
            accountNumber = parseFloat(accountNumber).toString();
          }

          const clientData: any = {
            client_id: null, // Will be auto-generated by Supabase trigger as CI-00001, CI-00002, etc.
            company_name: companyName,
            category: values[headers.indexOf("category")] || "Miscellaneous",
            client_tier: values[headers.indexOf("client tier")] || "Standard Clients",
            contact_person: values[headers.indexOf("contact person")] || "",
            email: email,
            phone: values[headers.indexOf("phone")] || "",
            mobile: values[headers.indexOf("mobile")] || "",
            website: values[headers.indexOf("website")] || "",
            contract_start_date: values[headers.indexOf("contract start date")] || null,
            contract_end_date: values[headers.indexOf("contract end date")] || null,
            client_logo_url: values[headers.indexOf("client logo url")] || null,
            gst_treatment: values[headers.indexOf("gst treatment")] || "Regular",
            gstin: values[headers.indexOf("gstin")] || "",
            source_of_supply: values[headers.indexOf("source of supply")] || "",
            pan_number: values[headers.indexOf("pan number")] || "",
            currency: values[headers.indexOf("currency")] || "INR",
            opening_balance: parseFloat(values[headers.indexOf("opening balance")]) || 0,
            payment_terms: values[headers.indexOf("payment terms")] || "",
            tds_rate: parseFloat(values[headers.indexOf("tds rate")]) || 0,
            bank_name: values[headers.indexOf("bank name")] || "",
            account_number: accountNumber,
            ifsc_code: values[headers.indexOf("ifsc code")] || "",
            branch: values[headers.indexOf("branch")] || "",
            billing_address: values[headers.indexOf("billing address")] || "",
            billing_city: values[headers.indexOf("billing city")] || "",
            billing_state: values[headers.indexOf("billing state")] || "",
            billing_pincode: values[headers.indexOf("billing pincode")] || "",
            shipping_address: values[headers.indexOf("shipping address")] || "",
            shipping_city: values[headers.indexOf("shipping city")] || "",
            shipping_state: values[headers.indexOf("shipping state")] || "",
            shipping_pincode: values[headers.indexOf("shipping pincode")] || "",
            status: "active",
          };

          console.log("[v0] Processing row", i + 1, "Company:", clientData.company_name);
          clientsToInsert.push(clientData);
        }

        console.log("[v0] Total valid clients to insert:", clientsToInsert.length);
        if (errors.length > 0) {
          console.log("[v0] Validation errors:", errors);
        }

        if (clientsToInsert.length === 0) {
          const errorMsg =
            errors.length > 0
              ? `No valid records. Errors: ${errors.slice(0, 5).join("; ")}`
              : "No valid client records found in CSV";
          toast.error(errorMsg);
          return;
        }

        // Insert into Supabase in batches of 10 to avoid size limits
        const batchSize = 10;
        let successCount = 0;
        let failedCount = 0;

        for (let batch = 0; batch < clientsToInsert.length; batch += batchSize) {
          const batchData = clientsToInsert.slice(
            batch,
            Math.min(batch + batchSize, clientsToInsert.length)
          );

          const { error, data } = await supabase
            .from("clients")
            .insert(batchData);

          if (error) {
            console.error("[v0] Error inserting batch:", error);
            failedCount += batchData.length;
            toast.error(
              `Failed to import batch: ${error.message}`
            );
            break;
          } else {
            console.log("[v0] Batch inserted successfully:", data);
            successCount += batchData.length;
          }
        }

        if (successCount > 0) {
          toast.success(`Successfully imported ${successCount} clients`);
          setShowBulkImport(false);
          await fetchClients(); // Refresh the list
        }

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Clients / Client List</p>
            <h1 className="text-2xl font-bold">Clients</h1>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full w-10 h-10 p-0"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate("/clients/add")}>
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export Clients
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowBulkImport(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Bulk Import
              </DropdownMenuItem>
              <DropdownMenuItem onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/clients/archive")}>
                <Archive className="h-4 w-4 mr-2" />
                Archive Clients
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs />

        {/* Stats Cards - Clickable Filters */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <button
            onClick={() => setActiveFilter("Premium")}
            className={`text-left transition-all ${
              activeFilter === "Premium"
                ? "ring-2 ring-[#4A6CF7] shadow-lg"
                : "hover:shadow-md"
            }`}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Premium Clients</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {stats.premium}
                    </p>
                  </div>
                  <Users className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </button>

          <button
            onClick={() => setActiveFilter("Active")}
            className={`text-left transition-all ${
              activeFilter === "Active"
                ? "ring-2 ring-green-500 shadow-lg"
                : "hover:shadow-md"
            }`}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Active Clients</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                      {stats.active}
                    </p>
                  </div>
                  <Users className="h-5 w-5 text-green-400" />
                </div>
              </CardContent>
            </Card>
          </button>

          <button
            onClick={() => setActiveFilter("Pending")}
            className={`text-left transition-all ${
              activeFilter === "Pending"
                ? "ring-2 ring-orange-500 shadow-lg"
                : "hover:shadow-md"
            }`}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Pending</p>
                    <p className="text-3xl font-bold text-orange-600 mt-2">
                      {stats.pending}
                    </p>
                  </div>
                  <Users className="h-5 w-5 text-orange-400" />
                </div>
              </CardContent>
            </Card>
          </button>

          <button
            onClick={() => setActiveFilter("Inactive")}
            className={`text-left transition-all ${
              activeFilter === "Inactive"
                ? "ring-2 ring-red-500 shadow-lg"
                : "hover:shadow-md"
            }`}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Inactive</p>
                    <p className="text-3xl font-bold text-red-600 mt-2">
                      {stats.inactive}
                    </p>
                  </div>
                  <Users className="h-5 w-5 text-red-400" />
                </div>
              </CardContent>
            </Card>
          </button>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
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
                      Total Spend (USD)
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
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
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
                          className="px-6 py-4 text-sm font-medium text-[#4A6CF7] cursor-pointer"
                          onClick={() => navigate(`/clients/${client.id}`)}
                        >
                          {client.client_id}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          <div className="flex items-center gap-3">
                            {client.client_logo_url && (
                              <img
                                src={client.client_logo_url}
                                alt={client.company_name}
                                className="h-8 w-8 rounded-lg object-cover border border-gray-200"
                              />
                            )}
                            <span>{client.company_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {client.contact_person}
                        </td>
                        <td className="px-6 py-4 text-sm">{client.email}</td>
                        <td className="px-6 py-4 text-sm">$0</td>
                        <td className="px-6 py-4 text-sm">
                          <Badge
                            className={
                              client.status === "active"
                                ? "bg-green-100 text-green-800"
                                : client.status === "pending"
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-red-100 text-red-800"
                            }
                          >
                            {client.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => navigate(`/clients/${client.id}`)}
                              >
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEditClient(client.id)}
                              >
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() =>
                                  handleDeleteClient(client.id, client.company_name)
                                }
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
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t flex items-center justify-between text-sm text-gray-600">
              <span>1-10 of 03 clients</span>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-gray-100 rounded">←</button>
                <button className="px-3 py-1 rounded border">1</button>
                <button className="p-2 hover:bg-gray-100 rounded">→</button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
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
                  <Button
                    variant="outline"
                    onClick={() => setShowBulkImport(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={downloadTemplate}
                    className="bg-[#4A6CF7] hover:bg-[#3B5DE8]"
                  >
                    Download Template
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
