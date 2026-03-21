export const calcQuoteTotal = (quote) => {
    const items = quote.items || [];
    const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const tax = items.reduce((s, i) => s + (i.quantity * i.unitPrice * (i.taxRate || 0)) / 100, 0);
    return subtotal + tax;
};
