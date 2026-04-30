/**
 * 안전NOW 프로토타입 — 화면설계서 사이드모달
 *
 * 동작:
 *   1) 9개 MD 파일을 fetch + 파싱 (한 번 로드 후 캐시)
 *   2) 각 `### XXX##-X 제목` 헤딩 단위로 섹션 추출
 *   3) 현재 페이지 → 화면 ID 리스트 매핑(PAGE_SPECS) 기반으로 탭 렌더
 *   4) marked.js (CDN, 동적 로드)로 마크다운 → HTML 변환
 *
 * MD가 단일 소스. 이 파일에는 콘텐츠가 없음.
 */

(function () {

  // ─────────────────────────────────────────────────────────
  // 0. 공통 레이아웃 스펙 (모든 페이지 첫 탭에 항상 노출)
  //    스펙 원본: design/공통레이아웃_화면설계서.md
  //    구조: ## 헤딩 단위로 sections 분할. content는 HTML.
  // ─────────────────────────────────────────────────────────
  const COMMON_SPEC = {
    id: 'LAYOUT',
    title: '공통 레이아웃',
    sections: [
      {
        heading: '1. 전체 레이아웃 구조',
        content:
`<pre><code>┌──────────────────────────────────────────────────────┐
│                    TOPBAR (56px)                      │ ← 고정
├──────────┬───────────────────────────────────────────┤
│          │                                           │
│  SIDEBAR │              MAIN CONTENT                 │
│  (200px) │                                           │
│  고정    │         스크롤 가능 영역                   │
│          │                                           │
│  [하단]  │                                           │
│  컨텍스트│                                           │
│  선택기  │                                           │
└──────────┴───────────────────────────────────────────┘</code></pre>
<ul>
  <li><b>TOPBAR</b>: 상단 고정 (position: fixed / sticky)</li>
  <li><b>SIDEBAR</b>: 좌측 고정, TOPBAR 아래부터 화면 끝까지</li>
  <li><b>MAIN CONTENT</b>: 나머지 영역, 독립적으로 스크롤</li>
</ul>`
      },
      {
        heading: '2. TOPBAR',
        content:
`<table>
  <tr><th>항목</th><th>값</th></tr>
  <tr><td>높이</td><td>56px</td></tr>
  <tr><td>배경색</td><td><code>#1E2A3B</code> (네이비)</td></tr>
  <tr><td>position</td><td>fixed top</td></tr>
  <tr><td>z-index</td><td>100</td></tr>
</table>
<h4>로고 (좌측)</h4>
<ul>
  <li>아이콘 32px + 텍스트 "안전NOW" 16px / 색상 흰색</li>
  <li>클릭 → 현재 컨텍스트 기준 기본 화면(DSH 또는 TSK)</li>
</ul>
<h4>알림 아이콘 (우측 영역 좌측)</h4>
<ul>
  <li>🔔 + 미읽음 배지 (0이면 숨김, 최대 99+)</li>
  <li>클릭 → 알림 드롭다운 패널 (최근 10건, 미읽음 파랑 도트)</li>
  <li>항목 클릭 → 해당 화면 이동 + 읽음 처리</li>
  <li>[알림 전체보기] → MYI03-L</li>
</ul>
<h4>프로필 드롭다운 (우측)</h4>
<ul>
  <li>아바타(이름 첫 글자 32px) + 이름 + 사업장명</li>
  <li>드롭다운 메뉴: 👤 내 정보관리 (→ MYI01-S) / 🏢 사업장 전환 (→ LOGIN-S) / 로그아웃</li>
</ul>`
      },
      {
        heading: '3. SIDEBAR (GNB)',
        content:
`<table>
  <tr><th>항목</th><th>값</th></tr>
  <tr><td>너비</td><td>200px</td></tr>
  <tr><td>배경색</td><td><code>#1E2A3B</code> (네이비)</td></tr>
  <tr><td>position</td><td>fixed left, top: 56px</td></tr>
  <tr><td>높이</td><td><code>calc(100vh - 56px)</code></td></tr>
  <tr><td>오버플로우</td><td>메뉴 영역 scroll / 컨텍스트 선택기 고정</td></tr>
</table>
<h4>메뉴 항목 상태별 스타일</h4>
<table>
  <tr><th>상태</th><th>배경</th><th>텍스트 / 아이콘</th></tr>
  <tr><td>기본</td><td>투명</td><td><code>#9CA3AF</code></td></tr>
  <tr><td>호버</td><td><code>#2D3F56</code></td><td><code>#E5E7EB</code></td></tr>
  <tr><td>활성</td><td><code>#2563EB</code></td><td><code>#fff</code></td></tr>
</table>
<h4>배지 (카운트)</h4>
<ul>
  <li>내 업무 / 의견청취 / 개선조치 등 미처리 건수</li>
  <li>색상 빨강(<code>#DC2626</code>), 최대 99+, 0이면 숨김</li>
</ul>
<h4>그룹 구분선 (선택)</h4>
<p>안전 활동 / 관리 / 조직·계약 / 지원 그룹으로 시각 분리.</p>`
      },
      {
        heading: '4. 컨텍스트 선택기 (SIDEBAR 하단 고정)',
        content:
`<pre><code>┌──────────────────────┐
│ 🏢 다온산업           │
│    본사 사업장        │
│    경영책임자     ∨   │ ← 클릭 시 LOGIN-S로 이동
└──────────────────────┘</code></pre>
<ul>
  <li>회사 아이콘 + 회사명 + 사업장명 + 역할 + 전환 아이콘(∨)</li>
  <li>클릭 → LOGIN-S (사업장 선택 화면)</li>
  <li>로그아웃 없이 사업장 전환</li>
</ul>
<h4>도급업체 / 컨설팅업체 컨텍스트</h4>
<ul>
  <li>상단에 [도급업체] 주황 배지 또는 [컨설팅] 보라 배지 표시</li>
  <li>업체명 + 원청 사업장명 + 담당자 역할</li>
</ul>`
      },
      {
        heading: '5. 컨텍스트별 GNB 메뉴 노출 규칙',
        content:
`<h4>5-1. 구독사업자 — CEO / GM / SM / SHM (17개 메뉴 전체)</h4>
<p>대시보드 / 내 업무 / 위험성평가 / TBM / 안전점검 / 안전보건교육 / 안전경영방침 / 안전보건예산 / 의견청취 / 개선조치 / 이행관리 / 업무문서관리 / 공정관리 / 도급관리 / 사업장관리 / 고객지원 / 내 정보관리</p>
<table>
  <tr><th>메뉴</th><th>CEO</th><th>GM</th><th>SM</th><th>SHM</th></tr>
  <tr><td>대시보드</td><td>DSH01-V</td><td>DSH02-V</td><td>DSH02-V</td><td>DSH02-V</td></tr>
  <tr><td>안전보건예산</td><td>전체</td><td>전체</td><td>본인 사업소</td><td>본인 사업소</td></tr>
  <tr><td>사업장관리</td><td>목록</td><td>목록</td><td>본인 사업소만</td><td>본인 사업소만</td></tr>
</table>
<h4>5-2. 구독사업자 — WKR (6개)</h4>
<p>대시보드(DSH03-V) / 내 업무 / TBM / 의견청취 / 고객지원 / 내 정보관리</p>
<h4>5-3. 도급업체 SUB (5개)</h4>
<p>내 업무 / TBM / 의견청취 / 고객지원 / 내 정보관리 — 기본 진입은 DSH04-V (간소 대시보드)</p>
<h4>5-4. 컨설팅업체 CON (3 + 위임 메뉴)</h4>
<p>내 업무 / 고객지원 / 내 정보관리 + 위임 범위 메뉴(<code>risk_assessment</code> → 위험성평가 / <code>compliance_docs</code> → 이행관리·업무문서관리·개선조치)</p>
<h4>렌더링 로직 (요약)</h4>
<pre><code>function getMenuList({ company_type, role, consulting_scope }) {
  if (company_type === 'subcontractor') return BASE_MENUS.subcontractor;
  if (company_type === 'consulting') {
    const m = [...BASE_MENUS.consulting];
    if (consulting_scope?.includes('risk_assessment')) m.splice(1, 0, 'risk');
    if (consulting_scope?.includes('compliance_docs')) m.splice(1, 0, 'compliance', 'documents', 'improvement');
    return m;
  }
  if (role === 'WKR') return BASE_MENUS.principal_wkr;
  return BASE_MENUS.principal_ceo_gm_sm_shm;
}</code></pre>`
      },
      {
        heading: '6. 메뉴 ID — 화면 ID 매핑',
        content:
`<table>
  <tr><th>메뉴 ID</th><th>메뉴명</th><th>이동 화면</th><th>배지 데이터 소스</th></tr>
  <tr><td><code>dashboard</code></td><td>대시보드</td><td>역할별 DSH01~04</td><td>—</td></tr>
  <tr><td><code>tasks</code></td><td>내 업무</td><td>TSK01-L</td><td>tasks WHERE assignee=본인 AND status!=DONE COUNT</td></tr>
  <tr><td><code>risk</code></td><td>위험성평가</td><td>RSK01-V</td><td>—</td></tr>
  <tr><td><code>tbm</code></td><td>TBM</td><td>TBM01-L</td><td>—</td></tr>
  <tr><td><code>inspection</code></td><td>안전점검</td><td>INS01-V</td><td>—</td></tr>
  <tr><td><code>education</code></td><td>안전보건교육</td><td>EDU01-V</td><td>—</td></tr>
  <tr><td><code>policy</code></td><td>안전경영방침</td><td>POL01-L</td><td>—</td></tr>
  <tr><td><code>budget</code></td><td>안전보건예산</td><td>BGT01-V</td><td>—</td></tr>
  <tr><td><code>opinion</code></td><td>의견청취</td><td>OPN01-L</td><td>opinion_requests WHERE status=RECEIVED AND site=본인 COUNT</td></tr>
  <tr><td><code>improvement</code></td><td>개선조치</td><td>IMP01-L</td><td>improvements WHERE status!=DONE AND site=본인 COUNT</td></tr>
  <tr><td><code>compliance</code></td><td>이행관리</td><td>CMP01-V</td><td>—</td></tr>
  <tr><td><code>documents</code></td><td>업무문서관리</td><td>DOC01-L</td><td>—</td></tr>
  <tr><td><code>process</code></td><td>공정관리</td><td>PRC01-L</td><td>—</td></tr>
  <tr><td><code>contractor</code></td><td>도급관리</td><td>CON01-L</td><td>—</td></tr>
  <tr><td><code>workplace</code></td><td>사업장관리</td><td>WRK01-L 또는 WRK01-D</td><td>—</td></tr>
  <tr><td><code>support</code></td><td>고객지원</td><td>SUP01-L</td><td>—</td></tr>
  <tr><td><code>myinfo</code></td><td>내 정보관리</td><td>MYI01-S</td><td>—</td></tr>
</table>`
      },
      {
        heading: '7. TBM 메뉴 진입 시 탭 분기',
        content:
`<table>
  <tr><th>컨텍스트</th><th>진입 화면</th><th>노출 탭</th></tr>
  <tr><td>구독사업자 (SHM+)</td><td>TBM01-L</td><td>[TBM 목록] [스케줄] [그룹]</td></tr>
  <tr><td>구독사업자 (WKR)</td><td>TBM01-L</td><td>[TBM 목록] (스케줄·그룹 숨김)</td></tr>
  <tr><td>도급업체 (SUB)</td><td>TBM01-L</td><td>[TBM 목록] (스케줄·그룹 숨김)</td></tr>
</table>`
      },
      {
        heading: '8. 사업장관리 메뉴 진입 시 분기',
        content:
`<table>
  <tr><th>역할</th><th>진입 화면</th><th>비고</th></tr>
  <tr><td>CEO / GM</td><td>WRK01-L (사업장 목록)</td><td>전체 사업장 목록 표시</td></tr>
  <tr><td>SM / SHM</td><td>WRK01-D (사업장 상세)</td><td>본인 소속 사업장 자동 로드. 목록 건너뜀</td></tr>
  <tr><td>WKR / SUB</td><td>—</td><td>메뉴 자체 비노출</td></tr>
</table>`
      },
      {
        heading: '9. 반응형 처리 (모바일)',
        content:
`<table>
  <tr><th>구분</th><th>기준</th><th>처리</th></tr>
  <tr><td>데스크탑</td><td>1024px 이상</td><td>사이드바 고정 표시</td></tr>
  <tr><td>태블릿</td><td>768~1023px</td><td>사이드바 아이콘만 표시 (호버 시 툴팁)</td></tr>
  <tr><td>모바일</td><td>767px 이하</td><td>사이드바 숨김 + 하단 탭바로 대체</td></tr>
</table>
<h4>모바일 하단 탭바 (컨텍스트별 4~5개)</h4>
<ul>
  <li>구독사업자(SHM+): [대시보드] [내 업무] [의견청취] [개선조치] [더보기]</li>
  <li>근로자/도급: [내 업무] [TBM] [의견청취] [내 정보] [더보기]</li>
</ul>`
      },
      {
        heading: '10. 공통 레이아웃 사용 예외 화면',
        content:
`<table>
  <tr><th>화면</th><th>이유</th></tr>
  <tr><td>로그인</td><td>인증 전 화면</td></tr>
  <tr><td>LOGIN-S 사업장 선택</td><td>컨텍스트 설정 전. TOPBAR만 표시</td></tr>
  <tr><td>REG-01~03 회원가입</td><td>인증 전 화면</td></tr>
  <tr><td>BIZ-01~03 사업자 추가</td><td>TOPBAR만 표시 (SIDEBAR 없음)</td></tr>
  <tr><td>ERR-01 초대 링크 만료</td><td>단독 오류 화면</td></tr>
</table>`
      },
      {
        heading: '11. CSS 변수 및 토큰 (공통 참조)',
        content:
`<pre><code>:root {
  /* 색상 */
  --color-navy:        #1E2A3B;
  --color-navy-dark:   #131D2B;
  --color-navy-hover:  #2D3F56;
  --color-blue:        #2563EB;
  --color-blue-light:  #EFF6FF;
  --color-green:       #16A34A;
  --color-orange:      #EA580C;
  --color-red:         #DC2626;
  --color-purple:      #7C3AED;

  --color-bg:      #F4F5F7;
  --color-surface: #FFFFFF;
  --color-border:  #E2E5EB;
  --color-text:    #1A1D23;
  --color-muted:   #6B7280;
  --color-dim:     #9CA3AF;

  /* 레이아웃 */
  --topbar-height: 56px;
  --sidebar-width: 200px;

  /* 반경 */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 10px;

  /* 그림자 */
  --shadow-sm: 0 1px 3px rgba(0,0,0,.08);
  --shadow-md: 0 4px 12px rgba(0,0,0,.1);
}</code></pre>`
      }
    ]
  };

  // ─────────────────────────────────────────────────────────
  // 1. 페이지 → 화면 ID 매핑
  // ─────────────────────────────────────────────────────────
  const PAGE_SPECS = {
    'login':                ['LOGIN-S'],
    'site-select':          ['LOGIN-S', 'INV-01'],
    'register':             ['REG-01', 'REG-02', 'REG-03', 'ERR-01'],
    'add-company':          ['BIZ-01', 'BIZ-02', 'BIZ-03'],
    'index':                ['DSH01-V', 'DSH02-V', 'DSH03-V'],
    'dashboard-sub':        ['DSH04-V'],
    'my-tasks':             ['TSK01-L', 'TSK02-L', 'TSK03-L', 'TSK04-L', 'TSK05-L'],
    'risk-assessment':      ['RSK01-V', 'RSK02-L', 'RSK02-D', 'RSK02-F', 'RSK03-L', 'RSK04-L', 'RSK04-M'],
    'tbm':                  ['TBM01-L', 'TBM01-D', 'TBM01-F', 'TBM02-L', 'TBM02-M', 'TBM03-L', 'TBM03-F'],
    'safety-inspection':    ['INS01-V', 'INS02-L', 'INS02-D', 'INS02-F', 'INS03-L', 'INS03-D', 'INS03-F'],
    'safety-education':     ['EDU01-V', 'EDU02-L', 'EDU02-D', 'EDU02-M'],
    'safety-policy':        ['POL01-L', 'POL01-D', 'POL01-F', 'POL02-L', 'POL02-D', 'POL02-M'],
    'goal-register':        ['POL03-S'],
    'checklist-start':      ['POL04-S'],
    'safety-budget':        ['BGT01-V'],
    'opinion':              ['OPN01-L', 'OPN01-D'],
    'opinion-register':     ['OPN01-F'],
    'improvement':          ['IMP01-L', 'IMP01-D'],
    'compliance':           ['CMP01-V', 'CMP01-D', 'CMP02-V'],
    'documents':            ['DOC01-L', 'DOC01-D', 'DOC01-M', 'DOC01-M2', 'DOC02-L', 'DOC02-M3', 'DOC03-F'],
    'process':              ['PRC01-L', 'PRC01-M', 'PRC01-M2'],
    'contractor':           ['CON01-L', 'CON01-D', 'CON02-L', 'CON03-L', 'CON03-M', 'CON08-D'],
    'contractor-register':  ['CON04-F', 'CON05-F', 'CON05-M', 'CON05-M2', 'CON05-M3', 'CON06-F', 'CON07-F'],
    'workplace':            ['WRK01-D', 'WRK01-L', 'WRK02-L', 'WRK02-M', 'WRK02-M2', 'WRK03-V', 'WRK04-V',
                             'WRK05-S', 'WRK05-M', 'WRK06-S', 'WRK07-S', 'WRK08-S', 'WRK09-S', 'WRK09-M'],
    'support':              ['SUP01-L', 'SUP01-D', 'SUP02-L', 'SUP02-F'],
    'my-info':              ['MYI01-S', 'MYI02-L', 'MYI03-L', 'MYI04-V']
  };

  const MD_FILES = [
    '화면설계서_01_대시보드_내업무.md',
    '화면설계서_02_위험성평가_TBM.md',
    '화면설계서_03_안전점검_안전보건교육.md',
    '화면설계서_04_안전경영방침_안전보건예산.md',
    '화면설계서_05_의견청취_개선조치_이행관리.md',
    '화면설계서_06_업무문서관리_공정관리.md',
    '화면설계서_07_도급관리.md',
    '화면설계서_08_사업장관리.md',
    '화면설계서_09_고객지원_내정보관리.md',
    '회원가입_화면설계서.md'
  ];

  const MARKED_CDN = 'https://cdn.jsdelivr.net/npm/marked@12/marked.min.js';

  // ─────────────────────────────────────────────────────────
  // 2. MD 로드 & 파싱
  // ─────────────────────────────────────────────────────────
  let SPEC_CACHE = null;     // { 'DOC01-L': { title, markdown } }
  let MARKED_PROMISE = null;

  function getDesignBase() {
    const path = window.location.pathname;
    return path.includes('/pages/') ? '../design/' : 'design/';
  }

  function loadMarked() {
    if (window.marked) return Promise.resolve(window.marked);
    if (MARKED_PROMISE) return MARKED_PROMISE;
    MARKED_PROMISE = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = MARKED_CDN;
      s.onload = () => resolve(window.marked);
      s.onerror = () => reject(new Error('marked.js 로드 실패'));
      document.head.appendChild(s);
    });
    return MARKED_PROMISE;
  }

  /**
   * MD 텍스트를 화면 ID 단위 섹션으로 파싱.
   * - 섹션 시작: `### XXX##-X[숫자] 제목` 또는 `## N. REG-XX 제목` 등
   *   매칭 ID 패턴: 영문대문자(2~5)-(영문대문자|숫자)+ 또는 영문대문자{3}\d{2}-[A-Z]\d?
   * - 섹션 종료: 다음 ID 헤딩 OR 다음 일반 `## ` / `# ` (상위 레벨)
   */
  function parseMd(text) {
    const sections = {};
    const headingRe = /^#{2,3}\s+(?:\d+\.\s*)?([A-Z][A-Z0-9]*-[A-Z0-9]+)(?:\s+(.*))?$/;
    const lines = text.split(/\r?\n/);
    let curId = null, curTitle = '', buf = [];
    const flush = () => {
      if (curId) sections[curId] = { title: curTitle.trim(), markdown: buf.join('\n').trim() };
    };
    for (const line of lines) {
      const m = line.match(headingRe);
      if (m) {
        flush();
        curId = m[1];
        curTitle = m[2] || '';
        buf = [];
      } else if (curId) {
        if (/^##?\s/.test(line)) { flush(); curId = null; buf = []; }
        else buf.push(line);
      }
    }
    flush();
    return sections;
  }

  async function loadSpecs() {
    if (SPEC_CACHE) return SPEC_CACHE;
    const base = getDesignBase();
    const texts = await Promise.all(
      MD_FILES.map(f =>
        fetch(base + encodeURIComponent(f))
          .then(r => { if (!r.ok) throw new Error(f + ' ' + r.status); return r.text(); })
      )
    );
    const merged = {};
    for (const text of texts) Object.assign(merged, parseMd(text));
    SPEC_CACHE = merged;
    return merged;
  }

  // ─────────────────────────────────────────────────────────
  // 3. 페이지 키
  // ─────────────────────────────────────────────────────────
  function getCurrentPage() {
    const path = window.location.pathname;
    let filename = path.split('/').pop().replace('.html', '');
    if (!filename) filename = 'index';
    return filename;
  }

  // ─────────────────────────────────────────────────────────
  // 4. 모달 UI 삽입
  // ─────────────────────────────────────────────────────────
  function injectModal() {
    const style = document.createElement('style');
    style.textContent = `
      #spec-fab {
        position: fixed; bottom: 28px; right: 28px; z-index: 9998;
        background: #1E2A3B; color: #60A5FA; border: none; border-radius: 10px;
        padding: 10px 16px; font-size: 12px; font-weight: 700; cursor: pointer;
        display: flex; align-items: center; gap: 7px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.18);
        font-family: 'Pretendard', -apple-system, sans-serif;
        letter-spacing: 0.02em;
        transition: background 0.15s, right 0.25s cubic-bezier(.4,0,.2,1);
      }
      #spec-fab:hover { background: #2D3F56; }

      #spec-overlay {
        display: none; position: fixed; inset: 0;
        background: rgba(0,0,0,0.35); z-index: 9999;
      }
      #spec-overlay.open { display: block; }

      /* Push 모드 — 본문을 왼쪽으로 밀고 모달이 옆에 자리잡음 */
      body.spec-pushing {
        margin-right: 520px;
        transition: margin-right 0.25s cubic-bezier(.4,0,.2,1);
      }
      body.spec-pushing #spec-fab { right: 548px; }

      /* 좁은 화면에서는 push 폴백 — 본문을 밀지 않고 오버레이처럼 덮음 */
      @media (max-width: 1023px) {
        body.spec-pushing { margin-right: 0; }
        body.spec-pushing #spec-fab { right: 28px; }
      }

      #spec-modal {
        position: fixed; top: 0; right: 0;
        width: 520px; max-width: 96vw; height: 100vh;
        background: #fff; z-index: 10000;
        display: flex; flex-direction: column;
        box-shadow: -4px 0 32px rgba(0,0,0,0.14);
        transform: translateX(100%);
        transition: transform 0.25s cubic-bezier(.4,0,.2,1);
        font-family: 'Pretendard', -apple-system, sans-serif;
      }
      #spec-modal.open { transform: translateX(0); }

      #spec-modal-header {
        background: #1E2A3B; color: #fff; padding: 16px 20px;
        display: flex; align-items: center; justify-content: space-between;
        flex-shrink: 0;
      }
      #spec-modal-header-left { display: flex; align-items: center; gap: 10px; }
      #spec-modal-badge {
        background: #60A5FA; color: #1E2A3B;
        font-size: 10px; font-weight: 800;
        padding: 2px 8px; border-radius: 99px; letter-spacing: 0.06em;
      }
      #spec-modal-title { font-size: 14px; font-weight: 700; color: #E5E7EB; }
      #spec-modal-close {
        background: none; border: none; color: #9CA3AF;
        font-size: 20px; cursor: pointer; padding: 4px; line-height: 1;
      }
      #spec-modal-close:hover { color: #fff; }

      #spec-modal-tabs {
        display: flex; background: #F4F5F7;
        border-bottom: 1px solid #E2E5EB; flex-shrink: 0;
        overflow-x: auto;
      }
      .spec-tab {
        padding: 9px 14px; font-size: 11px; font-weight: 600; color: #6B7280;
        cursor: pointer; border-bottom: 2px solid transparent;
        white-space: nowrap; transition: .15s; line-height: 1.3;
      }
      .spec-tab:hover { color: #2563EB; }
      .spec-tab.active {
        color: #2563EB; border-bottom-color: #2563EB; background: #fff;
      }
      .spec-tab .spec-tab-sub {
        font-weight: 400; font-size: 10px; opacity: 0.85;
      }

      #spec-modal-body {
        flex: 1; overflow-y: auto; padding: 20px;
        font-size: 12px; color: #374151; line-height: 1.65;
      }
      #spec-modal-body h2 { font-size: 16px; font-weight: 700; margin: 18px 0 8px; color: #111827; }
      #spec-modal-body h3 { font-size: 14px; font-weight: 700; margin: 16px 0 6px; color: #111827; }
      #spec-modal-body h4 {
        font-size: 11px; font-weight: 800; color: #374151;
        letter-spacing: 0.07em; text-transform: uppercase;
        margin: 16px 0 8px; padding-bottom: 5px;
        border-bottom: 1.5px solid #E2E5EB;
      }
      #spec-modal-body table {
        width: 100%; border-collapse: collapse; font-size: 11px;
        margin: 6px 0 12px;
      }
      #spec-modal-body th, #spec-modal-body td {
        border: 1px solid #E2E5EB; padding: 5px 8px; text-align: left; vertical-align: top;
      }
      #spec-modal-body th { background: #F9FAFB; font-weight: 600; color: #6B7280; }
      #spec-modal-body ul, #spec-modal-body ol { padding-left: 18px; margin: 4px 0 10px; }
      #spec-modal-body li { margin-bottom: 3px; }
      #spec-modal-body code {
        background: #F3F4F6; padding: 1px 5px; border-radius: 4px;
        font-size: 11px; color: #BE185D;
      }
      #spec-modal-body pre {
        background: #1E2A3B; color: #E5E7EB;
        padding: 10px 12px; border-radius: 6px;
        overflow-x: auto; font-size: 11px; line-height: 1.5;
        margin: 6px 0 12px;
      }
      #spec-modal-body pre code { background: transparent; color: inherit; padding: 0; }
      #spec-modal-body p { margin: 4px 0 8px; }
      #spec-modal-body strong { color: #1D4ED8; }
      #spec-modal-body hr { border: 0; border-top: 1px dashed #E2E5EB; margin: 14px 0; }
      #spec-modal-body blockquote {
        border-left: 3px solid #60A5FA; background: #F0F9FF;
        margin: 6px 0 12px; padding: 6px 10px; color: #1E40AF;
      }

      #spec-modal-footer {
        padding: 12px 20px; border-top: 1px solid #E2E5EB;
        font-size: 10px; color: #9CA3AF; flex-shrink: 0; background: #F9FAFB;
      }

      .spec-empty {
        padding: 40px 8px; text-align: center; color: #6B7280;
        font-size: 13px; line-height: 1.7;
      }
      .spec-empty .spec-empty-icon { font-size: 32px; margin-bottom: 12px; }
      .spec-empty .spec-empty-hint { margin-top: 16px; font-size: 11px; color: #9CA3AF; }
      .spec-error {
        padding: 20px; background: #FEF2F2; border: 1px solid #FECACA;
        border-radius: 6px; color: #B91C1C; font-size: 12px;
      }
      .spec-loading { padding: 40px; text-align: center; color: #9CA3AF; font-size: 12px; }
    `;
    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.id = 'spec-overlay';
    overlay.onclick = closeModal;
    document.body.appendChild(overlay);

    const modal = document.createElement('div');
    modal.id = 'spec-modal';
    modal.innerHTML = `
      <div id="spec-modal-header">
        <div id="spec-modal-header-left">
          <span id="spec-modal-badge">화면설계서</span>
          <span id="spec-modal-title">—</span>
        </div>
        <button id="spec-modal-close" aria-label="닫기">✕</button>
      </div>
      <div id="spec-modal-tabs"></div>
      <div id="spec-modal-body"><div class="spec-loading">로딩 중…</div></div>
      <div id="spec-modal-footer">안전NOW 화면설계서 · MD 단일 소스 · IA v1.0</div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('#spec-modal-close').onclick = closeModal;

    const fab = document.createElement('button');
    fab.id = 'spec-fab';
    fab.textContent = '📋 화면설계서';
    fab.onclick = openModal;
    document.body.appendChild(fab);
  }

  // ─────────────────────────────────────────────────────────
  // 5. 모달 동작
  // ─────────────────────────────────────────────────────────
  let currentIds = [];
  let currentSpecsMap = {};
  let currentTabIdx = 0;
  let activePushMode = false;

  function isPushMode() {
    const want = document.body && document.body.dataset.specModal === 'push';
    return want && window.innerWidth >= 1024;
  }

  function showModal() {
    activePushMode = isPushMode();
    if (activePushMode) {
      document.body.classList.add('spec-pushing');
    } else {
      document.getElementById('spec-overlay').classList.add('open');
    }
    document.getElementById('spec-modal').classList.add('open');
  }

  function closeModal() {
    document.getElementById('spec-overlay').classList.remove('open');
    document.getElementById('spec-modal').classList.remove('open');
    document.body.classList.remove('spec-pushing');
    activePushMode = false;
  }

  function isModalOpen() {
    return document.getElementById('spec-modal').classList.contains('open');
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isModalOpen()) closeModal();
  });

  function renderEmpty() {
    document.getElementById('spec-modal-title').textContent = '준비 중';
    document.getElementById('spec-modal-tabs').innerHTML = '';
    document.getElementById('spec-modal-body').innerHTML =
      '<div class="spec-empty">' +
      '<div class="spec-empty-icon">📝</div>' +
      '이 페이지의 화면설계서가<br>아직 매핑되지 않았습니다.' +
      '<div class="spec-empty-hint">design/screen-spec-modal.js의 PAGE_SPECS를 확인하세요.</div>' +
      '</div>';
  }

  function renderError(msg) {
    document.getElementById('spec-modal-title').textContent = '오류';
    document.getElementById('spec-modal-tabs').innerHTML = '';
    document.getElementById('spec-modal-body').innerHTML =
      '<div class="spec-error"><b>화면설계서를 불러올 수 없습니다.</b><br>' +
      '<span style="font-size:11px;color:#7F1D1D">' + escapeHtml(msg) + '</span><br><br>' +
      '<span style="font-size:11px">로컬에서 확인하려면 정적 서버가 필요합니다 (예: <code>python -m http.server</code>).</span>' +
      '</div>';
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // LAYOUT 탭 sentinel — currentIds 안에 항상 첫번째 항목으로 들어감
  const LAYOUT_SENTINEL = '__LAYOUT__';

  function renderTabs() {
    const tabsEl = document.getElementById('spec-modal-tabs');
    tabsEl.innerHTML = currentIds.map((id, i) => {
      let label, subTitle;
      if (id === LAYOUT_SENTINEL) {
        label = COMMON_SPEC.id;
        subTitle = COMMON_SPEC.title;
      } else {
        const spec = currentSpecsMap[id];
        label = id;
        subTitle = spec ? spec.title : '(미정의)';
      }
      return `<div class="spec-tab${i === 0 ? ' active' : ''}" data-idx="${i}">` +
             `${label}<br><span class="spec-tab-sub">${escapeHtml(subTitle)}</span></div>`;
    }).join('');
    tabsEl.querySelectorAll('.spec-tab').forEach(el => {
      el.onclick = () => renderContent(parseInt(el.dataset.idx, 10));
    });
  }

  function renderContent(idx) {
    currentTabIdx = idx;
    const id = currentIds[idx];
    const body = document.getElementById('spec-modal-body');

    document.querySelectorAll('.spec-tab').forEach((t, i) => {
      t.classList.toggle('active', i === idx);
    });

    // LAYOUT 탭 — 하드코딩 HTML 섹션 직접 렌더 (marked 불필요)
    if (id === LAYOUT_SENTINEL) {
      document.getElementById('spec-modal-title').textContent =
        `${COMMON_SPEC.id} · ${COMMON_SPEC.title}`;
      body.innerHTML = COMMON_SPEC.sections.map(s =>
        `<h3>${escapeHtml(s.heading)}</h3>${s.content}`
      ).join('');
      return;
    }

    // 페이지별 ID — MD 캐시에서 꺼내 marked 렌더
    const spec = currentSpecsMap[id];
    document.getElementById('spec-modal-title').textContent =
      spec ? `${id} · ${spec.title}` : id;

    if (!spec) {
      body.innerHTML =
        '<div class="spec-empty">' +
        '<div class="spec-empty-icon">⚠️</div>' +
        `<b>${id}</b> 섹션이 MD 파일에 없습니다.` +
        '<div class="spec-empty-hint">design/화면설계서_*.md에 <code>### ' + id + ' 제목</code> 헤딩을 추가하세요.</div>' +
        '</div>';
      return;
    }
    body.innerHTML = window.marked.parse(spec.markdown);
  }

  async function openModal() {
    showModal();
    document.getElementById('spec-modal-body').innerHTML = '<div class="spec-loading">로딩 중…</div>';
    document.getElementById('spec-modal-tabs').innerHTML = '';
    document.getElementById('spec-modal-title').textContent = '—';

    const page = getCurrentPage();
    const pageSpecs = PAGE_SPECS[page] || [];
    // LAYOUT 탭은 항상 첫 번째로. 페이지 스펙은 그 뒤에 이어 붙임.
    currentIds = [LAYOUT_SENTINEL, ...pageSpecs];

    // 페이지별 스펙이 있을 때만 marked.js + MD 로드 (LAYOUT 단독이면 fetch 불필요)
    if (pageSpecs.length > 0) {
      try {
        const [, specs] = await Promise.all([loadMarked(), loadSpecs()]);
        currentSpecsMap = specs;
      } catch (e) {
        console.error('[screen-spec-modal]', e);
        // MD 로드 실패해도 LAYOUT 탭은 정상 표시. 다른 탭 클릭 시 에러 메시지.
        currentSpecsMap = {};
      }
    } else {
      currentSpecsMap = {};
    }

    renderTabs();
    renderContent(0);
  }

  // ─────────────────────────────────────────────────────────
  // 6. 초기화
  // ─────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectModal);
  } else {
    injectModal();
  }

})();
