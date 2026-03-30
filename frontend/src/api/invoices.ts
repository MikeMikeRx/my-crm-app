import { api } from "./client";
import type { Invoice, InvoiceCreate, InvoiceUpdate, InvoiceStatus, ID, PaginatedResponse } from "@/types/entities";

export async function listInvoices(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Invoice>> {
  const { data } = await api.get<PaginatedResponse<Invoice>>("/invoices", { params });
  return data;
}

export async function getInvoice(id: ID): Promise<Invoice> {
  const { data } = await api.get<Invoice>(`/invoices/${id}`);
  return data;
}

export async function createInvoice(payload: InvoiceCreate): Promise<Invoice> {
  const { data } = await api.post<Invoice>("/invoices", payload);
  return data;
}

export async function updateInvoice(id: ID, payload: InvoiceUpdate): Promise<Invoice> {
  const { data } = await api.put<Invoice>(`/invoices/${id}`, payload);
  return data;
}

export async function transitionInvoiceStatus(id: ID, status: InvoiceStatus): Promise<Invoice> {
  const { data } = await api.patch<Invoice>(`/invoices/${id}/status`, { status });
  return data;
}

// NOTE: Invoice deletion is intentionally not exposed in the frontend API.
