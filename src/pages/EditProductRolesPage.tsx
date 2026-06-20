import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const availableRoles = [
  { id: 'viewer', name: 'Viewer', description: 'Can view product details and information' },
  { id: 'editor', name: 'Editor', description: 'Can edit product information and specifications' },
  { id: 'approver', name: 'Approver', description: 'Can approve product changes and updates' },
  { id: 'admin', name: 'Admin', description: 'Full access to all product management features' },
];

interface ProductRoles {
  productName: string;
  productId: string;
  selectedRoles: string[];
  preferences: {
    allowBulkOrders: boolean;
    requireApprovalForChanges: boolean;
    notifyOnStockChange: boolean;
    trackInventory: boolean;
    autoReorder: boolean;
    minReorderLevel: number;
    notes: string;
  };
}

export default function EditProductRolesPage() {
  const navigate = useNavigate();
  const { productId } = useParams();
  
  const [productData, setProductData] = useState<ProductRoles>({
    productName: 'HP Envy Laptop',
    productId: productId || '1',
    selectedRoles: ['viewer', 'editor'],
    preferences: {
      allowBulkOrders: true,
      requireApprovalForChanges: false,
      notifyOnStockChange: true,
      trackInventory: true,
      autoReorder: false,
      minReorderLevel: 5,
      notes: '',
    },
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleRoleChange = (roleId: string, checked: boolean) => {
    setProductData(prev => ({
      ...prev,
      selectedRoles: checked
        ? [...prev.selectedRoles, roleId]
        : prev.selectedRoles.filter(r => r !== roleId),
    }));
  };

  const handlePreferenceChange = (key: keyof typeof productData.preferences, value: any) => {
    setProductData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value,
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Product roles and preferences saved successfully!');
      navigate(-1);
    } catch (error) {
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Edit Product Roles & Preferences</h1>
              <p className="text-sm text-gray-600 mt-1">{productData.productName}</p>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Roles Section */}
            <Card className="border-gray-200 mb-6">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-base font-semibold">User Roles</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600 mb-4">Select which roles can access and manage this product</p>
                <div className="space-y-3">
                  {availableRoles.map(role => (
                    <div key={role.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <Checkbox
                        checked={productData.selectedRoles.includes(role.id)}
                        onCheckedChange={(checked) => handleRoleChange(role.id, checked as boolean)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <label className="text-sm font-medium text-gray-900 cursor-pointer">{role.name}</label>
                        <p className="text-xs text-gray-600 mt-1">{role.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Preferences Section */}
            <Card className="border-gray-200">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-base font-semibold">Preferences</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Allow Bulk Orders */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-gray-900">Allow Bulk Orders</label>
                      <p className="text-xs text-gray-600 mt-1">Enable bulk order capability for this product</p>
                    </div>
                    <Switch
                      checked={productData.preferences.allowBulkOrders}
                      onCheckedChange={(checked) => handlePreferenceChange('allowBulkOrders', checked)}
                    />
                  </div>

                  {/* Require Approval */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-gray-900">Require Approval for Changes</label>
                      <p className="text-xs text-gray-600 mt-1">All changes to this product require approval</p>
                    </div>
                    <Switch
                      checked={productData.preferences.requireApprovalForChanges}
                      onCheckedChange={(checked) => handlePreferenceChange('requireApprovalForChanges', checked)}
                    />
                  </div>

                  {/* Stock Notifications */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-gray-900">Notify on Stock Change</label>
                      <p className="text-xs text-gray-600 mt-1">Receive notifications when stock levels change</p>
                    </div>
                    <Switch
                      checked={productData.preferences.notifyOnStockChange}
                      onCheckedChange={(checked) => handlePreferenceChange('notifyOnStockChange', checked)}
                    />
                  </div>

                  {/* Track Inventory */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-gray-900">Track Inventory</label>
                      <p className="text-xs text-gray-600 mt-1">Enable inventory tracking for this product</p>
                    </div>
                    <Switch
                      checked={productData.preferences.trackInventory}
                      onCheckedChange={(checked) => handlePreferenceChange('trackInventory', checked)}
                    />
                  </div>

                  {/* Auto Reorder */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-gray-900">Auto Reorder</label>
                      <p className="text-xs text-gray-600 mt-1">Automatically reorder when stock falls below minimum</p>
                    </div>
                    <Switch
                      checked={productData.preferences.autoReorder}
                      onCheckedChange={(checked) => handlePreferenceChange('autoReorder', checked)}
                    />
                  </div>

                  {/* Minimum Reorder Level */}
                  {productData.preferences.autoReorder && (
                    <div className="p-4 border border-gray-200 rounded-lg bg-blue-50">
                      <label className="text-sm font-medium text-gray-900 block mb-2">Minimum Reorder Level</label>
                      <input
                        type="number"
                        value={productData.preferences.minReorderLevel}
                        onChange={(e) => handlePreferenceChange('minReorderLevel', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                      />
                      <p className="text-xs text-gray-600 mt-2">Reorder when stock falls below this level</p>
                    </div>
                  )}

                  {/* Notes */}
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <label className="text-sm font-medium text-gray-900 block mb-2">Additional Notes</label>
                    <Textarea
                      value={productData.preferences.notes}
                      onChange={(e) => handlePreferenceChange('notes', e.target.value)}
                      placeholder="Add any additional notes or instructions for this product..."
                      className="text-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Sidebar */}
          <div>
            <Card className="border-gray-200 sticky top-24">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-base font-semibold">Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-600 font-medium mb-2">PRODUCT</p>
                    <p className="text-sm font-medium text-gray-900">{productData.productName}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-600 font-medium mb-2">ASSIGNED ROLES ({productData.selectedRoles.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {productData.selectedRoles.map(roleId => {
                        const role = availableRoles.find(r => r.id === roleId);
                        return role ? <Badge key={roleId} className="bg-blue-100 text-blue-700">{role.name}</Badge> : null;
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600 font-medium mb-2">ACTIVE PREFERENCES</p>
                    <ul className="text-sm space-y-1">
                      {productData.preferences.allowBulkOrders && <li className="flex items-center gap-2"><span className="text-green-600">✓</span> Bulk Orders</li>}
                      {productData.preferences.requireApprovalForChanges && <li className="flex items-center gap-2"><span className="text-green-600">✓</span> Approval Required</li>}
                      {productData.preferences.notifyOnStockChange && <li className="flex items-center gap-2"><span className="text-green-600">✓</span> Stock Notifications</li>}
                      {productData.preferences.trackInventory && <li className="flex items-center gap-2"><span className="text-green-600">✓</span> Inventory Tracking</li>}
                      {productData.preferences.autoReorder && <li className="flex items-center gap-2"><span className="text-green-600">✓</span> Auto Reorder</li>}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
