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

export interface BlockItem {
  id: string;
  name: string;
  visible: boolean;
}

export interface PrintLayoutConfig {
  fontFamily: string;
  baseSize: number;
  headerMt: number;
  nameSize: number;
  nameMb: number;
  addrSize: number;
  addrLh: number;
  tableSize: number;
  paddingTop: number;
  paddingBottom: number;
  paddingLeftRight: number;
  blocks: BlockItem[];
  fields?: Record<string, { fontSize?: number; visible?: boolean }>;
  columnWidths?: Record<string, string>;
  blockSpacings?: Record<string, { mt: number; mb: number; pl: number; pr: number }>;
}

const DEFAULT_BLOCKS: BlockItem[] = [
  { id: 'header', name: 'หัวข้อบริษัท & ที่อยู่', visible: true },
  { id: 'title', name: 'ชื่อหัวข้อเอกสาร', visible: true },
  { id: 'headerGrid', name: 'ข้อมูลผู้ขาย/เอกสารอ้างอิง', visible: true },
  { id: 'itemsTable', name: 'ตารางสินค้า', visible: true },
  { id: 'summaryBlock', name: 'ตารางสรุปผลยอดเงินรวม', visible: true },
  { id: 'termsBlock', name: 'เงื่อนไขและข้อกำหนด', visible: true },
  { id: 'signatureRow', name: 'บล็อกลายเซ็นอนุมัติ', visible: true },
];

const DEFAULT_CONFIG: PrintLayoutConfig = {
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
  blocks: DEFAULT_BLOCKS,
};

export function PrintToolbar() {
  const navigate = useNavigate();
  const [showConfig, setShowConfig] = React.useState(() => {
    return localStorage.getItem('ymd_print_design_mode') === 'true';
  });
  
  const [config, setConfig] = React.useState<PrintLayoutConfig>(() => {
    const saved = localStorage.getItem('ymd_print_layout_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Sync and merge blocks to make sure no fields are lost
        const mergedBlocks = DEFAULT_BLOCKS.map(db => {
          const pb = parsed.blocks?.find((b: BlockItem) => b.id === db.id);
          return pb ? { ...db, ...pb } : db;
        });
        return { ...DEFAULT_CONFIG, ...parsed, blocks: mergedBlocks };
      } catch (e) {
        console.warn(e);
      }
    }
    return DEFAULT_CONFIG;
  });

  const [editingField, setEditingField] = React.useState<{ fieldKey: string; label: string; config: { fontSize?: number; visible?: boolean } } | null>(null);
  const [editingColumn, setEditingColumn] = React.useState<{ col: string; label: string; width: string } | null>(null);

  React.useEffect(() => {
    const handleOpenEditor = (e: Event) => {
      const ev = e as CustomEvent;
      setEditingField(ev.detail);
    };
    const handleOpenColEditor = (e: Event) => {
      const ev = e as CustomEvent;
      setEditingColumn(ev.detail);
    };
    window.addEventListener('ymd_open_field_editor', handleOpenEditor);
    window.addEventListener('ymd_open_column_editor', handleOpenColEditor);
    return () => {
      window.removeEventListener('ymd_open_field_editor', handleOpenEditor);
      window.removeEventListener('ymd_open_column_editor', handleOpenColEditor);
    };
  }, []);

  React.useEffect(() => {
    localStorage.setItem('ymd_print_layout_config', JSON.stringify(config));
    window.dispatchEvent(new Event('ymd_print_config_changed'));
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

  React.useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('ymd_print_layout_config');
      if (saved) {
        try {
          setConfig(prev => ({ ...prev, ...JSON.parse(saved) }));
        } catch (e) {
          console.warn(e);
        }
      } else {
        setConfig(DEFAULT_CONFIG);
      }
    };
    window.addEventListener('ymd_print_config_changed', handleStorageChange);
    return () => window.removeEventListener('ymd_print_config_changed', handleStorageChange);
  }, []);

  const toggleConfig = () => {
    const nextVal = !showConfig;
    setShowConfig(nextVal);
    localStorage.setItem('ymd_print_design_mode', String(nextVal));
    window.dispatchEvent(new Event('ymd_print_config_changed'));
  };

  const resetConfig = () => {
    localStorage.removeItem('ymd_print_layout_config');
    setConfig(DEFAULT_CONFIG);
    window.dispatchEvent(new Event('ymd_print_config_changed'));
  };

  const handleSliderChange = (key: keyof PrintLayoutConfig, val: unknown) => {
    setConfig((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <div className="print-config-container no-print">
      <div className="print-toolbar" style={{ width: '100%', margin: 0 }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-back" onClick={() => navigate(-1)}>
            ← ย้อนกลับ
          </button>
          <button className="btn-config-toggle" onClick={toggleConfig}>
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

          {/* Re-orderable block layout controls in settings sidebar panel */}
          <div className="config-group" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '12px', marginTop: '8px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '9.5pt', color: '#1e3a8a' }}>ซ่อน/แสดงและปรับลำดับตำแหน่ง (Design Layout):</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {config.blocks.map((block: BlockItem, idx: number) => (
                <div key={block.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '9pt', cursor: 'pointer', fontWeight: '500', margin: 0, color: '#334155' }}>
                    <input 
                      type="checkbox" 
                      checked={block.visible} 
                      onChange={(e) => {
                        const newBlocks = config.blocks.map((b: BlockItem) => b.id === block.id ? { ...b, visible: e.target.checked } : b);
                        handleSliderChange('blocks', newBlocks);
                      }} 
                    />
                    {block.name}
                  </label>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button
                      disabled={idx === 0}
                      onClick={() => {
                        const newBlocks = [...config.blocks];
                        const temp = newBlocks[idx];
                        newBlocks[idx] = newBlocks[idx - 1];
                        newBlocks[idx - 1] = temp;
                        handleSliderChange('blocks', newBlocks);
                      }}
                      style={{ border: 'none', background: 'none', cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.3 : 1, fontSize: '10pt', color: '#475569' }}
                      title="เลื่อนขึ้น"
                    >
                      ▲
                    </button>
                    <button
                      disabled={idx === config.blocks.length - 1}
                      onClick={() => {
                        const newBlocks = [...config.blocks];
                        const temp = newBlocks[idx];
                        newBlocks[idx] = newBlocks[idx + 1];
                        newBlocks[idx + 1] = temp;
                        handleSliderChange('blocks', newBlocks);
                      }}
                      style={{ border: 'none', background: 'none', cursor: idx === config.blocks.length - 1 ? 'not-allowed' : 'pointer', opacity: idx === config.blocks.length - 1 ? 0.3 : 1, fontSize: '10pt', color: '#475569' }}
                      title="เลื่อนลง"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="config-group" style={{ justifyContent: 'flex-end', gridColumn: 'span 2', marginTop: '10px' }}>
            <button className="btn-reset" onClick={resetConfig}>
              รีเซ็ตค่าเริ่มต้น
            </button>
          </div>
        </div>
      )}

      {/* 🛠️ Global Sub-Field Editor Popover */}
      {editingField && (
        <div className="field-editor-overlay no-print" onClick={() => setEditingField(null)}>
          <div className="field-editor-popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <strong style={{ fontSize: '10pt', color: '#1e3a8a' }}>ตั้งค่าฟิลด์: {editingField.label}</strong>
              <button className="popup-close" onClick={() => setEditingField(null)}>×</button>
            </div>
            <div className="popup-body">
              <div className="config-group">
                <label style={{ fontSize: '9pt', color: '#475569' }}>
                  ขนาดตัวอักษรเฉพาะฟิลด์: <span>{editingField.config.fontSize ? `${editingField.config.fontSize} pt` : 'ขนาดปกติ'}</span>
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                  <input
                    type="range"
                    min="7"
                    max="22"
                    step="0.5"
                    value={editingField.config.fontSize || 11}
                    onChange={(e) => {
                      const fs = Number(e.target.value);
                      const saved = localStorage.getItem('ymd_print_layout_config');
                      const parsed = saved ? JSON.parse(saved) : {};
                      if (!parsed.fields) parsed.fields = {};
                      parsed.fields[editingField.fieldKey] = {
                        ...parsed.fields[editingField.fieldKey],
                        fontSize: fs
                      };
                      localStorage.setItem('ymd_print_layout_config', JSON.stringify(parsed));
                      window.dispatchEvent(new Event('ymd_print_config_changed'));
                      setEditingField(prev => prev ? { ...prev, config: { ...prev.config, fontSize: fs } } : null);
                    }}
                    style={{ flex: 1 }}
                  />
                  <button 
                    className="btn-reset" 
                    style={{ padding: '2px 8px', height: '24px', fontSize: '8pt', background: '#475569', minWidth: '60px' }}
                    onClick={() => {
                      const saved = localStorage.getItem('ymd_print_layout_config');
                      const parsed = saved ? JSON.parse(saved) : {};
                      if (parsed.fields?.[editingField.fieldKey]) {
                        delete parsed.fields[editingField.fieldKey].fontSize;
                      }
                      localStorage.setItem('ymd_print_layout_config', JSON.stringify(parsed));
                      window.dispatchEvent(new Event('ymd_print_config_changed'));
                      setEditingField(prev => prev ? { ...prev, config: { ...prev.config, fontSize: undefined } } : null);
                    }}
                  >
                    รีเซ็ต
                  </button>
                </div>
              </div>

              <div className="config-group" style={{ marginTop: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '9pt', color: '#334155' }}>
                  <input
                    type="checkbox"
                    checked={editingField.config.visible !== false}
                    onChange={(e) => {
                      const vis = e.target.checked;
                      const saved = localStorage.getItem('ymd_print_layout_config');
                      const parsed = saved ? JSON.parse(saved) : {};
                      if (!parsed.fields) parsed.fields = {};
                      parsed.fields[editingField.fieldKey] = {
                        ...parsed.fields[editingField.fieldKey],
                        visible: vis
                      };
                      localStorage.setItem('ymd_print_layout_config', JSON.stringify(parsed));
                      window.dispatchEvent(new Event('ymd_print_config_changed'));
                      setEditingField(prev => prev ? { ...prev, config: { ...prev.config, visible: vis } } : null);
                    }}
                  />
                  แสดงผลฟิลด์ย่อยนี้
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ↔️ Global Table Column Width Editor Popover */}
      {editingColumn && (
        <div className="field-editor-overlay no-print" onClick={() => setEditingColumn(null)}>
          <div className="field-editor-popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <strong style={{ fontSize: '10pt', color: '#1e3a8a' }}>ความกว้างคอลัมน์: {editingColumn.label}</strong>
              <button className="popup-close" onClick={() => setEditingColumn(null)}>×</button>
            </div>
            <div className="popup-body">
              <div className="config-group">
                <label style={{ fontSize: '9pt', color: '#475569' }}>
                  สัดส่วนความกว้าง: <span>{editingColumn.width}</span>
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                  <input
                    type="range"
                    min="4"
                    max="65"
                    step="1"
                    value={parseInt(editingColumn.width) || 10}
                    onChange={(e) => {
                      const w = `${e.target.value}%`;
                      const saved = localStorage.getItem('ymd_print_layout_config');
                      const parsed = saved ? JSON.parse(saved) : {};
                      if (!parsed.columnWidths) parsed.columnWidths = {};
                      parsed.columnWidths[editingColumn.col] = w;
                      localStorage.setItem('ymd_print_layout_config', JSON.stringify(parsed));
                      window.dispatchEvent(new Event('ymd_print_config_changed'));
                      setEditingColumn(prev => prev ? { ...prev, width: w } : null);
                    }}
                    style={{ flex: 1 }}
                  />
                  <button 
                    className="btn-reset" 
                    style={{ padding: '2px 8px', height: '24px', fontSize: '8pt', background: '#475569', minWidth: '60px' }}
                    onClick={() => {
                      const saved = localStorage.getItem('ymd_print_layout_config');
                      const parsed = saved ? JSON.parse(saved) : {};
                      if (parsed.columnWidths && editingColumn) {
                        delete parsed.columnWidths[editingColumn.col];
                      }
                      localStorage.setItem('ymd_print_layout_config', JSON.stringify(parsed));
                      window.dispatchEvent(new Event('ymd_print_config_changed'));
                      const colId = editingColumn ? (editingColumn.col as PrintCol) : 'no';
                      const orig = COLUMN_WIDTHS[colId] || '10%';
                      setEditingColumn(prev => prev ? { ...prev, width: orig } : null);
                    }}
                  >
                    รีเซ็ต
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to determine block ID of a child element
function getBlockId(child: React.ReactElement): string | null {
  if (!child || !child.type) return null;
  if (child.type === FormTitle) return 'title';
  if (child.type === HeaderGrid) return 'headerGrid';
  if (child.type === ItemsTable) return 'itemsTable';
  if (child.type === SummaryBlock) return 'summaryBlock';
  if (child.type === TermsBlock) return 'termsBlock';
  if (child.type === SignatureRow) return 'signatureRow';
  return null;
}

export function A4Page({ children, pageNo = 1, pageTotal = 1 }: { children: React.ReactNode; pageNo?: number; pageTotal?: number }) {
  const [layoutConfig, setLayoutConfig] = React.useState<PrintLayoutConfig>(() => {
    const saved = localStorage.getItem('ymd_print_layout_config');
    try {
      return saved ? JSON.parse(saved) : ({} as PrintLayoutConfig);
    } catch (e) {
      console.warn(e);
      return {} as PrintLayoutConfig;
    }
  });

  const [isDesignMode, setIsDesignMode] = React.useState(() => {
    return localStorage.getItem('ymd_print_design_mode') === 'true';
  });

  const [draggedId, setDraggedId] = React.useState<string | null>(null);
  const [canDragBlockId, setCanDragBlockId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const handleChanged = () => {
      const saved = localStorage.getItem('ymd_print_layout_config');
      try {
        if (saved) setLayoutConfig(JSON.parse(saved));
      } catch (e) {
        console.warn(e);
      }
      setIsDesignMode(localStorage.getItem('ymd_print_design_mode') === 'true');
    };
    window.addEventListener('ymd_print_config_changed', handleChanged);
    return () => window.removeEventListener('ymd_print_config_changed', handleChanged);
  }, []);

  const arr = React.Children.toArray(children).flat(Infinity).filter(Boolean) as React.ReactElement[];
  
  // Extract and map components to blocks
  const blocksConfigList: BlockItem[] = layoutConfig.blocks || DEFAULT_BLOCKS;

  // Render inline reordering action handlers
  const moveBlockInline = (id: string, direction: 'up' | 'down') => {
    const newBlocks = [...blocksConfigList];
    const idx = newBlocks.findIndex(b => b.id === id);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newBlocks.length) return;

    // Swap
    const temp = newBlocks[idx];
    newBlocks[idx] = newBlocks[targetIdx];
    newBlocks[targetIdx] = temp;

    const updatedConfig = { ...layoutConfig, blocks: newBlocks };
    localStorage.setItem('ymd_print_layout_config', JSON.stringify(updatedConfig));
    window.dispatchEvent(new Event('ymd_print_config_changed'));
  };

  const toggleVisibilityInline = (id: string) => {
    const newBlocks = blocksConfigList.map(b => b.id === id ? { ...b, visible: !b.visible } : b);
    const updatedConfig = { ...layoutConfig, blocks: newBlocks };
    localStorage.setItem('ymd_print_layout_config', JSON.stringify(updatedConfig));
    window.dispatchEvent(new Event('ymd_print_config_changed'));
  };

  const getBlockSpacing = (id: string) => {
    return layoutConfig.blockSpacings?.[id] || { mt: 0, mb: 0, pl: 0, pr: 0 };
  };

  const adjustBlockSpacing = (id: string, prop: 'mt' | 'mb' | 'pl' | 'pr', amount: number) => {
    const saved = localStorage.getItem('ymd_print_layout_config');
    const parsed = saved ? JSON.parse(saved) : {};
    if (!parsed.blockSpacings) parsed.blockSpacings = {};
    if (!parsed.blockSpacings[id]) {
      // Establish defaults based on common css rules
      let mt = 0, mb = 0;
      const pl = 0, pr = 0;
      if (id === 'title') { mt = 14; mb = 16; }
      else if (id === 'headerGrid') { mb = 10; }
      else if (id === 'signatureRow') { mt = 22; }
      parsed.blockSpacings[id] = { mt, mb, pl, pr };
    }
    parsed.blockSpacings[id][prop] = Math.max(0, parsed.blockSpacings[id][prop] + amount);
    localStorage.setItem('ymd_print_layout_config', JSON.stringify(parsed));
    window.dispatchEvent(new Event('ymd_print_config_changed'));
  };

  // Build rendered components ordered by config
  const renderedBlocks: React.ReactNode[] = [];

  blocksConfigList.forEach((blockItem) => {
    const isVisible = blockItem.visible;
    let componentToRender: React.ReactNode = null;

    if (blockItem.id === 'header') {
      componentToRender = <CompanyHeader />;
    } else {
      // Find matching child element
      const matchedChild = arr.find((child) => getBlockId(child) === blockItem.id);
      if (matchedChild) {
        componentToRender = matchedChild;
      }
    }

    if (!componentToRender) return;

    const sp = getBlockSpacing(blockItem.id);
    const blockStyle: React.CSSProperties = {
      marginTop: sp.mt ? `${sp.mt}px` : undefined,
      marginBottom: sp.mb ? `${sp.mb}px` : undefined,
      paddingLeft: sp.pl ? `${sp.pl}px` : undefined,
      paddingRight: sp.pr ? `${sp.pr}px` : undefined,
    };

    if (isDesignMode) {
      if (isVisible) {
        renderedBlocks.push(
          <div 
            key={blockItem.id} 
            className={`designer-block-wrapper print-block-${blockItem.id} ${draggedId === blockItem.id ? 'dragging' : ''}`} 
            style={blockStyle}
            draggable={isDesignMode && canDragBlockId === blockItem.id}
            onDragStart={(e) => {
              setDraggedId(blockItem.id);
              e.dataTransfer.effectAllowed = 'move';
            }}
            onDragOver={(e) => {
              e.preventDefault();
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (draggedId && draggedId !== blockItem.id) {
                const newBlocks = [...blocksConfigList];
                const draggedIdx = newBlocks.findIndex(b => b.id === draggedId);
                const targetIdx = newBlocks.findIndex(b => b.id === blockItem.id);
                if (draggedIdx !== -1 && targetIdx !== -1) {
                  const [removed] = newBlocks.splice(draggedIdx, 1);
                  newBlocks.splice(targetIdx, 0, removed);
                  const updatedConfig = { ...layoutConfig, blocks: newBlocks };
                  localStorage.setItem('ymd_print_layout_config', JSON.stringify(updatedConfig));
                  window.dispatchEvent(new Event('ymd_print_config_changed'));
                }
              }
              setDraggedId(null);
            }}
            onDragEnd={() => {
              setDraggedId(null);
            }}
          >
            <div className="designer-block-controls no-print" style={{ cursor: 'default' }}>
              <span 
                className="designer-block-badge" 
                onMouseEnter={() => setCanDragBlockId(blockItem.id)}
                onMouseLeave={() => setCanDragBlockId(null)}
                style={{ cursor: 'grab' }}
              >
                ☰ {blockItem.name}
              </span>
              
              {/* Spacing buttons */}
              <span className="block-spacing-group">
                <span className="spacing-label">↕️ บน-ล่าง:</span>
                <button className="spacing-btn" onClick={() => { adjustBlockSpacing(blockItem.id, 'mt', -2); adjustBlockSpacing(blockItem.id, 'mb', -2); }} title="ลดระยะห่าง บน-ล่าง" style={{ cursor: 'pointer' }}>-</button>
                <button className="spacing-btn" onClick={() => { adjustBlockSpacing(blockItem.id, 'mt', 2); adjustBlockSpacing(blockItem.id, 'mb', 2); }} title="เพิ่มระยะห่าง บน-ล่าง" style={{ cursor: 'pointer' }}>+</button>
              </span>
              <span className="block-spacing-group">
                <span className="spacing-label">↔️ ซ้าย-ขวา:</span>
                <button className="spacing-btn" onClick={() => { adjustBlockSpacing(blockItem.id, 'pl', -4); adjustBlockSpacing(blockItem.id, 'pr', -4); }} title="ลดขอบ ซ้าย-ขวา" style={{ cursor: 'pointer' }}>-</button>
                <button className="spacing-btn" onClick={() => { adjustBlockSpacing(blockItem.id, 'pl', 4); adjustBlockSpacing(blockItem.id, 'pr', 4); }} title="เพิ่มขอบ ซ้าย-ขวา" style={{ cursor: 'pointer' }}>+</button>
              </span>

              <button className="designer-control-btn" onClick={() => moveBlockInline(blockItem.id, 'up')} title="เลื่อนขึ้น" style={{ cursor: 'pointer' }}>▲</button>
              <button className="designer-control-btn" onClick={() => moveBlockInline(blockItem.id, 'down')} title="เลื่อนลง" style={{ cursor: 'pointer' }}>▼</button>
              <button className="designer-control-btn" onClick={() => toggleVisibilityInline(blockItem.id)} title="ซ่อนบล็อก" style={{ cursor: 'pointer' }}>👁️ ซ่อน</button>
            </div>
            {componentToRender}
          </div>
        );
      } else {
        // Show interactive hidden placeholder in Design Mode so user can show it again
        renderedBlocks.push(
          <div 
            key={blockItem.id} 
            className={`designer-block-hidden-placeholder print-block-${blockItem.id} no-print`}
            onClick={() => toggleVisibilityInline(blockItem.id)}
            title="คลิกเพื่อเปิดการแสดงผล"
            style={blockStyle}
          >
            <span>👁️‍🗨️ [ซ่อนอยู่] {blockItem.name} (คลิกเพื่อแสดงผล)</span>
          </div>
        );
      }
    } else {
      if (isVisible) {
        renderedBlocks.push(
          <div key={blockItem.id} className={`print-block-${blockItem.id}`} style={blockStyle}>
            {componentToRender}
          </div>
        );
      }
    }
  });

  // Fallback for any children not managed by blocks config
  const unmanagedChildren = arr.filter((child) => {
    const bid = getBlockId(child);
    return !bid || !blocksConfigList.some(b => b.id === bid);
  });

  return (
    <div className={`a4-page ${isDesignMode ? 'design-mode-active' : ''}`}>
      <div className="a4-page-no">
        หน้า {pageNo} / {pageTotal}
      </div>
      <div className="a4-body">
        {renderedBlocks}
        {unmanagedChildren}
      </div>
    </div>
  );
}

// 3.5. InteractiveField - Interactive sub-field component
export function InteractiveField({ 
  fieldKey, 
  label, 
  children, 
  className = '',
  style
}: { 
  fieldKey: string; 
  label: string; 
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [layoutConfig, setLayoutConfig] = React.useState<PrintLayoutConfig>(() => {
    const saved = localStorage.getItem('ymd_print_layout_config');
    try { return saved ? JSON.parse(saved) : ({} as PrintLayoutConfig); } catch (e) { console.warn(e); return {} as PrintLayoutConfig; }
  });

  const [isDesignMode, setIsDesignMode] = React.useState(() => {
    return localStorage.getItem('ymd_print_design_mode') === 'true';
  });

  React.useEffect(() => {
    const handleChanged = () => {
      const saved = localStorage.getItem('ymd_print_layout_config');
      try { if (saved) setLayoutConfig(JSON.parse(saved)); } catch (e) { console.warn(e); }
      setIsDesignMode(localStorage.getItem('ymd_print_design_mode') === 'true');
    };
    window.addEventListener('ymd_print_config_changed', handleChanged);
    return () => window.removeEventListener('ymd_print_config_changed', handleChanged);
  }, []);

  const fieldConfig = layoutConfig.fields?.[fieldKey] || { fontSize: null, visible: true };

  if (!fieldConfig.visible && !isDesignMode) {
    return null;
  }

  const customStyle: React.CSSProperties = { ...style };
  if (fieldConfig.fontSize) {
    customStyle.fontSize = `${fieldConfig.fontSize}pt`;
  }

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('ymd_open_field_editor', {
      detail: { fieldKey, label, config: fieldConfig }
    }));
  };

  const handleIncreaseFont = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentFs = fieldConfig.fontSize || 11;
    const nextFs = currentFs + 0.5;
    updateFieldConfig({ fontSize: nextFs });
  };

  const handleDecreaseFont = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentFs = fieldConfig.fontSize || 11;
    const nextFs = Math.max(6, currentFs - 0.5);
    updateFieldConfig({ fontSize: nextFs });
  };

  const handleToggleVisible = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateFieldConfig({ visible: !fieldConfig.visible });
  };

  const updateFieldConfig = (updates: { fontSize?: number | null; visible?: boolean }) => {
    const saved = localStorage.getItem('ymd_print_layout_config');
    const parsed = saved ? JSON.parse(saved) : {};
    if (!parsed.fields) parsed.fields = {};
    parsed.fields[fieldKey] = {
      ...parsed.fields[fieldKey],
      ...updates
    };
    localStorage.setItem('ymd_print_layout_config', JSON.stringify(parsed));
    window.dispatchEvent(new Event('ymd_print_config_changed'));
  };

  return (
    <span 
      className={`${className} ${isDesignMode ? 'design-field-interactive no-print-bg' : ''} ${fieldConfig.visible === false ? 'design-field-hidden' : ''}`}
      style={customStyle}
      onClick={isDesignMode ? handleEditClick : undefined}
      title={isDesignMode ? `คลิกเพื่อปรับแต่งฟิลด์ ${label}` : undefined}
    >
      {children}
      {isDesignMode && (
        <span className="field-hover-actions no-print">
          <button className="field-action-btn" onClick={handleDecreaseFont} title="ลดขนาดตัวอักษร (A-)" style={{ cursor: 'pointer' }}>-</button>
          <span className="field-action-label" title="ขนาดอักษรปัจจุบัน">{fieldConfig.fontSize || 11}</span>
          <button className="field-action-btn" onClick={handleIncreaseFont} title="เพิ่มขนาดตัวอักษร (A+)" style={{ cursor: 'pointer' }}>+</button>
          <button className="field-action-btn hide-btn" onClick={handleToggleVisible} title="ซ่อนฟิลด์นี้" style={{ cursor: 'pointer' }}>👁️</button>
        </span>
      )}
    </span>
  );
}

// 4. CompanyHeader - Centralized company info
export function CompanyHeader() {
  return (
    <div className="company-header">
      <div className="company-name">
        <InteractiveField fieldKey="company_name" label="ชื่อบริษัท">
          {COMPANY.name}
        </InteractiveField>
      </div>
      <div className="company-addr">
        <InteractiveField fieldKey="company_addr" label="ที่อยู่บริษัท">
          {COMPANY.addr}
        </InteractiveField>
        <br />
        <InteractiveField fieldKey="company_tel" label="เบอร์โทร/เลขผู้เสียภาษี">
          {COMPANY.tel}
        </InteractiveField>
      </div>
    </div>
  );
}

// 5. FormTitle - Document Title
export function FormTitle({ title }: { title: string }) {
  return (
    <div className="form-title">
      <InteractiveField fieldKey="document_title" label="ชื่อหัวข้อเอกสาร">
        {title}
      </InteractiveField>
    </div>
  );
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
        <div className="vendor-code-row" style={{ display: 'flex', alignItems: 'center' }}>
          <InteractiveField 
            fieldKey={`header_${topLeft.label}`} 
            label={topLeft.label}
            style={{ display: 'inline-flex', alignItems: 'center', width: '100%', gap: '12px' }}
          >
            <span className="k" style={{ minWidth: '90px', fontWeight: 700 }}>{topLeft.label}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', flex: 1 }}>{topLeft.value ?? '-'}</span>
          </InteractiveField>
        </div>
      )}
      <div className="header-grid">
        <div className="col">
          {left.map((f, idx) => (
            <InteractiveField key={idx} fieldKey={`header_${f.label}`} label={f.label} className="kv">
              <span className="k">{f.label}</span>
              <span>{f.value ?? '-'}</span>
            </InteractiveField>
          ))}
        </div>
        <div className="col">
          {right.map((f, idx) => (
            <InteractiveField key={idx} fieldKey={`header_${f.label}`} label={f.label} className="kv">
              <span className="k">{f.label}</span>
              <span>{f.value ?? '-'}</span>
            </InteractiveField>
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
  name: 'รายการ',
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
  name: '28%',
  marketing: '10%',
  warehouse: '10%',
  location: '10%',
  qty: '8%',
  qtyApproved: '8%',
  uom: '9%',
  unitPrice: '12%',
  discount: '10%',
  amount: '13%',
};

// 7. ItemsTable - Grid table for items list with spacer-row
export function ItemsTable({
  columns,
  rows,
  minRows = 4,
  customHeaders,
  customWidths,
}: {
  columns: PrintCol[];
  rows: PrintRow[];
  minRows?: number;
  customHeaders?: Partial<Record<PrintCol, string>>;
  customWidths?: Partial<Record<PrintCol, string>>;
}) {
  const emptyRowCount = Math.max(0, minRows - rows.length);
  const emptyRows = Array.from({ length: emptyRowCount });

  const [layoutConfig, setLayoutConfig] = React.useState<PrintLayoutConfig>(() => {
    const saved = localStorage.getItem('ymd_print_layout_config');
    try { return saved ? JSON.parse(saved) : ({} as PrintLayoutConfig); } catch (e) { console.warn(e); return {} as PrintLayoutConfig; }
  });

  const [isDesignMode, setIsDesignMode] = React.useState(() => {
    return localStorage.getItem('ymd_print_design_mode') === 'true';
  });

  React.useEffect(() => {
    const handleChanged = () => {
      const saved = localStorage.getItem('ymd_print_layout_config');
      try { if (saved) setLayoutConfig(JSON.parse(saved)); } catch (e) { console.warn(e); }
      setIsDesignMode(localStorage.getItem('ymd_print_design_mode') === 'true');
    };
    window.addEventListener('ymd_print_config_changed', handleChanged);
    return () => window.removeEventListener('ymd_print_config_changed', handleChanged);
  }, []);

  const savedWidths = layoutConfig.columnWidths || {};

  return (
    <table className="items-table">
      <colgroup>
        {columns.map((col) => {
          const w = savedWidths[col] || customWidths?.[col] || COLUMN_WIDTHS[col];
          return <col key={col} style={{ width: w }} />;
        })}
      </colgroup>
      <thead>
        <tr>
          {columns.map((col) => {
            const headerText = customHeaders?.[col] ?? COLUMN_HEADERS[col];
            
            const handleHeaderClick = (e: React.MouseEvent) => {
              if (!isDesignMode) return;
              e.stopPropagation();
              const currentW = savedWidths[col] || customWidths?.[col] || COLUMN_WIDTHS[col];
              window.dispatchEvent(new CustomEvent('ymd_open_column_editor', {
                detail: { col, label: headerText, width: currentW }
              }));
            };

            const handleIncreaseWidth = (e: React.MouseEvent) => {
              e.stopPropagation();
              const currentW = parseInt(savedWidths[col] || COLUMN_WIDTHS[col]) || 10;
              const nextW = `${Math.min(70, currentW + 1)}%`;
              updateColConfig(col, nextW);
            };

            const handleDecreaseWidth = (e: React.MouseEvent) => {
              e.stopPropagation();
              const currentW = parseInt(savedWidths[col] || COLUMN_WIDTHS[col]) || 10;
              const nextW = `${Math.max(3, currentW - 1)}%`;
              updateColConfig(col, nextW);
            };

            const updateColConfig = (colKey: string, widthVal: string) => {
              const saved = localStorage.getItem('ymd_print_layout_config');
              const parsed = saved ? JSON.parse(saved) : {};
              if (!parsed.columnWidths) parsed.columnWidths = {};
              parsed.columnWidths[colKey] = widthVal;
              localStorage.setItem('ymd_print_layout_config', JSON.stringify(parsed));
              window.dispatchEvent(new Event('ymd_print_config_changed'));
            };

            return (
              <th 
                key={col} 
                className={`${COLUMN_CLASSES[col]} ${isDesignMode ? 'design-col-interactive no-print-bg' : ''}`}
                style={{ position: 'relative' }}
              >
                <span onClick={handleHeaderClick} style={{ cursor: isDesignMode ? 'pointer' : 'default' }}>
                  {headerText}
                </span>
                {isDesignMode && (
                  <span className="col-hover-actions no-print">
                    <button className="col-action-btn" onClick={handleDecreaseWidth} title="ลดความกว้างคอลัมน์" style={{ cursor: 'pointer' }}>-</button>
                    <span className="col-action-label" title="ความกว้างปัจจุบัน">{parseInt(savedWidths[col] || COLUMN_WIDTHS[col])}%</span>
                    <button className="col-action-btn" onClick={handleIncreaseWidth} title="เพิ่มความกว้างคอลัมน์" style={{ cursor: 'pointer' }}>+</button>
                  </span>
                )}
              </th>
            );
          })}
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
  const rawVatRate = vatRate < 1 ? Math.round(vatRate * 10000) / 100 : vatRate;
  const normalizedVatRate = Math.round(Number(rawVatRate) * 100) / 100;
  const vat = (afterDiscount * normalizedVatRate) / 100;
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
          <td className="sum-value">{fmtMoneyTH(discount)}</td>
        </tr>
        <tr>
          <td className="sum-label">เงินหลังหักส่วนลด</td>
          <td className="sum-value">{fmtMoneyTH(afterDiscount)}</td>
        </tr>
        <tr>
          <td className="sum-label">ภาษีมูลค่าเพิ่ม {normalizedVatRate}%</td>
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
