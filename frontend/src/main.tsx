import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "@/routes";
import { useAuthStore } from "./context/authStore.ts";
import "antd/dist/reset.css";
import "@/index.css";

//Testing -----------------------------------
if (import.meta.env.DEV) {
  (window as any).useAuthStore = useAuthStore;
}
//-------------------------------------------

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