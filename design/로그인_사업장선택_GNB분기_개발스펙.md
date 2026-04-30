# 로그인 / 사업장 선택 / GNB 분기 — 개발 스펙

> 버전: v1.0 | 작성일: 2026-04-30
> 관련 IA: LOGIN-S, DSH04-V (신규), GNB 변경

---

## 1. 변경 개요

### 현재 문제

| 문제                                      | 영향                                         |
| ----------------------------------------- | -------------------------------------------- |
| 로그인 후 대시보드로 바로 진입            | 다중 소속 사용자가 어느 사업장인지 선택 불가 |
| 컨텍스트 전환 후에도 대시보드 그대로 노출 | 도급업체 담당자가 원청 대시보드를 보게 됨    |
| GNB 메뉴가 모든 역할에 동일하게 노출      | SUB/CON 컨텍스트에서 접근 불가 메뉴 노출     |

### 변경 목표

1. 로그인 완료 → 무조건 사업장 선택 화면(LOGIN-S)으로 이동
2. 사업장 선택 후 → 사업자 유형 + 역할에 따라 분기 라우팅
3. GNB 메뉴 → 현재 컨텍스트(company_type)에 따라 동적 렌더링

---

## 2. 로그인 플로우 변경

### 변경 전

```
로그인 완료 → 대시보드 (역할별 DSH01~03)
```

### 변경 후

```
로그인 완료 → LOGIN-S (사업장 선택 화면) → 입장하기 클릭 → 라우팅 분기
```

> ⚠ "다음 로그인 시 이 화면 건너뛰기" 옵션 없음. **항상 선택 화면 경유**.

---

## 3. LOGIN-S 사업장 선택 화면 스펙

### 화면 ID: LOGIN-S

| 항목          | 내용                                                               |
| ------------- | ------------------------------------------------------------------ |
| URL           | `/site-select`                                                     |
| 진입 조건     | 로그인 완료 시 항상                                                |
| 뒤로가기 방지 | 로그인 페이지로만 이동 (대시보드 진입 전 브라우저 히스토리 클리어) |

### 화면 구성

```
┌────────────────────────────────────────────────────┐
│ 🛡️ 안전NOW                           박안전 님 ∨   │
│                                                    │
│ 사업장                                             │
│ 접속할 사업장을 선택해 주세요                        │
│                                                    │
│ [사업장 검색                          🔍]          │
│                                                    │
│ No │ 사업장명       │ 구분     │ 권한    │ 알림수신 │ 상태 │
│────┼────────────────┼─────────┼────────┼─────────┼──────│
│  1 │ 다온산업 본사   │ 구독사업자│ 경영책임자│ 카카오톡│[입장]│
│    │ 본사 사업장     │         │        │ 토글    │      │
│  2 │ 동방기계㈜     │ 도급업체  │ 도급담당자│ 카카오톡│[입장]│
│    │ 다온산업 현장   │         │        │ 토글    │      │
└────────────────────────────────────────────────────┘
```

### 테이블 컬럼 정의

| 컬럼      | 데이터 소스                             | 비고             |
| --------- | --------------------------------------- | ---------------- |
| No        | 순번                                    |                  |
| 사업장명  | `companies.company_name` + `sites.name` |                  |
| 구분      | `companies.company_type`                | 배지 (아래 참조) |
| 권한      | `memberships.role`                      | 역할 표시명      |
| 알림 수신 | `membership_notification_settings`      | 카카오톡 토글    |
| 상태      | 입장하기 버튼                           |                  |

### 사업장명 옆 배지 표시 규칙

`company_type = 'principal'`: 배지 없음
`company_type = 'subcontractor'`: `[도급업체]` 인라인 배지 (주황)
`company_type = 'consulting'`: `[컨설팅]` 인라인 배지 (보라)

> 구분 컬럼 없음. 배지는 사업장명 텍스트 옆에 인라인으로만 표시.

### 데이터 조회

```sql
SELECT
  c.id, c.company_name, c.company_type,
  s.name AS site_name,
  m.role, m.status,
  mns.kakao_enabled
FROM memberships m
JOIN companies c ON m.company_id = c.id
LEFT JOIN sites s ON m.site_id = s.id
LEFT JOIN membership_notification_settings mns ON m.id = mns.membership_id
WHERE m.user_id = :user_id
  AND m.status = 'active'
ORDER BY c.company_type ASC, c.company_name ASC
```

---

## 4. 입장 후 라우팅 분기

```
입장하기 클릭
├── company_type = 'principal' (구독사업자)
│   ├── role = 'CEO'          → DSH01-V (경영책임자 대시보드)
│   ├── role in (GM, SM, SHM) → DSH02-V (관리자 대시보드)
│   └── role = 'WKR'          → DSH03-V (근로자 대시보드)
│
├── company_type = 'subcontractor' (도급업체)
│   └── role = 'subcontractor_manager' → DSH04-V (도급업체 간소 대시보드)
│
└── company_type = 'consulting' (컨설팅업체)
    └── role = 'consulting_manager' → DSH04-V 또는 위임받은 모듈 기본화면
```

---

## 5. DSH04-V 도급업체/컨설팅업체 대시보드 (신규)

### 도급업체 vs 내 업무 직행 검토

| 방식                 | 장점                                 | 단점                         |
| -------------------- | ------------------------------------ | ---------------------------- |
| 내 업무 직행         | 개발 공수 없음, 단순                 | 진입 컨텍스트 없음, 어색함   |
| 간소 대시보드 (추천) | 역할에 맞는 정보 집약, 바로가기 제공 | 신규 화면 개발 필요 (소규모) |

**결론: 간소 대시보드(DSH04-V) 신규 개발 권장**
개발 공수가 크지 않으며, 진입 시 "나는 어디서 뭘 해야 하는가" 컨텍스트를 제공함.

### DSH04-V 화면 구성

| 항목      | 내용             |
| --------- | ---------------- |
| 화면 ID   | DSH04-V          |
| URL       | `/dashboard/sub` |
| 접근 권한 | SUB, CON         |

```
┌────────────────────────────────────────────────────┐
│ [원청 사업장 표시: 다온산업 본사 현장]               │ ← 컨텍스트 배너
│                                                    │
│ 안녕하세요, 강동방 님                               │
│ 동방기계㈜ · 도급업체 담당자                        │
│                                                    │
│ [내 할일 미니뷰]         [TBM 현황]                │
│  미완료 N건               이번달 작성 N건            │
│  기한임박 N건             예정 N건                  │
│  [내 업무 전체보기→]      [TBM 작성→]              │
│                                                    │
│ 바로가기                                            │
│ [아차사고 신고] [안전제안] [위험신고]               │
└────────────────────────────────────────────────────┘
```

### DSH04-V 위젯 데이터 정의

**내 할일 미니뷰**

```sql
SELECT COUNT(*) AS pending
FROM tasks
WHERE assignee_id = :user_id
  AND status != 'DONE'
```

**TBM 현황**

```sql
-- 이번달 작성 건수
SELECT COUNT(*) FROM tbm_records
WHERE company_id = :company_id
  AND work_date BETWEEN :month_start AND :month_end
  AND status = 'DONE'

-- 예정 건수
SELECT COUNT(*) FROM tbm_records
WHERE company_id = :company_id
  AND work_date > NOW()
  AND status = 'DRAFT'
```

**원청 사업장 컨텍스트 배너**

```
현재 선택된 원청 사업장: sites.name (계약된 원청 사업장)
복수인 경우 드롭다운으로 전환 가능
```

---

## 6. GNB 메뉴 동적 렌더링

### 컨텍스트별 GNB 메뉴 구성

| 메뉴         | principal (CEO/GM/SM/SHM) | principal (WKR) | subcontractor |  consulting  |
| ------------ | :-----------------------: | :-------------: | :-----------: | :----------: |
| 대시보드     |            ✅             |       ✅        | ❌ (DSH04-V)  | ❌ (DSH04-V) |
| 내 업무      |            ✅             |       ✅        |      ✅       |      ✅      |
| 위험성평가   |            ✅             |       ❌        |      ❌       | ✅ (대행 시) |
| TBM          |            ✅             |       ✅        |      ✅       |      ❌      |
| 안전점검     |            ✅             |       ❌        |      ❌       | ✅ (대행 시) |
| 안전보건교육 |            ✅             |       ❌        |      ❌       |      ❌      |
| 안전경영방침 |            ✅             |       ❌        |      ❌       |      ❌      |
| 안전보건예산 |            ✅             |       ❌        |      ❌       |      ❌      |
| 의견청취     |            ✅             |       ✅        |  ✅ (등록만)  |      ❌      |
| 개선조치     |            ✅             |       ❌        |      ❌       | ✅ (대행 시) |
| 이행관리     |            ✅             |       ❌        |      ❌       | ✅ (대행 시) |
| 업무문서관리 |            ✅             |       ❌        |      ❌       | ✅ (대행 시) |
| 공정관리     |            ✅             |       ❌        |      ❌       |      ❌      |
| 도급관리     |            ✅             |       ❌        |      ❌       |      ❌      |
| 사업장관리   |            ✅             |       ❌        |      ❌       |      ❌      |
| 고객지원     |            ✅             |       ✅        |      ✅       |      ✅      |
| 내 정보관리  |            ✅             |       ✅        |      ✅       |      ✅      |

### GNB 렌더링 로직

```javascript
const GNB_MENUS = {
  principal_manager: [
    "dashboard",
    "tasks",
    "risk",
    "tbm",
    "inspection",
    "education",
    "policy",
    "budget",
    "opinion",
    "improvement",
    "compliance",
    "documents",
    "process",
    "contractor",
    "workplace",
    "support",
    "myinfo",
  ],
  principal_worker: [
    "dashboard",
    "tasks",
    "tbm",
    "opinion",
    "support",
    "myinfo",
  ],
  subcontractor: ["tasks", "tbm", "opinion", "support", "myinfo"],
  consulting: ["tasks", "opinion", "support", "myinfo"],
  // consulting 위임 메뉴는 consulting_permissions 테이블에서 동적 조회
};

function getMenuKeys(context) {
  const { company_type, role, consulting_scope } = context;
  if (company_type === "subcontractor") return GNB_MENUS.subcontractor;
  if (company_type === "consulting") {
    const base = [...GNB_MENUS.consulting];
    if (consulting_scope.includes("risk_assessment")) base.push("risk");
    if (consulting_scope.includes("compliance_docs"))
      base.push("compliance", "documents", "improvement");
    return base;
  }
  if (role === "WKR") return GNB_MENUS.principal_worker;
  return GNB_MENUS.principal_manager;
}
```

### TBM 탭 분기 (SUB 컨텍스트)

```
구독사업자 컨텍스트:
  [TBM 목록] [스케줄] [그룹]
  → 원청 TBM / 도급업체 TBM 서브탭 모두 표시

SUB 컨텍스트:
  [TBM 목록] 만 표시 (스케줄·그룹 탭 숨김)
  → is_subcontractor=true AND company_id=본인 TBM만 표시
  → 상단에 원청 현장 컨텍스트 드롭다운 표시
```

### 의견청취 처리 버튼 분기 (SUB 컨텍스트)

```
구독사업자: 목록 + 상세(처리 포함) + 작성
SUB:        목록 + 상세(읽기전용) + 작성 (처리 버튼 비노출)
```

---

## 7. 세션 / 컨텍스트 관리

### 세션 저장 구조

```javascript
// 로그인 완료 시
session.user = {
  user_id: UUID,
  name: String,
  email: String,
}

// 사업장 입장 시
session.context = {
  company_id: UUID,
  company_type: 'principal' | 'subcontractor' | 'consulting',
  company_name: String,
  site_id: UUID,
  site_name: String,
  role: String,
  consulting_scope: String[] | null,
}
```

### API 요청 시 컨텍스트 검증

```
모든 API 요청에 company_id, site_id 포함
서버에서 memberships 테이블로 권한 재검증
→ 위변조 방지
```

### 컨텍스트 전환 (GNB 하단 선택기)

```
GNB 하단 사업장 선택기 클릭
→ 사업장 선택 화면(LOGIN-S)으로 이동
→ 재선택 후 입장하기
(로그아웃 없이 사업장 전환)
```

---

## 8. 영향 범위 요약

| 영역              | 변경 내용                            | 영향도 |
| ----------------- | ------------------------------------ | ------ |
| 로그인 플로우     | 완료 후 LOGIN-S로 라우팅 변경        | 높음   |
| LOGIN-S           | 신규 화면 개발                       | 중간   |
| DSH04-V           | 신규 화면 개발 (간소 대시보드)       | 중간   |
| GNB               | company_type 기반 동적 메뉴 렌더링   | 높음   |
| 브라우저 히스토리 | 입장 전 히스토리 클리어 처리         | 낮음   |
| API 권한 검증     | 모든 요청에 context 포함 강제        | 중간   |
| DSH01~03          | SUB/CON 직접 접근 시 리다이렉트 처리 | 낮음   |

---

## 9. 연관 문서

- [계정구조 사업자사용자소속 개발스펙](계정구조_사업자사용자소속_개발스펙.md)
- [회원가입유형 구독분리 개발스펙](회원가입유형_구독분리_개발스펙.md)
- [안전NOW IA v1.0](안전NOW_IA_v1.0.md) — LOGIN-S, DSH04-V 추가 필요
- [화면설계서 01 대시보드·내업무](화면설계서_01_대시보드_내업무.md) — DSH04-V 섹션 추가 필요

---

## 변경 이력

| 버전 | 날짜       | 내용      |
| ---- | ---------- | --------- |
| v1.0 | 2026-04-30 | 최초 작성 |
