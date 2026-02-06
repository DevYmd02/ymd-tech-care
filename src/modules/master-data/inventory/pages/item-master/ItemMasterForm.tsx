import { useNavigate, useSearchParams } from 'react-router-dom';
import { Package, Save, X, Loader2 } from 'lucide-react';

// Hooks & Components
import { useItemForm } from './hooks/useItemForm';
import { ItemGeneralInfo } from './components/ItemGeneralInfo';
import { ItemAttributes } from './components/ItemAttributes';
import { ItemStockDetails } from './components/ItemStockDetails';
import { ItemFinancials } from './components/ItemFinancials';
import { ItemStatusControl } from './components/ItemStatusControl';

/**
 * @file ItemMasterForm.tsx
 * @description Master Data - Item Master Form (Refactored)
 */
export default function ItemMasterForm() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('id');
    
    const {
        formData,
        isSaving,
        saveError,
        errors,
        handleInputChange,
        handleSave,
        handleFind
    } = useItemForm(editId);

    return (
        <div className="p-2 min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
            {/* Header - Compact */}
            <div className="flex items-center justify-between gap-4 mb-1 bg-blue-600 px-3 py-1.5 rounded-xl shadow-lg shadow-blue-900/20">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-white/10 rounded-lg">
                        <Package className="text-white" size={20} />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-white">
                            {editId ? `Edit: ${formData.item_code}` : 'กำหนดรหัสสินค้าและบริการ (Item Master)'}
                        </h1>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => navigate('/master-data?tab=item')} 
                        className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-sm transition-all" 
                        title="Close"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Main Form Card */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
                
                {/* 1. Header Section - Primary Identifiers (Compact) */}
                <ItemGeneralInfo 
                    formData={formData} 
                    onChange={handleInputChange} 
                    onFind={handleFind} 
                    editMode={!!editId}
                    errors={errors}
                />

                {/* 2. Details Section - 3 Column Grid (Compact) */}
                <div className="p-3">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
                        {/* Column 1: Attributes */}
                        <ItemAttributes 
                            formData={formData} 
                            onChange={handleInputChange} 
                        />

                        {/* Column 2: Stock & Cost */}
                        <ItemStockDetails 
                            formData={formData} 
                            onChange={handleInputChange}
                            errors={errors}
                        />

                        {/* Column 3: Financial & Status */}
                        <div className="lg:col-span-4 space-y-3">
                            <ItemFinancials 
                                formData={formData} 
                                onChange={handleInputChange} 
                            />
                            
                            <ItemStatusControl 
                                formData={formData} 
                                onChange={handleInputChange} 
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Actions (Compact) */}
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-2">
                    {saveError && <span className="text-red-500 dark:text-red-400 text-xs font-medium animate-pulse mr-auto">{saveError}</span>}
                    
                    <button onClick={() => navigate('/master-data?tab=item')} className="flex items-center gap-2 px-6 py-2 bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all text-sm font-medium">
                        <X size={18} />
                        ยกเลิก
                    </button>
                    
                    <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg shadow-lg hover:shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {isSaving ? 'Saving...' : (editId ? 'Save Changes' : 'Save')}
                    </button>
                </div>
            </div>
        </div>
    );
}

