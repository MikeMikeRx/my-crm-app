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

    return (
        <Card style={{ height: "100%", textAlign: "center"}}>
            <h3 className="text-base font-semibold mb-3">Active Customers</h3>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <>
                    {/* Circle Percentage */}
                    <Progress
                        type="dashboard"
                        percent={pctActive}
                        strokeColor="#3b82f6"
                        size={150}
                        style={{
                            marginTop: 10,
                            marginBottom: 30
                        }}
                    />

                    {/* Details Below */}
                    <div
                        style={{
                        fontSize: 15,
                        lineHeight: 1.5,
                    }}
                    >
                        <div>New Customers: <strong>{newlyAdded}</strong></div>
                        <div>Total Customers: <strong>{total}</strong></div>
                        <div>Inactive Customers: <strong>{inactive}</strong></div>
                    </div>
                </>
            )}            
        </Card>
    )
}