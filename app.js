(function () {
  'use strict';

  const CERTS = window.CERTS;
  const ORGS = window.ORGS;
  const ELIG = window.ELIG;
  const byId = new Map(CERTS.map((c) => [c.id, c]));

  /* 분야 묶음과 노선 색 */
  const GROUPS = [
    { key: 'it', areas: ['컴퓨터·개발', '데이터·AI', '보안·네트워크', '전자·반도체'] },
    { key: 'office', areas: ['사무·문서', '회계·세무', '금융', '경영·마케팅', '유통·물류', '무역', '부동산·법'] },
    { key: 'lang', areas: ['외국어'] },
    { key: 'design', areas: ['디자인', '영상·사진', '패션'] },
    { key: 'tech', areas: ['기계', '자동차', '전기', '에너지·가스', '안전·소방', '화학·환경', '건축·인테리어', '토목·측량'] },
    { key: 'service', areas: ['조리·제과', '미용', '관광·서비스', '스포츠', '농림·조경'] },
    { key: 'care', areas: ['보건·의료', '복지·상담', '교육·보육'] },
  ];
  const AREA_GROUP = {};
  GROUPS.forEach((g) => g.areas.forEach((a) => (AREA_GROUP[a] = g.key)));

  /* 검색할 때 같이 찾을 말 */
  const ALIAS = {
    '컴퓨터·개발': 'IT 프로그래밍 코딩 소프트웨어 개발 컴퓨터',
    '데이터·AI': '데이터 인공지능 AI 분석 통계 빅데이터',
    '보안·네트워크': '보안 해킹 네트워크 서버 클라우드 인프라',
    '전자·반도체': '전자 반도체 회로 하드웨어',
    '사무·문서': '사무 오피스 엑셀 문서 행정',
    '회계·세무': '회계 세무 경리 재무 세금',
    '금융': '금융 은행 증권 투자 보험',
    '경영·마케팅': '경영 마케팅 광고 기획 영업 인사',
    '유통·물류': '유통 물류 창고 배송 MD',
    '무역': '무역 수출 수입 해외영업',
    '외국어': '영어 일본어 중국어 어학 외국어',
    '디자인': '디자인 그래픽 포토샵 디자이너',
    '영상·사진': '영상 사진 유튜브 편집 콘텐츠',
    '패션': '패션 옷 의류',
    '기계': '기계 생산 공장 제조 설계',
    '자동차': '자동차 정비 차량 전기차',
    '전기': '전기 전기공사 설비',
    '에너지·가스': '에너지 가스 보일러 태양광 발전',
    '안전·소방': '안전 소방 안전관리자',
    '화학·환경': '화학 환경 식품 분석 실험',
    '건축·인테리어': '건축 인테리어 시공 건설',
    '토목·측량': '토목 측량 건설 도로',
    '조리·제과': '요리 조리 제과 제빵 카페 음식 셰프',
    '미용': '미용 헤어 네일 메이크업 피부 뷰티',
    '관광·서비스': '관광 호텔 여행 서비스 항공',
    '스포츠': '스포츠 운동 트레이너 체육',
    '농림·조경': '농업 조경 꽃 산림 귀농',
    '보건·의료': '보건 의료 병원 간호',
    '복지·상담': '복지 상담 심리 사회복지',
    '교육·보육': '교육 보육 선생님 강사 어린이집',
    '부동산·법': '부동산 법 법률 노무',
  };

  const LV_TEXT = ['', '쉬움', '조금 쉬움', '보통', '어려움', '아주 어려움'];

  /* ───── 저장 ───── */
  const KEY = 'searching-license:v1';
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return Object.assign({ saved: [], done: {}, who: 'all', sort: 'rec' }, JSON.parse(raw));
    } catch (e) { /* 저장소를 못 쓰면 기본값 */ }
    return { saved: [], done: {}, who: 'all', sort: 'rec' };
  }
  const store = load();
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* 무시 */ }
  }

  /* ───── 상태 ───── */
  const state = { q: '', area: null, view: 'find', sel: null };

  /* ───── 도우미 ───── */
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const areaOf = (c) => c.i[0];
  const groupOf = (c) => AREA_GROUP[areaOf(c)] || 'it';
  const hsOK = (c) => (c.hs !== undefined ? c.hs : c.el === 'free');
  const eligText = (c) => ELIG[c.el] || c.el;
  const isSaved = (id) => store.saved.includes(id);
  const prevOf = (id) => CERTS.filter((c) => (c.nx || []).includes(id));

  function stationsOf(c) {
    return [['공부 시작', c.tip]].concat(c.ex, [['취득', '자격증 발급']]);
  }
  function progressOf(c) {
    const total = stationsOf(c).length;
    const done = (store.done[c.id] || []).length;
    return { total, done };
  }

  function badge(c) {
    if (hsOK(c)) return '<span class="badge ok">고등학생 응시 가능</span>';
    if (['sanup', 'gisa', 'master'].includes(c.el)) return '<span class="badge need">학력이나 경력 필요</span>';
    return '<span class="badge need">응시 조건 있음</span>';
  }
  function meter(lv) {
    let h = `<span class="meter" role="img" aria-label="난이도 ${lv}/5, ${LV_TEXT[lv]}">`;
    for (let k = 1; k <= 5; k++) h += `<i class="${k <= lv ? 'on' : ''}"></i>`;
    return h + '</span>';
  }

  /* ───── 검색 ───── */
  function haystack(c) {
    if (!c._hay) {
      c._hay = {
        name: (c.n + ' ' + (c.g || '')).toLowerCase(),
        jobs: c.j.join(' ').toLowerCase(),
        areas: c.i.map((a) => a + ' ' + (ALIAS[a] || '')).join(' ').toLowerCase(),
        rest: (c.d + ' ' + c.tip + ' ' + c.t + ' ' + (c.o && ORGS[c.o] ? ORGS[c.o].name : '')).toLowerCase(),
      };
    }
    return c._hay;
  }
  function score(c, tokens) {
    const h = haystack(c);
    let s = 0;
    for (const t of tokens) {
      let ts = 0;
      if (h.name.includes(t)) ts += h.name.startsWith(t) ? 8 : 5;
      if (h.jobs.includes(t)) ts += 3;
      if (h.areas.includes(t)) ts += 2;
      if (h.rest.includes(t)) ts += 1;
      if (!ts) return 0;
      s += ts;
    }
    return s;
  }

  function results() {
    let list = state.view === 'saved' ? store.saved.map((id) => byId.get(id)).filter(Boolean) : CERTS.slice();
    if (state.view === 'find') {
      if (store.who === 'hs') list = list.filter(hsOK);
      if (state.area) list = list.filter((c) => c.i.includes(state.area));
    }
    const tokens = state.view === 'find' ? state.q.trim().toLowerCase().split(/\s+/).filter(Boolean) : [];
    const scores = new Map();
    if (tokens.length) {
      list = list.filter((c) => {
        const s = score(c, tokens);
        if (s) scores.set(c.id, s);
        return s > 0;
      });
    }
    const byName = (a, b) => a.n.localeCompare(b.n, 'ko');
    const sorters = {
      rec: (a, b) => (scores.get(b.id) || 0) - (scores.get(a.id) || 0)
        || (b.c ? 1 : 0) - (a.c ? 1 : 0)
        || (a.c && b.c ? CERTS.indexOf(a) - CERTS.indexOf(b) : 0)
        || (store.who === 'job' ? 0 : (hsOK(b) ? 1 : 0) - (hsOK(a) ? 1 : 0))
        || a.lv - b.lv || byName(a, b),
      easy: (a, b) => a.lv - b.lv || byName(a, b),
      hard: (a, b) => b.lv - a.lv || byName(a, b),
      name: byName,
    };
    if (!(state.view === 'saved' && store.sort === 'rec' && !tokens.length)) list.sort(sorters[store.sort] || sorters.rec);
    return list;
  }

  /* ───── 그리기: 분야 버튼 ───── */
  function renderAreas() {
    const counts = {};
    CERTS.forEach((c) => c.i.forEach((a) => (counts[a] = (counts[a] || 0) + 1)));
    let h = '';
    GROUPS.forEach((g) => {
      g.areas.forEach((a) => {
        const on = state.area === a;
        h += `<button type="button" class="area g-${g.key}${on ? ' on' : ''}" data-area="${esc(a)}" aria-pressed="${on}"><i></i>${esc(a)}<span>${counts[a] || 0}</span></button>`;
      });
    });
    $('#areas').innerHTML = h;
  }

  function renderWho() {
    document.querySelectorAll('[data-who]').forEach((b) => {
      const on = b.dataset.who === store.who;
      b.classList.toggle('on', on);
      b.setAttribute('aria-checked', on);
    });
  }

  /* ───── 그리기: 목록 ───── */
  function renderList() {
    const list = results();
    const info = $('#resultInfo');
    if (state.view === 'saved') {
      info.textContent = store.saved.length ? `담아둔 자격증 ${list.length}개` : '';
    } else {
      const bits = [];
      if (state.area) bits.push(state.area);
      if (store.who === 'hs') bits.push('고등학생 응시 가능');
      if (state.q.trim()) bits.push(`"${state.q.trim()}"`);
      info.textContent = (bits.length ? bits.join(', ') + ' 결과 ' : '전체 ') + `${list.length}개`;
    }

    const el = $('#list');
    if (!list.length) {
      if (state.view === 'saved') {
        el.innerHTML = `<li class="empty"><p>아직 담아둔 자격증이 없어요.</p><p>자격증을 열고 <b>내 루트에 담기</b>를 누르면 여기서 진행 상황을 볼 수 있어요.</p><a class="btn" href="#/">자격증 찾으러 가기</a></li>`;
      } else {
        el.innerHTML = `<li class="empty"><p>조건에 맞는 자격증이 없어요.</p><p>검색어를 줄이거나 분야 선택을 풀어보세요.</p><button type="button" class="btn" data-reset>조건 모두 지우기</button></li>`;
      }
      return;
    }

    el.innerHTML = list.map((c) => {
      const pr = progressOf(c);
      const saved = isSaved(c.id);
      const progress = saved && state.view === 'saved'
        ? `<span class="prog"><span style="width:${Math.round((pr.done / pr.total) * 100)}%"></span></span><span class="prog-text">${pr.done}/${pr.total}</span>`
        : '';
      return `<li><a class="row g-${groupOf(c)}${state.sel === c.id ? ' sel' : ''}" href="${linkTo(c.id)}" data-id="${c.id}">
        <span class="stop${saved ? ' saved' : ''}" aria-hidden="true"></span>
        <span class="row-main">
          <span class="row-name">${esc(c.n)}${c.c ? '<span class="tag-common">공통</span>' : ''}</span>
          <span class="row-meta"><span>${esc(areaOf(c))}</span><span>준비 ${esc(c.p)}</span>${badge(c)}</span>
        </span>
        <span class="row-side">${progress || meter(c.lv)}</span>
      </a></li>`;
    }).join('');
  }

  /* ───── 그리기: 상세 ───── */
  function linkTo(id) {
    return (state.view === 'saved' ? '#/saved/c/' : '#/c/') + id;
  }
  function closeLink() {
    return state.view === 'saved' ? '#/saved' : '#/';
  }
  function mini(c) {
    return `<a class="mini g-${groupOf(c)}" href="${linkTo(c.id)}"><i></i><span>${esc(c.n)}</span><small>${LV_TEXT[c.lv]}</small></a>`;
  }

  function renderDetail() {
    const box = $('#detail');
    const c = state.sel && byId.get(state.sel);
    document.body.classList.toggle('has-sel', !!c);
    if (!c) {
      const common = CERTS.filter((x) => x.c).slice(0, 6);
      box.innerHTML = `<div class="detail-empty">
        <svg class="empty-map" viewBox="0 0 240 120" aria-hidden="true">
          <path d="M20 90 H90 Q110 90 110 70 V50 Q110 30 130 30 H220" class="track"/>
          <path d="M110 70 Q110 90 130 90 H220" class="track alt"/>
          <circle cx="20" cy="90" r="7"/><circle cx="110" cy="60" r="7"/><circle cx="220" cy="30" r="7"/><circle cx="220" cy="90" r="7"/>
        </svg>
        <h2>자격증을 고르면 따는 순서가 여기에 나와요</h2>
        <p>무엇부터 볼지 모르겠다면 어느 회사든 도움 되는 공통 자격증부터 살펴보세요.</p>
        <div class="minis">${common.map(mini).join('')}</div>
      </div>`;
      return;
    }

    const org = c.o && ORGS[c.o];
    const stations = stationsOf(c);
    const done = store.done[c.id] || [];
    const prev = prevOf(c.id);
    const next = (c.nx || []).map((id) => byId.get(id)).filter(Boolean);
    const shown = new Set([c.id, ...prev.map((x) => x.id), ...next.map((x) => x.id)]);
    const same = CERTS.filter((x) => !shown.has(x.id) && x.i[0] === areaOf(c)).sort((a, b) => a.lv - b.lv).slice(0, 6);
    const saved = isSaved(c.id);

    box.innerHTML = `<article class="card g-${groupOf(c)}">
      <a class="back" href="${closeLink()}">목록으로</a>
      <p class="kicker"><i></i>${esc(c.i.join(', '))}</p>
      <h2>${esc(c.n)}</h2>
      <p class="sub">${esc(c.t)}${c.g ? ' ' + esc(c.g) + '급' : ''} 자격${org ? `, ${esc(org.name)} 시행` : ''}</p>
      <p class="desc">${esc(c.d)}</p>

      <dl class="facts">
        <div><dt>난이도</dt><dd>${meter(c.lv)} ${LV_TEXT[c.lv]}</dd></div>
        <div><dt>보통 준비 기간</dt><dd>${esc(c.p)}</dd></div>
        <div class="wide"><dt>응시자격</dt><dd>${esc(eligText(c))} ${badge(c)}</dd></div>
        <div class="wide"><dt>이런 일에 쓰여요</dt><dd>${c.j.map(esc).join(', ')}</dd></div>
      </dl>

      <div class="actions">
        <button type="button" class="btn${saved ? ' ghost' : ''}" data-save="${c.id}">${saved ? '내 루트에서 빼기' : '내 루트에 담기'}</button>
        ${org ? `<a class="btn ghost" href="${esc(org.url)}" target="_blank" rel="noopener">시행처에서 일정 확인</a>` : ''}
      </div>

      <section class="route-wrap">
        <h3>따는 순서</h3>
        <p class="hint">${saved ? '끝낸 단계를 눌러 표시하세요.' : '내 루트에 담으면 단계마다 완료 표시를 할 수 있어요.'}</p>
        ${prev.length ? `<div class="branch before"><span class="branch-label">먼저 따두면 좋아요</span><div class="minis">${prev.map(mini).join('')}</div></div>` : ''}
        <ol class="route">
          ${stations.map((s, k) => {
            const isDone = done.includes(k);
            return `<li class="${isDone ? 'done' : ''}${k === 0 ? ' first' : ''}${k === stations.length - 1 ? ' last' : ''}">
              <button type="button" class="station" data-station="${k}" ${saved ? '' : 'disabled'} aria-pressed="${isDone}">
                <span class="dot" aria-hidden="true"></span>
                <span class="st-name">${esc(s[0])}</span>
              </button>
              <p class="st-text">${esc(s[1])}</p>
            </li>`;
          }).join('')}
        </ol>
        ${next.length ? `<div class="branch after"><span class="branch-label">다음 환승</span><div class="minis">${next.map(mini).join('')}</div></div>` : ''}
      </section>

      ${same.length ? `<section class="more"><h3>${esc(areaOf(c))} 분야의 다른 자격증</h3><div class="minis">${same.map(mini).join('')}</div></section>` : ''}
    </article>`;
  }

  function renderView() {
    const saved = state.view === 'saved';
    $('#intro').hidden = saved;
    $('#savedHead').hidden = !saved;
    document.querySelectorAll('.tabs a').forEach((a) => a.classList.toggle('on', a.dataset.view === state.view));
    $('#savedCount').textContent = store.saved.length || '';
    $('#sort').value = store.sort;
  }

  function renderAll() {
    renderView();
    renderWho();
    renderAreas();
    renderList();
    renderDetail();
  }

  /* ───── 주소 ───── */
  function route() {
    const h = location.hash.replace(/^#\/?/, '');
    const parts = h.split('/').filter(Boolean);
    state.view = parts[0] === 'saved' ? 'saved' : 'find';
    const ci = parts.indexOf('c');
    const id = ci >= 0 ? decodeURIComponent(parts[ci + 1] || '') : null;
    state.sel = id && byId.has(id) ? id : null;
    renderView();
    renderList();
    renderDetail();
    if (state.sel) {
      const d = $('#detail');
      if (window.matchMedia('(max-width: 899px)').matches) d.scrollTop = 0;
      else d.scrollTo({ top: 0 });
      const h2 = d.querySelector('h2');
      if (h2) { h2.setAttribute('tabindex', '-1'); h2.focus({ preventScroll: true }); }
    }
  }

  /* ───── 이벤트 ───── */
  let t;
  $('#q').addEventListener('input', (e) => {
    clearTimeout(t);
    t = setTimeout(() => { state.q = e.target.value; renderList(); }, 120);
  });

  document.addEventListener('click', (e) => {
    if (e.target.closest('#moreAreas')) {
      const box = $('#areas');
      const open = box.classList.toggle('open');
      e.target.closest('#moreAreas').textContent = open ? '분야 접기' : '분야 전체 보기';
      e.target.closest('#moreAreas').setAttribute('aria-expanded', open);
      return;
    }
    const area = e.target.closest('[data-area]');
    if (area) {
      state.area = state.area === area.dataset.area ? null : area.dataset.area;
      renderAreas();
      renderList();
      return;
    }
    const who = e.target.closest('[data-who]');
    if (who) {
      store.who = who.dataset.who;
      persist();
      renderWho();
      renderList();
      return;
    }
    if (e.target.closest('[data-reset]')) {
      state.q = '';
      state.area = null;
      store.who = 'all';
      $('#q').value = '';
      persist();
      renderAll();
      return;
    }
    const save = e.target.closest('[data-save]');
    if (save) {
      const id = save.dataset.save;
      if (isSaved(id)) {
        store.saved = store.saved.filter((x) => x !== id);
      } else {
        store.saved.push(id);
      }
      persist();
      renderView();
      renderList();
      renderDetail();
      const again = document.querySelector('[data-save]');
      if (again) again.focus();
      return;
    }
    const st = e.target.closest('[data-station]');
    if (st && state.sel) {
      const k = Number(st.dataset.station);
      const arr = store.done[state.sel] || [];
      store.done[state.sel] = arr.includes(k) ? arr.filter((x) => x !== k) : arr.concat(k);
      persist();
      renderList();
      renderDetail();
      const again = document.querySelector(`[data-station="${k}"]`);
      if (again) again.focus();
    }
  });

  $('#sort').addEventListener('change', (e) => {
    store.sort = e.target.value;
    persist();
    renderList();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.sel) location.hash = closeLink();
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && state.view === 'find') {
      e.preventDefault();
      $('#q').focus();
    }
  });

  window.addEventListener('hashchange', route);
  renderAll();
  route();
})();
