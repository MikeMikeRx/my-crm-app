import { Progress } from "antd";
import type { StatPrevCardItem } from "@/types/entities"
import { capitalize } from "@/utils/capitalize";

interface Props {
    preview: StatPrevCardItem[];
    loading: boolean;
}

const PAYMENT_COLORS: Record<string,string> = {
    completed: "#10b981",
    pending: "#3b82f6",
    overdue: "#ef4444",
};

export default function PaymentPreviewCard ({ preview = [], loading }: Props) {
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
                        strokeColor={PAYMENT_COLORS[item.status] || "gray"}
                    />
                </div>
            ))}
        </>
    );
}
