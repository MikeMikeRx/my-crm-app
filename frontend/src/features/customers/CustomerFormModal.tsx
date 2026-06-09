import { useEffect } from "react";
import { Modal, Form, Input, Button, message } from "antd";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createCustomer, updateCustomer } from "@/api/customers";
import type { Customer, CustomerCreate } from "@/shared/types/entities";
import { handleError } from "@/shared/utils/handleError";

const schema = z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone: z.string().optional(),
    company: z.string().optional(),
    address: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editing: Customer | null;
}

const CUSTOMER_FIELDS = ["name", "email", "phone", "company", "address"] as const;

export default function CustomerFormModal({ open, onClose, onSuccess, editing }: Props) {
    const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: editing || { name: "", email: "", phone: "", company: "", address: ""},
    });

    useEffect(() => {
        reset(editing || { name: "", email: "", phone: "", company: "", address: ""})
    }, [editing, reset])

    const submit = async (values: FormValues) => {
        try {
            if (editing) {
                await updateCustomer(editing._id, values);
                message.success("Customer updated");
            } else {
                await createCustomer(values as CustomerCreate);
                message.success("Customer created");
            }
            onSuccess();
            onClose();
            reset();
        } catch (e) {
            handleError(e, editing ? "Failed to update customer" : "Failed to create customer");
        }
    };

    return (
        <Modal
            open={open}
            title={editing ? "Edit Customer" : "New Customer"}
            onCancel={onClose}
            footer={null}
            destroyOnHidden
        >
            <Form layout="vertical" onFinish={handleSubmit(submit)}>
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