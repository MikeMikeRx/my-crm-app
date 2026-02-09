import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { listPayments } from "@/api/payments";
import type { Payment } from "@/types/entities";
import PaymentFormModal from "./PaymentFormModal";
import { formatAmount } from "@/utils/numberFormat";
import { handleError } from "@/utils/handleError";
import PageHeader from "@/components/PageHeader";

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

    const startCreatePayment = () => {
        setOpen(true);
    }

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

    return (
        <div>
            <PageHeader
                title="Payment"
                addLabel="+ New Payment"
                onAdd={startCreatePayment}
            />

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