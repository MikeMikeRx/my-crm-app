import { api } from "./client";
import type { Customer, CustomerCreate, CustomerUpdate, ID } from "@/types/entities";

export async function listCustomers(): Promise<Customer[]> {
  const { data } = await api.get<Customer[]>("/customers");
  return data;
}

export async function getCustomer(id: ID): Promise<Customer> {
  const { data } = await api.get<Customer>(`/customers/${id}`);
  return data;
}

export async function createCustomer(payload: CustomerCreate): Promise<Customer> {
  const { data } = await api.post<Customer>("/customers", payload);
  return data;
}

export async function updateCustomer(id: ID, payload: CustomerUpdate): Promise<Customer> {
  const { data } = await api.put<Customer>(`/customers/${id}`, payload);
  return data;
}

export async function deleteCustomer(id: ID): Promise<{ message: string }> {
  const { data } = await api.delete<{ message: string }>(`/customers/${id}`);
  return data;
}
