import { useEffect, useState } from "react";
import { Table, Button, Space, Popconfirm, DatePicker, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { listCustomers, deleteCustomer } from "@/api/customers";
import type { CustomerListParams } from "@/api/customers";
import type { Customer} from "@/types/entities";
import CustomerFormModal from "./CustomerFormModal";
import { handleError } from "@/utils/handleError";
import PageHeader from "@/components/PageHeader";
import { useCrudModal } from "@/hooks/useCrudModal";

type Filters = Pick<CustomerListParams, "from" | "to">;

export default function CustomersPage() {
    const modal = useCrudModal<Customer>();
    const [data, setData] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const PAGE_SIZE = 20;

    const [applied, setApplied] = useState<Filters>({});
    const [draft, setDraft] = useState<Filters>({});

    const load = async (p = page, f = applied) => {
        setLoading(true);
        try {
            const res = await listCustomers({ page: p, limit: PAGE_SIZE, ...f });
            setData(res.data);
            setTotal(res.pagination.total);
        } catch (e) {
            handleError(e, "Failed to load customers");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(1, {}); }, []);

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
        await deleteCustomer(id);
        message.success("Customer deleted");
        load(page, applied);
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
                        onClick={(e) => { e.stopPropagation(); modal.startEdit(record); }}>
                            Edit
                    </Button>
                    <Popconfirm
                        title="Delete this customer?"
                        onConfirm={() => handleDelete(record._id)}
                        >
                            <Button type="link" danger onClick={(e) => e.stopPropagation()}>Delete</Button>
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
                onAdd={modal.startCreate}
            />

            <div style={{ marginBottom: 16 }}>
                <Space wrap>
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

            <CustomerFormModal
                open={modal.open}
                onClose={modal.close}
                onSuccess={() => load(page, applied)}
                editing={modal.editing}
            />
        </div>
    )
}
