import { useEffect, useState } from "react";
import { Table, Button, Space, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { listInvoices } from "@/api/invoices";
import { listCustomers } from "@/api/customers";
import type { Invoice, InvoiceStatus, LineItem } from "@/types/entities";
import InvoiceFormModal from "./InvoiceFormModal"
import { formatAmount } from "@/utils/numberFormat";
import { formatFormDate } from "@/utils/dateFormat";
import { handleError } from "@/utils/handleError";
import PageHeader from "@/components/PageHeader";
import FilterBar from "@/components/FilterBar";
import type { FilterValues } from "@/components/FilterBar";
import { useCrudModal } from "@/hooks/useCrudModal";

const INVOICE_STATUS_OPTIONS = [
    { value: "draft", label: "Draft" },
    { value: "sent", label: "Sent" },
    { value: "partially_paid", label: "Partially Paid" },
    { value: "paid", label: "Paid" },
];

export default function InvoicesPage() {
    const modal = useCrudModal<Invoice>()
    const [data, setData] = useState<Invoice[]>([]);
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
            const res = await listInvoices({ page: p, limit: PAGE_SIZE, ...f });
            setData(res.data);
            setTotal(res.pagination.total);
        } catch (e) {
            handleError(e, "Failed to load invoices");
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

    const calcTotals = (items: LineItem[] = []) => {
        const subtotal = items.reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0);
        const taxTotal = items.reduce((sum, i) => {
            const rate = Number(i.taxRate) || 0;
            return sum + ((Number(i.quantity) || 0) * (Number(i.unitPrice) || 0) * rate) /100;
        }, 0);
        return { subtotal, taxTotal, total: subtotal + taxTotal };
    };

    const columns: ColumnsType<Invoice> = [
        { title: "Invoice #", dataIndex: "invoiceNumber" },
        {   title: "Customer",
            dataIndex: "customer",
            render: (customer) => {
                if (!customer) return "-";
                return customer.company || customer.name || "-";
            }
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
                onAdd={ modal.startCreate }
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
                    onChange: (p) => { setPage(p); load(p, applied); },
                }}
                onRow={(record) => ({
                    onClick: () => modal.startEdit(record),
                    style: { cursor: "pointer" },
                })}
            />

            <InvoiceFormModal
                open={modal.open}
                onClose={modal.close}
                onSuccess={() => load(page, applied)}
                editing={modal.editing}
            />
        </div>
    );
}
