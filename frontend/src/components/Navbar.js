import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/Navbar.css";
import { CartContext } from "../context/CartContext";

function Navbar() {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleLogout = () => {
        logout();
        setShowLogoutModal(false);
        navigate("/");
    };

    const { cartCount } = useContext(CartContext);

    return (
        <>
            <nav className="navbar">
                <div className="navbar-links">
                    {user ? (
                        user.role === "ADMIN" ? (
                            <>
                                <Link to="/admin">Главная</Link>
                                <Link to="/admin/products">Товары</Link>
                                <Link to="/admin/categories">Категории</Link>
                                <Link to="/admin/orders">Заказы</Link>
                                <Link to="/admin/users">Пользователи</Link>
                            </>
                        ) : (
                            <>
                                <Link to="/">Каталог</Link>
                                <Link to="/cart" className="cart-link">
                                    Корзина
                                    {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                                </Link>
                                <Link to="/orders">Мои заказы</Link>
                                <Link to="/achievements">Достижения</Link>
                            </>
                        )
                    ) : (
                        <>
                            <Link to="/">Каталог</Link>
                            <Link to="/achievements">Достижения</Link>
                        </>
                    )}
                </div>
                <div className="navbar-auth">
                    {user ? (
                        <>
                            {user.role === "ADMIN" ? (
                                <span className="navbar-admin-label">Администратор</span>
                            ) : (
                                <Link to="/profile">{user.name}</Link>
                            )}
                            <button onClick={() => setShowLogoutModal(true)}>Выход</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login">Вход</Link>
                            <Link to="/register">Регистрация</Link>
                        </>
                    )}
                </div>
            </nav>

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
        </>
    );
}

export default Navbar;
