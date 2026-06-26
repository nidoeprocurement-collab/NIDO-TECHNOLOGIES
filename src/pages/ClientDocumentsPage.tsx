import { useState } from "react";
import { Upload, Download, Trash2, FileText, Search, Filter, MoreVertical, Eye, Share2 } from "lucide-react";

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedDate: string;
  uploadedBy: string;
  category: string;
}

const DOCUMENTS: Document[] = [
  {
    id: "doc_001",
    name: "Service Agreement 2024.pdf",
    type: "PDF",
    size: "2.4 MB",
    uploadedDate: "Jun 15, 2024",
    uploadedBy: "John Doe",
    category: "Contracts",
  },
  {
    id: "doc_002",
    name: "Tax Certificate.pdf",
    type: "PDF",
    size: "1.2 MB",
    uploadedDate: "Jun 10, 2024",
    uploadedBy: "Sarah Smith",
    category: "Compliance",
  },
  {
    id: "doc_003",
    name: "Business License.jpg",
    type: "Image",
    size: "856 KB",
    uploadedDate: "Jun 5, 2024",
    uploadedBy: "Admin",
    category: "Legal",
  },
  {
    id: "doc_004",
    name: "Insurance Certificate.pdf",
    type: "PDF",
    size: "1.8 MB",
    uploadedDate: "May 28, 2024",
    uploadedBy: "Finance Team",
    category: "Insurance",
  },
  {
    id: "doc_005",
    name: "Banking Details.xlsx",
    type: "Excel",
    size: "512 KB",
    uploadedDate: "May 20, 2024",
    uploadedBy: "Finance Team",
    category: "Financial",
  },
  {
    id: "doc_006",
    name: "Company Profile.docx",
    type: "Word",
    size: "2.1 MB",
    uploadedDate: "May 15, 2024",
    uploadedBy: "Marketing",
    category: "General",
  },
];

const CATEGORIES = ["All", "Contracts", "Compliance", "Legal", "Insurance", "Financial", "General"];

export default function ClientDocumentsPage() {
  const [documents, setDocuments] = useState(DOCUMENTS);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const filteredDocuments = documents.filter((doc) => {
    const matchesCategory = selectedCategory === "All" || doc.category === selectedCategory;
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleDelete = (id: string) => {
    setDocuments(documents.filter((doc) => doc.id !== id));
    setOpenMenu(null);
  };

  const getFileIcon = (type: string) => {
    const iconClass = "w-4 h-4";
    switch (type) {
      case "PDF":
        return <FileText className={iconClass + " text-red-500"} />;
      case "Excel":
        return <FileText className={iconClass + " text-green-500"} />;
      case "Word":
        return <FileText className={iconClass + " text-blue-500"} />;
      case "Image":
        return <FileText className={iconClass + " text-purple-500"} />;
      default:
        return <FileText className={iconClass + " text-gray-500"} />;
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
            <p className="text-sm text-gray-500 mt-1">Manage and view all client documents</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Upload size={18} />
            Upload Document
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 space-y-4">
        {/* Search Bar */}
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder-gray-400"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={18} className="text-gray-400" />
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Documents List */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {filteredDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <FileText size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No documents found</h3>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getFileIcon(doc.type)}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">{doc.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <span>{doc.type}</span>
                      <span>•</span>
                      <span>{doc.size}</span>
                      <span>•</span>
                      <span>{doc.uploadedDate}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                    <Eye size={18} />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                    <Download size={18} />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                    <Share2 size={18} />
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === doc.id ? null : doc.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <MoreVertical size={18} />
                    </button>
                    {openMenu === doc.id && (
                      <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                        <button
                          onClick={() => {
                            handleDelete(doc.id);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-lg"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Showing {filteredDocuments.length} documents</span>
          <span>Total size: {filteredDocuments.reduce((sum, doc) => sum + parseFloat(doc.size), 0).toFixed(1)} MB</span>
        </div>
      </div>
    </div>
  );
}
