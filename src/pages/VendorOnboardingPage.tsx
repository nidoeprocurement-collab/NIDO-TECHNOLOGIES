import { useState } from "react";
import { toast } from "sonner";
import { Check, ChevronRight } from "lucide-react";

const ONBOARDING_STEPS = [
  { id: 1, label: "Basic Information", completed: true },
  { id: 2, label: "Business Details", completed: true },
  { id: 3, label: "Banking Information", completed: false },
  { id: 4, label: "Documents", completed: false },
  { id: 5, label: "Review", completed: false },
];

export default function VendorOnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    gstNumber: "",
    panNumber: "",
    bankName: "",
    accountNumber: "",
  });

  const handleInputChange = (e: any) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length) {
      setCurrentStep(currentStep + 1);
      toast.success(`Completed Step ${currentStep}`);
    } else {
      toast.success("Onboarding Complete!");
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-6">Basic Information</h2>
            <div>
              <label className="block text-sm font-medium mb-2">Company Name *</label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Contact Person *</label>
              <input
                type="text"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-6">Business Details</h2>
            <div>
              <label className="block text-sm font-medium mb-2">GST Number *</label>
              <input
                type="text"
                name="gstNumber"
                value={formData.gstNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">PAN Number *</label>
              <input
                type="text"
                name="panNumber"
                value={formData.panNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-6">Banking Information</h2>
            <div>
              <label className="block text-sm font-medium mb-2">Bank Name *</label>
              <input
                type="text"
                name="bankName"
                value={formData.bankName}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Account Number *</label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-6">Documents</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-gray-600">Upload GST Certificate, PAN Card, and Bank Documents</p>
              <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Upload Files
              </button>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-6">Review & Submit</h2>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-900">
                Please review all the information provided and submit for verification.
              </p>
            </div>
            <div className="space-y-2 text-sm">
              <p><strong>Company:</strong> {formData.companyName || "Not provided"}</p>
              <p><strong>Contact:</strong> {formData.contactPerson || "Not provided"}</p>
              <p><strong>GST:</strong> {formData.gstNumber || "Not provided"}</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div>
            <p className="text-xs text-gray-500">Vendor Portal / Onboarding</p>
            <h1 className="text-2xl font-bold">Vendor Onboarding</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {ONBOARDING_STEPS.map((step, idx) => (
              <div key={step.id} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                    step.id <= currentStep
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step.id < currentStep ? <Check size={20} /> : step.id}
                </div>
                <div className="ml-3">
                  <p className="font-medium">{step.label}</p>
                </div>
                {idx < ONBOARDING_STEPS.length - 1 && (
                  <div className={`flex-1 h-1 mx-4 ${step.id < currentStep ? "bg-blue-600" : "bg-gray-200"}`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white p-8 rounded-lg border mb-8">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            {currentStep === ONBOARDING_STEPS.length ? "Complete" : "Next"}
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
