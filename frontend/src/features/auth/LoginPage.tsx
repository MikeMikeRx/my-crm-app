import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, Checkbox, Form, Input } from "antd";
import Logo from "@/assets/images/logo/Logo.png";
import { useLogin, loginSchema, registerSchema } from "./useLogin";
import type { FormValues } from "./auth.types";

export default function LoginPage() {
    const { isRegisterMode, loading, onSubmit, toggleMode } = useLogin();

    const { control, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
        resolver: zodResolver(isRegisterMode ? registerSchema : loginSchema) as never,
        defaultValues: { name: "", email: "", password: "", isAdmin: false },
    });

    useEffect(() => {
        reset({ name: "", email: "", password: "", isAdmin: false });
    }, [isRegisterMode, reset]);

    return (
        <div style={{ display: "flex", minHeight: "100vh" }}>
            {/* Left - Logo */}
            <div style={{
                width: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#ffffffff",
                padding: "2rem",
            }}>
                <img src={Logo} alt="Logo" style={{ maxWidth: "600px", width: "100%", height: "auto", marginBottom: "3rem" }} />
            </div>

            {/* Right - Login/Sign up Form */}
            <div style={{
                width: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#ffffff",
                padding: "2rem",
            }}>
                <div style={{ width: "100%", maxWidth: "500px" }}>
                    <Card title={isRegisterMode ? "Create Account" : "Login"} style={{ boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}>
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
                                            <Input {...field} placeholder="Johnny Depp" />
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
                                        <Input {...field} placeholder="you@example.com" />
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
                                        <Input.Password {...field} placeholder="••••••••" />
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

                            <div style={{ textAlign: "center", marginTop: "1rem" }}>
                                <span style={{ color: "#666" }}>
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
