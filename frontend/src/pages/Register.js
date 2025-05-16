import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Register.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { createPortal } from "react-dom";
import { useAuth } from "../context/AuthContext";

function Register() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [phone, setPhone] = useState("+7 ");
    const [address, setAddress] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [phoneError, setPhoneError] = useState("");
    const [emailError, setEmailError] = useState("");
    const navigate = useNavigate();
    const [passwordVisible, setPasswordVisible] = useState({ password: false, confirmPassword: false });
    const [notification, setNotification] = useState("");
    const [registerError, setRegisterError] = useState("");
    const { user } = useAuth();
    const [redirecting, setRedirecting] = useState(false);

    useEffect(() => {
        if (user) {
            setRedirecting(true);
            setTimeout(() => {
                navigate(user.role === "ADMIN" ? "/admin" : "/");
            }, 4000);
        }
    }, [user, navigate]);

    const togglePasswordVisibility = (field) => {
        setPasswordVisible((prev) => ({ ...prev, [field]: !prev[field] }));
    };

    const formatPhoneNumber = (value) => {
        let cleaned = value.replace(/\D/g, "");

        if (cleaned.startsWith("8")) {
            cleaned = "7" + cleaned.slice(1);
        }

        if (cleaned.lenght > 11) {
            cleaned = cleaned.slice(0, 11);
        }

        let formatted = "+7";
        if (cleaned.length > 1) formatted += ` (${cleaned.slice(1, 4)}`;
        if (cleaned.length > 4) formatted += `) ${cleaned.slice(4, 7)}`;
        if (cleaned.length > 7) formatted += `-${cleaned.slice(7, 9)}`;
        if (cleaned.length > 9) formatted += `-${cleaned.slice(9, 11)}`;

        return formatted;
    };

    const handlePhoneChange = (e) => {
        const formatted = formatPhoneNumber(e.target.value);
        setPhone(formatted);
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setPasswordError("Пароли не совпадают");
            return;
        }
        setPasswordError("");

        if (password.length < 6) {
            setPasswordError("Пароль должен содержать минимум 6 символов");
            return;
        }

        if (!/[a-zA-z]/.test(password) || !/\d/.test(password)) {
            setPasswordError("Пароль должен содержать хотя бы одну букву и одну цифру");
            return;
        }

        setPasswordError("");

        if (phone.length !== 18) {
            setPhoneError("Некорректный номер телефона");
            return;
        }
        setPhoneError("");

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    phone: phone.replace(/\D/g, ""),
                    address,
                    createdAt: new Date().toISOString()
                }),
            });

            if (response.ok) {
                setNotification("Регистрация успешна");

                setTimeout(() => {
                    navigate("/login");
                }, 4000);
            } else {
                setEmailError(response.text());
            }
        } catch (error) {
            console.error("Ошибка: ", error);
            setRegisterError("Нет подключения к интернету");
        }
    };

    return (
        <>
            {!redirecting && (
                <div className="register-container">
                    <h2>Регистрация</h2>
                    <form onSubmit={handleRegister}>
                        <input
                            type="text"
                            placeholder="Имя"
                            title="Введите Ваше имя"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                        <input
                            type="email"
                            placeholder="Email"
                            title="Введите Ваш email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        {emailError && <p className="error">{emailError}
                            <span className="close-error" onClick={() => setEmailError("")}>✕</span></p>}
                        <div className="password-input">
                            <input
                                type={passwordVisible.password ? "text" : "password"}
                                placeholder="Пароль"
                                title="Придумайте пароль, содержащий не менее 6 символов, содержащий хотя бы 1 цифру и 1 букву"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <span className="eye-icon" onClick={() => togglePasswordVisibility("password")}>
                                {passwordVisible.password ? <FaEyeSlash /> : <FaEye />}
                            </span>
                        </div>
                        <div className="password-input">
                            <input
                                type={passwordVisible.confirmPassword ? "text" : "password"}
                                placeholder="Подтвердите пароль"
                                title="Повторите пароль"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                            <span className="eye-icon" onClick={() => togglePasswordVisibility("confirmPassword")}>
                                {passwordVisible.confirmPassword ? <FaEyeSlash /> : <FaEye />}
                            </span>
                        </div>
                        {passwordError && <p className="error">{passwordError}
                            <span className="close-error" onClick={() => setPasswordError("")}>✕</span></p>}
                        <input
                            type="text"
                            placeholder="Телефон"
                            title="Введите ваш номер телефона"
                            value={phone}
                            onChange={handlePhoneChange}
                            required
                        />
                        {phoneError && <p className="error">{phoneError}
                            <span className="close-error" onClick={() => setPhoneError("")}>✕</span></p>}
                        <input
                            type="text"
                            placeholder="Адрес"
                            title="Введите адрес для доставки"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            required
                        />
                        {registerError && <p className="error">{registerError}
                            <span className="close-error" onClick={() => setRegisterError("")}>✕</span></p>}
                        <button type="submit">Зарегестрироваться</button>
                    </form>
                    <div className="login-link">
                        <p>Уже есть аккаунт? <Link to="/login">Войти</Link></p>
                    </div>
                    {notification && createPortal(
                        <div className="notification">{notification}</div>,
                        document.body
                    )}
                </div>
            )}
        </>
    );
}

export default Register;