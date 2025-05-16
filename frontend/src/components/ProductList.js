import { useEffect, useState, useCallback } from "react";
import ProductCard from "./ProductCard";
import "../styles/ProductList.css";

function ProductList() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [sortType, setSortType] = useState("rating");
    const [loading, setLoading] = useState(true);
    const API_URL = process.env.REACT_APP_API_URL;
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

    const fetchCategories = useCallback(async () => {
        if (!isOnline) return;
        try {
            const response = await fetch(`${API_URL}/categories/full`);
            if (response.ok) {
                const data = await response.json();
                setCategories(data);
            } else {
                console.error("Ошибка загрузки категорий");
            }
        } catch (error) {
            console.error("Ошибка запроса категорий: ", error);
        }
    }, [API_URL, isOnline]);

    const fetchReviewsForProduct = useCallback(async (productId) => {
        if (!isOnline) return;
        try {
            const response = await fetch(`${API_URL}/reviews/${productId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.length > 0) {
                    const avgRating = data.reduce((sum, review) => sum + review.rating, 0) / data.length;
                    return avgRating.toFixed(1);
                }
            }
        } catch (error) {
            console.error(`Ошибка загрузки отзывов для товара ${productId}: `, error)
        }
        return null;
    }, [API_URL, isOnline]);

    const fetchProducts = useCallback(async () => {
        try {
            const url = selectedCategory
                ? `${API_URL}/products/user/category/${selectedCategory}`
                : `${API_URL}/products/user`;

            setLoading(true);

            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();

                const productsWithRating = await Promise.all(
                    data.map(async (p) => ({
                        ...p,
                        cartQuantity: 0,
                        averageRating: await fetchReviewsForProduct(p.id),
                    }))
                );
                setProducts(productsWithRating);
            } else {
                console.error("Ошибка загрузки товаров");
            }
        } catch (error) {
            console.error("Ошибка запроса: ", error);
        } finally {
            setLoading(false);
        }
    }, [API_URL, selectedCategory, fetchReviewsForProduct]);

    useEffect(() => {
        fetchCategories();
        fetchProducts();
    }, [fetchCategories, fetchProducts]);

    const sortedProducts = [...products].sort((a, b) => {
        if (sortType === "asc") return a.price - b.price;
        if (sortType === "desc") return b.price - a.price;
        if (sortType === "rating") return (b.averageRating || 0) - (a.averageRating || 0);
        return 0;
    });

    return (
        <>
            <div>
                {!isOnline ? (
                    <p className="offline-message">Нет подключения к интернету</p>
                ) : (
                    <div className="category-filter">
                        <button
                            className={!selectedCategory ? "active" : ""}
                            onClick={() => setSelectedCategory(null)}
                        >
                            Все категории
                        </button>
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                className={selectedCategory === category.id ? "active" : ""}
                                onClick={() => setSelectedCategory(category.id)}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>
                )}

                <div className="sort-controls">
                    <label>Сортировать по:</label>
                    <select value={sortType} onChange={(e) => setSortType(e.target.value)}>
                        <option value="rating">По рейтингу</option>
                        <option value="asc">По возрастанию цены</option>
                        <option value="desc">По убыванию цены</option>
                    </select>
                </div>


                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Загрузка товаров...</p>
                    </div>
                ) : (
                    <div className="product-grid">
                        {sortedProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

export default ProductList;
