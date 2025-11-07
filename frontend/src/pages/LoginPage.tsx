import { useForm, Controller } from "react-hook-form";
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, Form, Input, message } from "antd";
import { useAuthStore } from "@/context/authStore";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { getApiError } from "@/api/client";

const schema = z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage () {
    const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema), defaultValues: { email: "", password: ""},
    });

    const navigate = useNavigate();
    const { login, user, loading } = useAuthStore();

    // if user already logged in => redirect
    useEffect(() => {
        if (user) navigate("/", { replace: true });
    }, [user, navigate]);

    const onSubmit = async (values: FormValues) => {
        try {
            await login(values.email, values.password);
            message.success("Login successful");
            navigate("/", { replace: true });
        } catch (e) {
            const { message: msg } = getApiError(e);
            message.error(msg);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            <Card title="Login" className="w-[350px] shadow-md">
                <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
                    <Form.Item
                        label="Email"
                        validateStatus={errors.email ? "error" : ""}
                        help={errors.email?.message}
                    >
                        <Controller
                            name="email"
                            control={control}
                            render={({ field }) => (
                                <Input { ...field } placeholder="you@example.com" />
                            )}
                        />   
                    </Form.Item>

                    <Form.Item
                        label="Password"
                        validateStatus={errors.password ? "error" : ""}
                        help={errors.password?.message}
                    >
                        <Controller
                            name="password"
                            control={control}
                            render={({ field }) => (
                                <Input.Password { ...field } placeholder="••••••••" />
                            )}
                        />
                    </Form.Item>

                    <Button type="primary" htmlType="submit" block loading={loading} disabled={loading}>
                        Sign In
                    </Button>
                </Form>
            </Card>
        </div>
    );
}