import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import "../styles/AdminProducts.css";
import { createPortal } from "react-dom";

function AdminProducts() {
    const { token } = useAuth();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        stockQuantity: "",
        image: "",
        categoryId: ""
    });
    const [editingProduct, setEditingProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const API_URL = process.env.REACT_APP_API_URL;
    const [deleteError, setDeleteError] = useState("");
    const [showDeleteProductModal, setShowDeleteProductModal] = useState({ isOpen: false, orderId: null });
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
        fetch(`${API_URL}/products/user`)
            .then(response => {
                if (!response.ok) throw new Error("Ошибка загрузки товаров");
                return response.json();
            })
            .then((data) => {
                setProducts(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Ошибка при загрузке товаров:", err);
                setError(err.message);
                setLoading(false);
            }).finally(() => {
                setLoading(false);
            });

        fetch(`${API_URL}/categories/without`)
            .then(response => {
                if (!response.ok) throw new Error("Ошибка загрузки категорий");
                return response.json();
            })
            .then(data => setCategories(data))
            .catch(err => console.error("Ошибка при загрузке категорий", err));
    }, [API_URL]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if ((name === "price" || name === "stockQuantity") && value < 0) return;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const method = editingProduct ? "PUT" : "POST";
        const url = editingProduct
            ? `${API_URL}/admin/products/${editingProduct.id}`
            : `${API_URL}/admin/products/create`;

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const updatedProduct = await response.json();
                setProducts(prev =>
                    editingProduct
                        ? prev.map(p => (p.id === updatedProduct.id ? updatedProduct : p))
                        : [...prev, updatedProduct]
                );
                setFormData({ name: "", description: "", price: "", stockQuantity: "", image: "", categoryId: "" });
                setEditingProduct(null);
                setShowForm(false);

                const message = editingProduct ? "Товар обновлен" : "Товар добавлен";
                setNotification(message);

                setTimeout(() => setNotification(""), 4000);
            } else {
                console.error("Ошибка сохранения товара");
            }
        } catch (error) {
            console.error("Ошибка: ", error);
        }
    };

    const handleDelete = async () => {
        if (!showDeleteProductModal.id) return;
        setShowDeleteProductModal({ isOpen: false, id: null });

        try {
            const response = await fetch(`${API_URL}/admin/product/${showDeleteProductModal.id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
            });

            if (response.ok) {
                setProducts(prev => prev.filter(p => p.id !== showDeleteProductModal.id));
                setDeleteError("");
                setNotification("Товар удален");

                setTimeout(() => setNotification(""), 4000);
            } else {
                const contentType = response.headers.get("Content-Type");
                if (contentType && contentType.includes("application/json")) {
                    const data = await response.json();
                    setDeleteError(data.error || "Ошибка удаления товара");
                } else {
                    alert("Ошибка удаления товара");
                }
            }
        } catch (error) {
            console.error("Ошибка: ", error);
            alert("Ошибка при удалении товара");
        }
    };

    const handleEdit = (product) => {
        setDeleteError("");
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description,
            price: product.price,
            stockQuantity: product.stockQuantity,
            image: product.image,
            categoryId: product.category?.id || "",
        });
        setShowForm(true);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch(`${API_URL}/uploads/upload`, {
                method: "POST",
                body: formData,
                headers: {
                    "Authorization": `Bearer ${token}`
                },
            });

            if (response.ok) {
                const data = await response.json();
                setFormData(prev => ({ ...prev, image: data.url }));
            } else {
                console.error("Ошибка загрузки изображения");
            }
        } catch (error) {
            console.error("Ошибка:", error);
        }
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
            <div className="admin-products-container">
                <h1 className="admin-h1">Управление товарами</h1>
                {!isOnline ? (
                    <p className="offline-message">Нет подключения к интернету</p>
                ) :
                    <button
                        className={`admin-toggle-button ${showForm ? "close" : "add"}`}
                        onClick={() => {
                            setShowForm(!showForm);
                            if (showForm) {
                                setFormData({ name: "", description: "", price: "", stockQuantity: "", image: "", categoryId: "" });
                                setEditingProduct(null);
                            }
                        }}
                    >
                        {showForm ? "Отмена" : "Добавить новый товар"}
                    </button>}

                {showForm && (
                    <form className="admin-form" onSubmit={handleSubmit}>
                        <input type="text" name="name" placeholder="Название" title="Введите название товара" value={formData.name} onChange={handleChange} required />
                        <input type="text" name="description" placeholder="Описание" title="Введите краткое описание товара" value={formData.description} onChange={handleChange} required />
                        <input type="number" name="price" placeholder="Цена (руб.)" title="Введите цену в рублях (не менее 0)" value={formData.price} onChange={handleChange} required min="0" />
                        <input type="number" name="stockQuantity" placeholder="Количество (шт.)" title="Введите количество товара (не менее 0)" value={formData.stockQuantity} onChange={handleChange} required min="0" />
                        <input type="file" accept="image/*" name="image" title="Загрузите изображение товара" onChange={handleFileUpload} />
                        <select name="categoryId" title="Выберите категорию" value={formData.categoryId} onChange={handleChange} required>
                            <option value="">Выберите категорию</option>
                            {categories.map(category => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                        <button type="submit">{editingProduct ? "Сохранить изменения" : "Добавить товар"}</button>
                    </form>
                )}
                {deleteError && <p className="error">{deleteError}
                    <span className="close-error" onClick={() => setDeleteError("")}>✕</span></p>}

                {isOnline && (products.length === 0 ? (
                    <p className="admin-p">Товары отсутствуют</p>
                ) : (
                    <table className="admin-products-table">
                        <thead>
                            <tr>
                                <th className="admin-th">ID</th>
                                <th className="admin-th">Название</th>
                                <th className="admin-th">Цена</th>
                                <th className="admin-th">Количество</th>
                                <th className="admin-th">Категория</th>
                                <th className="admin-th">Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(product => (
                                <tr key={product.id}>
                                    <td className="admin-products-td">{product.id}</td>
                                    <td className="admin-products-td">{product.name}</td>
                                    <td className="admin-products-td">{product.price}</td>
                                    <td className="admin-products-td">{product.stockQuantity}</td>
                                    <td className="admin-products-td">{product.category?.name || "Без категории"}</td>
                                    <td className="admin-products-td">
                                        <button onClick={() => handleEdit(product)}>Редактировать</button>
                                        <button onClick={() => setShowDeleteProductModal({ isOpen: true, id: product.id })}>Удалить</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ))}
            </div>
            {showDeleteProductModal.isOpen && (
                <div className="common-modal-overlay">
                    <div className="common-modal">
                        <p>Вы уверены, что хотите удалить этот товар?</p>
                        <div className="common-modal-buttons">
                            <button className="common-modal-confirm" onClick={handleDelete}>
                                Удалить товар
                            </button>
                            <button className="common-modal-cancel" onClick={() => setShowDeleteProductModal({ isOpen: false, id: null })}>
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

export default AdminProducts;