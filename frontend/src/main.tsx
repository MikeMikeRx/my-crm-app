import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { App, ConfigProvider } from "antd";
import { router } from "@/routes";
import { useAuthStore } from "./context/authStore.ts";
import { setGlobalNotification } from "./utils/globalNotification";
import "antd/dist/reset.css";
import "@/index.css";

//Testing -----------------------------------
if (import.meta.env.DEV) {
  (window as any).useAuthStore = useAuthStore;
}
//-------------------------------------------

function Bootstrap() {
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const { notification } = App.useApp();

  React.useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  React.useEffect(() => {
    setGlobalNotification(notification);
  }, [notification]);

  return <RouterProvider router={router} />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider>
      <App>
        <Bootstrap />
      </App>
    </ConfigProvider>
  </React.StrictMode>
);