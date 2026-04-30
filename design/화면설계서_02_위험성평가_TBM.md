# 안전NOW 화면설계서 — 02. 위험성평가 / TBM

> 버전: v1.0 | 작성일: 2026-04-29

---

## 1. 위험성평가 (RSK)

### RSK01-V 현황 탭

| 항목 | 내용 |
|------|------|
| 화면 ID | RSK01-V |
| URL | `/risk-assessment` |
| 접근 권한 | 전체 |
| 기본 진입 화면 | ✅ |

#### 레이아웃

```
┌────────────────────────────────────────────────────┐
│ 위험성평가 현황관리                                  │
│                                                    │
│ [위험성평가 이행현황 섹션]                           │
│  전체 이행률: N%  (N/N건)                           │
│                                                    │
│ 이행현황 테이블                                     │
│ 중분류 | 이행단계배지 | 문서명 | 완료율 | [상세]      │
└────────────────────────────────────────────────────┘
```

#### 이행현황 테이블 데이터 정의

| 컬럼 | 데이터 소스 | 비고 |
|------|-----------|------|
| 중분류 | `risk_assessment_categories.name` | |
| 이행단계 | `compliance_tasks.status` → 배지 변환 | 계획/실행/검토/개선 |
| 문서명 | `documents.document_name` | |
| 완료율 | `완료건/전체건 × 100` | % (N/N건 표시) |
| 상세 | → RSK02-D | 버튼 |

#### 이행단계 배지 매핑

| 상태 코드 | 배지 표시 | 색상 |
|---------|---------|------|
| `SCHEDULED` | 계획 | 파랑 |
| `IN_PROGRESS` | 실행 | 주황 |
| `REVIEWING` | 검토 | 노랑 |
| `IMPROVING` | 개선 | 초록 |
| `DONE` | 완료 | 초록 |

---

### RSK02-L 평가 목록 탭

| 항목 | 내용 |
|------|------|
| 화면 ID | RSK02-L |
| URL | `/risk-assessment?tab=list` |
| 접근 권한 | SHM+ |

#### 레이아웃

```
┌────────────────────────────────────────────────────┐
│ 평가 목록                                          │
│ 필터: [평가유형▼] [기간] [검색]    [+ 평가 등록]    │
│                                                    │
│ 평가명 | 유형 | 기법 | 기간 | 담당자 | 상태 | 관리  │
└────────────────────────────────────────────────────┘
```

#### risk_assessments 테이블 주요 컬럼

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID PK | |
| `site_id` | UUID FK | 사업장 |
| `assessment_type` | ENUM(`regular`, `initial`, `special`) | 정기/최초/수시 |
| `method` | ENUM(`frequency_severity`, `checklist`, `what_if`, `key_factor`) | 평가 기법 |
| `checklist_id` | UUID FK NULL | 체크리스트 기법 시 사용 |
| `process_id` | UUID FK NULL | 연결 공정 |
| `assignee_id` | UUID FK | 담당자 |
| `start_date` | DATE | |
| `end_date` | DATE | |
| `status` | ENUM(`PENDING`, `IN_PROGRESS`, `DONE`) | |
| `is_consulting` | BOOLEAN | 컨설팅 대행 여부 |
| `created_by` | UUID FK | |

#### 평가유형 필터 옵션

| 코드 | 표시명 |
|------|--------|
| `regular` | 정기 |
| `initial` | 최초 |
| `special` | 수시 |

#### 평가 기법 배지

| 코드 | 표시명 |
|------|--------|
| `frequency_severity` | 빈도강도법 |
| `checklist` | 체크리스트 |
| `what_if` | WHAT-IF |
| `key_factor` | 핵심요인기술법 |

---

### RSK02-D 평가 상세

| 항목 | 내용 |
|------|------|
| 화면 ID | RSK02-D |
| URL | `/risk-assessment/:id` |
| 접근 권한 | SHM+ |
| 진입 경로 | RSK02-L 목록 행 클릭 / RSK01-V 상세 버튼 |

#### 레이아웃

```
┌────────────────────────────────────────────────────┐
│ 평가 기본정보 (읽기전용)                            │
│ 평가유형 | 기법 | 공정 | 기간 | 담당자              │
│                                                    │
│ 위험요인 목록                                       │
│ 번호 | 위험요인 | 현재위험도 | 개선대책 | 개선 후    │
│                                                    │
│ 개선조치 현황                                       │
│ → IMP01-L 출처=위험성평가 필터 연동                 │
└────────────────────────────────────────────────────┘
```

#### 연계 화면

| 연계 대상 | 방향 | 내용 |
|----------|------|------|
| RSK02-L | 이동 | ← 목록으로 |
| RSK02-F | 이동 | 수정 버튼 |
| IMP01-L | 연동 | 개선조치 현황 (출처=위험성평가) |

---

### RSK02-F 평가 등록/수정

| 항목 | 내용 |
|------|------|
| 화면 ID | RSK02-F |
| URL | `/risk-assessment/new` / `/risk-assessment/:id/edit` |
| 접근 권한 | SHM+ |

#### 입력 항목

| 필드 | 타입 | 필수 | 비고 |
|------|------|------|------|
| 평가 유형 | SELECT | ✅ | 정기/최초/수시 |
| 평가 기법 | SELECT | ✅ | 빈도강도법/체크리스트/WHAT-IF/핵심요인기술법 |
| 체크리스트 선택 | SELECT | 조건부 ✅ | 기법=체크리스트 시만 노출 → RSK04-L에서 선택 |
| 공정 연결 | SELECT | ❌ | PRC01-L에서 선택 |
| 평가 기간 | DATE RANGE | ✅ | |
| 담당자 | USER_SEARCH | ✅ | |
| 컨설팅 대행 | TOGGLE | ❌ | ON 시 컨설팅업체 담당자 선택 |

---

### RSK03-L 개선조치 탭

| 항목 | 내용 |
|------|------|
| 화면 ID | RSK03-L |
| URL | `/risk-assessment?tab=improvement` |
| 접근 권한 | SHM+ |
| ※ | IMP01-L과 동일 데이터. 출처=위험성평가 필터 고정 |

---

### RSK04-L 체크리스트 목록

| 항목 | 내용 |
|------|------|
| 화면 ID | RSK04-L |
| URL | `/risk-assessment?tab=settings` |
| 접근 권한 | SHM+ |

#### 탭 구성

- **내 체크리스트**: 직접 등록/수정/삭제 가능
- **기본 체크리스트**: 안전NOW 제공, 조회만 가능

#### 목록 컬럼

| 컬럼 | 내용 |
|------|------|
| 체크리스트명 | |
| 옵션 유형 | 예/아니오/해당없음 / 양호·보통·미흡 등 |
| 항목 수 | COUNT |
| 관리 | 조회 / 수정 / 삭제 (내 체크리스트만) |

#### checklist_templates 테이블 주요 컬럼

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID PK | |
| `name` | VARCHAR(100) | |
| `scale_type` | ENUM | `yes_no_na` `good_normal_poor` `pass_fail` |
| `is_standard` | BOOLEAN | 기본 체크리스트 여부 |
| `company_id` | UUID FK NULL | NULL이면 표준 |
| `items` | JSON | 항목 배열 |

---

### RSK04-M 체크리스트 등록/수정 모달

| 항목 | 내용 |
|------|------|
| 화면 ID | RSK04-M |
| 접근 권한 | SHM+ |

#### 입력 항목

| 필드 | 타입 | 필수 |
|------|------|------|
| 체크리스트명 | TEXT | ✅ |
| 옵션 유형 | SELECT | ✅ |
| 항목 목록 | 반복 입력 | ✅ (1개 이상) |
| 항목명 | TEXT | ✅ |
| 항목 설명 | TEXT | ❌ |

---

## 2. TBM (TBM)

### TBM01-L TBM 목록 탭

| 항목 | 내용 |
|------|------|
| 화면 ID | TBM01-L |
| URL | `/tbm` |
| 접근 권한 | SHM+ (원청 전체) / SUB (자사 TBM만) |
| 기본 진입 화면 | ✅ |

#### 레이아웃

```
┌────────────────────────────────────────────────────┐
│ TBM                                                │
│ [TBM 목록] [스케줄] [그룹]                          │ ← 탭
│                                                    │
│ [원청 TBM] [도급업체 TBM]                           │ ← 서브탭
│                                                    │
│ 필터: [검색구분▼] [시작일~종료일] [검색어]            │
│ 버튼: [스케줄 싱크] [+ 등록]                        │
│                                                    │
│ 번호 | 작업일자 | 진행시간 | 작업종류 | 장소         │
│ TBM리더 | 참여자 | 상태 | 관리                      │
└────────────────────────────────────────────────────┘
```

#### tbm_records 테이블 주요 컬럼

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID PK | |
| `site_id` | UUID FK | |
| `tbm_group_id` | UUID FK | |
| `leader_id` | UUID FK | TBM 리더 |
| `work_date` | DATE | 작업일자 |
| `start_time` | TIME | |
| `end_time` | TIME | |
| `duration_minutes` | INTEGER | 진행시간 (분) |
| `work_type` | VARCHAR(100) | 작업종류 |
| `location` | VARCHAR(100) | TBM 장소 |
| `status` | ENUM(`DRAFT`, `DONE`) | |
| `is_subcontractor` | BOOLEAN | 도급업체 TBM 여부 |
| `company_id` | UUID FK | 도급업체 TBM인 경우 해당 업체 |

#### 원청/도급업체 탭 분기 로직

```
[원청 TBM 탭]
is_subcontractor = false
접근: SHM+ (원청 사업장 전체 조회 가능)

[도급업체 TBM 탭]
is_subcontractor = true
접근:
  - SHM+ → 연결된 모든 도급업체 TBM 조회 가능 (읽기전용)
  - SUB  → 자사 company_id 기준 TBM만 조회/작성 가능
```

#### 스케줄 싱크 동작

```
스케줄 싱크 버튼 클릭:
tbm_schedules에서 오늘 날짜 해당하는 스케줄 확인
→ tbm_records에 없는 항목 자동 생성 (status='DRAFT')
→ 생성된 레코드 수 토스트 메시지로 안내
```

---

### TBM01-D TBM 상세/작성

| 항목 | 내용 |
|------|------|
| 화면 ID | TBM01-D |
| URL | `/tbm/:id` |
| 접근 권한 | SHM+ (원청) / SUB (자사 TBM만) |
| 진입 경로 | TBM01-L 행 클릭 / TBM01-F 저장 후 |

#### 섹션 구성

```
1. 문서 정보 (읽기전용 헤더)
   문서명 | 사업장 | 대분류 | 중분류 | 이행기간

2. TBM 기본정보
   TBM일자 / 시작시간 / 종료시간 / TBM그룹
   TBM리더 / 작업종류 / TBM장소 / 작업내용
   [작업날짜 동일 체크박스]

3. 위험성평가 연동 (토글)
   ON: 연결된 공정의 위험성평가 결과 불러오기

4. 잠재위험요인 및 대책
   [+ 행 추가]
   중점위험요인 체크 / 잠재위험요인 / 대책

5. 작업 전 안전조치 확인
   잠재위험요인(중점위험 포함) 자동 표시
   조치여부 (예/아니오) / 미조치 시 조치내용

6. TBM 결과
   작업일 안전점검 사항
   작업 후 종료미팅(중점 피드백) 내용

7. 문서 업로드 (토글)
   관련 문서 파일 첨부

8. 이전 문서 참고
   직전 TBM 내용 불러오기

9. 참석자 전자서명 관리 (토글)
   서명 대상 / 서명 기간
   참석자별 서명 현황 (전체/완료/미완료)
```

#### 안전보건교육 시간 자동 합산 로직

```
TBM 상태가 DONE으로 변경 시:
education_time_records 테이블에 자동 INSERT
- user_id: TBM 참석자별
- source_type: 'tbm'
- source_id: tbm_record_id
- hours: duration_minutes / 60
```

---

### TBM01-F TBM 등록

| 항목 | 내용 |
|------|------|
| 화면 ID | TBM01-F |
| URL | `/tbm/new` |
| 접근 권한 | SHM+, SUB |

TBM01-D와 동일 구성. 신규 등록 시 사용.

---

### TBM02-L TBM 스케줄 탭

| 항목 | 내용 |
|------|------|
| 화면 ID | TBM02-L |
| URL | `/tbm?tab=schedule` |
| 접근 권한 | SHM+ |

#### 목록 컬럼

| 컬럼 | 내용 |
|------|------|
| 스케줄 제목 | |
| 주기 | 매일/주간/월간 |
| 작업종류 | |
| TBM장소 | |
| TBM그룹 | |
| 관리 | 수정 / 삭제 |

#### tbm_schedules 테이블 주요 컬럼

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID PK | |
| `site_id` | UUID FK | |
| `title` | VARCHAR(100) | |
| `frequency` | ENUM(`daily`, `weekly`, `monthly`) | |
| `start_date` | DATE | |
| `end_date` | DATE | |
| `start_time` | TIME | |
| `end_time` | TIME | |
| `work_type` | VARCHAR(100) | |
| `location` | VARCHAR(100) | |
| `tbm_group_id` | UUID FK | |

---

### TBM02-M TBM 스케줄 등록 모달

| 항목 | 내용 |
|------|------|
| 화면 ID | TBM02-M |
| 접근 권한 | SHM+ |

#### 입력 항목

| 필드 | 타입 | 필수 |
|------|------|------|
| 스케줄 제목 | TEXT | ✅ |
| 주기 | SELECT (매일/주간/월간) | ✅ |
| 시작일 ~ 종료일 | DATE RANGE | ✅ |
| TBM 시작시간 | TIME | ✅ |
| TBM 종료시간 | TIME | ✅ |
| 작업종류 | TEXT | ✅ |
| 작업내용 | TEXTAREA | ❌ |
| TBM 장소 | TEXT | ✅ |
| TBM 그룹 | SELECT | ✅ |

---

### TBM03-L TBM 그룹 탭

| 항목 | 내용 |
|------|------|
| 화면 ID | TBM03-L |
| URL | `/tbm?tab=group` |
| 접근 권한 | SHM+ |

#### 목록 컬럼

| 컬럼 | 데이터 소스 |
|------|-----------|
| 그룹명 | `tbm_groups.name` |
| 유형 | `tbm_groups.group_type` (작업조 등) |
| 리더 | `users.name` (leader_id join) |
| 멤버 수 | `tbm_group_members` COUNT |
| 생성일 | `tbm_groups.created_at` |
| TBM 누적시간 | `tbm_records.duration_minutes` SUM |

#### tbm_groups 테이블 주요 컬럼

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID PK | |
| `site_id` | UUID FK | |
| `name` | VARCHAR(100) | |
| `group_type` | VARCHAR(50) | 작업조 등 |
| `leader_id` | UUID FK | 관리감독자(부서장) |
| `process_id` | UUID FK NULL | 연결 공정 |

---

### TBM03-F TBM 그룹 등록/수정

| 항목 | 내용 |
|------|------|
| 화면 ID | TBM03-F |
| URL | `/tbm/group/new` / `/tbm/group/:id/edit` |
| 접근 권한 | SHM+ |

#### 입력 항목

| 필드 | 타입 | 필수 | 비고 |
|------|------|------|------|
| 그룹명 | TEXT | ✅ | |
| 유형 | SELECT | ✅ | |
| 설명 | TEXTAREA | ❌ | |
| TBM 리더 | USER_SEARCH | ✅ | 관리감독자(부서장)만 선택 가능 |
| 공정 연결 | SELECT | ❌ | PRC01-L에서 선택 |

#### 공정 연결 시 멤버 자동 로드 로직

```
process_id 선택 시:
process_workers 테이블에서 해당 공정 근로자 조회
→ tbm_group_members 자동 생성
→ 화면에 멤버 목록 표시

개별 제외: 특정 멤버 삭제 버튼
개별 추가: + 인원 추가 버튼 (조직도 검색)
```

---

## 변경 이력

| 버전 | 날짜 | 내용 |
|------|------|------|
| v1.0 | 2026-04-29 | 최초 작성 |

