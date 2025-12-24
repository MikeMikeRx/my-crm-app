import { useState, useEffect, useMemo } from "react";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import { listCustomers } from "@/api/customers";
import { createQuote, listQuotes, updateQuote } from "@/api/quotes";
import type { Customer, Quote, QuoteCreate, QuoteUpdate } from "@/types/entities";
import { handleError } from "@/utils/handleError";
import { formatAmount } from "@/utils/numberFormat";
import {
    Modal,
    Form,
    Input,
    InputNumber,
    Button,
    DatePicker,
    Space,
    message,
    Select,
    Table,
    Card,
    Typography
} from "antd";

/* ----------------------- Schema Definition ----------------------- */
const itemSchema = z.object({
    description: z.string().min(1, "Description required"),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
    taxRate: z.number().min(0).max(100).optional(),
});

const schema = z.object({
    customer: z.string().min(1, "Customer ID required"),
    quoteNumber: z.string().min(1, "Quote number required"),
    issueDate: z.string().min(1, "Issue date required"),
    expiryDate: z.string().min(1, "Expiry date required"),
    notes: z.string().optional(),
    status: z.enum(["draft", "sent", "accepted", "declined"]),
    items: z.array(itemSchema).min(1, "At least one item required"),
});

type FormValues = z.infer<typeof schema>;

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editing: Quote | null;
}

const { Text } = Typography;

/* ------------------------------- Quote Form Component ------------------------------- */
export default function QuoteFormModal({ open, onClose, onSuccess, editing }: Props) {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [quotes, setQuotes] = useState<Quote[]>([]);

    // Fetch data
    useEffect(() => {
        listCustomers()
            .then(setCustomers)
            .catch((e) => handleError(e, "Failed to load customers"));
    }, [])

    useEffect(() => {
        if(!open || editing) return;

        listQuotes()
            .then(setQuotes)
            .catch((e) => handleError(e, "Failed to load quotes"));
    },[open,editing]);

    // --- Pre-set Quote Number ---
    const getNextQuoteNumber = () => {
        const today = dayjs().format("YYYYMMDD");
        
        // Find quotes for today
        const todayQuotes = quotes.filter(q =>
            q.quoteNumber?.startsWith(`Q-${today}`)
        );
        
        // First Quote
        if(todayQuotes.length === 0) {
            return `Q-${today}-1001`;
        }

        const numbers = todayQuotes
            .map(q => Number(q.quoteNumber.split("-")[2]))
            .filter(n => !isNaN(n));

        const next = Math.max(...numbers) + 1;
        return `Q-${today}-${String(next).padStart(4, "0")}`;
    }

    const nextQuoteNumber = useMemo(() => {
        if (!quotes.length) {
            return `Q-${dayjs().format("YYYYMMDD")}-1001`;
        };
        return getNextQuoteNumber();
    }, [quotes.length]);
    
/* ------------------------------ React Hook Form setup ------------------------------------*/
    const { control, handleSubmit, reset, formState: { errors }, watch } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: editing
            ? {
                customer:
                    typeof editing.customer === "object" && editing.customer !== null
                        ? (editing.customer as { _id: string })._id
                        : (editing.customer as string) || "",
                quoteNumber: editing.quoteNumber,
                issueDate: editing.issueDate,
                expiryDate: editing.expiryDate,
                status:
                    editing.status ==="expired" || editing.status ==="converted"
                    ? "draft"
                    : editing.status,
                items: editing.items,
                notes: editing.notes ?? "",
            } 
            : { customer: "", quoteNumber: "", issueDate: "", expiryDate: "", status: "draft" ,items: [], notes: ""},
    });

    const { fields, append, remove } = useFieldArray({ control, name: "items" });

    // --- Editing ---
    useEffect(() => {
        if(!open) return;

        if(editing) {
            reset({
                customer:
                    typeof editing.customer === "object" && editing.customer !== null
                        ? (editing.customer as { _id: string })._id
                        : (editing.customer as string) || "",
                quoteNumber: editing.quoteNumber,
                issueDate: dayjs(editing.issueDate).format("YYYY-MM-DD"),
                expiryDate: editing.expiryDate
                    ? dayjs(editing.expiryDate).format("YYYY-MM-DD")
                    : "",
                status:
                    editing.status === "expired" || editing.status === "converted"
                       ? "draft"
                       : editing.status,
                items: editing.items,
                notes: editing.notes ?? "",
            });
            return;
        }

        reset({
            customer: "",
            quoteNumber: nextQuoteNumber,
            issueDate: dayjs().format("YYYY-MM-DD"),
            expiryDate: dayjs().add(1, 'year').format("YYYY-MM-DD"),
            status: "draft",
            items: [{ description: "", quantity: 1,unitPrice: 0, taxRate: 20 }],
            notes: "",
        });
    }, [open, editing, nextQuoteNumber, reset]);

    const items = watch("items");

    const total = items.reduce((sum, i) => sum + i.quantity * i.unitPrice * (1 + (i.taxRate || 0) /100), 0);

    // ---- Submit handler ---
    const submit = async (values: FormValues) => {
        try {
            const payload: QuoteUpdate | QuoteCreate = {
                customer: values.customer,
                quoteNumber: values.quoteNumber,
                items: values.items,
                issueDate: values.issueDate,
                expiryDate: values.expiryDate,
                status: values.status,
                notes: values.notes,
            };

            if (editing) {
                // --- UPDATE ---
                await updateQuote(editing._id, payload as QuoteUpdate);
                message.success("Quote updated");
            } else {
                // --- CREATE ---
                await createQuote(payload as QuoteCreate);
                message.success("Quote created");
            }

            onSuccess();
            onClose();

        } catch (e) {
            handleError(e, editing ? "Failed to update quote" : "Failed to create quote");
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

    /* --------------------------------------- JSX -------------------------------------------------- */
    return (
        <Modal open={open} title={editing ? "Edit Quote" : "New Quote"} onCancel={onClose} footer={null} destroyOnHidden width={720}>
            <Form
                layout="vertical"
                onFinish={handleSubmit(
                    submit,
                    (errors) => {
                        console.log("ZOD ERROS >>>", errors);
                        message.error("Fix validation errors");
                    }
                )}
            >
                {/* Customer */}
                <Form.Item
                    label={<span style={{ fontWeight: 450 }}>Customer</span>}
                    validateStatus={errors.customer ? "error" : ""}
                    help={errors.customer?.message}
                >
                    <Controller name="customer" control={control} render={({ field }) => (
                        <Select
                            {...field}
                            placeholder="Select customer"
                            options={customers.map((c) => ({
                                label: `${c.company} (${c.name})`,
                                value: c._id,
                            }))}
                        />
                    )}/>
                </Form.Item>

                {/* Quote Number*/}
                <Form.Item
                    label={<span style={{ fontWeight: 450 }}>Quote Number</span>}
                    validateStatus={errors.quoteNumber ? "error" : ""}
                    help={errors.quoteNumber?.message}
                >
                    <Controller
                        name="quoteNumber"
                        control={control}
                        render={({ field }) => <Input {...field}/>
                        }
                    />
                </Form.Item>
                
                {/* Issue/Expire Dates */}
                <Space className="w-full mb-4" size="middle" align="start">

                    <Form.Item
                        label={<span style={{ fontWeight: 450 }}>Issue Date</span>}
                        validateStatus={errors.issueDate ? "error" : ""}
                        help={typeof errors.issueDate?.message === "string" ? errors.issueDate.message : ""}
                    >
                    <Controller name="issueDate" control={control} render={({ field }) => (
                        <DatePicker
                            {...field}
                            value={field.value ? dayjs(field.value) : null}
                            onChange={(d) => field.onChange(d ? d.toISOString() : "")}
                            />
                        )}
                    />
                    </Form.Item>

                    <Form.Item
                        label={<span style={{ fontWeight: 450 }}>Expiry Date</span>}
                        validateStatus={errors.expiryDate ? "error" : ""}
                        help={typeof errors.expiryDate?.message === "string" ? errors.expiryDate.message : ""}
                    >
                        <Controller name="expiryDate" control={control} render={({ field }) => (
                            <DatePicker
                                {...field}
                                value={field.value ? dayjs(field.value) : null}
                                onChange={(d) => field.onChange(d ? d.toISOString() : "")}
                                />
                            )}
                        />
                    </Form.Item>

                </Space>

                {/* Add Item */}
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
                    type="dashed" onClick={() => append({ description: "", quantity: 1, unitPrice: 0, taxRate: 20})}
                >
                    Add Item
                </Button>

                {/* Status Change */}
                <Form.Item label="Status">
                    <Controller
                        name="status"
                        control={control}
                        render={({ field }) => (
                            <Select
                                {...field}
                                options={[
                                    { label: "Draft", value: "draft" },
                                    { label: "Sent", value: "sent" },
                                    { label: "Accepted", value: "accepted" },
                                    { label: "Declined", value: "declined" },
                                ]}
                            />
                        )}
                    /> 
                </Form.Item>
                
                {/* Total price + Tax */}
                <Form.Item noStyle>
                    <Card
                        size="small"
                        style={{
                            marginTop: 20,
                            padding: 12,
                            background: "#fafafa",
                            textAlign: "right"
                        }}
                    >
                        <Text strong style={{ fontSize: 18 }}>Total: ${formatAmount(total)}</Text>
                    </Card>
                </Form.Item>

                {/* Notes */}
                <Form.Item label="Notes">
                    <Controller name="notes" control={control} render={({ field }) => <Input.TextArea {...field} rows={3} />} />
                </Form.Item>

                {/* Create/Update Button */}
                <Button type="primary" htmlType="submit" block>
                    {editing ? "Update" : "Create"}
                </Button>
            </Form>
        </Modal>
    );
}