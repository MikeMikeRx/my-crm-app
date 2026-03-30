import { useEffect, useState } from "react";
import { Table, Tag, Space, Button, Select, DatePicker } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { listPayments } from "@/api/payments";
import type { PaymentListParams } from "@/api/payments";
import { listCustomers } from "@/api/customers";
import type { Payment } from "@/types/entities";
import PaymentFormModal from "./PaymentFormModal";
import { formatAmount } from "@/utils/numberFormat";
import { formatFormDate } from "@/utils/dateFormat";
import { handleError } from "@/utils/handleError";
import PageHeader from "@/components/PageHeader";
import { useCrudModal } from "@/hooks/useCrudModal";

const METHOD_LABELS: Record<string, string> = {
    bank_transfer: "Bank Transfer",
    card: "Card",
    cash: "Cash",
    paypal:"PayPal",
}

type Filters = Pick<PaymentListParams, "status" | "from" | "to" | "customer">;

export default function PaymentsPage() {
    const modal = useCrudModal<Payment>();
    const [data, setData] = useState<Payment[]>([]);
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

            <div style={{ marginBottom: 16 }}>
                <Space wrap>
                    <Select
                        allowClear
                        placeholder="Status"
                        style={{ width: 150 }}
                        value={draft.status}
                        onChange={(v) => setDraft(d => ({ ...d, status: v }))}
                        onClear={() => setDraft(d => ({ ...d, status: undefined }))}
                        options={[
                            { value: "pending", label: "Pending" },
                            { value: "completed", label: "Completed" },
                            { value: "failed", label: "Failed" },
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

            <PaymentFormModal
                open={modal.open}
                onClose={modal.close}
                onSuccess={() => load(page, applied)}
                editing={modal.editing}
            />
        </div>
    );
}
