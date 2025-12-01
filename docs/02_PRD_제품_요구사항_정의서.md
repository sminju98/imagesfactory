# PRD (Product Requirements Document)
# imagesfactory 제품 요구사항 정의서

**문서 버전**: 2.0  
**작성일**: 2025-11-23  
**최종 수정일**: 2025-12-01  
**작성자**: Product Team  
**상태**: 업데이트됨

---

## 📋 문서 개요

### 목적
본 PRD는 imagesfactory의 제품 기능, 사용자 경험, 기술 요구사항을 상세히 정의합니다.

### 범위
- MVP (Phase 1): 핵심 기능
- Phase 2: 결제 및 고도화
- Phase 3: 확장 기능

---

## 🎯 제품 비전

### 비전 선언문
> "누구나 쉽고 빠르게 대량의 AI 이미지를 생성하고 활용할 수 있는 세상"

### 제품 목표
1. 이미지 1장 생성 시간: 평균 30초 이내
2. 배치 생성 성공률: 95% 이상
3. 사용자 만족도: 4.5/5.0 이상
4. 무료→유료 전환율: 15% 이상

### 핵심 가치 제안
- **속도**: 수십 장을 한 번에, 빠르게
- **편의**: 생성부터 이메일 전송까지 자동화
- **경제성**: 타 서비스 대비 30% 저렴
- **품질**: 최신 AI 모델 활용
- **지능형 콘텐츠**: Perplexity 리서치 기반 트렌드 반영
- **자동화**: 이미지뿐만 아니라 릴스, 카드뉴스 등 SNS 콘텐츠 자동 제작

---

## 👥 사용자 스토리

### Epic 1: 회원 가입 및 인증

#### US-1.1: 이메일 회원가입
```
As a 신규 사용자
I want to 이메일과 비밀번호로 회원가입하고
So that imagesfactory 서비스를 이용할 수 있다

인수 조건:
- 이메일 형식 검증 (정규식)
- 비밀번호 최소 8자, 영문+숫자 포함
- 이메일 중복 확인
- 비밀번호 확인 일치 검증
- 이용약관 동의 필수
- 개인정보처리방침 동의 필수
- 가입 완료 시 인증 이메일 발송
- 가입 성공 시 1,000 포인트 자동 지급
```

#### US-1.2: 이메일 인증
```
As a 신규 회원
I want to 이메일 인증을 완료하고
So that 모든 서비스를 이용할 수 있다

인수 조건:
- 인증 링크 유효 시간: 24시간
- 인증 완료 시 계정 활성화
- 인증 전에도 서비스 이용 가능 (단, 생성 횟수 제한)
- 인증 이메일 재발송 가능 (최대 3회)
```

#### US-1.3: 구글 소셜 로그인
```
As a 사용자
I want to 구글 계정으로 간편하게 로그인하고
So that 별도 회원가입 없이 서비스를 이용할 수 있다

인수 조건:
- 구글 OAuth 2.0 사용
- 첫 로그인 시 자동 회원가입
- 이메일, 이름, 프로필 이미지 자동 수집
- 첫 가입 시 1,000 포인트 자동 지급
- 기존 계정 연동 가능
```

#### US-1.4: 로그인
```
As a 기존 회원
I want to 이메일과 비밀번호로 로그인하고
So that 내 계정에 접근할 수 있다

인수 조건:
- 이메일/비밀번호 검증
- 로그인 실패 시 에러 메시지 표시
- 로그인 상태 유지 옵션 (14일)
- 5회 실패 시 계정 임시 잠금 (30분)
- JWT 토큰 발급 (액세스: 1시간, 리프레시: 7일)
```

#### US-1.5: 비밀번호 재설정
```
As a 사용자
I want to 비밀번호를 재설정하고
So that 비밀번호를 잊었을 때 계정을 복구할 수 있다

인수 조건:
- 이메일로 재설정 링크 발송
- 링크 유효 시간: 1시간
- 새 비밀번호 규칙 검증
- 이전 비밀번호와 다른지 확인
- 재설정 완료 시 모든 세션 로그아웃
```

### Epic 2: 이미지 생성

#### US-2.1: 프롬프트 입력
```
As a 사용자
I want to 원하는 이미지의 설명(프롬프트)을 입력하고
So that AI가 이미지를 생성할 수 있다

인수 조건:
- 최소 10자, 최대 1,000자
- 한글/영문 모두 입력 가능
- 한글 입력 시 자동 영문 번역 (Google Translate API)
- 실시간 글자 수 카운터
- 금지어 필터링 (욕설, 폭력, 성적 콘텐츠)
- 프롬프트 예시 제공 (5개 카테고리)
- 최근 사용 프롬프트 불러오기
```

#### US-2.2: 생성 옵션 설정
```
As a 사용자
I want to 이미지 수량, 스타일, 비율을 선택하고
So that 원하는 형태의 이미지를 생성할 수 있다

인수 조건:
- 이미지 수량: 1-50장 (슬라이더 또는 입력)
- 스타일 옵션:
  * Realistic (사진 같은)
  * Artistic (예술적)
  * Anime (애니메이션)
  * 3D Render (3D 렌더링)
  * Watercolor (수채화)
  * Oil Painting (유화)
- 비율 옵션:
  * 1:1 (1024x1024) - 정사각형
  * 16:9 (1920x1080) - 가로형
  * 9:16 (1080x1920) - 세로형
  * 4:3 (1600x1200) - 표준
- 예상 소비 포인트 실시간 계산
- 잔액 부족 시 충전 안내
```

#### US-2.3: 이미지 생성 요청
```
As a 사용자
I want to 생성 버튼을 클릭하고
So that 이미지 생성을 시작할 수 있다

인수 조건:
- 포인트 잔액 확인
- 부족 시 생성 불가 및 충전 안내
- 생성 전 최종 확인 모달
- 생성 요청 시 포인트 즉시 차감
- Queue에 작업 추가
- 생성 진행 화면으로 이동
- 생성 실패 시 포인트 자동 환불
```

#### US-2.4: 생성 진행 상황 확인
```
As a 사용자
I want to 이미지 생성 진행 상황을 실시간으로 확인하고
So that 언제 완료되는지 알 수 있다

인수 조건:
- 진행률 표시 (0-100%)
- 현재 진행 중인 이미지 번호 표시
- 예상 남은 시간 표시
- 실시간 업데이트 (WebSocket 또는 5초마다 polling)
- 완료된 이미지 미리보기 (썸네일)
- 취소 버튼 제공 (취소 시 생성된 이미지만큼만 차감)
- 백그라운드 생성 지원 (다른 페이지 이동 가능)
```

#### US-2.5: 생성 완료 알림
```
As a 사용자
I want to 이미지 생성이 완료되면 이메일로 알림 받고
So that 생성 완료를 즉시 알 수 있다

인수 조건:
- 모든 이미지 생성 완료 시 이메일 발송
- 이메일 내용:
  * 프롬프트 정보
  * 생성된 이미지 수
  * 썸네일 미리보기 (최대 6개)
  * 다운로드 링크 (ZIP)
  * 웹사이트 보기 링크
- HTML 이메일 템플릿 (반응형)
- 스팸 방지 (SPF, DKIM 설정)
- 이메일 발송 실패 시 재시도 (최대 3회)
```

### Epic 3: 이미지 관리

#### US-3.1: 히스토리 조회
```
As a 사용자
I want to 내가 생성한 이미지 히스토리를 보고
So that 과거 생성 이미지를 다시 확인할 수 있다

인수 조건:
- 생성 작업 목록 (최신순)
- 각 항목 표시:
  * 생성 날짜/시간
  * 프롬프트 (100자까지, 나머지는 "...")
  * 썸네일 (첫 4개 이미지)
  * 이미지 수
  * 상태 (완료/진행중/실패)
  * 소비 포인트
- 페이지네이션 (페이지당 20개)
- 필터링: 날짜, 상태
- 검색: 프롬프트 키워드
```

#### US-3.2: 히스토리 상세 보기
```
As a 사용자
I want to 특정 생성 작업의 상세 정보를 보고
So that 생성된 이미지를 확인하고 다운로드할 수 있다

인수 조건:
- 전체 프롬프트 표시
- 생성 옵션 정보 (스타일, 비율, 수량)
- 모든 이미지 그리드 뷰
- 이미지 클릭 시 라이트박스 (확대)
- 개별 이미지 다운로드 버튼
- 전체 ZIP 다운로드 버튼
- 이미지 삭제 버튼
- 같은 프롬프트로 재생성 버튼
- 소셜 공유 버튼 (선택)
```

#### US-3.3: 이미지 다운로드
```
As a 사용자
I want to 생성된 이미지를 다운로드하고
So that 내 작업에 사용할 수 있다

인수 조건:
- 개별 이미지 다운로드 (원본 해상도)
- 전체 ZIP 다운로드
- ZIP 파일명: "imagesfactory_YYYYMMDD_HHMMSS.zip"
- 다운로드 링크 만료: 30일
- 다운로드 횟수 제한 없음
- 다운로드 진행률 표시
- 대용량 파일 (100MB+) 처리
```

#### US-3.4: 이미지 삭제
```
As a 사용자
I want to 생성한 이미지를 삭제하고
So that 불필요한 이미지를 관리할 수 있다

인수 조건:
- 개별 이미지 삭제
- 전체 작업 삭제 (모든 이미지)
- 삭제 확인 모달
- 삭제 시 스토리지에서 영구 삭제
- 삭제된 이미지 복구 불가 안내
- 삭제해도 포인트 환불 안됨
```

### Epic 4: 포인트 관리

#### US-4.1: 포인트 잔액 확인
```
As a 사용자
I want to 내 포인트 잔액을 확인하고
So that 얼마나 사용할 수 있는지 알 수 있다

인수 조건:
- 모든 페이지 헤더에 잔액 표시
- 잔액 클릭 시 포인트 페이지 이동
- 잔액 부족 시 경고 배지
- 실시간 업데이트
```

#### US-4.2: 포인트 거래 내역
```
As a 사용자
I want to 포인트 사용 및 충전 내역을 보고
So that 포인트 사용을 추적할 수 있다

인수 조건:
- 거래 목록 (최신순)
- 각 항목 표시:
  * 날짜/시간
  * 유형 (충전/사용/환불/보너스)
  * 금액 (+ 또는 -)
  * 설명
  * 남은 잔액
- 기간 필터 (전체/1개월/3개월/6개월)
- CSV 다운로드
- 페이지네이션
```

#### US-4.3: 포인트 충전
```
As a 사용자
I want to 포인트를 구매하고
So that 더 많은 이미지를 생성할 수 있다

인수 조건:
- 포인트 패키지 선택 (5개 옵션)
- 각 패키지 정보:
  * 포인트 수
  * 가격 (원)
  * 생성 가능 이미지 수
  * 할인율 (있는 경우)
  * 장당 단가
- 선택한 패키지 강조
- 결제 버튼 클릭 시 토스페이먼츠 결제창
- 결제 완료 시 포인트 즉시 지급
- 결제 실패 시 에러 처리
- 영수증 이메일 발송
```

### Epic 5: 결제 (토스페이먼츠)

#### US-5.1: 결제 요청
```
As a 사용자
I want to 포인트 패키지를 선택하고 결제하고
So that 포인트를 충전할 수 있다

인수 조건:
- 토스페이먼츠 결제창 호출
- 결제 수단:
  * 신용/체크카드
  * 계좌이체
  * 가상계좌
  * 간편결제 (토스페이, 네이버페이, 카카오페이)
- 결제 정보:
  * 주문명: "imagesfactory 포인트 충전"
  * 금액
  * 구매자 정보 자동 입력
- 모바일 반응형
```

#### US-5.2: 결제 승인
```
As a 시스템
I want to 결제 승인을 처리하고
So that 사용자에게 포인트를 지급할 수 있다

인수 조건:
- 토스페이먼츠 승인 API 호출
- 승인 성공 시:
  * 포인트 지급
  * Payment 레코드 생성
  * PointTransaction 레코드 생성
  * 영수증 이메일 발송
  * 성공 페이지로 리다이렉트
- 승인 실패 시:
  * 에러 메시지 표시
  * 재시도 옵션 제공
```

#### US-5.3: 결제 내역 조회
```
As a 사용자
I want to 내 결제 내역을 확인하고
So that 결제 이력을 관리할 수 있다

인수 조건:
- 결제 목록 (최신순)
- 각 항목 표시:
  * 날짜/시간
  * 상품명
  * 금액
  * 포인트
  * 결제 수단
  * 상태 (완료/취소/실패)
- 영수증 다운로드 버튼
- 기간 필터링
```

#### US-5.4: 환불 요청
```
As a 사용자
I want to 결제를 취소하고
So that 환불받을 수 있다

인수 조건:
- 결제 후 7일 이내만 환불 가능
- 구매한 포인트 미사용 시에만 가능
- 부분 사용 시 환불 불가 (안내)
- 환불 사유 입력 (선택)
- 관리자 승인 후 처리
- 환불 완료 시:
  * 포인트 차감
  * 환불 완료 이메일 발송
  * 영업일 기준 3-5일 소요 안내
```

### Epic 6: 대시보드

#### US-6.1: 대시보드 메인
```
As a 사용자
I want to 대시보드에서 주요 정보를 한눈에 보고
So that 빠르게 서비스를 이용할 수 있다

인수 조건:
- 포인트 잔액 카드
- 빠른 생성 버튼
- 최근 생성 이미지 (최근 9개)
- 진행 중인 작업 상태
- 사용 통계 요약:
  * 총 생성 이미지 수
  * 이번 달 사용 포인트
  * 가입일
- 공지사항/업데이트 (있는 경우)
```

### Epic 7: 사용자 프로필

#### US-7.1: 프로필 보기
```
As a 사용자
I want to 내 프로필 정보를 보고
So that 계정 상태를 확인할 수 있다

인수 조건:
- 프로필 이미지
- 이름
- 이메일
- 가입일
- 계정 유형 (이메일/구글)
- 이메일 인증 상태
- 통계:
  * 총 생성 이미지 수
  * 총 사용 포인트
  * 총 충전 금액
```

#### US-7.2: 프로필 수정
```
As a 사용자
I want to 프로필 정보를 수정하고
So that 최신 정보를 유지할 수 있다

인수 조건:
- 이름 수정
- 프로필 이미지 업로드/변경
- 이미지 크기: 최대 2MB
- 이미지 형식: JPG, PNG
- 저장 시 검증
- 성공/실패 메시지
```

#### US-7.3: 비밀번호 변경
```
As a 사용자
I want to 비밀번호를 변경하고
So that 보안을 강화할 수 있다

인수 조건:
- 현재 비밀번호 확인
- 새 비밀번호 입력
- 새 비밀번호 확인
- 비밀번호 규칙 검증
- 이전 비밀번호와 다른지 확인
- 변경 완료 시 로그아웃 (선택)
- 변경 완료 이메일 발송
```

#### US-7.4: 계정 삭제
```
As a 사용자
I want to 내 계정을 삭제하고
So that 서비스를 그만 사용할 수 있다

인수 조건:
- 삭제 확인 절차 (비밀번호 입력)
- 경고 메시지:
  * 모든 데이터 삭제
  * 남은 포인트 소멸
  * 복구 불가
- 최종 확인 체크박스
- 삭제 사유 입력 (선택)
- 삭제 완료 시:
  * 모든 데이터 익명화/삭제
  * 이미지 파일 삭제
  * 로그아웃
  * 확인 이메일 발송
```

---

## 🎨 UI/UX 요구사항

### 디자인 원칙
1. **단순함**: 3클릭 이내 모든 기능 접근
2. **명확함**: 직관적인 레이블과 아이콘
3. **일관성**: 통일된 디자인 시스템
4. **반응성**: 모든 디바이스 지원
5. **접근성**: WCAG 2.1 AA 준수

### 디자인 시스템

#### 컬러 팔레트
```
Primary:
- Main: #6366F1 (인디고)
- Light: #818CF8
- Dark: #4F46E5

Secondary:
- Main: #EC4899 (핑크)
- Light: #F472B6
- Dark: #DB2777

Neutral:
- 900: #111827 (텍스트)
- 700: #374151 (보조 텍스트)
- 500: #6B7280 (비활성)
- 300: #D1D5DB (구분선)
- 100: #F3F4F6 (배경)
- 50: #F9FAFB (카드)

Semantic:
- Success: #10B981 (완료)
- Warning: #F59E0B (경고)
- Error: #EF4444 (에러)
- Info: #3B82F6 (정보)
```

#### 타이포그래피
```
Font Family:
- 한글: Pretendard
- 영문: Inter
- 코드: JetBrains Mono

Font Sizes:
- H1: 36px (2.25rem) - 페이지 제목
- H2: 30px (1.875rem) - 섹션 제목
- H3: 24px (1.5rem) - 카드 제목
- H4: 20px (1.25rem) - 소제목
- Body: 16px (1rem) - 본문
- Small: 14px (0.875rem) - 캡션
- Tiny: 12px (0.75rem) - 라벨

Font Weights:
- Bold: 700
- Semibold: 600
- Medium: 500
- Regular: 400
```

#### 간격 (Spacing)
```
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
2xl: 48px
3xl: 64px
```

#### 그림자 (Shadow)
```
sm: 0 1px 2px rgba(0,0,0,0.05)
md: 0 4px 6px rgba(0,0,0,0.1)
lg: 0 10px 15px rgba(0,0,0,0.1)
xl: 0 20px 25px rgba(0,0,0,0.1)
```

### 레이아웃 구조

#### 전체 레이아웃
```
┌─────────────────────────────────┐
│         Header (고정)            │
├─────────┬───────────────────────┤
│         │                       │
│ Sidebar │   Main Content        │
│ (선택)  │                       │
│         │                       │
└─────────┴───────────────────────┘
```

#### Header
- 로고 (좌측)
- 네비게이션 메뉴 (중앙)
  - 대시보드
  - 생성하기
  - 히스토리
  - 포인트
- 사용자 메뉴 (우측)
  - 포인트 잔액
  - 알림
  - 프로필 드롭다운

#### 반응형 브레이크포인트
```
Mobile: 0-639px
Tablet: 640px-1023px
Desktop: 1024px+
```

### 주요 페이지 와이어프레임

#### 랜딩 페이지
```
┌─────────────────────────────────┐
│ Hero Section                    │
│ - 헤드라인                       │
│ - CTA 버튼                      │
│ - 히어로 이미지                  │
├─────────────────────────────────┤
│ Features (3열 그리드)            │
├─────────────────────────────────┤
│ How It Works (4단계)            │
├─────────────────────────────────┤
│ Pricing (패키지 카드)            │
├─────────────────────────────────┤
│ Testimonials                    │
├─────────────────────────────────┤
│ CTA Section                     │
└─────────────────────────────────┘
```

#### 이미지 생성 페이지
```
┌─────────────────────────────────┐
│ ┌─────────────────────────────┐ │
│ │ 프롬프트 입력 (Textarea)     │ │
│ │                             │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ 이미지 수량 [슬라이더]           │
├─────────────────────────────────┤
│ 스타일 선택 [라디오 카드]        │
├─────────────────────────────────┤
│ 비율 선택 [라디오 버튼]          │
├─────────────────────────────────┤
│ ┌──────────────┐ ┌────────────┐ │
│ │ 예상 비용:   │ │ [생성하기] │ │
│ │ 1,000 포인트 │ │            │ │
│ └──────────────┘ └────────────┘ │
└─────────────────────────────────┘
```

#### 히스토리 페이지
```
┌─────────────────────────────────┐
│ [검색] [필터] [정렬]             │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ [썸네일 4개] 프롬프트...    │ │
│ │ 2025-11-23 | 10장 | 1,000pt │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ [썸네일 4개] 프롬프트...    │ │
│ │ 2025-11-22 | 20장 | 2,000pt │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ [페이지네이션]                   │
└─────────────────────────────────┘
```

---

## ⚙️ 기술 요구사항

### 성능 요구사항
| 항목 | 목표 | 측정 방법 |
|-----|------|----------|
| 페이지 로드 시간 | < 2초 | Lighthouse |
| 이미지 생성 시간 | < 30초/장 | 평균 |
| API 응답 시간 | < 500ms | P95 |
| 동시 사용자 | 1,000명 | 부하 테스트 |
| 업타임 | 99.9% | 월간 |

### 보안 요구사항
1. **인증/인가**
   - JWT 토큰 기반 인증
   - 액세스 토큰: 1시간
   - 리프레시 토큰: 7일
   - HttpOnly, Secure 쿠키

2. **데이터 암호화**
   - HTTPS 필수 (TLS 1.3)
   - 비밀번호: bcrypt (cost 12)
   - 민감 정보: AES-256 암호화

3. **API 보호**
   - Rate Limiting:
     * 로그인: 5회/분
     * API 호출: 100회/분
     * 이미지 생성: 10회/시간 (무료 유저)
   - CORS 설정
   - CSRF 토큰

4. **입력 검증**
   - 서버 사이드 검증 필수
   - XSS 방지
   - SQL Injection 방지 (ORM 사용)
   - 파일 업로드 검증

### 확장성 요구사항
- 수평 확장 가능한 아키텍처
- Stateless 서버 (세션 Redis 저장)
- CDN 사용 (이미지)
- Queue 기반 비동기 처리
- 데이터베이스 인덱싱

### 모니터링 요구사항
- 에러 트래킹 (Sentry)
- 성능 모니터링 (Vercel Analytics)
- 로그 관리 (CloudWatch 또는 Datadog)
- 알림 설정:
  * 에러율 > 1%
  * 응답 시간 > 3초
  * 서버 다운

---

## 🔌 API 명세 (상세)

### 인증 API

#### POST /api/auth/register
회원가입

**Request**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "홍길동",
  "agreeToTerms": true,
  "agreeToPrivacy": true
}
```

**Response (201)**
```json
{
  "success": true,
  "message": "회원가입이 완료되었습니다. 이메일을 확인해주세요.",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "홍길동",
      "points": 1000,
      "emailVerified": false
    }
  }
}
```

**Errors**
- 400: 이메일 형식 오류
- 409: 이메일 중복
- 422: 유효성 검증 실패

---

#### POST /api/auth/login
로그인

**Request**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "remember": true
}
```

**Response (200)**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "홍길동",
      "points": 850
    },
    "accessToken": "jwt.token.here",
    "refreshToken": "refresh.token.here"
  }
}
```

**Errors**
- 401: 인증 실패
- 423: 계정 잠금

---

### 이미지 생성 API

#### POST /api/generate
이미지 생성 요청

**Request**
```json
{
  "prompt": "a beautiful sunset over the ocean",
  "promptKo": "바다 위의 아름다운 일몰",
  "imageCount": 10,
  "style": "realistic",
  "aspectRatio": "16:9"
}
```

**Response (201)**
```json
{
  "success": true,
  "data": {
    "generation": {
      "id": "uuid",
      "status": "pending",
      "prompt": "a beautiful sunset over the ocean",
      "imageCount": 10,
      "pointsUsed": 1000,
      "createdAt": "2025-11-23T10:00:00Z"
    }
  }
}
```

**Errors**
- 400: 잘못된 요청
- 402: 포인트 부족
- 422: 프롬프트 검증 실패 (금지어)

---

#### GET /api/generate/:id
생성 상태 조회

**Response (200)**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "processing",
    "progress": 45,
    "completedCount": 4,
    "totalCount": 10,
    "estimatedTimeRemaining": 180,
    "images": [
      {
        "id": "uuid",
        "imageUrl": "https://...",
        "thumbnailUrl": "https://...",
        "order": 1
      }
    ]
  }
}
```

---

### 포인트 API

#### GET /api/points/balance
포인트 잔액

**Response (200)**
```json
{
  "success": true,
  "data": {
    "balance": 2500
  }
}
```

---

#### POST /api/points/purchase
포인트 구매

**Request**
```json
{
  "packageId": "pro",
  "amount": 40000,
  "points": 10000
}
```

**Response (200)**
```json
{
  "success": true,
  "data": {
    "paymentKey": "tosspayments-key",
    "orderId": "order-uuid",
    "amount": 40000
  }
}
```

---

## 📊 데이터 모델 (상세)

### User
```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  password      String?   // nullable for social login
  name          String
  profileImage  String?
  provider      Provider  @default(EMAIL)
  providerId    String?
  emailVerified Boolean   @default(false)
  points        Int       @default(1000)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  generations      ImageGeneration[]
  pointTransactions PointTransaction[]
  payments         Payment[]
}

enum Provider {
  EMAIL
  GOOGLE
}
```

### ImageGeneration
```prisma
model ImageGeneration {
  id               String    @id @default(uuid())
  userId           String
  prompt           String    @db.Text
  promptTranslated String    @db.Text
  promptKo         String?   @db.Text
  imageCount       Int
  style            String
  aspectRatio      String
  status           GenerationStatus @default(PENDING)
  pointsUsed       Int
  progress         Int       @default(0)
  completedAt      DateTime?
  failedReason     String?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  
  user   User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  images Image[]
  
  @@index([userId, createdAt])
  @@index([status])
}

enum GenerationStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
}
```

### Image
```prisma
model Image {
  id           String   @id @default(uuid())
  generationId String
  imageUrl     String
  thumbnailUrl String
  order        Int
  width        Int
  height       Int
  fileSize     Int
  createdAt    DateTime @default(now())
  
  generation ImageGeneration @relation(fields: [generationId], references: [id], onDelete: Cascade)
  
  @@index([generationId])
}
```

### PointTransaction
```prisma
model PointTransaction {
  id                   String              @id @default(uuid())
  userId               String
  amount               Int
  type                 TransactionType
  description          String
  relatedGenerationId  String?
  relatedPaymentId     String?
  balanceBefore        Int
  balanceAfter         Int
  createdAt            DateTime            @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId, createdAt])
}

enum TransactionType {
  PURCHASE
  USAGE
  REFUND
  BONUS
  ADMIN_ADJUST
}
```

### Payment
```prisma
model Payment {
  id              String        @id @default(uuid())
  userId          String
  amount          Int
  points          Int
  status          PaymentStatus @default(PENDING)
  paymentMethod   String?
  paymentKey      String?       @unique
  orderId         String        @unique
  transactionId   String?
  receiptUrl      String?
  failReason      String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  confirmedAt     DateTime?
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId, createdAt])
  @@index([status])
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  CANCELLED
  REFUNDED
}
```

---

## ✅ 인수 기준

### MVP 출시 기준
모든 항목이 완료되어야 베타 출시 가능:

- [ ] 회원가입/로그인 (이메일, 구글)
- [ ] 이메일 인증
- [ ] 이미지 생성 (1-50장)
- [ ] 진행률 추적
- [ ] 이메일 전송 (ZIP)
- [ ] 히스토리 조회
- [ ] 이미지 다운로드
- [ ] 포인트 시스템
- [ ] 대시보드
- [ ] 프로필 관리
- [ ] 반응형 디자인
- [ ] 성능 목표 달성
- [ ] 보안 감사 통과
- [ ] 베타 테스트 (50명)

### 정식 출시 기준
추가 항목:

- [ ] 토스페이먼츠 결제
- [ ] 포인트 충전
- [ ] 환불 프로세스
- [ ] 관리자 페이지
- [ ] 통계 대시보드
- [ ] 고객 지원 (채팅 또는 이메일)
- [ ] 이용약관/개인정보처리방침
- [ ] 에러 모니터링
- [ ] 부하 테스트 통과

---

## 📝 향후 로드맵 (Post-MVP)

### Phase 2 기능
- 이미지 편집 (크롭, 리사이즈)
- 프롬프트 템플릿 라이브러리
- 프롬프트 자동 개선 (AI)
- 배치 프롬프트 (CSV 업로드)
- 이미지 업스케일 (고해상도)
- 구독 플랜

### Phase 3 기능
- 커뮤니티 갤러리
- 이미지 공유
- 협업 기능 (팀 계정)
- API 제공 (개발자용)
- 모바일 앱 (React Native)
- 다국어 지원

---

## 🎬 Epic 8: Content Factory (콘텐츠 자동 제작)

### US-8.1: 콘셉트 생성 (완료)
```
As a 마케터
I want to 제품/서비스 정보를 입력하면 마케팅 콘셉트를 자동 생성받고
So that 효과적인 콘텐츠 기획을 할 수 있다

인수 조건:
- 프롬프트 입력 (최소 10자)
- Perplexity로 최신 트렌드 검색
- GPT로 콘셉트 분석 (USP, 타겟, 톤앤매너, 전략)
- JSON 형식 응답
- 이미지 업로드 지원 (참고용)
```

### US-8.2: 메시지 생성 (완료)
```
As a 마케터
I want to 콘셉트를 바탕으로 마케팅 메시지를 생성받고
So that 효과적인 카피를 작성할 수 있다

인수 조건:
- 콘셉트 정보 입력
- Perplexity로 경쟁사/시장 동향 검색
- GPT로 메인/서브 카피, CTA 생성
- 대안 옵션 제공
```

### US-8.3: 대본 생성 (완료)
```
As a 콘텐츠 크리에이터
I want to 콘셉트와 메시지로 다양한 포맷의 대본을 생성받고
So that 릴스, 카드뉴스, 만화 콘텐츠를 제작할 수 있다

인수 조건:
- 릴스 스토리 (10컷)
- 4컷 만화
- 카드뉴스 흐름 (5장)
- 각 장면별 이미지 프롬프트 포함
```

### US-8.4: 콘텐츠 프로덕션 (완료)
```
As a 사용자
I want to 생성된 대본으로 이미지를 자동 생성하고
So that 완성된 콘텐츠를 얻을 수 있다

인수 조건:
- 선택한 콘텐츠 타입에 맞는 이미지 생성
- 진행률 표시
- 완료 후 다운로드/저장
```

---

## 🎥 Epic 9: Reels Factory (릴스 자동 제작) - 개발 중

### US-9.1: 프롬프트 교정
```
As a 사용자
I want to 간단한 프롬프트를 입력하면 AI가 교정해주고
So that 더 효과적인 릴스를 제작할 수 있다

인수 조건:
- 텍스트 프롬프트 입력
- 이미지 업로드 (선택)
- 타겟/톤/목적 옵션
- GPT-5.1-mini로 프롬프트 교정
- 교정된 프롬프트 표시
```

### US-9.2: 리서치 (Perplexity)
```
As a 사용자
I want to 주제에 대한 최신 트렌드를 검색받고
So that 트렌디한 콘텐츠를 만들 수 있다

인수 조건:
- Perplexity API로 키워드, 페인포인트, 트렌드 검색
- 체크박스로 인사이트 선택
- 선택한 인사이트만 다음 단계로 전달
```

### US-9.3: 콘셉트 기획 (GPT)
```
As a 사용자
I want to 릴스 콘셉트 후보를 받고 선택하고
So that 원하는 방향의 릴스를 만들 수 있다

인수 조건:
- GPT로 콘셉트 2-3개 생성
- 각 콘셉트: Hook, Flow, CTA 포함
- 카드 UI로 표시
- 사용자가 하나 선택
```

### US-9.4: 대본 작성 (Grok)
```
As a 사용자
I want to 장면별 상세 대본을 받고
So that 5개의 8초 영상으로 구성된 릴스를 만들 수 있다

인수 조건:
- Grok2로 5개 영상 대본 생성
- 각 영상당 3-5컷 샷 리스트
- 업로드 이미지 반영
- Video1~5 탭으로 표시
- 승인 후 다음 단계
```

### US-9.5: 영상 제작 (Veo3)
```
As a 사용자
I want to 대본으로 8초 영상 5개를 생성받고
So that 릴스에 사용할 영상을 얻을 수 있다

인수 조건:
- Veo3 API로 각 영상 생성
- 병렬 처리 지원
- 진행률 표시 (5개 중 n개 완료)
- 완료 후 미리보기 제공
```

### US-9.6: 음성 합성 (Pixazo)
```
As a 사용자
I want to 대본을 음성으로 변환받고
So that 릴스에 내레이션을 추가할 수 있다

인수 조건:
- GPT로 내레이션 텍스트 생성
- Pixazo TTS로 음성 생성
- 자막 타임스탬프 생성
- FFmpeg로 영상+음성+자막 합성
```

### US-9.7: 최종 릴스 결합
```
As a 사용자
I want to 5개 영상을 이어붙여 40초 릴스를 만들고
So that 완성된 릴스를 다운로드할 수 있다

인수 조건:
- FFmpeg로 영상 결합
- 트랜지션 효과 (0.3초)
- 최종 릴스 플레이어
- 개별 클립/전체 다운로드
- 갤러리 저장
```

---

## 🖼️ Epic 10: 이미지 진화 시스템 (완료)

### US-10.1: 메타데이터 누적
```
As a 사용자
I want to 생성한 이미지에 프롬프트 히스토리가 저장되고
So that 다음 생성 시 참고할 수 있다

인수 조건:
- PNG 메타데이터에 프롬프트 히스토리 저장
- 최대 5세대까지 누적
- 오래된 세대 자동 삭제
- 세대별 프롬프트, 모델, 타임스탬프 기록
```

### US-10.2: 레퍼런스 이미지 활용
```
As a 사용자
I want to 이전에 생성한 이미지를 레퍼런스로 사용하고
So that 일관된 스타일의 이미지를 생성할 수 있다

인수 조건:
- 갤러리에서 이미지 선택
- 메타데이터 자동 읽기
- 프롬프트 히스토리 참고
- 레퍼런스 이미지 URL 전달
```

---

**문서 승인**
- [ ] Product Manager
- [ ] Tech Lead
- [ ] Design Lead
- [ ] CEO

**문서 히스토리**
- v1.0 (2025-11-23): 초안 작성
- v2.0 (2025-12-01): Content Factory, Reels Factory, 이미지 진화 시스템 추가

