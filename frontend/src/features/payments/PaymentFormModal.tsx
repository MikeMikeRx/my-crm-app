import { Modal, Form, Input, InputNumber, DatePicker, Button, Select } from "antd";
import { Controller } from "react-hook-form";
import { toDayjs, formatFormDate } from "@/shared/utils/dateFormat";
import type { Payment } from "@/shared/types/entities";
import { usePaymentForm, PAYMENT_METHOD_OPTIONS } from "./usePaymentForm";

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editing: Payment | null;
}

export default function PaymentFormModal({ open, onClose, onSuccess, editing }: Props) {
    const {
        control, errors, isPendingMethod, invoiceOptions,
        remainingLabel, handleInvoiceChange, onSubmit,
    } = usePaymentForm({ open, editing, onClose, onSuccess });

    return (
        <Modal open={open} title={editing ? "Edit Payment" : "New Payment"} onCancel={onClose} footer={null} destroyOnHidden>
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
                <Form.Item layout="vertical" label="Invoice" validateStatus={errors.invoice ? "error" : ""}>
                    <Controller name="invoice" control={control} render={({ field }) => (
                        <Select
                            {...field}
                            placeholder="Select invoice"
                            disabled={!!editing}
                            options={invoiceOptions}
                            onChange={(invId) => handleInvoiceChange(invId, field.onChange)}
                        />
                    )} />
                </Form.Item>

                <Form.Item layout="vertical" label="Payment number" validateStatus={errors.paymentId ? "error" : ""} help={errors.paymentId?.message}>
                    <Controller name="paymentId" control={control} render={({ field }) => <Input {...field} readOnly />} />
                </Form.Item>

                <Form.Item layout="vertical" label={remainingLabel} validateStatus={errors.amount ? "error" : ""} help={errors.amount?.message}>
                    <Controller name="amount" control={control} render={({ field }) => <InputNumber {...field} min={0} className="w-full" />} />
                </Form.Item>

                <Form.Item layout="vertical" label="Method" validateStatus={errors.paymentMethod ? "error" : ""} help={errors.paymentMethod?.message}>
                    <Controller name="paymentMethod" control={control} render={({ field }) => (
                        <Select {...field} placeholder="Select method" options={PAYMENT_METHOD_OPTIONS} />
                    )} />
                </Form.Item>

                <Form.Item layout="vertical" label="Payment Date">
                    <Controller name="paymentDate" control={control} render={({ field }) => (
                        <DatePicker {...field} value={toDayjs(field.value)} onChange={(d) => field.onChange(d ? formatFormDate(d) : undefined)} />
                    )} />
                </Form.Item>

                {isPendingMethod && (
                    <Form.Item layout="vertical" label="Due Date" extra="Payment will remain pending until this date">
                        <Controller name="dueDate" control={control} render={({ field }) => (
                            <DatePicker {...field} value={toDayjs(field.value)} onChange={(d) => field.onChange(d ? formatFormDate(d) : undefined)} />
                        )} />
                    </Form.Item>
                )}

                <Form.Item layout="vertical" label="Notes">
                    <Controller name="notes" control={control} render={({ field }) => <Input.TextArea {...field} rows={3} />} />
                </Form.Item>

                <Button type="primary" htmlType="submit" block>
                    {editing ? "Update Payment" : "Add Payment"}
                </Button>
            </form>
        </Modal>
    );
}
