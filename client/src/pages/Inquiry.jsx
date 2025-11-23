import '../App.css';

function Inquiry() {
  return (
    <div className="App inquiry-page">
      {/* 히어로 이미지 */}
      <div className="page-hero">
        <img
          src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1200&q=80"
          alt="책장 이미지"
          className="page-hero__image"
        />
      </div>

      <section className="inquiry-section">
        <h2>맞춤 제본, 수선 문의</h2>
        <p className="inquiry-subtitle">&</p>
        <h2>클래스 예약관련 상담</h2>

        <div className="inquiry-content">
          <p>안녕하세요, 종이책연구소입니다.</p>
          <p>맞춤 제본과 수선, 클래스 관련 문의는</p>
          <p>하단의 버튼클릭하시어 <strong className="inquiry-highlight">카카오톡 채널</strong>로 남겨주시면</p>
          <p>빠르고 정성껏 안내드리겠습니다.</p>
        </div>

        <div className="inquiry-content">
          <p>모든 제본과 수선은 수작업으로 진행되며,</p>
          <p className="inquiry-red">수업 일정은 아래 버튼을 통해 가능한 날짜를 확인하실 수 있습니다.</p>
        </div>

        <div className="inquiry-content">
          <p>작업 중에는 문자나 전화 문의를 확인하지 못하는 경우가 있어,</p>
          <p>번거로우시더라도 카카오톡 채널을 이용해주시면 가장 빠르게 응답드릴 수 있습니다.</p>
        </div>

        <a
          href="https://pf.kakao.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inquiry-kakao-btn"
        >
          <span className="kakao-icon">💬</span>
          카카오채널 바로가기
        </a>
      </section>
    </div>
  );
}

export default Inquiry;
