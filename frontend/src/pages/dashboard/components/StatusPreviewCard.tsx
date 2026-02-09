import {Card, Progress, Skeleton } from "antd";
import type { StatPrevCardProps } from "@/types/entities";

const StatusPreviewCard = ({ title, preview = [], loading}: StatPrevCardProps) => {
  return (
    <Card style={{ height: "100%" }}>
        <h3 className="text-gray-600 text-sm mb-3">{title}</h3>

        {loading ? (
            <Skeleton active paragraph={{ rows: 3 }} />
        ) : (
            <div className="flex flex-col gap-3">
                {preview.map((item) => (
                    <div key={item.status}>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium">{item.status}</span>
                            <span>{item.percentage}%</span>
                        </div>

                        <Progress
                            percent={item.percentage}
                            showInfo={false}
                            size="small"
                        />
                    </div>
                ))}
            </div>
        )}
    </Card>
  )
}

export default StatusPreviewCard