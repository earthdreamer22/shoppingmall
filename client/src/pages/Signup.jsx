import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createEmptyUser, USER_ROLES } from '../models/userModel.js';
import { registerUser } from '../controllers/userController.js';
import { useAuth } from '../context/AuthContext.jsx';
import '../App.css';

function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState(createEmptyUser());
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [postcodeReady, setPostcodeReady] = useState(Boolean(window.daum?.Postcode));
  const [postcodeMessage, setPostcodeMessage] = useState('주소 검색 버튼을 눌러 입력해주세요.');
  const [openAgreement, setOpenAgreement] = useState(null);

  const updateField = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  useEffect(() => {
    if (window.daum?.Postcode) {
      setPostcodeReady(true);
      return;
    }

    const scriptId = 'daum-postcode-script';
    const existing = document.getElementById(scriptId);
    if (existing) {
      existing.addEventListener('load', () => setPostcodeReady(true), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.async = true;
    script.onload = () => setPostcodeReady(true);
    script.onerror = () => setPostcodeMessage('주소 검색 도구를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
    document.body.appendChild(script);
  }, []);

  const handleAddressSearch = () => {
    if (!window.daum?.Postcode) {
      setStatus('주소 검색 도구를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    new window.daum.Postcode({
      oncomplete: (data) => {
        const road = data.roadAddress?.trim();
        const jibun = data.jibunAddress?.trim();
        setForm((prev) => ({
          ...prev,
          postalCode: data.zonecode ?? '',
          addressLine1: road || jibun || prev.addressLine1,
        }));
        setPostcodeMessage(`${data.zonecode} · ${road || jibun || ''}`);
      },
    }).open();
  };

  const closeAgreement = () => setOpenAgreement(null);

  const AgreementModal = () => {
    if (!openAgreement) return null;
    const isPrivacy = openAgreement === 'privacy';
    return (
      <div className="modal-backdrop" onClick={closeAgreement}>
        <div className="modal-content" onClick={(event) => event.stopPropagation()}>
          <header className="modal-header">
            <h2>{isPrivacy ? '개인정보 수집 및 이용안내' : '서비스 이용약관'}</h2>
            <button type="button" className="modal-close" onClick={closeAgreement} aria-label="닫기">
              ×
            </button>
          </header>
          <div className="modal-body">
            {isPrivacy ? (
              <>
                <p>종이책 연구소는 전자상거래 서비스를 제공하기 위해 다음과 같이 개인정보를 수집·이용합니다.</p>
                <ul>
                  <li>
                    <strong>수집·이용 목적</strong>: 회원 가입 및 본인 확인, 주문 접수와 결제 처리, 상품 배송, 고객 상담·민원 처리, 법령에 따른 의무 이행
                  </li>
                  <li>
                    <strong>수집 항목</strong>: 이름, 이메일, 비밀번호, 휴대전화 번호, 주소(우편번호 포함), 주문/결제 기록, 서비스 이용 기록
                  </li>
                  <li>
                    <strong>보유 및 이용 기간</strong>: 회원 탈퇴 시까지 보관하며, 전자상거래법 등 관련 법령에 따라 최대 5년간 추가 보관될 수 있습니다.
                  </li>
                  <li>
                    <strong>동의 거부 및 불이익</strong>: 이용자는 개인정보 수집에 동의하지 않을 수 있으나, 필수 항목 미동의 시 회원 가입 및 주문 서비스 이용이 제한됩니다.
                  </li>
                </ul>
                <p>선택 동의(마케팅 수신 등)는 동의 여부와 관계없이 핵심 서비스 이용에 영향을 주지 않습니다.</p>
              </>
            ) : (
              <>
                <p>본 약관은 종이책 연구소 온라인 쇼핑몰 이용에 관한 회원과 회사 간의 권리·의무를 규정합니다.</p>
                <ol>
                  <li>회원은 정확한 정보를 제공해야 하며, 계정 정보 관리 책임은 회원에게 있습니다.</li>
                  <li>주문 및 결제 완료 시 구매 계약이 성립하며, 재고 부족 또는 명백한 가격 오류 등 불가피한 사유가 있을 경우 회사는 주문을 취소할 수 있습니다.</li>
                  <li>배송 완료 후 7일 이내에 관계 법령이 정한 조건에 따라 교환·환불을 요청할 수 있습니다.</li>
                  <li>회원은 서비스를 법령 또는 약관에 위반하는 방식으로 이용해서는 안 되며, 위반 시 서비스 이용이 제한될 수 있습니다.</li>
                  <li>본 약관은 대한민국 법률을 따르며, 분쟁 발생 시 관할 법원은 서울중앙지방법원으로 합니다.</li>
                </ol>
                <p>자세한 문의는 haeglim@naver.com 으로 연락해주시기 바랍니다.</p>
              </>
            )}
          </div>
          <footer className="modal-footer">
            <button type="button" onClick={closeAgreement}>
              확인
            </button>
          </footer>
        </div>
      </div>
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus('');

    if (!agreePrivacy || !agreeTerms) {
      setStatus('필수 약관에 모두 동의해야 합니다.');
      return;
    }

    if (!form.name?.trim()) {
      setStatus('이름을 입력해주세요.');
      return;
    }

    if (!form.phone?.trim()) {
      setStatus('휴대전화 번호를 입력해주세요.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setStatus('비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    if (form.role === USER_ROLES.ADMIN && !form.adminInviteCode?.trim()) {
      setStatus('관리자 초대 코드를 입력해주세요.');
      return;
    }

    if (!form.postalCode || !form.addressLine1) {
      setStatus('주소 검색을 완료해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await registerUser({
        ...form,
        consentPrivacy: agreePrivacy,
        consentTerms: agreeTerms,
        createdAt: new Date().toISOString(),
      });
      try {
        await login({ email: form.email, password: form.password });
        navigate('/');
      } catch (loginError) {
        console.error('[signup] auto login failed', loginError);
        setStatus('회원가입은 완료되었지만 자동 로그인에 실패했습니다. 로그인 페이지로 이동합니다.');
        setTimeout(() => navigate('/login'), 1200);
        return;
      }
      setStatus('회원가입이 완료되었습니다. 잠시 후 메인으로 이동합니다.');
    } catch (error) {
      console.error(error);
      setStatus(error.message ?? '회원가입에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="App">
      <header>
        <h1>회원가입</h1>
        <p>종이책 연구소 이용을 위한 기본 정보를 입력해주세요.</p>
      </header>

      {status && <div className="status">{status}</div>}

      <main>
        <section className="product-form">
          <form onSubmit={handleSubmit}>
            <fieldset style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
              <legend>개인정보 및 이용 약관</legend>
              <div className="agreement-row">
                <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flex: 1 }}>
                  <input
                    type="checkbox"
                    checked={agreePrivacy}
                    onChange={(event) => setAgreePrivacy(event.target.checked)}
                    required
                  />
                  <span>
                    (필수) 개인정보 수집·이용에 동의합니다.
                    <br />
                    <button type="button" className="link-button" onClick={() => setOpenAgreement('privacy')}>
                      전문 보기
                    </button>
                  </span>
                </label>
              </div>
              <div className="agreement-row" style={{ marginTop: '12px' }}>
                <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flex: 1 }}>
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(event) => setAgreeTerms(event.target.checked)}
                    required
                  />
                  <span>
                    (필수) 서비스 이용약관에 동의합니다.
                    <br />
                    <button type="button" className="link-button" onClick={() => setOpenAgreement('terms')}>
                      전문 보기
                    </button>
                  </span>
                </label>
              </div>
              <div className="agreement-row" style={{ marginTop: '12px' }}>
                <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flex: 1 }}>
                  <input
                    type="checkbox"
                    checked={form.consentMarketing}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, consentMarketing: event.target.checked }))
                    }
                  />
                  <span>
                    (선택) 이벤트·신간 안내 등 마케팅 정보 수신에 동의합니다.
                    <br />
                    동의하지 않아도 서비스 이용에는 영향이 없습니다.
                  </span>
                </label>
              </div>
            </fieldset>
            <label>
              이름
              <input
                required
                value={form.name}
                onChange={updateField('name')}
                placeholder="홍길동"
              />
            </label>

            <label>
              이메일
              <input
                required
                type="email"
                value={form.email}
                onChange={updateField('email')}
                placeholder="you@example.com"
              />
            </label>

            <label>
              휴대전화 번호
              <input
                required
                type="tel"
                value={form.phone}
                onChange={updateField('phone')}
                placeholder="010-1234-5678"
              />
            </label>

            <label>
              비밀번호
              <input
                required
                type="password"
                minLength={6}
                value={form.password}
                onChange={updateField('password')}
              />
            </label>

            <label>
              비밀번호 확인
              <input
                required
                type="password"
                minLength={6}
                value={form.confirmPassword}
                onChange={updateField('confirmPassword')}
              />
            </label>

            <div className="address-group">
              <label>
                우편번호
                <div className="inline-field">
                  <input
                    required
                    value={form.postalCode}
                    readOnly
                    placeholder="주소 검색 버튼으로 자동 입력"
                  />
                  <button
                    type="button"
                    onClick={handleAddressSearch}
                    disabled={!postcodeReady}
                    style={{ marginLeft: '8px' }}
                  >
                    주소 검색
                  </button>
                </div>
              </label>
              <label>
                기본 주소
                <input
                  required
                  value={form.addressLine1}
                  readOnly
                  placeholder="주소 검색 버튼으로 자동 입력"
                />
              </label>
              <label>
                상세 주소
                <input
                  value={form.addressLine2}
                  onChange={updateField('addressLine2')}
                  placeholder="상세 주소를 입력해주세요"
                />
              </label>
              <p className="muted-text" style={{ marginTop: '4px' }}>{postcodeMessage}</p>
            </div>

            <div className="inline-field">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={form.role === USER_ROLES.ADMIN}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      role: event.target.checked ? USER_ROLES.ADMIN : USER_ROLES.USER,
                      adminInviteCode: event.target.checked ? prev.adminInviteCode : '',
                    }))
                  }
                />
                <span>관리자 초대 코드를 보유하고 있습니다.</span>
              </label>
            </div>

            {form.role === USER_ROLES.ADMIN && (
              <label>
                관리자 초대 코드
                <input
                  required
                  value={form.adminInviteCode}
                  onChange={updateField('adminInviteCode')}
                  placeholder="초대 코드를 입력하세요"
                />
              </label>
            )}

            <button type="submit" disabled={isSubmitting || !agreePrivacy || !agreeTerms}>
              {isSubmitting ? '등록 중...' : '회원가입' }
            </button>
          </form>

          <p style={{ marginTop: '16px' }}>
            <Link to="/">메인으로 돌아가기</Link>
          </p>
        </section>
      </main>
      <AgreementModal />
    </div>
  );
}

export default Signup;
