import type { ID } from "@/shared/types/common.types";
import type { Customer } from "@/features/customers/customer.types";
import type { Quote } from "@/features/quotes/quote.types";
import type { LineItem } from "@/shared/types/entities.types";

export type InvoiceStatus = "draft" | "sent" | "partially_paid" | "paid" | "overdue";

export interface Invoice {
    _id: ID;
    user?: ID;
    customer: ID | Customer;
    invoiceNumber: string;
    issueDate: string;
    dueDate: string;
    items: LineItem[];
    status: InvoiceStatus;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
    quote?: string | Quote;
    totals: {
        subtotal: number;
        tax: number;
        total: number;
    };
}

export interface InvoiceCreate {
    customer: ID;
    invoiceNumber: string;
    issueDate: string;
    dueDate: string;
    items: LineItem[];
    notes?: string;
    quote?: string;
}

export type InvoiceUpdate = Partial<Pick<Invoice, "items" | "notes" | "dueDate">>;
