import { api } from "./client";
import type { ID } from "@/shared/types/common.types";
import type { PaginatedResponse } from "@/shared/types/api.types";
import type { Customer, CustomerCreate, CustomerUpdate } from "@/features/customers/customer.types";

export type CustomerListParams = {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
};

export async function listCustomers(params?: CustomerListParams): Promise<PaginatedResponse<Customer>> {
  const { data } = await api.get<PaginatedResponse<Customer>>("/customers", { params });
  return data;
}

export async function getCustomer(id: ID): Promise<Customer> {
  const { data } = await api.get<{ data: Customer }>(`/customers/${id}`);
  return data.data;
}

export async function createCustomer(payload: CustomerCreate): Promise<Customer> {
  const { data } = await api.post<{ data: Customer }>("/customers", payload);
  return data.data;
}

export async function updateCustomer(id: ID, payload: CustomerUpdate): Promise<Customer> {
  const { data } = await api.put<{ data: Customer }>(`/customers/${id}`, payload);
  return data.data;
}

export async function deleteCustomer(id: ID): Promise<{ message: string }> {
  const { data } = await api.delete<{ message: string }>(`/customers/${id}`);
  return data;
}
