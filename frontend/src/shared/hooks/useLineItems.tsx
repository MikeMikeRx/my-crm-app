import { useMemo } from "react";

import { Controller, useFieldArray, useWatch } from "react-hook-form";
import type { Control, FieldArrayPath, FieldValues, Path } from "react-hook-form";
import { Button, Input, InputNumber } from "antd";
import type { TableColumnsType } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { calcTotals } from "@/shared/utils/calcTotals";

type LineItemValue = {
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
};

type FormWithItems = FieldValues & { items: LineItemValue[] };

export function useLineItems<T extends FormWithItems>(control: Control<T>) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: "items" as FieldArrayPath<T>,
    });

    const rawItems = useWatch({
        control,
        name: "items" as Path<T>,
    }) as LineItemValue[] | undefined;

    const total = useMemo(() => calcTotals(rawItems ?? []).total, [rawItems]);

    const columns = useMemo<TableColumnsType<LineItemValue & { id: string }>>(() => [
        {
            title: "Description",
            dataIndex: "description",
            width: 130,
            render: (_, __, idx) => (
                <Controller
                    name={`items.${idx}.description` as Path<T>}
                    control={control}
                    render={({ field }) => (
                        <Input
                            value={field.value ?? ""}
                            placeholder="Description"
                            onChange={(e) => field.onChange(e.target.value)}
                        />
                    )}
                />
            ),
        },
        {
            title: "Qty",
            dataIndex: "quantity",
            width: 100,
            render: (_, __, idx) => (
                <Controller
                    name={`items.${idx}.quantity` as Path<T>}
                    control={control}
                    render={({ field }) => (
                        <InputNumber<number> value={field.value ?? 0} min={1} onChange={(v) => field.onChange(v ?? 1)} />
                    )}
                />
            ),
        },
        {
            title: "Price",
            dataIndex: "unitPrice",
            width: 100,
            render: (_, __, idx) => (
                <Controller
                    name={`items.${idx}.unitPrice` as Path<T>}
                    control={control}
                    render={({ field }) => (
                        <InputNumber<number> value={field.value ?? 0} min={0} onChange={(v) => field.onChange(v ?? 0)} />
                    )}
                />
            ),
        },
        {
            title: "Tax %",
            dataIndex: "taxRate",
            width: 100,
            render: (_, __, idx) => (
                <Controller
                    name={`items.${idx}.taxRate` as Path<T>}
                    control={control}
                    render={({ field }) => (
                        <InputNumber<number> value={field.value ?? 0} min={0} max={100} onChange={(v) => field.onChange(v ?? 0)} />
                    )}
                />
            ),
        },
        {
            title: "",
            width: 50,
            render: (_, __, idx) => (
                <Button icon={<DeleteOutlined />} onClick={() => remove(idx)} />
            ),
        },
    ], [control, remove]);

    return { fields, append, remove, columns, total };
}
