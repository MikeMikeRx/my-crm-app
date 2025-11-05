import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/context/authStore";
import { Spin } from "antd";

export default function ProtectedRoute() {
    const { user, initialized } = useAuthStore();

    if (!initialized) return <div className="flex justify-center p-10"><Spin /></div>;
    if (!user) return <Navigate to="login" replace />;
    return <Outlet />;
}