type LineItemLike = { quantity?: number; unitPrice?: number; taxRate?: number };

export function calcTotals(items: LineItemLike[] = []) {
    const subtotal = items.reduce((sum, i) => sum + (i.quantity || 0) * (i.unitPrice || 0), 0);
    const taxTotal = items.reduce((sum, i) => sum + (i.quantity || 0) * (i.unitPrice || 0) * ((i.taxRate || 0) / 100), 0);
    return { subtotal, taxTotal, total: subtotal + taxTotal };
}
