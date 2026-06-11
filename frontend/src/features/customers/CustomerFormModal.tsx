import { Modal, Form, Input, Button } from "antd";
import { Controller } from "react-hook-form";
import type { Customer } from "@/features/customers/customer.types";
import { useCustomerForm } from "./useCustomerForm";

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editing: Customer | null;
}

const CUSTOMER_FIELDS = ["name", "email", "phone", "company", "address"] as const;

export default function CustomerFormModal({ open, onClose, onSuccess, editing }: Props) {
    const { control, errors, onSubmit } = useCustomerForm({ editing, onClose, onSuccess });

    return (
        <Modal
            open={open}
            title={editing ? "Edit Customer" : "New Customer"}
            onCancel={onClose}
            footer={null}
            destroyOnHidden
        >
            <Form layout="vertical" onFinish={onSubmit}>
                {CUSTOMER_FIELDS.map((field) => (
                    <Form.Item
                        key={field}
                        label={field.charAt(0).toLocaleUpperCase() + field.slice(1)}
                        validateStatus={errors[field] ? "error" : ""}
                        help={errors[field]?.message}
                    >
                        <Controller
                            name={field}
                            control={control}
                            render={({ field }) => <Input {...field} />}
                        />
                    </Form.Item>
                ))}
                <Button type="primary" htmlType="submit" block>
                    {editing ? "Update" : "Create"}
                </Button>
            </Form>
        </Modal>
    );
}
