import { asyncHandler } from "../../utils/asyncHandler.js";
import Invoice from "../../models/Invoice.js";
import Quote from "../../models/Quote.js";
import Payment from "../../models/Payment.js";
import Customer from "../../models/Customer.js";
import { getInvoiceSummary } from "../../services/dashboard/getInvoiceSummary.js";
import { getQuoteSummary } from "../../services/dashboard/getQuoteSummary.js";
import { getPaymentSummary } from "../../services/dashboard/getPaymentSummary.js";
import { getCustomerSummary } from "../../services/dashboard/getCustomerSummary.js";

export const getDashboardSummary = asyncHandler(async (req, res) => {
    const [invoices, quotes, payments, customers] = await Promise.all([
        Invoice.find({ tenant: req.tenant.id }),
        Quote.find({ tenant: req.tenant.id }),
        Payment.find({ tenant: req.tenant.id }),
        Customer.find({ tenant: req.tenant.id }),
    ]);

    const { invoiceSummary, recentInvoices } = getInvoiceSummary(invoices);
    const { quoteSummary, recentQuotes } = getQuoteSummary(quotes);
    const { paymentSummary, paymentsByInvoice } = getPaymentSummary(payments, invoices);
    const { customerSummary, customerDetails } = getCustomerSummary(customers, invoices, quotes, payments, paymentsByInvoice);

    return res.json({
        invoices: invoiceSummary,
        quotes: quoteSummary,
        payments: paymentSummary,
        customers: customerSummary,
        customerDetails,
        customerMaxValues: {
            quotes: quotes.length,
            invoices: invoices.length,
            payments: payments.length,
        },
        recentInvoices,
        recentQuotes,
    });
});
