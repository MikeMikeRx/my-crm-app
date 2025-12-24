import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Table, Button, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { listPayments } from "@/api/payments";
import type { Payment } from "@/types/entities";
import PaymentFormModal from "./PaymentFormModal";
import { formatAmount } from "@/utils/numberFormat";
import { handleError } from "@/utils/handleError";

const METHOD_LABELS: Record<string, string> = {
    bank_transfer: "Bank Transfer",
    card: "Card",
    cash: "Cash",
    paypal:"PayPal",
}

export default function PaymentsPage() {
    const [data, setData] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    // --------------- Load payment list ---------------
    const load = async () => {
        setLoading(true);
        try {
            const rows = await listPayments();
            setData(rows);
        } catch (e) {
            handleError(e, "Failed to load payments");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    // -----------------Table Columns -----------------
    const columns: ColumnsType<Payment> = [
        {
            title: "Payments #",
            dataIndex: "paymentId"
        },        
        {   title: "Invoice #",
            dataIndex: "invoice",
            render: (v) =>
                typeof v === "object" && v !== null
                    ? v.invoiceNumber
                    : String(v),
        },
        {   title: "Customer",
            render: (_, record) => {
                const invoice = record.invoice;

                if (!invoice || typeof invoice === "string") return "-";

                const customer = invoice.customer;
                if(!customer || typeof customer === "string") return "-";

                return customer.company ?? customer.name ?? "-";
            }
        },
        { 
            title: "Amount",
            dataIndex: "amount",
            render: (v) => `$${formatAmount(v)}`,
        },
        {
            title: "Method",
            dataIndex: "paymentMethod",
            render: (v) => METHOD_LABELS[v] ?? v,
        },
        {
            title: "Date",
            dataIndex: "paymentDate",
            render: (v) => (v ? dayjs(v).format("YYYY-MM-DD") : "-"),
        },
        {
            title: "Status",
            dataIndex: "status",
            render: (v) => (
                <Tag color={v === "completed" ? "green" : "blue"}>{v}</Tag>
            ),
        },
    ];

    // ------------------------- JSX ----------------------------------
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h1
                    style={{
                        fontSize: "25px",
                        fontWeight: 700,
                        padding: "8px 16px",
                        color: "#1f2937",
                    }}
                >
                    Payments
                </h1>

                <Button
                    type="primary"
                    onClick={() => setOpen(true)}
                    style={{
                        margin:"15px",
                    }}
                >
                    + New payment
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={data}
                rowKey="_id"
                loading={loading}
                pagination={{ pageSize: 10 }}
            />

            <PaymentFormModal
                open={open}
                onClose={() => setOpen(false)}
                onSuccess={load}
            />
        </div>
    );
}