import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import LoginPage from "@/pages/login/LoginPage";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import CustomersPage from "@/pages/customers/CustomersPage";
import QuotesPage from "@/pages/quotes/QuotesPage";
import InvoicesPage from "@/pages/invoices/InvoicesPage";
import PaymentsPage from "@/pages/payments/PaymentsPage";

export const router = createBrowserRouter([
    { path: "/login", element: <LoginPage /> },
    {
        element: <ProtectedRoute />,
        children: [
            {
                element: <AppLayout />,
                children: [
                    { index: true, element: <DashboardPage /> },
                    { path: "/customers", element: <CustomersPage /> },
                    { path: "/quotes", element: <QuotesPage /> },
                    { path: "/invoices", element: <InvoicesPage /> },
                    { path: "/payments", element: <PaymentsPage /> },
                ],
            },
        ],
    },
]);