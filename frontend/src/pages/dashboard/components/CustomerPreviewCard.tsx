import { Card, Progress } from "antd";

interface Props {
    active: number;
    total: number;
    newlyAdded: number;
    loading: boolean;
}

export default function CustomerPreviewCard({
    active,
    total,
    newlyAdded,
    loading,
}: Props) {

    const inactive = Math.max(total - active, 0);
    const pctActive = total > 0 ? Math.round((active / total) * 100) : 0;

    const stats = [
        { label: "Active", value: active, color: "#10b981" },
        { label: "Inactive", value: inactive, color: "#ef4444" },
        { label: "New This Month", value: newlyAdded, color: "#3b82f6" },
        { label: "Total", value: total, color: "#6b7280" },
    ];

    return (
        <Card style={{ width: "100%", height: "100%" }} styles={{ body: { padding: "28px 32px" } }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
                <div style={{ width: 4, height: 22, borderRadius: 2, backgroundColor: "#3b82f6", flexShrink: 0 }} />
                <span style={{ fontSize: 15, fontWeight: 700, color: "#111827", letterSpacing: "-0.01em" }}>Customer Overview</span>
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <Progress
                            type="dashboard"
                            percent={pctActive}
                            strokeColor="#3b82f6"
                            size={160}
                            style={{ marginTop: 4, marginBottom: 6 }}
                        />
                        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
                            <strong style={{ color: "#111827" }}>{active}</strong> of <strong style={{ color: "#111827" }}>{total}</strong> customers active
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, backgroundColor: "#f0f0f0", borderRadius: 8, overflow: "hidden" }}>
                        {stats.map((stat) => (
                            <div
                                key={stat.label}
                                style={{ textAlign: "center", padding: "14px 8px", backgroundColor: "white" }}
                            >
                                <div style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                                <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 3 }}>{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </Card>
    )
}