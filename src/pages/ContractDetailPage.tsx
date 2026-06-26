import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Edit2, Trash2, Eye } from "lucide-react";

export default function ContractDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock contract data - replace with actual API call
  const contract = {
    id: id,
    title: "Service Agreement",
    type: "Service",
    client: "Acme Corp",
    vendor: "Tech Solutions Ltd",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    value: "₹10,00,000",
    status: "Active",
    description: "Comprehensive IT support and maintenance services",
    terms: "Monthly payments due on the 1st of each month",
    documents: [
      { id: 1, name: "Contract_Agreement.pdf", size: "2.4 MB", date: "2024-01-01" },
      { id: 2, name: "Terms_and_Conditions.pdf", size: "1.2 MB", date: "2024-01-01" },
    ],
    contacts: [
      { name: "John Doe", role: "Account Manager", email: "john@acme.com" },
      { name: "Jane Smith", role: "Legal Representative", email: "jane@acme.com" },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <p className="text-sm text-gray-500">Contract Details</p>
              <h1 className="text-2xl font-bold text-gray-900">{contract.id}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-blue-600">
              <Edit2 className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-red-600">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Contract Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border">
            <p className="text-xs text-gray-500 font-semibold mb-1">Contract Type</p>
            <p className="text-lg font-semibold text-gray-900">{contract.type}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <p className="text-xs text-gray-500 font-semibold mb-1">Status</p>
            <span className="inline-block bg-green-100 text-green-700 px-2 py-1 rounded text-sm font-semibold">
              {contract.status}
            </span>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <p className="text-xs text-gray-500 font-semibold mb-1">Contract Value</p>
            <p className="text-lg font-semibold text-gray-900">{contract.value}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <p className="text-xs text-gray-500 font-semibold mb-1">Duration</p>
            <p className="text-sm text-gray-900">{contract.startDate} to {contract.endDate}</p>
          </div>
        </div>

        {/* Main Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contract Information */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Contract Information</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="text-gray-900">{contract.description}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Terms</p>
                  <p className="text-gray-900">{contract.terms}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Start Date</p>
                    <p className="text-gray-900">{contract.startDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">End Date</p>
                    <p className="text-gray-900">{contract.endDate}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Documents</h2>
              <div className="space-y-2">
                {contract.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center">
                        <span className="text-red-600 font-semibold text-xs">PDF</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{doc.name}</p>
                        <p className="text-xs text-gray-500">{doc.size} • {doc.date}</p>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-gray-200 rounded transition-colors">
                      <Download className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Parties */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Contract Parties</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Client</p>
                  <p className="font-semibold text-gray-900">{contract.client}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Vendor</p>
                  <p className="font-semibold text-gray-900">{contract.vendor}</p>
                </div>
              </div>
            </div>

            {/* Key Contacts */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Key Contacts</h2>
              <div className="space-y-3">
                {contract.contacts.map((contact, idx) => (
                  <div key={idx} className="pb-3 border-b last:border-b-0 last:pb-0">
                    <p className="font-semibold text-gray-900">{contact.name}</p>
                    <p className="text-xs text-gray-500">{contact.role}</p>
                    <p className="text-sm text-blue-600 hover:underline cursor-pointer">{contact.email}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
