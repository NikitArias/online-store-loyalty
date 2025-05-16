import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ProductCard.css";
import { useAuth } from "../context/AuthContext";
import { createPortal } from "react-dom";
import ReviewModal from "./ReviewModal";
import { useCart } from "../context/CartContext";

function ProductCard({ product }) {
    const navigate = useNavigate();
    const API_URL = process.env.REACT_APP_API_URL;
    const { user, token } = useAuth();

    const [cartQuantity, setCartQuantity] = useState(0);
    const [reviews, setReviews] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [averageRating, setAverageRating] = useState(null);
    const [productCardError, setProductCardError] = useState("");

    const { updateCart } = useCart();

    useEffect(() => {
        if (!user) return;

        const fetchCart = async () => {
            try {
                const response = await fetch(`${API_URL}/orders/user/cart`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const text = await response.text();
                    const data = text ? JSON.parse(text) : null;
                    const activeOrder = data?.order;
                    if (activeOrder) {
                        const foundItem = activeOrder.items.find(item => item.product.id === product.id);
                        setCartQuantity(foundItem ? foundItem.quantity : 0);
                    }
                }
            } catch (error) {
                console.error("Ошибка при проверке корзины: ", error);
            }
        };

        fetchCart();
    }, [product.id, user, API_URL, token]);

    useEffect(() => {
        if (!user) {
            setCartQuantity(0);
        }
    }, [user]);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const response = await fetch(`${API_URL}/reviews/${product.id}`);
                if (response.ok) {
                    const data = await response.json();
                    setReviews(data);
                    if (data.length > 0) {
                        const avg = data.reduce((sum, review) => sum + review.rating, 0) / data.length;
                        setAverageRating(avg.toFixed(1));
                    } else {
                        setAverageRating(null);
                    }
                }
            } catch (error) {
                console.error("Ошибка загрузки отзывов", error);
            }
        };

        fetchReviews();
    }, [product.id, API_URL]);

    const handleAddToCart = async () => {
        if (!user) {
            navigate("/login");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/orders/items/${product.id}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                setCartQuantity(prev => prev + 1);
                setProductCardError("");
                updateCart(token);
            } else {
                setProductCardError(response.text());
            }
        } catch (error) {
            console.error("Ошибка запроса: ", error);
        }
    };

    const handleIncreaseQuantity = async () => {
        await handleAddToCart();
    };

    const handleDecreaseQuantity = async () => {
        if (cartQuantity <= 0) return;

        try {
            const response = await fetch(`${API_URL}/orders/items/${product.id}/decrease`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                setCartQuantity(prev => Math.max(prev - 1, 0));
                setProductCardError("");
                updateCart(token);
            } else {
                setProductCardError("Ошибка при уменьшении количества");
            }
        } catch (error) {
            console.error("Ошибка запроса: ", error);
        }
    };

    const handleViewReviews = async () => {
        try {
            const response = await fetch(`${API_URL}/reviews/${product.id}`);
            if (response.ok) {
                const data = await response.json();
                setReviews(data);
                setIsModalOpen(true);
            } else {
                console.error("Ошибка загрузки отзывов");
            }
        } catch (error) {
            console.error("Ошибка запроса: ", error);
        }
    };

    return (
        <>
            <div className="product-card">
                <img src={product.image || "https://via.placeholder.com/150"} alt={product.name} />
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <p>Цена: {product.price}₽</p>
                {averageRating !== null ? (
                    <p className="product-rating">Рейтинг: ⭐{averageRating}⭐</p>
                ) : (
                    <p className="product-rating">Этот товар пока не оценивали</p>
                )}

                <div className="product-actions">
                    {cartQuantity > 0 ? (
                        <div className="cart-controls">
                            <button onClick={handleDecreaseQuantity}>-</button>
                            <span>{cartQuantity}</span>
                            <button onClick={handleIncreaseQuantity}>+</button>
                        </div>
                    ) : (
                        <button onClick={handleAddToCart} disabled={product.stockQuantity === 0}
                            className={product.stockQuantity === 0 ? "out-of-stock" : "add-to-cart"}>
                            {product.stockQuantity === 0 ? "Нет в наличии" : "В корзину"}
                        </button>
                    )}
                    <button onClick={handleViewReviews} className="view-reviews">Отзывы</button>
                </div>
                {productCardError && <p className="error">{productCardError}
                    <span className="close-error" onClick={() => setProductCardError("")}>✕</span></p>}
            </div >

            {isModalOpen && createPortal(
                <ReviewModal
                    reviews={reviews}
                    productName={product.name}
                    onClose={() => setIsModalOpen(false)} />,
                document.body
            )}
        </>
    );
}

export default ProductCard;
