# DREAMCORE — Frutiger-Aero / dreamcore 장식 레이어

> 활성 디자인 스타일: **#1 — Crowny Class** (출처: `.claude/knowledge/ui-designer/styles/01-crowny-class.md`)
> 셸 오버라이드: `design/RETRO-SHELL.md` (XP 레트로 셸) · `design/album-themes.json` (앨범별 `--accent`)
> 이 문서는 그 위에 얹는 **드림코어 장식 레이어**입니다. CSS 키트: `src/app/dream.css` / 에셋: `public/stickers/*.svg`.

---

## 0. 한 줄 컨셉

레퍼런스 콜라주(파스텔 별·반짝이 스티커, 파란 하프톤 도트 테두리, 몽환 하늘·잔디 글로우, 글로시 비눗방울, Y2K 텍스트)를 **재현이 아니라 스타일만** 입힌다.
핵심 비주얼 = **진짜(iTunes) 앨범 커버를 글로시 프레임 + 반짝이 + 하프톤 테두리 + accent 글로우로 감싼 "콜라주 네모 칸"** = `.cover-tile`.

**전부 additive.** 기존 레이아웃·토큰 건드리지 않고 클래스만 덧붙임. 저작권 사진·스톡 0 (스타일만 CSS/SVG로 재현).

---

## 1. 절대 규칙 (강개발이 지킬 것)

- **순수 CSS·자기완결 SVG만.** 라이브러리·외부 링크·번들 폰트 금지.
- **세리프·이탤릭 금지** (CEO 명시). 라벨은 산세리프 + `font-style: normal`. `.y2k-tag` 가 이미 강제.
- **폰트 ≥ 16px.** `.y2k-tag` 하한 16px (`--q` 변형 20px).
- **무거운 필터 금지.** glow blur 1곳, drop-shadow 약하게만. 전체화면 filter 금지.
- **accent 재사용.** 색은 앨범 `--accent` (게임 화면에 이미 주입됨)에서 끌어씀. 게임 밖에선 부모에 `--accent` 인라인 주입하거나 드림코어 파스텔 폴백 자동 적용 → 절대 맨몸으로 안 보임.
- **임의 HEX 금지.** 새 색은 `dream.css` 상단 `--dc-*` 토큰에 *먼저* 추가 후 사용.

---

## 2. 토큰 (dream.css `:root`)

| 토큰 | 값 | 용도 |
|---|---|---|
| `--dc-sky` | `#8FD4FF` | 드림 하늘 |
| `--dc-mint` | `#A8E6CF` | 잔디/아쿠아 |
| `--dc-lavender` | `#B5A8FF` | 페리윙클 (accent 폴백) |
| `--dc-pink` | `#FF9EC4` | 버블검 핑크 |
| `--dc-lemon` | `#FFF3B0` | 소프트 레몬 하이라이트 |
| `--dc-dot` | `#3E6BD4` | 하프톤 도트 블루 (레퍼런스) |
| `--dc-dot-soft` | `#6E9BEA` | 어두운 앨범용 밝은 도트 |
| `--dc-tile-radius` | `22px` | 커버 프레임 라운드 |
| `--dc-halftone-w` / `--dc-halftone-gap` | `13px` / `11px` | 도트 테두리 두께 / 피치 |
| `--dc-sticker-sm/md/lg` | `26 / 40 / 62px` | 스티커 크기 |

`--dc-accent` 는 `.cover-tile` / `.dream-scope` 안에서 `var(--accent, var(--dc-accent-fallback))` 로 1회 해석됨.

---

## 3. 클래스 카탈로그

### 3.1 `.cover-tile` — 진짜 앨범 커버 프레임 (핵심)

글로시 베젤 + accent 글로우 + 상단 유리 스윕(`::before`) + 우상단 반짝이(`::after`, 자동). 마크업:

```html
<figure class="cover-tile">
  <span class="cover-tile__glow" aria-hidden="true"></span>
  <img class="cover-tile__img" src="/covers/aespa__whiplash.jpg" alt="aespa — Whiplash 앨범 커버">
</figure>
```

- `.cover-tile__glow` — accent 색 블룸(뒤 `z-index:-1`). 생략 가능하나 넣으면 몽환감↑.
- `.cover-tile__img` — 진짜 커버 `<img>`. `object-fit:cover` 라 정사각/직사각 다 안전.
- 변형: `.cover-tile--no-sparkle`(우상단 반짝이 끔) · `.cover-tile--flush`(패딩·라운드 축소 — 작은 그리드 카드용).
- 추가 스티커가 더 필요하면 `<figure>` 안에 `.sticker` 흩뿌리기(아래 3.3).

### 3.2 `.halftone-frame` — 파란 하프톤 도트 테두리

`radial-gradient` 도트를 **테두리 링에만** 표시(mask-exclude). 어떤 블록이든 감쌈:

```html
<div class="halftone-frame">
  <figure class="cover-tile"> … </figure>
</div>
```

- 변형: `.halftone-frame--soft`(연한 파랑) · `.halftone-frame--dense`(촘촘) · `.halftone-frame--accent`(앨범 accent 색 도트).
- 커버타일을 한 번 더 감싸면 레퍼런스의 "도트 테두리 + 글로시 사진" 이중 프레임이 됨.

### 3.3 `.sticker` — 별/반짝이/비눗방울 흩뿌리기

부모가 `position: relative` 여야 함(`.game__art`, 카드, `.cover-tile`, `.dream-bg` 등 OK).

```html
<span class="sticker sticker--star sticker--lg sticker--tl"></span>
<span class="sticker sticker--sparkle sticker--sm" style="top:18%; right:-8px"></span>
<span class="sticker sticker--bubble sticker--md sticker--delay" style="bottom:6%; left:12%"></span>
```

- 종류: `--star`(파스텔 다색 별) · `--sparkle`(4각 반짝이) · `--bubble`(글로시 비눗방울).
- 크기: `--sm/--md(기본)/--lg`. 코너 헬퍼: `--tl/--tr/--bl/--br`(살짝 오버행). 그 외엔 inline `top/left/...`.
- 모션: 별·반짝이는 트윙클, 비눗방울은 플로트. `--delay` 로 위상 차. `prefers-reduced-motion` 시 자동 정지.
- `pointer-events:none` — 클릭/포커스 절대 안 가로챔.

### 3.4 `.dream-bg` — 몽환 하늘+잔디+보케 오버레이 (선택)

기존 XP 배경 **위에 낮은 opacity로 덧칠**(대체 아님). 풀블리드 레이어로:

```html
<div class="desktop">
  <div class="dream-bg" aria-hidden="true"></div>   <!-- inset:0, 부모 relative -->
  … 기존 내용 …
</div>
```

- `--hero` 변형 = opacity↑(랜딩 스타필드 히어로). `pointer-events:none`, `z-index:0`.

### 3.5 `.y2k-tag` — Y2K 텍스트 라벨

```html
<span class="y2k-tag">Is it time?</span>
<span class="y2k-tag y2k-tag--q">???</span>
<span class="y2k-tag y2k-tag--sky y2k-tag--straight">This is a Dream</span>
```

- 글로시 파스텔 pill, 흰 글자, 살짝 기운 콜라주 무드(`--straight` 로 똑바로).
- accent 색 따름. 스코프에 accent 없으면 `--sky/--pink/--mint` 변형으로 지정.
- **산세리프·non-italic·16px↓ 금지** 가 클래스에 박혀 있음.

---

## 4. 어디에 적용하나 (화면별)

| 위치 | 적용 |
|---|---|
| **게임 헤더 배너** (`.game__art`) | `.game__art-img` → `.cover-tile` 로 감싸 진짜 커버 표시. `.game__art` 에 `.sticker` 2~3개 흩뿌림. 배너 자리는 이미 `--accent` 주입됨 → glow 자동. |
| **앨범 선택 카드** ([3] 조건부 화면) | 각 디스크/카드를 `.cover-tile.cover-tile--flush` + 바깥 `.halftone-frame` 으로. 카드 부모에 그 앨범 `--accent` 인라인 주입. |
| **아티스트 아이콘** ([2] 카테고리 그리드) | 데스크탑 아이콘 위 타일을 `.cover-tile--flush`. 반짝이는 호버 시에만(과밀 방지 위해 평소 `--no-sparkle` 권장). |
| **랜딩/부팅 배경** ([1]) | `.dream-bg.dream-bg--hero` 오버레이 + 큰 `.sticker--star --lg` 몇 개 스타필드. `.y2k-tag` 로 "Is it time?" 깜빡 카피. |

> **흐름 우선:** 스티커는 "있으면 좋은" 요소라 흐름을 가리면 *뺀다*. 게임 격자·단서바·키패드 위에는 스티커 금지(클릭 영역 위 장식 X). 배너·카드·여백에만.

---

## 5. 라이트/다크 앨범 스티커 대비 규칙

앨범 `bg` 가 near-black(aespa #0C0D10, stray-kids #1A0E10 …) ~ near-white(riize #FFF7F0, tws #EAFBFB …) 로 폭넓다. 흰 코어 스티커가 밝은 앨범에서 묻히지 않게 스코프 플래그:

```html
<div class="dream-scope dream-scope--light"> … </div>   <!-- 밝은 앨범 -->
<div class="dream-scope dream-scope--dark"> … </div>     <!-- 어두운 앨범 -->
```

- `--light` → 스티커·코너반짝이에 어두운 소프트 헤일로(파묻힘 방지).
- `--dark` → 스티커에 흰 글로우 + 하프톤 도트를 `--dc-dot-soft` 밝은 파랑으로 자동 교체.
- 판정: `album-themes.json` 의 `bg` 명도로 강개발이 분기(대략 `fg` 가 밝으면 다크 앨범). 라이트 앨범 8팀(riize·boynextdoor·zerobaseone·tws·nct-wish·illit 등), 다크 7팀.

---

## 6. 강개발 핸드오프 체크 (픽셀 아닌 클래스·상태)

- `src/app/dream.css` 를 `globals.css` 에서 `@import` (retro.css 다음 줄). 토큰 충돌 없음(`--dc-*` 독립 네임스페이스).
- `.cover-tile` 쓸 땐 **부모 스코프에 accent 가 있는지** 확인 — 게임 안은 자동, 밖은 인라인 `style={{['--accent']: theme.accent[0]}}` 주입 또는 폴백 수용.
- 스티커 부모는 `position: relative` 필수. 안 그러면 페이지 좌상단으로 튐.
- 빠뜨리면 안 되는 상태: 아이콘 타일 hover 시 반짝이 on/off, reduced-motion 정지(이미 CSS 처리), 라이트/다크 스코프 플래그.
- 게임 격자·키패드·단서바 영역엔 스티커 **금지**(흐름·클릭 보호).

---

## 7. 저작권 가드

- iTunes 커버는 `.cover-tile__img` 의 `<img src>` 로만 — **장식 프레임은 전부 CSS/SVG**, 레퍼런스의 실제 사진·스톡 미사용.
- 스티커 SVG 3종은 자기완결(외부 링크·폰트·저작 에셋 0): `star-burst.svg` / `sparkle.svg` / `bubble.svg`.
- 색은 `album-themes.json`(공개 컨셉 무드 추출) + `--dc-*` 파스텔만.

---

## 체크리스트 ✓

- [x] UX 먼저 — 스티커는 흐름 가리면 뺀다, 격자/키패드 위 장식 금지
- [x] 핵심 비주얼 = 진짜 커버를 `.cover-tile` 콜라주 프레임으로 (accent glow + 글로시 + 반짝이)
- [x] `.halftone-frame` 파란 도트 테두리 = 순수 radial-gradient + mask-exclude
- [x] `.sticker--star/sparkle/bubble` + 크기·코너·딜레이 변형, pointer-events:none, reduced-motion 정지
- [x] `.dream-bg` 는 기존 XP 배경 위 낮은 opacity 오버레이(additive)
- [x] `.y2k-tag` 산세리프·non-italic·≥16px 강제
- [x] 라이트/다크 앨범 스티커 대비 규칙(`.dream-scope--light/--dark`)
- [x] 전부 CSS/SVG, 저작권 사진 0, 무거운 필터 0, `--dc-*` 네임스페이스 독립
