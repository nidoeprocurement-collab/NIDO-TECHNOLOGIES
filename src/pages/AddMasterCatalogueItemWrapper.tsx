import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Plus, X, Bold, Italic, Underline, List, AlignLeft, AlignCenter, AlignRight, Link2, Image, Upload, 
  GripVertical, PackageIcon, Download
} from 'lucide-react';
import { toast } from 'sonner';

interface Specification {
  id: string;
  specification: string;
  value: string;
  unit: string;
}

interface GeneralSpec {
  id: string;
  category: string;
  attributeValue: string;
}

interface ProductFormData {
  productName: string;
  masterProductCode: string;
  skuCode: string;
  productType: string;
  physicalType: string;
  category: string;
  subcategory: string;
  brand: string;
  tags: string[];
  description: string;
  specifications: Specification[];
  productNotes: string;
  generalSpecifications: GeneralSpec[];
  videoUrl: string;
}

let mpcCounter = 1;

function generateMasterProductCode(): string {
  const year = new Date().getFullYear();
  const serial = String(mpcCounter++).padStart(6, '0');
  return `MPC-${year}-${serial}`;
}

export default function AddMasterCatalogueItemWrapper() {
  const [formData, setFormData] = useState<ProductFormData>({
    productName: '',
    masterProductCode: generateMasterProductCode(),
    skuCode: '',
    productType: 'Product',
    physicalType: 'Physical',
    category: '',
    subcategory: '',
    brand: '',
    tags: [],
    description: '',
    specifications: [],
    productNotes: '',
    generalSpecifications: [],
    videoUrl: '',
  });

  const [tagInput, setTagInput] = useState('');

  // State for new spec row inputs
  const [newSpecName, setNewSpecName] = useState('');
  const [newSpecValue, setNewSpecValue] = useState('');
  const [newSpecUnit, setNewSpecUnit] = useState('-');

  // State for adding new dropdown options
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addDialogType, setAddDialogType] = useState<string>('');
  const [newOptionValue, setNewOptionValue] = useState('');

  // State for dynamic dropdown options
  const [productTypesList, setProductTypesList] = useState(['Product', 'Service', 'Bundle']);
  const [physicalTypesList, setPhysicalTypesList] = useState(['Physical', 'Digital', 'Service']);
  const [categoriesList, setCategoriesList] = useState(['IT Hardware', 'Cloud Servers', 'Office Supplies', 'Networking', 'Miscellaneous']);
  const [brandsList, setBrandsList] = useState(['Apple', 'Dell', 'HP', 'Lenovo']);
  const [unitsList, setUnitsList] = useState(['-', 'ppm', 'dpi', 'pages', 'GB', 'Hz', 'mm', 'cm', 'kg', 'inch']);
  const [specificationsList, setSpecificationsList] = useState(['Print/Scan/Copy', 'Print Speed', 'Resolution', 'Function', 'Performance', 'Design']);


  // Handler to add new option to a dropdown
  const handleAddNewOption = () => {
    if (!newOptionValue.trim()) {
      toast.error('Please enter a value');
      return;
    }

    switch (addDialogType) {
      case 'productType':
        if (!productTypesList.includes(newOptionValue)) {
          setProductTypesList([...productTypesList, newOptionValue]);
          toast.success('Product Type added successfully');
        } else {
          toast.error('This option already exists');
        }
        break;
      case 'physicalType':
        if (!physicalTypesList.includes(newOptionValue)) {
          setPhysicalTypesList([...physicalTypesList, newOptionValue]);
          toast.success('Physical Type added successfully');
        } else {
          toast.error('This option already exists');
        }
        break;
      case 'category':
        if (!categoriesList.includes(newOptionValue)) {
          setCategoriesList([...categoriesList, newOptionValue]);
          toast.success('Category added successfully');
        } else {
          toast.error('This option already exists');
        }
        break;
      case 'brand':
        if (!brandsList.includes(newOptionValue)) {
          setBrandsList([...brandsList, newOptionValue]);
          toast.success('Brand added successfully');
        } else {
          toast.error('This option already exists');
        }
        break;
      case 'unit':
        if (!unitsList.includes(newOptionValue)) {
          setUnitsList([...unitsList, newOptionValue]);
          toast.success('Unit added successfully');
        } else {
          toast.error('This option already exists');
        }
        break;
      case 'specification':
        if (!specificationsList.includes(newOptionValue)) {
          setSpecificationsList([...specificationsList, newOptionValue]);
          toast.success('Specification added successfully');
        } else {
          toast.error('This option already exists');
        }
        break;
    }

    setNewOptionValue('');
    setShowAddDialog(false);
  };

  // Handler to open add new option dialog
  const openAddDialog = (type: string) => {
    setAddDialogType(type);
    setNewOptionValue('');
    setShowAddDialog(true);
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const removeTag = (index: number) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((_, i) => i !== index),
    });
  };

  // Add a specification row (called by "Add" button next to category OR "Add Specification Row" button)
  const handleAddSpecRow = () => {
    if (!newSpecName.trim()) {
      toast.error('Please enter a Specification Category name');
      return;
    }
    const newSpec: Specification = {
      id: Date.now().toString(),
      specification: newSpecName.trim(),
      value: newSpecValue,
      unit: newSpecUnit,
    };
    if (!specificationsList.includes(newSpecName.trim())) {
      setSpecificationsList([...specificationsList, newSpecName.trim()]);
    }
    setFormData({ ...formData, specifications: [...formData.specifications, newSpec] });
    setNewSpecName('');
    setNewSpecValue('');
    setNewSpecUnit('-');
    toast.success('Specification added');
  };

  // Update a field on an existing spec row
  const handleUpdateSpec = (id: string, field: keyof Specification, value: string) => {
    setFormData({
      ...formData,
      specifications: formData.specifications.map(s => s.id === id ? { ...s, [field]: value } : s),
    });
  };

  // Remove a spec row
  const handleRemoveSpec = (id: string) => {
    setFormData({ ...formData, specifications: formData.specifications.filter(s => s.id !== id) });
  };

  const addRow = () => {
    toast.success('Add Row feature coming soon');
  };

  const handlePublish = () => {
    toast.success('Product published successfully!');
  };

  const handleSaveDraft = () => {
    toast.success('Product saved as draft');
  };

  const handlePreview = () => {
    toast.info('Preview feature coming soon');
  };

  return (
    <div className="w-full min-h-screen bg-white px-3 sm:px-4 md:px-6 py-4 sm:py-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6">

            {/* Section 1: Product Information */}
            <div className="border border-gray-300 rounded-lg p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">1. Product Information</h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Capture core catalog identity for enterprise procurement mapping.</p>
              
              <div className="mt-4 space-y-4">
                {/* Row 0: Master Product Code + SKU Code */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-gray-700">Master Product Code</Label>
                    <Input
                      value={formData.masterProductCode}
                      readOnly
                      className="mt-1 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-400 mt-1">Auto-generated · Read only</p>
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-gray-700">SKU Code</Label>
                    <Input
                      placeholder="e.g., SKU-XXXX-YYYY"
                      value={formData.skuCode}
                      onChange={(e) => setFormData({ ...formData, skuCode: e.target.value })}
                      className="mt-1 text-sm"
                    />
                  </div>
                </div>

                {/* Row 1 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-gray-700">Product Name</Label>
                    <Input 
                      placeholder="e.g., Apple MacBook Air M3" 
                      value={formData.productName}
                      onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                      className="mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-gray-700">Product Type</Label>
                    <div className="flex gap-2 mt-1">
                      <Select value={formData.productType} onValueChange={(val) => setFormData({ ...formData, productType: val })}>
                        <SelectTrigger className="text-sm flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {productTypesList.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm" className="px-2" onClick={() => openAddDialog('productType')} title="Add new Product Type">
                        <Plus size={16} />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-gray-700">Physical Type</Label>
                    <div className="flex gap-2 mt-1">
                      <Select value={formData.physicalType} onValueChange={(val) => setFormData({ ...formData, physicalType: val })}>
                        <SelectTrigger className="text-sm flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {physicalTypesList.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm" className="px-2" onClick={() => openAddDialog('physicalType')} title="Add new Physical Type">
                        <Plus size={16} />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-gray-700">Category</Label>
                    <div className="flex gap-2 mt-1">
                      <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                        <SelectTrigger className="text-sm flex-1">
                          <SelectValue placeholder="Search or create category..." />
                        </SelectTrigger>
                        <SelectContent>
                          {categoriesList.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm" className="px-2" onClick={() => openAddDialog('category')} title="Add new Category">
                        <Plus size={16} />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-gray-700">Subcategory</Label>
                    <Input 
                      placeholder="e.g., Laptops" 
                      value={formData.subcategory}
                      onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                      className="mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-gray-700">Brand</Label>
                    <div className="flex gap-2 mt-1">
                      <Select value={formData.brand} onValueChange={(val) => setFormData({ ...formData, brand: val })}>
                        <SelectTrigger className="text-sm flex-1">
                          <SelectValue placeholder="Search or enter brand..." />
                        </SelectTrigger>
                        <SelectContent>
                          {brandsList.map(brand => <SelectItem key={brand} value={brand}>{brand}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm" className="px-2" onClick={() => openAddDialog('brand')} title="Add new Brand">
                        <Plus size={16} />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Row 3: Tags and Description */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-gray-700">Tags</Label>
                    <Input 
                      placeholder="Add tag and press Enter" 
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      className="mt-1 text-sm"
                    />
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="flex items-center gap-1 text-xs">
                            {tag}
                            <X size={12} className="cursor-pointer" onClick={() => removeTag(idx)} />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-700">Description</Label>
                  <div className="mt-1 border border-gray-300 rounded-lg overflow-hidden">
                    <div className="flex items-center gap-1 p-2 bg-gray-50 border-b border-gray-300 flex-wrap">
                      <button className="p-1 hover:bg-gray-200 rounded" title="Bold">
                        <Bold size={16} className="text-gray-600" />
                      </button>
                      <button className="p-1 hover:bg-gray-200 rounded" title="Italic">
                        <Italic size={16} className="text-gray-600" />
                      </button>
                      <button className="p-1 hover:bg-gray-200 rounded" title="Underline">
                        <Underline size={16} className="text-gray-600" />
                      </button>
                      <div className="w-px h-4 bg-gray-300 mx-1" />
                      <button className="p-1 hover:bg-gray-200 rounded" title="List">
                        <List size={16} className="text-gray-600" />
                      </button>
                      <button className="p-1 hover:bg-gray-200 rounded" title="Left">
                        <AlignLeft size={16} className="text-gray-600" />
                      </button>
                      <button className="p-1 hover:bg-gray-200 rounded" title="Center">
                        <AlignCenter size={16} className="text-gray-600" />
                      </button>
                      <button className="p-1 hover:bg-gray-200 rounded" title="Right">
                        <AlignRight size={16} className="text-gray-600" />
                      </button>
                      <div className="w-px h-4 bg-gray-300 mx-1" />
                      <button className="p-1 hover:bg-gray-200 rounded" title="Image">
                        <Image size={16} className="text-gray-600" />
                      </button>
                      <button className="p-1 hover:bg-gray-200 rounded" title="Link">
                        <Link2 size={16} className="text-gray-600" />
                      </button>
                    </div>
                    <Textarea 
                      placeholder="Enter professional product description..." 
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="border-0 rounded-none min-h-28 text-sm resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Key Specifications */}
            <div className="border border-gray-300 rounded-lg p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">2. Key Specifications</h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Reusable specification engine with dynamic categories, row reordering, and unit support.</p>
              
              <div className="mt-4">
                {/* Specifications Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-300">
                        <th className="text-left p-2 font-semibold text-gray-700 text-xs">SPECIFICATION</th>
                        <th className="text-left p-2 font-semibold text-gray-700 text-xs">VALUE</th>
                        <th className="text-left p-2 font-semibold text-gray-700 text-xs">UNIT</th>
                        <th className="text-left p-2 font-semibold text-gray-700 text-xs">DELETE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.specifications.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-xs text-gray-400">
                            No specifications yet. Use the panel below to add one.
                          </td>
                        </tr>
                      ) : (
                        formData.specifications.map((spec) => (
                          <tr key={spec.id} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="p-2">
                              <div className="flex items-center gap-2">
                                <GripVertical size={16} className="text-gray-400 cursor-grab" />
                                <span className="text-gray-700 font-medium">{spec.specification}</span>
                              </div>
                            </td>
                            <td className="p-2">
                              <Input
                                value={spec.value}
                                onChange={(e) => handleUpdateSpec(spec.id, 'value', e.target.value)}
                                className="text-xs h-8"
                                placeholder="Enter value"
                              />
                            </td>
                            <td className="p-2 min-w-[140px]">
                              <div className="flex gap-1">
                                <Select
                                  value={spec.unit}
                                  onValueChange={(val) => {
                                    if (val === '__add_unit__') { openAddDialog('unit'); }
                                    else { handleUpdateSpec(spec.id, 'unit', val); }
                                  }}
                                >
                                  <SelectTrigger className="h-8 text-xs flex-1">
                                    <SelectValue placeholder="-" />
                                  </SelectTrigger>
                                  <SelectContent style={{ maxHeight: 'none', overflow: 'visible' }}>
                                    {unitsList.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                    <div className="border-t border-gray-100 mt-1 pt-1">
                                      <SelectItem value="__add_unit__" className="text-blue-600 font-medium">
                                        + Add New Unit
                                      </SelectItem>
                                    </div>
                                  </SelectContent>
                                </Select>
                              </div>
                            </td>
                            <td className="p-2">
                              <button
                                onClick={() => handleRemoveSpec(spec.id)}
                                className="text-red-400 hover:text-red-600 transition-colors"
                              >
                                <X size={16} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Add Specification Panel */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-gray-700">Specification Category</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="e.g., Connectivity"
                        className="text-sm flex-1"
                        value={newSpecName}
                        onChange={(e) => setNewSpecName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddSpecRow(); }}
                      />
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 px-4"
                        onClick={handleAddSpecRow}
                      >
                        <Plus size={16} className="mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-gray-700">Value</Label>
                    <Input
                      placeholder="e.g., 1200 x 1200"
                      className="text-sm"
                      value={newSpecValue}
                      onChange={(e) => setNewSpecValue(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-gray-700">Unit</Label>
                    <div className="flex gap-2">
                      <Select
                        value={newSpecUnit}
                        onValueChange={(val) => {
                          if (val === '__add_unit__') { openAddDialog('unit'); }
                          else { setNewSpecUnit(val); }
                        }}
                      >
                        <SelectTrigger className="text-sm flex-1">
                          <SelectValue placeholder="Select unit..." />
                        </SelectTrigger>
                        <SelectContent style={{ maxHeight: 'none', overflow: 'visible' }}>
                          {unitsList.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                          <div className="border-t border-gray-100 mt-1 pt-1">
                            <SelectItem value="__add_unit__" className="text-blue-600 font-medium">
                              + Add New Unit
                            </SelectItem>
                          </div>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleAddSpecRow}
                  >
                    <Plus size={16} className="mr-2" />
                    Add Specification Row
                  </Button>
                </div>
              </div>
            </div>

            {/* Section 3: Product Notes & Alerts */}
            <div className="border border-gray-300 rounded-lg p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">3. Product Notes & Alerts</h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Enter manual note points, warnings, explanations, stock notices, or product-specific remarks.</p>
              
              <div className="mt-4">
                <Label className="text-xs sm:text-sm font-medium text-gray-700">Product Notes (optional)</Label>
                <Textarea 
                  placeholder="Enter product notes, issue explanations, stock notices, warnings or remarks..." 
                  value={formData.productNotes}
                  onChange={(e) => setFormData({ ...formData, productNotes: e.target.value })}
                  className="mt-2 text-sm min-h-24"
                />
                <p className="text-xs text-gray-500 mt-1">Multiline supported. Leave empty to hide banners on Shop cards.</p>
              </div>
            </div>

            {/* Section 4: General Specifications */}
            <div className="border border-gray-300 rounded-lg p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">4. General Specifications</h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Categorized product attributes for structured catalog metadata.</p>
              
              <div className="mt-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-300">
                        <th className="text-left p-2 font-semibold text-gray-700 text-xs">CATEGORY</th>
                        <th className="text-left p-2 font-semibold text-gray-700 text-xs">ATTRIBUTE VALUE</th>
                        <th className="text-left p-2 font-semibold text-gray-700 text-xs">DELETE</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <td className="p-2 text-center text-gray-600 py-6" colSpan={3}>No general specifications yet. Click "Add Row" to begin.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <Button variant="outline" className="mt-3 w-full justify-start text-gray-700">
                  <Plus size={16} className="mr-2" />
                  Add Row
                </Button>
              </div>
            </div>

            {/* Section 5: Product Images & Media */}
            <div className="border border-gray-300 rounded-lg p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">5. Product Images & Media</h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Modern enterprise upload experience with preview strip, primary marketing, and reordering.</p>
              
              <div className="mt-4 space-y-4">
                {/* Preview Strip */}
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-700">Preview Strip</Label>
                  <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 text-center bg-gray-50">
                    <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm font-medium text-gray-700">Drag & drop images here or click to upload</p>
                    <p className="text-xs text-gray-600 mt-1">Multiple upload supported. Primary image selection required.</p>
                    <p className="text-xs text-gray-600 mt-3">No thumbnails yet</p>
                  </div>
                </div>

                {/* Video URL */}
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-700">Optional Video URL</Label>
                  <Input 
                    placeholder="https://..." 
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    className="mt-1 text-sm"
                  />
                </div>

                {/* Upload Rules */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                  <h4 className="text-xs sm:text-sm font-semibold text-gray-800">Upload Rules</h4>
                  <ul className="text-xs text-gray-700 space-y-1 mt-2 ml-4">
                    <li>• Drag & drop suggested</li>
                    <li>• Multiple uploads supported</li>
                    <li>• Hover actions to primary</li>
                    <li>• Reordering supported</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons - horizontal below Section 5 */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1 text-sm h-11 border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={handlePreview}
              >
                Preview Product
              </Button>
              <Button
                variant="outline"
                className="flex-1 text-sm h-11 border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={handleSaveDraft}
              >
                Save as Draft
              </Button>
              <Button
                className="flex-1 text-sm h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                onClick={handlePublish}
              >
                Publish Product
              </Button>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-4 lg:sticky lg:top-6">
              

            </div>
          </div>
        </div>
      </div>

      {/* Add New Option Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Add New {
                addDialogType === 'productType' ? 'Product Type' :
                addDialogType === 'physicalType' ? 'Physical Type' :
                addDialogType === 'category' ? 'Category' :
                addDialogType === 'brand' ? 'Brand' :
                addDialogType === 'unit' ? 'Unit' :
                addDialogType === 'specification' ? 'Specification' : 'Option'
              }
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="option-input" className="text-sm font-medium">
                Enter new value
              </Label>
              <Input
                id="option-input"
                placeholder={
                  addDialogType === 'productType' ? 'e.g., Hybrid' :
                  addDialogType === 'physicalType' ? 'e.g., Rental' :
                  addDialogType === 'category' ? 'e.g., Software' :
                  addDialogType === 'brand' ? 'e.g., Samsung' :
                  addDialogType === 'unit' ? 'e.g., watts' :
                  addDialogType === 'specification' ? 'e.g., Durability' : 'Enter value'
                }
                value={newOptionValue}
                onChange={(e) => setNewOptionValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddNewOption();
                  }
                }}
                className="mt-2"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNewOption} className="bg-blue-600 hover:bg-blue-700">
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
