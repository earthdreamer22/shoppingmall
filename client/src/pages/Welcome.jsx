import { Link } from 'react-router-dom';
import '../App.css';

function Welcome() {
  return (
    <div className="App welcome-page">
      {/* 브랜드 영역 */}
      <div className="welcome-brand">
        <div className="welcome-logo">
          <span className="welcome-logo__icon">📖</span>
          <h1>종이책연구소</h1>
        </div>
        <p className="welcome-tagline">책을 만들고 수선합니다.</p>
      </div>

      {/* 히어로 이미지 */}
      <div className="welcome-hero">
        <img
          src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1200&q=80"
          alt="책장 이미지"
          className="welcome-hero__image"
        />
      </div>

      {/* 소개 문구 */}
      <div className="welcome-intro">
        <p>This is a book binding institution.</p>
        <p>We are training for book binding certificates</p>
        <p>and there are various classes and goods.</p>
      </div>

      {/* 외부 링크 */}
      <div className="welcome-external-links">
        <a href="https://blog.naver.com" target="_blank" rel="noopener noreferrer">BLOG</a>
        <a href="https://instagram.com/bookharu.kr" target="_blank" rel="noopener noreferrer">INSTAGRAM</a>
        <a href="https://pf.kakao.com" target="_blank" rel="noopener noreferrer">KAKAO TALK</a>
        <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">YOUTUBE</a>
      </div>

      {/* 퀵 메뉴 */}
      <div className="welcome-quick-menu">
        <Link to="/schedule" className="welcome-menu-item">
          <span className="welcome-menu-item__check">✓</span>
          수업일정
        </Link>
        <Link to="/inquiry" className="welcome-menu-item">
          <span className="welcome-menu-item__check">✓</span>
          제본&수선 상담
        </Link>
        <Link to="/inquiry" className="welcome-menu-item">
          <span className="welcome-menu-item__check">✓</span>
          클래스상담
        </Link>
      </div>

      {/* 문의 버튼 */}
      <a
        href="https://pf.kakao.com"
        target="_blank"
        rel="noopener noreferrer"
        className="welcome-inquiry-btn"
      >
        💬 문의
      </a>
    </div>
  );
}

export default Welcome;
