import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Table, Button, message, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { listPayments } from "@/api/payments";
import type { Payment } from "@/types/entities";
import PaymentFormModal from "./PaymentFormModal"

export default function PaymentsPage() {
    const [data, setData] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    // --------------- Load payment list ---------------
    const load = async () => {
        setLoading(true);
        try {
            const rows = await listPayments();
            setData(rows);
        } catch {
            message.error("Failed to load payments");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    // -----------------Table Columns -----------------
    const columns: ColumnsType<Payment> = [
        { title: "Invoice", dataIndex: "invoice" },
        { 
            title: "Amount",
            dataIndex: "amount",
            render: (v) => `$${Number(v).toFixed(2)}`,
        },
        {
            title: "Method",
            dataIndex: "paymentMethod",
            render: (v) => v.replace("-", " "),
        },
        {
            title: "Date",
            dataIndex: "paymentDate",
            render: (v) => (v ? dayjs(v).format("YYYY-MM-DD") : "-"),
        },
        {
            title: "Status",
            dataIndex: "status",
            render: (v) => (
                <Tag color={v === "completed" ? "green" : "blue"}>{v}</Tag>
            ),
        },
    ];

    // ------------------------- JSX ----------------------------------
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-semibold">Payments</h1>
                <Button type="primary" onClick={() => setOpen(true)}>
                    + New payment
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={data}
                rowKey="_id"
                loading={loading}
                pagination={{ pageSize: 10 }}
            />

            <PaymentFormModal
                open={open}
                onClose={() => setOpen(false)}
                onSuccess={load}
            />
        </div>
    );
}