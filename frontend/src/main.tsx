import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "@/routes";
import { App, ConfigProvider } from "antd";
import { useAuthStore } from "@/features/auth/authStore";
import { setGlobalNotification } from "@/shared/notifications/globalNotification";
import MobileBlock from "@/shared/components/mobile-block/MobileBlock";
import "antd/dist/reset.css";
import "@/index.css";

//Testing -----------------------------------
if (import.meta.env.DEV) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).useAuthStore = useAuthStore;
}
//-------------------------------------------

// eslint-disable-next-line react-refresh/only-export-components
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
      <MobileBlock>
        <App>
          <Bootstrap />
        </App>
      </MobileBlock>
    </ConfigProvider>
  </React.StrictMode>
);