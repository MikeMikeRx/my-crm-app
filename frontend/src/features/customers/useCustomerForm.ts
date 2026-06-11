import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { message } from "antd";
import { createCustomer, updateCustomer } from "@/api/customers";
import type { Customer, CustomerCreate } from "@/features/customers/customer.types";
import { handleError } from "@/shared/utils/handleError";

const schema = z.object({
    name: z.string().min(2, "Name is required"),
    email: z.email().optional().or(z.literal("")),
    phone: z.string().optional(),
    company: z.string().optional(),
    address: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = { name: "", email: "", phone: "", company: "", address: "" };

interface Props {
    editing: Customer | null;
    onClose: () => void;
    onSuccess: () => void;
}

export function useCustomerForm({ editing, onClose, onSuccess }: Props) {
    const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: editing ?? emptyValues,
    });

    useEffect(() => {
        reset(editing ?? emptyValues);
    }, [editing, reset]);

    const onSubmit = async (values: FormValues) => {
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

    return { control, errors, onSubmit: handleSubmit(onSubmit) };
}
