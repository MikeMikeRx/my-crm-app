import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Modal, Form, Input, InputNumber, DatePicker, Button, Select, message } from "antd";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPayment } from "@/api/payments";
import { listInvoices } from "@/api/invoices";
import type { PaymentCreate, Invoice } from "@/types/entities";
import { getApiError } from "@/api/client";

/* ----------------------- Schema Definition ----------------------- */
const schema = z.object({
    invoice: z.string().min(1, "Invoice required"),
    amount: z.number().min(0.01, "Amount required"),
    paymentMethod: z.enum(["bank_transfer", "card", "cash", "paypal"]),
    paymentDate: z.any(),
    notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

// -------------- Component -------------------------
export default function PaymentFormModal({ open, onClose, onSuccess }: Props) {
    const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            invoice: "",
            amount: 0,
            paymentMethod: undefined,
            paymentDate: dayjs().format("YYYY-MM-DD"),
            notes: "",
        },
    });

    const submit = async (values: FormValues) => {
        try {
            const payload: PaymentCreate = {
                ...values,
                paymentMethod: values.paymentMethod as PaymentCreate["paymentMethod"],
                paymentDate: dayjs(values.paymentDate).format("YYYY-MM-DD"),
            };
            await createPayment(payload);
            message.success("Payment created");
            onSuccess();
            onClose();
            reset();
        } catch (e) {
            const { message: msg } = getApiError(e);
            message.error(msg);
        }
    };

    // ----------- Load invoices for dropdown ---------------
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    useEffect(() => {
        listInvoices().then(setInvoices).catch(() => message.error("Failed to load invoices"));
    }, []);

    // ----------------- JSX ----------------------------------
    return (
        <Modal open={open} title="New Payment" onCancel={onClose} footer={null} destroyOnHidden>
            <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">

                <Form.Item label="Invoice" validateStatus={errors.invoice ? "error" : ""}>
                    <Controller name="invoice" control={control} render={({ field }) => (
                        <Select {...field} placeholder="Select invoice"
                            options={invoices.map((inv) => ({
                                label: `${inv.invoiceNumber} - $${inv.total?.toFixed(2)}`,
                                value: inv._id,
                            }))} />
                    )}/>
                </Form.Item>

                <Form.Item label="Amount" validateStatus={errors.amount ? "error" : ""} help={errors.amount?.message}>
                    <Controller name="amount" control={control} render={({ field }) => <InputNumber {...field} min={0} className="w-full" />} />
                </Form.Item>

                <Form.Item label="Method" validateStatus={errors.paymentMethod ? "error" : ""} help={errors.paymentMethod?.message}>
                    <Controller name="paymentMethod" control={control} render={({ field }) => (
                        <Select {...field} placeholder="Select method"
                            options={[
                                { label: "Bank Transfer", value: "bank_transfer" },
                                { label: "Card", value: "card" },
                                { label: "Cash", value: "cash"},
                                { label: "PayPal", value: "paypal"},
                            ]}/>
                    )}/>
                </Form.Item>

                <Form.Item label="Payment Date">
                    <Controller name="paymentDate" control={control} render={({ field }) => (
                        <DatePicker {...field} value={dayjs(field.value)} onChange={(d) => field.onChange(d?.format("YYYY-MM-DD"))}/>
                    )}/>
                </Form.Item>

                <Form.Item label="Notes">
                    <Controller name="notes" control={control} render={({ field }) => <Input.TextArea {...field} rows={3} />} />
                </Form.Item>

                <Button type="primary" htmlType="submit" block>
                    Add Payment
                </Button>
            </form>
        </Modal>
    );
}