import { useEffect, useState } from "react";
import dayjs from "dayjs"
import { Table, Button, Space, Popconfirm, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { listQuotes, deleteQuote } from "@/api/quotes";
import type { Quote, LineItem, QuoteStatus } from "@/types/entities";
import QuoteFormModal from "./QuoteFormModal";

export default function QuotesPage() {
    const [data, setData] = useState<Quote[]>([]);
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState<Quote | null>(null);
    const [open, setOpen] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const rows = await listQuotes();
            setData(rows);
        } catch {
            message.error("Failed to load quotes");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleDelete = async (id: string) => {
        await deleteQuote(id);
        message.success("Quote deleted");
        load();
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

    const fmtMoney = (v: unknown) =>
        isFinite(Number(v)) ? Number(v).toFixed(2) : "0.00";

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
            render: (v) => (v ? dayjs(v).format("YYYY-MM-DD") : "-"),
        },
        { 
            title: "Expiry Date",
            dataIndex: "expiryDate",
            render: (v) => (v ? dayjs(v).format("YYYY-MM-DD") : "-"),
        },
        { 
            title: "Total",
            render: (_, record) => {
                const total = record.total ?? calcTotal(record.items);
                return `$${fmtMoney(total)}`;
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
                    <Button type="link" onClick={() => {setEditing(record); setOpen(true); }}>Edit</Button>
                    <Popconfirm title="Delete this quote?" onConfirm={() => handleDelete(record._id)}>
                        <Button type="link" danger>Delete</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-semibold">Quotes</h1>
                <Button type="primary" onClick={() => { setEditing(null); setOpen(true); }}>+ New Quote</Button>
            </div>

            <Table
                rowKey="_id"
                columns={columns}
                dataSource={data}
                loading={loading}
                pagination={{ pageSize: 10 }}
            />

            <QuoteFormModal
                open={open}
                editing={editing}
                onClose={() => setOpen(false)}
                onSuccess={load}
            />
        </div>
    );
}

