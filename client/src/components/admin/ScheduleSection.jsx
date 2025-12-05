import PropTypes from 'prop-types';

function ScheduleSection({
  schedulesLoading,
  scheduleNotice,
  scheduleNoticeType,
  renderCalendar,
  selectedDay,
  scheduleDate,
  getScheduleForDay,
  onSubmit,
  onDelete,
  onClose,
}) {
  return (
    <section className="admin-schedule">
      <div className="section-header">
        <h2>수업 일정 관리</h2>
      </div>

      {scheduleNotice && (
        <div className={`status ${scheduleNoticeType === 'error' ? 'error' : ''}`}>{scheduleNotice}</div>
      )}

      <div className="admin-schedule-layout">
        <div className="admin-schedule-calendar">
          {schedulesLoading ? <p>일정을 불러오는 중...</p> : renderCalendar()}
        </div>

        <div className="admin-schedule-form">
          {selectedDay ? (
            <div>
              <h4>
                {scheduleDate.getFullYear()}년 {scheduleDate.getMonth() + 1}월 {selectedDay}일
              </h4>
              {getScheduleForDay(selectedDay) ? (
                <div className="form-actions" style={{ flexDirection: 'column', gap: '12px' }}>
                  <p style={{ color: '#ef4444', fontWeight: 600 }}>현재: 수업 불가</p>
                  <button type="button" onClick={onDelete}>되돌리기 (수업 가능)</button>
                  <button type="button" onClick={onClose}>닫기</button>
                </div>
              ) : (
                <div className="form-actions" style={{ flexDirection: 'column', gap: '12px' }}>
                  <p style={{ color: '#22c55e', fontWeight: 600 }}>현재: 수업 가능</p>
                  <button type="button" className="danger" onClick={onSubmit}>수업 불가로 설정</button>
                  <button type="button" onClick={onClose}>닫기</button>
                </div>
              )}
            </div>
          ) : (
            <p className="muted-text">캘린더에서 날짜를 클릭하여 일정을 수정하세요.</p>
          )}
        </div>
      </div>
    </section>
  );
}

ScheduleSection.propTypes = {
  schedulesLoading: PropTypes.bool.isRequired,
  scheduleNotice: PropTypes.string,
  scheduleNoticeType: PropTypes.string,
  renderCalendar: PropTypes.func.isRequired,
  selectedDay: PropTypes.number,
  scheduleDate: PropTypes.instanceOf(Date).isRequired,
  getScheduleForDay: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ScheduleSection;
