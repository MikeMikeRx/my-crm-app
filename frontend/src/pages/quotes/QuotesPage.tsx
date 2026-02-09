import { useEffect, useState } from "react";
import dayjs from "dayjs"
import { Table, Button, Space, Popconfirm, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { listQuotes, deleteQuote } from "@/api/quotes";
import type { Quote, LineItem, QuoteStatus } from "@/types/entities";
import QuoteFormModal from "./QuoteFormModal";
import { formatAmount } from "@/utils/numberFormat";
import { handleError } from "@/utils/handleError";
import PageHeader from "@/components/PageHeader";
import { useCrudModal } from "@/hooks/useCrudModal";

export default function QuotesPage() {
    const modal = useCrudModal<Quote>();
    const [data, setData] = useState<Quote[]>([]);
    const [loading, setLoading] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const rows = await listQuotes();
            setData(rows);
        } catch (e) {
            handleError(e, "Failed to load quotes");
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
                    <Button type="link" onClick={() => modal.startEdit(record) }>Edit</Button>
                    <Popconfirm title="Delete this quote?" onConfirm={() => handleDelete(record._id)}>
                        <Button type="link" danger>Delete</Button>
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

            <Table
                rowKey="_id"
                columns={columns}
                dataSource={data}
                loading={loading}
                pagination={{ pageSize: 10 }}
            />

            <QuoteFormModal
                open={modal.open}
                editing={modal.editing}
                onClose={modal.close}
                onSuccess={load}
            />
        </div>
    );
}

