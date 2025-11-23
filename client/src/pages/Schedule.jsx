import { useState } from 'react';
import '../App.css';

function Schedule() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayWeekday = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  const renderCalendarDays = () => {
    const days = [];

    // 이전 달 빈 칸
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day calendar-day--empty"></div>);
    }

    // 이번 달 날짜
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday =
        day === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear();

      days.push(
        <div
          key={day}
          className={`calendar-day ${isToday ? 'calendar-day--today' : ''}`}
        >
          {day}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="App schedule-page">
      <div className="schedule-hero">
        <img
          src="https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=1200&q=80"
          alt="캘린더"
          className="schedule-hero__image"
        />
      </div>

      <section className="schedule-section">
        <h2>Class Schedule</h2>
        <p className="schedule-intro">수업 일정을 확인하고 예약하세요.</p>
      </section>

      <section className="schedule-section">
        <div className="calendar">
          <div className="calendar-header">
            <button onClick={prevMonth} className="calendar-nav-btn">&lt;</button>
            <h3>{year}년 {monthNames[month]}</h3>
            <button onClick={nextMonth} className="calendar-nav-btn">&gt;</button>
          </div>

          <div className="calendar-weekdays">
            {weekDays.map(day => (
              <div key={day} className="calendar-weekday">{day}</div>
            ))}
          </div>

          <div className="calendar-days">
            {renderCalendarDays()}
          </div>
        </div>
      </section>

      <section className="schedule-section">
        <h3>수업 예약 안내</h3>
        <div className="schedule-info">
          <p>원하시는 날짜에 수업을 예약하시려면</p>
          <p>카카오채널로 문의해 주세요.</p>
        </div>
        <a
          href="https://pf.kakao.com"
          target="_blank"
          rel="noopener noreferrer"
          className="schedule-kakao-btn"
        >
          카카오채널로 예약하기
        </a>
      </section>

      <section className="schedule-section">
        <h3>수업 종류</h3>
        <ul className="schedule-class-list">
          <li><strong>원데이클래스:</strong> 하루 동안 완성하는 체험 수업</li>
          <li><strong>정규 수업:</strong> 제본 자격증 취득을 위한 정규 과정</li>
          <li><strong>그룹 수업:</strong> 단체 대상 맞춤 수업</li>
        </ul>
      </section>
    </div>
  );
}

export default Schedule;
