import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "../styles/AdminDashboard.css";

function AdminDashboard() {
    const { token } = useAuth();
    const [stats, setStats] = useState({
        productCount: 0,
        usersCount: 0,
        orders: {
            processing: 0,
            sent: 0,
            delivered: 0,
            cancelled: 0,
            totalSales: 0
        }
    });

    const API_URL = process.env.REACT_APP_API_URL;
    const [loading, setLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [productsRes, usersRes, ordersRes] = await Promise.all([
                    fetch(`${API_URL}/admin/stats/product-count`, { headers: { "Authorization": `Bearer ${token}` } }),
                    fetch(`${API_URL}/admin/stats/users-count`, { headers: { "Authorization": `Bearer ${token}` } }),
                    fetch(`${API_URL}/admin/stats/orders`, { headers: { "Authorization": `Bearer ${token}` } })
                ]);

                setLoading(true);

                if (!productsRes.ok || !usersRes.ok || !ordersRes.ok) {
                    throw new Error("Ошибка загрузки статистики");
                }

                const [productCount, usersCount, ordersData] = await Promise.all([
                    productsRes.json(),
                    usersRes.json(),
                    ordersRes.json()
                ]);

                setStats({ productCount, usersCount, orders: ordersData });
            } catch (error) {
                console.error("Ошибка загрузки статистики", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [API_URL, token]);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Загрузка...</p>
            </div>
        );
    }

    return (

        <div className="admin-dashboard">
            <h1>Админ-панель</h1>
            {!isOnline ? (
                <p className="offline-message">Нет подключения к интернету</p>
            ) : (
                <div className="dashboard-grid">
                    <div className="dashboard-card">
                        <h3>Товары</h3>
                        <p>{stats.productCount}</p>
                    </div>
                    <div className="dashboard-card">
                        <h3>Пользователи</h3>
                        <p>{stats.usersCount}</p>
                    </div>
                    <div className="dashboard-card">
                        <h3>Заказы</h3>
                        <p>
                            В обработке: {stats.orders.processing} <br />
                            Отправлено: {stats.orders.sent} <br />
                            Доставлено: {stats.orders.delivered} <br />
                            Отменено: {stats.orders.cancelled}
                        </p>
                    </div>
                    <div className="dashboard-card">
                        <h3>Общая сумма продаж</h3>
                        <p>{stats.orders.totalSales.toLocaleString()} ₽</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminDashboard;