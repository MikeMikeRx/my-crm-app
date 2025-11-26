import { useState, useEffect } from "react";
import { Row, Col } from "antd";
import SummaryCard from "@/components/dashboard/SummaryCard";
import { getDashboardSummary } from "@/api/dashboard";

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        getDashboardSummary()
            .then((res) => setData(res))
            .finally(() => setLoading(false));
    }, []);

    return (
        <Row gutter={[16, 16]}>
            <Col span={6}>
                <SummaryCard
                    title="Invoices (total)"
                    value={data?.invoices?.total}
                    loading={loading}
                />
            </Col>

            <Col span={6}>
                <SummaryCard
                    title="Quotes (total)"
                    value={data?.quotes?.total}
                    loading={loading}
                />
            </Col>

            <Col span={6}>
                <SummaryCard
                    title="Payments (total)"
                    value={data?.payments?.total}
                    loading={loading}
                />
            </Col>

            <Col span={6}>
                <SummaryCard
                    title="Customers (total)"
                    value={data?.customers?.total}
                    loading={loading}
                />
            </Col>            
        </Row>
    )
}