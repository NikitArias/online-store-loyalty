import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

export const CartContext = createContext(null);

export function CartProvider({ children }) {
    const [cart, setCart] = useState([]);
    const [cartCount, setCartCount] = useState(0);
    const { user } = useAuth() || {};

    useEffect(() => {
        setCartCount(new Set(cart.map(item => item.product.id)).size);
    }, [cart]);

    const updateCart = async (token, user) => {
        if (!token) return;
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/orders/user/cart`, {
                headers: { Authorization: `Bearer ${token}` },
            });
    
            if (response.ok) {
                const text = await response.text();
                const data = text ? JSON.parse(text) : null;
                const activeOrder = data?.order;
                setCart(activeOrder ? activeOrder.items : []);
            }
        } catch (error) {
            console.error("Ошибка загрузки корзины", error);
        }
    };    

    useEffect(() => {
        if (user && user.token && user?.role !== "ADMIN") {
            updateCart(user.token);
        }
    }, [user]);

    return (
        <CartContext.Provider value={{ cart, setCart, cartCount, updateCart }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    return useContext(CartContext);
}