import { useState, useEffect, useCallback } from "react";

import { message } from "antd";

import { listCustomers, deleteCustomer } from "@/api/customers";
import { handleError } from "@/shared/utils/handleError";
import { useCrudModal } from "@/shared/hooks/useCrudModal";
import type { Customer } from "@/features/customers/customer.types";
import type { FilterValues } from "@/shared/components/FilterBar";

const PAGE_SIZE = 20;

export function useCustomers() {
    const modal = useCrudModal<Customer>();
    const [data, setData] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [applied, setApplied] = useState<FilterValues>({});
    const [draft, setDraft] = useState<FilterValues>({});

    const load = useCallback(async (p: number, f: FilterValues) => {
        setLoading(true);
        try {
            const res = await listCustomers({ page: p, limit: PAGE_SIZE, ...f });
            setData(res.data);
            setTotal(res.pagination.total);
        } catch (e) {
            handleError(e, "Failed to load customers");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(1, {}); }, [load]);

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

    const handleDelete = async (id: string) => {
        await deleteCustomer(id);
        message.success("Customer deleted");
        load(page, applied);
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
        handleApply,
        handleClear,
        handleDelete,
        handlePageChange,
        reload,
    };
}
