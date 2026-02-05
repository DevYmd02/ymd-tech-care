/**
 * @file useMasterDataList.ts
 * @description Generic custom hook สำหรับจัดการ Master Data List pages
 * @module hooks/useMasterDataList
 * 
 * @purpose Reduce code duplication across master data list pages:
 * - BranchList, WarehouseList, UnitList, ProductCategoryList, ItemTypeList
 * - VendorList, VendorDashboard
 * 
 * @example
 * ```tsx
 * const {
 *   items,
 *   isLoading,
 *   searchTerm,
 *   setSearchTerm,
 *   statusFilter,
 *   setStatusFilter,
 *   pagination,
 *   handlers,
 * } = useMasterDataList({
 *   fetchFn: fetchBranches,
 *   idField: 'branch_id',
 *   deleteFn: deleteBranch,
 * });
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/shared/utils/logger';

// ====================================================================================
// TYPE DEFINITIONS
// ====================================================================================

/**
 * Status filter type สำหรับ Master Data List
 */
export type StatusFilterType = 'ALL' | 'ACTIVE' | 'INACTIVE';

/**
 * Pagination state
 */
export interface PaginationState {
  /** หน้าปัจจุบัน (1-indexed) */
  currentPage: number;
  /** จำนวนแถวต่อหน้า */
  rowsPerPage: number;
  /** จำนวนรายการทั้งหมด */
  totalItems: number;
  /** จำนวนหน้าทั้งหมด */
  totalPages: number;
  /** Index เริ่มต้น (0-indexed) */
  startIndex: number;
}

/**
 * Options สำหรับ useMasterDataList hook
 */
export interface UseMasterDataListOptions<T, IdType = string> {
  /**
   * Function สำหรับดึงข้อมูล
   * @param params - Filter parameters
   * @returns Promise of items array
   */
  fetchFn: (params: {
    statusFilter: StatusFilterType;
    searchTerm: string;
  }) => Promise<T[]>;

  /**
   * ชื่อ field ที่เป็น primary key
   * @example 'branch_id', 'warehouse_id', 'unit_id'
   */
  idField: keyof T;

  /**
   * Function สำหรับลบข้อมูล (optional)
   * @param id - ID ของ record ที่จะลบ
   * @returns Promise of success boolean
   */
  deleteFn?: (id: IdType) => Promise<boolean>;

  /**
   * Confirm message ก่อนลบ
   * @default 'คุณต้องการลบข้อมูลนี้หรือไม่?'
   */
  deleteConfirmMessage?: string;

  /**
   * Initial rows per page
   * @default 10
   */
  initialRowsPerPage?: number;

  /**
   * Enable auto-fetch on mount
   * @default true
   */
  autoFetch?: boolean;
}

/**
 * Return type ของ useMasterDataList hook
 */
export interface UseMasterDataListReturn<T, IdType = string> {
  /** รายการข้อมูล (paginated) */
  items: T[];
  /** รายการข้อมูลทั้งหมด (ก่อน pagination) */
  allItems: T[];
  /** กำลังโหลดข้อมูล */
  isLoading: boolean;
  /** Error message */
  error: string | null;

  // Search & Filter
  /** คำค้นหา */
  searchTerm: string;
  /** Set คำค้นหา */
  setSearchTerm: (value: string) => void;
  /** Status filter */
  statusFilter: StatusFilterType;
  /** Set status filter */
  setStatusFilter: (value: StatusFilterType) => void;

  // Pagination
  /** Pagination state */
  pagination: PaginationState;
  /** Set หน้าปัจจุบัน */
  setCurrentPage: (page: number) => void;
  /** Set จำนวนแถวต่อหน้า */
  setRowsPerPage: (rows: number) => void;

  // Modal state
  /** Modal กำลังเปิดอยู่ */
  isModalOpen: boolean;
  /** Set modal state */
  setIsModalOpen: (open: boolean) => void;
  /** ID ที่กำลังแก้ไข */
  editingId: IdType | null;
  /** Set editing ID */
  setEditingId: (id: IdType | null) => void;

  // Handlers
  handlers: {
    /** เปิด modal สร้างใหม่ */
    handleCreateNew: () => void;
    /** เปิด modal แก้ไข */
    handleEdit: (id: IdType) => void;
    /** ลบรายการ */
    handleDelete: (id: IdType) => Promise<void>;
    /** Refresh ข้อมูล */
    handleRefresh: () => void;
    /** ปิด modal และ refresh */
    handleModalClose: () => void;
  };
}

// ====================================================================================
// MAIN HOOK
// ====================================================================================

/**
 * Generic hook สำหรับ Master Data List pages
 * 
 * @description ลด code duplication โดยรวม:
 * - Fetch & state management
 * - Search & filter logic
 * - Pagination logic
 * - Modal open/close state
 * - CRUD handlers
 * 
 * @template T - Type ของ data item
 * @template IdType - Type ของ ID field (default: string)
 * 
 * @param options - Configuration options
 * @returns List state และ handlers
 * 
 * @example
 * ```tsx
 * // In BranchList.tsx
 * function BranchList() {
 *   const {
 *     items,
 *     isLoading,
 *     searchTerm,
 *     setSearchTerm,
 *     statusFilter,
 *     setStatusFilter,
 *     pagination,
 *     handlers,
 *   } = useMasterDataList<BranchListItem>({
 *     fetchFn: async ({ statusFilter, searchTerm }) => {
 *       let data = await branchService.getList();
 *       if (statusFilter !== 'ALL') {
 *         data = data.filter(b => statusFilter === 'ACTIVE' ? b.is_active : !b.is_active);
 *       }
 *       if (searchTerm) {
 *         data = data.filter(b => 
 *           b.branch_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
 *           b.branch_name.toLowerCase().includes(searchTerm.toLowerCase())
 *         );
 *       }
 *       return data;
 *     },
 *     idField: 'branch_id',
 *     deleteFn: (id) => branchService.delete(id),
 *     deleteConfirmMessage: 'คุณต้องการลบสาขานี้หรือไม่?',
 *   });
 *   
 *   return (
 *     // ... render list UI
 *   );
 * }
 * ```
 */
export function useMasterDataList<T, IdType = string>(
  options: UseMasterDataListOptions<T, IdType>
): UseMasterDataListReturn<T, IdType> {
  const {
    fetchFn,
    // idField, // Not used strictly in hook logic, but kept in interface for documentation
    deleteFn,
    deleteConfirmMessage = 'คุณต้องการลบข้อมูลนี้หรือไม่?',
    initialRowsPerPage = 10,
    autoFetch = true,
  } = options;

  // ====================================================================================
  // STATE
  // ====================================================================================

  // Data state
  const [allItems, setAllItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<IdType | null>(null);

  // ====================================================================================
  // COMPUTED VALUES
  // ====================================================================================

  const totalItems = allItems.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const items = allItems.slice(startIndex, startIndex + rowsPerPage);

  const pagination: PaginationState = {
    currentPage,
    rowsPerPage,
    totalItems,
    totalPages,
    startIndex,
  };

  // ====================================================================================
  // DATA FETCHING
  // ====================================================================================

  /**
   * Fetch data จาก API
   */
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchFn({ statusFilter, searchTerm });
      setAllItems(data);
    } catch (err) {
      logger.error('useMasterDataList fetchData error:', err);
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      setAllItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, statusFilter, searchTerm]);

  // Auto-fetch on mount and when filters change
  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [fetchData, autoFetch]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm, rowsPerPage]);

  // ====================================================================================
  // HANDLERS
  // ====================================================================================

  /**
   * เปิด modal สร้างข้อมูลใหม่
   */
  const handleCreateNew = useCallback(() => {
    setEditingId(null);
    setIsModalOpen(true);
  }, []);

  /**
   * เปิด modal แก้ไขข้อมูล
   */
  const handleEdit = useCallback((id: IdType) => {
    setEditingId(id);
    setIsModalOpen(true);
  }, []);

  /**
   * ลบข้อมูล
   */
  const handleDelete = useCallback(async (id: IdType) => {
    if (!deleteFn) {
      logger.warn('useMasterDataList: deleteFn not provided');
      return;
    }

    if (!confirm(deleteConfirmMessage)) {
      return;
    }

    try {
      const success = await deleteFn(id);
      if (success) {
        fetchData(); // Refresh list
      } else {
        setError('เกิดข้อผิดพลาดในการลบข้อมูล');
      }
    } catch (err) {
      logger.error('useMasterDataList handleDelete error:', err);
      setError('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  }, [deleteFn, deleteConfirmMessage, fetchData]);

  /**
   * Refresh data
   */
  const handleRefresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  /**
   * ปิด modal และ refresh
   */
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setEditingId(null);
    fetchData();
  }, [fetchData]);

  // ====================================================================================
  // RETURN
  // ====================================================================================

  return {
    items,
    allItems,
    isLoading,
    error,

    // Search & Filter
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,

    // Pagination
    pagination,
    setCurrentPage,
    setRowsPerPage,

    // Modal state
    isModalOpen,
    setIsModalOpen,
    editingId,
    setEditingId,

    // Handlers
    handlers: {
      handleCreateNew,
      handleEdit,
      handleDelete,
      handleRefresh,
      handleModalClose,
    },
  };
}

export default useMasterDataList;
