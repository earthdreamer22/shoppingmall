import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Welcome from './pages/Welcome.jsx';
import Shop from './pages/Shop.jsx';
import Schedule from './pages/Schedule.jsx';
import Inquiry from './pages/Inquiry.jsx';
import Design from './pages/Design.jsx';
import Signup from './pages/Signup.jsx';
import Login from './pages/Login.jsx';
import Admin from './pages/Admin.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Cart from './pages/Cart.jsx';
import MyPage from './pages/MyPage.jsx';
import Checkout from './pages/Checkout.jsx';
import OrderComplete from './pages/OrderComplete.jsx';
import Terms from './pages/Terms.jsx';
import Privacy from './pages/Privacy.jsx';
import NotFound from './pages/NotFound.jsx';
import Layout from './components/layout/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Welcome />} />
            <Route path="/shop/:category" element={<Shop />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/inquiry" element={<Inquiry />} />
            <Route path="/design" element={<Design />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route path="/products/:productId" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route
              path="/mypage"
              element={
                <ProtectedRoute>
                  <MyPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route path="/orders/complete" element={<OrderComplete />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
