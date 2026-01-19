/**
 * @file RFQFormModal.tsx
 * @description Modal สร้าง RFQ ตาม Transaction Flow: PR Approved → Create RFQ
 * @layout 4 Sections: เลือก PR, ข้อมูล Header, รายการสินค้า, เลือกผู้ขาย
 */

import { useState } from 'react';
import { X, FileText, Send, ChevronRight, Mail, Phone, Check } from 'lucide-react';
import { styles } from '../../../../constants';

// ====================================================================================
// TYPES
// ====================================================================================

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface ApprovedPR {
  pr_id: string;
  pr_no: string;
  required_date: string;
  branch_name: string;
  lines: PRLine[];
}

interface PRLine {
  item_code: string;
  item_name: string;
  description: string;
  quantity: number;
  uom: string;
  needed_date: string;
}

interface Vendor {
  vendor_id: string;
  vendor_code: string;
  vendor_name: string;
  email: string;
  phone: string;
}

interface FormData {
  pr_id: string;
  branch_name: string;
  rfq_date: string;
  quote_due_date: string;
  send_via: 'email' | 'portal';
  terms_and_conditions: string;
  selected_vendors: string[];
}

// ====================================================================================
// MOCK DATA
// ====================================================================================

const MOCK_APPROVED_PRS: ApprovedPR[] = [
  {
    pr_id: 'pr-001',
    pr_no: 'PR-202601-002',
    required_date: '2569-02-01',
    branch_name: 'สำนักงานใหญ่',
    lines: [
      {
        item_code: 'ITM-002',
        item_name: 'เก้าอี้สำนักงานเออร์โกโนมิค',
        description: 'เก้าอี้สำนักงานเออร์โกโนมิค รุ่นพรีเมียม',
        quantity: 10,
        uom: 'ตัว',
        needed_date: '2569-02-01',
      },
    ],
  },
  {
    pr_id: 'pr-002',
    pr_no: 'PR-202601-003',
    required_date: '2569-02-15',
    branch_name: 'สาขาเชียงใหม่',
    lines: [
      {
        item_code: 'ITM-005',
        item_name: 'โต๊ะทำงานปรับระดับ',
        description: 'โต๊ะทำงานปรับระดับไฟฟ้า',
        quantity: 5,
        uom: 'ตัว',
        needed_date: '2569-02-15',
      },
    ],
  },
];

const MOCK_VENDORS: Vendor[] = [
  {
    vendor_id: 'v1',
    vendor_code: 'VEN001',
    vendor_name: 'บริษัท เทคโนโลยีดิจิทัล จำกัด',
    email: 'sales@techdigital.co.th',
    phone: '02-123-4567',
  },
  {
    vendor_id: 'v2',
    vendor_code: 'VEN002',
    vendor_name: 'ห้างหุ้นส่วนจำกัด สยาม ซัพพลาย',
    email: 'info@siamsupply.com',
    phone: '02-234-5678',
  },
  {
    vendor_id: 'v3',
    vendor_code: 'VEN003',
    vendor_name: 'Global Trading Co., Ltd.',
    email: 'contact@globaltrading.com',
    phone: '02-345-6789',
  },
];

const DEFAULT_TERMS = `1. ราคาที่เสนอต้องรวมภาษีมูลค่าเพิ่ม 7%
2. ระบุระยะเวลาการส่งมอบสินค้า (Lead Time)
3. เงื่อนไขการชำระเงิน
4. ระยะเวลาที่ราคาเสนอมีผลบังคับใช้ (Valid Until)
5. ระบุยี่ห้อและรุ่นของสินค้าที่เสนอ
6. เงื่อนไขการรับประกัน (Warranty)`;

// ====================================================================================
// COMPONENT
// ====================================================================================

export function RFQFormModal({ isOpen, onClose }: Props) {
  const [formData, setFormData] = useState<FormData>({
    pr_id: '',
    branch_name: '',
    rfq_date: new Date().toISOString().split('T')[0],
    quote_due_date: '',
    send_via: 'email',
    terms_and_conditions: DEFAULT_TERMS,
    selected_vendors: [],
  });

  const selectedPR = MOCK_APPROVED_PRS.find(pr => pr.pr_id === formData.pr_id);

  if (!isOpen) return null;

  const handlePRSelect = (pr: ApprovedPR) => {
    setFormData(prev => ({
      ...prev,
      pr_id: pr.pr_id,
      branch_name: pr.branch_name,
    }));
  };

  const handleVendorToggle = (vendorId: string) => {
    setFormData(prev => ({
      ...prev,
      selected_vendors: prev.selected_vendors.includes(vendorId)
        ? prev.selected_vendors.filter(id => id !== vendorId)
        : [...prev.selected_vendors, vendorId]
    }));
  };

  const handleSubmit = () => {
    console.log('Create RFQ:', formData);
    onClose();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* ==================== HEADER ==================== */}
        <div className="bg-gradient-to-r from-pink-500 to-pink-600 p-5 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">สร้าง RFQ (Request for Quotation)</h2>
            <p className="text-pink-100 text-sm">ส่งขอใบเสนอราคาจากผู้ขาย</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* ==================== CONTENT (Scrollable) ==================== */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* ---------- Section 1: เลือก PR ที่ Approved ---------- */}
          <section>
            <h3 className="text-lg font-bold text-blue-700 dark:text-blue-400 mb-3">
              1. เลือก PR ที่ Approved แล้ว
            </h3>
            <div className="space-y-2">
              {MOCK_APPROVED_PRS.map(pr => (
                <div
                  key={pr.pr_id}
                  onClick={() => handlePRSelect(pr)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.pr_id === pr.pr_id
                      ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-pink-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText size={20} className="text-pink-500" />
                      <span className="font-semibold text-gray-900 dark:text-white">{pr.pr_no}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        วันที่ต้องการ: {formatDate(pr.required_date)}
                      </span>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                        Approved
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ---------- Section 2: ข้อมูล RFQ Header ---------- */}
          <section>
            <h3 className="text-lg font-bold text-blue-700 dark:text-blue-400 mb-3">
              2. ข้อมูล RFQ Header
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={styles.label}>สาขา *</label>
                <input
                  type="text"
                  value={formData.branch_name || (selectedPR?.branch_name ?? '')}
                  readOnly
                  className={`${styles.input} bg-gray-100 cursor-not-allowed`}
                  placeholder="เลือก PR ก่อน"
                />
              </div>
              <div>
                <label className={styles.label}>วันที่ออก RFQ *</label>
                <input
                  type="date"
                  value={formData.rfq_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, rfq_date: e.target.value }))}
                  className={styles.input}
                />
              </div>
              <div>
                <label className={styles.label}>กำหนดส่งใบเสนอราคา (Quote Due Date) *</label>
                <input
                  type="date"
                  value={formData.quote_due_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, quote_due_date: e.target.value }))}
                  className={styles.input}
                />
              </div>
              <div>
                <label className={styles.label}>ส่งทาง (Send Via) *</label>
                <select
                  value={formData.send_via}
                  onChange={(e) => setFormData(prev => ({ ...prev, send_via: e.target.value as 'email' | 'portal' }))}
                  className={styles.input}
                >
                  <option value="email">Email</option>
                  <option value="portal">Portal</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className={styles.label}>Terms and Conditions (เงื่อนไขและข้อกำหนด)</label>
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
                <pre className="text-sm text-blue-800 dark:text-blue-300 whitespace-pre-wrap font-sans">
                  {formData.terms_and_conditions}
                </pre>
              </div>
            </div>
          </section>

          {/* ---------- Section 3: รายการสินค้า (RFQ Lines) ---------- */}
          <section>
            <h3 className="text-lg font-bold text-blue-700 dark:text-blue-400 mb-3">
              3. รายการสินค้า (RFQ Lines)
            </h3>
            {selectedPR ? (
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 dark:text-gray-300">ลำดับ</th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 dark:text-gray-300">รหัสสินค้า</th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 dark:text-gray-300">ชื่อสินค้า</th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 dark:text-gray-300">คำอธิบาย</th>
                      <th className="px-3 py-2 text-center text-xs font-bold text-gray-600 dark:text-gray-300">จำนวน</th>
                      <th className="px-3 py-2 text-center text-xs font-bold text-gray-600 dark:text-gray-300">วันที่ต้องการ</th>
                      <th className="px-3 py-2 text-center text-xs font-bold text-gray-600 dark:text-gray-300">TECHNICAL SPEC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {selectedPR.lines.map((line, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">{idx + 1}</td>
                        <td className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white">{line.item_code}</td>
                        <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">{line.item_name}</td>
                        <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">{line.description}</td>
                        <td className="px-3 py-2 text-sm text-center text-gray-700 dark:text-gray-300">
                          {line.quantity} {line.uom}
                        </td>
                        <td className="px-3 py-2 text-sm text-center text-gray-700 dark:text-gray-300">
                          {formatDate(line.needed_date)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button className="px-3 py-1 text-xs text-pink-600 hover:text-pink-700 border border-pink-300 rounded hover:bg-pink-50 transition-colors">
                            ระบุข้อกำหนดทางเทคนิค
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg">
                กรุณาเลือก PR ก่อนเพื่อดูรายการสินค้า
              </div>
            )}
          </section>

          {/* ---------- Section 4: เลือกผู้ขาย ---------- */}
          <section>
            <h3 className="text-lg font-bold text-blue-700 dark:text-blue-400 mb-3">
              4. เลือกผู้ขายที่จะส่ง RFQ ({formData.selected_vendors.length} ราย)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {MOCK_VENDORS.map(vendor => {
                const isSelected = formData.selected_vendors.includes(vendor.vendor_id);
                return (
                  <div
                    key={vendor.vendor_id}
                    onClick={() => handleVendorToggle(vendor.vendor_id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all relative ${
                      isSelected
                        ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-pink-300'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                        <Check size={14} className="text-white" />
                      </div>
                    )}
                    <h4 className="font-bold text-gray-900 dark:text-white mb-1">{vendor.vendor_name}</h4>
                    <p className="text-xs text-pink-600 dark:text-pink-400 mb-2">{vendor.vendor_code}</p>
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Mail size={14} />
                        <span>{vendor.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={14} />
                        <span>{vendor.phone}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

        </div>

        {/* ==================== FOOTER ==================== */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
          >
            ยกเลิก
          </button>
          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              className="px-5 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              บันทึกร่าง
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formData.pr_id || formData.selected_vendors.length === 0}
              className="px-5 py-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
              ส่งไปยังผู้ขาย
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
