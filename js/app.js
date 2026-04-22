/* =========================================
   안전NOW 프로토타입 - 메인 스크립트
   ========================================= */

// =========================================
// 1. 전역 상태
// =========================================
const AppState = {
    currentRole: 'ceo', // ceo, manager, worker
    currentWorkplace: '본사 사업장',
};

// =========================================
// 2. 대시보드 역할 전환
// =========================================
function switchDashboardRole(role) {
    // 버튼 상태 업데이트
    document.querySelectorAll('.role-tab').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.role === role) {
            btn.classList.add('active');
        }
    });

    // 대시보드 콘텐츠 전환
    document.querySelectorAll('.dashboard-content').forEach(content => {
        content.classList.add('hidden');
    });

    const targetDashboard = document.getElementById(`dashboard-${role}`);
    if (targetDashboard) {
        targetDashboard.classList.remove('hidden');
    }

    AppState.currentRole = role;
}

// =========================================
// 3. 탭 전환
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
// 4. 체크박스 토글
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
// 5. 사업장 선택기
// =========================================
function toggleWorkspaceSelector() {
    console.log('사업장 선택기 토글');
}

function selectWorkspace(workplaceName) {
    AppState.currentWorkplace = workplaceName;
    const workspaceNameEl = document.querySelector('.workspace-name');
    if (workspaceNameEl) {
        workspaceNameEl.textContent = workplaceName;
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
// 8. 초기화
// =========================================
function init() {
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

    // 사업장 선택기 클릭 이벤트
    const workspaceBtn = document.querySelector('.workspace-btn');
    if (workspaceBtn) {
        workspaceBtn.addEventListener('click', toggleWorkspaceSelector);
    }
}

// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', init);

// =========================================
// 9. 유틸리티 함수
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
