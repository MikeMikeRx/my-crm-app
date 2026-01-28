import { api } from "./client";
import type { ID } from "@/types/entities";

type ISODateString = string;

export interface StatusPreview {
  status: string;
  percentage: number;
}

export interface RecentItem {
  _id: ID;
  number: string;
  customer: ID;
  total: number;
  status: string;
  createdAt: ISODateString;
}

export interface InvoiceSummary {
  total: number;
  monthCount: number;
  monthSum: number;
  totalSum: number;
  overdue: number;
  unpaid: number;
  preview: StatusPreview[];
}

export interface QuoteSummary {
  total: number;
  monthCount: number;
  monthSum: number;
  totalSum: number;
  accepted: number;
  declined: number;
  expired: number;
  preview: StatusPreview[];
}

export interface PaymentSummary {
  total: number;
  monthCount: number;
  monthSum: number;
  totalSum: number;
  completed: number;
  failed: number;
  pending: number;
  dueBalance: number;
  preview: StatusPreview[];
}

export interface CustomerSummary {
  total: number;
  newCount: number;
  active: number;
  preview: StatusPreview[];
}

export interface CustomerDetail {
  _id: ID;
  name: string;
  email?: string;
  company?: string;
  isActive: boolean;
  quotes: number;
  invoices: number;
  payments: number;
  outstanding: number;
}

export interface DashboardSummary {
  invoices: InvoiceSummary;
  quotes: QuoteSummary;
  payments: PaymentSummary;
  customers: CustomerSummary;
  customerDetails: CustomerDetail[];
  customerMaxValues: {
    quotes: number;
    invoices: number;
    payments: number;
  };
  recentInvoices: RecentItem[];
  recentQuotes: RecentItem[];
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await api.get<DashboardSummary>("/dashboard/summary");
  return data;
}
