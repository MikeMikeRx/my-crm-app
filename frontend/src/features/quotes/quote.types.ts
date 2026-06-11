import type { ID } from "@/shared/types/common.types";
import type { Customer } from "@/features/customers/customer.types";
import type { LineItem } from "@/shared/types/entities.types";

export type QuoteStatusUserSettable = "draft" | "sent" | "accepted" | "declined";
export type QuoteStatus = QuoteStatusUserSettable | "expired" | "converted";

export interface Quote {
    _id: ID;
    user: ID;
    customer: ID | Customer;
    quoteNumber: string;
    issueDate: string;
    expiryDate?: string;
    items: LineItem[];
    total: number;
    status: QuoteStatus;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface QuoteCreate {
    customer: ID;
    quoteNumber: string;
    issueDate: string;
    expiryDate?: string;
    status: QuoteStatus;
    items: LineItem[];
    notes?: string;
}

export type QuoteUpdate = Partial<Pick<Quote, "customer" | "quoteNumber" | "status" | "items" | "notes" | "issueDate" | "expiryDate">>;
