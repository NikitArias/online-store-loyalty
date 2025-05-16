import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useCart } from "./CartContext";

export const AuthContext = createContext({
    user: null,
    login: () => { },
    logout: () => { }
});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const { setCart, updateCart } = useCart();
    const hasFetchedCart = useRef(false);

    useEffect(() => {
        if (hasFetchedCart.current) return;
        hasFetchedCart.current = true;

        const savedUser = localStorage.getItem("user");
        const savedToken = localStorage.getItem("token");

        if (savedUser) {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);

            if (parsedUser.role !== "ADMIN") {
                updateCart(savedToken);
            }
        }
        if (savedToken) {
            setToken(savedToken);
        }

        setIsLoading(false);
    }, [updateCart]);

    const login = (userData) => {
        setUser({ id: userData.id, email: userData.email, role: userData.role, name: userData.name });
        localStorage.setItem("user", JSON.stringify({ id: userData.id, email: userData.email, role: userData.role, name: userData.name }));

        if (userData.token) {
            setToken(userData.token)
            localStorage.setItem("token", userData.token);
            if (userData.role !== "ADMIN") {
               updateCart(userData.token); 
            }
            
        } else {
            console.error("Ошибка: токен отсутствует в userData", userData);
        }
    };

    const logout = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/logout`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                credentials: "include",
            });

            if (!response.ok) {
                console.error("Ошибка при выходе: ", response.status);
            }
        } catch (error) {
            console.error("Ошибка выхода: ", error);
        }

        setUser(null);
        setToken(null);
        setCart([]);
        localStorage.clear();
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}