import { api } from "./client";
import type { Payment, PaymentCreate, ID } from "@/types/entities";

export async function listPayments(): Promise<Payment[]> {
  const { data } = await api.get<Payment[]>("/payments");
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

// NOTE: Payment update/delete operations are intentionally not exposed in the frontend.
