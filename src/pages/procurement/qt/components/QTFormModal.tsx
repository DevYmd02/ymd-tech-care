import { useState, useEffect, useRef } from 'react';
import { FileText, Plus, Trash2, Search, X, Save, CheckCircle, Copy, Printer, FileBox, MoreHorizontal } from 'lucide-react';

import { WindowFormLayout } from '../../../../components/shared/WindowFormLayout';
import { SystemAlert } from '../../../../components/shared/SystemAlert';
import type { QuotationHeader, QuotationLine } from '../../../../types/qt-types';
import { masterDataService } from '../../../../services/masterDataService';
import { qtService } from '../../../../services';
import type { UnitMaster } from '../../../../types/master-data-types';
import type { ProductLookup } from '../../../../__mocks__';
import { MOCK_PRODUCTS } from '../../../../__mocks__';
import type { RFQHeader } from '../../../../types/rfq-types';

// ====================================================================================
// TYPES & CONSTANTS
// ====================================================================================

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialRFQ?: RFQHeader | null;
}

// Extend QuotationLine for Form State (handling UI-specific fields)
interface ExtendedQTLine extends Partial<QuotationLine> {
  item_code: string;
  item_name: string;
  qty: number;
  unit_price: number;
  discount_amount: number;
  net_amount: number;
  uom_name: string;
  warehouse?: string; // UI Mock
  location?: string;  // UI Mock
}

const createEmptyLine = (): ExtendedQTLine => ({
  item_code: '',
  item_name: '',
  qty: 0,
  unit_price: 0,
  discount_amount: 0,
  net_amount: 0,
  uom_name: '',
  warehouse: '',
  location: '',
});

const getInitialLines = (count = 5) => Array(count).fill(null).map(() => createEmptyLine());

// ====================================================================================
// COMPONENT
// ====================================================================================

// ====================================================================================
// COMPONENT
// ====================================================================================

const QTFormModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, initialRFQ }) => {
  const prevIsOpenRef = useRef(false);
  
  // -- State --
  const [alertState, setAlertState] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [lines, setLines] = useState<ExtendedQTLine[]>(getInitialLines(5));
  const [activeTab, setActiveTab] = useState('detail');
  
  // Header State
  const [quotationNo, setQuotationNo] = useState('');
  const [refRfqNo, setRefRfqNo] = useState(''); // Ref RFQ
  const [vendorId, setVendorId] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState('');
  const [paymentTermDays, setPaymentTermDays] = useState(30);
  const [leadTimeDays, setLeadTimeDays] = useState(7);
  const [currencyCode, setCurrencyCode] = useState('THB');
  const [exchangeRate, setExchangeRate] = useState(1.0);
  const [remark, setRemark] = useState('');

  // Info Bar State (removing unused qcId)
  // vendorQuoteRef and shippingMethod removed - not used in new layout
  
  // Master Data
  const [products] = useState<ProductLookup[]>(MOCK_PRODUCTS);
  const [units, setUnits] = useState<UnitMaster[]>([]); // Add units state

  // Product Search Modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // -- Effects --

  useEffect(() => {
    // Fetch Units for dropdown - ONLY when modal is open
    if (!isOpen) return;
    masterDataService.getUnits().then(setUnits);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
        // Reset Form
        setLines(getInitialLines(5));
        setQuotationNo(`QT-V001-${new Date().getFullYear()}-xxx (Auto)`);
        setQuotationDate(new Date().toISOString().split('T')[0]);
        setValidUntil('');
        setRemark('');
        setCurrencyCode('THB');
        setExchangeRate(1.0);
        setVendorId('');
        setVendorName('');
        setContactPerson('');
        setContactEmail('');
        setContactPhone('');
        
        // Pre-fill Ref RFQ from initialRFQ
        if (initialRFQ) {
            setRefRfqNo(initialRFQ.rfq_no);
        } else {
            setRefRfqNo('');
        }
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, initialRFQ]);

  // -- Calculations --
  const totalAmount = lines.reduce((sum, line) => sum + (line.net_amount || 0), 0);
  const vatRate = 7;
  const vatAmount = totalAmount * (vatRate / 100);
  const grandTotal = totalAmount + vatAmount;

  // -- Handlers --
  const showAlert = (message: string) => setAlertState({ show: true, message });

    const updateLine = (index: number, field: keyof ExtendedQTLine, value: string | number) => {
    setLines(prev => {
      const newLines = [...prev];
      const line = { ...newLines[index] };
      
      // Update Field
      if (field in line) {
         // Safe cast for form data updates
         (line as Record<string, string | number | undefined>)[field] = value;
      }

      // Auto Calculate Net Amount
      if (field === 'qty' || field === 'unit_price' || field === 'discount_amount') {
        const qty = typeof line.qty === 'number' ? line.qty : 0;
        const price = typeof line.unit_price === 'number' ? line.unit_price : 0;
        const discount = typeof line.discount_amount === 'number' ? line.discount_amount : 0;
        line.net_amount = (qty * price) - discount;
      }

      newLines[index] = line;
      return newLines;
    });
  };

  const addLine = () => setLines(prev => [...prev, createEmptyLine()]);
  const insertLine = (index: number) => {
    setLines(prev => {
        const newLines = [...prev];
        newLines.splice(index + 1, 0, createEmptyLine());
        return newLines;
    });
  };
  const removeLine = (index: number) => {
      if (lines.length <= 1) return;
      setLines(prev => prev.filter((_, i) => i !== index));
  };

  // Product Search
  const openProductSearch = (index: number) => {
    setActiveRowIndex(index);
    setSearchTerm('');
    setIsProductModalOpen(true);
  };

  const selectProduct = (product: ProductLookup) => {
      if (activeRowIndex !== null) {
          updateLine(activeRowIndex, 'item_code', product.item_code);
          updateLine(activeRowIndex, 'item_name', product.item_name);
          updateLine(activeRowIndex, 'uom_name', product.unit);
          updateLine(activeRowIndex, 'unit_price', product.unit_price);
          updateLine(activeRowIndex, 'qty', 1);
          setIsProductModalOpen(false);
      }
  };
  
  const filteredProducts = products.filter(p => 
      p.item_code.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.item_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = () => {
      // Mock Save
      if (!vendorId) { showAlert('กรุณาเลือก Vendor'); return; }
      
      const payload: Partial<QuotationHeader> & { lines: ExtendedQTLine[] } = {
          quotation_no: quotationNo,
          quotation_date: quotationDate,
          vendor_id: vendorId,
          qc_id: refRfqNo, // Using qc_id field for RFQ reference
          currency_code: currencyCode,
          exchange_rate: exchangeRate,
          total_amount: grandTotal,
          lines: lines.filter(l => l.item_code),
      };
      
      // Call Service directly (static import)
      qtService.create(payload).then(() => {
         window.alert('บันทึกใบเสนอราคาเรียบร้อย');
         if (onSuccess) onSuccess();
         onClose();
      }).catch(error => {
         console.error('Save QT failed:', error);
         window.alert('เกิดข้อผิดพลาดในการบันทึก');
      });
  };

  // -- Render Helpers --
  // Using shared styles where applicable, but keeping specific grid layouts custom for this dense form
  const cardClass = 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden shadow-sm';

  const tabClass = (tab: string) => `px-6 py-2 text-sm font-medium flex items-center gap-2 cursor-pointer border-b-2 transition-colors ${activeTab === tab ? 'border-blue-600 text-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`;

  return (
    <WindowFormLayout
      isOpen={isOpen}
      onClose={onClose}
      title="สร้างใบเสนอราคา (Create Quotation) - Manual"
      titleIcon={<div className="bg-blue-500 p-1 rounded-md shadow-sm"><FileText size={14} strokeWidth={3} className="text-white" /></div>}
      headerColor="bg-blue-600"
      footer={
          <div className="flex items-center gap-1 p-2 bg-gray-100 dark:bg-[#1e293b] border-t border-gray-200 dark:border-gray-800">
               <button className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-transparent hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded text-xs font-bold transition-colors shadow-sm dark:shadow-none">
                  <Plus size={14} /> NEW
               </button>
               <button onClick={handleSave} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 rounded text-xs font-bold transition-colors shadow-sm">
                  <Save size={14} /> SAVE
               </button>
               <button className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-transparent hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-500 border border-emerald-500 dark:border-emerald-600 rounded text-xs font-bold transition-colors shadow-sm dark:shadow-none">
                  <CheckCircle size={14} /> APPROVE
               </button>
               <button className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-transparent hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-500 border border-red-500 dark:border-red-600 rounded text-xs font-bold transition-colors shadow-sm dark:shadow-none">
                  <Trash2 size={14} /> DELETE
               </button>
               <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
               <button className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-transparent hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded text-xs font-bold transition-colors shadow-sm dark:shadow-none">
                  <Search size={14} /> FIND
               </button>
               <button className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-transparent hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded text-xs font-bold transition-colors shadow-sm dark:shadow-none">
                  <Copy size={14} /> COPY
               </button>
               <button className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-transparent hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded text-xs font-bold transition-colors shadow-sm dark:shadow-none">
                  <Printer size={14} /> PRINT
               </button>
               <div className="flex-1"></div>
               <button onClick={onClose} className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-transparent hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-500 border border-red-500 dark:border-red-600 rounded text-xs font-bold transition-colors shadow-sm dark:shadow-none">
                  <X size={14} /> CLOSE
               </button>
          </div>
      }
    >
      {alertState.show && <SystemAlert message={alertState.message} onClose={() => setAlertState({ ...alertState, show: false })} />}

      {/* Product Search Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setIsProductModalOpen(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-[900px] max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">ค้นหาสินค้า</h2>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">กรอกข้อมูลเพื่อค้นหาสินค้าในระบบ</p>
                </div>
                <button onClick={() => setIsProductModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl">×</button>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">รหัสสินค้าหรือชื่อสินค้า</label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    placeholder="รหัสสินค้าหรือชื่อสินค้า" 
                    className="w-full h-10 pl-10 pr-4 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800" 
                    autoFocus 
                    />
                </div>
              </div>
            </div>
            <div className="max-h-[450px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 border-b border-gray-200 dark:border-gray-700">
                  <tr className="text-gray-600 dark:text-gray-300">
                    <th className="px-3 py-3 text-center font-medium w-20">เลือก</th>
                    <th className="px-3 py-3 text-left font-medium">รหัสสินค้า</th>
                    <th className="px-3 py-3 text-left font-medium">ชื่อสินค้า</th>
                    <th className="px-3 py-3 text-center font-medium">หน่วยนับ</th>
                    <th className="px-3 py-3 text-right font-medium">ราคา/หน่วย</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900">
                  {filteredProducts.map((p) => (
                    <tr key={p.item_code} className="border-b border-gray-100 dark:border-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                      <td className="px-3 py-3 text-center">
                        <button onClick={() => selectProduct(p)} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors shadow-sm">เลือก</button>
                      </td>
                      <td className="px-3 py-3 font-medium text-gray-900 dark:text-blue-100">{p.item_code}</td>
                      <td className="px-3 py-3 text-gray-700 dark:text-gray-300">{p.item_name}</td>
                      <td className="px-3 py-3 text-center text-gray-600 dark:text-gray-400">{p.unit}</td>
                      <td className="px-3 py-3 text-right text-emerald-600 dark:text-emerald-400 font-medium">{p.unit_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                  {filteredProducts.length === 0 && (
                        <tr>
                            <td colSpan={5} className="p-8 text-center text-gray-500 dark:text-gray-400 italic">
                                ไม่พบข้อมูลสินค้า
                            </td>
                        </tr>
                    )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MAIN FORM */}
      <div className="flex-1 overflow-auto bg-gray-50 dark:bg-[#0b1120] p-4 space-y-4">
          
          {/* 1. Header Card - Vendor Quotation Header */}
          {/* 1. Header Card - Vendor Quotation Header */}
          <div className={cardClass}>
              <div className="p-5 bg-white dark:bg-gray-900">
                  {/* Section Title */}
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <FileText size={20} />
                      </div>
                      <span className="font-bold text-lg">ส่วนหัวใบเสนอราคา - Vendor Quotation Header</span>
                  </div>

                  {/* Row 1: Quotation No, Date, Ref RFQ, Valid Until */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-5">
                      <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">เลขที่ใบเสนอราคา <span className="text-gray-400 font-normal">(quotation_no)</span> *</label>
                          <input value={quotationNo} onChange={e => setQuotationNo(e.target.value)} className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" readOnly />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">วันที่ใบเสนอราคา <span className="text-gray-400 font-normal">(quotation_date)</span> *</label>
                          <input type="date" value={quotationDate} onChange={e => setQuotationDate(e.target.value)} className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">เลขที่ RFQ อ้างอิง <span className="text-gray-400 font-normal">(rfq_id FK)</span></label>
                          <input value={refRfqNo} onChange={e => setRefRfqNo(e.target.value)} className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800/50 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" readOnly />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">วันที่ใช้ได้ถึง <span className="text-gray-400 font-normal">(valid_until)</span> *</label>
                          <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                      </div>
                  </div>

                  {/* Row 2: Vendor Code + Search, Vendor Name, Contact Person */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                      <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">รหัสเจ้าหนี้ <span className="text-gray-400 font-normal">(vendor_id FK)</span> *</label>
                          <div className="flex gap-2">
                              <input value={vendorId} onChange={e => setVendorId(e.target.value)} placeholder="V001" className="flex-1 px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                              <button type="button" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-md hover:shadow-lg">
                                  <Search size={18} />
                              </button>
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">ชื่อเจ้าหนี้ <span className="text-gray-400 font-normal">(vendor_name)</span></label>
                          <input value={vendorName} onChange={e => setVendorName(e.target.value)} placeholder="ชื่อเจ้าหนี้" className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800/50 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" readOnly />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">ผู้ติดต่อ <span className="text-gray-400 font-normal">(contact_person)</span></label>
                          <input value={contactPerson} onChange={e => setContactPerson(e.target.value)} placeholder="ชื่อผู้ติดต่อ" className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                      </div>
                  </div>

                  {/* Row 3: Currency, Exchange Rate, Payment Term, Lead Time */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-5">
                      <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">สกุลเงิน <span className="text-gray-400 font-normal">(currency_code)</span> *</label>
                          <select value={currencyCode} onChange={e => setCurrencyCode(e.target.value)} className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all">
                              <option value="THB">THB - บาท</option>
                              <option value="USD">USD - ดอลลาร์</option>
                              <option value="EUR">EUR - ยูโร</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">อัตราแลกเปลี่ยน <span className="text-gray-400 font-normal">(exchange_rate)</span></label>
                          <input type="number" value={exchangeRate} onChange={e => setExchangeRate(parseFloat(e.target.value))} className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-100 text-right focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">เงื่อนไขชำระเงิน (วัน) <span className="text-gray-400 font-normal">(payment_term_days)</span></label>
                          <input type="number" value={paymentTermDays} onChange={e => setPaymentTermDays(parseInt(e.target.value))} className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-100 text-right focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Lead Time (วัน) <span className="text-gray-400 font-normal">(lead_time_days)</span></label>
                          <input type="number" value={leadTimeDays} onChange={e => setLeadTimeDays(parseInt(e.target.value))} className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-100 text-right focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                      </div>
                  </div>

                  {/* Row 4: Email, Phone */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                      <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Email <span className="text-gray-400 font-normal">(contact_email)</span></label>
                          <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="email@example.com" className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">โทรศัพท์ <span className="text-gray-400 font-normal">(contact_phone)</span></label>
                          <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="02-xxx-xxxx" className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                      </div>
                  </div>

                  {/* Row 5: Remarks */}
                  <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">หมายเหตุ <span className="text-gray-400 font-normal">(remarks)</span></label>
                      <textarea value={remark} onChange={e => setRemark(e.target.value)} placeholder="กรอกหมายเหตุเพิ่มเติม..." rows={2} className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-all" />
                  </div>
              </div>
          </div>

          {/* 2. Items Table - Vendor Quotation Lines */}
          <div className={cardClass}>
              <div className="p-5 bg-white dark:bg-gray-900">
                  {/* Section Title */}
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <FileText size={20} />
                      </div>
                      <span className="font-bold text-lg">รายการสินค้า - Vendor Quotation Lines</span>
                  </div>
                  
                  <div className="overflow-x-auto bg-white dark:bg-[#1e1e1e] p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                     <table className="w-full min-w-[1000px] border-collapse bg-white dark:bg-[#1e1e1e] text-sm">
                         <thead className="bg-gray-100 dark:bg-blue-900 border-b-2 border-blue-600/50 text-gray-700 dark:text-blue-100">
                             <tr>
                                 <th className="p-3 w-12 text-center border-r border-gray-200 dark:border-blue-800 font-semibold dark:font-normal">#</th>
                                 <th className="p-3 w-48 text-center border-r border-gray-200 dark:border-blue-800 font-semibold dark:font-normal">รหัสสินค้า</th>
                                 <th className="p-3 min-w-[200px] text-center border-r border-gray-200 dark:border-blue-800 font-semibold dark:font-normal">รายละเอียดสินค้า</th>
                                 <th className="p-3 w-24 text-center border-r border-gray-200 dark:border-blue-800 font-semibold dark:font-normal">จำนวน</th>
                                 <th className="p-3 w-28 text-center border-r border-gray-200 dark:border-blue-800 font-semibold dark:font-normal">หน่วยนับ</th>
                                 <th className="p-3 w-32 text-center border-r border-gray-200 dark:border-blue-800 font-semibold dark:font-normal">ราคา/หน่วย</th>
                                 <th className="p-3 w-24 text-center border-r border-gray-200 dark:border-blue-800 font-semibold dark:font-normal">ส่วนลด</th>
                                 <th className="p-3 w-28 text-center border-r border-gray-200 dark:border-blue-800 font-semibold dark:font-normal">ลดยอด (บาท)</th>
                                 <th className="p-3 w-32 text-center border-r border-gray-200 dark:border-blue-800 font-semibold dark:font-normal">ยอดรวม</th>
                                 <th className="p-3 w-24 text-center font-semibold dark:font-normal">จัดการ</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                             {lines.map((line, idx) => (
                                 <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-[#2d2d2d] transition-colors">
                                     <td className="p-2 text-center text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-800">{idx + 1}</td>
                                     
                                     {/* Product Code: Input + Square Teal Button */}
                                     <td className="p-2 border-r border-gray-200 dark:border-gray-800">
                                         <div className="flex items-center gap-1">
                                            <input 
                                                value={line.item_code} 
                                                onChange={e => updateLine(idx, 'item_code', e.target.value)} 
                                                className="w-full h-9 px-3 bg-white dark:bg-[#2d2d2d] border border-gray-300 dark:border-gray-700 rounded text-gray-900 dark:text-gray-200 focus:border-blue-500 dark:focus:border-purple-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-purple-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500" 
                                            />
                                            <button 
                                                onClick={() => openProductSearch(idx)} 
                                                className="h-9 w-9 flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white rounded shadow-sm transition-colors"
                                            >
                                                <Search size={16} />
                                            </button>
                                         </div>
                                     </td>

                                     <td className="p-2 border-r border-gray-200 dark:border-gray-800">
                                         <input 
                                            value={line.item_name} 
                                            onChange={e => updateLine(idx, 'item_name', e.target.value)} 
                                            className="w-full h-9 px-3 bg-white dark:bg-[#2d2d2d] border border-gray-300 dark:border-gray-700 rounded text-gray-900 dark:text-gray-200 focus:border-blue-500 dark:focus:border-purple-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-purple-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500" 
                                         />
                                     </td>
                                     
                                     <td className="p-2 border-r border-gray-200 dark:border-gray-800">
                                         <input 
                                            type="number" 
                                            value={line.qty || ''} 
                                            onChange={e => updateLine(idx, 'qty', parseFloat(e.target.value))} 
                                            className="w-full h-9 px-3 bg-white dark:bg-[#2d2d2d] border border-gray-300 dark:border-gray-700 rounded text-center text-blue-600 dark:text-blue-400 font-medium focus:border-blue-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500" 
                                         />
                                     </td>
                                     
                                     {/* Unit Dropdown */}
                                     <td className="p-2 border-r border-gray-200 dark:border-gray-800">
                                        <select 
                                            value={line.uom_name} 
                                            onChange={e => updateLine(idx, 'uom_name', e.target.value)} 
                                            className="w-full h-9 px-2 bg-white dark:bg-[#2d2d2d] border border-gray-300 dark:border-gray-700 rounded text-center text-gray-900 dark:text-gray-200 cursor-pointer focus:border-blue-500 dark:focus:border-purple-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-purple-500 outline-none appearance-none"
                                        >
                                            <option value="" hidden>เลือก</option>
                                            {units.map(u => (
                                                <option key={u.unit_id} value={u.unit_name} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200">{u.unit_name}</option>
                                            ))}
                                        </select>
                                     </td>

                                     <td className="p-2 border-r border-gray-200 dark:border-gray-800">
                                         <input 
                                            type="number" 
                                            value={line.unit_price || ''} 
                                            onChange={e => updateLine(idx, 'unit_price', parseFloat(e.target.value))} 
                                            placeholder="0.00" 
                                            className="w-full h-9 px-3 bg-white dark:bg-[#2d2d2d] border border-gray-300 dark:border-gray-700 rounded text-right text-gray-900 dark:text-gray-200 focus:border-blue-500 dark:focus:border-purple-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-purple-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500" 
                                         />
                                     </td>
                                     
                                     <td className="p-2 border-r border-gray-200 dark:border-gray-800">
                                         <input 
                                            type="number" 
                                            placeholder="0" 
                                            className="w-full h-9 px-3 bg-white dark:bg-[#2d2d2d] border border-gray-300 dark:border-gray-700 rounded text-center text-gray-900 dark:text-gray-400 focus:border-blue-500 dark:focus:border-purple-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-purple-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500" 
                                         />
                                     </td>

                                     <td className="p-2 border-r border-gray-200 dark:border-gray-800">
                                         <input 
                                            type="number" 
                                            value={line.discount_amount || ''} 
                                            onChange={e => updateLine(idx, 'discount_amount', parseFloat(e.target.value))} 
                                            placeholder="0.00" 
                                            className="w-full h-9 px-3 bg-white dark:bg-[#2d2d2d] border border-gray-300 dark:border-gray-700 rounded text-right text-gray-900 dark:text-gray-200 focus:border-blue-500 dark:focus:border-purple-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-purple-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500" 
                                         />
                                     </td>
                                     
                                     <td className="p-2 border-r border-gray-200 dark:border-gray-800">
                                         <input 
                                            value={(line.net_amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})} 
                                            readOnly 
                                            className="w-full h-9 px-3 bg-gray-50 dark:bg-[#1e1e1e] border border-transparent rounded text-right text-emerald-600 dark:text-emerald-500 font-bold focus:outline-none" 
                                         />
                                     </td>
                                     
                                     {/* Action Buttons: Green Plus, Red Trash */}
                                     <td className="p-2 text-center">
                                         <div className="flex items-center justify-center gap-2">
                                             <button 
                                                onClick={() => insertLine(idx)} 
                                                className="text-green-500 hover:text-green-400 transition-colors p-1"
                                                title="เพิ่มแถว"
                                             >
                                                <Plus size={18} />
                                             </button>
                                             <button 
                                                onClick={() => removeLine(idx)} 
                                                className="text-red-500 hover:text-red-400 transition-colors p-1"
                                                title="ลบแถว"
                                             >
                                                <Trash2 size={18} />
                                             </button>
                                         </div>
                                     </td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                     
                     <div className="mt-4 flex justify-between items-center px-1">
                        <button onClick={addLine} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-blue-900/30 hover:bg-gray-200 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold rounded border border-gray-300 dark:border-blue-800 transition-all text-xs uppercase tracking-wider">
                            <Plus size={14} strokeWidth={3}/> Add Line
                        </button>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                             <span>Rows: {lines.length}</span>
                        </div>
                     </div>
                  </div>
                  
                  {/* Total Amount */}
                  <div className="flex justify-end mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                      <div className="text-right bg-blue-50 dark:bg-gray-800/50 p-4 rounded-xl border border-blue-100 dark:border-gray-700">
                          <span className="text-gray-600 dark:text-gray-300 text-sm font-bold mr-4 uppercase tracking-wide">ยอดรวมทั้งสิ้น (Total Amount)</span>
                          <div className="flex items-baseline justify-end gap-2 mt-1">
                              <span className="text-3xl font-extrabold text-[#1d4ed8] dark:text-blue-400">{grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                              <span className="text-gray-500 dark:text-gray-400 font-medium text-lg">THB</span>
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          {/* 3. Footer Summary (Clone PR Style) */}
          <div className={cardClass}>
              <div className="p-4 bg-white dark:bg-gray-900 flex justify-end">
                  <div className="w-80 space-y-3 text-sm">
                      <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">รวมเป็นเงิน (Subtotal)</span>
                          <span className="font-medium text-gray-900 dark:text-gray-200">{totalAmount.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                      </div>
                      <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">ภาษีมูลค่าเพิ่ม ({vatRate}%)</span>
                          <span className="font-medium text-gray-900 dark:text-gray-200">{vatAmount.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                      </div>
                      <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-700 mt-2">
                          <span className="font-bold text-gray-800 dark:text-white text-lg">ยอดรวมทั้งสิ้น (Grand Total)</span>
                          <span className="font-extrabold text-[#1d4ed8] dark:text-blue-400 text-xl">{grandTotal.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                      </div>
                  </div>
              </div>
          </div>
          
          {/* Tabs */}
        <div className={cardClass}>
          <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <div className={tabClass('detail')} onClick={() => setActiveTab('detail')}><FileBox size={14} /> Note</div>
            <div className={tabClass('more')} onClick={() => setActiveTab('more')}><MoreHorizontal size={14} /> More</div>
          </div>
          <div className="p-4 min-h-[100px] bg-white dark:bg-gray-900">
            {activeTab === 'detail' && (
              <textarea value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="กรอกหมายเหตุเพิ่มเติม..." className="w-full h-24 px-4 py-3 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            )}
            {activeTab === 'more' && <div className="text-gray-500 dark:text-gray-400 text-sm italic">ข้อมูลเพิ่มเติม...</div>}
          </div>
        </div>

      </div>
    </WindowFormLayout>
  );
};

export default QTFormModal;
