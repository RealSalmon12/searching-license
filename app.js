(function () {
  'use strict';

  const CERTS = window.CERTS;
  const ORGS = window.ORGS;
  const ELIG = window.ELIG;
  const byId = new Map(CERTS.map((c) => [c.id, c]));

  /* ───────── 분야와 노선 색 ───────── */
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

  /* 질문에서 고르는 관심 분야 (쉬운 말로 묶음) */
  const FIELDS = [
    { key: 'it', icon: '💻', label: '컴퓨터·IT', ex: '개발, 데이터, 보안', areas: ['컴퓨터·개발', '데이터·AI', '보안·네트워크'] },
    { key: 'office', icon: '📊', label: '사무·회계', ex: '엑셀, 경리, 세무', areas: ['사무·문서', '회계·세무'] },
    { key: 'biz', icon: '💰', label: '금융·경영', ex: '은행, 증권, 마케팅', areas: ['금융', '경영·마케팅'] },
    { key: 'global', icon: '🌏', label: '외국어·무역·관광', ex: '영어, 무역, 호텔', areas: ['외국어', '무역', '관광·서비스'] },
    { key: 'design', icon: '🎨', label: '디자인·영상', ex: '포토샵, 웹디자인, 패션', areas: ['디자인', '영상·사진', '패션'] },
    { key: 'elec', icon: '⚡', label: '전기·전자', ex: '전기, 반도체, 태양광', areas: ['전기', '전자·반도체', '에너지·가스'] },
    { key: 'mech', icon: '🔧', label: '기계·자동차', ex: '가공, 용접, 정비', areas: ['기계', '자동차'] },
    { key: 'build', icon: '🏗️', label: '건축·인테리어', ex: '건축, 인테리어, 토목', areas: ['건축·인테리어', '토목·측량'] },
    { key: 'safety', icon: '🦺', label: '안전·환경·화학', ex: '안전관리, 소방, 화학', areas: ['안전·소방', '화학·환경'] },
    { key: 'cook', icon: '🍳', label: '요리·제과', ex: '한식, 제빵, 바리스타', areas: ['조리·제과'] },
    { key: 'beauty', icon: '💇', label: '미용', ex: '헤어, 네일, 메이크업', areas: ['미용'] },
    { key: 'care', icon: '🏥', label: '보건·복지·교육', ex: '간호조무사, 사회복지', areas: ['보건·의료', '복지·상담', '교육·보육'] },
    { key: 'logi', icon: '🚚', label: '유통·물류', ex: '물류센터, 지게차, MD', areas: ['유통·물류'] },
    { key: 'nature', icon: '🌱', label: '농업·조경', ex: '조경, 꽃, 귀농', areas: ['농림·조경'] },
    { key: 'sports', icon: '⚽', label: '스포츠', ex: '트레이너, 스포츠 마케팅', areas: ['스포츠'] },
  ];

  const WHO = [
    { key: 'hs', label: '고등학생', sub: '일반고에 다니고 있어요' },
    { key: 'voc', label: '특성화고·마이스터고 학생', sub: '전공 과목을 배우고 있어요' },
    { key: 'uni', label: '대학생', sub: '전문대나 4년제에 다니고 있어요' },
    { key: 'grad', label: '졸업한 취준생', sub: '학교를 마치고 취업을 준비해요' },
  ];
  const GOALS = [
    { key: 'job', label: '빨리 취업하고 싶어요', sub: '바로 써먹을 수 있는 자격증 위주로' },
    { key: 'public', label: '공기업이나 공무원', sub: '가산점과 응시요건 위주로' },
    { key: 'spec', label: '진학이나 스펙 쌓기', sub: '생활기록부, 이력서에 쓰기 좋은 것 위주로' },
    { key: 'unsure', label: '아직 잘 모르겠어요', sub: '어디든 쓸모 있는 기본기부터' },
  ];

  /* 고등학생 때 따기 좋은 자격증 */
  const HS_PICKS = [
    ['comp2', '엑셀은 어느 회사든 써요. 고등학생이 가장 많이 따는 자격증이에요.'],
    ['itq', '매달 시험이 있고 하루 공부로도 붙을 수 있어서 첫 자격증으로 좋아요.'],
    ['hist_adv', '공무원, 공기업, 군 간부 시험에서 쓰여요. 학교에서 배운 한국사로 준비할 수 있어요.'],
    ['gtq', '포토샵을 할 줄 안다는 증명이에요. 디자인, 영상 쪽에 관심 있다면 먼저 따세요.'],
    ['jcg', '개발자에 관심 있다면 고등학생이 딸 수 있는 대표 IT 국가자격이에요.'],
    ['kor_cook', '요리에 관심 있다면 첫걸음이에요. 실기 메뉴가 정해져 있어 연습하면 붙어요.'],
    ['elec_f', '전기 분야의 출발점이에요. 특성화고 학생들이 취업용으로 많이 따요.'],
    ['drive1', '고3 생일이 지나면 딸 수 있어요. 수능 끝나고 가장 많이 따는 자격이에요.'],
  ];

  /* 목표별 추천 루트 */
  const TRACKS = [
    { title: '어디든 쓸모 있는 기본기', sub: '진로를 아직 못 정했다면 이 순서로', ids: ['itq', 'comp2', 'hist_adv', 'comp1'] },
    { title: '개발자', sub: '코딩 입문부터 IT 대표 자격증까지', ids: ['cospro', 'jcg', 'sqld', 'jcgisa'] },
    { title: '데이터 분석', sub: '엑셀에서 시작해 데이터 국가자격까지', ids: ['comp1', 'adsp', 'sqld', 'bigdata'] },
    { title: '사무·회계', sub: '경리, 회계 사무직 취업 루트', ids: ['comp2', 'comacc2', 'comacc1', 'comtax2'] },
    { title: '공기업 준비', sub: '가산점과 응시요건을 먼저 챙기기', ids: ['hist_adv', 'comp1', 'toeic', 'adsp'] },
    { title: '전기·시설관리', sub: '취업이 잘 되는 기술직 루트', ids: ['elec_f', 'fire_mgr2', 'elec_s', 'elec_g'] },
    { title: '디자인', sub: '디자인 프로그램부터 웹디자인까지', ids: ['gtq', 'gtqi', 'web', 'vdsg'] },
    { title: '요리·제과', sub: '조리사 기본 자격부터 차근차근', ids: ['kor_cook', 'west_cook', 'bake_b', 'cook_s'] },
  ];

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

  /* ───────── 저장 ───────── */
  const KEY = 'searching-license:v1';
  const DEFAULTS = { saved: [], done: {}, who: 'all', sort: 'rec', plan: null };
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return Object.assign({}, DEFAULTS, JSON.parse(raw));
    } catch (e) { /* 저장소를 못 쓰면 기본값 */ }
    return Object.assign({}, DEFAULTS);
  }
  const store = load();
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* 무시 */ }
  }

  /* ───────── 상태 ───────── */
  const state = {
    view: 'home', sel: null, q: '', area: null, areasOpen: false,
    quiz: { step: 0, who: null, fields: [], goal: null },
  };

  /* ───────── 도우미 ───────── */
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const areaOf = (c) => c.i[0];
  const groupOf = (c) => AREA_GROUP[areaOf(c)] || 'it';
  const hsOK = (c) => (c.hs !== undefined ? c.hs : c.el === 'free');
  const eligText = (c) => ELIG[c.el] || c.el;
  const isSaved = (id) => store.saved.includes(id);
  const prevOf = (id) => CERTS.filter((c) => (c.nx || []).includes(id));
  const needsDegree = (c) => /학과|학위|학사|졸업|학점|교과목/.test(eligText(c));

  function canTakeNow(c, who) {
    if (who === 'hs' || who === 'voc') return hsOK(c);
    if (c.el === 'master') return false;
    if (who === 'uni') return true;
    // 졸업한 취준생: 학력·경력 요건이 있는 건 지금 바로는 어렵다고 봐요
    if (['sanup', 'gisa'].includes(c.el)) return false;
    return hsOK(c) || !needsDegree(c);
  }

  function base() { return state.view === 'home' ? '#/' : `#/${state.view}/`; }
  function linkTo(id) { return `${base()}c/${id}`; }

  function stationsOf(c) {
    return [['공부 시작', c.tip]].concat(c.ex, [['취득', '자격증 발급']]);
  }
  function progressOf(c) {
    return { total: stationsOf(c).length, done: (store.done[c.id] || []).length };
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
  function mini(c) {
    return `<a class="mini g-${groupOf(c)}" href="${linkTo(c.id)}"><i></i><span>${esc(c.n)}</span><small>${LV_TEXT[c.lv]}</small></a>`;
  }

  /* 가로 노선도 (홈의 추천 루트) */
  function line(ids) {
    const cs = ids.map((id) => byId.get(id)).filter(Boolean);
    return `<ol class="line">${cs.map((c) => `<li class="g-${groupOf(c)}">
      <a href="${linkTo(c.id)}"><span class="ln-dot" aria-hidden="true"></span><span class="ln-name">${esc(c.n)}</span><span class="ln-meta">${LV_TEXT[c.lv]}, ${esc(c.p)}</span></a>
    </li>`).join('')}</ol>`;
  }

  /* ───────── 홈 ───────── */
  function renderHome() {
    const planBtn = store.plan
      ? `<a class="btn ghost big" href="#/plan">지난번에 만든 내 루트 다시 보기</a>`
      : `<a class="btn ghost big" href="#/all">전체 자격증 둘러보기</a>`;
    return `
    <section class="hero wrap">
      <div class="hero-text">
        <h1>자격증, 뭐부터 따야 할지 모르겠다면</h1>
        <p class="lede">지금 상황, 관심 분야, 목표. 질문 3개에 답하면 지금 바로 딸 수 있는 것부터 나중에 도전할 것까지 순서대로 정리해 드려요.</p>
        <div class="hero-actions">
          <a class="btn big" href="#/start">질문 3개로 내 루트 만들기</a>
          ${planBtn}
        </div>
        <p class="hero-note">1분이면 끝나요. 회원가입 없이 이 브라우저에만 저장돼요.</p>
      </div>
      <div class="hero-sample">
        <p class="sample-label">예를 들면, 진로를 아직 못 정한 고등학생의 루트</p>
        ${vroute(TRACKS[0].ids, ['방학 하루', '1~2달', '1~2달', '고3이나 졸업 후'])}
      </div>
    </section>

    <section class="band">
      <div class="wrap">
        <h2 class="sec-title">고등학생 때 따두면 좋은 자격증</h2>
        <p class="sec-sub">모두 나이나 학력 제한 없이 바로 응시할 수 있어요.</p>
        <ul class="picks">
          ${HS_PICKS.map(([id, why]) => {
            const c = byId.get(id);
            return `<li><a class="pick g-${groupOf(c)}" href="${linkTo(id)}">
              <span class="pick-head"><span class="stop" aria-hidden="true"></span><span class="pick-name">${esc(c.n)}</span></span>
              <span class="pick-why">${esc(why)}</span>
              <span class="pick-meta">${meter(c.lv)}<span>${LV_TEXT[c.lv]}</span><span>준비 ${esc(c.p)}</span></span>
            </a></li>`;
          }).join('')}
        </ul>
      </div>
    </section>

    <section class="wrap sec">
      <h2 class="sec-title">목표별 추천 루트</h2>
      <p class="sec-sub">왼쪽부터 차례대로 따면 돼요. 역을 누르면 자세한 내용이 나와요.</p>
      <div class="tracks">
        ${TRACKS.slice(1).map((t) => `<div class="track">
          <div class="track-head"><h3>${esc(t.title)}</h3><p>${esc(t.sub)}</p></div>
          ${line(t.ids)}
        </div>`).join('')}
      </div>
      <p class="more-link"><a href="#/start">내 상황에 맞춰 루트 만들기</a> 또는 <a href="#/all">전체 ${CERTS.length}개 자격증 보기</a></p>
    </section>

    <section class="band">
      <div class="wrap">
        <h2 class="sec-title">자격증이 처음이라면 알아둘 것</h2>
        <div class="guide">
          <article>
            <h3>자격증에도 종류가 있어요</h3>
            <dl class="kinds">
              <div><dt>국가기술자격</dt><dd>나라가 만들고 관리해요. 큐넷(q-net.or.kr)에서 접수하는 기능사, 기사가 여기에 속하고 가장 널리 인정받아요.</dd></div>
              <div><dt>국가공인 민간자격</dt><dd>협회나 기관이 만들고 나라가 인정한 자격이에요. ITQ, 전산회계, ADsP 같은 것들이에요.</dd></div>
              <div><dt>민간자격</dt><dd>회사나 협회가 만든 자격이에요. 분야에 따라 쓸모가 크게 달라서 꼭 필요한지 확인하세요.</dd></div>
            </dl>
          </article>
          <article>
            <h3>기술 자격증은 사다리처럼 올라가요</h3>
            <ol class="ladder">
              <li><b>기능사</b><span>누구나 응시. 고등학생은 여기서 시작해요.</span></li>
              <li><b>산업기사</b><span>전문대 졸업, 또는 기능사 따고 실무 1년</span></li>
              <li><b>기사</b><span>4년제 졸업, 또는 산업기사 따고 실무 1년</span></li>
              <li><b>기능장, 기술사</b><span>현장 경력이 많이 쌓인 뒤</span></li>
            </ol>
          </article>
          <article>
            <h3>시험은 보통 필기 다음 실기예요</h3>
            <p>필기는 객관식이고 기출문제를 반복해서 풀면 붙는 경우가 많아요. 필기에 붙으면 2년 동안 실기를 볼 수 있어요. 실기는 직접 만들거나 써보는 시험이라 연습 시간이 더 필요해요.</p>
            <p>필기 합격 기준은 대부분 100점 만점에 60점이에요.</p>
          </article>
          <article>
            <h3>접수는 이렇게 해요</h3>
            <ol class="steps">
              <li>시행처 사이트에 회원가입하고 사진을 등록해요.</li>
              <li>접수 기간을 확인해요. 인기 시험은 접수 첫날 자리가 금방 차요.</li>
              <li>시험 장소와 날짜를 고르고 응시료를 결제해요.</li>
              <li>시험 날 신분증을 챙겨가요. 고등학생은 학생증이나 청소년증도 돼요.</li>
            </ol>
            <p class="tip">학교에서 단체 접수나 응시료 지원을 해주기도 해요. 담임선생님께 먼저 물어보세요.</p>
          </article>
        </div>
      </div>
    </section>

    <section class="wrap sec end-cta">
      <h2>이제 내 루트를 만들어 볼까요?</h2>
      <a class="btn big" href="#/start">질문 3개로 시작하기</a>
    </section>`;
  }

  /* 세로 노선도 (홈 예시와 내 루트 결과) */
  function vroute(ids, notes) {
    return `<ol class="vroute">${ids.map((id, k) => {
      const c = byId.get(id);
      return `<li class="g-${groupOf(c)}"><a href="${linkTo(id)}">
        <span class="vr-dot" aria-hidden="true"></span>
        <span class="vr-body"><span class="vr-name">${esc(c.n)}</span><span class="vr-note">${esc(notes ? notes[k] : c.p)}</span></span>
      </a></li>`;
    }).join('')}</ol>`;
  }

  /* ───────── 질문 ───────── */
  function renderStart() {
    const q = state.quiz;
    const dots = [0, 1, 2].map((k) => `<span class="${k <= q.step ? 'on' : ''}"></span>`).join('');
    let body = '';
    if (q.step === 0) {
      body = `<h1 class="q-title">지금 어떤 상황이에요?</h1>
        <p class="lede">상황에 따라 지금 응시할 수 있는 자격증이 달라요.</p>
        <div class="choices">${WHO.map((w) => `<button type="button" class="choice${q.who === w.key ? ' on' : ''}" data-q-who="${w.key}"><b>${esc(w.label)}</b><span>${esc(w.sub)}</span></button>`).join('')}</div>`;
    } else if (q.step === 1) {
      body = `<h1 class="q-title">어떤 분야에 관심이 있어요?</h1>
        <p class="lede">여러 개 골라도 돼요. 잘 모르겠으면 그냥 다음으로 넘어가세요.</p>
        <div class="fields">${FIELDS.map((f) => {
          const on = q.fields.includes(f.key);
          return `<button type="button" class="field${on ? ' on' : ''}" data-q-field="${f.key}" aria-pressed="${on}"><span class="f-icon" aria-hidden="true">${f.icon}</span><b>${esc(f.label)}</b><span>${esc(f.ex)}</span></button>`;
        }).join('')}</div>
        <div class="q-nav"><button type="button" class="btn ghost" data-q-back>이전</button><button type="button" class="btn" data-q-next>${q.fields.length ? `${q.fields.length}개 골랐어요, 다음` : '잘 모르겠어요, 다음'}</button></div>`;
    } else {
      body = `<h1 class="q-title">자격증으로 뭘 하고 싶어요?</h1>
        <p class="lede">목표에 따라 먼저 챙길 자격증이 달라져요.</p>
        <div class="choices">${GOALS.map((g) => `<button type="button" class="choice${q.goal === g.key ? ' on' : ''}" data-q-goal="${g.key}"><b>${esc(g.label)}</b><span>${esc(g.sub)}</span></button>`).join('')}</div>
        <div class="q-nav"><button type="button" class="btn ghost" data-q-back>이전</button></div>`;
    }
    return `<section class="quiz wrap-narrow">
      <div class="q-progress"><span class="q-count">${q.step + 1} / 3</span><span class="q-dots">${dots}</span></div>
      ${body}
    </section>`;
  }

  /* ───────── 루트 만들기 ───────── */
  function buildPlan(p) {
    const now = (c) => canTakeNow(c, p.who);
    const young = p.who === 'hs' || p.who === 'voc';
    const areas = [];
    p.fields.forEach((k) => { const f = FIELDS.find((x) => x.key === k); if (f) areas.push(...f.areas); });

    // 목표별 기본 자격증
    let basics;
    if (p.goal === 'public') basics = young ? ['hist_adv', 'comp2', 'comp1', 'toeic'] : ['hist_adv', 'comp1', 'toeic', 'adsp'];
    else if (p.goal === 'spec') basics = young ? ['itq', 'hist_adv', 'comp2', 'toeic'] : ['toeic', 'comp1', 'hist_adv', 'opic'];
    else if (p.goal === 'job') basics = p.who === 'hs' ? ['comp2', 'comp1'] : p.who === 'voc' ? ['comp2', 'drive1'] : ['comp1', 'drive1', 'toeic'];
    else basics = young ? ['itq', 'comp2', 'hist_adv', 'comp1'] : ['comp1', 'hist_adv', 'toeic'];
    if (p.who === 'voc' && p.goal !== 'public') basics = basics.filter((id) => id !== 'hist_adv' && id !== 'toeic');
    basics = basics.map((id) => byId.get(id));

    // 관심 분야 자격증, 고른 분야마다 골고루
    const used = new Set(basics.map((c) => c.id));
    const rank = (c) => c.lv + (c.t === '민간' ? 1.5 : c.t === '국가기술' ? 0 : 0.3) + (young && c.t === '민간' ? 1 : 0);
    const pools = p.fields.map((k) => FIELDS.find((x) => x.key === k)).filter(Boolean).map((f) => {
      const main = CERTS.filter((c) => f.areas.includes(c.i[0]));
      const side = CERTS.filter((c) => !f.areas.includes(c.i[0]) && c.i.some((a) => f.areas.includes(a)));
      return main.sort((x, y) => rank(x) - rank(y)).concat(side.sort((x, y) => rank(x) - rank(y)));
    });
    function take(filter, max) {
      const out = [];
      let added = true;
      while (out.length < max && added) {
        added = false;
        for (const pool of pools) {
          const c = pool.find((x) => !used.has(x.id) && !x.c && filter(x));
          if (c && out.length < max) { out.push(c); used.add(c.id); added = true; }
        }
      }
      return out;
    }
    const n = Math.max(1, pools.length);
    const fieldMax = Math.min(4, n * (p.who === 'voc' || p.goal === 'job' ? 2 : 1) + (n === 1 ? 1 : 0));
    const easy = take((c) => now(c) && c.lv <= 2, fieldMax);
    const uni = p.who === 'uni';
    const mid = take((c) => now(c) && c.lv >= 3 && c.lv <= 4 && !(uni && c.el === 'gisa') && (!young || c.t !== '민간'), Math.min(5, n * 3));
    const later = uni ? take((c) => c.el === 'gisa', Math.min(4, n * 2)) : take((c) => !now(c) && ['sanup', 'gisa'].includes(c.el), Math.min(4, n * 2));

    const s1 = basics.filter((c) => c.lv <= 2).concat(easy);
    const s2 = basics.filter((c) => c.lv >= 3).concat(mid);
    return { areas, stages: [
      { title: '지금 바로 시작', sub: young ? '방학이나 시험 끝난 뒤에 하나씩 따보세요.' : '한두 달이면 딸 수 있는 것들이에요.', items: s1 },
      { title: '익숙해지면 도전', sub: '첫 자격증을 딴 뒤 조금 더 어려운 것에 도전해요.', items: s2 },
      { title: young ? '졸업한 뒤에' : uni ? '졸업 즈음에' : '경력이나 학력을 갖추면', sub: uni ? '관련 학과 4학년(졸업 예정)부터 응시할 수 있는 기사 자격이에요.' : '지금은 응시자격이 안 되지만 목표로 두면 좋은 것들이에요.', items: later },
    ].filter((s) => s.items.length) };
  }

  function reasonFor(c, p) {
    const bits = [];
    if (c.c) bits.push('어느 분야든 쓸모 있는 공통 자격증');
    if (canTakeNow(c, p.who)) bits.push(c.el === 'free' ? '누구나 응시 가능' : '지금 응시 가능');
    else bits.push(`응시자격: ${eligText(c)}`);
    return bits.join('. ');
  }

  function renderPlan() {
    const p = store.plan;
    if (!p) return `<section class="wrap-narrow sec empty-page"><h1>아직 만든 루트가 없어요</h1><p class="lede">질문 3개에 답하면 나에게 맞는 자격증 순서를 만들어 드려요.</p><a class="btn big" href="#/start">질문 3개로 시작하기</a></section>`;
    const plan = buildPlan(p);
    const who = WHO.find((w) => w.key === p.who);
    const goal = GOALS.find((g) => g.key === p.goal);
    const fields = p.fields.map((k) => FIELDS.find((f) => f.key === k)).filter(Boolean);
    const all = plan.stages.flatMap((s) => s.items.map((c) => c.id));
    const allSaved = all.every(isSaved);
    return `<section class="plan wrap-narrow">
      <p class="plan-for">${esc(who ? who.label : '')}, ${fields.length ? esc(fields.map((f) => f.label).join(', ')) + ' 관심' : '관심 분야 미정'}, ${esc(goal ? goal.label : '')}</p>
      <h1>내 자격증 루트</h1>
      <p class="lede">위에서부터 차례대로 따면 돼요. 자격증을 누르면 시험 방법과 공부 팁이 나와요.</p>
      <div class="plan-actions">
        <button type="button" class="btn" data-save-plan ${allSaved ? 'disabled' : ''}>${allSaved ? '모두 내 루트에 담았어요' : `${all.length}개 모두 내 루트에 담기`}</button>
        <a class="btn ghost" href="#/start" data-restart>답 바꾸기</a>
      </div>
      ${!fields.length ? '<p class="notice">관심 분야를 고르면 분야별 자격증도 함께 추천해 드려요. <a href="#/start" data-restart>분야 고르러 가기</a></p>' : ''}
      <ol class="stages">
        ${plan.stages.map((s) => `<li class="stage">
          <div class="stage-head"><span class="stage-dot" aria-hidden="true"></span><h2>${esc(s.title)}</h2><p>${esc(s.sub)}</p></div>
          <ul class="stage-items">
            ${s.items.map((c) => `<li><a class="item g-${groupOf(c)}" href="${linkTo(c.id)}">
              <span class="item-top"><span class="stop${isSaved(c.id) ? ' saved' : ''}" aria-hidden="true"></span><span class="item-name">${esc(c.n)}</span><span class="item-lv">${meter(c.lv)} ${LV_TEXT[c.lv]}</span></span>
              <span class="item-desc">${esc(c.d)}</span>
              <span class="item-meta"><span>준비 ${esc(c.p)}</span><span>${esc(reasonFor(c, p))}</span></span>
            </a></li>`).join('')}
          </ul>
        </li>`).join('')}
      </ol>
    </section>`;
  }

  /* ───────── 전체 자격증 ───────── */
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
    if (state.view === 'saved') return list;
    if (store.who === 'hs') list = list.filter(hsOK);
    if (state.area) list = list.filter((c) => c.i.includes(state.area));
    const tokens = state.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const scores = new Map();
    if (tokens.length) {
      list = list.filter((c) => { const s = score(c, tokens); if (s) scores.set(c.id, s); return s > 0; });
    }
    const byName = (a, b) => a.n.localeCompare(b.n, 'ko');
    const sorters = {
      rec: (a, b) => (scores.get(b.id) || 0) - (scores.get(a.id) || 0)
        || (b.c ? 1 : 0) - (a.c ? 1 : 0)
        || (a.c && b.c ? CERTS.indexOf(a) - CERTS.indexOf(b) : 0)
        || (hsOK(b) ? 1 : 0) - (hsOK(a) ? 1 : 0)
        || a.lv - b.lv || byName(a, b),
      easy: (a, b) => a.lv - b.lv || byName(a, b),
      hard: (a, b) => b.lv - a.lv || byName(a, b),
      name: byName,
    };
    return list.sort(sorters[store.sort] || sorters.rec);
  }

  function renderAll() {
    return `<section class="browse wrap-mid">
      <h1>전체 자격증</h1>
      <p class="lede">직무나 자격증 이름으로 찾거나 분야를 골라보세요. 뭘 찾아야 할지 모르겠다면 <a href="#/start">질문 3개로 추천받기</a>를 먼저 해보세요.</p>
      <label class="search">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>
        <input id="q" type="search" placeholder="예: 개발자, 요리, 은행" autocomplete="off" value="${esc(state.q)}">
      </label>
      <div class="who" role="radiogroup" aria-label="보기">
        ${[['all', '전체'], ['hs', '고등학생도 응시 가능한 것만']].map(([k, l]) => `<button type="button" role="radio" class="${store.who === k ? 'on' : ''}" aria-checked="${store.who === k}" data-who="${k}">${l}</button>`).join('')}
      </div>
      <div class="areas${state.areasOpen ? ' open' : ''}" id="areas"></div>
      <button type="button" class="more-areas" id="moreAreas" aria-expanded="${state.areasOpen}">${state.areasOpen ? '분야 접기' : '분야 전체 보기'}</button>
      <div class="list-bar">
        <p id="resultInfo" aria-live="polite"></p>
        <label class="sort">정렬
          <select id="sort">
            ${[['rec', '추천순'], ['easy', '쉬운 순'], ['hard', '어려운 순'], ['name', '이름순']].map(([k, l]) => `<option value="${k}"${store.sort === k ? ' selected' : ''}>${l}</option>`).join('')}
          </select>
        </label>
      </div>
      <ol class="list" id="list"></ol>
    </section>`;
  }

  function renderSaved() {
    return `<section class="browse wrap-mid">
      <h1>내 루트</h1>
      <p class="lede">담아둔 자격증과 진행 상황이에요. 자격증을 열고 끝낸 단계를 누르면 완료 표시가 돼요.</p>
      <p id="resultInfo" class="list-bar"></p>
      <ol class="list" id="list"></ol>
    </section>`;
  }

  function renderAreas() {
    const box = $('#areas');
    if (!box) return;
    const counts = {};
    CERTS.forEach((c) => c.i.forEach((a) => (counts[a] = (counts[a] || 0) + 1)));
    box.innerHTML = GROUPS.map((g) => g.areas.map((a) => {
      const on = state.area === a;
      return `<button type="button" class="area g-${g.key}${on ? ' on' : ''}" data-area="${esc(a)}" aria-pressed="${on}"><i></i>${esc(a)}<span>${counts[a] || 0}</span></button>`;
    }).join('')).join('');
  }

  function renderList() {
    const el = $('#list');
    if (!el) return;
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
    if (!list.length) {
      el.innerHTML = state.view === 'saved'
        ? `<li class="empty"><p>아직 담아둔 자격증이 없어요.</p><p>질문 3개로 루트를 만들거나, 자격증을 열고 <b>내 루트에 담기</b>를 누르세요.</p><a class="btn" href="#/start">질문 3개로 루트 만들기</a></li>`
        : `<li class="empty"><p>조건에 맞는 자격증이 없어요.</p><p>검색어를 줄이거나 분야 선택을 풀어보세요.</p><button type="button" class="btn" data-reset>조건 모두 지우기</button></li>`;
      return;
    }
    el.innerHTML = list.map((c) => {
      const saved = isSaved(c.id);
      const pr = progressOf(c);
      const side = state.view === 'saved'
        ? `<span class="prog"><span style="width:${Math.round((pr.done / pr.total) * 100)}%"></span></span><span class="prog-text">${pr.done}/${pr.total}</span>`
        : meter(c.lv);
      return `<li><a class="row g-${groupOf(c)}${state.sel === c.id ? ' sel' : ''}" href="${linkTo(c.id)}">
        <span class="stop${saved ? ' saved' : ''}" aria-hidden="true"></span>
        <span class="row-main">
          <span class="row-name">${esc(c.n)}${c.c ? '<span class="tag-common">공통</span>' : ''}</span>
          <span class="row-meta"><span>${esc(areaOf(c))}</span><span>준비 ${esc(c.p)}</span>${badge(c)}</span>
        </span>
        <span class="row-side">${side}</span>
      </a></li>`;
    }).join('');
  }

  /* ───────── 자세히 보기 (서랍) ───────── */
  function renderDrawer() {
    const box = $('#drawer');
    const c = state.sel && byId.get(state.sel);
    const open = !!c;
    document.body.classList.toggle('has-sel', open);
    box.hidden = !open;
    $('#scrim').hidden = !open;
    if (!c) { box.innerHTML = ''; return; }

    const org = c.o && ORGS[c.o];
    const stations = stationsOf(c);
    const done = store.done[c.id] || [];
    const prev = prevOf(c.id);
    const next = (c.nx || []).map((id) => byId.get(id)).filter(Boolean);
    const shown = new Set([c.id, ...prev.map((x) => x.id), ...next.map((x) => x.id)]);
    const same = CERTS.filter((x) => !shown.has(x.id) && x.i[0] === areaOf(c)).sort((a, b) => a.lv - b.lv).slice(0, 6);
    const saved = isSaved(c.id);

    box.innerHTML = `<article class="card g-${groupOf(c)}">
      <div class="card-bar"><a class="close" href="${base()}" aria-label="닫기">닫기</a></div>
      <p class="kicker"><i></i>${esc(c.i.join(', '))}</p>
      <h2 tabindex="-1">${esc(c.n)}</h2>
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
        ${prev.length ? `<div class="branch"><span class="branch-label">먼저 따두면 좋아요</span><div class="minis">${prev.map(mini).join('')}</div></div>` : ''}
        <ol class="route">
          ${stations.map((s, k) => `<li class="${done.includes(k) ? 'done' : ''}${k === 0 ? ' first' : ''}${k === stations.length - 1 ? ' last' : ''}">
            <button type="button" class="station" data-station="${k}" ${saved ? '' : 'disabled'} aria-pressed="${done.includes(k)}">
              <span class="dot" aria-hidden="true"></span><span class="st-name">${esc(s[0])}</span>
            </button>
            <p class="st-text">${esc(s[1])}</p>
          </li>`).join('')}
        </ol>
        ${next.length ? `<div class="branch after"><span class="branch-label">다음 환승</span><div class="minis">${next.map(mini).join('')}</div></div>` : ''}
      </section>
      ${same.length ? `<section class="more"><h3>${esc(areaOf(c))} 분야의 다른 자격증</h3><div class="minis">${same.map(mini).join('')}</div></section>` : ''}
    </article>`;
  }

  /* ───────── 화면 전환 ───────── */
  let lastView = null;
  function renderView() {
    const v = state.view;
    const html = v === 'start' ? renderStart() : v === 'plan' ? renderPlan() : v === 'all' ? renderAll() : v === 'saved' ? renderSaved() : renderHome();
    $('#app').innerHTML = html;
    renderAreas();
    renderList();
    document.querySelectorAll('.tabs a').forEach((a) => {
      const on = a.dataset.view === v || (a.dataset.view === 'home' && (v === 'start' || v === 'plan'));
      a.classList.toggle('on', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    $('#savedCount').textContent = store.saved.length || '';
  }

  function route() {
    const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    let view = 'home';
    if (['start', 'plan', 'all', 'saved'].includes(parts[0])) view = parts[0];
    const ci = parts.indexOf('c');
    const id = ci >= 0 ? decodeURIComponent(parts[ci + 1] || '') : null;
    const prevSel = state.sel;
    state.sel = id && byId.has(id) ? id : null;
    if (view !== lastView) {
      state.view = view;
      renderView();
      if (!state.sel) window.scrollTo(0, 0);
      lastView = view;
    } else {
      renderList();
    }
    renderDrawer();
    if (state.sel && state.sel !== prevSel) {
      const d = $('#drawer');
      d.scrollTop = 0;
      const h2 = d.querySelector('h2');
      if (h2) h2.focus({ preventScroll: true });
    }
  }

  function rerender() {
    const y = window.scrollY;
    renderView();
    renderDrawer();
    window.scrollTo(0, y);
  }

  /* ───────── 이벤트 ───────── */
  let timer;
  document.addEventListener('input', (e) => {
    if (e.target.id !== 'q') return;
    clearTimeout(timer);
    timer = setTimeout(() => { state.q = e.target.value; renderList(); }, 120);
  });
  document.addEventListener('change', (e) => {
    if (e.target.id === 'sort') { store.sort = e.target.value; persist(); renderList(); }
  });

  document.addEventListener('click', (e) => {
    const t = e.target;
    const q = state.quiz;

    if (t.closest('#scrim')) { location.hash = base(); return; }

    // 질문
    const qw = t.closest('[data-q-who]');
    if (qw) { q.who = qw.dataset.qWho; q.step = 1; rerender(); window.scrollTo(0, 0); return; }
    const qf = t.closest('[data-q-field]');
    if (qf) {
      const k = qf.dataset.qField;
      q.fields = q.fields.includes(k) ? q.fields.filter((x) => x !== k) : q.fields.concat(k);
      rerender();
      return;
    }
    if (t.closest('[data-q-next]')) { q.step = 2; rerender(); window.scrollTo(0, 0); return; }
    if (t.closest('[data-q-back]')) { q.step = Math.max(0, q.step - 1); rerender(); return; }
    const qg = t.closest('[data-q-goal]');
    if (qg) {
      q.goal = qg.dataset.qGoal;
      store.plan = { who: q.who, fields: q.fields.slice(), goal: q.goal };
      persist();
      location.hash = '#/plan';
      return;
    }
    if (t.closest('[data-restart]')) {
      state.quiz = { step: 0, who: null, fields: store.plan ? store.plan.fields.slice() : [], goal: null };
      if (state.view === 'start') rerender();
      return;
    }
    if (t.closest('[data-save-plan]')) {
      buildPlan(store.plan).stages.forEach((s) => s.items.forEach((c) => { if (!isSaved(c.id)) store.saved.push(c.id); }));
      persist();
      rerender();
      return;
    }

    // 전체 자격증
    if (t.closest('#moreAreas')) { state.areasOpen = !state.areasOpen; rerender(); return; }
    const area = t.closest('[data-area]');
    if (area) { state.area = state.area === area.dataset.area ? null : area.dataset.area; renderAreas(); renderList(); return; }
    const who = t.closest('[data-who]');
    if (who) { store.who = who.dataset.who; persist(); rerender(); return; }
    if (t.closest('[data-reset]')) { state.q = ''; state.area = null; store.who = 'all'; persist(); rerender(); return; }

    // 자세히 보기
    const save = t.closest('[data-save]');
    if (save) {
      const id = save.dataset.save;
      store.saved = isSaved(id) ? store.saved.filter((x) => x !== id) : store.saved.concat(id);
      persist();
      rerender();
      const again = document.querySelector('[data-save]');
      if (again) again.focus();
      return;
    }
    const st = t.closest('[data-station]');
    if (st && state.sel) {
      const k = Number(st.dataset.station);
      const arr = store.done[state.sel] || [];
      store.done[state.sel] = arr.includes(k) ? arr.filter((x) => x !== k) : arr.concat(k);
      persist();
      const top = $('#drawer').scrollTop;
      renderList();
      renderDrawer();
      $('#drawer').scrollTop = top;
      const again = document.querySelector(`[data-station="${k}"]`);
      if (again) again.focus({ preventScroll: true });
    }
  });

  // 질문 화면에 바로 들어오면 처음부터
  window.addEventListener('hashchange', () => {
    if (location.hash === '#/start' && state.view !== 'start') {
      state.quiz = { step: 0, who: null, fields: store.plan ? store.plan.fields.slice() : [], goal: null };
    }
    route();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.sel) location.hash = base();
  });

  route();
})();
