export function formatAmount(value: number | string | null | undefined): string {
    const n = Number(value);
    if(!isFinite(n)) return "0.00";
    return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(n);
}