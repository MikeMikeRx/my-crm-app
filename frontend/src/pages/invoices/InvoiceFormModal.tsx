import { useEffect, useState, useMemo } from "react";
import dayjs from "dayjs";
import { Modal, Form, Input, InputNumber, DatePicker, Button, Space, message, Select, Table, Card, Typography } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createInvoice, updateInvoice } from "@/api/invoices";
import { listQuotes, getQuote } from "@/api/quotes";
import type { Invoice, InvoiceCreate, Quote, LineItem } from "@/types/entities";
import { getApiError } from "@/api/client";

/* ----------------------- Schema Definition ----------------------- */

const itemSchema = z.object({
    description: z.string().min(1),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
    taxRate: z.number().min(0).max(100).optional(),
});

const schema = z.object({
    customer: z.string().min(1, "Customer ID required"),
    invoiceNumber: z.string().min(1, "Invoice number required"),
    issueDate: z.any(),
    dueDate: z.any(),
    items: z.array(itemSchema).min(1, "Add at least one item"),
    notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const { Text } = Typography;

/* ----------------------- Component Props ----------------------- */
interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editing: Invoice | null;
}
/* ----------------------- Ivoice form Component ----------------------- */
export default function InvoiceFormModal({ open, onClose, onSuccess, editing}: Props) {
    
    // Generate unique invoice number
    const genInvoiceNumber = () => 
         `INV-${dayjs().format("YYYYMMDD")}-${Math.floor(1000 + Math.random() * 9000)}`;

    /* ---------------------- React Hook Form setup ------------------ */
    const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: editing
        ? {
            ...editing,
            customer:
                typeof editing.customer === "object" && editing.customer !== null
                    ? (editing.customer as { _id: string })._id
                    : (editing.customer as string) || "",
        }
        : {
            customer: "",
            invoiceNumber: genInvoiceNumber(),
            issueDate: dayjs().format("YYYY-MM-DD"),
            dueDate: dayjs().add(14, "day").format("YYYY-MM-DD"),
            items: [],
            notes: "",
        },
    });
    
    const { fields, append, remove } = useFieldArray({ control, name: "items" });
    const items = watch("items");
    
    // Live total calculation
    const total = useMemo(() => 
        items.reduce((sum, i) =>
            sum + (i.quantity || 0) * (i.unitPrice || 0) * (1 + (i.taxRate || 0) /100),
        0), [items]);

    // Edit mode setup
    useEffect(() => {
        if (editing) {
            reset({
                ...editing,
                customer:
                    typeof editing.customer === "object" && editing.customer !== null
                        ? (editing.customer as { _id: string })._id
                        : (editing.customer as string) || "",
            });
        }
    }, [editing, reset])

    // --------------------- Quotes Dropdown ----------------------------------
    const [quotes, setQuotes] = useState<Quote[]>([]);
    useEffect(() => {
        listQuotes().then(setQuotes).catch(() => message.error("Failed to load quotes"));
    }, []);

    const handleQuoteSelect = async (quoteId: string) => {
        try {
            const quote = await getQuote(quoteId);
            reset({
                customer:
                    typeof quote.customer === "object" && quote.customer !== null
                    ? (quote.customer as { _id: string })._id
                    : (quote.customer as string) || "",
                invoiceNumber: genInvoiceNumber(),
                issueDate: dayjs().format("YYYY-MM-DD"),
                dueDate: dayjs().add(14, "day").format("YYYY-MM-DD"),
                items: quote.items as LineItem[],
                notes: quote.notes || "",
            });
            message.success("Quote data imported");
        } catch {
            message.error("Failed to load quote");
        }
    };

    // --------------------- Customer Auto-fill ----------------------------------
    const customerName = useMemo(() => {
        if (editing && typeof editing.customer === "object") {
            return editing.customer.company ?? editing.customer.name ?? "";
        }

        const customerId = watch("customer");
        const quote = quotes.find(
            q => q.customer && typeof q.customer === "object" && q.customer._id === customerId);
        
        if(quote && typeof quote.customer ==="object") {
            return quote.customer.company ?? quote.customer.name ?? "";
        }

        return "";
    }, [editing, watch("customer"), quotes]);
    
    /* ------------------- Submit handler ---------------------- */
    const submit = async (values: FormValues) => {
        try {
            const payload: InvoiceCreate = {
                ...values,
                issueDate: dayjs(values.issueDate).format("YYYY-MM-DD"),
                dueDate: dayjs(values.dueDate).format("YYYY-MM-DD"),
            };
            if (editing) {
                await updateInvoice(editing._id, payload);
                message.success("Invoices updated");
            } else {
                await createInvoice(payload);
                message.success("Invoice created");
            }
            onSuccess();
            onClose();
        } catch (e) {
            const { message: msg } = getApiError(e);
            message.error(msg);
        }
    };

    /* --------------------------- AntD Table Columns --------------------------- */
    const columns = [
        {
            title: "Description",
            dataIndex: "description",
            width: 130,
            render: (_: any, __: any, idx: number) => (
                <Controller
                    name={`items.${idx}.description`}
                    control={control}
                    render={({ field }) =>
                        <Input 
                            value={field.value ?? ""}
                            placeholder="Description"
                            onChange={(e) => field.onChange(e.target.value)}
                        />
                    }
                />
            ),
        },
        {
            title: "Qty",
            dataIndex: "quantity",
            width: 100,
            render: (_: any, __: any, idx: number) => (
                <Controller
                    name={`items.${idx}.quantity`}
                    control={control}
                    render={({ field }) => 
                        <InputNumber
                            value={field.value ?? 0}
                            min={1} onChange={(v) =>field.onChange(v)}
                        />
                    }
                />
            ),
        },
        {
            title: "Price",
            dataIndex: "unitPrice",
            width: 100,
            render: (_: any, __: any, idx: number) => (
                <Controller
                    name={`items.${idx}.unitPrice`}
                    control={control}
                    render={({ field }) =>
                        <InputNumber value={field.value ?? 0} min={0} onChange={(v) => field.onChange(v)} />
                    }
                />
            ),
        },
        {
            title: "Tax %",
            dataIndex: "taxRate",
            width: 100,
            render: (_: any, __: any, idx: number) => (
                <Controller
                    name={`items.${idx}.taxRate`}
                    control={control}
                    render={({ field }) =>
                        <InputNumber
                        value={field.value ?? 0}
                        min={0} max={100}
                        onChange={(v) => field.onChange(v)}
                        />
                    }
                />
            ),
        },
        {
            title: "",
            width: 50,
            render: (_: any, __: any, idx: number) => (
                <Button
                    icon={<DeleteOutlined />}
                    onClick={() => remove(idx)}
                />
            ),
        },
    ];
    
    /* ----------------------- JSX ----------------------- */
    return (
        <Modal
            open={open}
            title={editing ? "Edit Invoice" : "New Invoice"}
            onCancel={onClose}
            footer={null}
            destroyOnHidden
        >
            <Form layout="vertical" onFinish={handleSubmit(submit)}>

                {/* Quote Number */}
                <Form.Item label="Quote Number">
                    <Select
                        placeholder="Select a quote"
                        onChange={handleQuoteSelect}
                        options={quotes.map((q) => ({
                            label: `${q.quoteNumber} - ${dayjs(q.issueDate).format("YYYY-MM-DD")}`,
                            value: q._id,
                        }))}
                    />
                </Form.Item>

                {/* Customer (disabled, auto-filled) */}
                <Form.Item label="Customer">
                    <Input value={customerName} readOnly />
                </Form.Item>

                {/* Invoice Number */}
                <Form.Item label="Invoice Number" validateStatus={errors.invoiceNumber ? "error" : ""} help={errors.invoiceNumber?.message}>
                    <Controller name="invoiceNumber" control={control} render={({ field }) => <Input { ...field } />} />
                </Form.Item>

                {/* Issue/ Due Date */}
                <Space className="w-full mb-4" size="middle" align="start">

                    <Form.Item
                        label={<span style={{ fontWeight: 450 }}>Issue Date</span>}
                        validateStatus={errors.issueDate ? "error" : ""}
                        help={typeof errors.issueDate?.message === "string" ? errors.issueDate.message : ""}
                        >
                            <Controller name="issueDate" control={control} render={({ field }) =>
                                <DatePicker {...field} value={field.value ? dayjs(field.value) : null } onChange={(d) => field.onChange(d?.format("YYYY-MM-DD"))} />
                            } />
                    </Form.Item>

                    <Form.Item
                        label={<span style={{ fontWeight: 450 }}>Due Date</span>}
                        validateStatus={errors.dueDate ? "error" : ""}
                        help={typeof errors.dueDate?.message === "string" ? errors.dueDate.message : ""}
                        >
                            <Controller name="dueDate" control={control} render={({ field }) =>
                                <DatePicker
                                    {...field}
                                    value={field.value ? dayjs(field.value) : null } onChange={(d) =>
                                        field.onChange(d?.format("YYYY-MM-DD"))
                                    }
                                />
                            }/>
                    </Form.Item>

                </Space>

                {/* Items */}
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
                    type="dashed" onClick={() =>
                        append({ description: "", quantity: 1, unitPrice: 0, taxRate: 0 })
                        }
                    >
                    Add Item
                </Button>

                {/* Total */}
                <Form.Item noStyle>
                    <Card
                        size="small"
                        style={{
                            marginTop: 20,
                            padding: 12,
                            background: "#fafafa",
                            textAlign: "right",
                        }}
                    >
                        <Text strong style={{ fontSize: 18 }}>
                            Total: ${total.toFixed(2)}
                        </Text>
                    </Card>
                </Form.Item>

                {/* Notes */}
                <Form.Item label="Notes">
                    <Controller
                        name="notes"
                        control={control}
                        render={({ field }) =>
                            <Input.TextArea {...field} rows={3} />}
                    />
                </Form.Item>

                {/* Submit */}
                <Button type="primary" htmlType="submit" block>
                    {editing ? "Update Invoice" : "Create Invoice"}
                </Button>
            </Form>
        </Modal>
    );
}
