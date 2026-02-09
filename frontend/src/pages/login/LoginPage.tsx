import { useForm, Controller } from "react-hook-form";
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, Checkbox, Form, Input, message } from "antd";
import { useAuthStore } from "@/context/authStore";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { handleError } from "@/utils/handleError";
import Logo from "@/assets/images/logo/Logo.png"

const loginSchema = z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    isAdmin: z.boolean().optional(),
});

type FormValues = {
    name?: string;
    email: string;
    password: string;
    isAdmin?: boolean;
};

export default function LoginPage () {
    const [mode, setMode] = useState<"login" | "register">("login");
    const isRegisterMode = mode === "register";

    const { control, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
        resolver: zodResolver(isRegisterMode ? registerSchema : loginSchema) as any,
        defaultValues: { name: "", email: "", password: "", isAdmin: false },
    });

    const navigate = useNavigate();
    const { login, register, user, loading } = useAuthStore();

    useEffect(() => {
        if (user) navigate("/", { replace: true });
    }, [user, navigate]);

    useEffect(() => {
        reset({ name: "", email: "", password: "", isAdmin: false });
    }, [mode, reset]);

    const onSubmit = async (values: FormValues) => {
        try {
            if (isRegisterMode) {
                if (!values.name) {
                    message.error("Name is required");
                    return;
                }
                const role = values.isAdmin ? "admin" : undefined;
                await register(values.name, values.email, values.password, role);
                message.success("Account created successfully!");
                navigate("/", { replace: true });
            } else {
                await login(values.email, values.password);
                message.success("Login successful");
                navigate("/", { replace: true });
            }
        } catch (e) {
            handleError(e, isRegisterMode ? "Registration failed" : "Login failed");
        }
    };

    const toggleMode = () => {
        setMode(mode === "login" ? "register" : "login");
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Left - Logo */}
            <div style={{
                width: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#ffffffff',
                padding: '2rem'
            }}>
                <img src={Logo} alt="Logo" style={{ maxWidth: '600px', width: '100%', height: 'auto', marginBottom: '3rem' }} />
            </div>

            {/* Right - Login/Sign up Form */}
            <div style={{
                width: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#ffffff',
                padding: '2rem'
            }}>
                <div style={{ width: '100%', maxWidth: '500px' }}>
                    <Card title={isRegisterMode ? "Create Account" : "Login"} style={{ boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
                        <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
                            {isRegisterMode && (
                                <Form.Item
                                    label="Name"
                                    validateStatus={errors.name ? "error" : ""}
                                    help={errors.name?.message}
                                >
                                    <Controller
                                        name="name"
                                        control={control}
                                        render={({ field }) => (
                                            <Input { ...field } placeholder="Johnny Depp" />
                                        )}
                                    />
                                </Form.Item>
                            )}

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

                            {isRegisterMode && (
                                <Form.Item>
                                    <Controller
                                        name="isAdmin"
                                        control={control}
                                        render={({ field }) => (
                                            <Checkbox
                                                checked={field.value}
                                                onChange={field.onChange}
                                            >
                                                Register as Admin
                                            </Checkbox>
                                        )}
                                    />
                                </Form.Item>
                            )}

                            <Button type="primary" htmlType="submit" block loading={loading} disabled={loading}>
                                {isRegisterMode ? "Sign Up" : "Sign In"}
                            </Button>

                            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                                <span style={{ color: '#666' }}>
                                    {isRegisterMode ? "Already have an account? " : "Don't have an account? "}
                                </span>
                                <Button type="link" onClick={toggleMode} style={{ padding: 0 }}>
                                    {isRegisterMode ? "Sign in" : "Sign up"}
                                </Button>
                            </div>
                        </Form>
                    </Card>
                </div>
            </div>
        </div>
    );
}