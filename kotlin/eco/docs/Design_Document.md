# 투자 모니터링 앱 — 디자인 문서

> 버전: v0.1 | 작성일: 2026-05-13 | 상태: 검토 중

---

## 1. 디자인 원칙

| 원칙 | 설명 |
|------|------|
| **명확성** | 숫자와 퍼센트는 한눈에 읽혀야 한다. 불필요한 장식 제거 |
| **신뢰성** | 금융 앱 특성상 데이터 정확성을 시각적으로 신뢰할 수 있게 |
| **한국 관례** | 수익 파란색 / 손실 빨간색, 원화/달러 표기 구분 |
| **Material 3** | Jetpack Compose Material3 라이브러리 기반 |

---

## 2. 컬러 시스템

### 2.1 Primary Palette

```
Primary         #1565C0  (Deep Blue)       — 주요 액션, AppBar
PrimaryContainer #BBDEFB  (Light Blue)      — 카드 강조 배경
Secondary       #0288D1  (Light Blue 700)  — 보조 액션
SecondaryContainer #B3E5FC               — 보조 컨테이너
Surface         #FAFAFA                    — 배경
SurfaceVariant  #F5F5F5                    — 카드 배경
```

### 2.2 Semantic Colors (금융 전용)

```
Profit (수익/상승)   #1565C0  — 빨간색 (한국 관례)
Loss   (손실/하락)   #C62828  — 파란색
Neutral             #757575  — 변동 없음
```

### 2.3 다크모드 대응

| Token | Light | Dark |
|-------|-------|------|
| Surface | #FAFAFA | #121212 |
| SurfaceVariant | #F5F5F5 | #1E1E1E |
| Profit | #1565C0 | #64B5F6 |
| Loss | #C62828 | #EF9A9A |

### 2.4 계좌 타입 색상

```
ISA       #2E7D32  (Green 800)
IRP       #6A1B9A  (Purple 800)
연금저축1   #E65100  (Orange 800)
연금저축2  #BF360C  (Deep Orange 800)
일반계좌   #37474F  (Blue Grey 800)
```

---

## 3. 타이포그래피

Material 3 TypeScale 기반, 한국어 기본 폰트: **Pretendard** (없으면 시스템 기본)

| Role | Size | Weight | 용도 |
|------|------|--------|------|
| DisplayLarge | 57sp | Regular | 총 자산금액 |
| HeadlineMedium | 28sp | SemiBold | 섹션 제목, 수익금액 |
| TitleLarge | 22sp | Bold | TopAppBar 제목 |
| TitleMedium | 16sp | Medium | 종목명, 카드 제목 |
| BodyLarge | 16sp | Regular | 거래 내역 항목 |
| BodyMedium | 14sp | Regular | 보조 정보, 날짜 |
| LabelLarge | 14sp | Medium | 버튼, 탭 |
| LabelSmall | 11sp | Medium | 칩, 배지 |

### 숫자 폰트 규칙
- 금액, 수익률 등 숫자: **Tabular figures (고정폭)** — `fontFeatureSettings = "tnum"`
- 단위: BodyMedium, 숫자보다 작게

---

## 4. 레이아웃 & 간격

### 4.1 Grid
- 기본 컨텐츠 패딩: `horizontal = 16dp`
- 카드 간격: `8dp`
- 섹션 간격: `16dp`
- 리스트 아이템 높이: `72dp` (아이콘 포함) / `56dp` (텍스트만)

### 4.2 핵심 컴포넌트 스펙

#### 자산 요약 카드 (Asset Summary Card)
```
ElevatedCard
  shape: RoundedCornerShape(16dp)
  padding: 20dp
  ┌──────────────────────────────┐
  │ 총 자산가치           [KRW▼] │  ← 헤더 + 통화 토글 칩
  │                              │
  │  ₩ 52,340,000               │  ← DisplayLarge, Profit/Loss 색
  │                              │
  │  HorizontalDivider           │
  │                              │
  │  투자금           수익금액    │  ← BodyMedium (label)
  │  ₩47,000,000   +₩5,340,000  │  ← TitleMedium
  │                              │
  │  수익률                      │  ← BodyMedium (label)
  │  ▲ +11.36%                  │  ← HeadlineMedium, Profit 색
  └──────────────────────────────┘
  elevation: 2dp
```

#### 종목 리스트 아이템 (Holding Item)
```
ListItem (height: 72dp)
  leadingContent: 종목 이니셜 Avatar (40dp, Primary 계열)
  headlineContent: 종목명 (TitleMedium)
  supportingContent: 해외·국내 · {보유수량}주 (BodyMedium, Secondary)
  trailingContent:
    Column(horizontalAlignment = End)
      현재가 (TitleMedium)
      수익률 (BodyMedium, Profit/Loss 색, ▲▼ 기호)
```

#### 거래 내역 아이템 (Trade Item)
```
ListItem (height: 72dp)
  leadingContent: 거래유형 아이콘 (매수: 파란 ↑ / 매도: 빨간 ↓)
  headlineContent: 종목명 (TitleMedium)
  supportingContent: {날짜} · {계좌} · {증권사} (BodyMedium)
  trailingContent:
    Column(horizontalAlignment = End)
      총금액 (TitleMedium)
      {수량}주 @ {가격} (BodySmall)
```

#### 포트폴리오 테이블 행
```
Row(height: 56dp, padding: horizontal 16dp)
  종목명    (TitleMedium, weight 2f)
  수량      (BodyMedium, weight 1f, textAlign = End)
  평단      (BodyMedium, weight 1.5f, textAlign = End)
  수익률    (BodyMedium, weight 1f, textAlign = End, Profit/Loss 색)
  비중      (BodyMedium, weight 1f, textAlign = End)
```

---

## 5. 컴포넌트 라이브러리

### 5.1 ProfitLossText
```kotlin
// 수익/손실 표기 전용 Text
@Composable
fun ProfitLossText(
    value: Double,           // 수익률 또는 수익금액
    isRate: Boolean = false, // true → "+11.36%", false → "+₩5,340,000"
    style: TextStyle = MaterialTheme.typography.bodyMedium
)
// 양수: Primary(파란색) + "▲ +" 접두사
// 음수: Error(빨간색) + "▼ -" 접두사
// 0: Neutral + "─" 접두사
```

### 5.2 AccountChip
```kotlin
// 계좌 타입을 색상 칩으로 표시
@Composable
fun AccountChip(accountType: AccountType)
// ISA → 초록 / IRP → 보라 / 연금저축 → 주황 / 일반계좌 → 회색
```

### 5.3 CurrencyText
```kotlin
// 해외/국내 통화 자동 포맷
@Composable
fun CurrencyText(
    amount: Double,
    marketType: MarketType, // 해외 → "$1,234.56" / 국내 → "₩1,234,567"
    style: TextStyle
)
```

### 5.4 DonutChart
```kotlin
// 포트폴리오 비중 도넛 차트
@Composable
fun DonutChart(
    data: List<ChartSlice>, // label, value, color
    centerLabel: String,    // 중앙 텍스트 (예: "총 자산")
    modifier: Modifier
)
// Canvas 기반 구현, 애니메이션: spring + tween 조합
```

### 5.5 TradeInputBottomSheet
```kotlin
// 거래 입력 ModalBottomSheet
@Composable
fun TradeInputBottomSheet(
    stocks: List<Stock>,
    onSave: (TradeInput) -> Unit,
    onDismiss: () -> Unit
)
```

---

## 6. 네비게이션 구조

```
NavHost
├── BottomNavigation (4탭)
│   ├── HomeScreen          route: "home"
│   ├── TradeScreen         route: "trade"
│   ├── StockScreen         route: "stocks"
│   └── PortfolioScreen     route: "portfolio"
│
└── Modal Overlays
    ├── TradeInputBottomSheet   (거래 입력)
    ├── StockAddBottomSheet     (종목 추가)
    └── HoldingDetailSheet      (종목 상세)
```

### BottomNavigation 아이콘
| 탭 | 아이콘 (Material Icons) | 레이블 |
|----|------------------------|--------|
| 홈 | Icons.Outlined.Dashboard | 홈 |
| 거래 | Icons.Outlined.SwapVert | 거래 |
| 종목 | Icons.Outlined.List | 종목 |
| 포트폴리오 | Icons.Outlined.PieChart | 포트폴리오 |

---

## 7. 애니메이션 & 전환

| 상황 | 애니메이션 |
|------|-----------|
| 화면 전환 (탭) | fadeIn + fadeOut, 150ms |
| BottomSheet 등장 | slide up, spring dampingRatio=0.8 |
| 수익률 숫자 변경 | CountUpAnimation, 800ms |
| 도넛 차트 렌더링 | sweep animation, 600ms, EaseOutCubic |
| 리스트 아이템 등장 | staggered fade+slide, 50ms 간격 |
| 스와이프 삭제 | SwipeToDismiss, 빨간 배경 슬라이드 |

---

## 8. 아이콘 & 이미지

- **아이콘 라이브러리**: Material Icons Extended
- **종목 아바타**: 종목명 첫 글자 이니셜 (Avatar), Primary 계열 배경색
- **거래유형 아이콘**:
  - 매수: `Icons.Filled.ArrowUpward` (Profit Blue 배경)
  - 매도: `Icons.Filled.ArrowDownward` (Loss Red 배경)
- **수익 방향 기호**: ▲ (상승) / ▼ (하락) — Unicode, 폰트로 렌더링

---

## 9. 빈 상태 (Empty State)

| 화면 | 빈 상태 메시지 | CTA |
|------|--------------|-----|
| 홈 | "보유 종목이 없습니다" | "종목 추가하기" 버튼 |
| 거래 | "거래 내역이 없습니다" | "+ 거래 입력" 버튼 |
| 종목 | "등록된 종목이 없습니다" | "+ 종목 추가" 버튼 |
| 포트폴리오 | "데이터가 없습니다" | 메시지만 |

---

## 10. 로딩 & 에러 상태

### 로딩
- 자산 요약 카드: Shimmer Skeleton (회색 플레이스홀더)
- 리스트: Shimmer 3~5개 아이템
- 현재가: `CircularProgressIndicator` (Inline, 12dp)

### 에러
- 현재가 실패: `"-"` 텍스트 + 마지막 갱신 시각
- 네트워크 오류: Snackbar `"네트워크 연결을 확인해주세요"` + 재시도 액션
- DB 오류: 전체 화면 에러 + 재시도 버튼

---

## 11. 기술 스택 매핑

| UI 요구사항 | 구현 방법 |
|------------|----------|
| 화면 구성 | Jetpack Compose + Material3 |
| 네비게이션 | Navigation Compose |
| BottomSheet | ModalBottomSheet (Compose) |
| 차트 | Canvas API (Compose) 또는 Vico 라이브러리 |
| 상태 관리 | ViewModel + StateFlow (Coroutines) |
| 비동기 처리 | Kotlin Coroutines (primary) + RxJava (legacy 호환) |
| 로컬 DB | Room + Entity/DAO |
| 현재가 API | Retrofit + OkHttp (Google Finance / Naver Finance) |
| 환율 API | Retrofit |
| DI | Hilt |
| 이미지 | Coil (필요시) |

---

## 12. MVVM 레이어 구조

```
UI Layer (Compose)
  ↕ UiState (sealed class)
ViewModel Layer
  ↕ UseCase / Repository Interface
Data Layer
  ├── Local: Room DB (StockDao, TradeDao)
  └── Remote: StockPriceApi (Retrofit)
```

### UiState 패턴
```kotlin
sealed class HomeUiState {
    object Loading : HomeUiState()
    data class Success(
        val totalAsset: Double,
        val totalInvestment: Double,
        val profitAmount: Double,
        val profitRate: Double,
        val holdings: List<HoldingSummary>,
        val exchangeRate: Double
    ) : HomeUiState()
    data class Error(val message: String) : HomeUiState()
}
```

---

## 13. 검토 포인트 (개발 전 확인 필요)

- [ ] 현재가 API: Google Finance 직접 호출 가능 여부 확인 → 불가시 Yahoo Finance / Alpha Vantage 대안
- [ ] 환율 API: 공개 API 선정 (ex. ExchangeRate-API, 한국은행 API)
- [ ] 도넛 차트: Canvas 직접 구현 vs Vico 라이브러리 선택
- [ ] 데이터 초기 로드: Google Sheets 기존 데이터 Import 기능 필요 여부
- [ ] 보유수량 0 종목 표시 여부: Dashboard에서 숨김 vs 표시 선택
- [ ] 연금저축2 계좌 포함 여부 (5개 계좌 탭)
