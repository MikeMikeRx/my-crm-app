import { Layout, Menu } from "antd";
import {
    DashboardOutlined,
    UserOutlined,
    FileTextOutlined,
    DollarOutlined,
    FileDoneOutlined,
    LogoutOutlined
} from "@ant-design/icons";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/context/authStore";
import Logo from "../../assets/images/logo/Logo-Dark-Long.png";

const { Header, Sider, Content } = Layout;

export default function AppLayout(){
    const { logout } = useAuthStore();
    const { pathname } = useLocation();

    const menuItems = [
        { key: "/", icon: <DashboardOutlined/>, label: <Link to="/">Dashboard</Link> },
        { key: "/customers", icon: <UserOutlined />, label: <Link to="/customers">Customers</Link> },
        { key: "/quotes", icon: <FileTextOutlined />, label: <Link to="/quotes">Quotes</Link> },
        { key: "/invoices", icon: <FileDoneOutlined />, label: <Link to="/invoices">Invoices</Link> },
        { key: "/payments", icon: <DollarOutlined />, label: <Link to="/payments">Payments</Link> },
    ];

    return (
        <Layout style={{ minHeight: "100vh" }}>
            <Sider theme="dark">
                <div style={{ marginTop: "20px", padding: "0 10px", marginBottom: "30px" }}>
                    <img src={Logo} alt="Vitesse Logo" style={{ width: "100%", height: "auto" }} />
                </div>
                <Menu theme="dark" mode="inline" selectedKeys={[pathname]} items={menuItems} />
            </Sider>

            <Layout>
                <Header style={{
                        background: "#001529",
                        padding: "0 24px",
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center" }}
                    >
                    <button
                        onClick={logout}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            color: "#ffff",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            fontWeight: 600,
                        }}
                    >
                        <LogoutOutlined /> Logout
                    </button>
                </Header>
                <Content className="p-6 bg-gray-50">
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
}