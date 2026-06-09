import { Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Payment } from "@/types/entities";
import PaymentFormModal from "./PaymentFormModal";
import { formatAmount } from "@/utils/numberFormat";
import { formatFormDate } from "@/utils/dateFormat";
import PageHeader from "@/components/PageHeader";
import FilterBar from "@/components/FilterBar";
import { usePayments } from "./usePayments";

const METHOD_LABELS: Record<string, string> = {
    bank_transfer: "Bank Transfer",
    card: "Card",
    cash: "Cash",
    paypal: "PayPal",
};

const PAYMENT_STATUS_OPTIONS = [
    { value: "pending", label: "Pending" },
    { value: "completed", label: "Completed" },
    { value: "failed", label: "Failed" },
];

export default function PaymentsPage() {
    const {
        modal,
        data,
        loading,
        page,
        total,
        PAGE_SIZE,
        draft,
        setDraft,
        customerOptions,
        handleApply,
        handleClear,
        handlePageChange,
        reload,
    } = usePayments();

    const columns: ColumnsType<Payment> = [
        {
            title: "Payments #",
            dataIndex: "paymentId",
        },
        {
            title: "Invoice #",
            dataIndex: "invoice",
            render: (v) =>
                typeof v === "object" && v !== null
                    ? v.invoiceNumber
                    : String(v),
        },
        {
            title: "Customer",
            render: (_, record) => {
                const invoice = record.invoice;
                if (!invoice || typeof invoice === "string") return "-";
                const customer = invoice.customer;
                if (!customer || typeof customer === "string") return "-";
                return customer.company ?? customer.name ?? "-";
            },
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
                onAdd={modal.startCreate}
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
                    onChange: handlePageChange,
                }}
                onRow={(record) => ({
                    onClick: () => modal.startEdit(record),
                    style: { cursor: "pointer" },
                })}
            />

            <PaymentFormModal
                open={modal.open}
                onClose={modal.close}
                onSuccess={reload}
                editing={modal.editing}
            />
        </div>
    );
}
