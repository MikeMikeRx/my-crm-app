import { useEffect, useState } from "react";
import { Table, Button, Space, Popconfirm, Tag, Select, DatePicker, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { listQuotes } from "@/api/quotes";
import type { QuoteListParams } from "@/api/quotes";
import { listCustomers } from "@/api/customers";
import type { Quote, LineItem, QuoteStatus } from "@/types/entities";
import QuoteFormModal from "./QuoteFormModal";
import { deleteQuote } from "@/api/quotes";
import { formatAmount } from "@/utils/numberFormat";
import { formatFormDate } from "@/utils/dateFormat";
import { handleError } from "@/utils/handleError";
import PageHeader from "@/components/PageHeader";
import { useCrudModal } from "@/hooks/useCrudModal";

type Filters = Pick<QuoteListParams, "status" | "from" | "to" | "customer">;

export default function QuotesPage() {
    const modal = useCrudModal<Quote>();
    const [data, setData] = useState<Quote[]>([]);
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
            const res = await listQuotes({ page: p, limit: PAGE_SIZE, ...f });
            setData(res.data);
            setTotal(res.pagination.total);
        } catch (e) {
            handleError(e, "Failed to load quotes");
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

    const handleDelete = async (id: string) => {
        await deleteQuote(id);
        message.success("Quote deleted");
        load(page, applied);
    };

    const calcTotal = (items: LineItem[] = [], globalTaxRate?: number) => {
        return items.reduce((sum, i) => {
            const qty = Number(i.quantity) || 0;
            const price = Number(i.unitPrice) || 0;
            const line = qty * price;
            const taxPct = (i.taxRate ?? globalTaxRate ?? 0) /100;
            return sum + line * (1 + taxPct);
        }, 0);
    };

    const columns: ColumnsType<Quote> = [
        { title: "Quote #", dataIndex: "quoteNumber" },
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
            title: "Expiry Date",
            dataIndex: "expiryDate",
            render: (v) => formatFormDate(v) || "-",
        },
        {
            title: "Total",
            render: (_, record) => {
                const total = record.total ?? calcTotal(record.items);
                return `$${formatAmount(total)}`;
            },

        },
        {
            title: "Status",
            dataIndex: "status",
            render: (s: QuoteStatus) => {
                const colors: Record<QuoteStatus, string> = {
                    draft:"blue",
                    sent: "orange",
                    accepted: "green",
                    declined: "red",
                    expired: "black",
                    converted: "purple",
                };

                return<Tag color={colors[s]}>{s}</Tag>
            },
        },
        {
            title: "Actions",
            render: (_, record) => (
                <Space>
                    <Button type="link" onClick={(e) => { e.stopPropagation(); modal.startEdit(record); }}>Edit</Button>
                    <Popconfirm title="Delete this quote?" onConfirm={() => handleDelete(record._id)}>
                        <Button type="link" danger onClick={(e) => e.stopPropagation()}>Delete</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <PageHeader
                title="Quotes"
                addLabel="+ New Quote"
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
                            { value: "draft", label: "Draft" },
                            { value: "sent", label: "Sent" },
                            { value: "accepted", label: "Accepted" },
                            { value: "declined", label: "Declined" },
                            { value: "expired", label: "Expired" },
                            { value: "converted", label: "Converted" },
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
                rowKey="_id"
                columns={columns}
                dataSource={data}
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

            <QuoteFormModal
                open={modal.open}
                editing={modal.editing}
                onClose={modal.close}
                onSuccess={() => load(page, applied)}
            />
        </div>
    );
}
