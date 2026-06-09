import { useState, useCallback } from "react";

export function useCrudModal<T>() {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<T | null>(null);

    const startCreate = useCallback(() => {
        setEditing(null);
        setOpen(true);
    }, []);

    const startEdit = useCallback((record: T) => {
        setEditing(record);
        setOpen(true);
    }, []);

    const close = useCallback(() => {
        setOpen(false);
    }, []);

    return {
        open,
        editing,
        startCreate,
        startEdit,
        close,
        setOpen,
        setEditing,
    };
}