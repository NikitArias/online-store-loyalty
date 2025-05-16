import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext"
import "../styles/AdminOrders.css";
import { createPortal } from "react-dom";

function AdminOrders() {
    const { token } = useAuth();
    const [orders, setOrders] = useState([]);
    const [filterStatus, setFilterStatus] = useState("");
    const API_URL = process.env.REACT_APP_API_URL;
    const [orderStatusError, setOrderStatusError] = useState("");
    const [showDeleteOrderModal, setShowDeleteOrderModal] = useState({ isOpen: false, orderId: null });
    const [notification, setNotification] = useState("");
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
        fetch(`${API_URL}/admin/orders`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
            .then(response => response.json())
            .then(data => setOrders(data))
            .catch(err => console.error("Ошибка загрузки заказов", err))
            .finally(() => setLoading(false));
    }, [API_URL, token]);

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            const response = await fetch(`${API_URL}/admin/orders/${orderId}/status`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (response.ok) {
                setOrders(prev => prev.map(order =>
                    order.id === orderId ? { ...order, status: newStatus } : order
                ));

                setNotification(`Статус заказа №${orderId} изменен`);
            } else {
                const text = await response.text();
                setOrderStatusError(text);
            }
        } catch (error) {
            console.error("Ошбика: ", error);
        }
    };

    const handleDelete = async () => {
        if (!showDeleteOrderModal.orderId) return;
        setShowDeleteOrderModal({ isOpen: false, orderId: null });

        try {
            const response = await fetch(`${API_URL}/admin/orders/${showDeleteOrderModal.orderId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (response.ok) {
                setOrders(prev => prev.filter(order => order.id !== showDeleteOrderModal.orderId));

                setNotification("Заказ удален");

                setTimeout(() => setNotification(""), 4000);
            } else {
                console.error("Ошибка удаления заказа");
            }
        } catch (error) {
            console.error("Ошибка: ", error);
            setNotification("Ошибка при удалении заказа");

            setTimeout(() => setNotification(""), 4000);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString("ru-RU", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
    };

    const filteredOrders = filterStatus ? orders.filter(order => order.status === filterStatus) : orders;

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Загрузка...</p>
            </div>
        );
    }

    return (
        <>
            <div className="admin-orders-container">
                <h1 className="admin-h1">Управление заказами</h1>
                {!isOnline ? (
                    <p className="offline-message">Нет подключения к интернету</p>
                ) : (
                    <select className="admin-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                        <option value="">Все</option>
                        <option value="PROCESSING">В обработке</option>
                        <option value="SENT">Отправлен</option>
                        <option value="DELIVERED">Доставлен</option>
                        <option value="CANCELLED">Отменен</option>
                    </select>
                )}
                {orderStatusError && (
                    <div className="admin-orders-errors-container">
                        <p className="error">{orderStatusError}
                            <span className="close-error" onClick={() => setOrderStatusError("")}>✕</span></p>
                    </div>
                )}
                {isOnline && (
                    filteredOrders.length === 0 ? (
                        <p className="admin-p">Заказы отсутствуют</p>
                    ) : (
                        <table className="admin-orders-table">
                            <thead>
                                <tr>
                                    <th className="admin-th">ID</th>
                                    <th className="admin-th">Пользователь</th>
                                    <th className="admin-th">Сумма</th>
                                    <th className="admin-th">Статус</th>
                                    <th className="admin-th">Время обновления</th>
                                    <th className="admin-th">Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map(order => (
                                    <tr key={order.id}>
                                        <td className="admin-td">{order.id}</td>
                                        <td className="admin-td">{order.user.email}</td>
                                        {order.finalPrice !== null ? (
                                            <td className="admin-td">{order.finalPrice.toFixed(2)} ₽</td>
                                        ): (
                                            <td className="admin-td">{order.orderItems.reduce((total, item) => total + item.price, 0).toFixed(2)} ₽</td>
                                        )}
                                        <td className="admin-td">
                                            <select value={order.status} onChange={(e) => handleStatusChange(order.id, e.target.value)}>
                                                <option value="PROCESSING">В обработке</option>
                                                <option value="SENT">Отправлен</option>
                                                <option value="DELIVERED">Доставлен</option>
                                                <option value="CANCELLED">Отменен</option>
                                            </select>
                                        </td>
                                        <td className="admin-td">{formatDate(order.updatedAt)}</td>
                                        <td className="admin-td">
                                            {order.status === "PROCESSING" || order.status === "CANCELLED" ? (
                                                <button className="delete"
                                                    onClick={() => setShowDeleteOrderModal({ isOpen: true, orderId: order.id })}>
                                                    Удалить
                                                </button>
                                            ) : (
                                                "-"
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ))}
            </div>
            {showDeleteOrderModal.isOpen && (
                <div className="common-modal-overlay">
                    <div className="common-modal">
                        <p>Вы уверены, что хотите удалить заказ №{showDeleteOrderModal.orderId}?</p>
                        <div className="common-modal-buttons">
                            <button className="common-modal-confirm" onClick={handleDelete}>
                                Удалить заказ
                            </button>
                            <button className="common-modal-cancel" onClick={() => setShowDeleteOrderModal({ isOpen: false, orderId: null })}>
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {notification && createPortal(
                <div className="notification">{notification}</div>,
                document.body
            )}
        </>
    );
}

export default AdminOrders;