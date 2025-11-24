import { useState, useEffect, useCallback } from 'react';
import '../App.css';
import { apiRequest } from '../lib/apiClient.js';

const SCHEDULE_STATUS = {
  unavailable: { label: '수업 불가', color: '#ef4444' },
};

function Schedule() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayWeekday = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest(`/schedules?year=${year}&month=${month + 1}`);
      setSchedules(data);
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

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

  const getScheduleForDay = (day) => {
    const dateObj = new Date(year, month, day);
    dateObj.setHours(0, 0, 0, 0);

    return schedules.find((s) => {
      const sDate = new Date(s.date);
      sDate.setHours(0, 0, 0, 0);
      return sDate.getTime() === dateObj.getTime();
    });
  };

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

      const schedule = getScheduleForDay(day);
      const statusInfo = schedule ? SCHEDULE_STATUS[schedule.status] : null;

      days.push(
        <div
          key={day}
          className={`calendar-day ${isToday ? 'calendar-day--today' : ''} ${statusInfo ? 'calendar-day--has-status' : ''}`}
          style={statusInfo ? { backgroundColor: statusInfo.color + '15' } : {}}
        >
          <span className="calendar-day__number">{day}</span>
          {statusInfo && (
            <span className="calendar-day__status" style={{ color: statusInfo.color }}>
              {statusInfo.label}
            </span>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="App schedule-page">
      {/* 히어로 이미지 */}
      <div className="page-hero">
        <img
          src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1200&q=80"
          alt="책장 이미지"
          className="page-hero__image"
        />
      </div>

      <section className="schedule-section">
        <div className="schedule-header">
          <span className="schedule-header__icon">📅</span>
          <h2>종이책연구소 수업 현황</h2>
        </div>

        <div className="schedule-notice">
          <p className="schedule-notice__item">
            <span className="schedule-notice__icon">❗</span>
            '수업 불가'로 표시된 시간은 이미 수업이 예약되어 있거나, 의뢰받은 제본 작업의 양이 많아 수업 진행이 어려운 경우입니다.
          </p>
          <p className="schedule-notice__item schedule-notice__item--red">
            <span className="schedule-notice__icon">📌</span>
            수업 일정은 관리자가 수시로 업데이트하고 있습니다. 예약 전 반드시 최신 일정을 확인해주세요.
          </p>
        </div>

        <div className="schedule-note">
          <p><strong>※ 참고:</strong></p>
          <p>책 수선 의뢰는 수업 일정과 관계없이 접수 및 진행됩니다.</p>
          <p>수선이 필요하신 경우 별도로 문의 주세요 :)</p>
        </div>
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

          {loading ? (
            <p className="muted-text" style={{ textAlign: 'center', padding: '20px' }}>일정을 불러오는 중...</p>
          ) : (
            <div className="calendar-days">
              {renderCalendarDays()}
            </div>
          )}
        </div>

        <div className="schedule-legend">
          {Object.entries(SCHEDULE_STATUS).map(([key, value]) => (
            <div key={key} className="schedule-legend__item">
              <span className="schedule-legend__dot" style={{ backgroundColor: value.color }}></span>
              <span>{value.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="schedule-section">
        <h3>수업 예약 안내</h3>
        <div className="schedule-info">
          <p>원하시는 날짜에 수업을 예약하시려면</p>
          <p>카카오채널로 문의해 주세요.</p>
        </div>
        <a
          href="http://pf.kakao.com/_cqxltxj/friend"
          target="_blank"
          rel="noopener noreferrer"
          className="schedule-kakao-btn"
        >
          카카오채널로 예약하기
        </a>
      </section>
    </div>
  );
}

export default Schedule;
