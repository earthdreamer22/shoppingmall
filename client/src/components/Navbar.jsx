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
    <nav className="navbar">
      {/* 좌측: 로고 */}
      <Link to="/" className="navbar__brand">
        종이책연구소
      </Link>

      {/* 중앙: 메인 메뉴 (6개) */}
      <div className="navbar__menu">
        <Link to="/" className="navbar__menu-item">welcome</Link>
        <Link to="/schedule" className="navbar__menu-item">class schedule</Link>
        <Link to="/inquiry" className="navbar__menu-item">제본/수선/수업 문의</Link>
        <Link to="/shop" className="navbar__menu-item">NOTE SHOP</Link>
        <Link to="/class" className="navbar__menu-item">class&repair</Link>
        <Link to="/design" className="navbar__menu-item">Book design</Link>
      </div>

      {/* 우측: 사용자 액션 */}
      <div className="navbar__actions">
        {loading ? (
          <span className="navbar__status">로딩 중...</span>
        ) : user ? (
          <>
            {user.role === 'admin' && (
              <Link to="/admin" className="navbar__button">관리자</Link>
            )}
            <Link to="/cart" className="navbar__button navbar__button--cart">
              장바구니
              {cartCount > 0 && <span className="navbar__cart-badge">{cartCount}</span>}
            </Link>
            <Link to="/mypage" className="navbar__button">my</Link>
            <button type="button" onClick={handleLogout} className="navbar__button">
              로그아웃
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="navbar__button">로그인</Link>
            <Link to="/signup" className="navbar__button navbar__button--primary">회원가입</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
