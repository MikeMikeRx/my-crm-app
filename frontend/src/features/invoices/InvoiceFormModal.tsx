import { Button, Card, DatePicker, Form, Input, Modal, Select, Space, Table, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { Controller } from "react-hook-form";
import { toDayjs, formatFormDate } from "@/shared/utils/dateFormat";
import { formatAmount } from "@/shared/utils/numberFormat";
import type { Invoice } from "@/features/invoices/invoice.types";
import { useInvoiceForm } from "./useInvoiceForm";

const { Text } = Typography;

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editing: Invoice | null;
}

export default function InvoiceFormModal({ open, onClose, onSuccess, editing }: Props) {
    const {
        control, errors, quotes, transitioning, canMarkAsSent, customerName,
        lineItems: { fields, append, columns, total },
        onSubmit, handleQuoteSelect, handleMarkAsSent,
    } = useInvoiceForm({ editing, onClose, onSuccess });

    return (
        <Modal
            open={open}
            title={editing ? "Edit Invoice" : "New Invoice"}
            onCancel={onClose}
            footer={null}
            destroyOnHidden
        >
            <Form layout="vertical" onFinish={onSubmit}>
                {!editing && (
                    <Form.Item label="Quote Number">
                        <Select
                            placeholder="Select a quote"
                            onChange={handleQuoteSelect}
                            options={quotes
                                .filter(q => q.status === "accepted")
                                .map((q) => ({
                                    label: `${q.quoteNumber} ${typeof q.customer === "object" ? (q.customer.company || q.customer.name) : ""}`,
                                    value: q._id,
                                }))}
                        />
                    </Form.Item>
                )}

                <Form.Item label="Customer">
                    <Input value={customerName} readOnly />
                </Form.Item>

                <Form.Item
                    label="Invoice Number"
                    validateStatus={errors.invoiceNumber ? "error" : ""}
                    help={errors.invoiceNumber?.message}
                >
                    <Controller name="invoiceNumber" control={control} render={({ field }) => <Input {...field} />} />
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
                        label={<span style={{ fontWeight: 450 }}>Due Date</span>}
                        validateStatus={errors.dueDate ? "error" : ""}
                        help={typeof errors.dueDate?.message === "string" ? errors.dueDate.message : ""}
                    >
                        <Controller name="dueDate" control={control} render={({ field }) => (
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
                    onClick={() => append({ description: "", quantity: 1, unitPrice: 0, taxRate: 0 })}
                >
                    Add Item
                </Button>

                <Form.Item noStyle>
                    <Card size="small" style={{ marginTop: 20, padding: 12, background: "#fafafa", textAlign: "right" }}>
                        <Text strong style={{ fontSize: 18 }}>Total: ${formatAmount(total)}</Text>
                    </Card>
                </Form.Item>

                <Form.Item label="Notes">
                    <Controller name="notes" control={control} render={({ field }) => <Input.TextArea {...field} rows={3} />} />
                </Form.Item>

                <Space direction="vertical" style={{ width: "100%" }}>
                    <Button type="primary" htmlType="submit" block>
                        {editing ? "Update Invoice" : "Create Invoice"}
                    </Button>
                    {canMarkAsSent && (
                        <Button block loading={transitioning} onClick={handleMarkAsSent}>
                            Mark as Sent
                        </Button>
                    )}
                </Space>
            </Form>
        </Modal>
    );
}
