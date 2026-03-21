import dayjs from "dayjs";
import { toPct } from "../../utils/dashboard/percentages.js";

export const getCustomerSummary = (customers, invoices, quotes, payments, paymentsByInvoice) => {
    const customerTotal = customers.length;

    const activeCustomerIds = new Set([
        ...invoices.map(inv => String(inv.customer)),
        ...quotes.map(q => String(q.customer)),
    ]);

    const customerNewThisMonth = customers.filter(c =>
        dayjs(c.createdAt).isSame(dayjs(), "month")
    ).length;

    const activeCustomers = customers.filter(c =>
        activeCustomerIds.has(String(c._id))
    ).length;

    const inactiveCustomers = customerTotal - activeCustomers;

    const customerSummary = {
        total: customerTotal,
        newCount: customerNewThisMonth,
        active: activeCustomers,
        preview: [
            { status: "active", percentage: toPct(activeCustomers, customerTotal) },
            { status: "inactive", percentage: toPct(inactiveCustomers, customerTotal) },
        ],
    };

    const customerDetails = customers.map(customer => {
        const customerId = String(customer._id);
        const isActive = activeCustomerIds.has(customerId);

        const customerQuotes = quotes.filter(q => String(q.customer) === customerId).length;
        const customerInvoices = invoices.filter(inv => String(inv.customer) === customerId);
        const customerInvoiceIds = customerInvoices.map(inv => String(inv._id));

        const customerPayments = payments.filter(p =>
            customerInvoiceIds.includes(String(p.invoice))
        ).length;

        const customerInvoiceTotals = customerInvoices.map(inv => ({
            id: String(inv._id),
            total: inv.totals?.total || 0,
        }));

        let customerOutstanding = 0;
        customerInvoiceTotals.forEach(inv => {
            const paid = paymentsByInvoice[inv.id] || 0;
            const remaining = inv.total - paid;
            if (remaining > 0) customerOutstanding += remaining;
        });

        return {
            _id: customer._id,
            name: customer.name,
            email: customer.email,
            company: customer.company,
            isActive,
            quotes: customerQuotes,
            invoices: customerInvoices.length,
            payments: customerPayments,
            outstanding: customerOutstanding,
        };
    });

    return { customerSummary, customerDetails };
};
