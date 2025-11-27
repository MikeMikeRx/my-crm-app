import { Card, Skeleton } from "antd"
import type { SummaryCardProps } from "@/types/entities"

export default function SummaryCard({ title, subtitle, value, loading, color }: SummaryCardProps) {
    return (
        <Card style={{ height: 120 }}>
            <h3
                className="text-gray-600 text-sm"
                style={{
                    textAlign: "center",
                    marginBottom: "6",
                    fontSize: 18,
                }}
            >
                {title}
            </h3>

            <div
                style={{
                    width: "100%",
                    height: "1px",
                    background: "#e5e7eb",
                    margin: "6px 0 10px 0"
                }}
            ></div>

            <div 
                className="text-gray-500 text-xs mt-1 flex items-center gap-2"
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    margin:"0px 10px",
                    fontSize: 15,
                }}
            >
                {subtitle}
            
                {loading ? (
                    <Skeleton.Input active size="small" style={{ width: 80 }} />
                ) : (
                    <span
                        style={{
                            background: color,
                            color: "white",
                            padding: "2px 8px",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                        }}
                    >
                        {value}
                    </span>
                )}
           </div>
        </Card>
    )
}