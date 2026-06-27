import { useParams, useNavigate } from "react-router-dom";

export default function VendorOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", minHeight: "100vh", background: "#f9fafb", color: "#111827" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px 48px" }}>

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: 13, fontFamily: "inherit", marginBottom: 20, padding: 0 }}
        >
          ← Back
        </button>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
            Vendor Order Details{" "}
            <span style={{ color: "#374151" }}>/ {id}</span>
          </h1>
          <span style={{ padding: "4px 12px", borderRadius: 14, fontSize: 12, fontWeight: 500, background: "#fffbeb", color: "#92400e", border: "1px solid #fcd34d" }}>
            Processing
          </span>
        </div>

        {/* Empty state placeholder */}
        <div style={{
          border: "2px dashed #e5e7eb", borderRadius: 16, padding: "80px 40px",
          textAlign: "center", background: "#fff",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
            Vendor Order Detail Page
          </div>
          <div style={{ fontSize: 14, color: "#6b7280", maxWidth: 380, margin: "0 auto" }}>
            This page is under construction. Vendor order details for{" "}
            <strong style={{ color: "#2563eb" }}>{id}</strong> will appear here.
          </div>
        </div>

      </div>
    </div>
  );
}
