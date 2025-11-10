import { useEffect,useState } from "react";
import dayjs from "dayjs";
import { Table, Button, Space, message, Select } from "antd";
import type { ColumnsType } from "antd/es/table";
import { listInvoices, updateInvoice } from "@/api/invoices";
import type { Invoice, LineItem } from "@/types/entities";
import InvoiceFormModal from "./InvoiceFormModal"


export default function InvoicesPage() {
    const [data, setData] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Invoice | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            const rows = await listInvoices();
            setData(rows);
        } catch {
            message.error("Failed to load invoices");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

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
        { title: "Customer", dataIndex: "customer" },
        { 
            title: "Issue Date",
            dataIndex: "issueDate",
            render: (v) => (v ? dayjs(v).format("YYYY-MM-DD") : "-"),
        },
        { 
            title: "Due Date",
            dataIndex: "dueDate",
            render: (v) => (v ? dayjs(v).format("YYYY-MM-DD") : "-"),
        },
        {
            title: "Subtotal",
            render: (_, r) => `$${calcTotals(r.items).subtotal.toFixed(2)}`,
        },
        {
            title: "Tax",
            render: (_, r) => `$${calcTotals(r.items).taxTotal.toFixed(2)}`,
        },
        {
            title: "Total",
            render: (_, r) => `$${calcTotals(r.items).total.toFixed(2)}`,
        },
        {
            title: "Status",
            dataIndex: "status",
            render: (v, record) => (
                <Select
                    size="small"
                    style={{ width: 120 }}
                    value={v}
                    onChange={async (newStatus) => {
                        setLoading(true);
                        try {
                            await updateInvoice(record._id, { status: newStatus });
                            message.success(`Invoice marked ${newStatus}`);
                            load();
                        } catch {
                            message.error("Failed to update status");
                        } finally { setLoading(false) };
                    }}
                    options={[
                        { label: "Unpaid", value: "unpaid" },
                        { label: "Paid", value: "paid" },
                    ]}
                />
            ),
        },
        {
            title: "Actions",
            render: (_, record) => (
                <Space>
                    <Button type="link" onClick={() => { setEditing(record); setOpen(true); }}>
                        Edit
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-semibold">Invoices</h1>
                <Button type="primary" onClick={() => { setEditing(null); setOpen(true); }}>
                    + New Invoice
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={data}
                rowKey="_id"
                loading={loading}
                pagination={{ pageSize: 10 }}
            />

            <InvoiceFormModal
                open={open}
                onClose={() => setOpen(false)}
                onSuccess={load}
                editing={editing}
            />
        </div>
    );
}