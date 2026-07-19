'use client';

import React, { useState } from 'react';
import { Cloud, Plus, Trash2, Star } from 'lucide-react';
import { CATEGORY_LIST, CATEGORY_SUBCATEGORIES } from '@/lib/categories';

export default function AddVendorPage() {
  // Dropdown options data
  const categories = [...CATEGORY_LIST, '+ Add New Category'];
  
  const subCategories: Record<string, string[]> = Object.fromEntries(
    Object.entries(CATEGORY_SUBCATEGORIES).map(([k, v]) => [k, [...(v as string[]), '+ Add New Sub Category']])
  );

  const contacts = [
    { name: 'Rahul Sharma', title: 'Manager - Sales' },
    { name: 'Amit Verma', title: 'Regional Manager' },
    { name: 'Neha Kapoor', title: 'Senior Director' },
    { name: 'Pooja Nair', title: 'Partner Manager' },
    { name: 'Rohit Mehta', title: 'Sales Lead' },
    { name: '+ Add New Contact', title: '' },
  ];

  const designations = ['CEO / Director', 'Managing Director', 'Vice President', 'General Manager', 'Manager', 'Assistant Manager', 'Executive', 'Specialist', 'Others', '+ Add New Designation'];
  
  const vendorTypes = ['Supplier', 'Manufacturer', 'Distributor', 'Reseller', 'Service Provider', 'Consultant', 'Contractor', 'OEM', 'Others', '+ Add New Vendor Type'];
  
  const years = ['2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015 & Below'];
  
  const phoneCodes = ['+91 (India)', '+1 (USA)', '+44 (UK)', '+971 (UAE)', '+65 (Singapore)', '+61 (Australia)', '+86 (China)', '+81 (Japan)', '+49 (Germany)', '+33 (France)', '+ Add New Code'];
  
  const countries = ['India', 'United States', 'United Kingdom', 'United Arab Emirates', 'Singapore', 'Australia', 'China', 'Japan', 'Germany', 'France', 'Others', '+ Add New Country'];
  
  const states = ['Karnataka', 'Maharashtra', 'Delhi', 'Tamil Nadu', 'Gujarat', 'Uttar Pradesh', 'West Bengal', 'Telangana', 'Rajasthan', 'Others', '+ Add New State'];
  
  const cities = ['Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad', 'Noida', 'Others', '+ Add New City'];
  
  const paymentTerms = ['7 Days', '15 Days', '30 Days', '45 Days', '60 Days', '90 Days', '120 Days', 'Net 15', 'Net 30', 'Net 60', '+ Add New Term'];
  
  const currencies = ['INR - Indian Rupee', 'USD - US Dollar', 'EUR - Euro', 'GBP - British Pound', 'AED - UAE Dirham', 'SGD - Singapore Dollar', '+ Add New Currency'];
  
  const accountTypes = ['Current Account', 'Saving Account', 'Overdraft Account', 'Cash Credit Account', 'Others', '+ Add New Account Type'];
  
  const msmeStatuses = ['Micro', 'Small', 'Medium', 'Not MSME', '+ Add New Status'];
  
  const isoCertifications = ['ISO 9001', 'ISO 14001', 'ISO 27001', 'ISO 45001', 'ISO 50001', 'Others', '+ Add New Certification'];
  
  const qualityCertifications = ['CE Certified', 'RoHS Compliant', 'BIS Certified', 'UL Certified', 'FCC Certified', 'Others', '+ Add New Certification'];
  
  const environmentalCertifications = ['ISO 14001', 'ISO 50001', 'Green Building', 'LEED Certified', 'Others', '+ Add New Certification'];
  
  const ratingLabels = { 5: 'Excellent', 4: 'Very Good', 3: 'Good', 2: 'Average', 1: 'Poor' };
  
  const blacklistedOptions = ['No', 'Under Review', 'Yes'];
  
  const contractStatuses = ['Active', 'Inactive', 'Expired', 'Terminated', 'Under Review', '+ Add New Status'];
  
  const preferredOptions = ['Yes', 'No'];
  
  const tagOptions = ['IT Hardware', 'Office Supplies', 'Services', 'Preferred Vendor', 'New Vendor', 'Critical Vendor', '+ Add New Tag'];
  
  const visibilityOptions = ['Internal Only', 'Procurement Team', 'Finance Team', 'Management', 'All Users', '+ Add New Visibility'];

  const [formData, setFormData] = useState({
    vendorName: '',
    vendorCode: 'Auto-generated',
    category: '',
    subCategory: '',
    vendorType: '',
    pan: '',
    legalEntityName: '',
    yearOfEstablishment: '',
    website: '',
    contactPerson: '',
    designation: '',
    email: '',
    phone: '+91 (India)',
    phoneNumber: '',
    mobile: '+91 (India)',
    mobileNumber: '',
    alternateEmail: '',
    registeredAddress: '',
    billingAddress: '',
    country: '',
    state: '',
    city: '',
    pincode: '',
    sameAsRegistered: false,
    paymentTerms: '',
    currency: 'INR - Indian Rupee',
    creditLimit: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountType: '',
    msmeStatus: '',
    isoStatus: '',
    qualityCertification: '',
    environmentalCertification: '',
    qualityRating: 0,
    deliveryRating: 0,
    serviceRating: 0,
    blacklisted: '',
    contractStatus: '',
    onboardingDate: '',
    preferredVendor: '',
    tags: [],
    internalNotes: '',
    visibility: '',
    documents: [],
    gstCertificate: false,
    panCard: false,
    businessRegistration: false,
    bankDetails: false,
    isoCertificate: false,
    otherDocuments: false,
  });

  const [tagInput, setTagInput] = useState('');
  const [subCategoryOptions, setSubCategoryOptions] = useState([]);

  const handleAddTag = () => {
    if (tagInput.trim()) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (index) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Update subcategories when category changes
    if (name === 'category') {
      setSubCategoryOptions(subCategories[value] || []);
      setFormData(prev => ({
        ...prev,
        subCategory: ''
      }));
    }
  };

  const handleRatingChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const StarRating = ({ value, onChange, name }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onChange(name, star)}
            className="p-1 hover:bg-gray-100 rounded transition"
          >
            <Star
              size={20}
              className={star <= value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 sticky top-0 z-10 bg-white">
        <div className="px-8 py-2 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Vendor</h1>
            <p className="text-sm text-gray-600 mt-1">Create a new vendor profile. All fields marked with <span className="text-red-600">*</span> are required.</p>
          </div>
          <div className="flex gap-3">
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="px-8 py-2 space-y-12">
        {/* Section 1: Vendor Information */}
        <FormSection number={1} title="Vendor Information">
          <div className="grid grid-cols-2 gap-6">
            <FormField
              label="Vendor Name"
              required
              input={
                <input
                  type="text"
                  placeholder="Enter vendor name"
                  name="vendorName"
                  value={formData.vendorName}
                  onChange={handleChange}
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              }
            />
            <FormField
              label="Vendor Code"
              input={<input
                type="text"
                placeholder="Auto-generated"
                disabled
                value={formData.vendorCode}
                className="w-full px-2 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600" />} required={undefined}            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <FormField
              label="Category"
              required
              input={
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              }
            />
            <FormField
              label="Sub Category"
              input={<select
                name="subCategory"
                value={formData.subCategory}
                onChange={handleChange}
                className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!formData.category}
              >
                <option value="">Select sub category</option>
                {subCategoryOptions.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>} required={undefined}            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <FormField
              label="Vendor Type"
              required
              input={
                <select
                  name="vendorType"
                  value={formData.vendorType}
                  onChange={handleChange}
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select vendor type</option>
                  {vendorTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              }
            />
            <FormField
              label="PAN"
              input={<input
                type="text"
                placeholder="Enter PAN"
                name="pan"
                value={formData.pan}
                onChange={handleChange}
                className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />} required={undefined}            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <FormField
              label="Legal Entity Name"
              input={<input
                type="text"
                placeholder="Enter legal entity name"
                name="legalEntityName"
                value={formData.legalEntityName}
                onChange={handleChange}
                className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />} required={undefined}            />
            <FormField
              label="Year of Establishment"
              input={<select
                name="yearOfEstablishment"
                value={formData.yearOfEstablishment}
                onChange={handleChange}
                className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select year</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>} required={undefined}            />
          </div>

          <FormField
            label="Website"
            input={<input
              type="text"
              placeholder="Enter website URL"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />} required={undefined}          />
        </FormSection>

        {/* Section 2: Primary Contact */}
        <FormSection number={2} title="Primary Contact">
          <div className="grid grid-cols-2 gap-6">
            <FormField
              label="Contact Person"
              required
              input={
                <select
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select contact person</option>
                  {contacts.map((contact, idx) => {
                    if (contact.name === '+ Add New Contact') {
                      return <option key={idx} value="add-new">{contact.name}</option>;
                    }
                    return <option key={contact.name} value={contact.name}>{contact.name} ({contact.title})</option>;
                  })}
                </select>
              }
            />
            <FormField
              label="Designation"
              input={<select
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select designation</option>
                {designations.map(des => (
                  <option key={des} value={des}>{des}</option>
                ))}
              </select>} required={undefined}            />
          </div>

          <FormField
            label="Email"
            required
            input={
              <input
                type="email"
                placeholder="name@company.com"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            }
          />

          <div className="grid grid-cols-2 gap-6">
            <FormField
              label="Phone"
              required
              input={
                <div className="flex gap-2">
                  <select
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {phoneCodes.map(code => (
                      <option key={code} value={code}>{code}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Enter phone number"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="flex-1 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              }
            />
            <FormField
              label="Mobile"
              input={<div className="flex gap-2">
                <select
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {phoneCodes.map(code => (
                    <option key={code} value={code}>{code}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Enter mobile number"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  className="flex-1 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>} required={undefined}            />
          </div>

          <FormField
            label="Alternate Email"
            input={<input
              type="email"
              placeholder="Enter alternate email"
              name="alternateEmail"
              value={formData.alternateEmail}
              onChange={handleChange}
              className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />} required={undefined}          />
        </FormSection>

        {/* Section 3: Business & Address Details */}
        <FormSection number={3} title="Business & Address Details">
          <FormField
            label="Registered Address"
            required
            input={
              <textarea
                placeholder="Enter registered address"
                name="registeredAddress"
                value={formData.registeredAddress}
                onChange={handleChange}
                rows={2}
                className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            }
          />

          <div className="grid grid-cols-2 gap-6">
            <FormField
              label="Country"
              required
              input={
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select country</option>
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              }
            />
            <FormField
              label="State"
              required
              input={
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select state</option>
                  {states.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <FormField
              label="City"
              required
              input={
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select city</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              }
            />
            <FormField
              label="Pincode"
              required
              input={
                <input
                  type="text"
                  placeholder="Enter pincode"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              }
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="sameAsRegistered"
              checked={formData.sameAsRegistered}
              onChange={handleChange}
              className="w-4 h-4 rounded border-gray-300"
            />
            <label className="text-sm text-gray-700">Same as Registered Address</label>
          </div>

          <FormField
            label="Billing Address"
            input={<textarea
              placeholder="Enter billing address"
              name="billingAddress"
              value={formData.billingAddress}
              onChange={handleChange}
              rows={2}
              className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />} required={undefined}          />
        </FormSection>

        {/* Section 4: Financial Details */}
        <FormSection number={4} title="Financial Details">
          <div className="grid grid-cols-2 gap-6">
            <FormField
              label="Payment Terms"
              input={<select
                name="paymentTerms"
                value={formData.paymentTerms}
                onChange={handleChange}
                className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select payment terms</option>
                {paymentTerms.map(term => (
                  <option key={term} value={term}>{term}</option>
                ))}
              </select>} required={undefined}            />
            <FormField
              label="Currency"
              required
              input={
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {currencies.map(curr => (
                    <option key={curr} value={curr}>{curr}</option>
                  ))}
                </select>
              }
            />
          </div>

          <FormField
            label="Credit Limit (INR)"
            input={<input
              type="text"
              placeholder="Enter amount"
              name="creditLimit"
              value={formData.creditLimit}
              onChange={handleChange}
              className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />} required={undefined}          />

          <div className="grid grid-cols-2 gap-6">
            <FormField
              label="Bank Name"
              input={<input
                type="text"
                placeholder="Enter bank name"
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />} required={undefined}            />
            <FormField
              label="Account Number"
              input={<input
                type="text"
                placeholder="Enter account number"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />} required={undefined}            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <FormField
              label="IFSC Code"
              input={<input
                type="text"
                placeholder="Enter IFSC code"
                name="ifscCode"
                value={formData.ifscCode}
                onChange={handleChange}
                className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />} required={undefined}            />
            <FormField
              label="Account Type"
              input={<select
                name="accountType"
                value={formData.accountType}
                onChange={handleChange}
                className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select account type</option>
                {accountTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>} required={undefined}            />
          </div>
        </FormSection>

        {/* Section 5: Vendor Classification */}
        <FormSection number={5} title="Vendor Classification">
          <div className="grid grid-cols-2 gap-6">
            <FormField
              label="MSME Status"
              input={<select
                name="msmeStatus"
                value={formData.msmeStatus}
                onChange={handleChange}
                className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select status</option>
                {msmeStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>} required={undefined}            />
            <FormField
              label="ISO Certification"
              input={<select
                name="isoStatus"
                value={formData.isoStatus}
                onChange={handleChange}
                className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select certification</option>
                {isoCertifications.map(cert => (
                  <option key={cert} value={cert}>{cert}</option>
                ))}
              </select>} required={undefined}            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <FormField
              label="Quality Certification"
              input={<select
                name="qualityCertification"
                value={formData.qualityCertification}
                onChange={handleChange}
                className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select certification</option>
                {qualityCertifications.map(cert => (
                  <option key={cert} value={cert}>{cert}</option>
                ))}
              </select>} required={undefined}            />
            <FormField
              label="Environmental Certification"
              input={<select
                name="environmentalCertification"
                value={formData.environmentalCertification}
                onChange={handleChange}
                className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select certification</option>
                {environmentalCertifications.map(cert => (
                  <option key={cert} value={cert}>{cert}</option>
                ))}
              </select>} required={undefined}            />
          </div>
        </FormSection>

        {/* Section 6: Performance & Compliance */}
        <FormSection number={6} title="Performance & Compliance">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Quality Rating</label>
              <StarRating value={formData.qualityRating} onChange={handleRatingChange} name="qualityRating" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Blacklisted</label>
              <select
                name="blacklisted"
                value={formData.blacklisted}
                onChange={handleChange}
                className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select status</option>
                {blacklistedOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Delivery Rating</label>
              <StarRating value={formData.deliveryRating} onChange={handleRatingChange} name="deliveryRating" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contract Status</label>
              <select
                name="contractStatus"
                value={formData.contractStatus}
                onChange={handleChange}
                className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select status</option>
                {contractStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Service Rating</label>
              <StarRating value={formData.serviceRating} onChange={handleRatingChange} name="serviceRating" />
            </div>
            <FormField
              label="Onboarding Date"
              input={<input
                type="date"
                name="onboardingDate"
                value={formData.onboardingDate}
                onChange={handleChange}
                className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />} required={undefined}            />
          </div>

          <FormField
            label="Preferred Vendor"
            input={<select
              name="preferredVendor"
              value={formData.preferredVendor}
              onChange={handleChange}
              className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select status</option>
              {preferredOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>} required={undefined}          />
        </FormSection>

        {/* Section 7: Documents */}
        <FormSection number={7} title="Documents">
          <div className="border-2 border-dashed border-blue-300 rounded-lg p-2 text-center mb-6">
            <Cloud className="w-12 h-12 text-blue-400mb-3" />
            <p className="text-gray-700 font-medium mb-2">Drag and drop files here</p>
            <p className="text-gray-500 text-sm mb-4">or click to upload</p>
            <p className="text-gray-500 text-xs mb-2">Supported files: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG</p>
            <p className="text-gray-500 text-xs">Max file size: 10MB</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">Document Checklist</label>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="gstCertificate"
                  checked={formData.gstCertificate}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <label className="text-sm text-gray-700">GST Certificate</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="bankDetails"
                  checked={formData.bankDetails}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <label className="text-sm text-gray-700">Bank Details</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="panCard"
                  checked={formData.panCard}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <label className="text-sm text-gray-700">PAN Card</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isoCertificate"
                  checked={formData.isoCertificate}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <label className="text-sm text-gray-700">ISO Certificate</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="businessRegistration"
                  checked={formData.businessRegistration}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <label className="text-sm text-gray-700">Business Registration</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="otherDocuments"
                  checked={formData.otherDocuments}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <label className="text-sm text-gray-700">Other Documents</label>
              </div>
            </div>
          </div>
        </FormSection>

        {/* Section 8: Additional Information */}
        <FormSection number={8} title="Additional Information">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Tags</label>
              <select
                multiple
                name="tags"
                value={formData.tags}
                onChange={(e) => {
                  const selectedTags = Array.from(e.target.selectedOptions, option => option.value);
                  setFormData(prev => ({ ...prev, tags: selectedTags }));
                }}
                className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                size={6}
              >
                {tagOptions.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-2">+ Create New Tag</p>
            </div>
            
            <FormField
              label="Visibility"
              input={<select
                name="visibility"
                value={formData.visibility}
                onChange={handleChange}
                className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select visibility</option>
                {visibilityOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>} required={undefined}            />
          </div>

          <FormField
            label="Internal Notes"
            input={<textarea
              placeholder="Add any internal notes"
              name="internalNotes"
              value={formData.internalNotes}
              onChange={handleChange}
              rows={4}
              className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={1000} />} required={undefined}          />
          <p className="text-xs text-gray-500 text-right">{formData.internalNotes.length}/1000 characters</p>
        </FormSection>

        {/* Bottom Actions */}
        <div className="flex gap-3 py-2 border-t border-gray-200">
          <button className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
            Cancel
          </button>
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            Save Vendor
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionIndicator({ number, title }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
        {number}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
    </div>
  );
}

function FormSection({ number, title, children }) {
  return (
    <div className="border-l-4 border-blue-600 pl-6 py-2">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
          {number}
        </div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

function FormField({ label, required, input }) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}
      {input}
    </div>
  );
}
