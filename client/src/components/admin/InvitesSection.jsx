import PropTypes from 'prop-types';

function InvitesSection({
  invites,
  invitesLoading,
  inviteError,
  inviteNotice,
  inviteNoticeType,
  inviteForm,
  isCreatingInvite,
  onRefresh,
  onSubmit,
  onChangeForm,
  onCopyCode,
  onRevoke,
  formatDate,
}) {
  return (
    <section className="admin-invites">
      <div className="section-header">
        <h2>관리자 초대 코드</h2>
        <button type="button" onClick={onRefresh}>
          새로고침
        </button>
      </div>

      <form className="admin-form invite-form" onSubmit={onSubmit}>
        <div className="form-grid">
          <label>
            초대 이메일 (선택)
            <input
              type="email"
              value={inviteForm.email}
              onChange={(event) =>
                onChangeForm((prev) => ({ ...prev, email: event.target.value }))
              }
              placeholder="지정된 이메일만 허용하려면 입력"
            />
          </label>
          <label>
            만료 시간 (시간)
            <input
              type="number"
              min="1"
              value={inviteForm.expiresInHours}
              onChange={(event) =>
                onChangeForm((prev) => ({ ...prev, expiresInHours: event.target.value }))
              }
              required
            />
          </label>
        </div>
        <div className="form-actions">
          <button type="submit" disabled={isCreatingInvite}>
            {isCreatingInvite ? '발급 중...' : '초대 코드 발급'}
          </button>
        </div>
      </form>

      {inviteNotice && (
        <div className={`status ${inviteNoticeType === 'error' ? 'error' : ''}`}>{inviteNotice}</div>
      )}
      {inviteError && <p className="status error">{inviteError}</p>}

      {invitesLoading ? (
        <p>초대 코드를 불러오는 중입니다...</p>
      ) : invites.length ? (
        <div className="admin-order-table-wrapper">
          <table className="admin-order-table">
            <thead>
              <tr>
                <th>코드</th>
                <th>대상 이메일</th>
                <th>만료</th>
                <th>상태</th>
                <th>조치</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((invite) => {
                const expiresAt = invite.expiresAt ? new Date(invite.expiresAt) : null;
                const isExpired = expiresAt ? expiresAt.getTime() < Date.now() : false;
                const isUsed = Boolean(invite.usedAt);
                return (
                  <tr key={invite.id}>
                    <td className="code-cell">
                      <code>{invite.code}</code>
                    </td>
                    <td>{invite.email || <span className="muted-text">제한 없음</span>}</td>
                    <td>{formatDate(invite.expiresAt)}</td>
                    <td>
                      {isUsed ? (
                        <span className="badge badge--muted">사용됨</span>
                      ) : isExpired ? (
                        <span className="badge badge--muted">만료</span>
                      ) : (
                        <span className="badge">대기</span>
                      )}
                    </td>
                    <td className="invite-actions">
                      <button
                        type="button"
                        onClick={() => onCopyCode(invite.code)}
                        disabled={isUsed || isExpired}
                      >
                        코드 복사
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => onRevoke(invite.id)}
                        disabled={isUsed}
                      >
                        즉시 만료
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p>발급된 초대 코드가 없습니다.</p>
      )}
    </section>
  );
}

InvitesSection.propTypes = {
  invites: PropTypes.array.isRequired,
  invitesLoading: PropTypes.bool.isRequired,
  inviteError: PropTypes.string,
  inviteNotice: PropTypes.string,
  inviteNoticeType: PropTypes.string,
  inviteForm: PropTypes.object.isRequired,
  isCreatingInvite: PropTypes.bool.isRequired,
  onRefresh: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onChangeForm: PropTypes.func.isRequired,
  onCopyCode: PropTypes.func.isRequired,
  onRevoke: PropTypes.func.isRequired,
  formatDate: PropTypes.func.isRequired,
};

export default InvitesSection;
