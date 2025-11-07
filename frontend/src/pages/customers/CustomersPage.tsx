import { useEffect, useState } from "react";
import { Table, Button, Space, Popconfirm, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { listCustomers, deleteCustomer } from "@/api/customers";
import type { Customer} from "@/types/entities";
import CustomerFormModal from "./CustomerFormModal";

export default function CustomersPage() {
    const [data, setData] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState<Customer | null>(null);
    const [open, setOpen] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const rows = await listCustomers();
            setData(rows);
        } catch (e) {
            message.error("Failed to load customers");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleDelete = async (id: string) => {
        await deleteCustomer(id);
        message.success("Customer deleted");
        load()
    };

    const columns: ColumnsType<Customer> = [
        { title: "Name", dataIndex: "name" },
        { title: "Email", dataIndex: "email" },
        { title: "Phone", dataIndex: "phone" },
        { title: "Company", dataIndex: "company" },
        { title: "Address", dataIndex: "address" },
        {
            title: "Actions",
            render: (_, record) => (
                <Space>
                    <Button
                        type="link"
                        onClick={() => { setEditing(record); setOpen(true); }}>
                            Edit
                    </Button>
                    <Popconfirm
                        title="Delete this customer?"
                        onConfirm={() => handleDelete(record._id)}
                        >
                            <Button type="link" danger>Delete</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-semibold">Customers</h1>
                <Button type="primary" onClick={() => { setEditing(null); setOpen(true); }}>
                    + New Customer
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={data}
                rowKey="_id"
                loading={loading}
                pagination={{ pageSize: 10 }}
            />

            <CustomerFormModal
                open={open}
                onClose={() => setOpen(false)}
                onSuccess={load}
                editing={editing}
            />
        </div>
    )
}