import { useEffect, useState } from "react";
import { Table, Button, Space, Popconfirm, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { listCustomers, deleteCustomer } from "@/api/customers";
import type { Customer} from "@/types/entities";
import CustomerFormModal from "./CustomerFormModal";
import { handleError } from "@/utils/handleError";
import PageHeader from "@/components/PageHeader";

export default function CustomersPage() {
    const [data, setData] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState<Customer | null>(null);
    const [open, setOpen] = useState(false);

    const startCreateCustomer = () => {
        setEditing(null);
        setOpen(true);
    }

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
            <PageHeader
                title="Customers"
                addLabel="+ New Customer"
                onAdd={() => { startCreateCustomer }}
            />

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