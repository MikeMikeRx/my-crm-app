export default function SectionHeader({ title, color }: { title: string; color: string }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 42 }}>
            <div style={{ width: 4, height: 22, borderRadius: 2, backgroundColor: color, flexShrink: 0 }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: "#111827", letterSpacing: "-0.01em" }}>
                {title}
            </span>
        </div>
    );
}
