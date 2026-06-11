import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dayjs from "dayjs";
import { message } from "antd";
import { formatFormDate, todayForm, todayDoc, FORM_DATE_FMT } from "@/shared/utils/dateFormat";
import { dateString } from "@/shared/utils/dateSchema";
import { createQuote, listQuotes, transitionQuoteStatus, updateQuote } from "@/api/quotes";
import { listCustomers } from "@/api/customers";
import type { Customer } from "@/features/customers/customer.types";
import type { Quote, QuoteCreate, QuoteStatus, QuoteUpdate } from "@/features/quotes/quote.types";
import { handleError } from "@/shared/utils/handleError";
import { useLineItems } from "@/shared/hooks/useLineItems";

const QUOTE_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
    draft: ["sent"],
    sent: ["accepted", "declined"],
    accepted: [],
    declined: [],
    expired: [],
    converted: [],
};

const itemSchema = z.object({
    description: z.string().min(1, "Description required"),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
    taxRate: z.number().min(0).max(100).optional(),
});

const schema = z.object({
    customer: z.string().min(1, "Customer ID required"),
    quoteNumber: z.string().min(1, "Quote number required"),
    issueDate: dateString,
    expiryDate: dateString,
    notes: z.string().optional(),
    status: z.enum(["draft", "sent", "accepted", "declined"]),
    items: z.array(itemSchema).min(1, "At least one item required"),
});

type FormValues = z.infer<typeof schema>;

const resolveId = (val: unknown): string => {
    if (typeof val === "object" && val !== null && "_id" in val) return (val as { _id: string })._id;
    return (val as string) || "";
};

const safeStatus = (status: QuoteStatus): FormValues["status"] =>
    status === "expired" || status === "converted" ? "draft" : status;

interface Props {
    open: boolean;
    editing: Quote | null;
    onClose: () => void;
    onSuccess: () => void;
}

export function useQuoteForm({ open, editing, onClose, onSuccess }: Props) {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [quotes, setQuotes] = useState<Quote[]>([]);

    useEffect(() => {
        listCustomers({ limit: 100 })
            .then((res) => setCustomers(res.data))
            .catch((e) => handleError(e, "Failed to load customers"));
    }, []);

    useEffect(() => {
        if (!open || editing) return;
        listQuotes({ limit: 100 })
            .then((res) => setQuotes(res.data))
            .catch((e) => handleError(e, "Failed to load quotes"));
    }, [open, editing]);

    const nextQuoteNumber = useMemo(() => {
        const today = todayDoc();
        const todayQuotes = quotes.filter(q => q.quoteNumber?.startsWith(`Q-${today}`));
        if (todayQuotes.length === 0) return `Q-${today}-1001`;
        const numbers = todayQuotes.map(q => Number(q.quoteNumber.split("-")[2])).filter(n => !isNaN(n));
        return `Q-${today}-${String(Math.max(...numbers) + 1).padStart(4, "0")}`;
    }, [quotes]);

    const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: editing
            ? {
                customer: resolveId(editing.customer),
                quoteNumber: editing.quoteNumber,
                issueDate: editing.issueDate,
                expiryDate: editing.expiryDate,
                status: safeStatus(editing.status),
                items: editing.items,
                notes: editing.notes ?? "",
            }
            : { customer: "", quoteNumber: "", issueDate: "", expiryDate: "", status: "draft", items: [], notes: "" },
    });

    const lineItems = useLineItems(control);

    useEffect(() => {
        if (!open) return;
        if (editing) {
            reset({
                customer: resolveId(editing.customer),
                quoteNumber: editing.quoteNumber,
                issueDate: formatFormDate(editing.issueDate),
                expiryDate: formatFormDate(editing.expiryDate),
                status: safeStatus(editing.status),
                items: editing.items,
                notes: editing.notes ?? "",
            });
            return;
        }
        reset({
            customer: "",
            quoteNumber: nextQuoteNumber,
            issueDate: todayForm(),
            expiryDate: dayjs().add(1, "year").format(FORM_DATE_FMT),
            status: "draft",
            items: [{ description: "", quantity: 1, unitPrice: 0, taxRate: 20 }],
            notes: "",
        });
    }, [open, editing, nextQuoteNumber, reset]);

    const isSystemStatus = editing?.status === "expired" || editing?.status === "converted";

    const statusOptions = editing && !isSystemStatus
        ? [
            { label: editing.status.charAt(0).toUpperCase() + editing.status.slice(1), value: editing.status },
            ...QUOTE_TRANSITIONS[editing.status].map(s => ({
                label: s.charAt(0).toUpperCase() + s.slice(1),
                value: s,
            })),
          ]
        : [
            { label: "Draft", value: "draft" },
            { label: "Sent", value: "sent" },
            { label: "Accepted", value: "accepted" },
            { label: "Declined", value: "declined" },
          ];

    const onSubmit = async (values: FormValues) => {
        try {
            if (editing) {
                const payload: QuoteUpdate = {
                    customer: values.customer,
                    quoteNumber: values.quoteNumber,
                    items: values.items,
                    issueDate: values.issueDate,
                    expiryDate: values.expiryDate,
                    notes: values.notes,
                };
                await updateQuote(editing._id, payload);
                if (!isSystemStatus && values.status !== editing.status) {
                    await transitionQuoteStatus(editing._id, values.status);
                }
                message.success("Quote updated");
            } else {
                await createQuote({
                    customer: values.customer,
                    quoteNumber: values.quoteNumber,
                    items: values.items,
                    issueDate: values.issueDate,
                    expiryDate: values.expiryDate,
                    status: values.status,
                    notes: values.notes,
                } as QuoteCreate);
                message.success("Quote created");
            }
            onSuccess();
            onClose();
        } catch (e) {
            handleError(e, editing ? "Failed to update quote" : "Failed to create quote");
        }
    };

    return {
        control,
        errors,
        customers,
        lineItems,
        isSystemStatus,
        statusOptions,
        onSubmit: handleSubmit(onSubmit, (errs) => {
            console.log("ZOD ERRORS >>>", errs);
            message.error("Fix validation errors");
        }),
    };
}
