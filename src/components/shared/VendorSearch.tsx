import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, X, Building2 } from 'lucide-react';
import { vendorService } from '../../services/vendorService';
import type { VendorMaster } from '../../types/vendor-types';
import { VendorSearchModal } from './VendorSearchModal';

interface VendorSearchProps {
  onVendorSelect: (vendor: VendorMaster | null) => void;
  selectedVendorId?: string;
  selectedVendorName?: string;
  label?: string;
  placeholder?: string;
  error?: string;
}

export const VendorSearch: React.FC<VendorSearchProps> = ({
  onVendorSelect,
  selectedVendorName,
  label = "ผู้ขายที่แนะนำ (Preferred Vendor)",
  placeholder = "ค้นหาผู้ขายตามชื่อ, รหัส หรือ เลขผู้เสียภาษี...",
  error
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<VendorMaster[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync query with selected name when not focused
  useEffect(() => {
    if (!isOpen) {
      setQuery(selectedVendorName || '');
    }
  }, [selectedVendorName, isOpen]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchVendors = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await vendorService.search(searchQuery);
      setResults(data);
    } catch (err) {
      console.error('Failed to search vendors:', err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    
    debounceTimer.current = setTimeout(() => {
      searchVendors(value);
    }, 300);
  };

  const handleSelect = (vendor: VendorMaster) => {
    setQuery(vendor.vendor_name);
    setResults([]);
    setIsOpen(false);
    onVendorSelect(vendor);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    onVendorSelect(null);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {label && (
        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      
      <div className="flex relative">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className={`h-8 w-full pl-8 pr-8 text-sm border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white ${error ? 'border-red-500' : ''}`}
          />
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          </div>
          
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={14} />
            </button>
          )}
        </div>
        
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="h-8 w-8 bg-blue-600 text-white rounded-r-md flex items-center justify-center hover:bg-blue-700 transition-colors border border-blue-600"
          title="ค้นหาขั้นสูง"
        >
          <Building2 size={14} />
        </button>
      </div>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      {/* Dropdown Results */}
      {isOpen && (results.length > 0 || (query.length >= 2 && !isLoading)) && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
          {results.length > 0 ? (
            results.map((vendor) => (
              <button
                key={vendor.vendor_id}
                type="button"
                onClick={() => handleSelect(vendor)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-gray-700 flex flex-col border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <div className="font-medium text-gray-900 dark:text-white flex justify-between">
                  <span>{vendor.vendor_name}</span>
                  <span className="text-xs text-blue-600 dark:text-blue-400">{vendor.vendor_code}</span>
                </div>
                {vendor.tax_id && (
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">
                    Tax ID: {vendor.tax_id}
                  </div>
                )}
              </button>
            ))
          ) : (
            <div className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
              <p>ไม่พบผู้ขายตามเงื่อนไขที่ระบุ</p>
              <button 
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="mt-1 text-blue-600 dark:text-blue-400 underline text-xs"
              >
                ใช้การค้นหาขั้นสูง
              </button>
            </div>
          )}
        </div>
      )}

      {/* Vendor Search Modal for advanced search */}
      <VendorSearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={(vendor) => {
          // Transform search item back to minimal vendor master if needed
          // or just pass it as is if PRHeader handles it
          onVendorSelect({
            vendor_id: vendor.vendor_id,
            vendor_code: vendor.code,
            vendor_name: vendor.name,
            tax_id: vendor.taxId,
          } as VendorMaster);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};
