import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Check, Download, Upload, Loader2 } from "lucide-react";

// Mock toast notification system
const toast = {
  success: (msg: string) => console.log("[v0] Success:", msg),
  error: (msg: string) => console.error("[v0] Error:", msg),
};

const STEPS = [
  { label: "Basic Info", icon: "A" },
  { label: "Business", icon: "B" },
  { label: "Financial", icon: "C" },
  { label: "Address", icon: "D" },
  { label: "Documents", icon: "E" },
];

const CATEGORIES = [
  "IT Hardware",
  "Cloud Servers",
  "Office Supplies",
  "Networking",
  "Miscellaneous",
];

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "JPY"];

const GST_TREATMENTS = [
  "Registered Business",
  "Unregistered Business",
  "Compositions Scheme",
  "Overseas",
  "SEZ",
];

const PAYMENT_TERMS = ["Net 15", "Net 30", "Net 45", "Net 60", "Due on Receipt"];

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

export default function AddClient() {
  const navigate = useNavigate();
  const { id: clientIdToEdit } = useParams<{ id: string }>();
  const [step, setStep] = useState(0);
  const [showMagicUpload, setShowMagicUpload] = useState(false);
  const [isLoading, setIsLoading] = useState(!!clientIdToEdit);

  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    client_id: "", // Auto-generated
    company_name: "",
    category: "",
    client_tier: "",
    contact_person: "",
    email: "",
    phone: "",
    mobile: "",
    website: "",
    contract_start_date: "",
    contract_end_date: "",
    client_logo: null as File | null,
    client_logo_url: "",

    // Step 2: Business
    gst_treatment: "",
    gstin: "",
    source_of_supply: "",
    pan_number: "",
    currency: "INR",
    opening_balance: "",

    // Step 3: Financial
    payment_terms: "",
    tds_rate: "",
    bank_name: "",
    account_number: "",
    ifsc_code: "",
    branch: "",

    // Step 4: Address
    billing_address: "",
    shipping_address: "",
    billing_city: "",
    shipping_city: "",
    billing_state: "",
    shipping_state: "",
    billing_pincode: "",
    shipping_pincode: "",
    same_address: false,

    // Step 5: Documents
    documents: [] as File[],
  });

  const [clientTiers, setClientTiers] = useState([
    "Premium Clients",
    "Medium Clients",
    "Standard Clients",
  ]);
  const [showAddTier, setShowAddTier] = useState(false);
  const [newTier, setNewTier] = useState("");

  // Load client data for editing or generate Client ID for new client
  useEffect(() => {
    if (clientIdToEdit) {
      // Load existing client data for mock
      console.log("[v0] Loading client data for:", clientIdToEdit);
      
      // Mock data for editing
      const mockClient = {
        client_id: "CL-00001",
        company_name: "Acme Corporation",
        category: "IT Hardware",
        client_tier: "Premium Clients",
        contact_person: "John Doe",
        email: "john@acme.com",
        phone: "+91 98765 43210",
        mobile: "+91 99876 54321",
        website: "www.acme.com",
        contract_start_date: "2024-01-01",
        contract_end_date: "2025-01-01",
        gst_treatment: "Registered Business",
        gstin: "27AABCT1234A1Z5",
        source_of_supply: "Maharashtra",
        pan_number: "AAAAA0000A",
        currency: "INR",
        opening_balance: "10000",
        payment_terms: "Net 30",
        tds_rate: "2.5",
        bank_name: "State Bank of India",
        account_number: "1234567890",
        ifsc_code: "SBIN0001234",
        branch: "Mumbai",
        billing_address: "123 Business Street, Suite 100",
        billing_city: "Mumbai",
        billing_state: "Maharashtra",
        billing_pincode: "400001",
        shipping_address: "123 Business Street, Suite 100",
        shipping_city: "Mumbai",
        shipping_state: "Maharashtra",
        shipping_pincode: "400001",
      };

      setFormData((prev) => ({
        ...prev,
        ...mockClient,
      }));
      setIsLoading(false);
    } else {
      // Generate new Client ID
      setIsLoading(true);
      const timer = setTimeout(() => {
        // Generate next ID: CL-00001, CL-00002, etc.
        const nextNumber = Math.floor(Math.random() * 10000) + 1;
        const clientId = `CL-${String(nextNumber).padStart(5, "0")}`;

        setFormData((prev) => ({
          ...prev,
          client_id: clientId,
        }));
        setIsLoading(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [clientIdToEdit]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileSelect = (files: FileList | null) => {
    if (files) {
      setFormData((prev) => ({
        ...prev,
        documents: Array.from(files),
      }));
    }
  };

  const canProceed = () => {
    if (step === 0) {
      return !!(
        formData.client_id.trim() &&
        formData.company_name.trim() &&
        formData.category &&
        formData.client_tier &&
        formData.contact_person.trim() &&
        formData.email.trim() &&
        formData.contract_start_date &&
        formData.contract_end_date
      );
    }
    if (step === 1) {
      return !!(
        formData.gst_treatment &&
        formData.gstin.trim() &&
        formData.pan_number.trim()
      );
    }
    if (step === 2) {
      return !!(
        formData.payment_terms &&
        formData.bank_name.trim() &&
        formData.account_number.trim()
      );
    }
    if (step === 3) {
      return !!(
        formData.billing_address.trim() &&
        formData.billing_city.trim() &&
        formData.billing_state &&
        formData.billing_pincode.trim() &&
        (formData.same_address ||
          (formData.shipping_address.trim() &&
            formData.shipping_city.trim() &&
            formData.shipping_state &&
            formData.shipping_pincode.trim()))
      );
    }
    return true;
  };

  const downloadTemplate = () => {
    const headers = [
      "Client ID",
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
    link.download = `client_template_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Template downloaded successfully");
  };

  const handleSave = async () => {
    // Validate required fields
    if (
      !formData.company_name.trim() ||
      !formData.email.trim() ||
      !formData.contact_person.trim()
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      console.log("[v0] Saving client data:", formData.company_name);

      // Mock save operation
      const clientData = {
        company_name: formData.company_name,
        category: formData.category,
        client_tier: formData.client_tier,
        contact_person: formData.contact_person,
        email: formData.email,
        phone: formData.phone,
        mobile: formData.mobile,
        website: formData.website,
        contract_start_date: formData.contract_start_date,
        contract_end_date: formData.contract_end_date,
        client_logo_url: formData.client_logo_url,
        gst_treatment: formData.gst_treatment,
        gstin: formData.gstin,
        source_of_supply: formData.source_of_supply,
        pan_number: formData.pan_number,
        currency: formData.currency,
        opening_balance: formData.opening_balance
          ? parseFloat(formData.opening_balance)
          : 0,
        payment_terms: formData.payment_terms,
        tds_rate: formData.tds_rate
          ? parseFloat(formData.tds_rate)
          : 0,
        bank_name: formData.bank_name,
        account_number: formData.account_number,
        ifsc_code: formData.ifsc_code,
        branch: formData.branch,
        billing_address: formData.billing_address,
        billing_city: formData.billing_city,
        billing_state: formData.billing_state,
        billing_pincode: formData.billing_pincode,
        shipping_address: formData.same_address
          ? formData.billing_address
          : formData.shipping_address,
        shipping_city: formData.same_address
          ? formData.billing_city
          : formData.shipping_city,
        shipping_state: formData.same_address
          ? formData.billing_state
          : formData.shipping_state,
        shipping_pincode: formData.same_address
          ? formData.billing_pincode
          : formData.shipping_pincode,
        status: "active",
      };

      // Mock save - store in localStorage for demonstration
      const clients = JSON.parse(localStorage.getItem("clients") || "[]");
      if (clientIdToEdit) {
        const index = clients.findIndex(
          (c: any) => c.client_id === formData.client_id
        );
        if (index > -1) {
          clients[index] = { ...clients[index], ...clientData };
        }
        console.log("[v0] Client updated successfully");
        toast.success("Client updated successfully");
      } else {
        clients.push({ client_id: formData.client_id, ...clientData });
        console.log("[v0] Client saved successfully");
        toast.success("Client registered successfully");
      }
      localStorage.setItem("clients", JSON.stringify(clients));

      // Navigate back to clients page after successful save
      setTimeout(() => {
        navigate("/clients");
      }, 1000);
    } catch (err) {
      console.error("[v0] Error:", err);
      toast.error("An error occurred while saving");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-6">
        <div className="max-w-6xl mx-auto flex items-start justify-between">
          <button
            onClick={() => navigate("/clients")}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-1 text-sm"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Clients
          </button>
          <div className="text-right">
            <h1 className="text-2xl font-bold">
              {clientIdToEdit ? "Edit Client" : "Client Onboarding"}
            </h1>
            <p className="text-sm text-gray-500">
              {clientIdToEdit
                ? "Update client information"
                : "Complete all 5 steps to register a new client"}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-[#4A6CF7] animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading client information...</p>
            </div>
          </div>
        ) : (
          <div>
            {/* Progress Indicator */}
            <div className="bg-white rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between">
                {STEPS.map((s, idx) => (
                  <div key={idx} className="flex items-center flex-1">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                    step === idx
                      ? "bg-[#4A6CF7] text-white"
                      : step > idx
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step > idx ? <Check className="h-5 w-5" /> : s.icon}
                </div>
                <p
                  className={`ml-2 text-sm font-medium ${
                    step === idx
                      ? "text-[#4A6CF7]"
                      : step > idx
                        ? "text-green-500"
                        : "text-gray-600"
                  }`}
                >
                  {s.label}
                </p>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-colors ${
                      step > idx ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Magic Upload Section */}
        <div
          className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-6 mb-6 cursor-pointer hover:bg-blue-100 transition-colors"
          onClick={() => setShowMagicUpload(true)}
        >
          <div className="flex items-center gap-2 text-blue-600">
            <Upload className="h-5 w-5" />
            <span className="font-medium">Magic Upload</span>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Upload a template file to auto-fill client details
          </p>
        </div>

        {/* Step Content */}
        <Card className="bg-white">
          <CardContent className="p-8">
            {/* Step 1: Basic Info */}
            {step === 0 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-1">Step 1: Basic Info</h2>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Client ID
                    </label>
                    <Input
                      placeholder="Auto-generated"
                      value={formData.client_id}
                      disabled
                      className="bg-gray-100 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">Auto-generated</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Company Name *
                    </label>
                    <Input
                      placeholder="Legal company name"
                      value={formData.company_name}
                      onChange={(e) =>
                        handleInputChange("company_name", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Category *
                    </label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        handleInputChange("category", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Client Tier *
                    </label>
                    <Select
                      value={formData.client_tier}
                      onValueChange={(value) => {
                        if (value === "add_new") {
                          setShowAddTier(true);
                        } else {
                          handleInputChange("client_tier", value);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select tier" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientTiers.map((tier) => (
                          <SelectItem key={tier} value={tier}>
                            {tier}
                          </SelectItem>
                        ))}
                        <SelectItem value="add_new" className="text-[#4A6CF7]">
                          + Add New Tier
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {showAddTier && (
                      <div className="mt-3 p-3 border border-[#E8ECF1] rounded-md bg-[#F8FAFD]">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter new tier name"
                            value={newTier}
                            onChange={(e) => setNewTier(e.target.value)}
                          />
                          <Button
                            size="sm"
                            className="bg-[#4A6CF7] hover:bg-[#3B5DE8] text-white"
                            onClick={() => {
                              if (newTier.trim()) {
                                setClientTiers([...clientTiers, newTier]);
                                handleInputChange("client_tier", newTier);
                                setNewTier("");
                                setShowAddTier(false);
                                toast.success("Tier added successfully");
                              }
                            }}
                          >
                            Add
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setShowAddTier(false);
                              setNewTier("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Client Logo (PNG)
                    </label>
                    <input
                      type="file"
                      accept=".png"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          const file = e.target.files[0];
                          if (file.type === "image/png") {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              handleInputChange("client_logo", file);
                              handleInputChange("client_logo_url", event.target?.result);
                            };
                            reader.readAsDataURL(file);
                          } else {
                            toast.error("Please upload a PNG file");
                          }
                        }
                      }}
                      className="block w-full text-sm text-gray-500 border border-gray-300 rounded-md cursor-pointer focus:outline-none"
                    />
                    {formData.client_logo_url && (
                      <div className="mt-2">
                        <img
                          src={formData.client_logo_url}
                          alt="Logo preview"
                          className="h-16 w-16 rounded object-cover"
                        />
                      </div>
                    )}
                  </div>
                  <div></div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Contact Person *
                    </label>
                    <Input
                      placeholder="Primary contact name"
                      value={formData.contact_person}
                      onChange={(e) =>
                        handleInputChange("contact_person", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Email *
                    </label>
                    <Input
                      type="email"
                      placeholder="contact@company.com"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Phone
                    </label>
                    <Input
                      placeholder="+91 XXXXX XXXXX"
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Mobile
                    </label>
                    <Input
                      placeholder="Alternate mobile number"
                      value={formData.mobile}
                      onChange={(e) =>
                        handleInputChange("mobile", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Website
                  </label>
                  <Input
                    placeholder="www.example.com"
                    value={formData.website}
                    onChange={(e) =>
                      handleInputChange("website", e.target.value)
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Contract Start Date *
                    </label>
                    <Input
                      type="date"
                      value={formData.contract_start_date}
                      onChange={(e) =>
                        handleInputChange("contract_start_date", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Contract End Date *
                    </label>
                    <Input
                      type="date"
                      value={formData.contract_end_date}
                      onChange={(e) =>
                        handleInputChange("contract_end_date", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Business */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-1">Step 2: Business</h2>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      GST Treatment *
                    </label>
                    <Select
                      value={formData.gst_treatment}
                      onValueChange={(value) =>
                        handleInputChange("gst_treatment", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select treatment" />
                      </SelectTrigger>
                      <SelectContent>
                        {GST_TREATMENTS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Source of Supply
                    </label>
                    <Input
                      placeholder="State/UT"
                      value={formData.source_of_supply}
                      onChange={(e) =>
                        handleInputChange("source_of_supply", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      GSTIN *
                    </label>
                    <Input
                      placeholder="27AABCT1234A1Z5"
                      value={formData.gstin}
                      onChange={(e) =>
                        handleInputChange("gstin", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      PAN Number *
                    </label>
                    <Input
                      placeholder="AAAAA0000A"
                      value={formData.pan_number}
                      onChange={(e) =>
                        handleInputChange("pan_number", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Currency
                    </label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) =>
                        handleInputChange("currency", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((curr) => (
                          <SelectItem key={curr} value={curr}>
                            {curr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Opening Balance
                    </label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.opening_balance}
                      onChange={(e) =>
                        handleInputChange("opening_balance", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Financial */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-1">Step 3: Financial</h2>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Payment Terms *
                    </label>
                    <Select
                      value={formData.payment_terms}
                      onValueChange={(value) =>
                        handleInputChange("payment_terms", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Net 30" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_TERMS.map((term) => (
                          <SelectItem key={term} value={term}>
                            {term}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      TDS Rate (%)
                    </label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.tds_rate}
                      onChange={(e) =>
                        handleInputChange("tds_rate", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Bank Name *
                    </label>
                    <Input
                      placeholder="Bank name"
                      value={formData.bank_name}
                      onChange={(e) =>
                        handleInputChange("bank_name", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Account Number *
                    </label>
                    <Input
                      placeholder="Account number"
                      value={formData.account_number}
                      onChange={(e) =>
                        handleInputChange("account_number", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      IFSC Code
                    </label>
                    <Input
                      placeholder="SBIN0001234"
                      value={formData.ifsc_code}
                      onChange={(e) =>
                        handleInputChange("ifsc_code", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Branch
                    </label>
                    <Input
                      placeholder="Branch name"
                      value={formData.branch}
                      onChange={(e) =>
                        handleInputChange("branch", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Address */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-1">Step 4: Address</h2>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Billing Address *
                  </label>
                  <Textarea
                    placeholder="Street address"
                    value={formData.billing_address}
                    onChange={(e) =>
                      handleInputChange("billing_address", e.target.value)
                    }
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Shipping Address
                  </label>
                  <Textarea
                    placeholder="Street address"
                    value={formData.shipping_address}
                    onChange={(e) =>
                      handleInputChange("shipping_address", e.target.value)
                    }
                    rows={3}
                    disabled={formData.same_address}
                  />
                  <label className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      checked={formData.same_address}
                      onChange={(e) =>
                        handleInputChange("same_address", e.target.checked)
                      }
                      className="mr-2"
                    />
                    <span className="text-sm">
                      Shipping address same as billing
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Billing City *
                    </label>
                    <Input
                      placeholder="City"
                      value={formData.billing_city}
                      onChange={(e) =>
                        handleInputChange("billing_city", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Shipping City
                    </label>
                    <Input
                      placeholder="City"
                      value={formData.shipping_city}
                      onChange={(e) =>
                        handleInputChange("shipping_city", e.target.value)
                      }
                      disabled={formData.same_address}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Billing State *
                    </label>
                    <Select
                      value={formData.billing_state}
                      onValueChange={(value) =>
                        handleInputChange("billing_state", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDIAN_STATES.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Shipping State
                    </label>
                    <Select
                      value={formData.shipping_state}
                      onValueChange={(value) =>
                        handleInputChange("shipping_state", value)
                      }
                      disabled={formData.same_address}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDIAN_STATES.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Billing Pincode *
                    </label>
                    <Input
                      placeholder="400001"
                      value={formData.billing_pincode}
                      onChange={(e) =>
                        handleInputChange("billing_pincode", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Shipping Pincode
                    </label>
                    <Input
                      placeholder="400001"
                      value={formData.shipping_pincode}
                      onChange={(e) =>
                        handleInputChange("shipping_pincode", e.target.value)
                      }
                      disabled={formData.same_address}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Documents */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-1">
                    Step 5: Documents
                  </h2>
                  <p className="text-sm text-gray-600">
                    Upload Documents (GST Certificate, PAN Card, etc.)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Choose Files
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="block w-full border border-gray-300 rounded-lg p-3 cursor-pointer"
                  />
                  {formData.documents.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {formData.documents.map((doc, idx) => (
                        <div
                          key={idx}
                          className="text-sm text-gray-600 flex items-center gap-2"
                        >
                          <span>📄</span> {doc.name}
                        </div>
                      ))}
                    </div>
                  )}
                  {!formData.documents.length && (
                    <p className="text-sm text-gray-500 mt-2">No file chosen</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6">
          <div>
            {step > 0 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" /> Previous
              </Button>
            )}
            {step === 0 && (
              <Button
                variant="ghost"
                onClick={() => navigate("/clients")}
              >
                Cancel
              </Button>
            )}
          </div>

          <div className="flex gap-3">
            {step === STEPS.length - 1 && (
              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" /> Download Template
              </Button>
            )}
            {step < STEPS.length - 1 && (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="bg-[#4A6CF7] hover:bg-[#3B5DE8] text-white flex items-center gap-2"
              >
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            {step === STEPS.length - 1 && (
              <Button
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              >
                <Check className="h-4 w-4" /> Register Client
              </Button>
            )}
          </div>
        </div>
      </div>
        )}

        {/* Magic Upload Modal */}
        {showMagicUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-bold">Magic Upload</h2>
              <p className="text-sm text-gray-600">
                Upload a CSV file to auto-fill client details
              </p>
              <input
                type="file"
                accept=".csv"
                className="block w-full border border-gray-300 rounded-lg p-3"
              />
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowMagicUpload(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-[#4A6CF7] hover:bg-[#3B5DE8] text-white"
                  onClick={() => {
                    setShowMagicUpload(false);
                    toast.success("File uploaded successfully");
                  }}
                >
                  Upload
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        )}
      </div>
    </div>
  );
}
