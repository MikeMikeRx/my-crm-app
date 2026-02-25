import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Modal, Form, Input, InputNumber, DatePicker, Button, Select, message } from "antd";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPayment, listPayments, updatePayment } from "@/api/payments";
import { listInvoices } from "@/api/invoices";
import type { Payment, PaymentCreate, PaymentUpdate, Invoice } from "@/types/entities";
import { handleError } from "@/utils/handleError";
import { formatAmount } from "@/utils/numberFormat";

const PENDING_METHODS = ["bank_transfer", "card", "paypal"] as const;

const schema = z.object({
    paymentId: z.string().min(1, "Payment number required"),
    invoice: z.string().min(1, "Invoice required"),
    amount: z.number().min(0.01, "Amount required"),
    paymentMethod: z.enum(["bank_transfer", "card", "cash", "paypal"]),
    paymentDate: z.any(),
    dueDate: z.any().optional(),
    notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editing: Payment | null;
}

export default function PaymentFormModal({ open, onClose, onSuccess, editing }: Props) {
    const [paymentsToday, setPaymentsToday] = useState(0);
    const [remaining, setRemaining] = useState<number | null>(null);

    useEffect(() => {
        if (!open || editing) return;

        listPayments().then((all) => {
            const today = dayjs().format("YYYY-MM-DD");
            const count = all.filter(
                p => p.paymentDate && dayjs(p.paymentDate).format("YYYY-MM-DD") === today
            ).length;
            setPaymentsToday(count);
        });
    }, [open, editing]);

    const genPaymentId = (countForToday: number) => {
        const today = dayjs().format("YYYYMMDD");
        const next = String(countForToday + 1).padStart(3, "0");
        return `PAY-${today}-${next}`
    }

    const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            paymentId: genPaymentId(paymentsToday),
            invoice: "",
            amount: 0,
            paymentMethod: undefined,
            paymentDate: dayjs().format("YYYY-MM-DD"),
            dueDate: undefined,
            notes: "",
        },
    });

    const paymentMethod = useWatch({ control, name: "paymentMethod" });
    const paymentDate = useWatch({ control, name: "paymentDate" });
    const isPendingMethod = PENDING_METHODS.includes(paymentMethod as typeof PENDING_METHODS[number]);

    useEffect(() => {
        if (isPendingMethod) {
            const base = paymentDate ? dayjs(paymentDate) : dayjs();
            setValue("dueDate", base.add(3, "day").format("YYYY-MM-DD"));
        } else {
            setValue("dueDate", undefined);
        }
    }, [paymentMethod]);

    useEffect(() => {
        if (isPendingMethod && paymentDate) {
            setValue("dueDate", dayjs(paymentDate).add(3, "day").format("YYYY-MM-DD"));
        }
    }, [paymentDate]);

    useEffect(() => {
        if (!open) return;

        if (editing) {
            const invoiceId = typeof editing.invoice === "object" ? editing.invoice._id : editing.invoice;
            reset({
                paymentId: editing.paymentId ?? "",
                invoice: invoiceId,
                amount: editing.amount,
                paymentMethod: editing.paymentMethod,
                paymentDate: editing.paymentDate ?? dayjs().format("YYYY-MM-DD"),
                dueDate: editing.dueDate,
                notes: editing.notes ?? "",
            });
            setRemaining(null);
        } else {
            reset({
                paymentId: genPaymentId(paymentsToday),
                invoice: "",
                amount: 0,
                paymentMethod: undefined,
                paymentDate: dayjs().format("YYYY-MM-DD"),
                dueDate: undefined,
                notes: "",
            });
        }
    }, [editing, paymentsToday, open, reset]);

    const submit = async (values: FormValues) => {
        try {
            if (editing) {
                const payload: PaymentUpdate = {
                    amount: values.amount,
                    paymentMethod: values.paymentMethod,
                    paymentDate: dayjs(values.paymentDate).format("YYYY-MM-DD"),
                    dueDate: values.dueDate ? dayjs(values.dueDate).format("YYYY-MM-DD") : undefined,
                    notes: values.notes,
                };
                await updatePayment(editing._id, payload);
                message.success("Payment updated");
            } else {
                const payload: PaymentCreate = {
                    ...values,
                    paymentMethod: values.paymentMethod as PaymentCreate["paymentMethod"],
                    paymentDate: dayjs(values.paymentDate).format("YYYY-MM-DD"),
                    dueDate: values.dueDate ? dayjs(values.dueDate).format("YYYY-MM-DD") : undefined,
                };
                await createPayment(payload);
                message.success("Payment created");
            }
            onSuccess();
            onClose();
            reset();
        } catch (e) {
            handleError(e, editing ? "Failed to update payment" : "Failed to create payment");
        }
    };

    const [invoices, setInvoices] = useState<Invoice[]>([]);
    useEffect(() => {
        listInvoices().then(setInvoices).catch((e) => handleError(e, "Failed to load invoices"));
    }, []);

    return (
        <Modal open={open} title={editing ? "Edit Payment" : "New Payment"} onCancel={onClose} footer={null} destroyOnHidden>
            <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
                <Form.Item layout="vertical" label="Invoice" validateStatus={errors.invoice ? "error" : ""}>
                    <Controller name="invoice" control={control} render={({ field }) => (
                        <Select {...field} placeholder="Select invoice" disabled={!!editing}
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
                    layout="vertical"
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
                    layout="vertical"
                    label={remaining != null
                        ? `Amount (Remaining: $${formatAmount(remaining)})`
                        : "Amount"
                    }
                    validateStatus={errors.amount ? "error" : ""}
                    help={errors.amount?.message}
                >
                    <Controller name="amount" control={control} render={({ field }) => <InputNumber {...field} min={0} className="w-full" />} />
                </Form.Item>

                <Form.Item layout="vertical" label="Method" validateStatus={errors.paymentMethod ? "error" : ""} help={errors.paymentMethod?.message}>
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

                <Form.Item layout="vertical" label="Payment Date">
                    <Controller name="paymentDate" control={control} render={({ field }) => (
                        <DatePicker {...field} value={dayjs(field.value)} onChange={(d) => field.onChange(d?.format("YYYY-MM-DD"))}/>
                    )}/>
                </Form.Item>

                {isPendingMethod && (
                    <Form.Item
                        layout="vertical"
                        label="Due Date"
                        extra="Payment will remain pending until this date"
                    >
                        <Controller name="dueDate" control={control} render={({ field }) => (
                            <DatePicker
                                {...field}
                                value={field.value ? dayjs(field.value) : null}
                                onChange={(d) => field.onChange(d?.format("YYYY-MM-DD"))}
                            />
                        )}/>
                    </Form.Item>
                )}

                <Form.Item layout="vertical" label="Notes">
                    <Controller name="notes" control={control} render={({ field }) => <Input.TextArea {...field} rows={3} />} />
                </Form.Item>

                <Button type="primary" htmlType="submit" block>
                    {editing ? "Update Payment" : "Add Payment"}
                </Button>
            </form>
        </Modal>
    );
}
