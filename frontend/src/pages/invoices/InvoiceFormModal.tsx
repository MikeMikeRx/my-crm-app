import { useEffect, useMemo, useState } from "react";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Button,
    Card,
    DatePicker,
    Form,
    Input,
    InputNumber,
    message,
    Modal,
    Select,
    Space,
    Table,
    Typography
} from "antd";
import dayjs from "dayjs";
import { formatFormDate, todayForm, todayDoc, toDayjs, FORM_DATE_FMT } from "@/utils/dateFormat";
import { dateString } from "@/utils/dateSchema";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { createInvoice, updateInvoice } from "@/api/invoices";
import { getQuote, listQuotes } from "@/api/quotes";
import type { Invoice, InvoiceCreate, LineItem, Quote } from "@/types/entities";
import { handleError } from "@/utils/handleError";
import { formatAmount } from "@/utils/numberFormat";

const itemSchema = z.object({
    description: z.string().min(1),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
    taxRate: z.number().min(0).max(100).optional(),
});

const schema = z.object({
    customer: z.string().min(1, "Customer ID required"),
    quote: z.string().optional(),
    invoiceNumber: z.string().min(1, "Invoice number required"),
    issueDate: dateString,
    dueDate: dateString,
    items: z.array(itemSchema).min(1, "Add at least one item"),
    notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const { Text } = Typography;

const exractQuoteSuffix = (quoteNumber: string) => {
    const parts = quoteNumber.split("-");
    return parts[2] || Math.floor(1000 + Math.random() * 9000).toString();
};

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editing: Invoice | null;
}
export default function InvoiceFormModal({ open, onClose, onSuccess, editing}: Props) {
        const genInvoiceNumber = (suffix?: string) => {
        const today = todayDoc();
        const code = suffix ?? "XXXX";
        return `INV-${today}-${code}`;
    };

    const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: editing
        ? {
            ...editing,
            customer:
                typeof editing.customer === "object" && editing.customer !== null
                    ? (editing.customer as { _id: string })._id
                    : (editing.customer as string) || "",
            quote:
                typeof editing.quote === "object"
                    ? editing.quote?._id
                    : editing.quote ?? undefined,
        }
        : {
            customer: "",
            invoiceNumber: genInvoiceNumber(),
            issueDate: todayForm(),
            dueDate: dayjs().add(14, "day").format(FORM_DATE_FMT),
            items: [],
            notes: "",
            quote: undefined,
        },
    });
    
    const { fields, append, remove } = useFieldArray({ control, name: "items" });
    const items = watch("items");
    
    const total = useMemo(() => 
        items.reduce((sum, i) =>
            sum + (i.quantity || 0) * (i.unitPrice || 0) * (1 + (i.taxRate || 0) /100),
        0), [items]);

    useEffect(() => {
        if (editing) {
            reset({
                ...editing,
                customer:
                    typeof editing.customer === "object" && editing.customer !== null
                        ? (editing.customer as { _id: string })._id
                        : (editing.customer as string) || "",
                quote:
                    typeof editing.quote ==="object"
                        ? editing.quote._id
                        : editing.quote ?? undefined,
            });
        }
    }, [editing, reset])

    const [quotes, setQuotes] = useState<Quote[]>([]);
    useEffect(() => {
        listQuotes().then(setQuotes).catch((e) => handleError(e, "Failed to load quotes"));
    }, []);

    const handleQuoteSelect = async (quoteId: string) => {
        const q = quotes.find(x => x._id === quoteId);

        if (!q) {
            message.error("Quote not found");
            return;
        }
        if (q.status === "declined" || q.status === "expired") {
            message.error("You cannot create an invoice from this quote");
            return;
        }
        
        try {
            const quote = await getQuote(quoteId);
            const suffix = exractQuoteSuffix(quote.quoteNumber);
            reset({
                customer:
                    typeof quote.customer === "object" && quote.customer !== null
                    ? (quote.customer as { _id: string })._id
                    : (quote.customer as string) || "",
                invoiceNumber: genInvoiceNumber(suffix),
                issueDate: todayForm(),
                dueDate: dayjs().add(14, "day").format(FORM_DATE_FMT),
                items: quote.items as LineItem[],
                notes: quote.notes || "",
                quote: quoteId,
            });
            message.success("Quote data imported");
        } catch (e) {
            handleError(e, "Failed to load quote");
        }
    };

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
    
    const submit = async (values: FormValues) => {
        try {
            const payload: InvoiceCreate = {
                ...values,
                issueDate: formatFormDate(values.issueDate),
                dueDate: formatFormDate(values.dueDate),
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
            handleError(e, editing ? "Failed to update invoice" : "Failed to create invoice");
        }
    };

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
    
    return (
        <Modal
            open={open}
            title={editing ? "Edit Invoice" : "New Invoice"}
            onCancel={onClose}
            footer={null}
            destroyOnHidden
        >
            <Form layout="vertical" onFinish={handleSubmit(submit)}>
                {!editing && <Form.Item label="Quote Number">
                    <Select
                        placeholder="Select a quote"
                        onChange={handleQuoteSelect}
                        options={quotes
                            .filter(q => q.status !== "converted")
                            .map((q) => {
                                const statusLabel =
                                    q.status === "declined"
                                        ? "(declined)"
                                        : q.status === "expired"
                                        ? "(expired)"
                                        : "";
                                return {
                                    label: `${q.quoteNumber} ${
                                        typeof q.customer === "object"
                                        ? (q.customer.company || q.customer.name)
                                        : ""
                                    } ${statusLabel}`,
                                    value: q._id,
                                    disabled: q.status === "declined" || q.status === "expired",
                                };
                        })}
                    />
                </Form.Item>}

                <Form.Item label="Customer">
                    <Input value={customerName} readOnly />
                </Form.Item>

                <Form.Item label="Invoice Number" validateStatus={errors.invoiceNumber ? "error" : ""} help={errors.invoiceNumber?.message}>
                    <Controller name="invoiceNumber" control={control} render={({ field }) => <Input { ...field } />} />
                </Form.Item>

                <Space className="w-full mb-4" size="middle" align="start">
                    <Form.Item
                        label={<span style={{ fontWeight: 450 }}>Issue Date</span>}
                        validateStatus={errors.issueDate ? "error" : ""}
                        help={typeof errors.issueDate?.message === "string" ? errors.issueDate.message : ""}
                    >
                            <Controller name="issueDate" control={control} render={({ field }) =>
                                (
                                    <DatePicker
                                        {...field}
                                        value={toDayjs(field.value)}
                                        onChange={(d) => field.onChange(d ? formatFormDate(d) : undefined)}
                                    />
                                )}
                            />
                    </Form.Item>

                    <Form.Item
                        label={<span style={{ fontWeight: 450 }}>Due Date</span>}
                        validateStatus={errors.dueDate ? "error" : ""}
                        help={typeof errors.dueDate?.message === "string" ? errors.dueDate.message : ""}
                        >
                            <Controller name="dueDate" control={control} render={({ field }) =>
                                (
                                    <DatePicker
                                        {...field}
                                        value={toDayjs(field.value)}
                                        onChange={(d) => field.onChange(d ? formatFormDate(d) : undefined)}
                                    />
                                )}
                            />
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
                    type="dashed" onClick={() =>
                        append({ description: "", quantity: 1, unitPrice: 0, taxRate: 0 })
                        }
                    >
                    Add Item
                </Button>

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
                            Total: ${formatAmount(total)}
                        </Text>
                    </Card>
                </Form.Item>

                <Form.Item label="Notes">
                    <Controller
                        name="notes"
                        control={control}
                        render={({ field }) =>
                            <Input.TextArea {...field} rows={3} />}
                    />
                </Form.Item>

                <Button type="primary" htmlType="submit" block>
                    {editing ? "Update Invoice" : "Create Invoice"}
                </Button>
            </Form>
        </Modal>
    );
}
