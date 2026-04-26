# asset_management - 경량 물품 관리 시스템 📦

> 부서/창고 단위로 흩어진 물품을 한곳에서 추적하기 위해 만든 **경량 자산 관리 시스템**. 인증, 행 단위 보안(RLS), 트랜잭션 기록, QR 발급까지 실제 운용에 필요한 요소를 직접 구현했습니다.

## ✨ 주요 기능

- 🔐 **인증** — NextAuth + Supabase Adapter (소셜 로그인 / 세션)
- 📋 **물품·위치 CRUD** — items / locations(창고·부서) 분리 관리, 수정·삭제 페이지 라우트 분리
- 🗺 **맵 에디터** — 창고 도면 위에 셀 단위로 물품 배치 (`maps/[id]/cells`, `maps/[id]/item-cells`)
- 📊 **재고 & 트랜잭션 로그** — 입출고 흐름을 별도 `tx` 테이블로 기록
- 🔳 **QR 발급** — 물품 상세에서 QR 코드 생성 (`qrcode`)
- 📱 **모바일 드로어 네비게이션** — 좁은 화면에서도 동작하도록 `MobileDrawer` 분리
- ✅ **타입·검증** — react-hook-form + zod로 폼 일관성 확보

## 🛠 기술 스택

| 영역 | 사용 기술 |
|---|---|
| Framework | Next.js 15 (App Router, Turbopack), TypeScript |
| 인증 | NextAuth + `@auth/supabase-adapter` |
| DB | Supabase (PostgreSQL) — Row Level Security 적용 |
| ORM/Schema | Supabase JS, Prisma (보조) |
| 폼 | react-hook-form + zod + `@hookform/resolvers` |
| 데이터 표시 | `@tanstack/react-table` |
| 기타 | `qrcode`, `lucide-react`, Tailwind CSS v4 |

## 🧩 데이터 모델 일부 (Supabase)

`sql.txt`에서 발췌:

```sql
-- items: 물품 마스터
create table public.items (
  id         uuid primary key default gen_random_uuid(),
  sku        text unique not null,
  name       text not null,
  category   text,
  spec       jsonb,
  unit       text default 'ea',
  photo_url  text,
  created_at timestamptz default now()
);

-- locations: 창고 / 부서 (type enum)
create table public.locations (
  id   uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('warehouse','department')),
  code text unique
);

-- 로그인한 사용자만 읽도록 RLS 정책
alter table public.items enable row level security;
create policy "items_read_all" on public.items
  for select using (auth.role() = 'authenticated');
```

> 인증된 사용자에게만 SELECT를 허용하는 RLS 정책을 직접 설계해, **DB 레벨에서의 권한 분리**를 학습했습니다.

## 🗂 디렉토리 구조 (요약)

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts   # NextAuth 진입점
│   │   ├── items/route.ts, [id]/route.ts
│   │   ├── locations/...
│   │   ├── maps/[id]/cells/route.ts      # 맵 셀 단위 API
│   │   ├── maps/[id]/item-cells/route.ts # 물품 배치 API
│   │   ├── stock/route.ts                # 재고
│   │   └── tx/route.ts                   # 트랜잭션 로그
│   ├── items/, locations/, maps/, stock/, tx/   # 각 도메인 페이지
│   └── test/{auth,supabase}/page.tsx     # 동작 확인용 페이지
├── components/
│   ├── AppNav.tsx
│   ├── MobileDrawer.tsx, MobileNavTrigger.tsx
└── lib/
    ├── auth.ts, isAdmin.ts
    ├── supabaseClient.ts, supabaseAdmin.ts
```

- **`supabaseClient` / `supabaseAdmin` 분리**: 클라이언트 키와 서비스 롤 키의 책임을 명확히 구분.
- **`isAdmin` 분리**: 권한 체크 로직을 한 군데로 모아 라우트별 중복 제거.

## 🚀 시작하기

```bash
git clone https://github.com/yonggari-coder/asset_management.git
cd asset_management
pnpm install

# Supabase 프로젝트의 SQL editor에서 sql.txt 내용 실행 후
cp .env.example .env.local   # NEXTAUTH_SECRET / SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE 입력

pnpm dev
```

## 💭 만들면서 배운 것

- **권한을 어디서 막을 것인가**: API 라우트에서만 막으면 클라이언트가 직접 Supabase를 호출하는 순간 무용지물입니다. RLS로 DB까지 내려서 막는 게 안전하다는 걸 직접 느꼈습니다.
- **트랜잭션을 별도 테이블로**: 재고 수치만 두면 "왜 줄었는지"가 사라집니다. `tx` 테이블에 입출고 이력을 남겨 추적 가능성을 확보했습니다.
- **모바일 우선 UX**: 창고에서 폰으로 쓰는 도구를 가정하고, 상단 탭이 아닌 드로어 네비게이션을 별도 컴포넌트로 분리했습니다.
