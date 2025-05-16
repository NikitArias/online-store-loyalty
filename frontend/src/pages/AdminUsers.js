import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "../styles/AdminUsers.css";
import { createPortal } from "react-dom";

function AdminUsers() {
    const { token } = useAuth();
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedUserEmail, setSelectedUserEmail] = useState("");
    const [reviews, setReviews] = useState([]);
    const API_URL = process.env.REACT_APP_API_URL;
    const [showDeleteReviewModal, setShowDeleteReviewModal] = useState({
        isOpen: false,
        userId: null,
        productId: null,
        onConfirm: () => { },
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

    const fetchUsers = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/admin/users`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error("Ошибка загрузки пользователей");
            setUsers(await response.json());
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [API_URL, token]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const fetchReviews = async (userId, email) => {
        try {
            const response = await fetch(`${API_URL}/admin/reviews/user/${userId}`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error("Ошибка загрузки отзывов");
            const reviewsData = await response.json();

            const updatedReviews = await Promise.all(reviewsData.map(async (review) => {
                const productId = review.id?.productId;
                if (!productId) return { ...review, productName: "Неизвестный товар", image: null };

                try {
                    const productResponse = await fetch(`${API_URL}/products/user/${productId}`);
                    if (!productResponse) throw new Error();
                    const product = await productResponse.json();

                    return { ...review, productName: product.name, image: product.image || null };
                } catch (error) {
                    return { ...review, productName: "Неизвестный товар", image: null };
                }
            }));

            setReviews(updatedReviews);
            setSelectedUser(userId);
            setSelectedUserEmail(email);
        } catch (error) {
            console.error(error);
        }
    };

    const toggleBlockUser = async (id, blocked) => {
        try {
            const response = await fetch(`${API_URL}/admin/users/${id}/block`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (response.ok) {
                setUsers(users.map(user =>
                    user.id === id ? { ...user, isBlocked: !blocked } : user
                ));
                await fetchUsers();
            } else {
                setNotification("Ошибка блокировки пользователя");

                setTimeout(() => setNotification(""), 4000);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const deleteReview = async (userId, productId) => {
        if (!userId || !productId) return;

        try {
            const response = await fetch(`${API_URL}/admin/reviews/${userId}/${productId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (response.ok) {
                setReviews(reviews.filter(review => review.id.productId !== productId));
                setNotification("Отзыв удален");

                setTimeout(() => setNotification(""), 4000);
            } else {
                setNotification("Ошибка удаления отзыва");
                setTimeout(() => setNotification(""), 4000);
            }
        } catch (error) {
            console.error("Ошибка удаления отзыва", error);
        }
    };

    const confirmDeleteReview = (userId, productId) => {
        setShowDeleteReviewModal({
            isOpen: true,
            userId,
            productId,
            onConfirm: deleteReview,
        });
    };

    function formatDate(dateString) {
        const options = { day: "numeric", month: "long", year: "numeric" };
        return new Date(dateString).toLocaleDateString("ru-RU", options);
    }

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
            <div className="admin-users-container">
                <h1 className="admin-h1">Управление пользователями</h1>
                {!isOnline ? (
                    <p className="offline-message">Нет подключения к интернету</p>
                ) : (
                    <table className="admin-users-table">
                        <thead>
                            <tr>
                                <th className="admin-users-th">ID</th>
                                <th className="admin-users-th">Email</th>
                                <th className="admin-users-th">Имя</th>
                                <th className="admin-users-th">Телефон</th>
                                <th className="admin-users-th">Адрес</th>
                                <th className="admin-users-th">Статус</th>
                                <th className="admin-users-th">Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td className="admin-users-td">{user.id}</td>
                                    <td className="admin-users-td">{user.email}</td>
                                    <td className="admin-users-td">{user.name}</td>
                                    <td className="admin-users-td">{user.phone || "-"}</td>
                                    <td className="admin-users-td">{user.address || "-"}</td>
                                    <td className="admin-users-td">{user.blocked ? "Заблокирован" : "Активен"}</td>
                                    <td className="admin-users-td">
                                        <div className="admin-users-actions">
                                            <button
                                                className={user.blocked ? "admin-users-unblock-button" : "admin-users-block-button"}
                                                onClick={() => toggleBlockUser(user.id, user.blocked)}
                                            >
                                                {user.blocked ? "Разблокировать" : "Заблокировать"}
                                            </button>
                                            <button className="admin-users-reviews-button" onClick={() => fetchReviews(user.id, user.email)}>
                                                Отзывы
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {selectedUser && (
                    <div className="admin-reviews-modal">
                        <div className="admin-reviews-content">
                            <h2>Отзывы пользователя #{selectedUser} ({selectedUserEmail})</h2>
                            {reviews.length === 0 ? <p className="admin-users-p">Нет отзывов</p> : (
                                <ul>
                                    {reviews.map(review => (
                                        <li className="admin-users-li" key={`${selectedUser}-${review.id.productId}`}>
                                            {review.image && <img src={review.image} alt={review.productName} className="review-image" />}
                                            <div className="admin-users-review-header">
                                                <strong className="admin-users-product-name">{review.productName || "Неизвестный товар"}</strong>
                                                <span>Оценка: ⭐{review.rating}⭐</span>
                                                <span className={review.comment ? "comment" : "no-comment"}>
                                                    {review.comment || "Комментарий отсутствует"}
                                                </span>

                                                <span className="review-users-date">{formatDate(review.createdAt)}</span>
                                            </div>
                                            <button
                                                className="admin-users-delete-button"
                                                onClick={() => confirmDeleteReview(selectedUser, review.id.productId)}
                                            >
                                                Удалить отзыв
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <button className="admin-users-close-button" onClick={() => setSelectedUser(null)}>Закрыть</button>
                        </div>
                    </div>
                )}
            </div>

            {showDeleteReviewModal.isOpen && (
                <div className="common-modal-overlay">
                    <div className="common-modal">
                        <p>Вы уверены, что хотите удалить этот отзыв?</p>
                        <div className="common-modal-buttons">
                            <button className="common-modal-confirm" onClick={() => {
                                showDeleteReviewModal.onConfirm(showDeleteReviewModal.userId, showDeleteReviewModal.productId);
                                setShowDeleteReviewModal({ isOpen: false, userId: null, productId: null, onConfirm: () => { } });
                            }}>
                                Удалить
                            </button>
                            <button className="common-modal-cancel" onClick={() => setShowDeleteReviewModal({ isOpen: false, userId: null, productId: null, onConfirm: () => { } })}>
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

export default AdminUsers;