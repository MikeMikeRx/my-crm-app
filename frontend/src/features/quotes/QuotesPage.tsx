import { Table, Button, Space, Popconfirm, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";

import QuoteFormModal from "./QuoteFormModal";
import { formatAmount } from "@/shared/utils/numberFormat";
import { formatFormDate } from "@/shared/utils/dateFormat";
import PageHeader from "@/shared/components/PageHeader";
import FilterBar from "@/shared/components/FilterBar";
import { useQuotes } from "./useQuotes";
import type { Quote, QuoteStatus } from "@/features/quotes/quote.types";
import { calcTotals } from "@/shared/utils/calcTotals";

const QUOTE_STATUS_OPTIONS = [
    { value: "draft", label: "Draft" },
    { value: "sent", label: "Sent" },
    { value: "accepted", label: "Accepted" },
    { value: "declined", label: "Declined" },
    { value: "expired", label: "Expired" },
    { value: "converted", label: "Converted" },
];

export default function QuotesPage() {
    const {
        modal,
        data,
        loading,
        page,
        total,
        PAGE_SIZE,
        draft,
        setDraft,
        customerOptions,
        handleApply,
        handleClear,
        handleDelete,
        handlePageChange,
        reload,
    } = useQuotes();

    const columns: ColumnsType<Quote> = [
        { title: "Quote #", dataIndex: "quoteNumber" },
        {
            title: "Customer",
            dataIndex: "customer",
            render: (customer) => {
                if (!customer) return "-";
                return customer.company || customer.name || "-";
            },
        },
        {
            title: "Issue Date",
            dataIndex: "issueDate",
            render: (v) => formatFormDate(v) || "-",
        },
        {
            title: "Expiry Date",
            dataIndex: "expiryDate",
            render: (v) => formatFormDate(v) || "-",
        },
        {
            title: "Total",
            render: (_, record) => {
                const rowTotal = record.total ?? calcTotals(record.items).total;
                return `$${formatAmount(rowTotal)}`;
            },
        },
        {
            title: "Status",
            dataIndex: "status",
            render: (s: QuoteStatus) => {
                const colors: Record<QuoteStatus, string> = {
                    draft: "blue",
                    sent: "orange",
                    accepted: "green",
                    declined: "red",
                    expired: "black",
                    converted: "purple",
                };
                return <Tag color={colors[s]}>{s}</Tag>;
            },
        },
        {
            title: "Actions",
            render: (_, record) => (
                <Space>
                    <Button type="link" onClick={(e) => { e.stopPropagation(); modal.startEdit(record); }}>Edit</Button>
                    <Popconfirm title="Delete this quote?" onConfirm={() => handleDelete(record._id)}>
                        <Button type="link" danger onClick={(e) => e.stopPropagation()}>Delete</Button>
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
                onAdd={modal.startCreate}
            />

            <FilterBar
                value={draft}
                onChange={setDraft}
                onApply={handleApply}
                onClear={handleClear}
                statusOptions={QUOTE_STATUS_OPTIONS}
                customerOptions={customerOptions}
            />

            <Table
                rowKey="_id"
                columns={columns}
                dataSource={data}
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

            <QuoteFormModal
                open={modal.open}
                editing={modal.editing}
                onClose={modal.close}
                onSuccess={reload}
            />
        </div>
    );
}
