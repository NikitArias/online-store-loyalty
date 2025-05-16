import { useCallback, useEffect, useState } from "react";
import "../styles/Cart.css";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

function Cart() {
    const { cart, setCart } = useCart();
    const { token } = useAuth();
    const API_URL = process.env.REACT_APP_API_URL;
    const [order, setOrder] = useState(null);
    const [cartError, setCartError] = useState("");
    const [showCleanCartModal, setShowCleanCartModal] = useState(false);
    const [notification, setNotification] = useState("");
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [, setIsInitialLoad] = useState(true);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [appliedBonusTitle, setAppliedBonusTitle] = useState(null);

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

    const fetchCart = useCallback(async (isFirstLoad = false) => {

        if (!token) {
            setCart([]);
            setOrder(null);
            setLoading(false);
            return;
        }

        if (isFirstLoad) {
            setLoading(true);
        }

        try {
            const response = await fetch(`${API_URL}/orders/user/cart`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                credentials: "include",
            });

            if (response.ok) {
                const text = await response.text();
                const data = text ? JSON.parse(text) : null;
                const activeOrder = data?.order;
                const orderAmount = data?.orderAmount;

                if (activeOrder) {
                    const productIds = activeOrder.items.map(item => item.product.id).join(",");
                    const priceResponse = await fetch(`${API_URL}/products/user?ids=${productIds}`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        credentials: "include"
                    });
                    activeOrder.final_price = orderAmount;

                    if (priceResponse.ok) {
                        const prices = await priceResponse.json();

                        const updatedItems = activeOrder.items.map(item => {
                            const updatedProduct = prices.find(p => p.id === item.product.id);
                            if (!updatedProduct) return item;

                            const newPrice = updatedProduct.price * item.quantity;

                            return {
                                ...item,
                                oldPrice: item.oldPrice ?? item.price,
                                price: updatedProduct.price,
                                newTotalPrice: newPrice
                            };
                        });

                        setCart(updatedItems);
                    }
                    setOrder(activeOrder || null);
                    setAppliedBonusTitle(data.appliedBonusTitle)
                }
                else {
                    setCart([]);
                    setOrder(null);
                    if (!isFirstLoad) {
                        setNotification("Корзина очищена");
                        setTimeout(() => {
                            setNotification("");
                        }, 4000);
                    }
                }
            } else {
                console.error("Ошибка загрузки корзины");
            }
        } catch (error) {
            console.error("Ошибка загрузки корзины: ", error);
        } finally {
            if (isFirstLoad) {
                setLoading(false);
                setIsInitialLoad(false);
            }
        }
    }, [API_URL, token, setCart]);

    useEffect(() => {
        fetchCart(true);
    }, [fetchCart, token]);

    const placeOrder = async () => {
        try {
            const response = await fetch(`${API_URL}/orders/sent`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                credentials: "include",
            });

            if (response.ok) {
                setCart([]);
                setOrder(null);
                setNotification("Заказ оформлен");

                setTimeout(() => { navigate("/orders") }, 2000);
            } else {
                const errorMessege = await response.text();
                alert(errorMessege);
            }
        } catch (error) {
            console.error("Ошибка оформления заказа: ", error);
        }
    };

    const deleteOrder = async (id) => {
        setShowCleanCartModal(false);

        try {
            const response = await fetch(`${API_URL}/orders/${id}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                credentials: "include",
            });

            if (response.ok) {
                setCart([]);
                setOrder(null);
                setNotification("Корзина очищена");

                setTimeout(() => setNotification(""), 4000);
            } else {
                const errorMessege = await response.text();
                alert(errorMessege);
            }
        } catch (error) {
            console.error("Ошибка очистки заказа: ", error);
        }
    };

    const updateQuantity = async (productId, newQuantity) => {
        if (newQuantity < 1) return decreaseItem(productId);

        try {
            const response = await fetch(`${API_URL}/orders/items/${productId}/${newQuantity}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                credentials: "include",
            });

            if (response.ok) {
                fetchCart();
                setCartError(prevError => ({ ...prevError, [productId]: "" }));
            } else {
                const errorMessege = await response.text();
                setCartError(prevError => ({ ...prevError, [productId]: errorMessege }));
            }
        } catch (error) {
            console.error("Ошибка обновления количества товара: ", error);
        }
    };

    const decreaseItem = async (productId) => {
        try {
            const response = await fetch(`${API_URL}/orders/items/${productId}/decrease`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                credentials: "include",
            });

            if (response.ok) {
                fetchCart();
            } else {
                console.error("Ошибка уменьшения количества товара")
            }
        } catch (error) {
            console.error("Ошибка уменьшения количества товара: ", error);
        }
    }

    const removeItem = async (productId) => {
        try {
            const response = await fetch(`${API_URL}/orders/items/${productId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                credentials: "include",
            });

            if (response.ok) {
                fetchCart();
            } else {
                setCartError("Ошибка удаления товара");
            }
        } catch (error) {
            console.error("Ошибка удаления товара: ", error);
        }
    };

    const totalAmount = cart.reduce((sum, item) => sum + (item.newTotalPrice || item.price * item.quantity), 0);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Загрузка корзины...</p>
            </div>
        );
    }

    return (
        <>
            <div className="cart-container">
                <h2>Корзина</h2>
                {!isOnline ? (
                    <p className="offline-message">Нет подключения к интернету</p>
                ) : cart.length === 0 ? (
                    <p>Корзина пуста</p>
                ) : (
                    <div className="product-grid">
                        {cart.map(item => (
                            <div key={item.product.id} className="product-card">
                                <img src={item.product.image} alt={item.product.name} />
                                <h3>{item.product.name}</h3>
                                <p>
                                    {(item.oldPrice && item.oldPrice > item.newTotalPrice) ? (
                                        <>
                                            <span className="old-price">{item.oldPrice} ₽</span>
                                            <span className="new-price"> {item.newTotalPrice} ₽</span>
                                            <span className="price-change">(-{item.oldPrice - item.newTotalPrice} ₽)</span>
                                        </>
                                    ) : (
                                        <span>{item.newTotalPrice} ₽</span>
                                    )}
                                </p>
                                <div className="cart-actions">
                                    <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>-</button>
                                    <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 1)}
                                    />
                                    <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>+</button>
                                    <button onClick={() => removeItem(item.product.id)}>Удалить</button>
                                </div>
                                {cartError[item.product.id] && (
                                    <p className="error">
                                        {cartError[item.product.id]}
                                        <span className="close-error" onClick={() => setCartError("")}>✕</span>
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                {isOnline && (cart.length > 0 && (
                    <>
                        <div className="total-amount">
                            {order && order.finalPrice && order.finalPrice < totalAmount ? (
                                <>
                                    <h3>
                                        Итого: <span className="old-total">{totalAmount.toFixed(2)} ₽</span>
                                        <span className="new-total">{order.finalPrice.toFixed(2)} ₽</span>
                                    </h3>
                                    <p className="discount-info">
                                        Скидка {Math.round((1 - order.finalPrice / totalAmount) * 100)}% благодаря награде: <strong>{appliedBonusTitle}</strong>
                                    </p>
                                </>
                            ) : (
                                <h3>Итого: {totalAmount.toFixed(2)} ₽</h3>
                            )}
                        </div>

                        <button className="place-order" onClick={placeOrder}>
                            Оформить заказ
                        </button>
                        <button className="cancel-order" onClick={() => setShowCleanCartModal(true)}>
                            Очистить корзину
                        </button>
                    </>
                ))}
            </div>
            {showCleanCartModal && (
                <div className="common-modal-overlay">
                    <div className="common-modal">
                        <p>Вы уверены, что хотите очистить корзину?</p>
                        <div className="common-modal-buttons">
                            <button className="common-modal-confirm" onClick={() => deleteOrder(order.id)}>
                                Очистить корзину
                            </button>
                            <button className="common-modal-cancel" onClick={() => setShowCleanCartModal(false)}>
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

export default Cart;