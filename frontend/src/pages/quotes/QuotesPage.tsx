import { useEffect, useState } from "react";
import { Table, Button, Space, Popconfirm, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { listQuotes, deleteQuote } from "@/api/quotes";
import type { Quote } from "@/types/entities";
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

    const columns: ColumnsType<Quote> = [
        { title: "Quote #", dataIndex: "quoteNumber" },
        { title: "Customer", dataIndex: "customer" },
        { title: "Issue", dataIndex: "issueDate" },
        { title: "Expiry", dataIndex: "expiryDate" },
        { title: "Total", dataIndex: "total" },
        {
            title: "Status",
            dataIndex: "status",
            render: (s) => <Tag color={s === "approved" ? "green" : "blue"}>{s}</Tag>,
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

