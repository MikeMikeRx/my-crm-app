export type ID = string;

export interface Customer {
    _id: ID;
    user: ID;
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    address?: string;
    createdAt: string;
    updatedAt: string;
    __v?:number; 
}

export type CustomerCreate = Pick<Customer, "name" | "email" | "phone" | "company" | "address">;
export type CustomerUpdate = Partial<Omit<CustomerCreate, never>>;

export interface LineItem {
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number; // (0-100%)
}

export type QuoteStatusUserSettable = "draft" | "sent" | "accepted" | "declined";
export type QuoteStatus = QuoteStatusUserSettable | "expired" | "converted";

export interface Quote {
    _id: ID;
    user: ID;
    customer: ID | Customer;
    quoteNumber: string;
    issueDate: string; // YYYY-MM-DD
    expiryDate?: string; // YYYY-MM-DD
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

export type InvoiceStatus = "unpaid" | "paid" | "overdue";

export interface Invoice {
    _id: ID;
    user?: ID;
    customer: ID | Customer;
    invoiceNumber: string;
    issueDate: string; // YYYY-MM-DD
    dueDate: string; // YYYY-MM-DD
    items: LineItem[];
    subtotal: number;
    taxTotal: number;
    total: number;
    status: InvoiceStatus;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
    quote?: string | Quote;
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

export type PaymentMethod = "bank_transfer" | "card" | "cash" | "paypal";
export type PaymentStatus = "completed" | "failed" | "pending";

export interface Payment {
    _id: ID;
    user?: ID;
    invoice: ID | (Invoice & { customer? : Customer });
    amount: number;
    paymentMethod: PaymentMethod;
    paymentDate?: string; // YYYY-MM-DD
    status: PaymentStatus;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface PaymentCreate {
    invoice: ID;
    amount: number;
    paymentMethod: PaymentMethod;
    paymentDate?: string;
    notes?: string;
}