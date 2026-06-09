export default function SectionHeader({ title, color, centered = false, separator = false }: { title: string; color: string; centered?: boolean; separator?: boolean }) {
    return (
        <div style={{ marginBottom: separator ? 0 : 42 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: centered ? "center" : "flex-start", gap: 10, marginBottom: separator ? 16 : 0 }}>
                <div style={{ width: 4, height: 22, borderRadius: 2, backgroundColor: color, flexShrink: 0 }} />
                <span style={{ fontSize: 15, fontWeight: 700, color: "#111827", letterSpacing: "-0.01em" }}>
                    {title}
                </span>
            </div>
            {separator && <div style={{ borderBottom: "1px solid #f0f0f0", marginBottom: 28 }} />}
        </div>
    );
}
