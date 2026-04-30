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
  // 1. 페이지 → 화면 ID 매핑
  // ─────────────────────────────────────────────────────────
  const PAGE_SPECS = {
    'index':                ['DSH01-V', 'DSH02-V', 'DSH03-V'],
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
                             'WRK05-S', 'WRK05-M', 'WRK06-S', 'WRK07-S', 'WRK08-S', 'WRK09-S', 'WRK09-M']
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
    '화면설계서_09_고객지원_내정보관리.md'
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
   * - 섹션 시작: `### XXX##-X[숫자] 제목`
   * - 섹션 종료: 다음 `### XXX##-X` OR 다음 `## ` OR `# ` (상위 레벨)
   */
  function parseMd(text) {
    const sections = {};
    const headingRe = /^###\s+([A-Z]{3}\d{2}-[A-Z]\d?)\s*(.*)$/;
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

  function renderTabs() {
    const tabsEl = document.getElementById('spec-modal-tabs');
    tabsEl.innerHTML = currentIds.map((id, i) => {
      const spec = currentSpecsMap[id];
      const title = spec ? spec.title : '(미정의)';
      return `<div class="spec-tab${i === 0 ? ' active' : ''}" data-idx="${i}">` +
             `${id}<br><span class="spec-tab-sub">${escapeHtml(title)}</span></div>`;
    }).join('');
    tabsEl.querySelectorAll('.spec-tab').forEach(el => {
      el.onclick = () => renderContent(parseInt(el.dataset.idx, 10));
    });
  }

  function renderContent(idx) {
    currentTabIdx = idx;
    const id = currentIds[idx];
    const spec = currentSpecsMap[id];

    document.getElementById('spec-modal-title').textContent =
      spec ? `${id} · ${spec.title}` : id;

    document.querySelectorAll('.spec-tab').forEach((t, i) => {
      t.classList.toggle('active', i === idx);
    });

    const body = document.getElementById('spec-modal-body');
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
    currentIds = PAGE_SPECS[page] || [];

    if (currentIds.length === 0) {
      renderEmpty();
      return;
    }

    try {
      const [, specs] = await Promise.all([loadMarked(), loadSpecs()]);
      currentSpecsMap = specs;
      renderTabs();
      renderContent(0);
    } catch (e) {
      console.error('[screen-spec-modal]', e);
      renderError(e && e.message ? e.message : String(e));
    }
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
