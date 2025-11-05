import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "@/routes";
import { useAuthStore } from "./context/authStore.ts";
import "antd/dist/reset.css";
import "@/index.css";

function Bootsrap() {
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  React.useEffect(() => { fetchProfile(); }, [fetchProfile]);
  return <RouterProvider router={router} />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Bootsrap />
  </React.StrictMode>
);