# 📡 API Contract - PR Module

> **Version:** 1.0.0
> **Base URL:** `http://localhost:3000` > **Last Updated:** 14 มกราคม 2569

---

## 🔐 Authentication

_(ยังไม่ได้ Implement - รอเชื่อมต่อ)_

```
Authorization: Bearer <token>
```

---

## 📋 Purchase Requisition (PR) Endpoints

### 1. Get PR List

```http
GET /pr
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status (DRAFT, IN_APPROVAL, etc.) |
| `cost_center_id` | string | Filter by cost center |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20) |

**Response:**

```json
{
  "data": [
    {
      "pr_id": "1",
      "pr_no": "PR-202601-0001",
      "request_date": "2026-01-14",
      "required_date": "2026-01-20",
      "requester_name": "นางสาว กรรลิกา สารมาท",
      "cost_center_id": "CC-PROD",
      "purpose": "ซื้อวัตถุดิบ",
      "status": "DRAFT",
      "total_amount": 25000
    }
  ],
  "total": 2,
  "page": 1,
  "limit": 20
}
```

---

### 2. Get PR by ID

```http
GET /pr/:id
```

**Response:**

```json
{
  "pr_id": "1",
  "pr_no": "PR-202601-0001",
  "request_date": "2026-01-14",
  ...
}
```

---

### 3. Create PR

```http
POST /pr
```

**Request Body:**

```json
{
  "request_date": "2026-01-14",
  "required_date": "2026-01-20",
  "requester_name": "สมชาย ใจดี",
  "cost_center_id": "CC-IT",
  "purpose": "ซื้ออุปกรณ์",
  "lines": [
    {
      "item_code": "P001",
      "item_name": "คอมพิวเตอร์",
      "quantity": 5,
      "uom": "เครื่อง",
      "est_unit_price": 25000
    }
  ]
}
```

**Response:**

```json
{
  "pr_id": "3",
  "pr_no": "PR-202601-0003",
  "status": "DRAFT",
  ...
}
```

---

### 4. Update PR

```http
PATCH /pr/:id
```

**Request Body:** (partial update)

```json
{
  "purpose": "แก้ไขวัตถุประสงค์"
}
```

---

### 5. Delete PR

```http
DELETE /pr/:id
```

**Response:**

```json
{
  "success": true
}
```

---

## 🔄 Workflow Endpoints

### 6. Submit PR for Approval

```http
POST /pr/:id/submit
```

**Response:**

```json
{
  "success": true,
  "message": "ส่งอนุมัติสำเร็จ"
}
```

---

### 7. Approve/Reject PR

```http
POST /pr/:id/approve
```

**Request Body:**

```json
{
  "action": "APPROVE", // or "REJECT"
  "remark": "อนุมัติแล้ว"
}
```

---

### 8. Cancel PR

```http
POST /pr/:id/cancel
```

**Request Body:**

```json
{
  "remark": "ยกเลิกเนื่องจาก..."
}
```

---

## 📎 Attachment Endpoints

### 9. Upload Attachment

```http
POST /pr/:id/attachments
Content-Type: multipart/form-data
```

### 10. Delete Attachment

```http
DELETE /pr/:id/attachments/:attachmentId
```

---

## 📌 PR Status Values

| Status                | Description |
| --------------------- | ----------- |
| `DRAFT`               | ร่าง        |
| `SUBMITTED`           | ส่งแล้ว     |
| `IN_APPROVAL`         | รออนุมัติ   |
| `APPROVED`            | อนุมัติแล้ว |
| `REJECTED`            | ปฏิเสธ      |
| `CANCELLED`           | ยกเลิก      |
| `PARTIALLY_CONVERTED` | แปลงบางส่วน |
| `CONVERTED`           | แปลงแล้ว    |
| `CLOSED`              | ปิด         |

---

## ⚠️ Error Response Format

```json
{
  "success": false,
  "message": "เกิดข้อผิดพลาด",
  "error": "VALIDATION_ERROR"
}
```
