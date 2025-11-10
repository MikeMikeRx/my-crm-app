import { Modal, Form, Input, InputNumber, Button, DatePicker, Space, message } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import { createQuote, updateQuote } from "@/api/quotes";
import type { Quote, QuoteCreate } from "@/types/entities";
import { getApiError } from "@/api/client";
import { useEffect } from "react";

const itemSchema = z.object({
    description: z.string().min(1, "Description required"),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
    taxRate: z.number().min(0).max(100).optional(),
});

const schema = z.object({
    customer: z.string().min(1, "Customer ID required"),
    quoteNumber: z.string().min(1, "Quote number required"),
    issueDate: z.any(),
    expiryDate: z.any().optional(),
    globalTaxRate: z.number().optional(),
    notes: z.string().optional(),
    items: z.array(itemSchema).min(1, "At least one item required"),
});

type FormValues = z.infer<typeof schema>;

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editing: Quote | null;
}

export default function QuoteFormModal({ open, onClose, onSuccess, editing }: Props) {
    const { control, handleSubmit, reset, formState: { errors }, watch } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: editing
            ? {...editing,
            customer:
            typeof editing.customer === "object" && editing.customer !== null
                    ? (editing.customer as { _id: string })._id
                    : (editing.customer as string) || "",
                issueDate: editing.issueDate,
                expiryDate: editing.expiryDate,
            } : { customer: "", quoteNumber: "", issueDate: "", expiryDate: "", items: [], notes: ""}
            });

    const { fields, append, remove } = useFieldArray({ control, name: "items" });

    useEffect(() => {
        const normalized = editing
        ? {
            ...editing,
            customer:
                typeof editing.customer === "object" && editing.customer !== null
                    ? (editing.customer as { _id: string })._id
                    : (editing.customer as string) || "",
            issueDate: editing.issueDate,
            expiryDate: editing.expiryDate,
        }
        : { customer: "", quoteNumber: "", issueDate: "", expiryDate: "", items: [], notes: ""};reset(normalized);
    }, [editing, reset]);

    const submit = async (values: FormValues) => {
        try {
            const payload: QuoteCreate = {
                ...values,
                issueDate: dayjs(values.issueDate).format("YYYY-MM-DD"),
                expiryDate: values.expiryDate ? dayjs(values.expiryDate).format("YYYY-MM-DD") : undefined,
            };
            if (editing) {
                await updateQuote(editing._id, payload);
                message.success("Quote updated");
            } else {
                await createQuote(payload);
                message.success("Quote created");
            }
            onSuccess();
            onClose();
        } catch (e) {
            const { message: msg } = getApiError(e);
            message.error(msg);
        }
    };

    const items = watch("items");

    const total = items.reduce((sum, i) => sum + i.quantity * i.unitPrice * (1 + (i.taxRate || 0) /100), 0);

    return (
        <Modal open={open} title={editing ? "Edit Quote" : "New Quote"} onCancel={onClose} footer={null} destroyOnHidden>
            <Form layout="vertical" onFinish={handleSubmit(submit)}>
                <Form.Item label="Customer ID" validateStatus={errors.customer ? "error" : ""} help={errors.customer?.message}>
                    <Controller name="customer" control={control} render={({ field}) => <Input {...field} />} />
                </Form.Item>

                <Form.Item label="Quote Number" validateStatus={errors.quoteNumber ? "error" : ""} help={errors.quoteNumber?.message}>
                    <Controller name="quoteNumber" control={control} render={({ field }) => <Input {...field} />} />
                </Form.Item>

                <Space className="w-full mb-4" size="middle">
                    <Controller name="issueDate" control={control} render={({ field }) => (
                        <DatePicker
                            {...field}
                            value={field.value ? dayjs(field.value) : null}
                            onChange={(d) => field.onChange(d ? d.toISOString() : "")}
                            />
                        )}
                    />

                    <Controller name="expiryDate" control={control} render={({ field }) => (
                        <DatePicker
                            {...field}
                            value={field.value ? dayjs(field.value) : null}
                            onChange={(d) => field.onChange(d ? d.toISOString() : "")}
                            />
                        )}
                    />
                </Space>

                <h3 className="font-semibold mb-2">Items</h3>
                {fields.map((field, idx) => (
                    <Space key={field.id} align="baseline" className="flex mb-2">
                        <Controller name={`items.${idx}.description`} control={control}
                            render={({ field }) => <Input {...field} placeholder="Description" />} />
                        <Controller name={`items.${idx}.quantity`} control={control}
                            render={({ field }) => <InputNumber {...field} min={1} placeholder="Qty" />}/>
                        <Controller name={`items.${idx}.unitPrice`} control={control}
                            render={({ field }) => <InputNumber {...field} min={0} placeholder="Unit Price" />} />
                        <Controller name={`items.${idx}.taxRate`} control={control}
                            render={({ field }) => <InputNumber {...field} min={0} max={100} placeholder="Tax %" />} />
                        <Button icon={<DeleteOutlined />} onClick={() => remove(idx)} />
                    </Space>
                ))}
                <Button icon={<PlusOutlined />} type="dashed" onClick={() => append({ description: "", quantity: 1, unitPrice: 0, taxRate: 0})}>
                    Add Item
                </Button>

                <div className="mt-4 font-semibold">Total: {total.toFixed(2)}</div>

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