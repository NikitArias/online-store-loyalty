import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext";

const PrivateRoute = ({ element }) => {
    const { user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Загрузка...</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (user.role === "ADMIN") {
        return <Navigate to="/" replace />;
    }

    return element;
};

export default PrivateRoute;