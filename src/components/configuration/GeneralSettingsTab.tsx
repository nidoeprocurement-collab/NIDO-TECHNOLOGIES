import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, Save } from "lucide-react"

export default function GeneralSettingsPage() {
  return (
    <div className="space-y-6 p-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            General Settings
          </h1>

          <p className="text-muted-foreground">
            Configure Nido Tech platform settings
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline">
            <Eye className="mr-2 h-4 w-4" />
            View Company Profile
          </Button>

          <Button>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="organization">
        <TabsList>
          <TabsTrigger value="organization">
            Organization
          </TabsTrigger>

          <TabsTrigger value="theme">
            Theme & Appearance
          </TabsTrigger>

          <TabsTrigger value="localization">
            Localization
          </TabsTrigger>

          <TabsTrigger value="procurement">
            Procurement Defaults
          </TabsTrigger>

          <TabsTrigger value="notifications">
            Notification & Alerts
          </TabsTrigger>

          <TabsTrigger value="security">
            Security
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-2 gap-4">

        <div>
          <label className="mb-2 block text-sm font-medium">
            Company Name
          </label>

          <Input defaultValue="Nido Tech Pvt. Ltd." />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            GST Number
          </label>

          <Input defaultValue="27AACCN1234A11ZD" />
        </div>

      </div>

      <div className="rounded-lg border p-6">
        <h3 className="mb-4 font-semibold">
          Nido Tech Company Logo
        </h3>

        <div className="flex items-center gap-4">
          <div className="flex h-24 w-24 items-center justify-center rounded-lg border">
            Logo
          </div>

          <Button>
            Upload Nido Logo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">

        <div>
          <label className="mb-2 block text-sm font-medium">
            PAN Number
          </label>

          <Input defaultValue="AACCN1234A" />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Registered Address
          </label>

          <Input defaultValue="123 Corporate Ave, Chennai" />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Phone
          </label>

          <Input defaultValue="+91-44-1234-5678" />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Email
          </label>

          <Input defaultValue="info@nido-tech.com" />
        </div>

      </div>
    </div>
  )
}