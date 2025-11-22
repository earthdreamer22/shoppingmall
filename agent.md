# 쇼핑몰 프로젝트 작업 정리

## 초기 세팅
- `/client`에서 `npm create vite@latest . -- --template react`와 `npm install`로 Vite + React 환경을 구축한 뒤 `client/src/App.jsx`, `App.css`, `index.css`, `main.jsx`를 수정해 쇼핑몰 레이아웃을 구성했습니다.
- `/server`에서 `npm init -y` 후 `npm install express mongoose cors dotenv morgan bcrypt` 와 `npm install --save-dev nodemon`을 실행하고, `src/config`, `src/models`, `src/controllers`, `src/routes`, `src/utils` 구조를 만들었습니다.
- `server/src/index.js`에서 `.env`를 불러와 `connectDatabase`를 수행하고, `server/src/app.js`에 CORS/JSON/morgan/라우터/404/에러 핸들러를 설정했습니다.
- `.env.example`를 기반으로 실제 `.env`에 Atlas URI(`mongodb+srv://philli22:olive0075@clustermall.atyn3vt.mongodb.net/shoppingmall?retryWrites=true&w=majority&appName=ClusterMALL`), `PORT`, `CLIENT_ORIGIN` 값을 넣었습니다.

## 백엔드 구성
- 모델: `server/src/models/Product.js`, `User.js`, `Cart.js`, `Order.js`에 각각 상품, 사용자, 장바구니, 주문 스키마를 정의하고 `toJSON`에서 `_id`를 `id`로 변환했습니다.
- 컨트롤러 & 라우터: `server/src/controllers`와 `server/src/routes`를 통해 상품 CRUD, 회원 생성/조회, 장바구니 추가/삭제, 주문 생성/취소 로직을 작성했습니다.
- 도우미: `server/src/utils/asyncHandler.js`로 비동기 에러를 처리하고, `server/src/utils/userContext.js`에서 데모 사용자를 자동 생성해 장바구니/주문 API가 테스트용 사용자 기준으로 동작하도록 했습니다.
- 사용자 보강: `User` 스키마에 `password`, `role`, `consentPrivacy`, `consentTerms`를 추가하고, `userController`에서 bcrypt 해시, 이메일 중복 검사, 역할 정규화, 약관 동의 저장, 생성일 갱신을 지원했습니다. PUT/DELETE 라우터(`server/src/routes/userRoutes.js`)를 추가해 회원 정보 수정·삭제 API를 완성했습니다.

## 프런트엔드 확장
- 대시보드 분리: 상품/장바구니/주문 뷰를 `client/src/pages/Home.jsx`로 옮기고 `react-router-dom`을 도입해 `client/src/App.jsx`에서 `/`와 `/signup` 라우트를 제공했습니다.
- 회원가입 구조: `client/models/userModel.js`에 회원 모델을 정의하고, `client/routers/userRouter.js` + `client/controllers/userController.js` 조합으로 API 호출과 입력 검증을 분리했습니다.
- Signup 페이지: `client/src/pages/Signup.jsx`에서 이메일, 비밀번호/확인, 주소, 사용자 분류 입력을 구현하고 가입 완료 시 홈으로 이동하도록 했습니다. `client/index.html` 상단에는 홈/회원가입 버튼을 추가했습니다.

## 약관 동의 및 UI 개선
- 필수 체크박스: 회원가입 폼 상단에 개인정보 수집/이용, 서비스 이용약관 두 개의 체크박스를 추가하고 모두 체크해야 가입 버튼이 활성화되도록 구현했습니다. 동의 상태는 컨트롤러와 서버에 전달·저장됩니다.
- 사용자 분류 UI: 드롭다운을 가로 배치한 인라인 레이아웃(`inline-field`, `inline-select`)으로 변경하고 대응 CSS를 `client/src/App.css`에 추가했습니다.

## 실행/검증 방법
- 서버 실행: `cd server && npm run dev` → `[database] MongoDB 연결 성공` 메시지로 연결 여부 확인.
- 클라이언트 실행: `cd client && npm run dev` → `http://localhost:5173` 접속, 상단 네비게이션으로 회원가입 페이지 이동.
- 회원가입 테스트: 체크박스 동의 후 제출하면 MongoDB Atlas `shoppingmall.users` 컬렉션에 `consentPrivacy`, `consentTerms`, `role`, 해시된 `password` 등이 기록되는지 Compass에서 확인할 수 있습니다.

이 흐름을 그대로 따라 하면 현재 쇼핑몰 데모(상품/장바구니/주문/회원관리 + 약관 동의) 구조를 재현할 수 있습니다.

## 인증 및 보안 강화
- `/api/auth/login`, `/api/auth/logout`, `/api/auth/me` 엔드포인트를 별도 라우터(`server/src/routes/authRoutes.js`)로 분리하고 JWT를 httpOnly 쿠키로 발급·검증하도록 구성했습니다. 만료 시간은 기본 60분(`JWT_EXPIRES_MINUTES`)이며, 로그아웃 시 `InvalidToken` 컬렉션에 토큰을 기록해 TTL 인덱스로 자동 무효화합니다.
- `server/src/middleware/authMiddleware.js`를 통해 장바구니·주문 라우터와 관리자 상품 라우터에 인증/권한 미들웨어를 적용했습니다. 토큰은 `Authorization: Bearer` 또는 쿠키에서 추출합니다.

## 상품 관리 고도화
- `Product` 스키마에 `sku` 고유값, `category` enum(상의/하의/악세서리), 대표 이미지 플래그를 포함한 `images` 배열을 추가했습니다. Cloudinary 업로드 결과를 저장하고, 삭제 시 `InvalidToken`과 연계해 대표 이미지를 유지합니다.
- 관리자 전용 상품 API(`/api/admin/products`)는 인증 후 접근하며, Cloudinary 이미지 업로드/삭제, SKU 중복 검사, 대표 이미지 지정 등을 처리합니다. 일반 `/api/products` 라우터는 조회 전용으로 동작합니다.
- 장바구니/주문 컨트롤러는 상품 대표 이미지를 함께 응답해 프런트에서 즉시 사용할 수 있습니다.

## 프런트엔드 확장
- 전역 인증 컨텍스트(`client/src/context/AuthContext.jsx`)로 로그인 상태와 장바구니 수량을 관리하고, 네비게이션 바(`client/src/components/Navbar.jsx`)에서 “OOO님 반갑습니다”/장바구니 배지/로그아웃 버튼을 표시합니다.
- `client/src/pages/Login.jsx`와 `client/src/pages/Admin.jsx`를 추가해 로그인 흐름과 관리자 상품 CRUD(Cloudinary 위젯 포함)를 구현했습니다.
- `client/src/pages/Home.jsx`는 상품 카드의 상세 보기 버튼을 `/products/:productId`로 연결하고, 장바구니/주문 섹션을 로그인 사용자 전용으로 보호합니다.
- 상세 페이지 `client/src/pages/ProductDetail.jsx`는 제공된 디자인 예시를 참고해 큰 이미지·썸네일·가격/카테고리 정보·장바구니 버튼·추천 상품 그리드를 구성했습니다. 로그인하지 않은 사용자도 접근 가능합니다.

## 환경 변수 정리
- 서버 `.env`: `JWT_SECRET`, `JWT_EXPIRES_MINUTES`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_UPLOAD_PRESET` 등 인증/이미지 업로드 관련 값을 설정합니다.
- 클라이언트 `.env`: `VITE_API_BASE_URL`, `VITE_CLOUDINARY_CLOUD_NAME`, `VITE_CLOUDINARY_UPLOAD_PRESET`을 설정해 Cloudinary 위젯과 API 호출이 정상 동작하도록 합니다.

## 실행 및 검증
1. `server/.env`, `client/.env`를 설정한 뒤 `npm install`을 서버/클라이언트 각각 실행합니다.
2. 서버는 `cd server && npm run dev`, 클라이언트는 `cd client && npm run dev`로 실행합니다.
3. 관리자 계정으로 로그인해 상품 등록/수정/삭제 → Cloudinary 이미지 업로드, 장바구니 담기, 로그아웃까지 흐름을 검증합니다.
4. 로그인하지 않은 사용자도 `/products/:productId` 상세 페이지와 추천 상품 목록을 열람할 수 있는지 확인합니다.

## 체크아웃 및 주문 흐름
- `server/src/models/Order.js`를 확장해 `pricing`(subtotal/discount/shippingFee/total/currency), `shipping`(수령인·주소·연락처·메모), `payment`(결제수단/상태/거래ID), `history`, `metadata`를 포함하도록 재설계했습니다. 주문 항목에는 SKU·대표 이미지 정보를 함께 스냅샷합니다.
- `server/src/controllers/orderController.js`는 새로운 주문 DTO(`shipping`, `pricing`, `payment`)를 검증해 `/api/orders` 생성 시 주문 요약을 저장하고, 성공 시 장바구니를 비웁니다. 주문 취소 시 상태를 `cancelled`로 갱신하고 이력을 남깁니다.
- 프런트엔드에는 체크아웃 페이지(`client/src/pages/Checkout.jsx`)를 추가해 제공된 byslim UI 예시를 참고한 배송지/결제수단 입력 폼과 주문 요약을 구성했습니다. 장바구니 페이지에서 “주문하기” 버튼이 `/checkout`으로 이동하며, 주문 완료 시 `/orders/complete`에서 요약을 확인할 수 있습니다.
- 네비게이션 바와 장바구니 UI는 새 흐름과 연동되어 주문 완료 시 장바구니 수량을 초기화하고, 로그인하지 않은 사용자는 체크아웃으로 이동하기 전에 로그인 안내를 받습니다.

## 포트원(KG이니시스) 결제 연동
- 서버에 `axios` 기반 포트원 서비스(`server/src/services/portoneService.js`)를 추가해 REST API 토큰 발급과 결제 조회(`getPaymentByImpUid`)를 지원합니다.
- 주문 생성 시 결제 정보(impUid, merchantUid)를 필수로 받고 포트원 REST API로 상태/금액을 검증한 뒤 주문 상태를 `paid` 또는 `pending`으로 저장합니다. 저장된 주문에는 결제 식별자·PG 정보·카드사 정보가 함께 남습니다.
- 체크아웃 페이지는 포트원 JS SDK를 로드해 `IMP.request_pay`로 KG이니시스 테스트 결제창을 호출하고, 결제 성공 시 `/api/orders`에 검증 요청을 보냅니다.
- 서버 `.env`에는 `PORTONE_CHANNEL_KEY`, `PORTONE_PG_PROVIDER`, `PORTONE_PG_MID`, `PORTONE_SIGNKEY`, `PORTONE_IMP_KEY`, `PORTONE_IMP_SECRET`, `PORTONE_CUSTOMER_CODE`를, 클라이언트 `.env`에는 `VITE_PORTONE_CUSTOMER_CODE`, `VITE_PORTONE_PG`, `VITE_PORTONE_PG_MID`를 설정해야 합니다.

---

## 배포 및 운영 환경 구성

### Vercel (프런트엔드) 배포
1. **저장소 연결**: GitHub 저장소를 Vercel에 연결하고 `client` 폴더를 Root Directory로 설정합니다.
2. **빌드 설정**:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. **환경 변수** (Vercel Dashboard → Settings → Environment Variables):
   ```
   VITE_API_BASE_URL=/api
   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
   VITE_CLOUDINARY_UPLOAD_PRESET=your_preset
   VITE_PORTONE_STORE_ID=your_store_id (심사 완료 후)
   VITE_PORTONE_CHANNEL_KEY=your_channel_key (심사 완료 후)
   ```

### Render (백엔드) 배포
1. **Web Service 생성**: GitHub 저장소 연결, Root Directory를 `server`로 설정
2. **빌드 설정**:
   - Build Command: `npm install`
   - Start Command: `npm start`
3. **환경 변수** (Render Dashboard → Environment):
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=your_secret
   JWT_EXPIRES_MINUTES=60
   CLIENT_ORIGIN=https://your-domain.com,https://your-app.vercel.app
   COOKIE_SAMESITE=none
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   PORTONE_API_SECRET=your_api_secret (심사 완료 후)
   ```

### Vercel Rewrites (API 프록시 설정)
크로스 도메인 쿠키 문제를 해결하기 위해 `client/vercel.json`에 API 프록시를 설정합니다:
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
- 첫 번째 규칙: `/api/*` 요청을 Render 백엔드로 프록시
- 두 번째 규칙: SPA 라우팅을 위한 fallback (페이지 새로고침 시 404 방지)

### CORS 설정 (server/src/app.js)
```javascript
const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map(o => o.trim())
  : [];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Vercel 프리뷰 도메인 자동 허용
    if (origin.endsWith('-your-project.vercel.app')) {
      return callback(null, true);
    }
    callback(new Error('CORS not allowed'));
  },
  credentials: true
}));
```

### 커스텀 도메인 연결 (Cloudflare + Vercel)
1. **도메인 구매**: Cloudflare Registrar에서 도메인 구매 (예: yuu-haru.com)
2. **Vercel 도메인 설정**: Vercel Dashboard → Settings → Domains에서 도메인 추가
3. **Cloudflare DNS 설정**:
   - `www` → CNAME → `cname.vercel-dns.com` (Proxied 해제)
   - `@` (apex) → A → `76.76.21.21` (Proxied 해제)
4. **CLIENT_ORIGIN 업데이트**: Render 환경변수에 새 도메인 추가

---

## 법적 요구사항 및 PG사 심사 준비

### Footer 사업자 정보 표시
전자상거래법에 따라 Footer에 다음 정보를 필수로 표시해야 합니다:
- 상호명
- 대표자명
- 사업자등록번호
- 사업장 주소
- 담당자 이메일/연락처

**구현 파일**:
- `client/src/components/Footer.jsx` - 사업자 정보 컴포넌트
- `client/src/components/Footer.css` - Footer 스타일

### 이용약관 페이지 (/terms)
전자상거래 표준약관을 기반으로 다음 조항을 포함:
1. 목적
2. 정의
3. 약관의 명시와 개정
4. 서비스의 제공 및 변경
5. 서비스의 중단
6. 회원가입
7. 회원 탈퇴 및 자격 상실
8. 구매신청
9. 결제방법
10. 배송
11. 청약철회 및 환불
12. 개인정보보호
13. 분쟁해결

**구현 파일**: `client/src/pages/Terms.jsx`

### 개인정보처리방침 페이지 (/privacy)
개인정보보호법에 따라 다음 내용을 포함:
1. 개인정보의 수집 및 이용 목적
2. 수집하는 개인정보의 항목
3. 개인정보의 보유 및 이용기간
4. 개인정보의 제3자 제공 (배송업체, PG사)
5. 개인정보 처리의 위탁
6. 정보주체의 권리·의무 및 행사방법
7. 개인정보의 파기
8. 개인정보의 안전성 확보조치
9. 개인정보 보호책임자 (이름, 연락처)
10. 권익침해 구제방법
11. 개인정보 처리방침 변경

**구현 파일**: `client/src/pages/Privacy.jsx`

### 공통 스타일
**구현 파일**: `client/src/pages/Legal.css` - 이용약관/개인정보처리방침 공통 스타일

### App.jsx 라우트 추가
```javascript
import Terms from './pages/Terms.jsx';
import Privacy from './pages/Privacy.jsx';
import Footer from './components/Footer.jsx';

// Routes 내부에 추가
<Route path="/terms" element={<Terms />} />
<Route path="/privacy" element={<Privacy />} />

// Routes 종료 후 Footer 추가
<Footer />
```

---

## PG사 (결제대행사) 연동

### PortOne 가입 및 설정
1. **PortOne 가입**: https://admin.portone.io 에서 계정 생성
2. **PG사 선택**: 추천 패키지로 다음 PG사 선택
   - **KG이니시스** - 신용카드 일반결제 (필수)
   - **카카오페이** - 간편결제 (권장)
   - **네이버페이** - 간편결제 (선택, 심사 까다로움)
3. **채널 등록**: 각 PG사별로 채널 등록 및 정보 입력
   - 웹사이트명: 쇼핑몰 브랜드명 (예: 종이책연구소)
   - 웹사이트 도메인: 실제 도메인 (예: yuu-haru.com)
   - 개발방식: 자체개발
   - 배송/서비스 기간: 결제 후 1~3일 이내 배송

### PG사 심사 필요 서류 (개인사업자)
1. 사업자등록증 사본
2. 대표자 신분증 사본
3. 통장 사본 (대표자 명의)
4. 인감증명서 원본 (3개월 이내)
5. 보증보험증권 (심사 후 필요시)

### 심사 기간
- 일반적으로 3~7일 소요
- 네이버페이는 사이트 완성도 검증이 까다로움 (이용약관, 개인정보처리방침, 사업자 정보 필수)

### 환경변수 설정 (심사 완료 후)
**Vercel (클라이언트)**:
```
VITE_PORTONE_STORE_ID=store_xxx
VITE_PORTONE_CHANNEL_KEY=channel_xxx
```

**Render (서버)**:
```
PORTONE_API_SECRET=api_secret_xxx
```

### 테스트 모드
- 심사 대기 중에도 테스트 채널로 개발 가능
- PortOne 콘솔 → 연동 관리 → 연동 정보에서 테스트 키 확인

---

## 체크리스트: 새 쇼핑몰 구축 시

### 1. 개발 환경 설정
- [ ] 프런트엔드: Vite + React 프로젝트 생성
- [ ] 백엔드: Express + Mongoose 프로젝트 생성
- [ ] MongoDB Atlas 클러스터 생성 및 연결
- [ ] Cloudinary 계정 생성 및 Upload Preset 설정

### 2. 핵심 기능 구현
- [ ] 사용자 인증 (회원가입, 로그인, JWT)
- [ ] 상품 관리 (CRUD, 이미지 업로드)
- [ ] 장바구니 기능
- [ ] 주문 및 결제 기능
- [ ] 관리자 대시보드

### 3. 배포 준비
- [ ] Vercel 프로젝트 생성 및 환경변수 설정
- [ ] Render 서비스 생성 및 환경변수 설정
- [ ] vercel.json API 프록시 설정
- [ ] CORS 설정 (CLIENT_ORIGIN)

### 4. 도메인 연결
- [ ] 도메인 구매 (Cloudflare, Namecheap 등)
- [ ] DNS 설정 (CNAME, A 레코드)
- [ ] SSL 인증서 확인 (Vercel 자동)

### 5. 법적 요구사항
- [ ] 사업자등록 완료
- [ ] Footer에 사업자 정보 표시
- [ ] 이용약관 페이지 작성
- [ ] 개인정보처리방침 페이지 작성

### 6. PG사 연동
- [ ] PortOne 계정 생성
- [ ] PG사 선택 및 채널 등록
- [ ] 심사 서류 제출
- [ ] 심사 완료 후 실결제 키 설정

### 7. 최종 검증
- [ ] 회원가입/로그인 테스트
- [ ] 상품 등록/수정/삭제 테스트
- [ ] 장바구니 → 결제 → 주문완료 플로우 테스트
- [ ] 모바일 반응형 확인
- [ ] 이용약관/개인정보처리방침 링크 확인
