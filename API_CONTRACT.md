# 📋 API Contract - YMD Tech Care ERP

> **เอกสารนี้ใช้สำหรับ:** ตกลงรูปแบบ API ระหว่าง Frontend และ Backend  
> **สถานะ:** Draft v1.0  
> **อัปเดตล่าสุด:** 13 มกราคม 2569

---

## 🔧 Global Configuration

| Item            | Value                         |
| --------------- | ----------------------------- |
| Base URL (Dev)  | `http://localhost:3000/api`   |
| Base URL (Prod) | `https://api.ymd-erp.com/api` |
| Authentication  | JWT Bearer Token              |
| Content-Type    | `application/json`            |

### Standard Response Format

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [{ "field": "email", "message": "Email is required" }]
  }
}
```

---

## 🔐 1. Authentication Module

### POST `/auth/login`

**Purpose:** Login ผู้ใช้งาน

**Request:**

```json
{
  "email": "user@company.com",
  "password": "password"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "user@company.com",
      "name": "สมชาย ใจดี",
      "role": "ADMIN",
      "department": "IT"
    }
  }
}
```

### POST `/auth/register`

**Request:**

```json
{
  "email": "newuser@company.com",
  "password": "password123",
  "name": "สมหญิง รักงาน",
  "department": "จัดซื้อ"
}
```

### POST `/auth/refresh`

**Request:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 📄 2. Purchase Requisition (PR) Module

### GET `/pr`

**Purpose:** ดึงรายการ PR ทั้งหมด พร้อม Filter

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| page | number | No | หน้าที่ต้องการ (default: 1) |
| limit | number | No | จำนวนต่อหน้า (default: 20) |
| status | string | No | `รออนุมัติ`, `อนุมัติแล้ว`, `ยกเลิก` |
| dateFrom | string | No | วันที่เริ่มต้น (YYYY-MM-DD) |
| dateTo | string | No | วันที่สิ้นสุด (YYYY-MM-DD) |
| search | string | No | ค้นหาจาก doc_no, requester |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "doc_no": "PR2026-001",
      "date": "2026-01-15",
      "requester": {
        "id": 5,
        "name": "สมชาย ใจดี",
        "position": "พนักงาน"
      },
      "department": "IT",
      "status": "รออนุมัติ",
      "itemCount": 3,
      "totalAmount": 45000,
      "pendingApprover": {
        "id": 2,
        "name": "นายใหญ่ มากเงิน",
        "position": "ผจก.ฝ่ายจัดซื้อ"
      }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 50 }
}
```

---

### GET `/pr/:id`

**Purpose:** ดึงรายละเอียด PR ฉบับเต็ม

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "doc_no": "PR2026-001",
    "doc_date": "2026-01-15",
    "status": "รออนุมัติ",
    "vendor": {
      "id": 1,
      "code": "V001",
      "name": "บริษัท ไอทีซัพพลาย จำกัด"
    },
    "requester": {
      "id": 5,
      "name": "สมชาย ใจดี",
      "position": "พนักงาน",
      "department": "IT"
    },
    "dueDate": "2026-01-22",
    "isHold": false,
    "remarks": "",
    "vatRate": 7,
    "discountAmount": 0,
    "items": [
      {
        "id": 1,
        "product": {
          "id": 1,
          "code": "A001",
          "name": "เครื่องพิมพ์ HP LaserJet"
        },
        "warehouse": "WH",
        "location": "A1",
        "unit": "เครื่อง",
        "qty": 2,
        "price": 8500,
        "discount": 0,
        "lineTotal": 17000
      }
    ],
    "summary": {
      "subtotal": 45000,
      "discount": 0,
      "beforeVat": 45000,
      "vat": 3150,
      "grandTotal": 48150
    }
  }
}
```

---

### POST `/pr`

**Purpose:** สร้าง PR ใหม่

**Request:**

```json
{
  "vendorId": 1,
  "contactName": "คุณสมชาย",
  "dueDays": 7,
  "isHold": false,
  "remarks": "",
  "vatRate": 7,
  "discountAmount": 0,
  "items": [
    {
      "productId": 1,
      "warehouse": "WH",
      "location": "A1",
      "qty": 2,
      "price": 8500,
      "discount": 0
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 10,
    "doc_no": "PR2026-010"
  },
  "message": "สร้างใบขอซื้อสำเร็จ"
}
```

---

### POST `/pr/:id/approve`

**Purpose:** อนุมัติ PR

**Request:**

```json
{
  "remark": "อนุมัติตามกำหนด"
}
```

### POST `/pr/:id/reject`

**Purpose:** ปฏิเสธ PR

**Request:**

```json
{
  "remark": "งบประมาณไม่เพียงพอ"
}
```

---

## 📦 3. Product Module

### GET `/products`

**Query Parameters:** `search`, `category`, `page`, `limit`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "code": "A001",
      "name": "เครื่องพิมพ์ HP LaserJet",
      "detail": "เครื่องพิมพ์เลเซอร์ ขาว-ดำ",
      "warehouse": "WH",
      "location": "A1",
      "unit": "เครื่อง",
      "price": 8500,
      "category": "IT Equipment"
    }
  ]
}
```

---

## 🏢 4. Vendor Module

### GET `/vendors`

**Query Parameters:** `search`, `page`, `limit`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "code": "V001",
      "name": "บริษัท ไอทีซัพพลาย จำกัด",
      "address": "123 ถ.พระราม4 คลองเตย กทม.",
      "contact": "คุณสมชาย",
      "phone": "02-123-4567",
      "taxId": "0105562012345"
    }
  ]
}
```

---

## 👤 5. User Module

### GET `/users/me`

**Purpose:** ดึงข้อมูล User ปัจจุบัน

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@company.com",
    "name": "สมชาย ใจดี",
    "role": "ADMIN",
    "department": "IT",
    "permissions": ["pr.create", "pr.approve", "pr.view"]
  }
}
```

---

## 📊 Enums & Constants

### User Roles

```typescript
type Role = "ADMIN" | "MANAGER" | "USER";
```

### PR Status

```typescript
type PRStatus = "รออนุมัติ" | "อนุมัติแล้ว" | "ยกเลิก";
```

### HTTP Status Codes

| Code | Meaning                                |
| ---- | -------------------------------------- |
| 200  | Success                                |
| 201  | Created                                |
| 400  | Bad Request (Validation Error)         |
| 401  | Unauthorized (ไม่มี Token หรือหมดอายุ) |
| 403  | Forbidden (ไม่มีสิทธิ์)                |
| 404  | Not Found                              |
| 500  | Server Error                           |

---

## ✅ Checklist สำหรับ Backend Developer

- [ ] Setup Nest.js project
- [ ] Setup Prisma + PostgreSQL
- [ ] Implement Auth Module (JWT)
- [ ] Implement PR Module (CRUD + Approval)
- [ ] Implement Product Module
- [ ] Implement Vendor Module
- [ ] Setup Swagger documentation
- [ ] Test with Frontend
