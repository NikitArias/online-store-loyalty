import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "../styles/AdminCategories.css";
import { createPortal } from "react-dom";

function AdminCategories() {
    const [categories, setCategories] = useState([]);
    const [newCategory, setNewCategory] = useState("");
    const [editCategory, setEditCategory] = useState(null);
    const [editName, setEditName] = useState("");
    const { token } = useAuth();
    const API_URL = process.env.REACT_APP_API_URL;
    const [categoryError, setCategoryError] = useState("");
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

    useEffect(() => {
        fetch(`${API_URL}/categories/without`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => setCategories(data))
            .catch(err => console.error("Ошибка загрузки категорий", err))
            .finally(() => setLoading(false));
    }, [token, API_URL]);

    const handleCreate = async () => {
        if (!newCategory.trim()) return setCategoryError("Введите название категории");

        const response = await fetch(`${API_URL}/admin/category/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ name: newCategory })
        });

        if (response.ok) {
            const category = await response.json();
            setCategories([...categories, category]);
            setNewCategory("");
            setNotification("Категория добавлена");
        } else {
            const text = await response.text();
            setCategoryError(text);
        }
    };

    const handleUpdate = async (id) => {
        const response = await fetch(`${API_URL}/admin/category/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ name: editName })
        });

        if (response.ok) {
            setNotification("Категория обновлена");
            setCategories(categories.map(c => c.id === id ? { ...c, name: editName } : c));
            setEditCategory(null);

            setTimeout(() => setNotification(""), 4000);
        } else {
            alert("Ошибка при обновлении категории");
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
            <div className="admin-categories">
                <h2>Управление категориями</h2>
                {isOnline ? (
                    <div className="category-form">
                        <input
                            type="text"
                            placeholder="Новая категория"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                        />
                        <button className="add-category-button" onClick={handleCreate}>Добавить</button>
                    </div>
                ) : (
                    <p className="offline-message">Нет подключения к интернету</p>
                )}
                {categoryError && <p className="error">{categoryError}
                    <span className="close-error" onClick={() => setCategoryError("")}>✕</span></p>}
                {isOnline && (
                    <ul className="category-list">
                        {categories.map(category => (
                            <li key={category.id} className="category-item">
                                {editCategory === category.id ? (
                                    <>
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                        />
                                        <button onClick={() => handleUpdate(category.id)}>Сохранить</button>
                                        <button className="cancel" onClick={() => setEditCategory(null)}>Отмена</button>
                                    </>
                                ) : (
                                    <>
                                        {category.name}
                                        <button onClick={() => { setEditCategory(category.id); setEditName(category.name); }}>Редактировать</button>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            {notification && createPortal(
                <div className="notification">{notification}</div>,
                document.body
            )}
        </>
    );
}

export default AdminCategories;