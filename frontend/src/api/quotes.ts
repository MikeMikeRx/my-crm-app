import { api } from "./client";
import type { Quote, QuoteCreate, QuoteUpdate, ID } from "@/types/entities";

export async function listQuotes(): Promise<Quote[]> {
  const { data } = await api.get<Quote[]>("/quotes");
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

// Note: derived fields (e.g., totals/status/expiry) are computed by the backend.
