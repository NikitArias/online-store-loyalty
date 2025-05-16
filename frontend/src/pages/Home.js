import React from "react";
import ProductList from "../components/ProductList";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

function Home() {
    const { user } = useAuth();

    if (user?.role === "ADMIN") {
        return <Navigate to="/admin" replace />;
    }

    return (
        <div>
            <h1>Каталог товаров</h1>
            <ProductList />
        </div>
    );
}

export default Home;
