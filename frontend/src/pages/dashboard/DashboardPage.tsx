import { useState, useEffect } from "react";
import { Row, Col, Card } from "antd";
import { getDashboardSummary, type DashboardSummary } from "@/api/dashboard";
import SummaryCard from "./components/SummaryCard";
import QuotePreviewCard from "./components/QuotePreviewCard";
import InvoicePreviewCard from "./components/InvoicePreviewCard";
import PaymentPreviewCard from "./components/PaymentPreviewCard";
import CustomerPreviewCard from "./components/CustomerPreviewCard";
import CustomerListCard from "./components/CustomerListCard";
import SectionHeader from "./components/SectionHeader";
import { formatAmount } from "@/utils/numberFormat";
import { handleError } from "@/utils/handleError";

const colFirst = { paddingRight: 32, borderRight: "1px solid #f0f0f0", display: "flex", flexDirection: "column" } as const;
const colMiddle = { paddingLeft: 32, paddingRight: 32, borderRight: "1px solid #f0f0f0", display: "flex", flexDirection: "column" } as const;
const colLast = { paddingLeft: 32, display: "flex", flexDirection: "column" } as const;

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<DashboardSummary | null>(null);

    useEffect(() => {
        getDashboardSummary()
            .then((res) => setData(res))
            .catch((e) => handleError(e, "Failed to load dashboard"))
            .finally(() => setLoading(false));
    }, []);

    const summaryItems = [
        { title: "Quotes",      subtitle: "This Month",  value: data?.quotes?.monthSum,        color: "#3b82f6" },
        { title: "Invoices",    subtitle: "This Month",  value: data?.invoices?.monthSum,       color: "#8b5cf6" },
        { title: "Payments",    subtitle: "This Month",  value: data?.payments?.monthSum,       color: "#10b981" },
        { title: "Due Balance", subtitle: "Outstanding", value: data?.payments?.dueBalance ?? 0, color: "#ef4444" },
    ];

    return (
        <div style={{ padding: "24px 32px" }}>

            {/* Top Section */}
            <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
                {summaryItems.map((item) => (
                    <Col span={6} key={item.title}>
                        <SummaryCard
                            title={item.title}
                            subtitle={item.subtitle}
                            value={`$ ${formatAmount(item.value)}`}
                            loading={loading}
                            color={item.color}
                        />
                    </Col>
                ))}
            </Row>

            {/* Overview Section */}
            <Row gutter={[24, 24]} style={{ marginBottom: 32, alignItems: "stretch" }}>
                <Col span={18} style={{ display: "flex" }}>
                    <Card style={{ width: "100%" }} styles={{ body: { padding: "28px 32px" } }}>
                        <Row style={{ alignItems: "stretch" }}>
                            <Col span={8} style={colFirst}>
                                <SectionHeader title="Quote Overview" color="#3b82f6" separator />
                                <QuotePreviewCard preview={data?.quotes?.preview ?? []} loading={loading} />
                            </Col>

                            <Col span={8} style={colMiddle}>
                                <SectionHeader title="Invoice Overview" color="#8b5cf6" separator />
                                <div style={{ flex: 1, paddingBottom: 30 }}>
                                    <InvoicePreviewCard preview={data?.invoices?.preview ?? []} loading={loading} />
                                </div>
                            </Col>

                            <Col span={8} style={colLast}>
                                <SectionHeader title="Payment Overview" color="#10b981" separator />
                                <div style={{ flex: 1, paddingBottom: 55 }}>
                                    <PaymentPreviewCard preview={data?.payments?.preview ?? []} loading={loading} />
                                </div>
                            </Col>
                        </Row>
                    </Card>
                </Col>

                <Col span={6} style={{ display: "flex" }}>
                    <CustomerPreviewCard
                        active={data?.customers?.active ?? 0}
                        total={data?.customers?.total ?? 0}
                        newlyAdded={data?.customers?.newCount ?? 0}
                        loading={loading}
                    />
                </Col>
            </Row>

            {/* Customer List Section */}
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
    );
}
