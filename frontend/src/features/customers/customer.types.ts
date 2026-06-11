import type { ID } from "@/shared/types/common.types";

export interface Customer {
    _id: ID;
    user: ID;
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    address?: string;
    createdAt: string;
    updatedAt: string;
    __v?: number;
}

export type CustomerCreate = Pick<Customer, "name" | "email" | "phone" | "company" | "address">;
export type CustomerUpdate = Partial<CustomerCreate>;
