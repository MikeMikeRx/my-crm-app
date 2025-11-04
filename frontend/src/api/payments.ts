import { api } from "./client";
import type { Payment, PaymentCreate, PaymentStatus, ID } from "@/types/entities";

export async function listPayments(): Promise<Payment[]> {
    const { data } = await api.get<Payment[]>("/payments");
    return data;
}

export async function createPayment(payload: PaymentCreate): Promise<Payment> {
    const { data } = await api.post<Payment>("/payments", payload);
    return data;    
}

export async function updatePayment(id: ID, status: PaymentStatus): Promise<Payment> {
    const { data } = await api.patch<Payment>(`/payments/${id}`, { status });
    return data;
}