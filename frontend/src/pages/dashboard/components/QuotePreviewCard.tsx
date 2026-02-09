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
            {preview.map((item) => (
                <div key={item.status} style={{ marginBottom: 14 }}>
                    <div className="flex justify-between text-xs mb-1">
                        <span>{capitalize(item.status)}</span>
                        <span> {item.percentage}%</span>
                    </div>

                    <Progress
                        percent={item.percentage}
                        showInfo={false}
                        size="small"
                        strokeColor={
                            QUOTE_COLORS[item.status as QuoteStatus] || "gray"
                        }
                    />
                </div>
            ))}
        </>
    );
}
