import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Modal, Form, Input, InputNumber, DatePicker, Button, Select, message } from "antd";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPayment, listPayments } from "@/api/payments";
import { listInvoices } from "@/api/invoices";
import type { PaymentCreate, Invoice } from "@/types/entities";
import { getApiError } from "@/api/client";
import { formatAmount } from "@/utils/numberFormat";

/* ----------------------- Schema Definition ----------------------- */
const schema = z.object({
    paymentId: z.string().min(1, "Payment number required"),
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

// -------------- Payment Form Component -------------------------
export default function PaymentFormModal({ open, onClose, onSuccess }: Props) {
    const [paymentsToday, setPaymentsToday] = useState(0);
    const [remaining, setRemaining] = useState<number | null>(null);
    
    // Count today's payments
    useEffect(() => {
        if (!open) return;

        listPayments().then((all) => {
            const today = dayjs().format("YYYY-MM-DD");
            const count = all.filter(
                p => p.paymentDate && dayjs(p.paymentDate).format("YYYY-MM-DD") === today
            ).length;
            setPaymentsToday(count);
        });
    }, [open]);

    // Generate unique payment ID
    const genPaymentId = (countForToday: number) => {
        const today = dayjs().format("YYYYMMDD");
        const next = String(countForToday + 1).padStart(3, "0");
        return `PAY-${today}-${next}`
    }

    /* ---------------------- React Hook Form setup ------------------ */
    const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            paymentId: genPaymentId(paymentsToday),
            invoice: "",
            amount: 0,
            paymentMethod: undefined,
            paymentDate: dayjs().format("YYYY-MM-DD"),
            notes: "",
        },
    });

    // Reset form when modal opens or count changes
    useEffect(() => {
        if (!open) return;

        reset({
            paymentId: genPaymentId(paymentsToday),
            invoice: "",
            amount: 0,
            paymentMethod: undefined,
            paymentDate: dayjs().format("YYYY-MM-DD"),
            notes: "",
        });
    }, [paymentsToday, open, reset]);

    /* -------------- Submit handler ----------- */
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
                                label: `${inv.invoiceNumber} (${typeof inv.customer === "object"
                                    ? (inv.customer.company || inv.customer.name)
                                    : ""
                                })`,
                                value: inv._id,
                            }))}
                            onChange={async (invId) => {
                                field.onChange(invId);
                                const all = await listPayments();
                                const paid = all
                                    .filter(p => p.invoice === invId || 
                                        (p.invoice
                                            && typeof p.invoice=== "object"
                                            && p.invoice._id === invId
                                        )
                                    )
                                    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
                                const invoiceObj = invoices.find(i => i._id === invId);
                                const invoiceTotal = invoiceObj?.totals?.total || 0;
                                const remainingBalance = invoiceTotal - paid;
                                setRemaining(remainingBalance);
                                reset((prev) => ({
                                    ...prev,
                                    amount: Number(remainingBalance.toFixed(2)),
                                }));
                            }}
                        />
                    )}/>
                </Form.Item>

                <Form.Item
                    label="Payment number"
                    validateStatus={errors.paymentId ? "error" : ""}
                    help={errors.paymentId?.message}
                >
                    <Controller
                        name="paymentId"
                        control={control}
                        render={({ field }) => (
                            <Input {...field} readOnly />
                        )}
                    />
                </Form.Item>

                <Form.Item
                    label={remaining != null
                        ? `Amount (Remaining: $${formatAmount(remaining)})`
                        : "Amount"
                    }
                    validateStatus={errors.amount ? "error" : ""}
                    help={errors.amount?.message}
                >
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