import { useState, useEffect } from "react";
import { Row, Col, Card } from "antd";
import { getDashboardSummary } from "@/api/dashboard";
import SummaryCard from "@/components/dashboard/SummaryCard";
import QuotePreviewCard from "@/components/dashboard/QuotePreviewCard";
import InvoicePreviewCard from "@/components/dashboard/InvoicePreviewCard";
import PaymentPreviewCard from "@/components/dashboard/PaymentPreviewCard";
import CustomerPreviewCard from "@/components/dashboard/CustomerPreviewCard";
import CustomerListCard from "@/components/dashboard/CustomerListCard";
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
                        value={`$ ${formatAmount(data?.quotes?.monthSum)}`}
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
                        value={`$ ${formatAmount(data?.payments?.monthSum)}`}
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

            {/* --------------------- Overview Section --------------------- */}
            <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
                {/* LEFT: Quote + Invoice + Payment Overview in one big card */}
                <Col span={18}>
                    <Card style={{ width: "100%" }}>
                        <Row gutter={[24, 24]}>
                            {/* Quote Overview */}
                            <Col span={8}>
                                <h3 className="text-base font-semibold mb-3">Quote Overview</h3>
                                <QuotePreviewCard
                                    preview={data?.quotes?.preview}
                                    loading={loading}
                                />
                            </Col>

                            {/* Invoice Overview */}
                            <Col span={8}>
                                <h3 className="text-base font-semibold mb-3">Invoice Overview</h3>
                                <InvoicePreviewCard
                                    preview={data?.invoices?.preview}
                                    loading={loading}
                                />
                            </Col>

                            {/* Payment Overview */}
                            <Col span={8}>
                                <h3 className="text-base font-semibold mb-3">Payment Overview</h3>
                                <PaymentPreviewCard
                                    preview={data?.payments?.preview}
                                    loading={loading}
                                />
                            </Col>
                        </Row>
                    </Card>
                </Col>

                {/* RIGHT: Customer summary */}
                <Col span={6}>
                    <CustomerPreviewCard
                        active={data?.customers?.active}
                        total={data?.customers?.total}
                        newlyAdded={data?.customers?.new}
                        loading={loading}
                    />
                </Col>
            </Row>

            {/* --------------------- Customer Overview Section --------------------- */}
            <Row gutter={[24, 24]}>
                <Col span={24}>
                    <Card title="Customer Overview" style={{ width: "100%" }}>
                        <CustomerListCard
                            customers={data?.customerDetails || []}
                            maxValues={data?.customerMaxValues || { quotes: 1, invoices: 1, payments: 1 }}
                            loading={loading}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    )
}