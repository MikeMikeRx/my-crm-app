import { Table, Button, Space, Popconfirm } from "antd";
import type { ColumnsType } from "antd/es/table";

import CustomerFormModal from "./CustomerFormModal";
import PageHeader from "@/shared/components/PageHeader";
import FilterBar from "@/shared/components/FilterBar";
import { useCustomers } from "./useCustomers";
import type { Customer } from "@/features/customers/customer.types";

export default function CustomersPage() {
    const {
        modal,
        data,
        loading,
        page,
        total,
        PAGE_SIZE,
        draft,
        setDraft,
        handleApply,
        handleClear,
        handleDelete,
        handlePageChange,
        reload,
    } = useCustomers();

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

            <FilterBar
                value={draft}
                onChange={setDraft}
                onApply={handleApply}
                onClear={handleClear}
            />

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
                    onChange: handlePageChange,
                }}
                onRow={(record) => ({
                    onClick: () => modal.startEdit(record),
                    style: { cursor: "pointer" },
                })}
            />

            <CustomerFormModal
                open={modal.open}
                onClose={modal.close}
                onSuccess={reload}
                editing={modal.editing}
            />
        </div>
    );
}
