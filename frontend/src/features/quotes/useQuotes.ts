import { useState, useEffect } from "react";
import { message } from "antd";
import { listQuotes, deleteQuote } from "@/api/quotes";
import { listCustomers } from "@/api/customers";
import type { Quote } from "@/types/entities";
import { handleError } from "@/utils/handleError";
import { useCrudModal } from "@/hooks/useCrudModal";
import type { FilterValues } from "@/components/FilterBar";

const PAGE_SIZE = 20;

export function useQuotes() {
    const modal = useCrudModal<Quote>();
    const [data, setData] = useState<Quote[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [applied, setApplied] = useState<FilterValues>({});
    const [draft, setDraft] = useState<FilterValues>({});
    const [customerOptions, setCustomerOptions] = useState<{ value: string; label: string }[]>([]);

    const load = async (p = page, f = applied) => {
        setLoading(true);
        try {
            const res = await listQuotes({ page: p, limit: PAGE_SIZE, ...f });
            setData(res.data);
            setTotal(res.pagination.total);
        } catch (e) {
            handleError(e, "Failed to load quotes");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load(1, {});
        listCustomers({ limit: 500 }).then(res =>
            setCustomerOptions(res.data.map(c => ({ value: c._id, label: c.company || c.name })))
        );
    }, []);

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
        await deleteQuote(id);
        message.success("Quote deleted");
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
        customerOptions,
        handleApply,
        handleClear,
        handleDelete,
        handlePageChange,
        reload,
    };
}
