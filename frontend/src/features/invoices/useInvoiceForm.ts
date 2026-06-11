import { useEffect, useMemo, useState } from "react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dayjs from "dayjs";
import { message } from "antd";

import { formatFormDate, todayForm, todayDoc, FORM_DATE_FMT } from "@/shared/utils/dateFormat";
import { dateString } from "@/shared/utils/dateSchema";
import { handleError } from "@/shared/utils/handleError";
import { createInvoice, transitionInvoiceStatus, updateInvoice } from "@/api/invoices";
import { getQuote, listQuotes } from "@/api/quotes";
import { useLineItems } from "@/shared/hooks/useLineItems";
import type { LineItem } from "@/shared/types/entities.types";
import type { Quote } from "@/features/quotes/quote.types";
import type { Invoice, InvoiceCreate } from "@/features/invoices/invoice.types";

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

const INVOICE_TRANSITIONS: Record<string, string[]> = {
    draft: ["sent"],
    sent: [],
    partially_paid: [],
    paid: [],
    overdue: [],
};

const extractQuoteSuffix = (quoteNumber: string) => {
    const parts = quoteNumber.split("-");
    return parts[2] || Math.floor(1000 + Math.random() * 9000).toString();
};

const resolveId = (val: unknown): string => {
    if (typeof val === "object" && val !== null && "_id" in val) return (val as { _id: string })._id;
    return (val as string) || "";
};

interface Props {
    editing: Invoice | null;
    onClose: () => void;
    onSuccess: () => void;
}

export function useInvoiceForm({ editing, onClose, onSuccess }: Props) {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [transitioning, setTransitioning] = useState(false);

    const genInvoiceNumber = (suffix?: string) => `INV-${todayDoc()}-${suffix ?? "XXXX"}`;

    const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: editing
            ? { ...editing, customer: resolveId(editing.customer), quote: resolveId(editing.quote) || undefined }
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

    const lineItems = useLineItems(control);

    useEffect(() => {
        listQuotes({ limit: 100 })
            .then((res) => setQuotes(res.data))
            .catch((e) => handleError(e, "Failed to load quotes"));
    }, []);

    useEffect(() => {
        if (!editing) return;
        reset({
            ...editing,
            customer: resolveId(editing.customer),
            quote: resolveId(editing.quote) || undefined,
        });
    }, [editing, reset]);

    const handleQuoteSelect = async (quoteId: string) => {
        const found = quotes.find(x => x._id === quoteId);
        if (!found) { message.error("Quote not found"); return; }
        try {
            const quote = await getQuote(quoteId);
            reset({
                customer: resolveId(quote.customer),
                invoiceNumber: genInvoiceNumber(extractQuoteSuffix(quote.quoteNumber)),
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

    const customerId = watch("customer");
    const customerName = useMemo(() => {
        if (editing && typeof editing.customer === "object") {
            return editing.customer.company ?? editing.customer.name ?? "";
        }
        const q = quotes.find(q => q.customer && typeof q.customer === "object" && q.customer._id === customerId);
        return q && typeof q.customer === "object" ? (q.customer.company ?? q.customer.name ?? "") : "";
    }, [editing, customerId, quotes]);

    const canMarkAsSent = editing ? INVOICE_TRANSITIONS[editing.status]?.includes("sent") : false;

    const handleMarkAsSent = async () => {
        if (!editing) return;
        setTransitioning(true);
        try {
            await transitionInvoiceStatus(editing._id, "sent");
            message.success("Invoice marked as sent");
            onSuccess();
            onClose();
        } catch (e) {
            handleError(e, "Failed to update invoice status");
        } finally {
            setTransitioning(false);
        }
    };

    const onSubmit = async (values: FormValues) => {
        try {
            if (editing) {
                await updateInvoice(editing._id, {
                    items: values.items,
                    notes: values.notes,
                    dueDate: formatFormDate(values.dueDate),
                });
                message.success("Invoice updated");
            } else {
                const payload: InvoiceCreate = {
                    ...values,
                    issueDate: formatFormDate(values.issueDate),
                    dueDate: formatFormDate(values.dueDate),
                };
                await createInvoice(payload);
                message.success("Invoice created");
            }
            onSuccess();
            onClose();
        } catch (e) {
            handleError(e, editing ? "Failed to update invoice" : "Failed to create invoice");
        }
    };

    return {
        control,
        errors,
        quotes,
        transitioning,
        canMarkAsSent,
        customerName,
        lineItems,
        onSubmit: handleSubmit(onSubmit),
        handleQuoteSelect,
        handleMarkAsSent,
    };
}
