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
    'worker': '근로자'
};

// 근로자용 메뉴 (제한적)
const WorkerMenus = ['대시보드', '내 업무', 'TBM', '의견청취', '고객지원', '내 정보관리'];

// 경영책임자 전용 메뉴
const CeoOnlyMenus = ['안전경영방침', '안전보건예산'];

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

    // 사이드바 메뉴 권한별 표시/숨김
    updateSidebarByRole(role);
}

// 사이드바 메뉴 권한별 표시/숨김
function updateSidebarByRole(role) {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    const menuItems = sidebar.querySelectorAll('.sidebar-item');
    const sections = sidebar.querySelectorAll('.sidebar-section');

    if (role === 'worker') {
        // 근로자: 허용된 메뉴만 표시
        menuItems.forEach(item => {
            const menuText = item.textContent.trim().split('\n')[0].trim();
            const li = item.closest('li');
            if (li) {
                if (WorkerMenus.some(m => menuText.includes(m))) {
                    li.classList.remove('hidden');
                } else {
                    li.classList.add('hidden');
                }
            }
        });
        // 관리 섹션 숨기기
        sections.forEach(section => {
            if (section.textContent.includes('관리')) {
                section.classList.add('hidden');
            } else {
                section.classList.remove('hidden');
            }
        });
    } else if (role === 'manager') {
        // 관리자: 경영책임자 전용 메뉴 숨김
        menuItems.forEach(item => {
            const menuText = item.textContent.trim().split('\n')[0].trim();
            const li = item.closest('li');
            if (li) {
                if (CeoOnlyMenus.some(m => menuText.includes(m))) {
                    li.classList.add('hidden');
                } else {
                    li.classList.remove('hidden');
                }
            }
        });
        sections.forEach(section => section.classList.remove('hidden'));
    } else {
        // 경영책임자: 모든 메뉴 표시
        menuItems.forEach(item => {
            const li = item.closest('li');
            if (li) li.classList.remove('hidden');
        });
        sections.forEach(section => section.classList.remove('hidden'));
    }
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
