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
import { ArrowLeft, Check, ChevronRight, Upload, Loader2 } from "lucide-react";

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
  "Cloud Services",
  "Office Supplies",
  "Security Systems",
  "Consulting",
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

export default function VendorOnboardingPage() {
  const navigate = useNavigate();
  const { id: vendorIdToEdit } = useParams<{ id: string }>();
  const [step, setStep] = useState(0);
  const [showMagicUpload, setShowMagicUpload] = useState(false);
  const [isLoading, setIsLoading] = useState(!!vendorIdToEdit);

  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    vendor_id: "", // Auto-generated
    company_name: "",
    category: "",
    vendor_tier: "",
    contact_person: "",
    email: "",
    phone: "",
    mobile: "",
    website: "",
    contract_start_date: "",
    contract_end_date: "",
    vendor_logo: null as File | null,
    vendor_logo_url: "",

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

  const [vendorTiers, setVendorTiers] = useState([
    "Premium Vendors",
    "Standard Vendors",
    "Emerging Vendors",
  ]);
  const [showAddTier, setShowAddTier] = useState(false);
  const [newTier, setNewTier] = useState("");

  // Load vendor data for editing or generate Vendor ID for new vendor
  useEffect(() => {
    if (vendorIdToEdit) {
      // Load existing vendor data for mock
      console.log("[v0] Loading vendor data for:", vendorIdToEdit);
      
      // Mock data for editing
      const mockVendor = {
        vendor_id: "VND-00001",
        company_name: "Tech Supplies Inc",
        category: "IT Hardware",
        vendor_tier: "Premium Vendors",
        contact_person: "Jane Smith",
        email: "jane@techsupplies.com",
        phone: "+91 98765 43210",
        mobile: "+91 99876 54321",
        website: "www.techsupplies.com",
        contract_start_date: "2024-01-01",
        contract_end_date: "2025-01-01",
        gst_treatment: "Registered Business",
        gstin: "27AABCT1234A1Z5",
        source_of_supply: "Maharashtra",
        pan_number: "AAAAA0000A",
        currency: "INR",
        opening_balance: "50000",
        payment_terms: "Net 30",
        tds_rate: "1.0",
        bank_name: "ICIC Bank",
        account_number: "9876543210",
        ifsc_code: "ICIC0001234",
        branch: "Mumbai",
        billing_address: "456 Industrial Street, Suite 200",
        billing_city: "Mumbai",
        billing_state: "Maharashtra",
        billing_pincode: "400002",
        shipping_address: "456 Industrial Street, Suite 200",
        shipping_city: "Mumbai",
        shipping_state: "Maharashtra",
        shipping_pincode: "400002",
      };

      setFormData((prev) => ({
        ...prev,
        ...mockVendor,
      }));
      setIsLoading(false);
    } else {
      // Generate new Vendor ID
      setIsLoading(true);
      const timer = setTimeout(() => {
        // Generate next ID: VND-00001, VND-00002, etc.
        const nextNumber = Math.floor(Math.random() * 10000) + 1;
        const vendorId = `VND-${String(nextNumber).padStart(5, "0")}`;

        setFormData((prev) => ({
          ...prev,
          vendor_id: vendorId,
        }));
        setIsLoading(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [vendorIdToEdit]);

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
        formData.vendor_id.trim() &&
        formData.company_name.trim() &&
        formData.category &&
        formData.vendor_tier &&
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
      "Vendor ID",
      "Company Name",
      "Category",
      "Vendor Tier",
      "Contact Person",
      "Email",
      "Phone",
      "Mobile",
      "Website",
      "Contract Start Date",
      "Contract End Date",
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
    link.download = `vendor_template_${new Date().toISOString().split("T")[0]}.csv`;
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
      console.log("[v0] Saving vendor data:", formData.company_name);

      // Mock save operation
      const vendorData = {
        company_name: formData.company_name,
        category: formData.category,
        vendor_tier: formData.vendor_tier,
        contact_person: formData.contact_person,
        email: formData.email,
        phone: formData.phone,
        mobile: formData.mobile,
        website: formData.website,
        contract_start_date: formData.contract_start_date,
        contract_end_date: formData.contract_end_date,
        vendor_logo_url: formData.vendor_logo_url,
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
      const vendors = JSON.parse(localStorage.getItem("vendors") || "[]");
      if (vendorIdToEdit) {
        const index = vendors.findIndex(
          (v: any) => v.vendor_id === formData.vendor_id
        );
        if (index > -1) {
          vendors[index] = { ...vendors[index], ...vendorData };
        }
        console.log("[v0] Vendor updated successfully");
        toast.success("Vendor updated successfully");
      } else {
        vendors.push({ vendor_id: formData.vendor_id, ...vendorData });
        console.log("[v0] Vendor saved successfully");
        toast.success("Vendor registered successfully");
      }
      localStorage.setItem("vendors", JSON.stringify(vendors));

      // Navigate back to vendors page after successful save
      setTimeout(() => {
        navigate("/vendors");
      }, 1000);
    } catch (err) {
      console.error("[v0] Error:", err);
      toast.error("An error occurred while saving");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-3 sm:p-4 md:p-6 sticky top-0 z-40">
        <div className="flex items-start justify-between w-full">
          <button
            onClick={() => navigate("/vendors")}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-1 text-sm"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Vendors
          </button>
          <div className="text-right">
            <h1 className="text-2xl font-bold">
              {vendorIdToEdit ? "Edit Vendor" : "Vendor Onboarding"}
            </h1>
            <p className="text-sm text-gray-500">
              {vendorIdToEdit
                ? "Update vendor information"
                : "Complete all 5 steps to register a new vendor"}
            </p>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4 md:p-6 lg:p-8 w-full">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-[#4A6CF7] animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading vendor information...</p>
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
            {step === 0 && (
              <div
                className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-6 mb-6 cursor-pointer hover:bg-blue-100 transition-colors"
                onClick={() => setShowMagicUpload(true)}
              >
                <div className="flex items-center gap-2 text-blue-600">
                  <Upload className="h-5 w-5" />
                  <span className="font-medium">Magic Upload</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Upload a template file to auto-fill vendor details
                </p>
              </div>
            )}

            {/* Step Content */}
            <Card className="bg-white">
              <CardContent className="p-4 md:p-6 lg:p-8">
                {/* Step 1: Basic Info */}
                {step === 0 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold mb-1">Step 1: Basic Info</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Vendor ID
                        </label>
                        <Input
                          placeholder="Auto-generated"
                          value={formData.vendor_id}
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
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
                          Vendor Tier *
                        </label>
                        <Select
                          value={formData.vendor_tier}
                          onValueChange={(value) => {
                            if (value === "add_new") {
                              setShowAddTier(true);
                            } else {
                              handleInputChange("vendor_tier", value);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select tier" />
                          </SelectTrigger>
                          <SelectContent>
                            {vendorTiers.map((tier) => (
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
                                    setVendorTiers([...vendorTiers, newTier]);
                                    handleInputChange("vendor_tier", newTier);
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Vendor Logo (PNG)
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
                                  handleInputChange("vendor_logo", file);
                                  handleInputChange("vendor_logo_url", event.target?.result);
                                };
                                reader.readAsDataURL(file);
                              } else {
                                toast.error("Please upload a PNG file");
                              }
                            }
                          }}
                          className="block w-full text-sm text-gray-500 border border-gray-300 rounded-md cursor-pointer focus:outline-none"
                        />
                        {formData.vendor_logo_url && (
                          <div className="mt-2">
                            <img
                              src={formData.vendor_logo_url}
                              alt="Logo preview"
                              className="h-16 w-16 rounded object-cover"
                            />
                          </div>
                        )}
                      </div>
                      <div></div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
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
                          placeholder="+91 XXXXX XXXXX"
                          value={formData.mobile}
                          onChange={(e) =>
                            handleInputChange("mobile", e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
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
                      <div></div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
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
                      <h2 className="text-xl font-bold mb-1">Step 2: Business Details</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
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
                            {GST_TREATMENTS.map((treatment) => (
                              <SelectItem key={treatment} value={treatment}>
                                {treatment}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
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
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Source of Supply
                        </label>
                        <Select
                          value={formData.source_of_supply}
                          onValueChange={(value) =>
                            handleInputChange("source_of_supply", value)
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
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
                            <SelectValue placeholder="Select currency" />
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
                          placeholder="0.00"
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
                      <h2 className="text-xl font-bold mb-1">Step 3: Financial Information</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
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
                            <SelectValue placeholder="Select terms" />
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
                          placeholder="0.0"
                          value={formData.tds_rate}
                          onChange={(e) =>
                            handleInputChange("tds_rate", e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
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

                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-base mb-4">Billing Address</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Address *
                            </label>
                            <Textarea
                              placeholder="Street address"
                              value={formData.billing_address}
                              onChange={(e) =>
                                handleInputChange("billing_address", e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              City *
                            </label>
                            <Input
                              placeholder="City"
                              value={formData.billing_city}
                              onChange={(e) =>
                                handleInputChange("billing_city", e.target.value)
                              }
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mt-6">
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              State *
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
                              Pincode *
                            </label>
                            <Input
                              placeholder="400001"
                              value={formData.billing_pincode}
                              onChange={(e) =>
                                handleInputChange("billing_pincode", e.target.value)
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 my-4 p-3 bg-blue-50 rounded-lg">
                        <input
                          type="checkbox"
                          id="same_address"
                          checked={formData.same_address}
                          onChange={(e) =>
                            handleInputChange("same_address", e.target.checked)
                          }
                          className="w-4 h-4"
                        />
                        <label htmlFor="same_address" className="text-sm font-medium">
                          Shipping address same as billing
                        </label>
                      </div>

                      {!formData.same_address && (
                        <div>
                          <h3 className="font-semibold text-base mb-4">Shipping Address</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Address
                              </label>
                              <Textarea
                                placeholder="Street address"
                                value={formData.shipping_address}
                                onChange={(e) =>
                                  handleInputChange("shipping_address", e.target.value)
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                City
                              </label>
                              <Input
                                placeholder="City"
                                value={formData.shipping_city}
                                onChange={(e) =>
                                  handleInputChange("shipping_city", e.target.value)
                                }
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mt-6">
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                State
                              </label>
                              <Select
                                value={formData.shipping_state}
                                onValueChange={(value) =>
                                  handleInputChange("shipping_state", value)
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
                                Pincode
                              </label>
                              <Input
                                placeholder="400001"
                                value={formData.shipping_pincode}
                                onChange={(e) =>
                                  handleInputChange("shipping_pincode", e.target.value)
                                }
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 5: Documents */}
                {step === 4 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold mb-1">Step 5: Documents</h2>
                    </div>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 md:p-6 lg:p-8 text-center">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Upload GST Certificate, PAN Card, and Bank Documents</p>
                      <input
                        type="file"
                        multiple
                        onChange={(e) => handleFileSelect(e.target.files)}
                        className="mt-4 hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="mt-4 px-4 py-2 bg-[#4A6CF7] text-white rounded-lg hover:bg-[#3B5DE8] cursor-pointer inline-block"
                      >
                        Upload Files
                      </label>
                    </div>

                    {formData.documents.length > 0 && (
                      <div className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-2">Uploaded Files:</h3>
                        <ul className="space-y-2">
                          {formData.documents.map((doc, idx) => (
                            <li key={idx} className="text-sm text-gray-600">
                              {doc.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Review Step */}
                {step === 5 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold mb-1">Review & Submit</h2>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-blue-900">
                        Please review all the information provided below and submit for verification.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 text-sm">
                      <div>
                        <p className="text-gray-600">Company Name</p>
                        <p className="font-semibold">{formData.company_name}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Category</p>
                        <p className="font-semibold">{formData.category}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Contact Person</p>
                        <p className="font-semibold">{formData.contact_person}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Email</p>
                        <p className="font-semibold">{formData.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">GSTIN</p>
                        <p className="font-semibold">{formData.gstin || "Not provided"}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Bank</p>
                        <p className="font-semibold">{formData.bank_name || "Not provided"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  if (step > 0) {
                    setStep(step - 1);
                  }
                }}
                disabled={step === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> Previous
              </Button>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={downloadTemplate}
                >
                  Download Template
                </Button>
                {step === 4 ? (
                  <Button
                    className="bg-[#4A6CF7] hover:bg-[#3B5DE8] text-white"
                    onClick={handleSave}
                    disabled={!canProceed()}
                  >
                    Submit Vendor
                  </Button>
                ) : (
                  <Button
                    className="bg-[#4A6CF7] hover:bg-[#3B5DE8] text-white"
                    onClick={() => {
                      if (canProceed()) {
                        setStep(step + 1);
                      }
                    }}
                    disabled={!canProceed()}
                  >
                    Next <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
