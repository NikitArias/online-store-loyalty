import { useContext, useEffect, useState } from "react";
import { AuthContext, useAuth } from "../context/AuthContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/Login.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { createPortal } from "react-dom";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [passwordVisible, setPasswordVisible] = useState({ password: false });
    const [loginError, setLoginError] = useState("");
    const [notification, setNotification] = useState("");
    const { user } = useAuth();
    const [redirecting, setRedirecting] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setRedirecting(true);
            setTimeout(() => {
                navigate(location.state?.from?.pathname || (user.role === "ADMIN" ? "/admin" : "/"));
            }, 2000);
        }
    }, [user, navigate, location]);

    const fetchOrders = async (token) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/orders/user`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
                credentials: "include",
            });

            if (response.ok) {
                await response.json();
            } else {
                console.error("Ошибка загрузки заказов");
            }
        } catch (error) {
            console.error("Ошибка загрузки заказов:", error);
        }
    };

    const togglePasswordVisibility = (field) => {
        setPasswordVisible((prev) => ({ ...prev, [field]: !prev[field] }));
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
                const data = await response.json();

                if (data.token && data.id && data.role) {
                    login({ id: data.id, email, token: data.token, role: data.role, name: data.name });

                    if (data.role === "ADMIN") {
                        setNotification("Администратор, добро пожаловать!")
                    } else {
                        fetchOrders(data.token);
                        setNotification(`Вход выполнен, здравствуйте ${data.name}!`);
                    }

                    setLoading(false);
                    setTimeout(() => {
                        setRedirecting(true);
                        navigate(location.state?.from?.pathname || (data.role === "ADMIN" ? "/admin" : "/"));
                    }, 4000);

                } else {
                    console.error("Ошибка: сервер не вернул id, token или role", data);
                    setLoading(false);
                }
            } else {
                const errorData = await response.json();
                setLoginError(errorData.error);
                setLoading(false);
            }
        } catch (error) {
            console.error("Ошибка: ", error);
            setLoginError("Нет подключения к интернету");
            setLoading(false);
        }
    };

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
            {!redirecting && (
                <div className="login-container">
                    <h2>Вход</h2>
                    <form onSubmit={handleLogin}>
                        <input
                            type="email"
                            placeholder="Email"
                            title="Введите Ваш email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <div className="password-input">
                            <input
                                type={passwordVisible.password ? "text" : "password"}
                                placeholder="Пароль"
                                title="Введите Ваш пароль"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <span className="eye-icon" onClick={() => togglePasswordVisibility("password")}>
                                {passwordVisible.password ? <FaEyeSlash /> : <FaEye />}
                            </span>
                        </div>
                        {loginError && <p className="error">{loginError}
                            <span className="close-error" onClick={() => setLoginError("")}>✕</span></p>}
                        <button type="submit">Войти</button>
                    </form>
                    <div className="register-link">
                        <p>Нет аккаунта? <Link to="/register">Зарегистрироваться</Link></p>
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

export default Login;