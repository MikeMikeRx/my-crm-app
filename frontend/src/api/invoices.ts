import { api } from "./client";
import type { Invoice, InvoiceCreate, InvoiceUpdate, ID } from "@/types/entities";

export async function listInvoices(): Promise<Invoice[]> {
    const { data } = await api.get<Invoice[]>("/invoices");
    return data;
}

export async function getInvoice(id: ID): Promise<Invoice> {
    const { data } = await api.get<Invoice>(`/invoices/${id}`);
    return data;
}

export async function createInvoice(payload: InvoiceCreate): Promise<Invoice> {
    const { data } = await api.post<Invoice>("/invoices", payload)
    return data;
}

export async function updateInvoice(id: ID, payload: InvoiceUpdate): Promise<Invoice> {
    const { data } = await api.put<Invoice>(`/invoices/${id}`, payload);
    return data;
}

export async function deleteInvoice(id: ID): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>(`/invoices/${id}`);
    return data;
}