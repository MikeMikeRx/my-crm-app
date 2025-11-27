import { useState, useEffect } from "react";
import { Row, Col, Card, Progress } from "antd";
import SummaryCard from "@/components/dashboard/SummaryCard";
import { getDashboardSummary } from "@/api/dashboard";
import StatusPreviewCard from "@/components/dashboard/StatusPreviewCard";
import { formatAmount } from "@/utils/numberFormat";

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        getDashboardSummary()
            .then((res) => setData(res))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div style={{ padding: "24px 32px" }}>
            {/*--------------------- Top Section ---------------------*/}
            <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
                <Col span={6}>
                    <SummaryCard
                        title="Quotes"
                        subtitle="This Month"
                        value={`$ ${formatAmount(data?.invoices?.monthSum)}`}
                        loading={loading}
                        color="#3b82f6"
                    />
                </Col>

                <Col span={6}>
                    <SummaryCard
                        title="Invoices"
                        subtitle="This Month"
                        value={`$ ${formatAmount(data?.invoices?.monthSum)}`}
                        loading={loading}
                        color="#8b5cf6"
                    />
                </Col>

                <Col span={6}>
                    <SummaryCard
                        title="Payments"
                        subtitle="This Month"
                        value={`$ ${formatAmount(data?.invoices?.monthSum)}`}
                        loading={loading}
                        color="#10b981"
                    />
                </Col>

                <Col span={6}>
                    <SummaryCard
                        title="Due Balance"
                        subtitle="Outstanding"
                        value={`$ ${formatAmount(data?.payments?.dueBalance || 0)}`}
                        loading={loading}
                        color="#ef4444"
                    />
                </Col>
            </Row>

            {/* --------------------- Middle Section --------------------- */}
            <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
                {/* LEFT: Invoice + Quote Overview in one big card */}
                <Col span={18}>
                    <Card style={{ width: "100%" }}>
                        <Row gutter={[24, 24]}>
                            {/* Invoice Overview */}
                            <Col span={12}>
                                <h3 className="text-base font-semibold mb-3">Invoice Overview</h3>
                                {loading || !data ? (
                                    <p>Loading...</p>
                                ) : (
                                    data.invoices.preview.map((item: any) => (
                                        <div key={item.status} className="mb-3">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span>{item.status}</span>
                                                <span>{item.percentage}%</span>
                                            </div>
                                            <Progress
                                                percent={item.percentage}
                                                showInfo={false}
                                                size="small"
                                            />
                                        </div>
                                    ))
                                )}
                            </Col>

                            {/* Quote Overview */}
                            <Col span={12}>
                                <h3 className="text-base font-semibold mb-3">Quote Overview</h3>
                                {loading || !data ? (
                                    <p>Loading...</p>
                                ) : (
                                    data.quotes.preview.map((item: any) => (
                                        <div key={item.status} className="mb-3">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span>{item.status}</span>
                                                <span>{item.percentage}%</span>
                                            </div>
                                            <Progress
                                                percent={item.percentage}
                                                showInfo={false}
                                                size="small"
                                            />
                                        </div>
                                    ))
                                )}
                            </Col>
                        </Row>
                    </Card>
                </Col>

                {/* RIGHT: Customer summary */}
                <Col span={6}>
                    <Card style={{ width: "100%", height: "100%" }}>
                        <h3 className="text-base font-semibold mb-3">Customers</h3>

                        {loading || !data ? (
                            <p>Loading...</p>
                        ) : (
                            <>
                                <div className="text-center mb-4">
                                    <div className="text-3xl font-bold">
                                        {data.customers.active}
                                    </div>
                                    <div className="text-gray-500 text-xs">Active customers</div>
                                </div>

                                <div className="flex justify-between text-sm mb-1">
                                    <span>New this month</span>
                                    <strong>{data.customers.new}</strong>
                                </div>

                                <div className="flex justify-between text-sm mb-1">
                                    <span>Total customers</span>
                                    <strong>{data.customers.total}</strong>
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span>Inactive</span>
                                    <strong>
                                        {data.customers.total - data.customers.active}
                                    </strong>
                                </div>
                            </>
                        )}
                    </Card>
                </Col>
            </Row>        

            {/*--------------------- Bottom Section ---------------------*/}
            <Row gutter={[24, 24]}>
                <Col span={6}>
                    <StatusPreviewCard
                        title="Invoice Overview"
                        preview={data?.invoices?.preview}
                        loading={loading}
                    />
                </Col>

                <Col span={6}>
                    <StatusPreviewCard
                        title="Quote Overview"
                        preview={data?.quotes?.preview}
                        loading={loading}
                    />
                </Col>

                <Col span={6}>
                    <StatusPreviewCard
                        title="Payment Overview"
                        preview={data?.payments?.preview}
                        loading={loading}
                    />
                </Col>

                <Col span={6}>
                    <StatusPreviewCard
                        title="Customer Overview"
                        preview={data?.customers?.preview}
                        loading={loading}
                    />
                </Col>
            </Row>

        </div>
    )
}