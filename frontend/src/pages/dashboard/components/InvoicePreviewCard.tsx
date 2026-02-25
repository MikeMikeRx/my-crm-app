import { Progress } from "antd";
import type { StatPrevCardItem } from "@/types/entities"

interface Props {
    preview: StatPrevCardItem[];
    loading: boolean;
}

const INVOICE_COLORS: Record<string, string> = {
    paid: "#10b981",
    partially_paid: "#3b82f6",
    unpaid: "#f59e0b",
    overdue: "#ef4444",
};

const INVOICE_LABELS: Record<string, string> = {
    paid: "Paid",
    partially_paid: "Partially Paid",
    unpaid: "Unpaid",
    overdue: "Overdue",
};

export default function InvoicePreviewCard ({ preview = [], loading }: Props) {
    if (loading) return <p>Loading...</p>;

    return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            {preview.map((item) => {
                const color = INVOICE_COLORS[item.status] || "gray";
                const label = INVOICE_LABELS[item.status] || item.status;
                return (
                    <div key={item.status}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", backgroundColor: color, flexShrink: 0 }} />
                                <span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>{label}</span>
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#6b7280" }}>{item.percentage}%</span>
                        </div>
                        <Progress
                            percent={item.percentage}
                            showInfo={false}
                            strokeWidth={11}
                            strokeColor={color}
                            trailColor="#f3f4f6"
                        />
                    </div>
                );
            })}
        </div>
    );
}