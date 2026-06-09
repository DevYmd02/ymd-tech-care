import React from 'react';
import { useAuth } from '@/core/auth/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { bahtText } from '@/shared/utils/baht-text';
import { fmtMoneyTH } from '@/shared/utils/format-th';
import './print-styles.css';

// 1. PrintAuthGate - Prevents unauthenticated access
export function PrintAuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// 2. PrintToolbar - Back and Print controls
export function PrintToolbar() {
  const navigate = useNavigate();
  return (
    <div className="print-toolbar no-print">
      <button className="btn-back" onClick={() => navigate(-1)}>
        ← ย้อนกลับ
      </button>
      <button className="btn-print" onClick={() => window.print()}>
        พิมพ์ / Save PDF
      </button>
    </div>
  );
}

// 3. A4Page - Main page container with Company Header
export function A4Page({ children, pageNo, pageTotal }: { children: React.ReactNode; pageNo?: number; pageTotal?: number }) {
  return (
    <div className="a4-page">
      {pageNo && (
        <div className="a4-page-no">
          หน้า {pageNo} / {pageTotal ?? pageNo}
        </div>
      )}
      <CompanyHeader />
      {children}
    </div>
  );
}

// 4. CompanyHeader - Centralized company info
export function CompanyHeader() {
  return (
    <div className="company-header">
      <div className="company-name">บริษัท ยังมีดี เทค แคร์ จำกัด</div>
      <div className="company-addr">
        123/45 ถนนพัฒนาการ แขวงพัฒนาการ เขตสวนหลวง กรุงเทพมหานคร 10250
        <br />
        โทร: 02-123-4567 | เลขประจำตัวผู้เสียภาษี: 0105560000000
      </div>
    </div>
  );
}

// 5. FormTitle - Document Title
export function FormTitle({ title }: { title: string }) {
  return <div className="form-title">{title}</div>;
}

export interface Field {
  label: string;
  value?: string | number | null;
}

// 6. HeaderGrid - Details section with border and vertical separator
export function HeaderGrid({
  topLeft,
  left,
  right,
}: {
  topLeft?: Field;
  left: Field[];
  right: Field[];
}) {
  return (
    <div>
      {topLeft && (
        <div className="vendor-code-row">
          <span className="k">{topLeft.label}</span>
          <span>{topLeft.value ?? '-'}</span>
        </div>
      )}
      <div className="header-block">
        <div className="header-grid">
          <div className="col">
            {left.map((f, idx) => (
              <div key={idx} className="kv">
                <span className="k">{f.label}</span>
                <span>{f.value ?? '-'}</span>
              </div>
            ))}
          </div>
          <div className="col">
            {right.map((f, idx) => (
              <div key={idx} className="kv">
                <span className="k">{f.label}</span>
                <span>{f.value ?? '-'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export type PrintRow = {
  code?: string;
  name?: string;
  marketing?: string;
  warehouse?: string;
  location?: string;
  qty?: number | string;
  qtyApproved?: number | string;
  uom?: string;
  unitPrice?: number;
  discount?: number | string;
  amount?: number;
  extra?: string;
};

export type PrintCol =
  | 'no'
  | 'code'
  | 'name'
  | 'marketing'
  | 'warehouse'
  | 'location'
  | 'qty'
  | 'qtyApproved'
  | 'uom'
  | 'unitPrice'
  | 'discount'
  | 'amount';

const COLUMN_HEADERS: Record<PrintCol, string> = {
  no: 'ลำดับ',
  code: 'รหัสสินค้า',
  name: 'ชื่อสินค้า / รายละเอียด',
  marketing: 'แคมเปญ',
  warehouse: 'คลังสินค้า',
  location: 'ที่เก็บ',
  qty: 'จำนวน',
  qtyApproved: 'อนุมัติ',
  uom: 'หน่วย',
  unitPrice: 'ราคา/หน่วย',
  discount: 'ส่วนลด',
  amount: 'จำนวนเงิน',
};

const COLUMN_CLASSES: Record<PrintCol, string> = {
  no: 'ta-center',
  code: 'ta-left',
  name: 'ta-left',
  marketing: 'ta-left',
  warehouse: 'ta-left',
  location: 'ta-left',
  qty: 'ta-right',
  qtyApproved: 'ta-right',
  uom: 'ta-center',
  unitPrice: 'ta-right',
  discount: 'ta-right',
  amount: 'ta-right',
};

const COLUMN_WIDTHS: Record<PrintCol, string> = {
  no: '6%',
  code: '15%',
  name: '30%',
  marketing: '10%',
  warehouse: '10%',
  location: '10%',
  qty: '8%',
  qtyApproved: '8%',
  uom: '7%',
  unitPrice: '12%',
  discount: '10%',
  amount: '13%',
};

// 7. ItemsTable - Grid table for items list
export function ItemsTable({
  columns,
  rows,
  minRows = 14,
}: {
  columns: PrintCol[];
  rows: PrintRow[];
  minRows?: number;
}) {
  const emptyRowCount = Math.max(0, minRows - rows.length);
  const emptyRows = Array.from({ length: emptyRowCount });

  return (
    <table className="items-table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col} style={{ width: COLUMN_WIDTHS[col] }}>
              {COLUMN_HEADERS[col]}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => (
          <tr key={idx}>
            {columns.map((col) => {
              let cellValue: React.ReactNode = '';
              if (col === 'no') {
                cellValue = idx + 1;
              } else if (col === 'qty' || col === 'qtyApproved') {
                cellValue = row[col] != null ? Number(row[col]).toLocaleString() : '';
              } else if (col === 'unitPrice' || col === 'amount') {
                cellValue = row[col] != null ? fmtMoneyTH(row[col]) : '';
              } else if (col === 'discount') {
                cellValue = row[col] != null ? (typeof row[col] === 'number' ? fmtMoneyTH(row[col]) : row[col]) : '';
              } else {
                cellValue = row[col] ?? '';
              }

              return (
                <td key={col} className={COLUMN_CLASSES[col]}>
                  {cellValue}
                </td>
              );
            })}
          </tr>
        ))}
        {emptyRows.map((_, idx) => (
          <tr key={`empty-${idx}`} className="empty-row">
            {columns.map((col) => (
              <td key={col}>&nbsp;</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// 8. SummaryBlock - Bottom summary block attached to the table
export function SummaryBlock({
  subtotal,
  discount = 0,
  vatRate = 7,
  notes,
  costCode,
}: {
  subtotal: number;
  discount?: number;
  vatRate?: number;
  notes?: string;
  costCode?: string;
}) {
  const afterDiscount = subtotal - discount;
  const vat = (afterDiscount * vatRate) / 100;
  const grandTotal = afterDiscount + vat;
  const thaiText = bahtText(grandTotal);

  return (
    <table className="summary-block">
      <tbody>
        <tr>
          <td className="notes-cell" rowSpan={4}>
            <div><strong>หมายเหตุ:</strong> {notes || '-'}</div>
            {costCode && <div style={{ marginTop: '8px' }}><strong>รหัสค่าใช้จ่าย/ศูนย์ต้นทุน:</strong> {costCode}</div>}
          </td>
          <td className="sum-label">รวมเงิน</td>
          <td className="sum-value">{fmtMoneyTH(subtotal)}</td>
        </tr>
        <tr>
          <td className="sum-label">หักส่วนลด</td>
          <td className="sum-value">{fmtMoneyTH(discount)}</td>
        </tr>
        <tr>
          <td className="sum-label">ภาษีมูลค่าเพิ่ม {vatRate}%</td>
          <td className="sum-value">{fmtMoneyTH(vat)}</td>
        </tr>
        <tr>
          <td className="sum-label grand">จำนวนเงินทั้งสิ้น</td>
          <td className="sum-value grand">{fmtMoneyTH(grandTotal)}</td>
        </tr>
        <tr>
          <td colSpan={3} className="baht-cell">
            ( {thaiText} )
          </td>
        </tr>
      </tbody>
    </table>
  );
}

// 9. TermsBlock - General terms conditions
export function TermsBlock() {
  return (
    <div className="terms-block">
      <strong>เงื่อนไขและข้อกำหนด:</strong>
      <ol style={{ paddingLeft: '20px', margin: '4px 0 0' }}>
        <li>เอกสารนี้ต้องได้รับการลงนามอนุมัติครบถ้วนจึงจะมีผลสมบูรณ์</li>
        <li>กรุณาส่งสินค้าตามวันและเวลาที่กำหนดตามที่ระบุในหัวเอกสาร</li>
        <li>การชำระเงินจะดำเนินการตามรอบและเครดิตที่ได้ตกลงกันไว้</li>
      </ol>
    </div>
  );
}

// 10. SignatureRow - Signatures block
export function SignatureRow({ slots = ['ผู้จัดทำ', 'ผู้ตรวจสอบ', 'ผู้อนุมัติ'] }: { slots?: string[] }) {
  return (
    <div className="sig-row" style={{ gridTemplateColumns: `repeat(${slots.length}, 1fr)` }}>
      {slots.map((s, idx) => (
        <div key={idx} className="sig">
          <div className="sig-line"></div>
          <div className="sig-label">{s}</div>
          <div style={{ fontSize: '9pt', color: '#666', marginTop: '4px' }}>วันที่ ......./......./.......</div>
        </div>
      ))}
    </div>
  );
}
