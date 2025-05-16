import { Navigate, Route, Routes } from "react-router-dom";
import AdminDashboard from "../components/AdminDashboard";
import AdminProducts from "./AdminProducts";
import AdminCategories from "./AdminCategories";
import AdminOrders from "./AdminOrders";
import AdminUsers from "./AdminUsers";

function Admin() {
    return (
        <div className="admin-content">
            <Routes>
                <Route path="/" element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="*" element={<Navigate to="/admin" />} />
            </Routes>
        </div>
    );
}

export default Admin;
