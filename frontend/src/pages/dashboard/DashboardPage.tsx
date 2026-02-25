import { useState, useEffect } from "react";
import { Row, Col, Card } from "antd";
import { getDashboardSummary } from "@/api/dashboard";
import SummaryCard from "./components/SummaryCard";
import QuotePreviewCard from "./components/QuotePreviewCard";
import InvoicePreviewCard from "./components/InvoicePreviewCard";
import PaymentPreviewCard from "./components/PaymentPreviewCard";
import CustomerPreviewCard from "./components/CustomerPreviewCard";
import CustomerListCard from "./components/CustomerListCard";
import { formatAmount } from "@/utils/numberFormat";
import { handleError } from "@/utils/handleError";

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        getDashboardSummary()
            .then((res) => setData(res))
            .catch((e) => handleError(e, "Failed to load dashboard"))
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
                <Col span={18}>
                    <Card style={{ width: "100%" }} styles={{ body: { padding: "28px 32px" } }}>
                        <Row style={{ alignItems: "stretch" }}>
                            <Col span={8} style={{ paddingRight: 32, borderRight: "1px solid #f0f0f0", display: "flex", flexDirection: "column" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
                                    <div style={{ width: 4, height: 22, borderRadius: 2, backgroundColor: "#3b82f6", flexShrink: 0 }} />
                                    <span style={{ fontSize: 15, fontWeight: 700, color: "#111827", letterSpacing: "-0.01em" }}>Quote Overview</span>
                                </div>
                                <QuotePreviewCard
                                    preview={data?.quotes?.preview}
                                    loading={loading}
                                />
                            </Col>

                            <Col span={8} style={{ paddingLeft: 32, paddingRight: 32, borderRight: "1px solid #f0f0f0", display: "flex", flexDirection: "column" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
                                    <div style={{ width: 4, height: 22, borderRadius: 2, backgroundColor: "#8b5cf6", flexShrink: 0 }} />
                                    <span style={{ fontSize: 15, fontWeight: 700, color: "#111827", letterSpacing: "-0.01em" }}>Invoice Overview</span>
                                </div>
                                <div style={{ flex: 1, paddingTop: 15, paddingBottom: 30 }}>
                                    <InvoicePreviewCard
                                        preview={data?.invoices?.preview}
                                        loading={loading}
                                    />
                                </div>
                            </Col>

                            <Col span={8} style={{ paddingLeft: 32, display: "flex", flexDirection: "column" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
                                    <div style={{ width: 4, height: 22, borderRadius: 2, backgroundColor: "#10b981", flexShrink: 0 }} />
                                    <span style={{ fontSize: 15, fontWeight: 700, color: "#111827", letterSpacing: "-0.01em" }}>Payment Overview</span>
                                </div>
                                <div style={{ flex: 1, paddingTop: 12, paddingBottom: 60 }}>
                                    <PaymentPreviewCard
                                        preview={data?.payments?.preview}
                                        loading={loading}
                                    />
                                </div>
                            </Col>
                        </Row>
                    </Card>
                </Col>

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