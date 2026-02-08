import React from "react";
import { Button } from "antd";

type PageHeaderProps = {
    title: string;
    addLabel?: string;
    addDisabled?: boolean;
    onAdd?: () => void;
    rightSlot?: React.ReactNode;
};

export default function PageHeader({
    title,
    addLabel = "+ New",
    addDisabled = false,
    onAdd,
    rightSlot,
}: PageHeaderProps) {
    return (
        <div className="flex justify-between items-center mb-4">
            <h1
                style={{
                    fontSize: "25px",
                    fontWeight: 700,
                    padding: "8px 16px",
                    color: "#1f2937",
                }}
            >
                {title}
            </h1>

            <div className="flex items-center gap-2">
                {rightSlot}
                {onAdd && (
                    <Button
                        type="primary"
                        onClick={onAdd}
                        disabled={addDisabled}
                        style={{ margin: "15px" }}
                    >
                        {addLabel}
                    </Button>
                )}
            </div>
        </div>

    )
}