# RETRO SHELL — Y2K / Frutiger Aero / Win98·XP 앱 셸

> 현재 활성 디자인 스타일: **#1 — Crowny Class** (출처: `.claude/knowledge/ui-designer/styles/01-crowny-class.md`)
> 이 문서는 **앱 셸(바탕화면 + 창 크롬 + 작업표시줄 + 로고)** 만 레트로로 리스킨하는 **프로젝트 로컬 오버라이드**입니다.
> **게임 내부**(격자·단서·키패드)는 `design/DESIGN.md` + `design/album-themes.json` 의 앨범 테마를 **그대로** 씁니다. 셸만 바뀝니다.
> 토큰: `design/retro-tokens.css` (모든 raw HEX는 여기 변수로, 컴포넌트 인라인 금지).

---

## 0. 사용자 목표 (UX 먼저)

K-pop 팬이 **부팅 화면 → 최애 아티스트 → 앨범 → 크로스워드**를 "옛 컴퓨터를 켜서 게임 디스크를 실행하는" 향수 무드로 짧게 통과. 핵심 감정 = "Y2K 데스크탑 안에서 내 최애 디스크를 더블클릭하는 느낌". 모바일 90%.

### 메인 플로우 (4 화면, 각 단계 ≤3 액션 / 분기 ≤2)

```
[1] 부팅·랜딩          [2] 카테고리(아티스트)     [3] 앨범 선택           [4] 게임
바탕화면 + 로고         옛 창 안 아티스트 15팀      아티스트의 앨범 N개      옛 창 크롬 안 크로스워드
중앙 더블클릭/START  →  (남10/여5) 아이콘 그리드 →  (지금 1개, 구조상 N) →  (타이틀바+메뉴+버튼)
   │                      │                          │                        │
   │ 이탈: 뭘 누를지 모름  │ 이탈: 최애가 안보임       │ 이탈: 앨범 1개뿐이라    │ 이탈: 셸이 격자를 가림
   │ → 큰 글로시 START     │ → 성별 탭 + 검색          │   선택이 군더더기        │ → 모바일 풀스크린 창,
   │   + 깜빡이는 힌트     │   (기존 HomeBrowser 재활용)│ → N=1이면 자동 진입     │   셸 높이 최소화
   └ 측정: START 클릭률    └ 측정: 아이콘 더블클릭률   └ 측정: 앨범 진입률      └ 측정: 첫칸까지 시간
```

**중요한 흐름 결정**

- **[3] 앨범 선택은 조건부 화면.** 한 아티스트의 앨범이 1개면 [2]→[4] **자동 통과**(중간 창 안 띄움). 2개 이상일 때만 앨범 선택 창을 연다. → "있으면 좋은" 단계로 흐름 망가뜨리지 않기. 데이터 구조(`quizzes.json`)는 팀당 앨범 배열을 이미 허용하므로 라우팅만 분기.
- 현재 코드의 `HomeBrowser`(검색+성별 세그+카드 그리드)는 **[2] 카테고리 화면의 알맹이로 재사용**한다. 바깥을 레트로 창으로 감싸고, 카드 → "데스크탑 아이콘" 룩으로 스킨만 교체.
- 부팅 화면은 한 번 보이고 끝 — `START` 또는 로고 더블클릭 시 사라지고 [2]로. 세션 1회만(localStorage), 재방문 시 건너뛰기 옵션.

---

## 1. 시각 위계 (화면별 "첫째로 보이는 것")

| 화면 | 첫째 (최강조) | 둘째 | 셋째 |
|---|---|---|---|
| [1] 부팅 | 중앙 **로고 + 글로시 START 버튼**(에어로 아쿠아) | 깜빡이는 "더블클릭" 힌트 | 작업표시줄·시계(분위기) |
| [2] 카테고리 | **아티스트 아이콘 그리드** | 성별 탭(남돌/여돌) + 검색 | 창 타이틀바·메뉴 |
| [3] 앨범 | **앨범 디스크 아이콘 N개** | 아티스트명·발매연도 | 타이틀바 |
| [4] 게임 | **크로스워드 격자(앨범 테마색)** | 활성 단서 바 + 키패드 | 셸 타이틀바·메뉴 |

> 그라데이션 CTA 원칙은 유지하되, 이 프로젝트에선 **에어로 글로시 버튼(아쿠아/그린)** 이 "그라데이션 CTA" 역할.

---

## 2. 바탕화면 (Wallpaper) — 순수 CSS, 저작권 사진 금지

XP-Bliss "느낌"만 CSS gradient로. 사진·번들 에셋 일절 없음.

```css
.rs-desktop {
  min-height: 100dvh;
  background:
    /* 1) 구름 — 부드러운 흰 덩어리 여러 겹 */
    radial-gradient(60% 38% at 22% 30%, var(--rs-cloud) 0%, rgba(255,255,255,0.0) 60%),
    radial-gradient(46% 30% at 70% 22%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 62%),
    radial-gradient(38% 24% at 85% 44%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 60%),
    /* 2) 잔디 언덕 — 화면 하단에서 솟는 초록 (Bliss식 롤링힐) */
    radial-gradient(140% 60% at 30% 122%, var(--rs-grass-hi) 0%, var(--rs-grass-mid) 34%, var(--rs-grass-lo) 60%, rgba(58,122,22,0) 61%),
    /* 3) 하늘 — 천정 진한 파랑 → 지평선 옅은 하늘 */
    linear-gradient(180deg, var(--rs-sky-top) 0%, var(--rs-sky-mid) 42%, var(--rs-sky-low) 76%, var(--rs-sky-haze) 100%);
  background-repeat: no-repeat;
}
```

- 잔디는 `radial-gradient` 의 **세로 위치(122%)·크기(140% 60%)** 로 "왼쪽이 더 높은 완만한 언덕" 실루엣을 만든다. 마지막 stop을 투명으로 끊어 능선 위로 하늘이 보이게.
- 모바일에선 구름 radial 개수를 2개로 줄여(성능), 잔디 언덕 비중을 살짝 키움(`at 30% 118%`).
- **선택 강화(데스크탑만):** 능선 위 `box-shadow` 1px 하이라이트 라인으로 햇빛 받은 풀끝 느낌. 과하면 생략.

---

## 3. 창 크롬 (Window Chrome)

게임·카테고리·앨범 화면을 감싸는 옛 윈도우 창. XP 루나 + 98 베벨 혼합.

```
┌───────────────────────────────────────────────┐  ← 3px 파랑 프레임(--rs-window-frame)
│ ▣ K-POP CROSSWORD — aespa / Whiplash    _  □  ✕ │  ← 타이틀바(파랑 글로시 그라데이션)
├───────────────────────────────────────────────┤
│  게임   보기   도움말                            │  ← 메뉴바(베이지 strip, 14px)
├───────────────────────────────────────────────┤
│                                                 │
│   …콘텐츠 (격자 / 아이콘 그리드)…                │  ← 창 face = --rs-face
│                                                 │
├───────────────────────────────────────────────┤
│  준비됨 · 12문항 중 3개 완성                     │  ← 상태바(inset 베벨, 선택)
└───────────────────────────────────────────────┘
```

### 3.1 타이틀바

- 배경: `linear-gradient(180deg, var(--rs-title-1) 0%, var(--rs-title-2) 8%, var(--rs-title-3) 50%, var(--rs-title-4) 92%, var(--rs-title-5) 100%)`.
- 높이 32px(데스크탑) / **36px(모바일 — 터치 여유)**. 상단 좌우 모서리만 `--rs-radius-window`(8px) 라운드.
- **좌측**: 16×16 아이콘(`logo-mark.svg` 축소) + 캡션 텍스트. 캡션 = `<앱명> — <아티스트 / 앨범>`. 폰트 `--rs-font-ui`, `--rs-fs-title`(15px), weight 700, 색 `--rs-title-text`, `text-shadow: 0 1px 0 var(--rs-title-shadow)`(engraved).
- 비활성 창: `--rs-title-off-1/2` 회청색, 텍스트 `--rs-title-text-off`. (모바일 단일 창이라 거의 항상 active.)

### 3.2 캡션 버튼 `_ □ ✕`

- 3개 모두 **22×22(데스크탑) / 30×30(모바일, 터치 44 확보 위해 hit-area 패딩)**. radius `--rs-radius-btn`.
- 최소화 `_` / 최대화 `□`: 아쿠아 글로시 `linear-gradient(180deg, --rs-cap-glass-1, --rs-cap-glass-2 50%, --rs-cap-glass-3)`.
- 닫기 `✕`: 레드 글로시 `linear-gradient(180deg, --rs-cap-close-1, --rs-cap-close-2 50%, --rs-cap-close-3)`.
- 글리프 색 `--rs-cap-glyph`(흰색), 1px 외곽 하이라이트. **상단 50% 흰 gloss 하이라이트** (pseudo `::before` 흰→투명).
- **동작 매핑**(장식이 아니라 실제 기능 부여 — 옛 미감이되 쓸모):
  - `✕` 닫기 = 뒤로(상위 화면). 게임에선 "그만두기" 확인.
  - `□` 최대화 = 모바일에서 이미 풀스크린이므로 **비활성(disabled, 흐리게)** 또는 데스크탑에서 창 폭 토글.
  - `_` 최소화 = 부팅 데스크탑으로(작업표시줄에 남김). MVP에선 `□`/`_` 장식+disabled, `✕`만 활성 가능.

### 3.3 메뉴바 (한국어·장식)

- 배경 `--rs-menu-bg`, 하단 1px `--rs-bevel-shadow` 구분선. 높이 28px.
- 항목: **게임 · 보기 · 도움말** (File/Edit/View/Help 의 한국어 치환). 폰트 `--rs-fs-chrome`(14px), 색 `--text-dark`(기존 토큰), 첫 글자 밑줄(니모닉 장식).
- 호버: `--rs-select` 배경 + `--rs-select-text`. 클릭 시 베벨 드롭다운(outset). **MVP에선 "도움말"만 실제 동작**(규칙 모달), 나머지 장식/비활성 OK. 장식이라도 `aria-disabled` 명시.

### 3.4 창 보더 / 베벨

- 외곽: `3px solid var(--rs-window-frame)` + `box-shadow: var(--rs-shadow-window)` (오프셋 검은 그림자 = 옛 창 띄움).
- 창 face: `--rs-face`. 콘텐츠 패널은 **inset 베벨**(`--rs-shadow-inset`) 으로 살짝 가라앉혀 "작업 영역" 표현.
- radius: 창 상단만 8px, 하단·내부는 0(각진 레트로).

---

## 4. 작업표시줄 (Taskbar) + Start

```
┌──────────┬─────────────────────────────────────┬─────────┐
│ ◐ 시작   │  ▣ K-POP CROSSWORD                   │  PM 9:04 │
└──────────┴─────────────────────────────────────┴─────────┘
  green pill        열린 창 버튼(outset)            sunken clock
```

- 높이 40px(데스크탑) / **44px(모바일)**. 배경 `linear-gradient(180deg, --rs-taskbar-1, --rs-taskbar-2 10%, --rs-taskbar-3 90%, --rs-taskbar-4)`. 상단 1px 밝은 하이라이트 라인.
- **Start 버튼**: 좌측, 그린 글로시 pill `linear-gradient(180deg, --rs-start-1, --rs-start-2 50%, --rs-start-3)`, radius `--rs-radius-pill` 오른쪽만 크게. 라벨 "시작" + `logo-mark` 16px. 폰트 weight 800, 색 `--rs-start-text`, text-shadow 어둡게. 호버 밝아짐, active 눌림(inset).
- **시계**: 우측, sunken 트레이 `--rs-clock-bg` + `--rs-shadow-inset`, 시각 `오전/오후 H:MM`, 색 `--rs-clock-text`, `--rs-fs-chrome`(14px), `tabular-nums`. 실시간 `setInterval` 1분.
- 가운데: 현재 화면 이름의 "열린 창" 버튼(outset, active면 눌림). 부팅 화면에선 비움.

---

## 5. 화면별 적용

### [1] 부팅·랜딩
- `.rs-desktop` 바탕화면 풀스크린 + 하단 작업표시줄.
- 중앙: `logo.svg`(폭 clamp(260px, 70vw, 520px)) + 그 아래 **글로시 아쿠아 START 버튼**(에어로, radius pill, 56px 높이, "▶ START" / "더블클릭하여 시작"). 버튼 아래 12px 작은 깜빡임 텍스트(reduced-motion 시 깜빡임 끔).
- 더블클릭 가능한 데스크탑 아이콘(로고-mark + "K-POP\nCROSSWORD" 라벨)도 좌상단에 배치 → 진짜 데스크탑처럼. 둘 중 무엇을 눌러도 [2]로.

### [2] 카테고리 (아티스트)
- 한 개의 큰 레트로 창. 타이틀 "K-POP CROSSWORD — 아티스트 선택".
- 메뉴바 아래 **기존 HomeBrowser 알맹이**(검색 + 성별 세그 + 그리드). 단:
  - 세그(전체/남돌/여돌) → 베벨 탭 룩(outset, active 시 inset 눌림).
  - 검색창 → **inset 베벨 인풋**(`--rs-shadow-inset`, 흰 배경).
  - 카드 → **데스크탑 아이콘 룩**: 위는 앨범 색면(앨범 `ca1/ca2`) 작은 디스크/타일, 아래 아티스트명 라벨. 선택(키보드 포커스/호버) 시 `--rs-select` 라벨 하이라이트 + 점선 포커스.
- 게임 진입 색은 그대로 앨범 테마. 셸은 레트로 고정.

### [3] 앨범 선택 (조건부)
- 아티스트 앨범 ≥2 일 때만. 작은 창("aespa — 앨범 선택"). 앨범 N개를 **CD/디스크 아이콘** 그리드로(앨범 색 그라데이션 원 + 중앙 하이라이트 글로스 + 타이틀). 1개면 건너뜀.

### [4] 게임
- 레트로 창으로 감싸되 **창 face는 투명 위임** — 안쪽 `.game` 은 앨범 `--album-bg` 그대로 칠해 세계관 유지. 즉 **타이틀바·메뉴바·상태바(셸)만 레트로**, 작업 영역은 앨범 테마.
- 타이틀 캡션 = `K-POP CROSSWORD — <아티스트> / <앨범>`. 상태바 = `12문항 중 N개 완성 · ⏱ MM:SS`.
- 격자·단서바·키패드·완성모달은 `DESIGN.md` 스펙 100% 유지(앨범 accent).

---

## 6. 폰트 규칙

- **영문 UI(타이틀·메뉴·시계·버튼 라벨)**: `--rs-font-ui` = `'Tahoma','Segoe UI','Microsoft Sans Serif','Pretendard Variable',sans-serif`. Tahoma가 라틴을, Pretendard가 한글 폴백.
- **한국어 본문(단서·안내·모달)**: `--rs-font-body` = Pretendard 우선. 게임 내부는 기존대로 Pretendard.
- **로고/픽셀 강조**: `logo.svg`/`logo-mark.svg` (Agbalumo 대신 크롬 워드마크 SVG). 라이브 텍스트로 크롬 강조가 필요하면 흰 글자 + `text-shadow: 0 1px 0 var(--rs-title-shadow)`(engraved) 로만.
- **크기**: 크롬 라벨 **14px 하한**(CEO 승인 예외 — 글로벌 16px 하한을 레트로 셸 칩/라벨에 한해 14px로 완화), 타이틀 15px, **한국어 본문·단서·키패드 16px 유지**. 14px 미만 절대 금지.

> 메모: 진짜 옛 UI는 11px Tahoma지만 접근성 위해 14px로 올림. "픽셀 폰트" 무드는 로고 SVG의 8-bit 스파클·디스크 아이콘으로 표현하고, 본문 텍스트는 작게 만들지 않는다.

---

## 7. 접근성

- **글자 ≥14px(크롬), ≥16px(본문)**. 격자/키패드 16px 이상 유지.
- **대비**: 타이틀바 흰 글자 on 파랑(`--rs-title-3` 대비 ≈ 5.4:1, AA OK). 메뉴 `--text-dark` on `--rs-menu-bg` ≈ 12:1. Start 흰 글자 on 그린은 text-shadow로 보강. 시계 흰 on `--rs-clock-bg` ≈ 6:1.
- **포커스**: 모든 인터랙티브에 `--rs-focus-ring`(흰 1겹 + 아쿠아 1겹) — 옛 점선 포커스의 현대적 대체. 키보드 탭 순서: 타이틀버튼 → 메뉴 → 콘텐츠 → 작업표시줄.
- **모바일 풀스크린**: 창이 화면을 꽉 채우되 **타이틀바·캡션버튼·메뉴바·상태바 유지**(높이만 키워 터치 44px). 베벨/그림자는 약화(성능·가독). `safe-area-inset` 존중.
- **장식 버튼**(disabled `□`,`_`, 장식 메뉴)은 `aria-disabled="true"` + `tabindex` 제외, 시각적으로 흐리게(`opacity:0.5`).
- **모션**: 깜빡임·창 등장 애니메이션은 `prefers-reduced-motion` 분기 필수(기존 globals.css 규칙 그대로).

---

## 8. 강개발 핸드오프 (픽셀 아닌 토큰·상태)

- `design/retro-tokens.css` 를 `globals.css` 상단에서 `@import` 하거나 `:root` 에 병합. **셸 컴포넌트는 전부 `var(--rs-*)` 참조**, raw HEX 인라인 금지.
- 게임 내부 변수(`--accent`,`--album-bg` 등)는 **건드리지 않음**. 셸과 게임은 토큰 네임스페이스 분리(`--rs-*` vs 앨범).
- 신규 컴포넌트(클래스 제안): `.rs-desktop` `.rs-window` `.rs-titlebar` `.rs-caption`(`.rs-caption--min/max/close`) `.rs-menubar` `.rs-menu-item` `.rs-statusbar` `.rs-taskbar` `.rs-start` `.rs-clock` `.rs-btn`(`.rs-btn--glossy`) `.rs-desktop-icon`.
- **빠뜨리면 안 되는 상태**:
  - 캡션버튼: default / hover(밝아짐) / active(inset 눌림) / **disabled**(흐림, `□`·`_` 장식 시).
  - 창: **active / inactive** 타이틀바 2종.
  - 메뉴: default / hover / **disabled**(장식) / open(드롭다운).
  - Start·탭 버튼: default / hover / active(눌림) / focus(ring).
  - 인풋(검색): default / focus(아쿠아 포커스링) / **empty**(placeholder).
  - 데스크탑 아이콘: default / hover / selected / focus.
  - 부팅 깜빡임: 모션 on/off.
- **반응형 분기**: < 640px = 풀스크린 창(타이틀/메뉴/상태바 유지, 베벨 약화, 터치 44px), ≥ 640px = 떠 있는 창 + 오프셋 그림자. **토큰은 동일**, 높이·베벨 강도만 분기.
- CSS 라이브러리 금지(순수 CSS), 아이콘 Lucide(셸 메뉴 화살표·닫기 보조용), 한국어 존댓말.

---

## 9. 저작권 가드 (필수 준수)

- XP Bliss 사진·공식 윈도우 에셋(아이콘·사운드·폰트 파일)·공식 앨범/아티스트 사진 **번들 금지**.
- 바탕화면·창 크롬·로고·디스크 아이콘은 **전부 CSS gradient + 자기완결 SVG**로 "느낌"만 재현.
- Tahoma/Segoe UI 등은 **시스템 폰트 참조**(번들·링크 아님). 없으면 Pretendard/sans 폴백.
- 앨범 색은 `album-themes.json`(공개 컨셉 무드 추출)만 사용, 공식 브랜드 에셋 아님.

---

## 체크리스트 ✓

- [x] UX(4화면 플로우·이탈·지표) 먼저, UI 나중 — 앨범선택은 조건부 단계로 흐름 단순화
- [x] 바탕화면·창·로고 전부 CSS/SVG (저작권 사진·에셋 0)
- [x] 셸 raw HEX 전부 `--rs-*` 토큰(`retro-tokens.css`), 게임 토큰과 네임스페이스 분리
- [x] 폰트: 영문 Tahoma 스택 / 한글 Pretendard / 로고 SVG 크롬 — 크롬 14px·본문 16px 하한
- [x] 창 크롬 5+상태(active/inactive/hover/active/disabled), 캡션버튼 실제 기능 매핑
- [x] 작업표시줄 + 글로시 Start + 실시간 시계
- [x] 모바일 풀스크린 창(타이틀·버튼·메뉴 유지, 터치 44px), PC·모바일 동일 토큰
- [x] 접근성: 대비 AA, 아쿠아 포커스링, 장식버튼 aria-disabled, reduced-motion
- [x] 게임 내부(격자·단서·키패드)는 앨범 테마 100% 유지 — 셸만 레트로
