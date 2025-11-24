import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function Navbar() {
  const navigate = useNavigate();
  const { user, loading, logout, cartCount } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to logout', error);
    }
  };

  return (
    <header className="site-header">
      {/* 상단: 로고 + 액션 버튼 */}
      <div className="navbar">
        <Link to="/" className="navbar__brand">
          종이책연구소
        </Link>

        <div className="navbar__actions">
          {loading ? (
            <span className="navbar__status">로딩 중...</span>
          ) : user ? (
            <>
              {user.role === 'admin' && (
                <Link to="/admin" className="navbar__menu-item">admin</Link>
              )}
              <Link to="/cart" className="navbar__menu-item navbar__menu-item--cart">
                cart
                {cartCount > 0 && <span className="navbar__cart-badge">{cartCount}</span>}
              </Link>
              <Link to="/mypage" className="navbar__menu-item">myPage</Link>
              <button type="button" onClick={handleLogout} className="navbar__menu-item navbar__menu-item--button">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar__menu-item">Log in</Link>
              <Link to="/signup" className="navbar__menu-item">Sign up</Link>
            </>
          )}
        </div>
      </div>

      {/* 하단: 메뉴 (footer nav와 동일한 스타일) */}
      <div className="header-nav">
        <Link to="/" className="header-nav__item">welcome</Link>
        <Link to="/schedule" className="header-nav__item">class schedule</Link>
        <Link to="/inquiry" className="header-nav__item">제본/수선/수업 문의</Link>
        <Link to="/shop/shop" className="header-nav__item">NOTE SHOP</Link>
        <Link to="/shop/class" className="header-nav__item">class</Link>
        <Link to="/shop/book_repair" className="header-nav__item">Book repair</Link>
      </div>
    </header>
  );
}

export default Navbar;
