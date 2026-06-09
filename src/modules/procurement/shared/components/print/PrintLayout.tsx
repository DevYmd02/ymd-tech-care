import React from 'react';
import { useAuth } from '@/core/auth/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { bahtText } from '@/shared/utils/baht-text';
import { fmtMoneyTH } from '@/shared/utils/format-th';
import './print-styles.css';

// Centralized company info matching prompt
const COMPANY = {
  name: "บริษัท ยังค์มีดี ฟิวเจอร์ กรุพ จำกัด",
  addr: "55/5 ถ.บางขุนเทียน-ชายทะเล แขวงแสมดำ เขตบางขุนเทียน กรุงเทพ 10150",
  tel:  "โทร. 02 415 3555  โทรสาร 02 415 5115  เลขประจำตัวผู้เสียภาษีอากร 0105533024416",
};

// 1. PrintAuthGate - Prevents unauthenticated access
export function PrintAuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// 2. PrintToolbar - Back and Print controls with Live Configuration Sliders
const DEFAULT_CONFIG = {
  fontFamily: '"Sarabun", "TH Sarabun New", sans-serif',
  baseSize: 11,      // pt
  headerMt: 8,       // mm
  nameSize: 16,      // pt
  nameMb: 12,        // px
  addrSize: 10,      // pt
  addrLh: 1.8,       // line-height multiplier
  tableSize: 9.5,    // pt
  paddingTop: 16,    // mm
  paddingBottom: 18, // mm
  paddingLeftRight: 14, // mm
};

export function PrintToolbar() {
  const navigate = useNavigate();
  const [showConfig, setShowConfig] = React.useState(false);
  const [config, setConfig] = React.useState(() => {
    const saved = localStorage.getItem('ymd_print_layout_config');
    if (saved) {
      try {
        return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      } catch {
        // ignore
      }
    }
    return DEFAULT_CONFIG;
  });

  React.useEffect(() => {
    localStorage.setItem('ymd_print_layout_config', JSON.stringify(config));
    const root = document.documentElement;
    root.style.setProperty('--print-font-family', config.fontFamily || '"Sarabun", "TH Sarabun New", sans-serif');
    root.style.setProperty('--print-base-size', `${config.baseSize}pt`);
    root.style.setProperty('--print-header-mt', `${config.headerMt}mm`);
    root.style.setProperty('--print-name-size', `${config.nameSize}pt`);
    root.style.setProperty('--print-name-mb', `${config.nameMb}px`);
    root.style.setProperty('--print-addr-size', `${config.addrSize}pt`);
    root.style.setProperty('--print-addr-lh', `${config.addrLh}`);
    root.style.setProperty('--print-table-size', `${config.tableSize}pt`);
    root.style.setProperty('--print-page-padding-top', `${config.paddingTop}mm`);
    root.style.setProperty('--print-page-padding-bottom', `${config.paddingBottom}mm`);
    root.style.setProperty('--print-page-padding-left-right', `${config.paddingLeftRight}mm`);
  }, [config]);

  const resetConfig = () => {
    setConfig(DEFAULT_CONFIG);
  };

  const handleSliderChange = (key: keyof typeof DEFAULT_CONFIG, val: number | string) => {
    setConfig((prev: typeof DEFAULT_CONFIG) => ({ ...prev, [key]: val }));
  };

  return (
    <div className="print-config-container no-print">
      <div className="print-toolbar" style={{ width: '100%', margin: 0 }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-back" onClick={() => navigate(-1)}>
            ← ย้อนกลับ
          </button>
          <button className="btn-config-toggle" onClick={() => setShowConfig(!showConfig)}>
            ⚙️ {showConfig ? 'ซ่อนตั้งค่าการพิมพ์' : 'ตั้งค่าการพิมพ์'}
          </button>
        </div>
        <button className="btn-print" onClick={() => window.print()}>
          พิมพ์ / Save PDF
        </button>
      </div>

      {showConfig && (
        <div className="print-config-panel">
          <div className="config-group">
            <label>
              ฟอนต์เอกสาร (Font Family):
            </label>
            <select
              value={config.fontFamily}
              onChange={(e) => handleSliderChange('fontFamily', e.target.value)}
              style={{
                padding: '6px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '10pt',
                cursor: 'pointer',
                background: '#fff'
              }}
            >
              <option value={'"Sarabun", "TH Sarabun New", sans-serif'}>Sarabun / TH Sarabun New (มาตรฐาน)</option>
              <option value={'"Prompt", sans-serif'}>Prompt (โมเดิร์นไม่มีหัว)</option>
              <option value={'"Noto Sans Thai", sans-serif'}>Noto Sans Thai (เรียบง่าย)</option>
              <option value={'"Angsana New", "AngsanaUPC", CordiaUPC, Angsana, serif'}>Angsana New / AngsanaUPC (คลาสสิกมีหัว)</option>
              <option value={'"Cordia New", "CordiaUPC", Cordia, sans-serif'}>Cordia New / CordiaUPC</option>
              <option value={'"Tahoma", sans-serif'}>Tahoma (เรียบเล็ก)</option>
            </select>
          </div>

          <div className="config-group">
            <label>
              ขนาดตัวอักษรทั้งหมด (Base Font Size):
            </label>
            <select
              value={config.baseSize}
              onChange={(e) => handleSliderChange('baseSize', Number(e.target.value))}
              style={{
                padding: '6px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '10pt',
                cursor: 'pointer',
                background: '#fff'
              }}
            >
              <option value={10}>10 pt</option>
              <option value={11}>11 pt (มาตรฐาน)</option>
              <option value={12}>12 pt</option>
              <option value={13}>13 pt</option>
              <option value={14}>14 pt</option>
              <option value={15}>15 pt</option>
              <option value={16}>16 pt (ใหญ่)</option>
              <option value={17}>17 pt</option>
              <option value={18}>18 pt</option>
              <option value={20}>20 pt</option>
            </select>
          </div>

          <div className="config-group">
            <label>
              ระยะหัวกระดาษด้านบน: <span>{config.headerMt} mm</span>
            </label>
            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={config.headerMt}
              onChange={(e) => handleSliderChange('headerMt', Number(e.target.value))}
            />
          </div>

          <div className="config-group">
            <label>
              ขนาดชื่อบริษัท: <span>{config.nameSize} pt</span>
            </label>
            <input
              type="range"
              min="10"
              max="24"
              step="0.5"
              value={config.nameSize}
              onChange={(e) => handleSliderChange('nameSize', Number(e.target.value))}
            />
          </div>

          <div className="config-group">
            <label>
              ระยะห่างชื่อบริษัทกับที่อยู่: <span>{config.nameMb} px</span>
            </label>
            <input
              type="range"
              min="2"
              max="40"
              step="1"
              value={config.nameMb}
              onChange={(e) => handleSliderChange('nameMb', Number(e.target.value))}
            />
          </div>

          <div className="config-group">
            <label>
              ขนาดตัวอักษรที่อยู่/ติดต่อ: <span>{config.addrSize} pt</span>
            </label>
            <input
              type="range"
              min="8"
              max="16"
              step="0.5"
              value={config.addrSize}
              onChange={(e) => handleSliderChange('addrSize', Number(e.target.value))}
            />
          </div>

          <div className="config-group">
            <label>
              ระยะบรรทัดที่อยู่/ติดต่อ: <span>{config.addrLh}</span>
            </label>
            <input
              type="range"
              min="1"
              max="3"
              step="0.1"
              value={config.addrLh}
              onChange={(e) => handleSliderChange('addrLh', Number(e.target.value))}
            />
          </div>

          <div className="config-group">
            <label>
              ขนาดตัวอักษรในตาราง: <span>{config.tableSize} pt</span>
            </label>
            <input
              type="range"
              min="7"
              max="14"
              step="0.5"
              value={config.tableSize}
              onChange={(e) => handleSliderChange('tableSize', Number(e.target.value))}
            />
          </div>

          <div className="config-group">
            <label>
              ระยะขอบกระดาษด้านบน: <span>{config.paddingTop} mm</span>
            </label>
            <input
              type="range"
              min="2"
              max="40"
              step="1"
              value={config.paddingTop}
              onChange={(e) => handleSliderChange('paddingTop', Number(e.target.value))}
            />
          </div>

          <div className="config-group">
            <label>
              ระยะขอบกระดาษด้านล่าง: <span>{config.paddingBottom} mm</span>
            </label>
            <input
              type="range"
              min="2"
              max="40"
              step="1"
              value={config.paddingBottom}
              onChange={(e) => handleSliderChange('paddingBottom', Number(e.target.value))}
            />
          </div>

          <div className="config-group">
            <label>
              ระยะขอบซ้าย-ขวา: <span>{config.paddingLeftRight} mm</span>
            </label>
            <input
              type="range"
              min="2"
              max="40"
              step="1"
              value={config.paddingLeftRight}
              onChange={(e) => handleSliderChange('paddingLeftRight', Number(e.target.value))}
            />
          </div>

          <div className="config-group" style={{ justifyContent: 'flex-end' }}>
            <button className="btn-reset" onClick={resetConfig}>
              รีเซ็ตค่าเริ่มต้น
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// 3. A4Page - Main page container with Company Header
// Splits children automatically into a4-body and a4-bottom (SignatureRow/TermsBlock)
export function A4Page({ children, pageNo = 1, pageTotal = 1 }: { children: React.ReactNode; pageNo?: number; pageTotal?: number }) {
  const arr = React.Children.toArray(children).flat(Infinity).filter(Boolean) as React.ReactElement[];
  const bottomTypes = new Set<unknown>([SignatureRow, TermsBlock]);
  
  let splitIdx = arr.length;
  for (let i = arr.length - 1; i >= 0; i--) {
    const child = arr[i];
    if (child && child.type && bottomTypes.has(child.type)) {
      splitIdx = i;
    } else {
      break;
    }
  }

  return (
    <div className="a4-page">
      <div className="a4-page-no">
        หน้า {pageNo} / {pageTotal}
      </div>
      <CompanyHeader />
      <div className="a4-body">{arr.slice(0, splitIdx)}</div>
      {splitIdx < arr.length && <div className="a4-bottom">{arr.slice(splitIdx)}</div>}
    </div>
  );
}

// 4. CompanyHeader - Centralized company info
export function CompanyHeader() {
  return (
    <div className="company-header">
      <div className="company-name">{COMPANY.name}</div>
      <div className="company-addr">
        {COMPANY.addr}
        <br />
        {COMPANY.tel}
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
  value?: React.ReactNode;
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

// 7. ItemsTable - Grid table for items list with spacer-row
export function ItemsTable({
  columns,
  rows,
  minRows = 4,
}: {
  columns: PrintCol[];
  rows: PrintRow[];
  minRows?: number;
}) {
  const emptyRowCount = Math.max(0, minRows - rows.length);
  const emptyRows = Array.from({ length: emptyRowCount });

  return (
    <table className="items-table">
      <colgroup>
        {columns.map((col) => (
          <col key={col} style={{ width: COLUMN_WIDTHS[col] }} />
        ))}
      </colgroup>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col} className={COLUMN_CLASSES[col]}>
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
                cellValue = row[col] != null ? fmtMoneyTH(Number(row[col])) : '';
              } else if (col === 'discount') {
                cellValue = row[col] != null ? (typeof row[col] === 'number' ? fmtMoneyTH(Number(row[col])) : row[col]) : '';
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
        <tr className="spacer-row" aria-hidden>
          {columns.map((col) => (
            <td key={col}>&nbsp;</td>
          ))}
        </tr>
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
            <div className="notes-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <strong>หมายเหตุ</strong>
              {costCode && <span style={{ fontWeight: 'normal' }}>รหัสค่าใช้จ่าย &nbsp;{costCode}</span>}
            </div>
            <div className="notes-content" style={{ minHeight: '60px', whiteSpace: 'pre-wrap' }}>
              {notes || '-'}
            </div>
          </td>
          <td className="sum-label">รวมเงิน</td>
          <td className="sum-value">{fmtMoneyTH(subtotal)}</td>
        </tr>
        <tr>
          <td className="sum-label">ส่วนลดสินค้า(เป็นเงิน)</td>
          <td className="sum-value">{discount > 0 ? fmtMoneyTH(discount) : ''}</td>
        </tr>
        <tr>
          <td className="sum-label">เงินหลังหักส่วนลด</td>
          <td className="sum-value">{fmtMoneyTH(afterDiscount)}</td>
        </tr>
        <tr>
          <td className="sum-label">ภาษีมูลค่าเพิ่ม {vatRate}%</td>
          <td className="sum-value">{fmtMoneyTH(vat)}</td>
        </tr>
        <tr>
          <td className="baht-cell" style={{ textAlign: 'center', fontWeight: 'normal' }}>
            ( {thaiText} )
          </td>
          <td className="sum-label grand">จำนวนเงินทั้งสิ้น</td>
          <td className="sum-value grand">{fmtMoneyTH(grandTotal)}</td>
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
          <div className="sig-date">
            วันที่ <span className="u"></span> / <span className="u"></span> / <span className="u yr"></span>
          </div>
        </div>
      ))}
    </div>
  );
}
