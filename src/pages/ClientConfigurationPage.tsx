import { useState } from "react";
import { ChevronLeft, Copy, Eye, EyeOff, Trash2, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ClientConfigurationPage() {
  const navigate = useNavigate();
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey] = useState("sk_live_51234567890abcdefghijklmnop");

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Configuration</h1>
            <p className="text-slate-600">API keys and security settings</p>
          </div>
        </div>

        {/* API Keys Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              API Keys
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Live API Key
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    readOnly
                    className="pr-10"
                  />
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button variant="outline">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Regenerate Key
            </Button>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span className="text-sm text-slate-700">Two-factor authentication</span>
              </label>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span className="text-sm text-slate-700">Enable IP whitelisting</span>
              </label>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4" />
                <span className="text-sm text-slate-700">Require signed requests</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Webhooks */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Webhooks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">Configure webhooks for real-time notifications</p>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Add Webhook
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              These actions cannot be undone. Please proceed with caution.
            </p>
            <Button variant="destructive" className="w-full">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Configuration
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
