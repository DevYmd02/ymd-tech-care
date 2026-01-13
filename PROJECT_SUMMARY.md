# 📋 สรุปโปรเจ็ค YMD Tech Care - ERP System

## 🏗️ โครงสร้างโฟลเดอร์ (10/10 Professional Standard)

```
src/
├── assets/          # 🖼️  รูปภาพ, fonts, icons
├── components/      # 🧩 Components (19 files)
│   ├── ui/          #     UI primitives (Card, Button, Input) - 7 files
│   ├── shared/      #     Reusable (Modal, SearchModal) - 4 files
│   └── pr-form/     #     PR Form components - 8 files
├── config/          # ⚙️  Application config
│   └── routes.ts    #     Routes + Sidebar menu
├── constants/       # 📌 Constants ทั้งระบบ (3 files)
│   ├── index.ts     #     Re-exports ทั้งหมด
│   ├── status.ts    #     PR_STATUS, DOC_STATUS, STATUS_COLORS
│   └── styles.ts    #     🎨 Centralized UI styles
├── contexts/        # 🌐 React Context
│   └── ThemeContext.tsx  # Dark/Light Mode
├── hooks/           # 🪝 Custom Hooks (3 files)
│   ├── index.ts     #     Re-exports
│   ├── useLocalStorage.ts
│   └── useDebounce.ts
├── layouts/         # 🖼️  Page Layouts (4 files)
│   ├── MainLayout.tsx    # Main app layout
│   ├── AuthLayout.tsx    # Auth pages layout
│   ├── Sidebar.tsx       # Sidebar navigation
│   └── Header.tsx        # Top header
├── mocks/           # 🗃️  Mock Data (5 files)
│   ├── index.ts     #     Re-exports ทั้งหมด
│   ├── prList.ts    #     🆕 PRItem[], ApproverInfo (ย้ายจาก PRListPage)
│   ├── vendors.ts   #     MOCK_VENDORS
│   ├── products.ts  #     MOCK_PRODUCTS
│   └── vendorDropdown.ts
├── pages/           # 📄 Route pages (8 files)
│   ├── admin/       #     AdminDashboard
│   ├── auth/        #     Login, Register, ForgotPassword
│   ├── procurement/ #     PRListPage
│   ├── roles/       #     Roles Dashboard
│   └── it-governance/
├── services/        # 📡 API Services (3 files)
│   ├── index.ts     #     Re-exports
│   ├── api.ts       #     Axios instance + config
│   └── prService.ts #     PR CRUD operations
├── types/           # 📝 TypeScript Types
│   └── pr-types.ts
├── utils/           # 🛠️  Utility Functions
│   └── dateUtils.ts #     formatThaiDate, formatDateTime
│
├── App.tsx          # Root component
├── App.css          # Global styles
├── main.tsx         # Entry point
└── index.css        # Tailwind directives
```

---

## 📁 รายละเอียดแต่ละโฟลเดอร์

### `components/` - UI Components

| โฟลเดอร์ | หน้าที่ |
|----------|--------|
| `ui/` | Components พื้นฐาน (Card, Input, Toast, StatusBadge) |
| `shared/` | Components ใช้ร่วม (SearchModal, ApprovalModal) |
| `pr-form/` | Components เฉพาะ PR Form |

### `hooks/` - Custom React Hooks

| ไฟล์ | หน้าที่ | ตัวอย่างการใช้ |
|------|--------|---------------|
| `useLocalStorage.ts` | จัดการ localStorage | `const [value, setValue] = useLocalStorage('key', default)` |
| `useDebounce.ts` | Debounce ค่า | `const debouncedSearch = useDebounce(search, 500)` |

### `services/` - API Layer

| ไฟล์ | หน้าที่ |
|------|--------|
| `api.ts` | Axios config + interceptors |
| `prService.ts` | PR CRUD: getList, getById, create, approve, cancel |

### `constants/` - App Constants

| ไฟล์ | หน้าที่ |
|------|--------|
| `index.ts` | Re-exports ทั้งหมด |
| `status.ts` | PR_STATUS, DOC_STATUS, STATUS_COLORS |
| `styles.ts` | 🎨 **Centralized UI Styles** - Card, Table, Badge, Form, Button styles |

### `layouts/` - Page Layouts

| ไฟล์ | หน้าที่ |
|------|--------|
| `MainLayout.tsx` | Layout หลัก (Sidebar + Header + Content) |
| `AuthLayout.tsx` | Layout สำหรับหน้า Login/Register |
| `Sidebar.tsx` | Navigation sidebar |
| `Header.tsx` | Top header + theme toggle |

---

## 🔄 การทำงานของแอป

```
User เข้าเว็บ
    ↓
main.tsx → ThemeProvider → BrowserRouter
    ↓
App.tsx ตรวจสอบ Route
    ↓
┌───────────────────────────────────────────────┐
│ Route ที่ต้อง Auth?                            │
├─────────────────────┬─────────────────────────┤
│ Yes (/login)        │ No (/admin, /pr)        │
│      ↓              │      ↓                  │
│ AuthLayout          │ MainLayout              │
│      ↓              │ (Sidebar + Header)      │
│ LoginPage           │      ↓                  │
│                     │ Page Component          │
└─────────────────────┴─────────────────────────┘
```

---

## 📊 สถานะโมดูล

| โมดูล | สถานะ | Route |
|-------|-------|-------|
| Admin Dashboard | ✅ เสร็จ | `/admin` |
| Authentication | ✅ เสร็จ | `/login`, `/register` |
| PR List + Approval | ✅ เสร็จ | `/procurement/pr` |
| PR Form | ✅ เสร็จ | Modal |
| Roles Dashboard | 🟡 UI only | `/roles` |
| IT Governance | 🟡 UI only | `/it-governance` |
| Inventory | ⏳ Coming Soon | `/inventory` |

---

## 🛠️ คำสั่งพัฒนา

```bash
npm run dev    # Run development server
npm run build  # Build for production
```

---

## 🔮 Future: Backend Integration

**เตรียมพร้อมสำหรับ:** `Nest.js + Prisma ORM + PostgreSQL`

```
Frontend (React)     →  axios  →  Backend (Nest.js)
                                        ↓
                                   Prisma ORM
                                        ↓
                                   PostgreSQL
```

**สิ่งที่ต้องทำตอนต่อ API:**
1. `src/services/api.ts` - เปลี่ยน Base URL
2. `src/services/prService.ts` - เปลี่ยนจาก Mock → API calls
3. Types - Share จาก Prisma schema

---

## 📦 Dependencies

| Package | Purpose |
|---------|---------|
| react | UI Framework |
| react-router-dom | Routing |
| react-hook-form | Form management |
| lucide-react | Icons |
| tailwindcss | Styling |
| typescript | Type safety |
| vite | Build tool |
| axios | HTTP Client (เตรียมไว้) |

---

## 📅 Last Updated

**วันที่อัปเดต:** 13 มกราคม 2569 เวลา 11:19 น.
