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

    return <div>
        {/*--------------------- Row 1 ---------------------*/}
        <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
            <Col span={6}>
                <SummaryCard
                    title="Invoices (This Month)"
                    value={data?.invoices?.total}
                    loading={loading}
                />
            </Col>

            <Col span={6}>
                <SummaryCard
                    title="Quotes (This Month)"
                    value={data?.quotes?.total}
                    loading={loading}
                />
            </Col>

            <Col span={6}>
                <SummaryCard
                    title="Payments (This Month)"
                    value={data?.payments?.total}
                    loading={loading}
                />
            </Col>

            <Col span={6}>
                <SummaryCard
                    title="New Customers"
                    value={data?.customers?.total}
                    loading={loading}
                />
            </Col>
        </Row>

        {/* --------------------- Row 2 --------------------- */}
        <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
            <Col span={6}>
                <SummaryCard
                    title="Invoices (Total)"
                    value={data?.invoices?.total}
                    loading={loading}
                />
            </Col>

            <Col span={6}>
                <SummaryCard
                    title="Quotes (Total)"
                    value={data?.quotes?.total}
                    loading={loading}
                />
            </Col>

            <Col span={6}>
                <SummaryCard
                    title="Payments (Total)"
                    value={data?.payments?.total}
                    loading={loading}
                />
            </Col>

            <Col span={6}>
                <SummaryCard
                    title="Customers (Total)"
                    value={data?.customers?.total}
                    loading={loading}
                />
            </Col>
        </Row>

    </div>
}