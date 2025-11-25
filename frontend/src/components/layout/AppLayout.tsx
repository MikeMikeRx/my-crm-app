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
                <div className="text-white text-center my-4 text-lg font-bold">My CRM</div>
                <Menu theme="dark" mode="inline" selectedKeys={[pathname]} items={menuItems} />
            </Sider>

            <Layout>
                <Header className="flex justify-end items-center bg-white shadow-sm px-6">
                    <button onClick={logout} className="flex items-center gap-2 text-red-600 hover:text-red-800">
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