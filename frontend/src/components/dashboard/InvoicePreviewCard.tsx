import { Card, Progress } from "antd";
import type { StatPrevCardItem } from "../../types/entities"

export interface Props {
    preview: StatPrevCardItem[];
    loading: boolean;
}

const INVOICE_COLORS: Record<string,string> = {
    paid: "green",
    unpaid: "blue",
    overdue: "red",
};

export default function InvoicePreviewCard ({ preview, loading }: Props) {
    return (
        <Card title="Invoices Overview" style={{ height: "100%" }}>
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
                            strokeColor={INVOICE_COLORS[item.status] || "gray"}
                        />
                    </div>
                ))
            )}
        </Card>
    );
}