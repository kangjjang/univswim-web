# univswim-web

한국대학수영연맹 홈페이지(<https://www.univswim.kr>)의 커스텀 스타일/스크립트.

사이트는 **Oopy**(노션 → 웹사이트)로 운영된다. Oopy 의 커스텀 코드 입력칸은
**약 2,200자에서 잘리므로**(초과분은 경고 없이 버려진다) 코드를 여기 두고
Oopy 에는 아래 두 줄만 넣는다.

```html
<!-- <head> -->
<link rel="stylesheet" href="https://kangjjang.github.io/univswim-web/kua.css">
<!-- <body> -->
<script src="https://kangjjang.github.io/univswim-web/kua.js" defer></script>
```

## 파일

| 파일 | 역할 |
|---|---|
| `kua.css` | 히어로 · 바로가기 띠 · 섹션 · 카드 · 푸터 스타일 |
| `kua.js` | `window.__NEXT_DATA__` 의 노션 데이터를 읽어 시안 레이아웃으로 다시 그린다 |

## 원칙

- Oopy 의 `css-xxxxx` 해시 클래스는 쓰지 않는다 (배포마다 바뀜)
- 데이터는 DOM 을 긁지 않고 `window.__NEXT_DATA__` 에서 읽는다
- 실패해도 노션 기본 화면이 남도록 전부 `try/catch`

## 되돌리기

Oopy 관리자 → HTML 편집 → `<head>` / `<body>` 를 비우고 저장한 뒤
**캐시 갱신 버튼**(`xi-renew`)을 누르면 원래 화면으로 돌아간다.

> 이 저장소는 작업 편의상 개인 계정에 두었다. 연맹 계정으로 옮기려면
> 저장소를 transfer 하고 위 두 URL 의 사용자명만 바꾸면 된다.
