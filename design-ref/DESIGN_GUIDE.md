# 두리번 디자인 레퍼런스 (Codex용)

이 폴더의 `*.dc.html`은 Claude 디자인 캔버스에서 뽑은 프로토타입 원본이다.
- 브라우저에서 바로 열면 안 그려짐 (`support.js` 런타임 필요). **소스 코드(CSS·마크업)를 읽어서 참고**할 것.
- `<helmet><style>` 안에 실제 CSS가, `<x-dc>` 안에 마크업이, 맨 아래 `<script type="text/x-dc">`에 상호작용 로직이 있다.
- `{{값}}`, `<sc-for>`, `<sc-if>`는 템플릿 문법 → 우리 프레임워크의 반복/조건 렌더링으로 바꿔서 읽으면 됨.

## 디자인 토큰
| 토큰 | 값 | 용도 |
|---|---|---|
| --g | #059669 | 메인 그린 (포커스 링, 강조) |
| --gd | #047857 | 진한 그린 (버튼, 링크) |
| hover | #065F46 | 버튼/링크 hover |
| --gl | #ECFDF5 | 연한 그린 배경 (hover, 칩) |
| --ink | #0B1F1A | 제목/로고 |
| --text | #1F2937 | 본문 |
| --muted | #4B5563 / #6B7280 | 보조 텍스트 |
| --line | #E5E7EB | 테두리 |
| 서브 라인 | #D5E0DB, #DCE7E2, #E3EAE7 | 그린 톤 테두리 |
| 포인트 | #EAB308 (노랑), #F43F6B (핑크·좋아요), #9A3412 / #FFF7ED (주황 배지) | |

- 폰트: `"Pretendard","Noto Sans KR",sans-serif` (Noto Sans KR 400~900 Google Fonts), `letter-spacing:-.03em` 전반, `word-break:keep-all`
- 라운드: 10px / 12px (카드·버튼), 16~22px (큰 패널), 999px (pill 버튼)
- 그림자: `0 18px 50px rgba(15,45,35,.06~.08)` (카드), `0 30px 80px rgba(0,0,0,.25)` (모달)
- 상단바: 높이 68px, sticky, `rgba(255,255,255,.94)` + `backdrop-filter: blur(10px)`
- 포커스: `outline:3px solid #059669; outline-offset:3px`
- 터치 타깃 최소 44px

## 화면 목록 (흐름 순)
| 파일 | 화면 |
|---|---|
| Demo.dc.html | ▶ 전체 흐름 한 페이지 (시연용, 제일 먼저 볼 것) |
| Main.dc.html | 시작 페이지 — 제목·입력창·예시 |
| MainIntro.dc.html | 시작 페이지 + 서비스 소개·이용 방법 |
| MainMap.dc.html | 시작 페이지 지도 애니메이션 버전 (보관용) |
| ChatEmpty.dc.html | 채팅 빈 시작 (장소 찾으면 오른쪽 조건 창 등장) |
| Chat.dc.html | 채팅 + 조건 창 (3:4 → ≤1299px 반반 → ≤959px 위아래) |
| ChatEmptyFlat / ChatFlat | 테두리 없는 버전 (참고용, 실제는 테두리 있는 버전) |
| Search.dc.html | 탐색 중 — 지도 확대·핀 A→E 애니메이션 |
| Recommend.dc.html | 동네 추천 결과 5곳 |
| History.dc.html | 탐색 이력 목록·상세 |
| Likes.dc.html | 관심 동네 목록 |
| canvas.json | 화면 목록/설명 인덱스 |
