# 쇼핑몰 프로젝트 README

## 프로젝트 개요
Vite + React 프론트엔드와 Express + MongoDB 백엔드로 구성된 풀스택 전자상거래 쇼핑몰 프로젝트입니다.

---

## 기술 스택

### 프론트엔드
- **프레임워크**: React 19.1.1 + Vite 7.1.7
- **라우팅**: React Router v7
- **스타일링**: Tailwind CSS
- **상태 관리**: React Context API
- **이미지 업로드**: Cloudinary
- **결제**: PortOne (KG이니시스)
- **타입 검증**: PropTypes

### 백엔드
- **런타임**: Node.js + Express
- **데이터베이스**: MongoDB Atlas (Mongoose ODM)
- **인증**: JWT (httpOnly 쿠키)
- **보안**: Helmet, CORS, CSRF, Rate Limiting
- **검증**: Zod
- **파일 업로드**: Cloudinary
- **결제**: PortOne REST API

---

## 프로젝트 구조

```
shoppingmall_exam/
├── client/                    # 프론트엔드 (Vite + React)
│   ├── src/
│   │   ├── components/        # 재사용 컴포넌트
│   │   │   ├── common/        # Button 등 공통 컴포넌트
│   │   │   ├── layout/        # Layout (Navbar + Outlet + Footer)
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── ProtectedRoute.jsx  # 인증/권한 보호
│   │   │   └── ScrollToTop.jsx
│   │   ├── pages/             # 페이지 컴포넌트 (15개)
│   │   │   ├── Welcome.jsx
│   │   │   ├── Shop.jsx
│   │   │   ├── Schedule.jsx
│   │   │   ├── Inquiry.jsx
│   │   │   ├── Design.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Admin.jsx
│   │   │   ├── ProductDetail.jsx
│   │   │   ├── Cart.jsx
│   │   │   ├── MyPage.jsx
│   │   │   ├── Checkout.jsx
│   │   │   ├── OrderComplete.jsx
│   │   │   ├── Terms.jsx         # 이용약관
│   │   │   ├── Privacy.jsx       # 개인정보처리방침
│   │   │   └── NotFound.jsx      # 404 페이지
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # 전역 인증 상태
│   │   ├── lib/
│   │   │   └── apiClient.js      # API 호출 유틸
│   │   ├── App.jsx               # 라우터 설정
│   │   └── main.jsx
│   ├── .env                      # 환경변수
│   └── package.json
│
├── server/                    # 백엔드 (Express + MongoDB)
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   └── env.js           # 환경변수 중앙 관리
│   │   ├── models/              # Mongoose 스키마
│   │   │   ├── Product.js
│   │   │   ├── User.js
│   │   │   ├── Cart.js
│   │   │   ├── Order.js
│   │   │   └── InvalidToken.js
│   │   ├── controllers/         # 비즈니스 로직
│   │   │   ├── productController.js
│   │   │   ├── userController.js
│   │   │   ├── authController.js
│   │   │   ├── cartController.js
│   │   │   └── orderController.js
│   │   ├── routes/              # API 라우터
│   │   │   ├── productRoutes.js
│   │   │   ├── adminProductRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   ├── cartRoutes.js
│   │   │   └── orderRoutes.js
│   │   ├── middleware/          # 미들웨어
│   │   │   ├── authMiddleware.js
│   │   │   ├── csrfMiddleware.js
│   │   │   ├── rateLimitMiddleware.js
│   │   │   ├── authRateLimiter.js
│   │   │   ├── objectIdValidator.js
│   │   │   └── zodValidation.js
│   │   ├── services/
│   │   │   └── portoneService.js  # PortOne API
│   │   ├── utils/
│   │   │   └── asyncHandler.js
│   │   ├── app.js               # Express 앱 설정
│   │   └── index.js             # 서버 진입점
│   ├── .env                     # 환경변수
│   └── package.json
│
├── agent.md                   # 상세 작업 이력
└── README.md                  # 이 파일
```

---

## 주요 기능

### 1. 사용자 인증 & 권한
- ✅ JWT 기반 인증 (httpOnly 쿠키)
- ✅ 역할 기반 접근 제어 (admin, user)
- ✅ 비밀번호 bcrypt 해싱 (SALT=10)
- ✅ 관리자 초대 코드 시스템
- ✅ 토큰 무효화 (InvalidToken 컬렉션 + TTL)
- ✅ ProtectedRoute 컴포넌트 (인증/권한 보호)

### 2. 상품 관리
- ✅ CRUD 작업 (관리자 전용)
- ✅ Cloudinary 이미지 업로드 (대표 이미지, 상세 이미지)
- ✅ 카테고리별 필터링 (책수리, 클래스, 쇼핑몰)
- ✅ SKU 고유값 관리
- ✅ 상품 옵션 (색상, 사이즈 등)
- ✅ 페이지네이션 (기본 20개, 최대 100개)

### 3. 장바구니 & 주문
- ✅ 장바구니 추가/수정/삭제
- ✅ 실시간 수량 업데이트
- ✅ 체크아웃 페이지 (배송지, 결제 정보)
- ✅ PortOne 결제 연동 (PC/모바일)
- ✅ 주문 이력 조회
- ✅ 주문 상태 관리 (pending, paid, cancelled)

### 4. 보안
- ✅ CSRF 보호 (Double Submit Cookie)
- ✅ CORS 화이트리스트
- ✅ Rate Limiting (일반/관리자/민감 경로 분리)
- ✅ Helmet 보안 헤더 (CSP, Referrer-Policy, Permissions-Policy)
- ✅ MongoDB ObjectId 검증
- ✅ Zod 입력 검증
- ✅ 감사 로깅 (인증 이벤트)

### 5. UI/UX
- ✅ 반응형 디자인 (Tailwind CSS)
- ✅ 404 NotFound 페이지
- ✅ 공통 Button 컴포넌트 (5 variants, 3 sizes)
- ✅ Layout 컴포넌트 (Navbar/Footer 중복 제거)
- ✅ 로딩 상태 표시
- ✅ 에러 핸들링 및 사용자 피드백

---

## 환경 변수 설정

### 클라이언트 (.env)
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_preset

# PortOne V2 (필수)
VITE_PORTONE_STORE_ID=store-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_PORTONE_CHANNEL_KEY=channel-key-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# PortOne V1 (Deprecated - 제거 예정)
# VITE_PORTONE_CUSTOMER_CODE=your_customer_code
# VITE_PORTONE_PG=html5_inicis
# VITE_PORTONE_PG_MID=your_mid
```

### 서버 (.env)
```env
# 서버 설정
NODE_ENV=development
PORT=5000

# 데이터베이스
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/shoppingmall?retryWrites=true&w=majority

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_MINUTES=60

# CORS
CLIENT_ORIGIN=http://localhost:5173

# 쿠키
COOKIE_SECURE=false
COOKIE_SAMESITE=strict

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_UPLOAD_PRESET=your_preset

# PortOne V2 (필수)
PORTONE_STORE_ID=store-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
PORTONE_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# PortOne V1 (Deprecated - 제거 예정)
# PORTONE_IMP_KEY=your_imp_key
# PORTONE_IMP_SECRET=your_imp_secret
```

---

## 설치 및 실행

### 1. 의존성 설치
```bash
# 클라이언트
cd client
npm install

# 서버
cd ../server
npm install
```

### 2. 환경 변수 설정
- `client/.env` 파일 생성 및 설정
- `server/.env` 파일 생성 및 설정

### 3. 개발 서버 실행
```bash
# 서버 (터미널 1)
cd server
npm run dev
# → http://localhost:5000

# 클라이언트 (터미널 2)
cd client
npm run dev
# → http://localhost:5173
```

### 4. 프로덕션 빌드
```bash
# 클라이언트 빌드
cd client
npm run build

# 서버 실행
cd server
npm start
```

---

## 배포

### Vercel (프론트엔드)
1. GitHub 저장소 연결
2. Root Directory: `client`
3. Framework Preset: Vite
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. 환경변수 설정 (VITE_* 변수들)

### Render (백엔드)
1. GitHub 저장소 연결
2. Root Directory: `server`
3. Build Command: `npm install`
4. Start Command: `npm start`
5. 환경변수 설정 (NODE_ENV, MONGODB_URI 등)

### API 프록시 설정 (client/vercel.json)
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-backend.onrender.com/api/:path*"
    },
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 보안 수준 평가

### 전체 평가: ⭐⭐⭐⭐ (4.5/5) - 우수함

| 카테고리 | 수준 | 비고 |
|---------|------|------|
| 인증/인가 | ⭐⭐⭐⭐⭐ | JWT + RBAC + 초대코드 |
| 요청 보호 | ⭐⭐⭐⭐⭐ | Rate Limit + CSRF + CORS + Helmet |
| 입력 검증 | ⭐⭐⭐⭐ | ObjectId + Zod + 정규화 |
| API 보안 | ⭐⭐⭐⭐ | 페이지네이션 + 민감정보 필터링 |
| 파일 업로드 | ⭐⭐⭐⭐ | 형식/크기 제한 |
| 데이터베이스 | ⭐⭐⭐⭐ | 스키마 검증 + 유니크 인덱스 |
| 세션/쿠키 | ⭐⭐⭐⭐⭐ | HttpOnly + Secure + SameSite |
| 감사 로깅 | ⭐⭐⭐ | 인증 이벤트만 기록 |
| 에러 처리 | ⭐⭐⭐⭐ | 중앙 핸들러 + AsyncHandler |

---

## Phase 1 프론트엔드 개선 (2025-12-09 완료)

### 완료된 작업
1. **404 NotFound 페이지** - 존재하지 않는 경로 안내
2. **Button 컴포넌트** - 5 variants, 3 sizes, UI 일관성 확보
3. **Layout 컴포넌트** - Navbar/Footer 중복 93% 감소 (450줄 → 30줄)
4. **ProtectedRoute 컴포넌트** - 인증/권한 기반 라우트 보호

### 개선 효과
- ✅ 코드 중복 93% 감소
- ✅ UI 일관성 확보
- ✅ 보안 강화
- ✅ 유지보수성 향상
- ✅ 사용자 경험 개선

### Git 커밋
```
8ff4d6a Add ProtectedRoute component for authentication
6335603 Add Layout component with nested routes
782ca26 Add common Button component and apply to Login page
c3fee0b Add 404 NotFound page
d62f822 Fix Korean text encoding issues (UTF-8)
```

---

## Phase 2: PortOne V2 마이그레이션 (2025-12-16 완료)

### 개요
PortOne V1 API에서 V2 API로 전환하여 최신 결제 시스템을 적용했습니다.

### 변경된 파일 (5개)

#### 프론트엔드 (2개)
1. **client/src/pages/Checkout.jsx**
   - SDK 변경: `cdn.iamport.kr/v1/iamport.js` → `cdn.portone.io/v2/browser-sdk.js`
   - 전역 객체: `IMP` → `PortOne`
   - 환경변수: `VITE_PORTONE_CUSTOMER_CODE` → `VITE_PORTONE_STORE_ID`, `VITE_PORTONE_CHANNEL_KEY`
   - 결제 호출: `IMP.request_pay()` (콜백) → `PortOne.requestPayment()` (async/await)
   - 결제 수단: `card/trans/vbank` → `CARD/TRANSFER/VIRTUAL_ACCOUNT`

2. **client/src/pages/OrderComplete.jsx**
   - URL 파라미터: `imp_uid`, `merchant_uid` → `paymentId`
   - 에러 파라미터: `error_msg` → `code`, `message`

#### 백엔드 (3개)
3. **server/src/services/portoneService.js**
   - API 베이스: `https://api.iamport.kr` → `https://api.portone.io`
   - 인증 방식: 2단계 토큰 인증 → 직접 API Secret 사용
   - Authorization 헤더: 토큰 → `PortOne {apiSecret}`
   - 함수명: `getPaymentByImpUid()` → `getPaymentByPaymentId()`
   - 응답 구조: `response.data.response` → `response.data`

4. **server/src/controllers/orderController.js**
   - 결제 식별자: `impUid`, `merchantUid` → `paymentId`
   - 결제 상태: `paid`, `ready` → `PAID`, `VIRTUAL_ACCOUNT_ISSUED`
   - 금액 필드: `pgPayment.amount` → `pgPayment.amount?.total`
   - 카드 정보: `card_name` → `card?.name`, `apply_num` → `card?.approvalNumber`

5. **server/src/config/env.js**
   - 필수 환경변수 추가: `PORTONE_STORE_ID`, `PORTONE_API_SECRET`
   - V1 변수는 호환성을 위해 유지 (제거 예정)

### 새로운 환경변수 (필수)

#### 클라이언트
```env
# V2 (필수)
VITE_PORTONE_STORE_ID=store-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_PORTONE_CHANNEL_KEY=channel-key-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# V1 (Deprecated - 제거 예정)
# VITE_PORTONE_CUSTOMER_CODE=
# VITE_PORTONE_PG=
# VITE_PORTONE_PG_MID=
```

#### 서버
```env
# V2 (필수)
PORTONE_STORE_ID=store-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
PORTONE_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# V1 (Deprecated - 제거 예정)
# PORTONE_IMP_KEY=
# PORTONE_IMP_SECRET=
```

### 배포 체크리스트

#### 1. PortOne 콘솔 설정
- [ ] V2 Store ID 확보
- [ ] V2 채널 생성 (Channel Key 확보)
- [ ] V2 API Secret 확보
- [ ] 채널 결제 수단 설정 (카드, 계좌이체, 가상계좌, 휴대폰)

#### 2. Vercel 환경변수 설정 (프론트엔드)
```
VITE_PORTONE_STORE_ID=store-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_PORTONE_CHANNEL_KEY=channel-key-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

#### 3. Render 환경변수 설정 (백엔드)
```
PORTONE_STORE_ID=store-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
PORTONE_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### 4. 배포 및 테스트
- [ ] Vercel 프론트엔드 재배포
- [ ] Render 백엔드 재배포
- [ ] 테스트 결제 실행 (카드/계좌이체/가상계좌)
- [ ] 결제 취소 테스트
- [ ] 모바일 결제 테스트 (리디렉트 방식)

#### 5. V1 환경변수 제거 (안정화 후)
- [ ] Vercel에서 V1 변수 삭제
- [ ] Render에서 V1 변수 삭제
- [ ] `env.js`에서 V1 변수 관련 코드 제거

### 주요 변경 사항

| 항목 | V1 | V2 |
|------|----|----|
| SDK URL | cdn.iamport.kr/v1/iamport.js | cdn.portone.io/v2/browser-sdk.js |
| 전역 객체 | IMP | PortOne |
| 결제 호출 | request_pay(options, callback) | requestPayment(options) - async |
| 식별자 | imp_uid + merchant_uid | paymentId |
| 결제 상태 | paid, ready | PAID, VIRTUAL_ACCOUNT_ISSUED |
| 인증 방식 | getToken API → 토큰 사용 | Authorization: PortOne {secret} |
| API Base | api.iamport.kr | api.portone.io |

### Git 커밋
```
<커밋 예정> Migrate from PortOne V1 to V2 payment system
```

---

## Phase 3 추가 개선 계획 (보류)

**보류 이유**: "작동하는 코드를 건드리지 마라" 원칙 준수

### 예정된 개선 사항 (중~고위험)
- 상태 관리 개선 (React Query, Zustand)
- TypeScript 마이그레이션
- 폼 관리 라이브러리 (React Hook Form)
- 성능 최적화 (React.memo, useMemo)
- ESLint/Prettier 설정

---

## 법적 요구사항

### 필수 페이지
- ✅ 이용약관 (`/terms`)
- ✅ 개인정보처리방침 (`/privacy`)
- ✅ Footer 사업자 정보 표시

### PG사 심사 필요 서류 (개인사업자)
1. 사업자등록증 사본
2. 대표자 신분증 사본
3. 통장 사본 (대표자 명의)
4. 인감증명서 원본 (3개월 이내)
5. 보증보험증권 (필요시)

---

## API 엔드포인트

### 인증 (`/api/auth`)
- `POST /login` - 로그인
- `POST /logout` - 로그아웃
- `GET /me` - 현재 사용자 정보

### 사용자 (`/api/users`)
- `POST /` - 회원가입
- `GET /:userId` - 사용자 조회
- `PUT /:userId` - 사용자 정보 수정
- `DELETE /:userId` - 회원 탈퇴

### 상품 (`/api/products`, `/api/admin/products`)
- `GET /products` - 상품 목록 조회 (페이지네이션)
- `GET /products/:productId` - 상품 상세 조회
- `POST /admin/products` - 상품 등록 (관리자)
- `PUT /admin/products/:productId` - 상품 수정 (관리자)
- `DELETE /admin/products/:productId` - 상품 삭제 (관리자)

### 장바구니 (`/api/cart`)
- `GET /` - 장바구니 조회 (인증 필요)
- `POST /` - 장바구니 추가 (인증 필요)
- `PUT /:itemId` - 수량 변경 (인증 필요)
- `DELETE /:itemId` - 장바구니 삭제 (인증 필요)

### 주문 (`/api/orders`)
- `GET /` - 주문 목록 조회 (인증 필요)
- `POST /` - 주문 생성 (인증 필요)
- `PUT /:orderId/cancel` - 주문 취소 (인증 필요)

---

## 트러블슈팅

### 한글 인코딩 문제
**증상**: 서버/클라이언트 파일에서 한글이 깨짐 (mojibake)
**해결**: UTF-8 인코딩으로 파일 재저장

### CORS 에러
**증상**: 브라우저에서 API 호출 시 CORS 에러
**해결**: `server/.env`의 `CLIENT_ORIGIN` 설정 확인

### 쿠키 전송 안됨
**증상**: JWT 토큰이 쿠키로 전달되지 않음
**해결**:
- `apiClient.js`에서 `credentials: 'include'` 설정
- 서버 CORS에서 `credentials: true` 설정

### 결제 실패
**증상**: PortOne 결제창에서 결제 실패
**해결**:
- PortOne 환경변수 확인
- 테스트 모드 활성화 확인
- 서버 로그에서 결제 검증 오류 확인

---

## 참고 문서
- [agent.md](./agent.md) - 상세 작업 이력 및 기술 결정 사항
- [React Router v7 문서](https://reactrouter.com/)
- [Vite 문서](https://vitejs.dev/)
- [Mongoose 문서](https://mongoosejs.com/)
- [PortOne 문서](https://portone.io/docs)
- [Cloudinary 문서](https://cloudinary.com/documentation)

---

## 라이선스
이 프로젝트는 교육 목적으로 제작되었습니다.

---

## 작성자
- 개발 기간: 2025-11 ~ 2025-12
- 최종 업데이트: 2025-12-16 (PortOne V2 마이그레이션)
