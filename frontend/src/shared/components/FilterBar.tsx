import { Button, DatePicker, Select, Space } from "antd";
import dayjs from "dayjs";

export type FilterValues = {
    status?: string;
    customer?: string;
    from?: string;
    to?: string;
};

type SelectOption = { value: string; label: string };

type FilterBarProps = {
    value: FilterValues;
    onChange: (v: FilterValues) => void;
    onApply: () => void;
    onClear: () => void;
    statusOptions?: SelectOption[];
    customerOptions?: SelectOption[];
    showDateRange?: boolean;
};

export default function FilterBar({
    value,
    onChange,
    onApply,
    onClear,
    statusOptions,
    customerOptions,
    showDateRange = true,
}: FilterBarProps) {
    return (
        <div style={{ marginBottom: 16, marginLeft: 15 }}>
            <Space wrap>
                {statusOptions && (
                    <Select
                        allowClear
                        placeholder="Status"
                        style={{ width: 160 }}
                        value={value.status}
                        onChange={(v) => onChange({ ...value, status: v })}
                        onClear={() => onChange({ ...value, status: undefined })}
                        options={statusOptions}
                    />
                )}
                {customerOptions && (
                    <Select
                        allowClear
                        showSearch
                        placeholder="Customer"
                        style={{ width: 200 }}
                        value={value.customer}
                        onChange={(v) => onChange({ ...value, customer: v })}
                        onClear={() => onChange({ ...value, customer: undefined })}
                        options={customerOptions}
                        filterOption={(input, opt) =>
                            (opt?.label as string ?? "").toLowerCase().includes(input.toLowerCase())
                        }
                    />
                )}
                {showDateRange && (
                    <>
                        <DatePicker
                            placeholder="From"
                            value={value.from ? dayjs(value.from) : null}
                            onChange={(_, s) => onChange({ ...value, from: (s as string) || undefined })}
                        />
                        <DatePicker
                            placeholder="To"
                            value={value.to ? dayjs(value.to) : null}
                            onChange={(_, s) => onChange({ ...value, to: (s as string) || undefined })}
                        />
                    </>
                )}
                <Button type="primary" onClick={onApply}>Apply</Button>
                <Button onClick={onClear}>Clear</Button>
            </Space>
        </div>
    );
}