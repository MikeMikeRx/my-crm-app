import { useEffect, useState } from "react";
import { Table, Button, Space, Tag, Select, DatePicker } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { listInvoices } from "@/api/invoices";
import type { InvoiceListParams } from "@/api/invoices";
import { listCustomers } from "@/api/customers";
import type { Invoice, InvoiceStatus, LineItem } from "@/types/entities";
import InvoiceFormModal from "./InvoiceFormModal"
import { formatAmount } from "@/utils/numberFormat";
import { formatFormDate } from "@/utils/dateFormat";
import { handleError } from "@/utils/handleError";
import PageHeader from "@/components/PageHeader";
import { useCrudModal } from "@/hooks/useCrudModal";

type Filters = Pick<InvoiceListParams, "status" | "from" | "to" | "customer">;

export default function InvoicesPage() {
    const modal = useCrudModal<Invoice>()
    const [data, setData] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const PAGE_SIZE = 20;

    const [applied, setApplied] = useState<Filters>({});
    const [draft, setDraft] = useState<Filters>({});
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

            <div style={{ marginBottom: 16 }}>
                <Space wrap>
                    <Select
                        allowClear
                        placeholder="Status"
                        style={{ width: 160 }}
                        value={draft.status}
                        onChange={(v) => setDraft(d => ({ ...d, status: v }))}
                        onClear={() => setDraft(d => ({ ...d, status: undefined }))}
                        options={[
                            { value: "draft", label: "Draft" },
                            { value: "sent", label: "Sent" },
                            { value: "partially_paid", label: "Partially Paid" },
                            { value: "paid", label: "Paid" },
                        ]}
                    />
                    <Select
                        allowClear
                        showSearch
                        placeholder="Customer"
                        style={{ width: 200 }}
                        value={draft.customer}
                        onChange={(v) => setDraft(d => ({ ...d, customer: v }))}
                        onClear={() => setDraft(d => ({ ...d, customer: undefined }))}
                        options={customerOptions}
                        filterOption={(input, opt) =>
                            (opt?.label as string ?? "").toLowerCase().includes(input.toLowerCase())
                        }
                    />
                    <DatePicker
                        placeholder="From"
                        value={draft.from ? dayjs(draft.from) : null}
                        onChange={(_, s) => setDraft(d => ({ ...d, from: (s as string) || undefined }))}
                    />
                    <DatePicker
                        placeholder="To"
                        value={draft.to ? dayjs(draft.to) : null}
                        onChange={(_, s) => setDraft(d => ({ ...d, to: (s as string) || undefined }))}
                    />
                    <Button type="primary" onClick={handleApply}>Apply</Button>
                    <Button onClick={handleClear}>Clear</Button>
                </Space>
            </div>

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
