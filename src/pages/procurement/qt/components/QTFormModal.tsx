import { useState, useEffect, useRef } from 'react';
import { FileText, Plus, Trash2, Search, FileBox, MoreHorizontal, X, Save, CheckCircle, Copy, Printer } from 'lucide-react';

import { WindowFormLayout } from '../../../../components/shared/WindowFormLayout';
import { SystemAlert } from '../../../../components/shared/SystemAlert';
import type { QuotationHeader, QuotationLine } from '../../../../types/qt-types';
import { masterDataService } from '../../../../services/masterDataService';
import type { ItemMaster } from '../../../../types/master-data-types';

// ====================================================================================
// TYPES & CONSTANTS
// ====================================================================================

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
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

const QTFormModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const prevIsOpenRef = useRef(false);
  
  // -- State --
  const [alertState, setAlertState] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [lines, setLines] = useState<ExtendedQTLine[]>(getInitialLines(5));
  const [activeTab, setActiveTab] = useState('detail');
  
  // Header State
  const [quotationNo, setQuotationNo] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [qcId, setQcId] = useState(''); // QC Link
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState('');
  const [paymentTermDays, setPaymentTermDays] = useState(30);
  const [leadTimeDays, setLeadTimeDays] = useState(7);
  const [currencyCode, setCurrencyCode] = useState('THB');
  const [exchangeRate, setExchangeRate] = useState(1.0);
  const [remark, setRemark] = useState('');

  // Info Bar State
  const [vendorQuoteRef, setVendorQuoteRef] = useState(''); 
  const [shippingMethod, setShippingMethod] = useState('');
  
  // Master Data
  const [products, setProducts] = useState<ItemMaster[]>([]);
  const [vendors, setVendors] = useState<{vendor_id: string; vendor_name: string; vendor_code: string}[]>([]); // Mock vendor list

  // Product Search Modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // -- Effects --

  useEffect(() => {
    // Mock Fetch Master Data
    masterDataService.getItems().then(setProducts);
    // TODO: masterDataService.getVendors().then(...)
    setVendors([
        { vendor_id: 'v-001', vendor_name: 'บริษัท เอบีซี จำกัด', vendor_code: 'V001' },
        { vendor_id: 'v-002', vendor_name: 'หจก ดีอีเอฟ จำกัด', vendor_code: 'V002' }, 
    ]);
  }, []);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
        // Reset Form
        setLines(getInitialLines(5));
        setQuotationNo(`QT-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,'0')}-${String(Math.floor(Math.random()*1000)).padStart(3,'0')}`);
        setQuotationDate(new Date().toISOString().split('T')[0]);
        setValidUntil('');
        setRemark('');
        setCurrencyCode('THB');
        setExchangeRate(1.0);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen]);

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

  const selectProduct = (product: ItemMaster) => {
      if (activeRowIndex !== null) {
          updateLine(activeRowIndex, 'item_code', product.item_code);
          updateLine(activeRowIndex, 'item_name', product.item_name);
          updateLine(activeRowIndex, 'uom_name', product.unit_name || '');
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
          qc_id: qcId,
          currency_code: currencyCode,
          exchange_rate: exchangeRate,
          total_amount: grandTotal,
          lines: lines.filter(l => l.item_code),
      };

      console.log('Sending Payload:', payload);
      
      // Call Service
      import('../../../../services/qtService').then(({ qtService }) => {
          qtService.create(payload).then(() => {
             window.alert('บันทึกใบเสนอราคาเรียบร้อย');
             if (onSuccess) onSuccess();
             onClose();
          });
      });
  };

  // -- Render Helpers --
  // Using shared styles where applicable, but keeping specific grid layouts custom for this dense form
  const cardClass = 'bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-sm overflow-hidden';
  const tableInputClass = 'w-full h-8 px-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 !rounded-none focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-right';
  const tableTextInputClass = 'w-full h-8 px-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 !rounded-none focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-left';
  const tdBaseClass = 'p-0 border-r border-gray-200 dark:border-gray-700';

  const tabClass = (tab: string) => `px-6 py-2 text-sm font-medium flex items-center gap-2 cursor-pointer border-b-2 transition-colors ${activeTab === tab ? 'border-blue-600 text-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`;

  return (
    <WindowFormLayout
      isOpen={isOpen}
      onClose={onClose}
      title="สร้างใบเสนอราคา (Create Quotation) - Manual"
      titleIcon={<div className="bg-emerald-500 p-1 rounded-md shadow-sm"><FileText size={14} strokeWidth={3} className="text-white" /></div>}
      headerColor="bg-emerald-600"
      footer={
          <div className="flex items-center gap-1 p-2 bg-[#1e293b]">
               <button className="flex items-center gap-1 px-3 py-1.5 bg-transparent hover:bg-white/10 text-gray-300 border border-gray-600 rounded text-xs font-bold transition-colors">
                  <Plus size={14} /> NEW
               </button>
               <button onClick={handleSave} className="flex items-center gap-1 px-3 py-1.5 bg-[#1e40af] hover:bg-blue-700 text-white border border-blue-600 rounded text-xs font-bold transition-colors">
                  <Save size={14} /> SAVE
               </button>
               <button className="flex items-center gap-1 px-3 py-1.5 bg-transparent hover:bg-emerald-900/30 text-emerald-500 border border-emerald-600 rounded text-xs font-bold transition-colors">
                  <CheckCircle size={14} /> APPROVE
               </button>
               <button className="flex items-center gap-1 px-3 py-1.5 bg-transparent hover:bg-red-900/30 text-red-500 border border-red-600 rounded text-xs font-bold transition-colors">
                  <Trash2 size={14} /> DELETE
               </button>
               <div className="w-px h-6 bg-gray-600 mx-1"></div>
               <button className="flex items-center gap-1 px-3 py-1.5 bg-transparent hover:bg-white/10 text-gray-300 border border-gray-600 rounded text-xs font-bold transition-colors">
                  <Search size={14} /> FIND
               </button>
               <button className="flex items-center gap-1 px-3 py-1.5 bg-transparent hover:bg-white/10 text-gray-300 border border-gray-600 rounded text-xs font-bold transition-colors">
                  <Copy size={14} /> COPY
               </button>
               <button className="flex items-center gap-1 px-3 py-1.5 bg-transparent hover:bg-white/10 text-gray-300 border border-gray-600 rounded text-xs font-bold transition-colors">
                  <Printer size={14} /> PRINT
               </button>
               <div className="flex-1"></div>
               <button onClick={onClose} className="flex items-center gap-1 px-3 py-1.5 bg-transparent hover:bg-red-900/30 text-red-500 border border-red-600 rounded text-xs font-bold transition-colors">
                  <X size={14} /> CLOSE
               </button>
          </div>
      }
    >
      {alertState.show && <SystemAlert message={alertState.message} onClose={() => setAlertState({ ...alertState, show: false })} />}

      {/* Product Search Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30" onClick={() => setIsProductModalOpen(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-[900px] max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
               <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xl font-bold">ค้นหาสินค้า</h2>
                 <button onClick={() => setIsProductModalOpen(false)}><X /></button>
               </div>
               <input 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="ค้นหา..."
                  className="w-full px-4 py-2 border rounded"
                  autoFocus
               />
            </div>
            <div className="max-h-[400px] overflow-auto p-0">
               <table className="w-full text-sm">
                   <thead className="bg-gray-100">
                       <tr>
                           <th className="p-2">Action</th>
                           <th className="p-2 text-left">Code</th>
                           <th className="p-2 text-left">Name</th>
                       </tr>
                   </thead>
                   <tbody>
                       {filteredProducts.map(p => (
                           <tr key={p.item_id} className="border-b hover:bg-gray-50">
                               <td className="p-2 text-center"><button onClick={() => selectProduct(p)} className="text-blue-600 hover:underline">เลือก</button></td>
                               <td className="p-2">{p.item_code}</td>
                               <td className="p-2">{p.item_name}</td>
                           </tr>
                       ))}
                   </tbody>
               </table>
            </div>
          </div>
        </div>
      )}

      {/* MAIN FORM */}
      <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-800 p-2 space-y-2">
          
          {/* 1. Header Card */}
          <div className={cardClass}>
              <div className="p-4 bg-white dark:bg-gray-900">
                  <div className="grid grid-cols-12 gap-4">
                      {/* Left: Basic Info */}
                      <div className="col-span-8 grid grid-cols-2 gap-x-4 gap-y-3">
                            <div className="col-span-1">
                                <label className="block text-xs font-semibold text-gray-600 mb-1">เลขที่ใบเสนอราคา (Quotation No.)</label>
                                <input value={quotationNo} onChange={e => setQuotationNo(e.target.value)} className="w-full px-3 py-1.5 text-sm border rounded bg-gray-50" />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-semibold text-gray-600 mb-1">วันที่เสนอราคา (Quotation Date)</label>
                                <input type="date" value={quotationDate} onChange={e => setQuotationDate(e.target.value)} className="w-full px-3 py-1.5 text-sm border rounded" />
                            </div>
                            
                            <div className="col-span-2">
                                <label className="block text-xs font-semibold text-gray-600 mb-1">ผู้ขาย (Vendor)</label>
                                <select value={vendorId} onChange={e => setVendorId(e.target.value)} className="w-full px-3 py-1.5 text-sm border rounded">
                                    <option value="">-- เลือกผู้ขาย --</option>
                                    {vendors.map(v => <option key={v.vendor_id} value={v.vendor_id}>{v.vendor_code} : {v.vendor_name}</option>)}
                                </select>
                            </div>

                            <div className="col-span-1">
                                <label className="block text-xs font-semibold text-gray-600 mb-1">อ้างอิงใบเปรียบเทียบ (Ref QC)</label>
                                <input value={qcId} onChange={e => setQcId(e.target.value)} placeholder="เลือก QC..." className="w-full px-3 py-1.5 text-sm border rounded" />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-semibold text-gray-600 mb-1">ยืนราคาถึง (Valid Until)</label>
                                <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} className="w-full px-3 py-1.5 text-sm border rounded" />
                            </div>
                      </div>

                      {/* Right: Currency & Payment */}
                      <div className="col-span-4 bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-200">
                           <div className="space-y-3">
                               <div>
                                   <label className="block text-xs font-semibold text-gray-600 mb-1">สกุลเงิน (Currency)</label>
                                   <div className="flex gap-2">
                                       <select value={currencyCode} onChange={e => setCurrencyCode(e.target.value)} className="flex-1 px-3 py-1.5 text-sm border rounded">
                                           <option value="THB">THB</option>
                                           <option value="USD">USD</option>
                                           <option value="EUR">EUR</option>
                                       </select>
                                       <input type="number" value={exchangeRate} onChange={e => setExchangeRate(parseFloat(e.target.value))} className="w-20 px-3 py-1.5 text-sm border rounded text-right" placeholder="Rate" />
                                   </div>
                               </div>
                               <div className="grid grid-cols-2 gap-2">
                                   <div>
                                       <label className="block text-xs font-semibold text-gray-600 mb-1">เครดิต (วัน)</label>
                                       <input type="number" value={paymentTermDays} onChange={e => setPaymentTermDays(parseInt(e.target.value))} className="w-full px-3 py-1.5 text-sm border rounded" />
                                   </div>
                                   <div>
                                       <label className="block text-xs font-semibold text-gray-600 mb-1">ส่งของ (วัน)</label>
                                       <input type="number" value={leadTimeDays} onChange={e => setLeadTimeDays(parseInt(e.target.value))} className="w-full px-3 py-1.5 text-sm border rounded" />
                                   </div>
                               </div>
                           </div>
                      </div>
                  </div>
              </div>
          </div>

          {/* 2. Info Bar (Derived from PR Form Style) */}
          <div className={cardClass}>
            <div className="w-full overflow-x-auto border border-gray-300 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900">
            <table className="w-full min-w-[800px] text-xs border-collapse">
              <thead className="bg-emerald-600 text-white">
                <tr>
                  <th className="px-2 py-1.5 text-left font-normal border-r border-emerald-500 whitespace-nowrap w-48">Vendor Quote Ref.</th>
                  <th className="px-2 py-1.5 text-left font-normal border-r border-emerald-500 whitespace-nowrap w-24">การจัดส่ง</th>
                  <th className="px-2 py-1.5 text-left font-normal border-r border-emerald-500 whitespace-nowrap">เงื่อนไขเพิ่มเติม</th>
                  <th className="px-2 py-1.5 text-left font-normal whitespace-nowrap">ผู้บันทึก</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                   <td className="px-2 py-1 border-r"><input value={vendorQuoteRef} onChange={e => setVendorQuoteRef(e.target.value)} className="w-full bg-transparent outline-none" placeholder="เลขที่อ้างอิงผู้ขาย..." /></td>
                   <td className="px-2 py-1 border-r"><input value={shippingMethod} onChange={e => setShippingMethod(e.target.value)} className="w-full bg-transparent outline-none" placeholder="ขนส่ง..." /></td>
                   <td className="px-2 py-1 border-r"><input className="w-full bg-transparent outline-none" placeholder="-" /></td>
                   <td className="px-2 py-1 text-gray-500 font-medium">Admin User</td>
                </tr>
              </tbody>
            </table>
            </div>
          </div>

          {/* 3. Items Table */}
          <div className={cardClass}>
              <div className="px-0 py-0 overflow-x-auto bg-gray-50 dark:bg-gray-800 min-h-[250px]">
                 <table className="w-full min-w-[1000px] border-collapse bg-white dark:bg-gray-900 shadow-sm text-sm border border-gray-200">
                     <thead className="bg-emerald-600 text-white text-xs">
                         <tr>
                             <th className="p-2 w-10 text-center border-r border-emerald-500 sticky left-0 z-10 bg-emerald-700">#</th>
                             <th className="p-2 w-28 text-center border-r border-emerald-500">รหัสสินค้า</th>
                             <th className="p-2 min-w-[200px] text-center border-r border-emerald-500">ชื่อสินค้า</th>
                             <th className="p-2 w-20 text-center border-r border-emerald-500">หน่วยนับ</th>
                             <th className="p-2 w-24 text-center border-r border-emerald-500">จำนวน</th>
                             <th className="p-2 w-28 text-center border-r border-emerald-500">ราคา/หน่วย</th>
                             <th className="p-2 w-24 text-center border-r border-emerald-500">ส่วนลด</th>
                             <th className="p-2 w-28 text-center border-r border-emerald-500">รวมเงิน</th>
                             <th className="p-2 w-16 text-center">Action</th>
                         </tr>
                     </thead>
                     <tbody>
                         {lines.map((line, idx) => (
                             <tr key={idx} className="border-b border-gray-200 dark:border-gray-700 hover:bg-emerald-50">
                                 <td className="p-1 text-center bg-gray-50 font-bold sticky left-0 z-10 border-r">{idx + 1}</td>
                                 <td className={tdBaseClass}>
                                     <div className="flex">
                                        <input value={line.item_code} onChange={e => updateLine(idx, 'item_code', e.target.value)} className={tableTextInputClass} />
                                        <button onClick={() => openProductSearch(idx)} className="px-1 text-gray-400 hover:text-blue-600"><Search size={14}/></button>
                                     </div>
                                 </td>
                                 <td className={tdBaseClass}><input value={line.item_name} onChange={e => updateLine(idx, 'item_name', e.target.value)} className={tableTextInputClass} /></td>
                                 <td className={tdBaseClass}><input value={line.uom_name} onChange={e => updateLine(idx, 'uom_name', e.target.value)} className={`${tableTextInputClass} text-center`} /></td>
                                 <td className={tdBaseClass}><input type="number" value={line.qty || ''} onChange={e => updateLine(idx, 'qty', parseFloat(e.target.value))} className={tableInputClass} /></td>
                                 <td className={tdBaseClass}><input type="number" value={line.unit_price || ''} onChange={e => updateLine(idx, 'unit_price', parseFloat(e.target.value))} className={tableInputClass} /></td>
                                 <td className={tdBaseClass}><input type="number" value={line.discount_amount || ''} onChange={e => updateLine(idx, 'discount_amount', parseFloat(e.target.value))} className={tableInputClass} /></td>
                                 <td className={tdBaseClass}><input value={(line.net_amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})} readOnly className={`${tableInputClass} font-bold bg-gray-100 text-emerald-700`} /></td>
                                 <td className="p-1 text-center">
                                     <button onClick={() => removeLine(idx)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={16} /></button>
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
                 <button onClick={addLine} className="m-2 flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-bold border border-gray-300">
                     <Plus size={14} className="mr-1"/> เพิ่มรายการ
                 </button>
              </div>
          </div>

          {/* 4. Footer Summary (Clone PR Style) */}
          <div className={cardClass}>
              <div className="p-3 bg-white dark:bg-gray-900 flex justify-end">
                  <div className="w-80 space-y-2 text-sm">
                      <div className="flex justify-between">
                          <span className="text-gray-600">รวมเป็นเงิน</span>
                          <span className="font-medium">{totalAmount.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                      </div>
                      <div className="flex justify-between">
                          <span className="text-gray-600">ภาษีมูลค่าเพิ่ม ({vatRate}%)</span>
                          <span className="font-medium">{vatAmount.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-gray-200">
                          <span className="font-bold text-gray-800">ยอดรวมทั้งสิ้น</span>
                          <span className="font-bold text-emerald-600 text-lg">{grandTotal.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
                      </div>
                  </div>
              </div>
          </div>
          
          {/* Tabs */}
        <div className={cardClass}>
          <div className="flex border-b border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className={tabClass('detail')} onClick={() => setActiveTab('detail')}><FileBox size={14} /> Note</div>
            <div className={tabClass('more')} onClick={() => setActiveTab('more')}><MoreHorizontal size={14} /> More</div>
          </div>
          <div className="p-3 min-h-[80px] dark:bg-gray-900">
            {activeTab === 'detail' && (
              <textarea value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="กรอกหมายเหตุเพิ่มเติม..." className="w-full h-20 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 resize-none" />
            )}
            {activeTab === 'more' && <div className="text-gray-500 dark:text-gray-400 text-sm">ข้อมูลเพิ่มเติม...</div>}
          </div>
        </div>

      </div>
    </WindowFormLayout>
  );
};

export default QTFormModal;
