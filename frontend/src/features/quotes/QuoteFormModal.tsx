import { Button, Card, DatePicker, Form, Input, Modal, Select, Space, Table, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { Controller } from "react-hook-form";

import { toDayjs, formatFormDate } from "@/shared/utils/dateFormat";
import { formatAmount } from "@/shared/utils/numberFormat";
import { useQuoteForm } from "./useQuoteForm";
import type { Quote } from "@/features/quotes/quote.types";

const { Text } = Typography;

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editing: Quote | null;
}

export default function QuoteFormModal({ open, onClose, onSuccess, editing }: Props) {
    const {
        control, errors, customers,
        lineItems: { fields, append, columns, total },
        isSystemStatus, statusOptions, onSubmit,
    } = useQuoteForm({ open, editing, onClose, onSuccess });

    return (
        <Modal
            open={open}
            title={editing ? "Edit Quote" : "New Quote"}
            onCancel={onClose}
            footer={null}
            destroyOnHidden
            width={720}
        >
            <Form layout="vertical" onFinish={onSubmit}>
                <Form.Item
                    label={<span style={{ fontWeight: 450 }}>Customer</span>}
                    validateStatus={errors.customer ? "error" : ""}
                    help={errors.customer?.message}
                >
                    <Controller name="customer" control={control} render={({ field }) => (
                        <Select
                            {...field}
                            placeholder="Select customer"
                            options={customers.map((c) => ({ label: `${c.company} (${c.name})`, value: c._id }))}
                        />
                    )} />
                </Form.Item>

                <Form.Item
                    label={<span style={{ fontWeight: 450 }}>Quote Number</span>}
                    validateStatus={errors.quoteNumber ? "error" : ""}
                    help={errors.quoteNumber?.message}
                >
                    <Controller name="quoteNumber" control={control} render={({ field }) => <Input {...field} />} />
                </Form.Item>

                <Space className="w-full mb-4" size="middle" align="start">
                    <Form.Item
                        label={<span style={{ fontWeight: 450 }}>Issue Date</span>}
                        validateStatus={errors.issueDate ? "error" : ""}
                        help={typeof errors.issueDate?.message === "string" ? errors.issueDate.message : ""}
                    >
                        <Controller name="issueDate" control={control} render={({ field }) => (
                            <DatePicker {...field} value={toDayjs(field.value)} onChange={(d) => field.onChange(d ? formatFormDate(d) : undefined)} />
                        )} />
                    </Form.Item>

                    <Form.Item
                        label={<span style={{ fontWeight: 450 }}>Expiry Date</span>}
                        validateStatus={errors.expiryDate ? "error" : ""}
                        help={typeof errors.expiryDate?.message === "string" ? errors.expiryDate.message : ""}
                    >
                        <Controller name="expiryDate" control={control} render={({ field }) => (
                            <DatePicker {...field} value={toDayjs(field.value)} onChange={(d) => field.onChange(d ? formatFormDate(d) : undefined)} />
                        )} />
                    </Form.Item>
                </Space>

                <h3 className="font-semibold mb-2">Items</h3>
                <Table
                    columns={columns}
                    dataSource={fields}
                    pagination={false}
                    rowKey="id"
                    size="small"
                    tableLayout="fixed"
                    style={{ tableLayout: "fixed" }}
                />
                <Button
                    icon={<PlusOutlined />}
                    type="dashed"
                    onClick={() => append({ description: "", quantity: 1, unitPrice: 0, taxRate: 20 })}
                >
                    Add Item
                </Button>

                <Form.Item label="Status">
                    <Controller name="status" control={control} render={({ field }) => (
                        <Select {...field} options={statusOptions} disabled={isSystemStatus} />
                    )} />
                </Form.Item>

                <Form.Item noStyle>
                    <Card size="small" style={{ marginTop: 20, padding: 12, background: "#fafafa", textAlign: "right" }}>
                        <Text strong style={{ fontSize: 18 }}>Total: ${formatAmount(total)}</Text>
                    </Card>
                </Form.Item>

                <Form.Item label="Notes">
                    <Controller name="notes" control={control} render={({ field }) => <Input.TextArea {...field} rows={3} />} />
                </Form.Item>

                <Button type="primary" htmlType="submit" block>
                    {editing ? "Update" : "Create"}
                </Button>
            </Form>
        </Modal>
    );
}
