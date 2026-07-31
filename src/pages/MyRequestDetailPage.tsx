import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function MyRequestDetailPage() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-transparent border-b border-gray-200/70">
        <div className="w-full px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate("/services")}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <p className="text-xs text-gray-500">Services / My Requests / {requestId}</p>
            <h1 className="text-2xl font-bold text-gray-900">{requestId}</h1>
          </div>
        </div>
      </div>

      {/* Empty body — details will be added later */}
      <div className="w-full px-4 py-6">
        <Card>
          <CardContent className="p-12 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-2">
              <span className="text-2xl">📋</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-700">Request Details</h2>
            <p className="text-sm text-gray-400">
              Details for <span className="font-medium text-gray-600">{requestId}</span> will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
