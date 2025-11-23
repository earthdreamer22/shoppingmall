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

  const displayName = user?.name || user?.email || '사용자';

  return (
    <nav className="navbar">
      <Link to="/" className="navbar__brand">
        종이책 연구소
      </Link>

      <div className="navbar__links">
        {user?.role === 'admin' && (
          <Link to="/admin" className="navbar__link">
            관리자 대시보드
          </Link>
        )}
      </div>

      <div className="navbar__actions">
        {loading ? (
          <span className="navbar__status">로딩 중...</span>
        ) : user ? (
          <>
            <Link to="/cart" className="navbar__button navbar__button--cart">
              장바구니
              {cartCount > 0 && <span className="navbar__cart-badge">{cartCount}</span>}
            </Link>
            <Link to="/mypage" className="navbar__button">
              마이페이지
            </Link>
            <button type="button" onClick={handleLogout} className="navbar__button">
              로그아웃
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="navbar__button">
              로그인
            </Link>
            <Link to="/signup" className="navbar__button navbar__button--primary">
              회원가입
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
