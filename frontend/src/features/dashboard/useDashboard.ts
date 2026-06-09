import { useState, useEffect } from "react";
import { getDashboardSummary, type DashboardSummary } from "@/api/dashboard";
import { handleError } from "@/shared/utils/handleError";

export function useDashboard() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<DashboardSummary | null>(null);

    useEffect(() => {
        getDashboardSummary()
            .then((res) => setData(res))
            .catch((e) => handleError(e, "Failed to load dashboard"))
            .finally(() => setLoading(false));
    }, []);

    return { loading, data };
}
