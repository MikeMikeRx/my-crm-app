import { Card, Progress } from "antd";
import type { StatPrevCardItem, QuoteStatus } from "@/types/entities";

interface Props {
    preview: StatPrevCardItem[];
    loading: boolean;
}

const QUOTE_COLORS: Record<QuoteStatus, string> = {
    draft: "blue",
    sent: "orange",
    accepted: "green",
    declined: "red",
    expired: "black",
    converted: "purple",
};

export default function QuotePreviewCard({ preview, loading }: Props) {
    return (
        <Card title="Quotes Overview" style={{ height: "100%" }}>
            {loading ? (
                <p>Loading...</p>
            ) : (
                preview.map((item) => (
                    <div key={item.status} style={{ marginBottom: 14 }}>
                        <div className="flex justify-between text-xs mb-1">
                            <span>{item.status.toUpperCase()}</span>
                            <span>{item.percentage}%</span>
                        </div>

                        <Progress
                            percent={item.percentage}
                            showInfo={false}
                            strokeColor={
                                QUOTE_COLORS[item.status as QuoteStatus] || "gray"
                            }
                        />
                    </div>
                ))
            )}
        </Card>
    );
}
