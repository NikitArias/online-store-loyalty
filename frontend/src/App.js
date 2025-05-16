import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import Navbar from "./components/Navbar";
import Register from "./pages/Register";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import Achievements from "./pages/Achievements";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/cart" element={<PrivateRoute element={<Cart />} />} />
        <Route path="/orders" element={<PrivateRoute element={<Orders />} />} />
        <Route path="/profile" element={<PrivateRoute element={<Profile />} />} />

        <Route path="/admin/*" element={<AdminRoute element={<Admin />} />} />

        <Route path="*" element={<h1>Страница не найдена</h1>} />
      </Routes>
    </Router>
  );
}

export default App;
