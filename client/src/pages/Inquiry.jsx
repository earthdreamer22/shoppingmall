import '../App.css';

function Inquiry() {
  return (
    <div className="App inquiry-page">
      <div className="inquiry-hero">
        <img
          src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1200&q=80"
          alt="책장 이미지"
          className="inquiry-hero__image"
        />
      </div>

      <section className="inquiry-section">
        <h2>제본/수선/수업 문의</h2>

        <div className="inquiry-content">
          <h3>다이어리 만들기 수업에 대한</h3>
          <p>궁금한 부분을 상담 후 예약을 진행하고 싶으시다면,</p>
          <p>아래 내용을 입력해주시면,</p>
          <p>확인하는대로 신속하게 연락드리겠습니다.</p>
        </div>

        <a
          href="https://pf.kakao.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inquiry-kakao-btn"
        >
          카카오채널
        </a>

        <p className="inquiry-note">
          카카오채널 친구추가 후, 상담 주시면 보다 빠르게 상담이 가능합니다 :-)
        </p>
      </section>

      <section className="inquiry-section">
        <h3>문의 안내</h3>
        <ul className="inquiry-list">
          <li><strong>수업 문의:</strong> 원데이클래스, 정규 수업, 그룹 수업 등</li>
          <li><strong>제본 문의:</strong> 논문 제본, 앨범 제본, 커스텀 제본 등</li>
          <li><strong>수선 문의:</strong> 헌 책 수선, 표지 복원, 제본 수리 등</li>
        </ul>
      </section>

      <section className="inquiry-section">
        <h3>운영 시간</h3>
        <p>평일 10:00 - 18:00</p>
        <p>주말 및 공휴일 휴무</p>
        <p className="inquiry-note">* 카카오톡 상담은 24시간 접수 가능합니다.</p>
      </section>
    </div>
  );
}

export default Inquiry;
