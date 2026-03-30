import { api } from "./client";
import type { Quote, QuoteCreate, QuoteUpdate, ID, PaginatedResponse } from "@/types/entities";

export type QuoteListParams = {
  page?: number;
  limit?: number;
  status?: string;
  from?: string;
  to?: string;
  customer?: string;
};

export async function listQuotes(params?: QuoteListParams): Promise<PaginatedResponse<Quote>> {
  const { data } = await api.get<PaginatedResponse<Quote>>("/quotes", { params });
  return data;
}

export async function getQuote(id: ID): Promise<Quote> {
  const { data } = await api.get<Quote>(`/quotes/${id}`);
  return data;
}

export async function createQuote(payload: QuoteCreate): Promise<Quote> {
  const { data } = await api.post<Quote>("/quotes", payload);
  return data;
}

export async function updateQuote(id: ID, payload: QuoteUpdate): Promise<Quote> {
  const { data } = await api.put<Quote>(`/quotes/${id}`, payload);
  return data;
}

export async function deleteQuote(id: ID): Promise<{ message: string }> {
  const { data } = await api.delete<{ message: string }>(`/quotes/${id}`);
  return data;
}

export async function transitionQuoteStatus(id: ID, status: Quote["status"]): Promise<Quote> {
  const { data } = await api.patch<Quote>(`/quotes/${id}/status`, { status });
  return data;
}

// Note: derived fields (e.g., totals/status/expiry) are computed by the backend.
