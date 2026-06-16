import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { mockDataService } from "@/lib/mockData";
import {
  ROLE_TEMPLATES,
  AVAILABLE_MODULES,
  RoleTemplateKey,
  generatePermissionMatrix,
} from "@/lib/permissions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientUsersTable } from "@/components/ClientUsersTable";
import { downloadUsersJSON, downloadUsersCSV } from "@/lib/export-users";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import jsPDF from "jspdf";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Globe,
  Users,
  Download,
  Building2,
  DollarSign,
  ShoppingCart,
  ChevronRight,
  Clock,
  FileText,
  FileJson,
  Plus,
  Search,
  X,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Copy,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

/* ------------------ MOCK DATA FOR CHARTS ------------------ */
const spendingData = [
  { month: "Jan", spend: 15000 },
  { month: "Feb", spend: 22000 },
  { month: "Mar", spend: 18000 },
  { month: "Apr", spend: 25000 },
  { month: "May", spend: 30000 },
  { month: "Jun", spend: 28000 },
  { month: "Jul", spend: 35000 },
  { month: "Aug", spend: 40000 },
  { month: "Sep", spend: 32000 },
  { month: "Oct", spend: 45000 },
  { month: "Nov", spend: 38000 },
  { month: "Dec", spend: 42000 },
];

const categoryData = [
  { name: "Hardware", value: 45, amount: 200250, color: "#3B82F6" },
  { name: "Software", value: 30, amount: 30300, color: "#10B981" },
  { name: "Service", value: 15, amount: 15300, color: "#F59E0B" },
  { name: "Other", value: 10, amount: 10500, color: "#8B5CF6" },
];

/* ------------------ MAIN COMPONENT ------------------ */
export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [clientUsers, setClientUsers] = useState<any[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [addRoleDialogOpen, setAddRoleDialogOpen] = useState(false);
  const [editingRoleKey, setEditingRoleKey] = useState<string | null>(null);
  const [customModules, setCustomModules] = useState<any[]>([]);
  const [showAddModuleForm, setShowAddModuleForm] = useState(false);
  const [newModuleName, setNewModuleName] = useState("");
  const [roleForm, setRoleForm] = useState({
    name: "",
    description: "",
    roleType: "Internal User",
    roleCode: "",
    status: "Active",
    isDefault: false,
    dataVisibility: "All",
    locationAccess: "All",
    canApproveOrders: false,
    approvalLimit: 0,
  });

  /* ------------------ FETCH CLIENT AND SET TAB FROM QUERY PARAM ------------------ */
  useEffect(() => {
    if (id) fetchClient();
    
    // Load catalog products from localStorage
    const savedProducts = localStorage.getItem(`client-catalog-${id}`);
    if (savedProducts) {
      setCatalogProducts(JSON.parse(savedProducts));
    } else {
      // Initialize with default products if none saved
      const defaultProducts = [
        { sku: "PRD-001", name: "Dell Laptop XPS 15", image: "https://images.unsplash.com/photo-1588872657840-18491dbba0e1?w=100&h=100&fit=crop", category: "Hardware", roles: ["Admin", "IT Manager"], price: "₹21,004", availability: "In Stock", status: "green" },
        { sku: "PRD-002", name: "Microsoft Office 365", image: "https://images.unsplash.com/photo-1633356713007-ad1b30b3dc46?w=100&h=100&fit=crop", category: "Software", roles: ["IT Manager", "Finance"], price: "₹83,375", availability: "In Stock", status: "green" },
        { sku: "PRD-003", name: "Ergonomic Office Chair", image: "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=100&h=100&fit=crop", category: "Accessories", roles: ["IT Staff", "Support"], price: "₹1,740", availability: "In Stock", status: "green" },
      ];
      setCatalogProducts(defaultProducts);
      localStorage.setItem(`client-catalog-${id}`, JSON.stringify(defaultProducts));
    }
    
    // Set active tab from query parameter
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [id, location.search]);

  /* Reload catalog products when activeTab changes to catalog */
  useEffect(() => {
    if (activeTab === "catalog" && id) {
      const savedProducts = localStorage.getItem(`client-catalog-${id}`);
      if (savedProducts) {
        setCatalogProducts(JSON.parse(savedProducts));
        console.log("[v0] Reloaded catalog products from localStorage:", JSON.parse(savedProducts));
      }
    }
  }, [activeTab, id]);

  const fetchClient = async () => {
    setLoading(true);
    try {
      const data = mockDataService.getClientById(id);

      if (!data) {
        toast.error("Client not found");
        setLoading(false);
        return;
      }

      setClient(data);
      
      // Load users from mock data
      const users = mockDataService.getClientUsers(id);
      setClientUsers(users);
    } catch (error) {
      console.error("[v0] Error fetching client:", error);
      toast.error("Failed to load client");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------ HELPERS ------------------ */
  const getInitials = (name: string) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 3);
  };

  const calculateDaysLeft = () => {
    if (!client?.contract_end) return 0;
    const end = new Date(client.contract_end);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const calculateContractProgress = () => {
    if (!client?.contract_start || !client?.contract_end) return 0;
    const start = new Date(client.contract_start);
    const end = new Date(client.contract_end);
    const now = new Date();
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  const formatDate = (date: string) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  const formatContractDates = () => {
    if (!client?.contract_start || !client?.contract_end) return "N/A";
    const start = new Date(client.contract_start).toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).replace(/\//g, "-");
    const end = new Date(client.contract_end).toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).replace(/\//g, "-");
    return `${start} - ${end}`;
  };

  /* ------------------ PDF DOWNLOAD ------------------ */
  const downloadProfilePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFillColor(74, 108, 247);
    doc.rect(0, 0, pageWidth, 40, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text(getInitials(client.company_name), pageWidth / 2, 25, { align: "center" });
    
    // Company Name
    doc.setTextColor(26, 29, 38);
    doc.setFontSize(20);
    doc.text(client.company_name || "Unknown Company", pageWidth / 2, 55, { align: "center" });
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`${client.pricing_tier || "Standard"} Client • Since ${client.created_at ? new Date(client.created_at).getFullYear() : "2024"}`, pageWidth / 2, 65, { align: "center" });
    
    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 75, pageWidth - 20, 75);
    
    // Contact Details Section
    doc.setFontSize(14);
    doc.setTextColor(26, 29, 38);
    doc.setFont("helvetica", "bold");
    doc.text("Contact Information", 20, 90);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    
    let yPos = 102;
    const lineHeight = 10;
    
    doc.text(`Email: ${client.email || "N/A"}`, 20, yPos);
    yPos += lineHeight;
    doc.text(`Phone: ${client.phone || "N/A"}`, 20, yPos);
    yPos += lineHeight;
    doc.text(`Address: ${[client.address, client.city, client.state, client.country].filter(Boolean).join(", ") || "N/A"}`, 20, yPos);
    yPos += lineHeight;
    doc.text(`Contract Period: ${formatContractDates()}`, 20, yPos);
    yPos += lineHeight * 2;
    
    // Business Details Section
    doc.setFontSize(14);
    doc.setTextColor(26, 29, 38);
    doc.setFont("helvetica", "bold");
    doc.text("Business Details", 20, yPos);
    yPos += 12;
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    
    doc.text(`Client ID: ${client.client_id || "N/A"}`, 20, yPos);
    yPos += lineHeight;
    doc.text(`Industry: ${client.industry_type || "N/A"}`, 20, yPos);
    yPos += lineHeight;
    doc.text(`Business Type: ${client.business_type || "N/A"}`, 20, yPos);
    yPos += lineHeight;
    doc.text(`GST: ${client.gst || "N/A"}`, 20, yPos);
    yPos += lineHeight;
    doc.text(`PAN: ${client.pan || "N/A"}`, 20, yPos);
    yPos += lineHeight;
    doc.text(`Payment Terms: ${client.payment_terms || "N/A"}`, 20, yPos);
    yPos += lineHeight;
    doc.text(`Contract Type: ${client.contract_type || "N/A"}`, 20, yPos);
    yPos += lineHeight;
    doc.text(`Pricing Tier: ${client.pricing_tier || "N/A"}`, 20, yPos);
    yPos += lineHeight * 2;
    
    // Contract Status
    doc.setFontSize(14);
    doc.setTextColor(26, 29, 38);
    doc.setFont("helvetica", "bold");
    doc.text("Contract Status", 20, yPos);
    yPos += 12;
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    
    doc.text(`Days Remaining: ${daysLeft} days`, 20, yPos);
    yPos += lineHeight;
    doc.text(`Status: ${client.status || "Active"}`, 20, yPos);
    yPos += lineHeight;
    doc.text(`Total Orders: ${client.total_orders || 0}`, 20, yPos);
    
    // Footer
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, pageWidth / 2, 280, { align: "center" });
    doc.text("Nido-Tech Procurement Platform", pageWidth / 2, 287, { align: "center" });
    
    // Save the PDF
    doc.save(`${client.company_name?.replace(/\s+/g, "_") || "client"}_profile.pdf`);
    toast.success("Profile downloaded successfully");
  };

  /* ------------------ STATES ------------------ */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Client not found</p>
        <Button variant="outline" onClick={() => navigate("/clients")} className="mt-4">
          Back to Clients
        </Button>
      </div>
    );
  }

  const daysLeft = calculateDaysLeft();
  const contractProgress = calculateContractProgress();

  /* ------------------ UI ------------------ */
  return (
    <div className="p-6 bg-[#FAFBFC] min-h-screen">
      {/* BREADCRUMB & HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {client.client_logo_url && (
            <img
              src={client.client_logo_url}
              alt={client.company_name}
              className="h-16 w-16 rounded-lg object-cover border border-[#E8ECF1]"
            />
          )}
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <button onClick={() => navigate("/clients")} className="hover:text-primary flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" />
                Clients
              </button>
              <span>/</span>
              <span>{client.company_name}</span>
            </div>
            <h1 className="text-2xl font-semibold text-[#1A1D26]">{client.company_name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button className="bg-[#4A6CF7] hover:bg-[#3B5DE8] text-white">
            <Mail className="h-4 w-4 mr-2" />
            Send Email
          </Button>
          <Button variant="outline" className="border-[#E8ECF1]">
            <Phone className="h-4 w-4 mr-2" />
            Call
          </Button>
          {activeTab === "users" && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="border-[#E8ECF1]">
                <Download className="h-4 w-4 mr-2" />
                Export Users
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                try {
                  downloadUsersJSON(clientUsers, client?.company_name);
                  toast.success("Users exported as JSON");
                } catch (err) {
                  console.error("[v0] Export error:", err);
                  toast.error("Failed to export users");
                }
              }}>
                <FileJson className="h-4 w-4 mr-2" />
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                try {
                  downloadUsersCSV(clientUsers, client?.company_name);
                  toast.success("Users exported as CSV");
                } catch (err) {
                  console.error("[v0] Export error:", err);
                  toast.error("Failed to export users");
                }
              }}>
                <FileText className="h-4 w-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* LEFT SIDEBAR - CLIENT CARD - ONLY SHOW ON OVERVIEW TAB */}
        {activeTab === "overview" && (
        <div className="col-span-3">
          <Card className="bg-white border-[#E8ECF1] overflow-hidden shadow-sm">
            <CardContent className="p-6">
              {/* Logo with blue gradient ring */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#4A6CF7] to-[#3B5DE8] p-[3px]">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                      <span className="text-2xl font-bold text-[#4A6CF7]">{getInitials(client.company_name)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Company Name */}
              <div className="text-center mb-6">
                <h2 className="text-lg font-semibold text-[#1A1D26]">{client.company_name}</h2>
                <p className="text-sm text-[#5C6370]">
                  {client.pricing_tier || "Premium"} Client • Since {client.created_at ? new Date(client.created_at).getFullYear() : "2024"}
                </p>
              </div>

              {/* Contact Details */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-[#5C6370]" />
                  <span className="text-[#1A1D26]">{client.email || "No email"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-[#5C6370]" />
                  <span className="text-[#1A1D26]">{client.phone || "No phone"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-[#5C6370]" />
                  <span className="text-[#1A1D26]">
                    {[client.address, client.city, client.state].filter(Boolean).join(", ") || "No address"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-[#5C6370]" />
                  <span className="text-[#1A1D26]">{formatContractDates()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mb-6">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 border-[#4A6CF7] text-[#4A6CF7] hover:bg-[#4A6CF7]/5"
                  onClick={() => window.location.href = `mailto:${client.email}`}
                >
                  <Mail className="h-4 w-4 mr-1" />
                  Email
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 border-[#E8ECF1] text-[#1A1D26] hover:bg-gray-50"
                  onClick={() => window.location.href = `tel:${client.phone}`}
                >
                  <Phone className="h-4 w-4 mr-1" />
                  Call
                </Button>
              </div>

              {/* Contract Progress */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#5C6370]">Contract Progress</span>
                  <span className="text-[#4A6CF7] font-medium">{daysLeft} days left</span>
                </div>
                <div className="w-full bg-[#E8ECF1] rounded-full h-2">
                  <div
                    className="bg-[#4A6CF7] h-2 rounded-full transition-all"
                    style={{ width: `${100 - contractProgress}%` }}
                  />
                </div>
              </div>

              {/* Client Info Footer */}
              <div className="grid grid-cols-2 gap-4 py-4 border-t border-[#E8ECF1]">
                <div>
                  <p className="text-xs text-[#5C6370]">Client Since</p>
                  <p className="text-sm font-medium text-[#1A1D26]">
                    {client.created_at ? new Date(client.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#5C6370]">Client ID</p>
                  <p className="text-sm font-medium text-[#1A1D26]">{client.client_id}</p>
                </div>
              </div>

              {/* Download Button */}
              <Button 
                variant="outline" 
                className="w-full border-[#E8ECF1] text-[#5C6370] hover:bg-gray-50 mt-2"
                onClick={downloadProfilePDF}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Profile
              </Button>
            </CardContent>
          </Card>
        </div>
        )}

        {/* MAIN CONTENT - ADJUST WIDTH BASED ON SIDEBAR VISIBILITY */}
        <div className={activeTab === "overview" ? "col-span-9 space-y-6" : "col-span-12 space-y-6"}>
          {/* STATS ROW */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-3 gap-4">
              <Card className="border-[#E8ECF1]">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Users className="h-5 w-5 text-[#4A6CF7]" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Users</p>
                      <p className="text-2xl font-bold text-[#1A1D26]">24</p>
                      <p className="text-xs text-muted-foreground">12 Active</p>
                      <p className="text-xs text-muted-foreground">3 Pending invites</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#E8ECF1]">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Spends</p>
                      <p className="text-2xl font-bold text-[#1A1D26]">$101,000</p>
                      <p className="text-xs text-muted-foreground">Year to date</p>
                      <p className="text-xs text-muted-foreground">Last Payment: $25,000</p>
                      <p className="text-xs text-muted-foreground">Jan 11, 2026</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#E8ECF1]">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-50 rounded-lg">
                      <ShoppingCart className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Open Orders</p>
                      <p className="text-2xl font-bold text-[#1A1D26]">3</p>
                      <p className="text-xs text-muted-foreground">$32,500 value</p>
                      <p className="text-xs text-muted-foreground">Contracts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* TABS */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-transparent border-b border-[#E8ECF1] w-full justify-start rounded-none p-0 h-auto">
              {["Overview", "Roles", "Users", "Orders", "Services", "Catalog", "Activity", "Configuration"].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab.toLowerCase()}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#4A6CF7] data-[state=active]:text-[#4A6CF7] data-[state=active]:bg-transparent px-4 py-3"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-3 gap-6">
                {/* Company Details */}
                <Card className="border-[#E8ECF1]">
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-[#1A1D26] mb-4">Company Details</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-4 w-4 text-[#4A6CF7]" />
                        <span className="text-sm">{client.company_name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-[#4A6CF7]" />
                        <span className="text-sm">{client.industry_type || "Technology"}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Users className="h-4 w-4 text-[#4A6CF7]" />
                        <span className="text-sm">51-200 employees</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Globe className="h-4 w-4 text-[#4A6CF7]" />
                        <div>
                          <p className="text-xs text-muted-foreground">Website</p>
                          <p className="text-sm text-[#4A6CF7]">www.{client.company_name?.toLowerCase().replace(/\s+/g, "")}.com</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-[#4A6CF7]" />
                        <div>
                          <p className="text-xs text-muted-foreground">Phone</p>
                          <p className="text-sm">{client.phone || "+1-555-1000"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-[#4A6CF7]" />
                        <div>
                          <p className="text-xs text-muted-foreground">Billing Email</p>
                          <p className="text-sm text-[#4A6CF7]">{client.email || "billing@company.com"}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Spending Overview */}
                <Card className="border-[#E8ECF1]">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-[#1A1D26]">Spending Overview</h3>
                      <Badge variant="outline" className="text-xs">This Year</Badge>
                    </div>
                    <p className="text-2xl font-bold text-[#1A1D26] mb-1">$101,000</p>
                    <p className="text-xs text-muted-foreground mb-4">Total Spend</p>
                    <p className="text-xs text-green-600 mb-4">+12.5% vs last year</p>
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={spendingData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF1" />
                          <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v / 1000}K`} />
                          <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, "Spend"]} />
                          <Bar dataKey="spend" fill="#4A6CF7" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Top Spend Categories */}
                <Card className="border-[#E8ECF1]">
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-[#1A1D26] mb-4">Top Spend Categories</h3>
                    <div className="flex items-center gap-4">
                      <div className="w-32 h-32">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={categoryData}
                              cx="50%"
                              cy="50%"
                              innerRadius={30}
                              outerRadius={50}
                              dataKey="value"
                            >
                              {categoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1 space-y-2">
                        {categoryData.map((cat) => (
                          <div key={cat.name} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                              <span>{cat.name}</span>
                              <span className="text-muted-foreground">{cat.value}%</span>
                            </div>
                            <span className="font-medium">${cat.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* BOTTOM ROW - SUMMARY CARDS */}
              <div className="grid grid-cols-3 gap-6 mt-6">
                {/* User Summary */}
                <Card className="border-[#E8ECF1]">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-[#4A6CF7]" />
                        <h3 className="font-semibold text-[#1A1D26]">User Summary</h3>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-2">
                          <Users className="h-6 w-6 text-[#4A6CF7]" />
                        </div>
                        <p className="text-2xl font-bold text-[#1A1D26]">24</p>
                        <p className="text-xs text-muted-foreground">Total Users</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">12</p>
                        <p className="text-xs text-muted-foreground">Active</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-orange-500">4</p>
                        <p className="text-xs text-muted-foreground">Inactive</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Orders */}
                <Card className="border-[#E8ECF1]">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5 text-[#4A6CF7]" />
                        <h3 className="font-semibold text-[#1A1D26]">Recent Orders</h3>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-2">
                          <ShoppingCart className="h-6 w-6 text-[#4A6CF7]" />
                        </div>
                        <p className="text-2xl font-bold text-[#1A1D26]">3</p>
                        <p className="text-xs text-muted-foreground">Open Orders</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-[#1A1D26]">$32,500</p>
                        <p className="text-xs text-muted-foreground">Total Value</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Active Services */}
                <Card className="border-[#E8ECF1]">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-[#4A6CF7]" />
                        <h3 className="font-semibold text-[#1A1D26]">Active Services</h3>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-2">
                          <FileText className="h-6 w-6 text-[#4A6CF7]" />
                        </div>
                        <p className="text-2xl font-bold text-[#1A1D26]">2</p>
                        <p className="text-xs text-muted-foreground">Active Contracts</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-[#4A6CF7]">{daysLeft} days</p>
                        <p className="text-xs text-muted-foreground">Until Renewal</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ROLES TAB */}
            <TabsContent value="roles" className="mt-6 space-y-6">
              <div className="space-y-6">
                {/* Roles Tab Header with Menu */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-[#1A1D26]">Roles Management</h2>
                  <div className="relative group">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                      <MoreVertical className="h-5 w-5 text-gray-600" />
                    </button>
                    <div className="absolute right-0 mt-1 w-48 bg-white border border-[#E8ECF1] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                      <button 
                        onClick={() => {
                          setRoleForm({
                            name: "",
                            description: "",
                            roleType: "Internal User",
                            roleCode: "",
                            status: "Active",
                            isDefault: false,
                            dataVisibility: "All",
                            locationAccess: "All",
                            canApproveOrders: false,
                            approvalLimit: 0,
                          });
                          setAddRoleDialogOpen(true);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-[#F9FAFB] flex items-center gap-2 text-gray-700 border-b border-[#E8ECF1]"
                      >
                        <Plus className="h-4 w-4 text-[#4A6CF7]" />
                        Add Roles
                      </button>
                      <button 
                        onClick={() => {
                          // Export roles as CSV
                          const csv = Object.entries(ROLE_TEMPLATES).map(([key, role]) => {
                            return `"${role.name}","${role.userType}","${role.dataVisibility}","${role.canApproveOrders}","${role.approvalLimit}"`;
                          }).join("\n");
                          const headers = `"Role Name","User Type","Data Visibility","Can Approve","Approval Limit"\n`;
                          const element = document.createElement("a");
                          element.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(headers + csv));
                          element.setAttribute("download", `roles-${client?.company_name || "export"}.csv`);
                          element.style.display = "none";
                          document.body.appendChild(element);
                          element.click();
                          document.body.removeChild(element);
                          console.log("[v0] Roles exported as CSV");
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-[#F9FAFB] flex items-center gap-2 text-gray-700"
                      >
                        <Download className="h-4 w-4 text-[#4A6CF7]" />
                        Export CSV
                      </button>
                    </div>
                  </div>
                </div>

                {/* Overview Card */}
                <Card className="border-[#E8ECF1]">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-[#1A1D26] mb-2">Role-Based Access Control (RBAC)</h3>
                    <p className="text-sm text-gray-600">
                      Roles determine what users in this client can access and do in the system. Each role has specific permissions across modules. Users can only perform actions their role allows.
                    </p>
                  </CardContent>
                </Card>

                {/* Role Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(ROLE_TEMPLATES).map(([key, role]) => (
                    <Card key={key} className="border border-[#E8ECF1] hover:shadow-lg transition-all duration-200">
                      <CardContent className="p-6">
                        {/* Card Header with Role Name and Edit Button */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h4 className="font-semibold text-[#1A1D26] text-lg mb-1">{role.name}</h4>
                            <Badge variant="outline" className="text-xs bg-[#EEF2FF] border-[#4A6CF7] text-[#4A6CF7]">
                              {role.userType}
                            </Badge>
                          </div>
                          <button
                            onClick={() => {
                              setEditingRoleKey(key);
                              setRoleForm({
                                name: role.name,
                                description: role.description,
                                roleType: role.userType,
                                roleCode: key,
                                status: "Active",
                                isDefault: false,
                                dataVisibility: role.dataVisibility,
                                locationAccess: "All",
                                canApproveOrders: role.canApproveOrders,
                                approvalLimit: role.approvalLimit,
                              });
                              setAddRoleDialogOpen(true);
                            }}
                            className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600 hover:text-[#4A6CF7]"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-600 mb-5 line-clamp-2">{role.description}</p>

                        {/* Role Details */}
                        <div className="space-y-3 border-t border-[#E8ECF1] pt-4">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Data Visibility:</span>
                            <span className="font-semibold text-[#1A1D26]">{role.dataVisibility}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Can Approve:</span>
                            <span className={`font-semibold ${role.canApproveOrders ? "text-green-600" : "text-red-600"}`}>
                              {role.canApproveOrders ? "Yes" : "No"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Approval Limit:</span>
                            <span className="font-semibold text-[#4A6CF7]">₹{role.approvalLimit.toLocaleString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Permission Matrix */}
                <Card className="border-[#E8ECF1]">
                  <CardContent className="p-6">
                    <h4 className="font-semibold text-[#1A1D26] mb-4">Permission Matrix</h4>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="w-32">Module</TableHead>
                            <TableHead className="text-center w-16">View</TableHead>
                            <TableHead className="text-center w-16">Create</TableHead>
                            <TableHead className="text-center w-16">Edit</TableHead>
                            <TableHead className="text-center w-16">Delete</TableHead>
                            <TableHead className="text-center w-16">Approve</TableHead>
                            <TableHead className="text-center w-16">Export</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(ROLE_TEMPLATES).slice(0, 1).map(([roleKey, role]) => (
                            AVAILABLE_MODULES.map((module) => {
                              const permissions = (role.permissions[
                                module.id as keyof typeof role.permissions
                              ] || []) as any[];
                              const actions = ["view", "create", "edit", "delete", "approve", "export"];

                              return (
                                <TableRow key={`${roleKey}-${module.id}`}>
                                  <TableCell className="font-medium text-sm">{module.name}</TableCell>
                                  {actions.map((action) => (
                                    <TableCell key={action} className="text-center">
                                      {permissions.includes(action) ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
                                      ) : (
                                        <XCircle className="h-4 w-4 text-gray-300 mx-auto" />
                                      )}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              );
                            })
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Best Practices */}
                <Card className="border-[#E8ECF1]">
                  <CardContent className="p-6">
                    <h4 className="font-semibold text-[#1A1D26] mb-4">RBAC Best Practices</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        <span>Assign least privilege - users get only necessary permissions</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        <span>Regular audits - review permissions quarterly</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        <span>Separation of duties - critical actions need approvals</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        <span>Clear role definitions - roles should match job functions</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        <span>Monitor high-risk actions - export and delete operations</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                {/* Permission Summary Section */}
                <div className="mt-12 pt-8 border-t border-[#E8ECF1]">
                  <h3 className="text-lg font-semibold text-[#1A1D26] mb-6">Permission Summary</h3>
                  
                  {/* Module Permission Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {AVAILABLE_MODULES.map((module) => {
                      // Get all unique permissions for this module across all roles
                      const allPermissions = new Set<string>();
                      Object.values(ROLE_TEMPLATES).forEach((role: any) => {
                        const modulePerms = role.permissions[module.id as keyof typeof role.permissions] || [];
                        modulePerms.forEach((perm: string) => allPermissions.add(perm));
                      });

                      return (
                        <Card key={module.id} className="border border-[#E8ECF1]">
                          <CardContent className="p-4">
                            <h4 className="font-semibold text-[#1A1D26] mb-3">{module.name}</h4>
                            <div className="flex flex-wrap gap-2">
                              {Array.from(allPermissions).sort().map((perm) => (
                                <span 
                                  key={perm}
                                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded border border-gray-200"
                                >
                                  {perm}
                                </span>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* Role Comparison Section */}
                <div className="mt-12 pt-8 border-t border-[#E8ECF1]">
                  <h3 className="text-xl font-semibold text-[#1A1D26] mb-6">Role Comparison</h3>
                  <Card className="border-[#E8ECF1] bg-[#F9FAFB] mb-6">
                    <CardContent className="p-6">
                      <p className="text-sm text-gray-600">
                        Compare permissions, restrictions, and capabilities across different roles to assign the right access levels to your team members.
                      </p>
                    </CardContent>
                  </Card>

                  {/* Detailed Comparison */}
                  <Card className="border-[#E8ECF1] mb-6">
                    <CardContent className="p-6">
                      <h4 className="font-semibold text-[#1A1D26] mb-4">Detailed Role Comparison</h4>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="hover:bg-transparent">
                              <TableHead className="w-40">Attribute</TableHead>
                              {Object.entries(ROLE_TEMPLATES).map(([key, role]) => (
                                <TableHead key={key} className="text-center min-w-32">{role.name}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell className="font-medium text-sm">Type</TableCell>
                              {Object.entries(ROLE_TEMPLATES).map(([key, role]) => (
                                <TableCell key={key} className="text-center text-sm">{role.userType}</TableCell>
                              ))}
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium text-sm">Data Visibility</TableCell>
                              {Object.entries(ROLE_TEMPLATES).map(([key, role]) => (
                                <TableCell key={key} className="text-center text-sm">{role.dataVisibility}</TableCell>
                              ))}
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium text-sm">Can Approve Orders</TableCell>
                              {Object.entries(ROLE_TEMPLATES).map(([key, role]) => (
                                <TableCell key={key} className="text-center">
                                  {role.canApproveOrders ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-gray-300 mx-auto" />
                                  )}
                                </TableCell>
                              ))}
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium text-sm">Approval Limit</TableCell>
                              {Object.entries(ROLE_TEMPLATES).map(([key, role]) => (
                                <TableCell key={key} className="text-center text-sm">₹{role.approvalLimit.toLocaleString()}</TableCell>
                              ))}
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium text-sm">Module Access</TableCell>
                              {Object.entries(ROLE_TEMPLATES).map(([key, role]) => (
                                <TableCell key={key} className="text-center text-sm">{Object.keys(role.permissions).length} modules</TableCell>
                              ))}
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="users" className="mt-6">
              <ClientUsersTable 
                users={clientUsers}
                clientName={client?.company_name}
                onInviteUser={() => navigate("/users/invitations?tab=invite")}
                onViewUser={(user) => navigate(`/clients/${client?.id}/users/${user.id}`)}
              />
            </TabsContent>

            <TabsContent value="orders" className="mt-6">
              <Card className="border-[#E8ECF1]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-semibold text-[#1A1D26] text-lg">Order History</h3>
                      <p className="text-sm text-gray-600 mt-1">View and manage all orders placed by this client.</p>
                    </div>
                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={() => navigate(`/clients/${id}/new-order`)}
                    >
                      <Plus className="h-4 w-4" /> New Order
                    </Button>
      
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-[#E8ECF1] bg-[#F9FAFB]">
                        <tr>
                          <th className="text-left py-3 px-4 font-semibold text-[#5C6370]">ORDER ID</th>
                          <th className="text-left py-3 px-4 font-semibold text-[#5C6370]">DATE</th>
                          <th className="text-left py-3 px-4 font-semibold text-[#5C6370]">ITEMS</th>
                          <th className="text-left py-3 px-4 font-semibold text-[#5C6370]">AMOUNT</th>
                          <th className="text-left py-3 px-4 font-semibold text-[#5C6370]">VENDOR</th>
                          <th className="text-left py-3 px-4 font-semibold text-[#5C6370]">STATUS</th>
                          <th className="text-center py-3 px-4 font-semibold text-[#5C6370]">ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { id: "ORD-2024-1245", date: "2024-05-28", items: "12 Items", amount: "$125,000", vendor: "TechSupply Co", status: "Delivered" },
                          { id: "ORD-2024-1233", date: "2024-05-20", items: "8 Items", amount: "$45,000", vendor: "Office Essentials", status: "In Transit" },
                          { id: "ORD-2024-1198", date: "2024-05-15", items: "5 Items", amount: "$22,000", vendor: "CloudServe Inc", status: "Delivered" },
                          { id: "ORD-2024-1187", date: "2024-05-10", items: "15 Items", amount: "$89,000", vendor: "TechSupply Co", status: "Delivered" },
                        ].map((order) => (
                          <tr key={order.id} className="border-b border-[#E8ECF1] hover:bg-[#F9FAFB]">
                            <td className="py-3 px-4">
                              <span className="text-[#4A6CF7] font-medium">{order.id}</span>
                            </td>
                            <td className="py-3 px-4">{order.date}</td>
                            <td className="py-3 px-4">{order.items}</td>
                            <td className="py-3 px-4 font-semibold">{order.amount}</td>
                            <td className="py-3 px-4">{order.vendor}</td>
                            <td className="py-3 px-4">
                              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                order.status === "Delivered" 
                                  ? "bg-[#D1FAE5] text-[#065F46]" 
                                  : "bg-[#FEF3C7] text-[#92400E]"
                              }`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button className="text-gray-400 hover:text-gray-600">⋮</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#E8ECF1]">
                    <p className="text-sm text-gray-600">Showing 1 to 4 of 4 orders</p>
                    <div className="flex gap-2">
                      <button className="px-2 py-1 text-gray-600 hover:text-gray-900">←</button>
                      <button className="px-3 py-1 bg-[#4A6CF7] text-white rounded">1</button>
                      <button className="px-2 py-1 text-gray-600 hover:text-gray-900">→</button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="services" className="mt-6">
              <Card className="border-[#E8ECF1]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-[#1A1D26] text-lg">Service History</h3>
                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={() => navigate(`/clients/${id}/add-service`)}
                    >
                      <Plus className="h-4 w-4" /> Add Service
                    </Button>
                  </div>
                  
                  <div className="flex gap-4 mb-6">
                    <button className="px-4 py-2 border border-[#E8ECF1] rounded-lg text-sm text-gray-600 hover:bg-[#F9FAFB]">
                      Filter
                    </button>
                    <select className="px-4 py-2 border border-[#E8ECF1] rounded-lg text-sm text-gray-600">
                      <option>Category</option>
                    </select>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-[#E8ECF1] bg-[#F9FAFB]">
                        <tr>
                          <th className="text-left py-3 px-4 font-semibold text-[#5C6370]">SERVICE ID</th>
                          <th className="text-left py-3 px-4 font-semibold text-[#5C6370]">SERVICE NAME</th>
                          <th className="text-left py-3 px-4 font-semibold text-[#5C6370]">PROVIDER</th>
                          <th className="text-left py-3 px-4 font-semibold text-[#5C6370]">START DATE</th>
                          <th className="text-left py-3 px-4 font-semibold text-[#5C6370]">END DATE</th>
                          <th className="text-left py-3 px-4 font-semibold text-[#5C6370]">AMOUNT</th>
                          <th className="text-left py-3 px-4 font-semibold text-[#5C6370]">STATUS</th>
                          <th className="text-center py-3 px-4 font-semibold text-[#5C6370]">ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { id: "SRV-001", name: "Cloud Hosting Premium", provider: "CloudServe Inc", startDate: "2024-01-01", endDate: "2024-12-31", amount: "$12,000/year", status: "Active" },
                          { id: "SRV-002", name: "IT Support & Maintenance", provider: "TechSupply Co", startDate: "2024-01-01", endDate: "2024-12-31", amount: "$24,000/year", status: "Active" },
                          { id: "SRV-003", name: "Software Licenses", provider: "Microsoft", startDate: "2024-01-01", endDate: "2024-12-31", amount: "$36,000/year", status: "Active" },
                        ].map((service) => (
                          <tr key={service.id} className="border-b border-[#E8ECF1] hover:bg-[#F9FAFB]">
                            <td className="py-3 px-4">
                              <span className="text-[#4A6CF7] font-medium">{service.id}</span>
                            </td>
                            <td className="py-3 px-4 font-medium">{service.name}</td>
                            <td className="py-3 px-4">{service.provider}</td>
                            <td className="py-3 px-4">{service.startDate}</td>
                            <td className="py-3 px-4">{service.endDate}</td>
                            <td className="py-3 px-4">{service.amount}</td>
                            <td className="py-3 px-4">
                              <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-[#D1FAE5] text-[#065F46]">
                                {service.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button className="text-gray-400 hover:text-gray-600">⋮</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#E8ECF1]">
                    <p className="text-sm text-gray-600">Showing 1 to 3 of 3 services</p>
                    <div className="flex gap-2">
                      <button className="px-2 py-1 text-gray-600 hover:text-gray-900">←</button>
                      <button className="px-3 py-1 bg-[#4A6CF7] text-white rounded">1</button>
                      <button className="px-2 py-1 text-gray-600 hover:text-gray-900">→</button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="catalog" className="mt-6">
              <div className="space-y-6">
                {/* Stat Cards */}
                <div className="grid grid-cols-4 gap-4">
                  <Card className="border-[#E8ECF1]">
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600">Total Items</p>
                      <p className="text-3xl font-bold text-[#1A1D26] mt-2">{catalogProducts.length}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-[#E8ECF1]">
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600">In Stock</p>
                      <p className="text-3xl font-bold text-green-600 mt-2">{catalogProducts.filter(p => p.status === "green").length}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-[#E8ECF1]">
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600">Low Stock</p>
                      <p className="text-3xl font-bold text-orange-600 mt-2">{catalogProducts.filter(p => p.status === "orange").length}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-[#E8ECF1]">
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600">Out of Stock</p>
                      <p className="text-3xl font-bold text-red-600 mt-2">{catalogProducts.filter(p => p.status === "red").length}</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-[#E8ECF1]">
                  <CardContent className="p-6">
                    {/* Header with Actions */}
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-semibold text-[#1A1D26] text-lg">Client Catalog</h3>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" /> Bulk Import
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" /> Export
                        </Button>
                        <Button
                          size="sm"
                          className="gap-2 bg-[#4A6CF7] hover:bg-[#3B5DE8] text-white"
                          onClick={() => navigate(`/clients/${id}/assign-products`)}
                        >
                          <Plus className="h-4 w-4" /> Add New Product
                        </Button>
                      </div>
                    </div>

                    {/* Search Bar */}
                    <div className="mb-6">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search by product name, SKU, brand..."
                          className="w-full pl-10 pr-4 py-2 border border-[#E8ECF1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A6CF7]"
                        />
                      </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b border-[#E8ECF1] bg-[#F9FAFB]">
                          <tr>
                            <th className="text-left py-3 px-4 font-semibold text-[#5C6370]">SKU</th>
                            <th className="text-left py-3 px-4 font-semibold text-[#5C6370]">PRODUCT</th>
                            <th className="text-left py-3 px-4 font-semibold text-[#5C6370]">CATEGORY</th>
                            <th className="text-left py-3 px-4 font-semibold text-[#5C6370]">ROLES</th>
                            <th className="text-left py-3 px-4 font-semibold text-[#5C6370]">SELLING PRICE (INR)</th>
                            <th className="text-left py-3 px-4 font-semibold text-[#5C6370]">AVAILABILITY</th>
                            <th className="text-left py-3 px-4 font-semibold text-[#5C6370]">ACTION</th>
                          </tr>
                        </thead>
                        <tbody>
                          {catalogProducts.map((product) => (
                            <tr key={product.sku} className="border-b border-[#E8ECF1] hover:bg-[#F9FAFB]">
                              <td className="py-3 px-4 font-medium text-[#1A1D26]">{product.sku}</td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <img 
                                    src={product.image} 
                                    alt={product.name}
                                    className="w-10 h-10 rounded object-cover border border-[#E8ECF1]"
                                  />
                                  <span className="font-medium text-[#1A1D26]">{product.name}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-gray-600">{product.category}</td>
                              <td className="py-3 px-4">
                                <div className="flex gap-1 flex-wrap">
                                  {product.roles.map((role, idx) => (
                                    <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                      {role}
                                      <X className="h-3 w-3 cursor-pointer" />
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="py-3 px-4 font-semibold text-[#1A1D26]">{product.price}</td>
                              <td className="py-3 px-4">
                                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                  product.status === "green" ? "bg-[#D1FAE5] text-[#065F46]" : "bg-[#FEF3C7] text-[#92400E]"
                                }`}>
                                  {product.availability}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="relative group">
                                  <button className="text-gray-400 hover:text-gray-600 p-1">⋮</button>
                                  <div className="absolute right-0 mt-1 w-48 bg-white border border-[#E8ECF1] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                    <button className="w-full text-left px-4 py-2 hover:bg-[#F9FAFB] flex items-center gap-2 text-gray-700 border-b border-[#E8ECF1]">
                                      <Edit2 className="h-4 w-4 text-[#4A6CF7]" />
                                      Edit Roles
                                    </button>
                                    <button className="w-full text-left px-4 py-2 hover:bg-[#FEF2F2] flex items-center gap-2 text-red-600">
                                      <Trash2 className="h-4 w-4" />
                                      Remove Product
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#E8ECF1]">
                      <p className="text-sm text-gray-600">Showing 1 to 3 of 3 products</p>
                      <div className="flex gap-2">
                        <button className="px-2 py-1 text-gray-600 hover:text-gray-900">←</button>
                        <button className="px-3 py-1 bg-[#4A6CF7] text-white rounded">1</button>
                        <button className="px-2 py-1 text-gray-600 hover:text-gray-900">→</button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="mt-6">
              <Card className="border-[#E8ECF1]">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-[#1A1D26] text-lg">Recent Activity</h3>
                  <p className="text-sm text-gray-600 mt-1">View the latest updates and actions for this client.</p>
                  
                  <div className="mt-6 space-y-6">
                    {[
                      { 
                        icon: "🛒", 
                        title: "New order placed",
                        description: "Order #ORD-2024-1245 for $125,000",
                        time: "2024-05-28 10:30 AM",
                        color: "blue"
                      },
                      { 
                        icon: "👤", 
                        title: "User added",
                        description: "Aaron Lee (EMP-001) added as Admin",
                        time: "2024-05-25 02:15 PM",
                        color: "green"
                      },
                      { 
                        icon: "📋", 
                        title: "Contract updated",
                        description: "Contract period extended to Dec 2025",
                        time: "2024-05-20 11:00 AM",
                        color: "orange"
                      },
                    ].map((activity, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                            activity.color === "blue" ? "bg-blue-100" :
                            activity.color === "green" ? "bg-green-100" :
                            "bg-yellow-100"
                          }`}>
                            {activity.icon}
                          </div>
                          {idx < 2 && <div className="w-0.5 h-12 bg-gray-200 mt-2"></div>}
                        </div>
                        <div className="flex-1 pt-1">
                          <h4 className="font-semibold text-[#1A1D26]">{activity.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                          <p className="text-xs text-gray-500 mt-2">📅 {activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-[#E8ECF1]">
                    <p className="text-sm text-gray-600">Showing 1 to 3 of 3 activities</p>
                    <div className="flex gap-2">
                      <button className="px-2 py-1 text-gray-600 hover:text-gray-900">←</button>
                      <button className="px-3 py-1 bg-[#4A6CF7] text-white rounded">1</button>
                      <button className="px-2 py-1 text-gray-600 hover:text-gray-900">→</button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="configuration" className="mt-6">
              <Card className="border-[#E8ECF1]">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-[#1A1D26] text-lg mb-4">Configuration</h3>
                  <div className="space-y-6">
                    <div className="border-b border-[#E8ECF1] pb-6">
                      <h4 className="font-semibold text-[#1A1D26] mb-3">API Settings</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-700">API Key</label>
                          <input 
                            type="password" 
                            value="••••••••••••••••" 
                            readOnly
                            className="w-full mt-1 px-3 py-2 border border-[#E8ECF1] rounded-lg bg-gray-50"
                          />
                        </div>
                        <Button variant="outline" className="border-[#E8ECF1]">Regenerate API Key</Button>
                      </div>
                    </div>
                    
                    <div className="border-b border-[#E8ECF1] pb-6">
                      <h4 className="font-semibold text-[#1A1D26] mb-3">Notifications</h4>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" defaultChecked className="w-4 h-4" />
                          <span className="text-sm">Email notifications for orders</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" defaultChecked className="w-4 h-4" />
                          <span className="text-sm">Email notifications for services</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" className="w-4 h-4" />
                          <span className="text-sm">SMS notifications</span>
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-[#1A1D26] mb-3">Danger Zone</h4>
                      <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                        Archive Client
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Add/Edit Role Dialog */}
          <Dialog open={addRoleDialogOpen} onOpenChange={setAddRoleDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
              <DialogHeader className="pb-4 border-b border-[#E8ECF1]">
                <DialogTitle className="flex items-center gap-2">
                  {editingRoleKey ? (
                    <>
                      <Edit2 className="h-5 w-5 text-[#4A6CF7]" />
                      Edit Role
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5 text-[#4A6CF7]" />
                      Add New Role
                    </>
                  )}
                </DialogTitle>
              </DialogHeader>

              {/* Dialog Content Container */}
              <div className="space-y-4 py-2">
                {/* Role Information */}
                <div className="bg-gradient-to-br from-[#F9FAFB] to-white p-4 rounded-lg border border-[#E8ECF1]">
                  <h3 className="text-sm font-semibold text-[#1A1D26] mb-4 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[#4A6CF7]" />
                    Role Information
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-semibold text-[#1A1D26]">Role Name *</Label>
                        <Input 
                          value={roleForm.name} 
                          onChange={e => setRoleForm(p => ({ ...p, name: e.target.value }))} 
                          placeholder="e.g., Procurement Manager"
                          className="border-[#E8ECF1] focus:border-[#4A6CF7] mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-[#1A1D26]">Role Code</Label>
                        <Input 
                          value={roleForm.roleCode} 
                          onChange={e => setRoleForm(p => ({ ...p, roleCode: e.target.value }))} 
                          placeholder="e.g., PM"
                          className="border-[#E8ECF1] focus:border-[#4A6CF7] mt-1"
                          disabled={!!editingRoleKey}
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-[#1A1D26]">Role Type *</Label>
                      <Select value={roleForm.roleType} onValueChange={v => setRoleForm(p => ({ ...p, roleType: v }))}>
                        <SelectTrigger className="border-[#E8ECF1] focus:border-[#4A6CF7] mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Internal User">Internal User</SelectItem>
                          <SelectItem value="Client User">Client User</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-[#1A1D26]">Description</Label>
                      <Textarea 
                        value={roleForm.description} 
                        onChange={e => setRoleForm(p => ({ ...p, description: e.target.value }))} 
                        placeholder="Describe the purpose and responsibilities of this role"
                        rows={3}
                        className="border-[#E8ECF1] focus:border-[#4A6CF7] mt-1"
                      />
                    </div>
                    <div className="flex items-center gap-6 pt-2">
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={roleForm.status === 'Active'} 
                          onCheckedChange={v => setRoleForm(p => ({ ...p, status: v ? 'Active' : 'Inactive' }))} 
                        />
                        <Label className="text-xs font-medium">Active</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          checked={roleForm.isDefault} 
                          onCheckedChange={v => setRoleForm(p => ({ ...p, isDefault: !!v }))} 
                        />
                        <Label className="text-xs font-medium">Set as Default Role</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Module Permissions */}
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-[#F9FAFB] to-white p-4 rounded-lg border border-[#E8ECF1]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-[#1A1D26] flex items-center gap-2">
                      <Users className="h-4 w-4 text-[#4A6CF7]" />
                      Module Permissions
                    </h3>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setShowAddModuleForm(!showAddModuleForm)}
                      className="border-[#4A6CF7] text-[#4A6CF7] hover:bg-[#EEF2FF]"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Module
                    </Button>
                  </div>

                  {/* Add Module Form */}
                  {showAddModuleForm && (
                    <div className="mb-4 p-3 bg-white border border-[#E8ECF1] rounded-lg">
                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <Label className="text-xs font-semibold text-[#1A1D26]">Module Name</Label>
                          <Input 
                            value={newModuleName}
                            onChange={e => setNewModuleName(e.target.value)}
                            placeholder="e.g., Analytics"
                            className="border-[#E8ECF1] focus:border-[#4A6CF7] mt-1 text-sm"
                          />
                        </div>
                        <Button 
                          size="sm"
                          className="bg-[#4A6CF7] hover:bg-[#3B5DE8]"
                          onClick={() => {
                            if (newModuleName.trim()) {
                              setCustomModules([...customModules, { id: `custom_${Date.now()}`, name: newModuleName }]);
                              setNewModuleName("");
                              setShowAddModuleForm(false);
                            }
                          }}
                        >
                          Add
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setShowAddModuleForm(false);
                            setNewModuleName("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Modules Table */}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-40 text-xs font-semibold">Module</TableHead>
                          <TableHead className="text-center w-14 text-xs font-semibold">View</TableHead>
                          <TableHead className="text-center w-14 text-xs font-semibold">Create</TableHead>
                          <TableHead className="text-center w-14 text-xs font-semibold">Edit</TableHead>
                          <TableHead className="text-center w-14 text-xs font-semibold">Delete</TableHead>
                          <TableHead className="text-center w-14 text-xs font-semibold">Approve</TableHead>
                          <TableHead className="text-center w-14 text-xs font-semibold">Export</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...AVAILABLE_MODULES, ...customModules].map((module) => (
                          <TableRow key={module.id} className="hover:bg-[#F0F4FF]">
                            <TableCell className="font-medium text-sm text-[#1A1D26]">{module.name}</TableCell>
                            <TableCell className="text-center"><Checkbox className="mx-auto" /></TableCell>
                            <TableCell className="text-center"><Checkbox className="mx-auto" /></TableCell>
                            <TableCell className="text-center"><Checkbox className="mx-auto" /></TableCell>
                            <TableCell className="text-center"><Checkbox className="mx-auto" /></TableCell>
                            <TableCell className="text-center"><Checkbox className="mx-auto" /></TableCell>
                            <TableCell className="text-center"><Checkbox className="mx-auto" /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>

              {/* Data Access & Approval */}
              <div className="grid grid-cols-2 gap-4 pb-2">
                <div className="bg-gradient-to-br from-[#F9FAFB] to-white p-4 rounded-lg border border-[#E8ECF1]">
                  <h3 className="text-sm font-semibold text-[#1A1D26] mb-4 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#4A6CF7]" />
                    Data Access Control
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs font-semibold text-[#1A1D26]">Data Visibility *</Label>
                      <Select value={roleForm.dataVisibility} onValueChange={v => setRoleForm(p => ({ ...p, dataVisibility: v }))}>
                        <SelectTrigger className="border-[#E8ECF1] focus:border-[#4A6CF7] mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All">All Data</SelectItem>
                          <SelectItem value="Department Only">Department Only</SelectItem>
                          <SelectItem value="Own Only">Own Records Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-[#1A1D26]">Location Access *</Label>
                      <Select value={roleForm.locationAccess} onValueChange={v => setRoleForm(p => ({ ...p, locationAccess: v }))}>
                        <SelectTrigger className="border-[#E8ECF1] focus:border-[#4A6CF7] mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All">All Locations</SelectItem>
                          <SelectItem value="Selected Locations">Selected Locations</SelectItem>
                          <SelectItem value="Assigned Location">Assigned Location</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-[#F9FAFB] to-white p-4 rounded-lg border border-[#E8ECF1]">
                  <h3 className="text-sm font-semibold text-[#1A1D26] mb-4 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-[#4A6CF7]" />
                    Approval Permissions
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-[#E8ECF1]">
                      <Checkbox 
                        checked={roleForm.canApproveOrders} 
                        onCheckedChange={v => setRoleForm(p => ({ ...p, canApproveOrders: !!v }))} 
                      />
                      <div className="flex-1">
                        <Label className="text-xs font-semibold text-[#1A1D26]">Can Approve Orders</Label>
                        <p className="text-xs text-gray-600 mt-0.5">Enable order approval for this role</p>
                      </div>
                    </div>
                    {roleForm.canApproveOrders && (
                      <div>
                        <Label className="text-xs font-semibold text-[#1A1D26]">Approval Limit (₹) *</Label>
                        <Input 
                          type="number" 
                          value={roleForm.approvalLimit} 
                          onChange={e => setRoleForm(p => ({ ...p, approvalLimit: Number(e.target.value) }))} 
                          placeholder="e.g., 250000"
                          className="border-[#E8ECF1] focus:border-[#4A6CF7] mt-1"
                        />
                        <p className="text-xs text-gray-600 mt-1">Maximum order amount this role can approve</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-6 border-t border-[#E8ECF1] mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setAddRoleDialogOpen(false);
                    setEditingRoleKey(null);
                    setCustomModules([]);
                    setShowAddModuleForm(false);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  className="bg-[#4A6CF7] hover:bg-[#3B5DE8]"
                  onClick={() => {
                    console.log("[v0] Role saved:", roleForm);
                    setAddRoleDialogOpen(false);
                    setEditingRoleKey(null);
                    setCustomModules([]);
                    setShowAddModuleForm(false);
                  }}
                >
                  {editingRoleKey ? "Save Changes" : "Create Role"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
