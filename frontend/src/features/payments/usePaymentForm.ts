import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dayjs from "dayjs";
import { formatFormDate, todayForm, todayDoc, FORM_DATE_FMT } from "@/shared/utils/dateFormat";
import { dateString, optionalDateString } from "@/shared/utils/dateSchema";
import { createPayment, listPayments, updatePayment } from "@/api/payments";
import { listInvoices } from "@/api/invoices";
import type { Invoice } from "@/features/invoices/invoice.types";
import type { Payment, PaymentCreate, PaymentUpdate } from "@/features/payments/payment.types";
import { handleError } from "@/shared/utils/handleError";
import { formatAmount } from "@/shared/utils/numberFormat";
import { message } from "antd";

const PENDING_METHODS = ["bank_transfer", "card", "paypal"] as const;

export const PAYMENT_METHOD_OPTIONS = [
    { label: "Bank Transfer", value: "bank_transfer" },
    { label: "Card", value: "card" },
    { label: "Cash", value: "cash" },
    { label: "PayPal", value: "paypal" },
];

const genPaymentId = (countForToday: number) => {
    const today = todayDoc();
    return `PAY-${today}-${String(countForToday + 1).padStart(3, "0")}`;
};

const schema = z.object({
    paymentId: z.string().min(1, "Payment number required"),
    invoice: z.string().min(1, "Invoice required"),
    amount: z.number().min(0.01, "Amount required"),
    paymentMethod: z.enum(["bank_transfer", "card", "cash", "paypal"]),
    paymentDate: dateString,
    dueDate: optionalDateString,
    notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
    open: boolean;
    editing: Payment | null;
    onClose: () => void;
    onSuccess: () => void;
}

export function usePaymentForm({ open, editing, onClose, onSuccess }: Props) {
    const [paymentsToday, setPaymentsToday] = useState(0);
    const [remaining, setRemaining] = useState<number | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);

    useEffect(() => {
        listInvoices({ limit: 100 })
            .then(({ data }) => setInvoices(data))
            .catch((e) => handleError(e, "Failed to load invoices"));
    }, []);

    useEffect(() => {
        if (!open || editing) return;
        listPayments({ limit: 100 }).then(({ data }) => {
            const today = todayForm();
            const count = data.filter(p => p.paymentDate && formatFormDate(p.paymentDate) === today).length;
            setPaymentsToday(count);
        });
    }, [open, editing]);

    const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            paymentId: genPaymentId(paymentsToday),
            invoice: "",
            amount: 0,
            paymentMethod: undefined,
            paymentDate: todayForm(),
            dueDate: undefined,
            notes: "",
        },
    });

    const paymentMethod = useWatch({ control, name: "paymentMethod" });
    const paymentDate = useWatch({ control, name: "paymentDate" });
    const isPendingMethod = PENDING_METHODS.includes(paymentMethod as typeof PENDING_METHODS[number]);

    useEffect(() => {
        if (isPendingMethod && paymentDate) {
            setValue("dueDate", dayjs(paymentDate).add(3, "day").format(FORM_DATE_FMT));
        } else if (!isPendingMethod) {
            setValue("dueDate", undefined);
        }
    }, [isPendingMethod, paymentDate, setValue]);

    useEffect(() => {
        if (!open) return;
        if (editing) {
            const invoiceId = typeof editing.invoice === "object" ? editing.invoice._id : editing.invoice;
            reset({
                paymentId: editing.paymentId ?? "",
                invoice: invoiceId,
                amount: editing.amount,
                paymentMethod: editing.paymentMethod,
                paymentDate: editing.paymentDate ?? todayForm(),
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
                paymentDate: todayForm(),
                dueDate: undefined,
                notes: "",
            });
        }
    }, [editing, paymentsToday, open, reset]);

    const invoiceOptions = useMemo(() =>
        invoices.map((inv) => {
            const customerName = typeof inv.customer === "object"
                ? (inv.customer.company || inv.customer.name || "Unknown")
                : (inv.customer || "Unknown");
            return { label: `${inv.invoiceNumber} (${customerName})`, value: inv._id };
        })
    , [invoices]);

    const handleInvoiceChange = async (invId: string, onChange: (val: string) => void) => {
        onChange(invId);
        const { data: allPayments } = await listPayments({ limit: 100 });
        const paid = allPayments
            .filter(p => p.invoice === invId || (p.invoice && typeof p.invoice === "object" && p.invoice._id === invId))
            .reduce((sum: number, p) => sum + Number(p.amount || 0), 0);
        const invoiceObj = invoices.find(i => i._id === invId);
        const remainingBalance = (invoiceObj?.totals?.total || 0) - paid;
        setRemaining(remainingBalance);
        reset((prev) => ({ ...prev, amount: Number(remainingBalance.toFixed(2)) }));
    };

    const remainingLabel = remaining != null ? `Amount (Remaining: $${formatAmount(remaining)})` : "Amount";

    const onSubmit = async (values: FormValues) => {
        try {
            if (editing) {
                const payload: PaymentUpdate = {
                    amount: values.amount,
                    paymentMethod: values.paymentMethod,
                    paymentDate: formatFormDate(values.paymentDate),
                    dueDate: values.dueDate ? formatFormDate(values.dueDate) : undefined,
                    notes: values.notes,
                };
                await updatePayment(editing._id, payload);
                message.success("Payment updated");
            } else {
                const payload: PaymentCreate = {
                    ...values,
                    paymentMethod: values.paymentMethod as PaymentCreate["paymentMethod"],
                    paymentDate: formatFormDate(values.paymentDate),
                    dueDate: values.dueDate ? formatFormDate(values.dueDate) : undefined,
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

    return {
        control,
        errors,
        isPendingMethod,
        invoiceOptions,
        remainingLabel,
        handleInvoiceChange,
        onSubmit: handleSubmit(onSubmit),
    };
}
