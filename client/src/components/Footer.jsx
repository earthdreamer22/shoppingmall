import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>종이책연구소</h3>
          <ul className="business-info">
            <li><strong>대표자:</strong> 신윤재</li>
            <li><strong>사업자등록번호:</strong> 267-75-00407</li>
            <li><strong>주소:</strong> 대구광역시 북구 침산남로37길 24, 106동 2층 202호 상가2층 취미는책 (침산동, 침산2차화성아파트)</li>
            <li><strong>이메일:</strong> <a href="mailto:haeglim@naver.com">haeglim@naver.com</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>고객지원</h3>
          <ul className="footer-links">
            <li><Link to="/terms">이용약관</Link></li>
            <li><Link to="/privacy">개인정보처리방침</Link></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} 종이책연구소. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
