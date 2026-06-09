import { api } from "./client";
import type { Invoice, InvoiceCreate, InvoiceUpdate, InvoiceStatus, ID, PaginatedResponse } from "@/shared/types/entities";

export type InvoiceListParams = {
  page?: number;
  limit?: number;
  status?: string;
  from?: string;
  to?: string;
  customer?: string;
};

export async function listInvoices(params?: InvoiceListParams): Promise<PaginatedResponse<Invoice>> {
  const { data } = await api.get<PaginatedResponse<Invoice>>("/invoices", { params });
  return data;
}

export async function getInvoice(id: ID): Promise<Invoice> {
  const { data } = await api.get<{ data: Invoice }>(`/invoices/${id}`);
  return data.data;
}

export async function createInvoice(payload: InvoiceCreate): Promise<Invoice> {
  const { data } = await api.post<{ data: Invoice }>("/invoices", payload);
  return data.data;
}

export async function updateInvoice(id: ID, payload: InvoiceUpdate): Promise<Invoice> {
  const { data } = await api.put<{ data: Invoice }>(`/invoices/${id}`, payload);
  return data.data;
}

export async function transitionInvoiceStatus(id: ID, status: InvoiceStatus): Promise<Invoice> {
  const { data } = await api.patch<{ data: Invoice }>(`/invoices/${id}/status`, { status });
  return data.data;
}

// NOTE: Invoice deletion is intentionally not exposed in the frontend API.
