import { useEffect, useState } from "react";
import { Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { listPayments } from "@/api/payments";
import { listCustomers } from "@/api/customers";
import type { Payment } from "@/types/entities";
import PaymentFormModal from "./PaymentFormModal";
import { formatAmount } from "@/utils/numberFormat";
import { formatFormDate } from "@/utils/dateFormat";
import { handleError } from "@/utils/handleError";
import PageHeader from "@/components/PageHeader";
import FilterBar from "@/components/FilterBar";
import type { FilterValues } from "@/components/FilterBar";
import { useCrudModal } from "@/hooks/useCrudModal";

const METHOD_LABELS: Record<string, string> = {
    bank_transfer: "Bank Transfer",
    card: "Card",
    cash: "Cash",
    paypal:"PayPal",
}

const PAYMENT_STATUS_OPTIONS = [
    { value: "pending", label: "Pending" },
    { value: "completed", label: "Completed" },
    { value: "failed", label: "Failed" },
];

export default function PaymentsPage() {
    const modal = useCrudModal<Payment>();
    const [data, setData] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const PAGE_SIZE = 20;

    const [applied, setApplied] = useState<FilterValues>({});
    const [draft, setDraft] = useState<FilterValues>({});
    const [customerOptions, setCustomerOptions] = useState<{ value: string; label: string }[]>([]);

    const load = async (p = page, f = applied) => {
        setLoading(true);
        try {
            const res = await listPayments({ page: p, limit: PAGE_SIZE, ...f });
            setData(res.data);
            setTotal(res.pagination.total);
        } catch (e) {
            handleError(e, "Failed to load payments");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load(1, {});
        listCustomers({ limit: 500 }).then(res =>
            setCustomerOptions(res.data.map(c => ({ value: c._id, label: c.company || c.name })))
        );
    }, []);

    const handleApply = () => {
        setApplied(draft);
        setPage(1);
        load(1, draft);
    };

    const handleClear = () => {
        setDraft({});
        setApplied({});
        setPage(1);
        load(1, {});
    };

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
            render: (v) => formatFormDate(v) || "-",
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
                title="Payments"
                addLabel="+ New Payment"
                onAdd={ modal.startCreate }
            />

            <FilterBar
                value={draft}
                onChange={setDraft}
                onApply={handleApply}
                onClear={handleClear}
                statusOptions={PAYMENT_STATUS_OPTIONS}
                customerOptions={customerOptions}
            />

            <Table
                columns={columns}
                dataSource={data}
                rowKey="_id"
                loading={loading}
                pagination={{
                    current: page,
                    pageSize: PAGE_SIZE,
                    total,
                    showSizeChanger: false,
                    onChange: (p) => { setPage(p); load(p, applied); },
                }}
                onRow={(record) => ({
                    onClick: () => modal.startEdit(record),
                    style: { cursor: "pointer" },
                })}
            />

            <PaymentFormModal
                open={modal.open}
                onClose={modal.close}
                onSuccess={() => load(page, applied)}
                editing={modal.editing}
            />
        </div>
    );
}
