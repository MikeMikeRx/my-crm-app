import { useState, useEffect, useCallback } from "react";
import { listPayments } from "@/api/payments";
import { listCustomers } from "@/api/customers";
import type { Payment } from "@/types/entities";
import { handleError } from "@/utils/handleError";
import { useCrudModal } from "@/hooks/useCrudModal";
import type { FilterValues } from "@/components/FilterBar";

const PAGE_SIZE = 20;

export function usePayments() {
    const modal = useCrudModal<Payment>();
    const [data, setData] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [applied, setApplied] = useState<FilterValues>({});
    const [draft, setDraft] = useState<FilterValues>({});
    const [customerOptions, setCustomerOptions] = useState<{ value: string; label: string }[]>([]);

    const load = useCallback(async (p: number, f: FilterValues) => {
        setLoading(true);
        try {
            const res = await listPayments({ page: p, limit: PAGE_SIZE, ...f });
            setData(res.data);
            setTotal(res.pagination.total);
        } catch (e) {
            handleError(e, "Failed to load payments");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load(1, {});
        listCustomers({ limit: 500 }).then(res =>
            setCustomerOptions(res.data.map(c => ({ value: c._id, label: c.company || c.name })))
        );
    }, [load]);

    const handleApply = () => {
        setApplied(draft);
        setPage(1);
        load(1, draft);
    };

    const handleClear = () => {
        setDraft({});
        setApplied({});
        setPage(1);
        load(1, {});
    };

    const handlePageChange = (p: number) => {
        setPage(p);
        load(p, applied);
    };

    const reload = () => load(page, applied);

    return {
        modal,
        data,
        loading,
        page,
        total,
        PAGE_SIZE,
        draft,
        setDraft,
        customerOptions,
        handleApply,
        handleClear,
        handlePageChange,
        reload,
    };
}
