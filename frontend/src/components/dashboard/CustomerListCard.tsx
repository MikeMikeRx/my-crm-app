import { Progress, Tag } from "antd";
import { formatAmount } from "@/utils/numberFormat";

interface CustomerDetail {
    _id: string;
    name: string;
    email?: string;
    company?: string;
    isActive: boolean;
    quotes: number;
    invoices: number;
    payments: number;
    outstanding: number;
}

interface Props {
    customers: CustomerDetail[];
    maxValues: {
        quotes: number;
        invoices: number;
        payments: number;
    };
    loading: boolean;
}

export default function CustomerListCard({ customers = [], maxValues, loading }: Props) {
    if (loading) return <p>Loading...</p>;

    return (
        <div>
            {/* Table Header */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1.2fr 1fr 0.8fr 1fr 1fr 1fr 1fr",
                    gap: "16px",
                    padding: "12px 24px",
                    backgroundColor: "#f5f5f5",
                    borderRadius: "4px",
                    marginBottom: "8px",
                    fontWeight: 600,
                    fontSize: "12px",
                    color: "#262626",
                }}
            >
                <div>Customer</div>
                <div>Company</div>
                <div>Activity</div>
                <div>Quotes</div>
                <div>Invoices</div>
                <div>Payments</div>
                <div style={{ margin: "0 30px" }}>Outstanding</div>
            </div>

            {/* Table Rows */}
            <div style={{ minHeight: "400px" }}>
                {customers.map((customer) => {
                    const quotePercentage = maxValues.quotes > 0
                        ? Math.round((customer.quotes / maxValues.quotes) * 100)
                        : 0;
                    const invoicePercentage = maxValues.invoices > 0
                        ? Math.round((customer.invoices / maxValues.invoices) * 100)
                        : 0;
                    const paymentPercentage = maxValues.payments > 0
                        ? Math.round((customer.payments / maxValues.payments) * 100)
                        : 0;

                    return (
                        <div
                            key={customer._id}
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1.2fr 1fr 0.8fr 1fr 1fr 1fr 1fr",
                                gap: "16px",
                                padding: "16px 24px",
                                borderBottom: "1px solid #f0f0f0",
                                transition: "background-color 0.2s",
                            }}
                            className="hover:bg-gray-50"
                        >
                            {/* Customer Name */}
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-sm">
                                    {customer.name}
                                </span>
                            </div>

                            {/* Company */}
                            <div className="flex items-center">
                                <span className="text-sm text-gray-600">
                                    {customer.company || "-"}
                                </span>
                            </div>

                            {/* Activity */}
                            <div className="flex items-center">
                                <Tag
                                    color={customer.isActive ? "green" : "default"}
                                    style={{ fontSize: 10, padding: "2px 8px", margin: 0 }}
                                >
                                    {customer.isActive ? "Active" : "Inactive"}
                                </Tag>
                            </div>

                            {/* Quotes */}
                            <div>
                                <div className="text-sm font-medium mb-1">{quotePercentage}%</div>
                                <Progress
                                    percent={quotePercentage}
                                    showInfo={false}
                                    size="small"
                                    strokeColor="#3b82f6"
                                    strokeWidth={10}
                                />
                            </div>

                            {/* Invoices */}
                            <div>
                                <div className="text-sm font-medium mb-1">{invoicePercentage}%</div>
                                <Progress
                                    percent={invoicePercentage}
                                    showInfo={false}
                                    size="small"
                                    strokeColor="#8b5cf6"
                                    strokeWidth={10}
                                />
                            </div>

                            {/* Payments */}
                            <div>
                                <div className="text-sm font-medium mb-1">{paymentPercentage}%</div>
                                <Progress
                                    percent={paymentPercentage}
                                    showInfo={false}
                                    size="small"
                                    strokeColor="#10b981"
                                    strokeWidth={10}
                                />
                            </div>

                            {/* Outstanding */}
                            <div className="flex items-center">
                                <span
                                    className="text-sm font-medium"
                                    style={{ 
                                        color: customer.outstanding > 0 ? "#ef4444" : "#6b7280",
                                        margin: "0 35px"
                                    }}
                                >
                                    ${formatAmount(customer.outstanding)}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
