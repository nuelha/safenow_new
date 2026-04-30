/* =========================================
   안전NOW 프로토타입 - 메인 스크립트
   ========================================= */

// =========================================
// 1. 전역 상태 (localStorage 연동)
// =========================================
const AppState = {
    get currentRole() {
        return localStorage.getItem('safenow_role') || 'ceo';
    },
    set currentRole(value) {
        localStorage.setItem('safenow_role', value);
    },
    get currentWorkplace() {
        return localStorage.getItem('safenow_workplace') || '본사 사업장';
    },
    set currentWorkplace(value) {
        localStorage.setItem('safenow_workplace', value);
    },
    get currentUser() {
        return localStorage.getItem('safenow_user') || '김대표';
    },
    set currentUser(value) {
        localStorage.setItem('safenow_user', value);
    },
    get currentAvatar() {
        return localStorage.getItem('safenow_avatar') || '본';
    },
    set currentAvatar(value) {
        localStorage.setItem('safenow_avatar', value);
    }
};

// 권한별 한글명
const RoleNames = {
    'ceo': '경영책임자',
    'manager': '안전관리자',
    'worker': '근로자',
    'contractor': '도급담당자',
    'consulting': '컨설팅담당자'
};

// =========================================
// GNB 동적 렌더링 (company_type + role 기반)
//   로그인_사업장선택_GNB분기_개발스펙.md §6 참조
// =========================================
const GNB_MENUS = {
    principal_manager: ['dashboard','tasks','risk','tbm','inspection','education',
                        'policy','budget','opinion','improvement','compliance',
                        'documents','process','contractor','workplace','support','myinfo'],
    principal_worker:  ['dashboard','tasks','tbm','opinion','support','myinfo'],
    subcontractor:     ['dashboard','tasks','tbm','opinion','support','myinfo'],
    consulting:        ['dashboard','tasks','opinion','support','myinfo']
};

// href 파일명 → 메뉴 키 매핑
const HREF_TO_MENU = {
    'index.html': 'dashboard',
    'dashboard-sub.html': 'dashboard',
    'my-tasks.html': 'tasks',
    'risk-assessment.html': 'risk',
    'tbm.html': 'tbm',
    'safety-inspection.html': 'inspection',
    'safety-education.html': 'education',
    'safety-policy.html': 'policy',
    'safety-budget.html': 'budget',
    'opinion.html': 'opinion',
    'improvement.html': 'improvement',
    'compliance.html': 'compliance',
    'documents.html': 'documents',
    'process.html': 'process',
    'contractor.html': 'contractor',
    'workplace.html': 'workplace',
    'support.html': 'support',
    'my-info.html': 'myinfo'
};

function deriveCompanyType(appRole) {
    if (appRole === 'contractor') return 'subcontractor';
    if (appRole === 'consulting')  return 'consulting';
    return 'principal';
}

function getAllowedMenuKeys() {
    const appRole = AppState.currentRole;
    const company_type = localStorage.getItem('safenow_company_type') || deriveCompanyType(appRole);
    if (company_type === 'subcontractor') return GNB_MENUS.subcontractor;
    if (company_type === 'consulting')    return GNB_MENUS.consulting;
    if (appRole === 'worker')             return GNB_MENUS.principal_worker;
    return GNB_MENUS.principal_manager;
}

function applyGnbByContext() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    const allowed = new Set(getAllowedMenuKeys());
    const company_type = localStorage.getItem('safenow_company_type') || deriveCompanyType(AppState.currentRole);
    const inPagesFolder = window.location.pathname.includes('/pages/');

    // 1) 메뉴 항목 가시성 + 대시보드 링크 동적 재작성 (컨텍스트별 진입 화면 분기)
    sidebar.querySelectorAll('.sidebar-nav > ul > li').forEach(li => {
        if (li.classList.contains('sidebar-section')) return;
        const a = li.querySelector('a.sidebar-item');
        if (!a) return;
        const href = a.getAttribute('href') || '';
        const file = href.split('/').pop().split('?')[0].split('#')[0];
        const key = HREF_TO_MENU[file];
        li.classList.toggle('hidden', !(key && allowed.has(key)));

        // 대시보드 링크: SUB/CON은 dashboard-sub.html로, principal은 index.html로
        if (key === 'dashboard') {
            let target;
            if (company_type === 'subcontractor' || company_type === 'consulting') {
                target = inPagesFolder ? 'dashboard-sub.html' : 'pages/dashboard-sub.html';
            } else {
                target = inPagesFolder ? '../index.html' : 'index.html';
            }
            a.setAttribute('href', target);
        }
    });

    // 2) 섹션 라벨: 다음 섹션까지 보이는 메뉴가 없으면 라벨도 숨김
    const lis = Array.from(sidebar.querySelectorAll('.sidebar-nav > ul > li'));
    lis.forEach((li, i) => {
        if (!li.classList.contains('sidebar-section')) return;
        let hasVisible = false;
        for (let j = i + 1; j < lis.length; j++) {
            if (lis[j].classList.contains('sidebar-section')) break;
            if (!lis[j].classList.contains('hidden')) { hasVisible = true; break; }
        }
        li.classList.toggle('hidden', !hasVisible);
    });
}

// =========================================
// 2. 사업장/권한 선택기
// =========================================
function toggleWorkspaceDropdown() {
    const dropdown = document.getElementById('workspace-dropdown');
    const chevron = document.getElementById('workspace-chevron');
    if (dropdown) {
        dropdown.classList.toggle('hidden');
        if (chevron) {
            chevron.classList.toggle('rotate-180');
        }
    }
}

function selectWorkspace(element) {
    const role = element.dataset.role;
    const name = element.dataset.name;
    const avatar = element.dataset.avatar;
    const user = element.dataset.user;

    // 상태 저장 (localStorage)
    AppState.currentRole = role;
    AppState.currentWorkplace = name;
    AppState.currentUser = user;
    AppState.currentAvatar = avatar;
    // GNB 분기를 위한 company_type 동기화
    localStorage.setItem('safenow_company_type', deriveCompanyType(role));

    // UI 업데이트
    applyCurrentRole();

    // 드롭다운 닫기
    const dropdown = document.getElementById('workspace-dropdown');
    const chevron = document.getElementById('workspace-chevron');
    if (dropdown) dropdown.classList.add('hidden');
    if (chevron) chevron.classList.remove('rotate-180');
}

// 현재 권한 상태를 UI에 적용
function applyCurrentRole() {
    const role = AppState.currentRole;
    const name = AppState.currentWorkplace;
    const user = AppState.currentUser;
    const avatar = AppState.currentAvatar;

    // 사업장 선택기 UI 업데이트
    const workspaceAvatar = document.getElementById('workspace-avatar');
    const workspaceName = document.getElementById('workspace-name');
    const workspaceRole = document.getElementById('workspace-role');

    if (workspaceAvatar) workspaceAvatar.textContent = avatar;
    if (workspaceName) workspaceName.textContent = name;
    if (workspaceRole) workspaceRole.textContent = RoleNames[role] || '근로자';

    // 헤더 사용자 정보 업데이트
    const headerAvatar = document.getElementById('header-avatar') || document.querySelector('.header-avatar');
    const headerUsername = document.getElementById('header-username') || document.querySelector('.header-username');
    if (headerAvatar) headerAvatar.textContent = user.charAt(0);
    if (headerUsername) headerUsername.textContent = user;

    // 체크 아이콘 업데이트
    document.querySelectorAll('.workspace-option').forEach(opt => {
        opt.classList.remove('active');
        const checkIcon = opt.querySelector('.check-icon');
        if (checkIcon) checkIcon.classList.add('hidden');

        // 현재 선택된 옵션 표시
        if (opt.dataset.role === role && opt.dataset.name === name) {
            opt.classList.add('active');
            if (checkIcon) checkIcon.classList.remove('hidden');
        }
    });

    // 대시보드 전환 (index.html에서만)
    const dashboard = document.getElementById('dashboard-' + role);
    if (dashboard) {
        document.querySelectorAll('.dashboard-content').forEach(d => d.classList.add('hidden'));
        dashboard.classList.remove('hidden');
    }

    // 헤더 탭 업데이트 (index.html에서만)
    document.querySelectorAll('.role-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.role === role) {
            tab.classList.add('active');
        }
    });

    // 사이드바 메뉴 — company_type + role 기반 GNB 동적 렌더링
    applyGnbByContext();
}

// =========================================
// 3. 대시보드 역할 전환
// =========================================
function switchDashboardRole(role) {
    // 해당 권한의 워크스페이스 옵션 찾아서 선택
    const workspaceOption = document.querySelector(`.workspace-option[data-role="${role}"][data-name="본사 사업장"]`);
    if (workspaceOption) {
        selectWorkspace(workspaceOption);
    } else {
        // 워크스페이스 옵션이 없는 경우 직접 상태 변경
        AppState.currentRole = role;
        applyCurrentRole();
    }
}

// =========================================
// 4. 탭 전환
// =========================================
function switchTab(tabGroupId, tabId) {
    const tabGroup = document.querySelector(`[data-tab-group="${tabGroupId}"]`);
    if (!tabGroup) return;

    // 모든 탭 버튼 비활성화
    tabGroup.querySelectorAll('.sub-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.tab === tabId) {
            tab.classList.add('active');
        }
    });

    // 탭 콘텐츠 전환
    const contentContainer = document.querySelector(`[data-tab-content="${tabGroupId}"]`);
    if (contentContainer) {
        contentContainer.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.add('hidden');
        });
        const targetPane = contentContainer.querySelector(`[data-pane="${tabId}"]`);
        if (targetPane) {
            targetPane.classList.remove('hidden');
        }
    }
}

// =========================================
// 5. 체크박스 토글
// =========================================
function toggleTaskComplete(checkbox, taskId) {
    const listItem = checkbox.closest('.list-item');
    const title = listItem.querySelector('.list-item-title');
    const badge = listItem.querySelector('.badge');

    if (checkbox.checked) {
        title.classList.add('completed');
        if (badge) {
            badge.className = 'badge badge-success';
            badge.textContent = '완료';
        }
    } else {
        title.classList.remove('completed');
    }
}

// =========================================
// 6. 알림 표시
// =========================================
function showNotification(type, title, message) {
    console.log(`[${type}] ${title}: ${message}`);
}

// =========================================
// 7. 모달
// =========================================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

// =========================================
// 8. 목표 아코디언 토글
// =========================================
function toggleGoal(header) {
    const accordion = header.closest('.goal-accordion');
    const content = accordion.querySelector('.goal-content');
    const chevron = header.querySelector('.goal-chevron');

    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        chevron.classList.add('rotate-180');
    } else {
        content.classList.add('hidden');
        chevron.classList.remove('rotate-180');
    }
}

// =========================================
// 9. 초기화
// =========================================
function init() {
    // 저장된 권한 상태 적용
    applyCurrentRole();

    // 역할 탭 클릭 이벤트 (대시보드 전용)
    document.querySelectorAll('.role-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            const role = btn.dataset.role;
            if (role) {
                switchDashboardRole(role);
            }
        });
    });

    // 서브 탭 클릭 이벤트
    document.querySelectorAll('.sub-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabGroup = tab.closest('[data-tab-group]');
            if (tabGroup) {
                switchTab(tabGroup.dataset.tabGroup, tab.dataset.tab);
            }
        });
    });

    // 체크박스 이벤트
    document.querySelectorAll('.list-item-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            toggleTaskComplete(e.target);
        });
    });

    // 드롭다운 외부 클릭 시 닫기
    document.addEventListener('click', function(e) {
        const selector = document.querySelector('.workspace-selector');
        const dropdown = document.getElementById('workspace-dropdown');
        if (selector && dropdown && !selector.contains(e.target)) {
            dropdown.classList.add('hidden');
            const chevron = document.getElementById('workspace-chevron');
            if (chevron) chevron.classList.remove('rotate-180');
        }
    });
}

// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', init);

// =========================================
// 10. 유틸리티 함수
// =========================================
const Utils = {
    // 날짜 포맷
    formatDate(date) {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    },

    // 상대 시간
    relativeTime(date) {
        const now = new Date();
        const diff = now - new Date(date);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return '방금 전';
        if (minutes < 60) return `${minutes}분 전`;
        if (hours < 24) return `${hours}시간 전`;
        return `${days}일 전`;
    },

    // 숫자 포맷 (천단위 콤마)
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },

    // 금액 포맷
    formatCurrency(amount) {
        if (amount >= 100000000) {
            return `${Math.floor(amount / 100000000)}억 ${Math.floor((amount % 100000000) / 10000)}만원`;
        }
        if (amount >= 10000) {
            return `${Math.floor(amount / 10000)}만원`;
        }
        return `${this.formatNumber(amount)}원`;
    },
};

// 헤더 사용자 영역 클릭 → 마이페이지 이동
// 헤더 사용자 영역 클릭 → 드롭다운 (내 정보 관리 / 로그아웃)
(function setupHeaderUserMenu() {
    function init() {
        const userEl = document.querySelector('.header-user');
        if (!userEl) return;

        // 경로 해석 (페이지 위치에 따라 다름)
        const inPagesFolder = window.location.pathname.includes('/pages/');
        const myInfoPath = inPagesFolder ? 'my-info.html' : 'pages/my-info.html';
        const loginPath  = inPagesFolder ? '../login.html' : 'login.html';

        // 트리거 셋업
        userEl.style.cursor = 'pointer';
        userEl.style.position = 'relative';
        userEl.setAttribute('role', 'button');
        userEl.setAttribute('tabindex', '0');
        userEl.setAttribute('aria-haspopup', 'menu');
        userEl.setAttribute('aria-expanded', 'false');
        userEl.setAttribute('title', '내 정보 관리 / 로그아웃');

        // 드롭다운 화살표 아이콘
        const chev = document.createElement('span');
        chev.id = 'header-user-chev';
        chev.style.marginLeft = '4px';
        chev.style.fontSize = '10px';
        chev.style.color = '#9CA3AF';
        chev.style.transition = 'transform 0.15s';
        chev.textContent = '▾';
        userEl.appendChild(chev);

        // 드롭다운 메뉴
        const menu = document.createElement('div');
        menu.id = 'header-user-menu';
        menu.className = 'hidden absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50';
        menu.setAttribute('role', 'menu');
        menu.innerHTML =
            '<a href="' + myInfoPath + '" class="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" role="menuitem">' +
            '  <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
            '    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>' +
            '  </svg>' +
            '  내 정보 관리' +
            '</a>' +
            '<button type="button" id="header-user-logout" class="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100" role="menuitem">' +
            '  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">' +
            '    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>' +
            '  </svg>' +
            '  로그아웃' +
            '</button>';
        userEl.appendChild(menu);

        function openMenu() {
            menu.classList.remove('hidden');
            userEl.setAttribute('aria-expanded', 'true');
            chev.style.transform = 'rotate(180deg)';
        }
        function closeMenu() {
            menu.classList.add('hidden');
            userEl.setAttribute('aria-expanded', 'false');
            chev.style.transform = '';
        }
        function toggleMenu() {
            menu.classList.contains('hidden') ? openMenu() : closeMenu();
        }

        // 트리거 클릭
        userEl.addEventListener('click', (e) => {
            // 드롭다운 내부 클릭은 메뉴 자체 핸들러에 위임
            if (e.target.closest('#header-user-menu')) return;
            e.stopPropagation();
            toggleMenu();
        });
        // 키보드 접근성
        userEl.addEventListener('keydown', (e) => {
            if (e.target.closest('#header-user-menu')) return;
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMenu(); }
            else if (e.key === 'Escape') closeMenu();
        });
        // 외부 클릭 닫기
        document.addEventListener('click', (e) => {
            if (!userEl.contains(e.target)) closeMenu();
        });

        // 로그아웃 핸들러
        document.getElementById('header-user-logout').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            ['safenow_session_user_email','safenow_session_user_name','safenow_logged_in',
             'safenow_role','safenow_workplace','safenow_user','safenow_avatar',
             'safenow_company_type','safenow_company_name','safenow_just_added_company','safenow_pending_invite']
                .forEach(k => localStorage.removeItem(k));
            window.location.replace(loginPath);
        });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
