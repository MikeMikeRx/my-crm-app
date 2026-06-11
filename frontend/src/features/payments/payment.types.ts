import type { ID } from "@/shared/types/common.types";
import type { Customer } from "@/features/customers/customer.types";
import type { Invoice } from "@/features/invoices/invoice.types";

export type PaymentMethod = "bank_transfer" | "card" | "cash" | "paypal";
export type PaymentStatus = "completed" | "failed" | "pending";

export interface Payment {
    _id: ID;
    paymentId?: string;
    user?: ID;
    invoice: ID | (Invoice & { customer?: Customer });
    amount: number;
    paymentMethod: PaymentMethod;
    paymentDate?: string;
    dueDate?: string;
    status: PaymentStatus;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface PaymentCreate {
    paymentId: string;
    invoice: ID;
    amount: number;
    paymentMethod: PaymentMethod;
    paymentDate?: string;
    dueDate?: string;
    notes?: string;
}

export type PaymentUpdate = Partial<Pick<Payment, "amount" | "paymentMethod" | "paymentDate" | "dueDate" | "notes">>;
