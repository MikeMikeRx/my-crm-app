import { Table, Button, Space, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Invoice, InvoiceStatus, LineItem } from "@/shared/types/entities";
import InvoiceFormModal from "./InvoiceFormModal";
import { formatAmount } from "@/shared/utils/numberFormat";
import { formatFormDate } from "@/shared/utils/dateFormat";
import PageHeader from "@/shared/components/PageHeader";
import FilterBar from "@/shared/components/FilterBar";
import { useInvoices } from "./useInvoices";

const INVOICE_STATUS_OPTIONS = [
    { value: "draft", label: "Draft" },
    { value: "sent", label: "Sent" },
    { value: "partially_paid", label: "Partially Paid" },
    { value: "paid", label: "Paid" },
];

const calcTotals = (items: LineItem[] = []) => {
    const subtotal = items.reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0);
    const taxTotal = items.reduce((sum, i) => {
        const rate = Number(i.taxRate) || 0;
        return sum + ((Number(i.quantity) || 0) * (Number(i.unitPrice) || 0) * rate) / 100;
    }, 0);
    return { subtotal, taxTotal, total: subtotal + taxTotal };
};

export default function InvoicesPage() {
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
    } = useInvoices();

    const columns: ColumnsType<Invoice> = [
        { title: "Invoice #", dataIndex: "invoiceNumber" },
        {
            title: "Customer",
            dataIndex: "customer",
            render: (customer) => {
                if (!customer) return "-";
                return customer.company || customer.name || "-";
            },
        },
        {
            title: "Issue Date",
            dataIndex: "issueDate",
            render: (v) => formatFormDate(v) || "-",
        },
        {
            title: "Due Date",
            dataIndex: "dueDate",
            render: (v) => formatFormDate(v) || "-",
        },
        {
            title: "Subtotal",
            render: (_, r) => `$${formatAmount(calcTotals(r.items).subtotal)}`,
        },
        {
            title: "Tax",
            render: (_, r) => `$${formatAmount(calcTotals(r.items).taxTotal)}`,
        },
        {
            title: "Total",
            render: (_, r) => `$${formatAmount(calcTotals(r.items).total)}`,
        },
        {
            title: "Status",
            dataIndex: "status",
            render: (s: InvoiceStatus) => {
                const colors: Record<InvoiceStatus, string> = {
                    draft: "default",
                    sent: "orange",
                    partially_paid: "blue",
                    paid: "green",
                    overdue: "red",
                };
                const labels: Record<InvoiceStatus, string> = {
                    draft: "Draft",
                    sent: "Sent",
                    partially_paid: "Partially Paid",
                    paid: "Paid",
                    overdue: "Overdue",
                };
                return <Tag color={colors[s]}>{labels[s]}</Tag>;
            },
        },
        {
            title: "Actions",
            render: (_, record) => (
                <Space>
                    <Button type="link" onClick={(e) => { e.stopPropagation(); modal.startEdit(record); }}>
                        Edit
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <PageHeader
                title="Invoices"
                addLabel="+ New Invoice"
                onAdd={modal.startCreate}
            />

            <FilterBar
                value={draft}
                onChange={setDraft}
                onApply={handleApply}
                onClear={handleClear}
                statusOptions={INVOICE_STATUS_OPTIONS}
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

            <InvoiceFormModal
                open={modal.open}
                onClose={modal.close}
                onSuccess={reload}
                editing={modal.editing}
            />
        </div>
    );
}
