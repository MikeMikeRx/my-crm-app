import { Progress } from "antd";
import type { StatPrevCardItem, QuoteStatus } from "@/types/entities";
import { capitalize } from "@/utils/capitalize";

interface Props {
    preview: StatPrevCardItem[];
    loading: boolean;
}

const QUOTE_COLORS: Record<QuoteStatus, string> = {
    draft: "gray",
    sent: "#3b82f6",
    accepted: "#10b981",
    declined: "#ef4444",
    expired: "black",
    converted: "purple",
};

export default function QuotePreviewCard({ preview = [], loading }: Props) {
    if (loading) return <p>Loading...</p>;

    return (
        <>
            {preview.map((item) => {
                const color = QUOTE_COLORS[item.status as QuoteStatus] || "gray";
                return (
                    <div key={item.status} style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", backgroundColor: color, flexShrink: 0 }} />
                                <span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>{capitalize(item.status)}</span>
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#6b7280" }}>{item.percentage}%</span>
                        </div>
                        <Progress
                            percent={item.percentage}
                            showInfo={false}
                            strokeWidth={10}
                            strokeColor={color}
                            trailColor="#f3f4f6"
                        />
                    </div>
                );
            })}
        </>
    );
}
