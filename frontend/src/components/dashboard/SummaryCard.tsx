import { Card, Skeleton } from "antd"
import type { SummaryCardProps } from "@/types/entities"

export default function SummaryCard({ title, value, loading }: SummaryCardProps) {
    return (
        <Card style={{ height: 120 }}>
            <h3 className="text-gray-600 text-sm">{title}</h3>
            {loading ? (
                <Skeleton.Input active size="small" style={{ marginTop: 12 }} />
            ) : (
                <div className="text-2x1 font-semibold mt-2">
                    {value ?? 0}
                </div>
           )}
        </Card>
    )
}