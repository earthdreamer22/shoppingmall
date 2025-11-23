import '../App.css';

function Design() {
  return (
    <div className="App design-page">
      <div className="design-hero">
        <img
          src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&q=80"
          alt="북 디자인"
          className="design-hero__image"
        />
      </div>

      <section className="design-section">
        <h2>Book Design</h2>
        <p className="design-intro">
          종이책연구소에서 제작한 다양한 북 디자인 작업물을 소개합니다.
        </p>
      </section>

      <section className="design-section">
        <h3>포트폴리오</h3>
        <div className="design-gallery">
          <div className="design-gallery__item">
            <img
              src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&q=80"
              alt="디자인 작업 1"
            />
          </div>
          <div className="design-gallery__item">
            <img
              src="https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80"
              alt="디자인 작업 2"
            />
          </div>
          <div className="design-gallery__item">
            <img
              src="https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=400&q=80"
              alt="디자인 작업 3"
            />
          </div>
          <div className="design-gallery__item">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80"
              alt="디자인 작업 4"
            />
          </div>
        </div>
      </section>

      <section className="design-section">
        <h3>더 많은 작업물 보기</h3>
        <p>인스타그램에서 더 많은 작업물을 확인하실 수 있습니다.</p>
        <a
          href="https://instagram.com/bookharu.kr"
          target="_blank"
          rel="noopener noreferrer"
          className="design-instagram-btn"
        >
          Instagram 방문하기
        </a>
      </section>
    </div>
  );
}

export default Design;
