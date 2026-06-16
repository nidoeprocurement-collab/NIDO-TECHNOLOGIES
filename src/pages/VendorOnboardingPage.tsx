import { useState } from "react";
import { ArrowLeft, Check, ChevronRight, Upload, User, Briefcase, FileText, MapPin, Files } from "lucide-react";

const ONBOARDING_STEPS = [
  { id: 1, label: "Basic Info", icon: User },
  { id: 2, label: "Business", icon: Briefcase },
  { id: 3, label: "Financial", icon: FileText },
  { id: 4, label: "Address", icon: MapPin },
  { id: 5, label: "Documents", icon: Files },
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
      console.log("[v0] Completed Step " + currentStep);
    } else {
      console.log("[v0] Onboarding Complete!");
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
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Vendor Onboarding</h1>
              <p className="text-xs text-gray-500">Complete all 5 steps to register a new vendor</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Progress Steps with Icons */}
        <div className="mb-8 bg-white p-8 rounded-lg border">
          <div className="flex items-center justify-between">
            {ONBOARDING_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              
              return (
                <div key={step.id} className="flex flex-col items-center flex-1">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full mb-2 relative" 
                    style={{
                      backgroundColor: isActive || isCompleted ? '#3B82F6' : '#E5E7EB',
                      color: isActive || isCompleted ? 'white' : '#6B7280'
                    }}>
                    {isCompleted ? <Check size={24} /> : <Icon size={24} />}
                  </div>
                  <p className={`text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-600'}`}>{step.label}</p>
                  {idx < ONBOARDING_STEPS.length - 1 && (
                    <div className="absolute top-8 left-[calc(50%+40px)] w-[calc(100%-80px)] h-1"
                      style={{backgroundColor: isCompleted ? '#3B82F6' : '#E5E7EB'}}></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Magic Upload */}
        {currentStep === 1 && (
          <div className="mb-6 border-2 border-dashed border-blue-400 p-8 rounded-lg bg-blue-50">
            <div className="flex items-center justify-center gap-2">
              <Upload size={20} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-600 cursor-pointer">Magic Upload</span>
            </div>
          </div>
        )}

        {/* Form Content */}
        <div className="bg-white p-8 rounded-lg border mb-8">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            Cancel
          </button>
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
          >
            {currentStep === ONBOARDING_STEPS.length ? "Complete" : "Next"}
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
