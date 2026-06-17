import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Phone, Download, MoreVertical, Calendar, Globe } from "lucide-react";

const MOCK_CLIENT = {
  id: "CLI-001",
  company_name: "Acme Corporation",
  contact_person: "John Smith",
  email: "john.smith@acme.com",
  phone: "+1-555-0101",
  website: "https://acme.com",
  contract_start: "2023-01-15",
  contract_end: "2025-01-15",
  status: "active",
  billing_address: "123 Business St, Mumbai, Maharashtra 400001",
  shipping_address: "456 Supply Ave, Pune, Maharashtra 411001",
};

export default function ClientDetailPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [showMenu, setShowMenu] = useState(false);

  const tabs = ["Overview", "Users", "Roles", "Catalog", "Activity Logs"];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-3 sm:px-4 md:px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate("/clients")}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft size={20} />
              Back to Clients
            </button>

            {/* 3-Dot Menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <MoreVertical size={20} />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg w-48 z-50">
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                    <Mail size={16} /> Send Email
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                    <Download size={16} /> Download
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                    <Download size={16} /> Export Users
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{MOCK_CLIENT.company_name}</h1>
            <p className="text-sm text-gray-600">{MOCK_CLIENT.contact_person}</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-t pt-4 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase().replace(" ", "-"))}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-t-lg transition-all ${
                  activeTab === tab.toLowerCase().replace(" ", "-")
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-3 sm:px-4 md:px-6 py-6">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Client Info Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Client Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">Contact Person</p>
                    <p className="text-sm font-medium text-gray-900">{MOCK_CLIENT.contact_person}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">Email</p>
                    <p className="text-sm font-medium text-blue-600">{MOCK_CLIENT.email}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">Phone</p>
                    <p className="text-sm font-medium text-gray-900">{MOCK_CLIENT.phone}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">Website</p>
                    <p className="text-sm font-medium text-blue-600">{MOCK_CLIENT.website}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">Status</p>
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                      {MOCK_CLIENT.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contract & Address Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contract Details */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Contract Details</h3>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Start Date</p>
                    <p className="text-sm font-medium text-gray-900">{MOCK_CLIENT.contract_start}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">End Date</p>
                    <p className="text-sm font-medium text-gray-900">{MOCK_CLIENT.contract_end}</p>
                  </div>
                </div>
              </div>

              {/* Addresses */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Billing Address</h3>
                  <p className="text-sm text-gray-600">{MOCK_CLIENT.billing_address}</p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Shipping Address</h3>
                  <p className="text-sm text-gray-600">{MOCK_CLIENT.shipping_address}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Client Users</h3>
            <p className="text-gray-600">Users management interface</p>
          </div>
        )}

        {activeTab === "roles" && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Roles & Permissions</h3>
            <p className="text-gray-600">Roles management interface</p>
          </div>
        )}

        {activeTab === "catalog" && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Catalog</h3>
            <p className="text-gray-600">Product catalog interface</p>
          </div>
        )}

        {activeTab === "activity-logs" && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Activity Logs</h3>
            <p className="text-gray-600">Activity history interface</p>
          </div>
        )}
      </div>
    </div>
  );
}
