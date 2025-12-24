import { useEffect, useState } from "react";
import { Table, Button, Space, Popconfirm, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { listCustomers, deleteCustomer } from "@/api/customers";
import type { Customer} from "@/types/entities";
import CustomerFormModal from "./CustomerFormModal";
import { handleError } from "@/utils/handleError";

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
            handleError(e, "Failed to load customers");
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
                <h1
                    style={{
                        fontSize: "25px",
                        fontWeight: 700,
                        padding: "8px 16px",
                        color: "#1f2937",
                    }}
                >
                    Customers
                </h1>
                <Button
                    type="primary"
                    onClick={() => { 
                        setEditing(null); setOpen(true);
                    }}
                    style={{
                        margin:"15px",
                    }}
                >
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