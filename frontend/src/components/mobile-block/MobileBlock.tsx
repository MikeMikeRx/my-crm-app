import { useEffect, useState } from "react";

export default function MobileBlock({
  minWidth = 1024,
  children,
}: {
  minWidth?: number;
  children: React.ReactNode;
}) {
  const [ok, setOk] = useState(true);

  useEffect(() => {
    const check = () => setOk(window.innerWidth >= minWidth);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [minWidth]);

  if (!ok) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
        <div style={{ maxWidth: 520 }}>
          <h1 style={{ fontSize: 22, marginBottom: 12 }}>Desktop only</h1>
          <p style={{ marginBottom: 16 }}>
            This demo is not optimized for mobile screens yet. Please open it on a desktop or tablet (≥ {minWidth}px).
          </p>
          <p style={{ opacity: 0.8 }}>
            Tip: rotate to landscape or use a wider device.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
