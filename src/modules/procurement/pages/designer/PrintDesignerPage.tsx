import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Save, ArrowLeft, Eye, EyeOff, LayoutGrid } from 'lucide-react';
import { toast } from 'react-hot-toast';
import '@/modules/procurement/shared/components/print/print-styles.css';
import '@/modules/procurement/shared/components/print/print-designer.css';

interface PrintConfig {
  fontFamily: string;
  baseSize: number;
  headerMt: number;
  nameSize: number;
  nameMb: number;
  addrSize: number;
  tableSize: number;
  paddingTop: number;
  paddingBottom: number;
  paddingLeftRight: number;
}

interface BlockItem {
  id: string;
  name: string;
  visible: boolean;
  order: number;
  customLabel?: string;
}

export default function PrintDesignerPage() {
  const navigate = useNavigate();

  // 1. General Print Config State
  const [config, setConfig] = useState<PrintConfig>({
    fontFamily: '"Sarabun", "TH Sarabun New", sans-serif',
    baseSize: 11,
    headerMt: 8,
    nameSize: 16,
    nameMb: 12,
    addrSize: 10,
    tableSize: 9.5,
    paddingTop: 16,
    paddingBottom: 18,
    paddingLeftRight: 14,
  });

  // 2. Re-orderable & Toggleable Block Layout
  const [blocks, setBlocks] = useState<BlockItem[]>([
    { id: 'header', name: 'หัวข้อบริษัท & โลโก้', visible: true, order: 1 },
    { id: 'docTitle', name: 'ชื่อหัวข้อเอกสาร (เช่น ใบสั่งซื้อ)', visible: true, order: 2, customLabel: 'ใบสั่งซื้อ (Purchase Order)' },
    { id: 'vendorInfo', name: 'ข้อมูลผู้ขาย (ซ้าย)', visible: true, order: 3 },
    { id: 'docMetadata', name: 'เลขที่ & วันที่เอกสาร (ขวา)', visible: true, order: 4 },
    { id: 'itemsTable', name: 'ตารางสินค้า', visible: true, order: 5 },
    { id: 'summaryBlock', name: 'สรุปมูลค่าท้ายตาราง', visible: true, order: 6 },
    { id: 'signatures', name: 'ช่องเซ็นชื่อผู้อนุมัติ', visible: true, order: 7 },
  ]);

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  // Re-ordering logic helper
  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...blocks].sort((a, b) => a.order - b.order);
    const targetIdx = direction === 'up' ? index - 1 : index + 1;

    if (targetIdx < 0 || targetIdx >= newBlocks.length) return;

    // Swap order values
    const temp = newBlocks[index].order;
    newBlocks[index].order = newBlocks[targetIdx].order;
    newBlocks[targetIdx].order = temp;

    setBlocks(newBlocks);
  };

  const toggleVisibility = (id: string) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, visible: !b.visible } : b));
  };

  const updateCustomLabel = (id: string, label: string) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, customLabel: label } : b));
  };

  const handleSave = () => {
    const designTemplate = {
      config,
      blocks: blocks.sort((a, b) => a.order - b.order),
    };
    
    // Simulate API saving
    console.log('Saved Design Layout Configuration JSON:', JSON.stringify(designTemplate, null, 2));
    toast.success('บันทึกรูปแบบดีไซน์การพิมพ์เรียบร้อยแล้ว! (ข้อมูลบันทึกสำเร็จลงฐานข้อมูลจำลอง)');
  };

  // Sorted list of blocks for A4 preview rendering
  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

  // Apply configs to CSS variables dynamically for preview
  const previewStyle = {
    '--print-font-family': config.fontFamily,
    '--print-base-size': `${config.baseSize}pt`,
    '--print-header-mt': `${config.headerMt}mm`,
    '--print-name-size': `${config.nameSize}pt`,
    '--print-name-mb': `${config.nameMb}px`,
    '--print-addr-size': `${config.addrSize}pt`,
    '--print-table-size': `${config.tableSize}pt`,
    '--print-page-padding-top': `${config.paddingTop}mm`,
    '--print-page-padding-bottom': `${config.paddingBottom}mm`,
    '--print-page-padding-left-right': `${config.paddingLeftRight}mm`,
  } as React.CSSProperties;

  return (
    <div className="designer-container">
      {/* 🛠️ SIDEBAR PANEL: Controls & Configuration */}
      <div className="designer-sidebar">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div className="designer-title">
            <Settings className="w-5 h-5 text-blue-600 animate-spin-slow" />
            <span>Print Layout Designer</span>
          </div>
          <button 
            onClick={() => navigate('/procurement/po')} 
            className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500"
            title="กลับไปหน้าหลัก"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Font & Spacing Config Section */}
        <div>
          <div className="designer-section-title">ตั้งค่าขนาด & สไตล์ (Base Styles)</div>
          <div className="space-y-4">
            <div className="control-group">
              <label>รูปแบบฟอนต์ (Font Family)</label>
              <select 
                value={config.fontFamily}
                onChange={(e) => setConfig({ ...config, fontFamily: e.target.value })}
                className="designer-select"
              >
                <option value={'"Sarabun", "TH Sarabun New", sans-serif'}>Sarabun (มาตรฐาน)</option>
                <option value={'"Prompt", sans-serif'}>Prompt (โมเดิร์น)</option>
                <option value={'"Noto Sans Thai", sans-serif'}>Noto Sans Thai</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="control-group">
                <label>ขนาดฟอนต์หลัก (pt)</label>
                <input 
                  type="number" 
                  value={config.baseSize}
                  onChange={(e) => setConfig({ ...config, baseSize: Number(e.target.value) })}
                  className="designer-input"
                />
              </div>
              <div className="control-group">
                <label>ขนาดชื่อบริษัท (pt)</label>
                <input 
                  type="number" 
                  value={config.nameSize}
                  onChange={(e) => setConfig({ ...config, nameSize: Number(e.target.value) })}
                  className="designer-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="control-group">
                <label>ขอบบน (mm)</label>
                <input 
                  type="number" 
                  value={config.paddingTop}
                  onChange={(e) => setConfig({ ...config, paddingTop: Number(e.target.value) })}
                  className="designer-input"
                />
              </div>
              <div className="control-group">
                <label>ขอบล่าง (mm)</label>
                <input 
                  type="number" 
                  value={config.paddingBottom}
                  onChange={(e) => setConfig({ ...config, paddingBottom: Number(e.target.value) })}
                  className="designer-input"
                />
              </div>
              <div className="control-group">
                <label>ขอบข้าง (mm)</label>
                <input 
                  type="number" 
                  value={config.paddingLeftRight}
                  onChange={(e) => setConfig({ ...config, paddingLeftRight: Number(e.target.value) })}
                  className="designer-input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Blocks Reordering and visibility section */}
        <div>
          <div className="designer-section-title">ตำแหน่ง & ลำดับบล็อกเอกสาร (Blocks Layout)</div>
          <p className="text-xs text-gray-500 mb-3">คุณสามารถคลิกลูกศร ขึ้น/ลง เพื่อปรับลำดับตำแหน่ง หรือซ่อน/แสดงช่องข้อมูลได้เลยครับ</p>
          <div className="space-y-2">
            {sortedBlocks.map((block, idx) => (
              <div 
                key={block.id} 
                className={`draggable-item-row ${selectedBlockId === block.id ? 'active' : ''}`}
                onClick={() => setSelectedBlockId(block.id)}
              >
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleVisibility(block.id); }} 
                    className="p-1 hover:bg-gray-200 rounded text-gray-600"
                  >
                    {block.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-gray-400" />}
                  </button>
                  <span className="text-sm font-medium">{block.name}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <button 
                    disabled={idx === 0}
                    onClick={(e) => { e.stopPropagation(); moveBlock(idx, 'up'); }}
                    className="p-1 hover:bg-gray-200 rounded text-gray-600 disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <button 
                    disabled={idx === sortedBlocks.length - 1}
                    onClick={(e) => { e.stopPropagation(); moveBlock(idx, 'down'); }}
                    className="p-1 hover:bg-gray-200 rounded text-gray-600 disabled:opacity-30"
                  >
                    ▼
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected element custom settings */}
        {selectedBlockId === 'docTitle' && (
          <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-lg">
            <label className="block text-xs font-bold text-blue-700 uppercase mb-1">ตั้งค่าชื่อเอกสารหลัก</label>
            <input 
              type="text" 
              value={blocks.find(b => b.id === 'docTitle')?.customLabel || ''}
              onChange={(e) => updateCustomLabel('docTitle', e.target.value)}
              className="designer-input text-sm"
              placeholder="เช่น ใบสั่งซื้อสินค้า..."
            />
          </div>
        )}

        {/* Actions save block */}
        <div className="pt-4 border-t border-gray-200 mt-auto flex flex-col gap-2">
          <button onClick={handleSave} className="btn-primary w-full flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            <span>บันทึกดีไซน์นี้</span>
          </button>
          
          <div className="mt-2">
            <span className="block text-xs font-semibold text-gray-500 mb-1">JSON Config (ส่งไปเก็บที่ DB):</span>
            <pre className="designer-json-view">
              {JSON.stringify({ config, blocks }, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      {/* 🖥️ CANVAS WORKSPACE: Live A4 WYSIWYG Preview */}
      <div className="designer-canvas-area">
        <div className="designer-toolbar-top">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <LayoutGrid className="w-3.5 h-3.5 text-blue-600" />
            A4 Print Canvas Workspace (Live Preview)
          </span>
          <span className="text-xs text-slate-500">ขนาดความกว้าง A4 มาตรฐาน (210mm)</span>
        </div>

        <div className="a4-page" style={previewStyle}>
          {/* Page Number */}
          <div className="a4-page-no">หน้า 1 / 1</div>

          {/* Dynamically Ordered Blocks */}
          <div className="a4-body">
            {sortedBlocks.filter(b => b.visible).map((block) => {
              switch (block.id) {
                case 'header':
                  return (
                    <div 
                      key={block.id}
                      className={`designer-draggable-block ${selectedBlockId === block.id ? 'selected' : ''}`}
                      onClick={() => setSelectedBlockId(block.id)}
                    >
                      <div className="drag-handle-badge">บริษัท & โลโก้</div>
                      <div className="company-header">
                        <div className="company-name">บริษัท ยังค์มีดี ฟิวเจอร์ กรุงเทพ จำกัด</div>
                        <div className="company-addr">
                          55/5 ถ.บางขุนเทียน-ชายทะเล แขวงแสมดำ เขตบางขุนเทียน กรุงเทพ 10150
                          <br />
                          โทร. 02 415 3555 โทรสาร 02 415 5115
                        </div>
                      </div>
                    </div>
                  );

                case 'docTitle':
                  return (
                    <div 
                      key={block.id}
                      className={`designer-draggable-block ${selectedBlockId === block.id ? 'selected' : ''}`}
                      onClick={() => setSelectedBlockId(block.id)}
                    >
                      <div className="drag-handle-badge">หัวข้อเอกสาร</div>
                      <div className="form-title">
                        {block.customLabel || 'ใบสั่งซื้อ (Purchase Order)'}
                      </div>
                    </div>
                  );

                case 'vendorInfo':
                  return (
                    <div 
                      key={block.id}
                      className={`designer-draggable-block ${selectedBlockId === block.id ? 'selected' : ''}`}
                      onClick={() => setSelectedBlockId(block.id)}
                    >
                      <div className="drag-handle-badge">ข้อมูลผู้ขาย (ซ้าย)</div>
                      <div className="vendor-code-row">
                        <span className="k">รหัสผู้ขาย:</span>
                        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <span>PS-FUR-GRE-001</span>
                          <span style={{ marginLeft: '40px', fontWeight: 600 }}>ชื่อผู้ติดต่อ:</span>
                          <span style={{ marginLeft: '8px' }}>คุณสมชาย สายน้ำเย็น</span>
                        </div>
                      </div>
                      <div className="header-grid" style={{ marginBottom: 0 }}>
                        <div className="col">
                          <div className="kv"><span className="k">ชื่อผู้ขาย:</span><span>บริษัท ปินาโต จำกัด</span></div>
                          <div className="kv"><span className="k">ที่อยู่:</span><span>เลขที่ 63/16 หมู่ที่ 7 ต.คลองสวนพลู อ.พระนครศรีอยุธยา จ.พระนครศรีอยุธยา</span></div>
                          <div className="kv">
                            <span className="k">โทร.:</span>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <span>084-166-9915</span>
                              <span style={{ marginLeft: '40px', fontWeight: 600 }}>โทรสาร:</span>
                              <span style={{ marginLeft: '8px' }}>-</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );

                case 'docMetadata':
                  return (
                    <div 
                      key={block.id}
                      className={`designer-draggable-block ${selectedBlockId === block.id ? 'selected' : ''}`}
                      onClick={() => setSelectedBlockId(block.id)}
                    >
                      <div className="drag-handle-badge">เลขที่ & วันที่ (ขวา)</div>
                      <div className="header-grid">
                        <div className="col"></div>
                        <div className="col">
                          <div className="kv"><span className="k">เลขที่เอกสาร:</span><span>PO-202606-0002</span></div>
                          <div className="kv"><span className="k">วันที่เอกสาร:</span><span>08/06/2026</span></div>
                          <div className="kv"><span className="k">วันที่กำหนดส่ง:</span><span>15/06/2026</span></div>
                          <div className="kv"><span className="k">จำนวนวันเครดิต:</span><span>30 วัน</span></div>
                        </div>
                      </div>
                    </div>
                  );

                case 'itemsTable':
                  return (
                    <div 
                      key={block.id}
                      className={`designer-draggable-block ${selectedBlockId === block.id ? 'selected' : ''}`}
                      onClick={() => setSelectedBlockId(block.id)}
                    >
                      <div className="drag-handle-badge">ตารางสินค้า</div>
                      <table className="items-table">
                        <thead>
                          <tr>
                            <th style={{ width: '6%' }} className="ta-center">ลำดับ</th>
                            <th style={{ width: '15%' }} className="ta-left">รหัสสินค้า</th>
                            <th style={{ width: '28%' }} className="ta-left">รายการ</th>
                            <th style={{ width: '8%' }} className="ta-right">จำนวน</th>
                            <th style={{ width: '9%' }} className="ta-center">หน่วย</th>
                            <th style={{ width: '12%' }} className="ta-right">ราคา/หน่วย</th>
                            <th style={{ width: '10%' }} className="ta-right">ส่วนลด</th>
                            <th style={{ width: '13%' }} className="ta-right">จำนวนเงิน</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="ta-center">1</td>
                            <td className="ta-left">PS-MKT001</td>
                            <td className="ta-left">Sticker PP (Indoor) Size 78.9 x 130 cm. x 2P</td>
                            <td className="ta-right">2.00</td>
                            <td className="ta-center">ชิ้น</td>
                            <td className="ta-right">100.00</td>
                            <td className="ta-right">-</td>
                            <td className="ta-right">200.00</td>
                          </tr>
                          <tr>
                            <td className="ta-center">2</td>
                            <td className="ta-left">PS-MKT002</td>
                            <td className="ta-left">PP Board 5 mm. (สีขาว)</td>
                            <td className="ta-right">2.00</td>
                            <td className="ta-center">ชิ้น</td>
                            <td className="ta-right">50.00</td>
                            <td className="ta-right">-</td>
                            <td className="ta-right">100.00</td>
                          </tr>
                          <tr className="empty-row"><td colSpan={8}>&nbsp;</td></tr>
                          <tr className="empty-row"><td colSpan={8}>&nbsp;</td></tr>
                        </tbody>
                      </table>
                    </div>
                  );

                case 'summaryBlock':
                  return (
                    <div 
                      key={block.id}
                      className={`designer-draggable-block ${selectedBlockId === block.id ? 'selected' : ''}`}
                      onClick={() => setSelectedBlockId(block.id)}
                    >
                      <div className="drag-handle-badge">สรุปผลยอดเงินรวม</div>
                      <table className="summary-block">
                        <tbody>
                          <tr>
                            <td className="notes-cell" rowSpan={4}>
                              <div className="notes-header"><strong>หมายเหตุ</strong></div>
                              <div className="notes-content" style={{ minHeight: '40px' }}>ตัวอย่างหมายเหตุการจัดซื้อสินค้า...</div>
                            </td>
                            <td className="sum-label">รวมเงิน</td>
                            <td className="sum-value">300.00</td>
                          </tr>
                          <tr>
                            <td className="sum-label">ส่วนลดสินค้า(เป็นเงิน)</td>
                            <td className="sum-value">0.00</td>
                          </tr>
                          <tr>
                            <td className="sum-label">เงินหลังหักส่วนลด</td>
                            <td className="sum-value">300.00</td>
                          </tr>
                          <tr>
                            <td className="sum-label">ภาษีมูลค่าเพิ่ม 7%</td>
                            <td className="sum-value">21.00</td>
                          </tr>
                          <tr>
                            <td className="baht-cell" style={{ textAlign: 'center' }}>( สามร้อยยี่สิบเอ็ดบาทถ้วน )</td>
                            <td className="sum-label grand">จำนวนเงินทั้งสิ้น</td>
                            <td className="sum-value grand">321.00</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  );

                case 'signatures':
                  return (
                    <div 
                      key={block.id}
                      className={`designer-draggable-block ${selectedBlockId === block.id ? 'selected' : ''}`}
                      onClick={() => setSelectedBlockId(block.id)}
                    >
                      <div className="drag-handle-badge">บล็อกลายเซ็นอนุมัติ</div>
                      <div className="sig-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: '20px' }}>
                        <div className="sig">
                          <div className="sig-line"></div>
                          <div className="sig-label">ผู้จัดทำ</div>
                          <div className="sig-date">วันที่ _____ / _____ / _________</div>
                        </div>
                        <div className="sig">
                          <div className="sig-line"></div>
                          <div className="sig-label">ผู้ตรวจสอบ</div>
                          <div className="sig-date">วันที่ _____ / _____ / _________</div>
                        </div>
                        <div className="sig">
                          <div className="sig-line"></div>
                          <div className="sig-label">ผู้อนุมัติ</div>
                          <div className="sig-date">วันที่ _____ / _____ / _________</div>
                        </div>
                      </div>
                    </div>
                  );

                default:
                  return null;
              }
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
