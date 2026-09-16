/* 한국대학수영연맹 univswim.kr — 커스텀 스크립트
   https://github.com/kangjjang/univswim-web
   노션이 렌더링한 데이터를 읽어 시안 레이아웃으로 다시 그린다.
   실패해도 노션 기본 화면이 그대로 남도록 전부 try/catch 로 감쌌다. */
(function () {
  'use strict';

  var CFG = {
    title: '한국대학수영연맹',
    english: 'Korea University Swimming Federation',
    cta: [['대회 일정', '/game/schedule', 1], ['대회 결과 · 기록', '/game/result', 0]],
    quick: [
      ['대회 요강', '/game/schedule', 'cal'],
      ['증명서 발급', '/game/certificate', 'doc'],
      ['심판 안내', '/referee/schedule', 'whistle'],
      ['연맹 규정', '/intro/goal', 'shield'],
      ['문의하기', '/community/free', 'chat']
    ],
    info: [
      ['연맹소개', '연혁, 조직도, 임원 안내', '/intro/greeting'],
      ['심판', '심판 강습, 배정, 자격', '/referee/schedule'],
      ['관련 규정', '정관, 경기 규정, 서식', '/intro/goal']
    ],
    footLinks: [['개인정보처리방침', '/intro/goal'], ['이용약관', '/intro/goal'], ['찾아오시는 길', '/intro/greeting']],
    footInfo: ['사단법인 대학수영연맹', '서울특별시 송파구 삼전로 95 3층 (잠실동, 태성빌딩)', 'manager@univswim.kr'],
    footCopy: 'Copyright © 2020 사단법인 대학수영연맹 (Korea University Swimming Federation). All Rights Reserved.'
  };

  var ICON = {
    cal: 'M5 6h14v14H5zM7 3v3M17 3v3M5 10h14',
    doc: 'M6 3h8l5 5v13H6zM14 3v5h5M9 14l2 2 4-4',
    whistle: 'M7 4h10v6a5 5 0 01-10 0zM12 15v4M9 21h6',
    shield: 'M12 3l8 3v6c0 4.4-3.1 7.9-8 9-4.9-1.1-8-4.6-8-9V6zM9 12l2 2 4-4',
    chat: 'M4 5h16v13H8l-4 3zM8 10h8M8 14h5',
    arrow: 'M5 12h13M13 6l6 6-6 6'
  };
  function svg(d, cls) { return '<svg viewBox="0 0 24 24" aria-hidden="true"' + (cls ? ' class="' + cls + '"' : '') + '><path d="' + d + '"/></svg>'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function isHome() { return location.pathname === '/' || location.pathname === ''; }
  function txt(el) { return (el && typeof el.innerText === 'string') ? el.innerText : ''; }

  /* ---------- 히어로 + 바로가기 띠 ---------- */
  function hero() {
    var cover = document.querySelector('img.page_cover');
    if (!cover) return false;
    var host = cover.closest('.kh');
    if (!host) {
      host = document.createElement('div');
      host.className = 'kh';
      cover.parentNode.insertBefore(host, cover);
      host.appendChild(cover);
      var head = host.nextElementSibling;
      if (head && head.classList.contains('width') && head.classList.contains('padding')) head.classList.add('khd');
    }
    if (!host.querySelector('.kv')) {
      var d = document.createElement('div');
      d.className = 'kv';
      d.innerHTML = '<div class="ki"><h1>' + esc(CFG.title) + '</h1><p>' + esc(CFG.english) + '</p><div class="kc">' +
        CFG.cta.map(function (b) { return '<a class="kb ' + (b[2] ? 'kb1' : 'kb2') + '" href="' + esc(b[1]) + '">' + esc(b[0]) + '</a>'; }).join('') +
        '</div></div>';
      host.appendChild(d);
    }
    if (!document.querySelector('.kq')) {
      var s = document.createElement('section');
      s.className = 'kq';
      s.innerHTML = '<ul>' + CFG.quick.map(function (q) {
        return '<li><a href="' + esc(q[1]) + '"><i>' + svg(ICON[q[2]]) + '</i><span>' + esc(q[0]) + '</span></a></li>';
      }).join('') + '</ul>';
      host.parentNode.insertBefore(s, host.nextSibling);
    }
    return true;
  }

  /* ---------- 노션 원본 데이터 (window.__NEXT_DATA__) ---------- */
  function rmap() {
    try { return window.__NEXT_DATA__.props.pageProps.recordMap; } catch (e) { return null; }
  }
  function unwrap(x) { return (x && x.value) ? (x.value.value || x.value) : x; }
  function joinRT(rt) {
    if (!rt) return '';
    return rt.map(function (seg) { return (seg && seg[0]) || ''; }).join('').trim();
  }
  function dateOf(rt) {
    try {
      var d = rt[0][1][0][1];
      return { start: d.start_date || '', end: d.end_date || '' };
    } catch (e) { return null; }
  }
  function fmtDate(s) { return s ? s.replace(/-/g, '.') : ''; }
  /** 컬렉션을 이름으로 찾아 {id, schema, rows} 반환 */
  function coll(name) {
    var rm = rmap(); if (!rm || !rm.collection) return null;
    var id = null, schema = null;
    Object.keys(rm.collection).forEach(function (k) {
      var v = unwrap(rm.collection[k]);
      if (!v || !v.schema) return;
      if (joinRT(v.name) === name) { id = k; schema = v.schema; }
    });
    if (!id) return null;
    var key = {};
    Object.keys(schema).forEach(function (pk) { key[schema[pk].name || '제목'] = pk; });
    var rows = [];
    Object.keys(rm.block || {}).forEach(function (bk) {
      var b = unwrap(rm.block[bk]);
      if (b && b.parent_table === 'collection' && b.parent_id === id) rows.push(b);
    });
    return { id: id, key: key, rows: rows };
  }
  function P(row, c, name) {
    var pk = c.key[name];
    return (pk && row.properties && row.properties[pk]) ? row.properties[pk] : null;
  }
  function S(row, c, name) { return joinRT(P(row, c, name)); }
  function D(row, c, name) { return dateOf(P(row, c, name)); }
  function titleOf(row, c) {
    var pk = c.key['제목'] || c.key[''] || c.key['이름'] || 'title';
    return joinRT(row.properties && row.properties[pk]);
  }
  function hrefOf(row) { return '/' + row.id; }
  function hideSrc(name) {
    var blocks = [].slice.call(document.querySelectorAll('.notion-collection_view-block'));
    var rm = rmap(); if (!rm) return;
    blocks.forEach(function (b) {
      var id = b.getAttribute('data-block-id');
      var v = id && rm.block && rm.block[id] ? unwrap(rm.block[id]) : null;
      if (!v || !v.collection_id) return;
      var cv = unwrap(rm.collection[v.collection_id]);
      if (cv && joinRT(cv.name) === name) {
        b.classList.add('kua-src');
        var cl = b.closest && b.closest('.notion-column_list-block');
        if (cl) cl.classList.add('kua-src');
      }
    });
  }
  function section(cls, title, moreHref, moreLabel, inner) {
    var s = document.createElement('section');
    s.className = 'ksec' + (cls ? ' ' + cls : '');
    s.innerHTML =
      '<div class="khd2"><h2>' + esc(title) + '</h2>' +
      (moreHref ? '<a class="kmore" href="' + esc(moreHref) + '">' + esc(moreLabel || '더보기 +') + '</a>' : '') +
      '</div><div class="krule"></div>' + inner;
    return s;
  }

  /* ---------- 대회 일정 ---------- */
  var STATE = { '진행 예정': 'open', '진행중': 'open', '진행 중': 'open', '준비 중': 'prep', '준비중': 'prep', '종료': 'done' };
  function meets(anchor) {
    var c = coll('대회일정'); if (!c || !c.rows.length) return false;
    var list = c.rows.map(function (r) {
      var per = D(r, c, '기간');
      return {
        title: titleOf(r, c), href: hrefOf(r),
        state: S(r, c, '상태'), place: S(r, c, '장소'),
        period: per ? (fmtDate(per.start) + (per.end ? ' ~ ' + fmtDate(per.end) : '')) : '',
        sort: per ? per.start : ''
      };
    }).filter(function (o) { return o.title; });
    list.sort(function (a, b) { return (b.sort || '').localeCompare(a.sort || ''); });
    if (!list.length) return false;
    var html = '<div class="kmeets">' + list.slice(0, 3).map(function (m) {
      var rows = '';
      if (m.period) rows += '<dt>기간</dt><dd>' + esc(m.period) + '</dd>';
      if (m.place) rows += '<dt>장소</dt><dd>' + esc(m.place) + '</dd>';
      return '<a class="kmeet" href="' + esc(m.href) + '">' +
        (m.state ? '<span class="kbadge ' + (STATE[m.state] || 'done') + '">' + esc(m.state) + '</span>' : '') +
        '<h3>' + esc(m.title) + '</h3>' + (rows ? '<dl>' + rows + '</dl>' : '') + '</a>';
    }).join('') + '</div>';
    anchor.appendChild(section('', '대회 일정', '/game/schedule', '더보기 +', html));
    hideSrc('대회일정');
    return true;
  }

  /* ---------- 새소식 ---------- */
  var CATS = ['공지사항', '심판', '커뮤니티'];
  var CATHREF = { '공지사항': '/community/notice', '심판': '/referee/schedule', '커뮤니티': '/community/free' };
  function news(anchor) {
    var c = coll('공지사항'); if (!c || !c.rows.length) return false;
    var g = { '공지사항': [], '심판': [], '커뮤니티': [] };
    c.rows.forEach(function (r) {
      var t = titleOf(r, c); if (!t) return;
      var cat = S(r, c, '구분'); if (CATS.indexOf(cat) < 0) cat = '공지사항';
      var d = D(r, c, '등록일');
      g[cat].push({ title: t, href: hrefOf(r), date: d ? fmtDate(d.start) : '', sort: d ? d.start : '' });
    });
    var total = CATS.reduce(function (n, k) { return n + g[k].length; }, 0);
    if (!total) return false;
    var html = '<div class="knews">' + CATS.map(function (k) {
      g[k].sort(function (a, b) { return (b.sort || '').localeCompare(a.sort || ''); });
      var items = g[k].slice(0, 4);
      var body = items.length
        ? '<ul>' + items.map(function (r) {
            return '<li><a href="' + esc(r.href) + '"><span class="t">' + esc(r.title) + '</span>' +
              (r.date ? '<span class="d">' + esc(r.date) + '</span>' : '') + '</a></li>';
          }).join('') + '</ul>'
        : '<p class="kempty">등록된 글이 없습니다.</p>';
      return '<div class="kncol"><div class="knhead"><h3>' + esc(k) + '</h3>' +
        '<a class="kmore" href="' + esc(CATHREF[k]) + '">더보기 +</a></div>' + body + '</div>';
    }).join('') + '</div>';
    anchor.appendChild(section('', '새소식', '', '', html));
    hideSrc('공지사항');
    return true;
  }

  /* ---------- 정보 카드 ---------- */
  function info(anchor) {
    var s = document.createElement('section');
    s.className = 'ksec band';
    s.innerHTML = '<div class="kin"><div class="kinfo">' + CFG.info.map(function (x) {
      return '<a href="' + esc(x[2]) + '"><div><h3>' + esc(x[0]) + '</h3><p>' + esc(x[1]) + '</p></div>' +
        '<span class="karrow">' + svg(ICON.arrow) + '</span></a>';
    }).join('') + '</div></div>';
    anchor.appendChild(s);
  }

  /* ---------- 포토 갤러리 ---------- */
  /* 갤러리 사진은 각 하위 페이지 안에 있어 메인 recordMap 에 없다.
     Oopy 가 이미 렌더링해 둔(숨긴) 원본 카드의 <img> 에서 가져온다. */
  function coverUrl(row) {
    try {
      var src = row.format && row.format.page_cover;
      if (src) {
        if (src.indexOf('http') !== 0) src = 'https://www.notion.so' + src;
        return 'https://oopy.lazyrockets.com/api/v2/notion/image?src=' +
          encodeURIComponent(src) + '&blockId=' + row.id + '&width=800';
      }
      return imgFromSource(row.id);
    } catch (e) { return ''; }
  }
  function imgFromSource(rid) {
    try {
      var cards = [].slice.call(document.querySelectorAll('[data-block-id="' + rid + '"]'));
      for (var c = 0; c < cards.length; c++) {
        if (cards[c].closest('.kgal')) continue;           // 내가 만든 쪽은 건너뜀
        var imgs = [].slice.call(cards[c].querySelectorAll('img'));
        for (var i = 0; i < imgs.length; i++) {
          var u = imgs[i].getAttribute('src') || '';
          if (u && u.indexOf('/emoji/') < 0 && u.indexOf('data:') !== 0) return u;
        }
      }
      return '';
    } catch (e) { return ''; }
  }
  function gallery(anchor) {
    var c = coll('갤러리'); if (!c || !c.rows.length) return false;
    var list = c.rows.map(function (r) {
      return { title: titleOf(r, c), href: hrefOf(r), img: coverUrl(r), rid: r.id };
    }).filter(function (o) { return o.title; });
    if (!list.length) return false;
    var html = '<div class="kgal">' + list.slice(0, 4).map(function (g) {
      return '<a href="' + esc(g.href) + '"><figure><div class="shot" data-rid="' + esc(g.rid) + '">' +
        (g.img ? '<img src="' + esc(g.img) + '" alt="' + esc(g.title) + '" loading="lazy">' : '사진') +
        '</div><figcaption>' + esc(g.title) + '</figcaption></figure></a>';
    }).join('') + '</div>';
    anchor.appendChild(section('', '포토 갤러리', '/community/gallery', '더보기 +', html));
    /* Oopy 가 갤러리 카드를 늦게 렌더링하므로, 사진이 붙을 때까지 몇 번 더 시도한다.
       (사진을 다 채우기 전에는 원본을 숨기지 않는다) */
    var tries = 0;
    (function fill() {
      var left = [].slice.call(document.querySelectorAll('.kgal .shot[data-rid]:not(.done)'));
      left.forEach(function (box) {
        var u = imgFromSource(box.getAttribute('data-rid'));
        if (u) {
          box.innerHTML = '<img src="' + esc(u) + '" alt="" loading="lazy">';
          box.classList.add('done');
        }
      });
      var remaining = document.querySelectorAll('.kgal .shot[data-rid]:not(.done)').length;
      if (remaining && ++tries < 12) { setTimeout(fill, 700); return; }
      hideSrc('갤러리');
    })();
    return true;
  }

  /* ---------- 푸터 ---------- */
  function footer() {
    if (document.querySelector('.kfoot')) return;
    var content = document.querySelector('.notion-page-content');
    if (!content) return;
    var f = document.createElement('footer');
    f.className = 'kfoot';
    f.innerHTML = '<div class="kin"><div class="kfl">' +
      CFG.footLinks.map(function (l) { return '<a href="' + esc(l[1]) + '">' + esc(l[0]) + '</a>'; }).join('') +
      '</div><div class="kfi">' + CFG.footInfo.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') +
      '</div><p class="kfc">' + esc(CFG.footCopy) + '</p></div>';
    content.parentNode.insertBefore(f, content.nextSibling);
  }

  /* ---------- 실행 ---------- */
  var built = false, tries = 0;
  function build() {
    if (!isHome()) { document.documentElement.classList.remove('kon'); return true; }
    if (!hero()) return false;
    document.documentElement.classList.add('kon');
    if (!built || !document.querySelector('.kua-built')) {
      var content = document.querySelector('.notion-page-content');
      if (content && rmap()) {
        var old = document.querySelector('.kua-built');
        if (old) old.remove();
        var host = document.createElement('div');
        host.className = 'kua-built';
        /* React 가 관리하는 .notion-page-content 안에 넣으면 리렌더 때 지워진다.
           반드시 형제로 삽입한다. */
        content.parentNode.insertBefore(host, content.nextSibling);
        try { meets(host); } catch (e) {}
        try { news(host); } catch (e) {}
        try { info(host); } catch (e) {}
        try { gallery(host); } catch (e) {}
        built = true;
      }
    }
    try { footer(); } catch (e) {}
    return true;
  }
  function run() { try { if (!build() && ++tries < 80) setTimeout(run, 250); } catch (e) {} }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
  var path = location.pathname;
  new MutationObserver(function () {
    if (location.pathname !== path) { path = location.pathname; built = false; tries = 0; run(); return; }
    if (isHome() && built && !document.querySelector('.kua-built')) { built = false; run(); }
  }).observe(document.body, { childList: true, subtree: true });
})();
