import { api } from "./client";
import type { Payment, PaymentCreate, PaymentUpdate, ID, PaginatedResponse } from "@/types/entities";

export type PaymentListParams = {
  page?: number;
  limit?: number;
  status?: string;
  from?: string;
  to?: string;
  customer?: string;
};

export async function listPayments(params?: PaymentListParams): Promise<PaginatedResponse<Payment>> {
  const { data } = await api.get<PaginatedResponse<Payment>>("/payments", { params });
  return data;
}

export async function getPayment(id: ID): Promise<Payment> {
  const { data } = await api.get<Payment>(`/payments/${id}`);
  return data;
}

export async function createPayment(payload: PaymentCreate): Promise<Payment> {
  const { data } = await api.post<Payment>("/payments", payload);
  return data;
}

export async function updatePayment(id: ID, payload: PaymentUpdate): Promise<Payment> {
  const { data } = await api.put<Payment>(`/payments/${id}`, payload);
  return data;
}
