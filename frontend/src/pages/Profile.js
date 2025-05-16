import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "../styles/Profile.css";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { createPortal } from "react-dom";

function Profile() {
    const { user, token, logout } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [, setError] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [formData, setFormData] = useState({ name: user?.name || "", phone: user?.phone || "+7 ", address: user?.address || "" });
    const [passwords, setPasswords] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
    const [passwordError, setPasswordError] = useState(null);
    const [passwordVisible, setPasswordVisible] = useState({ old: false, new: false, confirm: false });
    const [reviews, setReviews] = useState([]);
    const [showReviews, setShowReviews] = useState(false);
    const navigate = useNavigate();
    const API_URL = process.env.REACT_APP_API_URL;
    const [formErrors, setFormErrors] = useState({});
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showDeleteReviewModal, setShowDeleteReviewModal] = useState({ isOpen: false, productId: null });
    const [notification, setNotification] = useState("");
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
        if (!user || !token) return;

        const fetchProfile = async () => {
            try {
                const response = await fetch(`${API_URL}/user/${user.id}`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (!response.ok) throw new Error("Ошибка загрузки профиля");
                const data = await response.json();
                setProfile({
                    ...data,
                    phone: formatPhoneNumber(data.phone)
                });
                setFormData({
                    name: data.name,
                    phone: formatPhoneNumber(data.phone),
                    address: data.address
                });
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user, token, API_URL, setError]);

    useEffect(() => {
        if (!user) return;
        setFormData({
            name: user.name,
            phone: formatPhoneNumber(user.phone || "+7 "),
            address: user.address
        });
    }, [user]);

    const formatPhoneNumber = (value) => {
        let cleaned = value.replace(/\D/g, "");
        if (cleaned.startsWith("8")) {
            cleaned = "7" + cleaned.slice(1);
        }
        if (cleaned.length > 11) {
            cleaned = cleaned.slice(0, 11);
        }

        let formatted = "+7";
        if (cleaned.length > 1) formatted += ` (${cleaned.slice(1, 4)}`;
        if (cleaned.length > 4) formatted += `) ${cleaned.slice(4, 7)}`;
        if (cleaned.length > 7) formatted += `-${cleaned.slice(7, 9)}`;
        if (cleaned.length > 9) formatted += `-${cleaned.slice(9, 11)}`;

        return formatted;
    };

    const cleanPhoneNumber = (formattedPhone) => {
        return formattedPhone.replace(/\D/g, "");
    };

    const handleLogout = () => {
        logout();
        setShowLogoutModal(false);
        navigate("/");
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === "phone") {
            setFormData((prev) => ({ ...prev, phone: formatPhoneNumber(value) }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handlePasswordChange = (e) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
    };

    const togglePasswordVisibility = (field) => {
        setPasswordVisible((prev) => ({ ...prev, [field]: !prev[field] }));
    };

    const saveProfile = async () => {
        setFormErrors({ name: "", phone: "", address: "" });

        if (!formData.name.trim()) {
            setFormErrors((prev) => ({ ...prev, name: "Имя не может быть пустым" }));
            return;
        }
        if (!formData.phone.trim() || formData.phone.length !== 18) {
            setFormErrors((prev) => ({ ...prev, phone: "Некорректный номер телефона" }));
            return;
        }
        if (!formData.address.trim()) {
            setFormErrors((prev) => ({ ...prev, address: "Адрес не может быть пустым" }));
            return;
        }

        const cleanedPhone = cleanPhoneNumber(formData.phone);
        if (
            formData.name === profile.name &&
            cleanedPhone === cleanPhoneNumber(profile.phone) &&
            formData.address === profile.address
        ) {
            setNotification("Изменений нет");
            setEditMode(false);
            setTimeout(() => setNotification(""), 4000);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/user/update`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    phone: cleanedPhone
                })
            });

            if (!response.ok) throw new Error("Ошибка обновления профиля");
            setProfile({ ...profile, ...formData, phone: formatPhoneNumber(cleanedPhone) });
            setEditMode(false);
            setNotification("Профиль обновлен");
            setTimeout(() => setNotification(""), 4000);
        } catch (error) {
            setError(error.message);
        }
    };

    const changePassword = async () => {
        if (!passwords.oldPassword.trim() || !passwords.newPassword.trim() || !passwords.confirmPassword.trim()) {
            setPasswordError("Заполните все поля");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/user/password`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    oldPassword: passwords.oldPassword,
                    newPassword: passwords.newPassword
                })
            });

            const result = await response.text();

            if (!response.ok) {
                setPasswordError(result);
                return;
            }

            if (passwords.oldPassword === passwords.newPassword) {
                setPasswordError("Старый и новый пароли не могут совпадать");
                return;
            }

            if (passwords.newPassword !== passwords.confirmPassword) {
                setPasswordError("Новый пароль и подтверждение не совпадают");
                return;
            }

            setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
            setPasswordError(null);
            setNotification("Пароль успешно изменен");
            setShowPasswordForm(false);

            setTimeout(() => setNotification(""), 4000);
        } catch (error) {
            setPasswordError("Произошла ошибка при смене пароля");
        }
    };

    const fetchReviews = async () => {
        try {
            const response = await fetch(`${API_URL}/reviews/user`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("Ошибка загрузки отзывов");
            const reviews = await response.json();

            if (!Array.isArray(reviews) || reviews.length === 0) {
                setNotification("Вы пока не оставляли отзывов")
                setReviews([]);

                setTimeout(() => setNotification(""), 4000);
                return;
            }

            await fetchProductDetails(reviews);
            setShowReviews(true);
        } catch (error) {
            setError(error.message);
        }
    };

    const fetchProductDetails = async (reviews) => {
        const updatedReviews = await Promise.all(reviews.map(async (review) => {
            const productId = review.id?.productId;
            if (!productId) return { ...review, productName: "Неизвестный товар", image: null };

            try {
                const response = await fetch(`${API_URL}/products/user/${productId}`);
                if (!response.ok) throw new Error();
                const product = await response.json();

                return { ...review, productName: product.name, image: product.image || null };
            } catch {
                return { ...review, productName: "Неизвестный товар", image: null };
            }
        }));

        setReviews(updatedReviews);
    };

    const deleteReview = async () => {
        if (!showDeleteReviewModal.productId) return;
        setShowDeleteReviewModal({ isOpen: false, productId: null });

        try {
            const response = await fetch(`${API_URL}/reviews/product/${showDeleteReviewModal.productId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                credentials: "include",
            });

            if (response.ok) {
                setNotification("Отзыв удален");
                setReviews((prevReviews) => prevReviews.filter(review => review.id.productId !== showDeleteReviewModal.productId));
                setShowReviews(true);

                setTimeout(() => setNotification(""), 4000);
            } else {
                console.error("Ошибка удаления отзыва");
            }
        } catch (error) {
            console.error("Ошибка удаления отзыва", error);
        }
    }

    function formatDate(dateString) {
        const options = { day: "numeric", month: "long", year: "numeric" };
        return new Date(dateString).toLocaleDateString("ru-RU", options);
    }

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Загрузка профиля...</p>
            </div>
        );
    }

    return (
        <>
            <div className="profile-container">
                <h2>Профиль</h2>
                {!showPasswordForm ? (
                    editMode ? (
                        <>
                            <label>Имя:
                                <input type="text" name="name" title="Ваше имя" value={formData.name} onChange={handleInputChange} />
                            </label>
                            {formErrors.name && <p className="error">{formErrors.name}
                                <span className="close-error" onClick={() => setFormErrors("")}>✕</span></p>}
                            <label>Телефон:
                                <input type="text" name="phone" title="Ваш номер телефона" value={formData.phone} onChange={handleInputChange} />
                            </label>
                            {formErrors.phone && <p className="error">{formErrors.phone}
                                <span className="close-error" onClick={() => setFormErrors("")}>✕</span></p>}
                            <label>Адрес:
                                <input type="text" name="address" title="Ваш адрес" value={formData.address} onChange={handleInputChange} />
                            </label>
                            {formErrors.address && <p className="error">{formErrors.address}
                                <span className="close-error" onClick={() => setFormErrors("")}>✕</span></p>}
                            <button className="btn save" onClick={saveProfile}>Сохранить</button>
                            <button className="btn cancel-button" onClick={() => { setEditMode(false) }}>Отмена</button>
                            <button className="btn password" onClick={() => {
                                setShowPasswordForm(true);
                                setEditMode(false);
                                setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
                            }}>Сменить пароль</button>
                        </>
                    ) : (
                        <>
                            {isOnline ? (
                                profile ? (
                                    <>
                                        <p><strong>Имя: </strong> {profile?.name}</p>
                                        <p><strong>Email: </strong> {profile?.email}</p>
                                        <p><strong>Телефон: </strong> {profile?.phone}</p>
                                        <p><strong>Адрес: </strong> {profile?.address}</p>
                                    </>
                                ) : (
                                    <div className="loading-container">
                                        <div className="loading-spinner"></div>
                                        <p>Загрузка данных...</p>
                                    </div>
                                )
                            ) : (
                                <p className="offline-message">Нет подключения к интернету</p>
                            )}
                            {isOnline && (
                                <>
                                    <button className="btn edit" onClick={() => {
                                        setFormData({
                                            name: profile.name,
                                            phone: profile.phone,
                                            address: profile.address
                                        });
                                        setEditMode(true);
                                    }}>Редактировать</button>
                                    <button className="btn reviews" onClick={(fetchReviews)}>Мои отзывы</button>
                                </>
                            )}

                        </>
                    )
                ) : (
                    <div className="password-form">
                        <h3>Смена пароля</h3>
                        <label>Старый пароль:
                            <div className="password-input">
                                <input
                                    type={passwordVisible.old ? "text" : "password"}
                                    name="oldPassword"
                                    placeholder="Старый пароль"
                                    title="Введите текущий пароль"
                                    autoComplete="off"
                                    value={passwords.oldPassword}
                                    onChange={handlePasswordChange}
                                    required />
                                <span className="eye-icon" onClick={() => togglePasswordVisibility("old")}>
                                    {passwordVisible.old ? <FaEyeSlash /> : <FaEye />}
                                </span>
                            </div>
                        </label>
                        <label>Новый пароль:
                            <div className="password-input">
                                <input
                                    type={passwordVisible.new ? "text" : "password"}
                                    name="newPassword"
                                    placeholder="Новый пароль"
                                    autoComplete="off"
                                    title="Введите новый пароль, содержащий не менее 6 символов, содержащий хотя бы 1 цифру и 1 букву"
                                    value={passwords.newPassword}
                                    onChange={handlePasswordChange}
                                    required />
                                <span className="eye-icon" onClick={() => togglePasswordVisibility("new")}>
                                    {passwordVisible.new ? <FaEyeSlash /> : <FaEye />}
                                </span>
                            </div>
                        </label>
                        <label>Подтвердите пароль:
                            <div className="password-input">
                                <input type={passwordVisible.confirm ? "text" : "password"}
                                    name="confirmPassword"
                                    placeholder="Введите новый пароль"
                                    autoComplete="off"
                                    title="Повторите новый пароль"
                                    value={passwords.confirmPassword}
                                    onChange={handlePasswordChange}
                                    required />
                                <span className="eye-icon" onClick={() => togglePasswordVisibility("confirm")}>
                                    {passwordVisible.confirm ? <FaEyeSlash /> : <FaEye />}
                                </span>
                            </div>
                        </label>
                        {passwordError && <p className="error">{passwordError}
                            <span className="close-error" onClick={() => setPasswordError("")}>✕</span></p>}
                        <button className="btn save" onClick={changePassword}>Сохранить</button>
                        <button className="btn cancel-button" onClick={() => {
                            setShowPasswordForm(false);
                            setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
                        }}>Отмена</button>
                    </div>
                )}

                {showReviews && (
                    <div className="reviews-container">
                        <div className="reviews-header">
                            <h3>Мои отзывы</h3>
                            <button className="btn close" onClick={() => setShowReviews(false)}>✖</button>
                        </div>
                        {reviews.length > 0 ? (
                            <ul className="profile-reviews-list">
                                {reviews.map((review) => (
                                    <li key={`${review.id.userId}-${review.id.productId}`} className="profile-review-item">
                                        {review.image && <img src={review.image} alt={review.productName} className="review-image" />}
                                        <div className="review-content">
                                            <p className="product-name"><strong>{review.productName || "Неизвестный товар"}</strong></p>
                                            <p className="rating"><strong>Рейтинг:</strong> ⭐{review.rating}⭐</p>
                                            <p className={review.comment ? "comment" : "no-comment"}>
                                                {review.comment || "Комментарий отсутствует"}
                                            </p>
                                            <p className="review-date">{formatDate(review.createdAt)}</p>
                                        </div>
                                        <button
                                            className="delete-review-button"
                                            onClick={() => setShowDeleteReviewModal({ isOpen: true, productId: review.id.productId })}>
                                            Удалить отзыв
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="no-reviews">Вы пока не оставляли отзывов</p>
                        )}
                    </div>
                )}

                <button className="logout-btn" onClick={() => setShowLogoutModal(true)}>Выйти</button>
            </div>

            {showLogoutModal && (
                <div className="common-modal-overlay">
                    <div className="common-modal">
                        <p>Вы точно хотите выйти из своего аккаунта?</p>
                        <div className="common-modal-buttons">
                            <button className="common-modal-confirm" onClick={handleLogout}>Выйти</button>
                            <button className="common-modal-cancel" onClick={() => setShowLogoutModal(false)}>Отмена</button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteReviewModal.isOpen && (
                <div className="common-modal-overlay">
                    <div className="common-modal">
                        <p>Вы уверены, что хотите удалить этот отзыв?</p>
                        <div className="common-modal-buttons">
                            <button className="common-modal-confirm" onClick={deleteReview}>
                                Удалить отзыв
                            </button>
                            <button className="common-modal-cancel" onClick={() => setShowDeleteReviewModal({ isOpen: false, productId: null })}>
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
};

export default Profile;