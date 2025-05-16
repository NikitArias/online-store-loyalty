import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "../styles/Orders.css";
import { createPortal } from "react-dom";

function Orders() {
    const [orders, setOrders] = useState([]);
    const [expandedOrders, setExpandedOrders] = useState({});
    const [reviewModal, setReviewModal] = useState({ isOpen: false, product: null });
    const [reviewText, setReviewText] = useState("");
    const [reviewRating, setReviewRating] = useState(5);

    const { token } = useAuth();
    const API_URL = process.env.REACT_APP_API_URL;
    const navigate = useNavigate();
    const [confirmationModal, setConfirmationModal] = useState({
        isOpen: false,
        message: "",
        confirmText: "",
        onConfirm: () => { },
        id: null,
    });
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

    const toggleOrderDetails = (orderId) => {
        setExpandedOrders(prev => ({
            ...prev,
            [orderId]: !prev[orderId],
        }));
    };

    const fetchOrders = useCallback(async () => {
        if (!token) {
            setOrders([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/orders/user`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                credentials: "include",
            });

            if (response.ok) {
                const data = await response.json();

                const ordersList = data.map(o => ({
                    ...o.order,
                    orderAmount: o.orderAmount
                }));

                setOrders(ordersList);
            } else {
                console.error("Ошибка загрузки заказов");
            }
        } catch (error) {
            console.error("Ошибка загрузки заказов: ", error);
        } finally {
            setLoading(false);
        }
    }, [API_URL, token]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const submitReview = async () => {
        if (!reviewModal.product) return;

        try {
            const response = await fetch(
                `${API_URL}/reviews/product/${reviewModal.product.id}?rating=${reviewRating}&comment=${encodeURIComponent(reviewText)}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    credentials: "include",
                });

            if (response.ok) {
                setReviewRating(5);
                setReviewText("");
                setReviewModal({ isOpen: false, product: null });
                await fetchOrders();

                // setTimeout(() => {
                //     setOrders(prev => [...prev]);
                // }, 100);

                setNotification("Отзыв добавлен");

                setTimeout(() => setNotification(""), 4000);
            } else {
                console.error("Ошибка отправки отзыва");
            }
        } catch (error) {
            console.error("Ошибка отправки отзыва", error);
        }
    };

    const deleteOrder = async (orderId) => {
        if (!orderId) return;

        try {
            const response = await fetch(`${API_URL}/orders/${orderId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                credentials: "include",
            });

            if (response.ok) {
                fetchOrders();
                setNotification("Заказ удален");

                setTimeout(() => setNotification(""), 4000);
            } else {
                const errorMessege = await response.text();
                alert(errorMessege);
            }
        } catch (error) {
            console.error("Ошибка удаления заказа", error);
        }
    };

    const cancelOrder = async (orderId) => {
        if (!orderId) return;

        try {
            const response = await fetch(`${API_URL}/orders/cancel/${orderId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                credentials: "include",
            });

            if (response.ok) {
                fetchOrders();
                setNotification("Заказ отменен");

                setTimeout(() => setNotification(""), 4000);
            } else {
                const errorMessege = await response.text();
                alert(errorMessege);
            }
        } catch (error) {
            console.error("Ошибка отмены заказа: ", error);
        }
    };

    const getStatusText = (status) => {
        const statuses = {
            PROCESSING: "В обработке",
            SENT: "Отправлен",
            DELIVERED: "Доставлен",
            CANCELLED: "Отменен"
        };
        return statuses[status] || status;
    };

    const getStatusClass = (status) => {
        switch (status) {
            case "PROCESSING":
                return "status-processing";
            case "SENT":
                return "status-sent";
            case "DELIVERED":
                return "status-delivered";
            case "CANCELLED":
                return "status-cancelled";
            default:
                return "";
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

    const deleteReview = async (productId) => {
        if (!productId) return;

        try {
            const response = await fetch(`${API_URL}/reviews/product/${productId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                credentials: "include",
            });

            if (response.ok) {
                fetchOrders();
                setNotification("Отзыв удален");

                setTimeout(() => setNotification(""), 4000);
            } else {
                setNotification("Ошибка удаления отзыва");
            }
        } catch (error) {
            console.error("Ошибка удаления отзыва", error);
        }
    }

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Загрузка заказов...</p>
            </div>
        );
    }

    const getTotalAmount = (items) =>
        items.reduce((sum, item) => sum + (item.newTotalPrice || item.price), 0);

    return (
        <>
            <div className="orders-container">
                <h2>Мои заказы</h2>
                {!isOnline ? (
                    <p className="offline-message">Нет подключения к интернету</p>
                ) : Array.isArray(orders) && orders.length === 0 ? (
                    <p>У вас пока нет заказов</p>
                ) : (
                    <ul className="orders-list">
                        {orders?.map(order => {
                            const totalAmount = getTotalAmount(order.orderItems);

                            return (
                                <li key={order.id} className="order-item">
                                    <span className={getStatusClass(order.status)}>
                                        Заказ №{order.id}, Статус: {getStatusText(order.status)},
                                        Время обновления: {formatDate(order.updatedAt)},
                                        {" "}
                                        {order.finalPrice !== null && order.finalPrice !== undefined ? (
                                            order.finalPrice < totalAmount ? (
                                                <>
                                                    <span className="order-old-total">{totalAmount.toFixed(2)} ₽</span>{" "}
                                                    <strong>{order.finalPrice.toFixed(2)} ₽</strong>{" "}
                                                    <span className="order-discount-info">
                                                        (Скидка {Math.round((1 - order.finalPrice / totalAmount) * 100)}%)
                                                    </span>
                                                </>
                                            ) : (
                                                <strong>Общая сумма заказа: {order.finalPrice.toFixed(2)} ₽</strong>
                                            )
                                        ) : (
                                            <strong>
                                                Общая сумма заказа:{" "}
                                                {order.orderItems.reduce(
                                                    (total, item) => total + (item.newTotalPrice || item.price * item.quantity),
                                                    0
                                                ).toFixed(2)} ₽
                                            </strong>
                                        )}
                                    </span>

                                    {order.status === "PROCESSING" && (
                                        <button className="view-button" onClick={() => navigate("/cart")}>
                                            Посмотреть
                                        </button>
                                    )}

                                    {order.status === "SENT" && (
                                        <button className="cancel-order-button" onClick={() => setConfirmationModal({
                                            isOpen: true,
                                            message: "Вы уверены, что хотите отменить этот заказ?",
                                            confirmText: "Отменить заказ",
                                            onConfirm: cancelOrder,
                                            id: order.id,
                                        })}>
                                            Отменить заказ
                                        </button>
                                    )}

                                    {order.status === "CANCELLED" && (
                                        <button className="delete-order-button" onClick={() => setConfirmationModal({
                                            isOpen: true,
                                            message: "Вы уверены, что хотите удалить этот заказ?",
                                            confirmText: "Удалить заказ",
                                            onConfirm: deleteOrder,
                                            id: order.id,
                                        })}>
                                            Удалить
                                        </button>
                                    )}

                                    {["SENT", "DELIVERED", "CANCELLED"].includes(order.status) && (
                                        <button className="details-button" onClick={() => toggleOrderDetails(order.id)}>
                                            {expandedOrders[order.id] ? "Скрыть" : "Подробнее"}
                                        </button>
                                    )}

                                    {expandedOrders[order.id] && (
                                        <div className="product-grid">
                                            {order.orderItems.map(item => (
                                                <div key={`${order.id}-${item.product.id}`} className="product-card">
                                                    <img src={item.product.image} alt={item.product.name} />
                                                    <h3>{item.product.name}</h3>
                                                    <p>{item.price} ₽</p>
                                                    <p>Количество: {item.quantity} шт.</p>

                                                    {order.status === "DELIVERED" && (
                                                        item.product.review ? (
                                                            <div className="review-section">
                                                                <p><strong>Ваш отзыв:</strong></p>
                                                                <p>Рейтинг: ⭐{item.product.review.rating}⭐</p>
                                                                <p className={item.product.review.comment ? "comment" : "no-comment"}>
                                                                    {item.product.review.comment || "Комментарий отсутствует"}
                                                                </p>
                                                                <button
                                                                    className="delete-review-button"
                                                                    onClick={() => setConfirmationModal({
                                                                        isOpen: true,
                                                                        message: "Вы уверены, что хотите удалить этот отзыв?",
                                                                        confirmText: "Удалить отзыв",
                                                                        onConfirm: deleteReview,
                                                                        id: item.product.id
                                                                    })}
                                                                >
                                                                    Удалить отзыв
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                className="add-review-button"
                                                                onClick={() => setReviewModal({ isOpen: true, product: item.product })}
                                                            >
                                                                Оставить отзыв
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}

                {reviewModal.isOpen && createPortal(
                    <div className="review-modal">
                        <div className="modal-content">
                            <h3>Отзыв о {reviewModal.product.name}</h3>
                            <label>Рейтинг:</label>
                            <select value={reviewRating} onChange={(e) => setReviewRating(Number(e.target.value))}>
                                {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            <label>Комментарий:</label>
                            <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)}></textarea>
                            <div className="modal-buttons">
                                <button onClick={submitReview}>Отправить</button>
                                <button onClick={() => {
                                    setReviewText("");
                                    setReviewRating(5);
                                    setReviewModal({ isOpen: false, product: null });
                                }}>Отмена</button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
            </div>

            {confirmationModal.isOpen && (
                <div className="common-modal-overlay">
                    <div className="common-modal">
                        <p>{confirmationModal.message}</p>
                        <div className="common-modal-buttons">
                            <button className="common-modal-confirm" onClick={() => {
                                confirmationModal.onConfirm(confirmationModal.id);
                                setConfirmationModal({ isOpen: false, message: "", confirmText: "", onConfirm: () => { }, id: null });
                            }}>
                                {confirmationModal.confirmText}
                            </button>
                            <button className="common-modal-cancel" onClick={() => setConfirmationModal({ isOpen: false, message: "", confirmText: "", onConfirm: () => { }, id: null })}>
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

export default Orders;