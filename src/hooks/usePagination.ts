/**
 * @file usePagination.ts
 * @description Custom Hook สำหรับจัดการ Pagination logic
 * @usage const { paginatedData, currentPage, totalPages, setPage, nextPage, prevPage } = usePagination(data, 10);
 */

import { useState, useMemo } from 'react';

export interface UsePaginationResult<T> {
  /** ข้อมูลที่ถูก slice แล้วสำหรับหน้าปัจจุบัน */
  paginatedData: T[];
  /** หน้าปัจจุบัน (1-indexed) */
  currentPage: number;
  /** จำนวนหน้าทั้งหมด */
  totalPages: number;
  /** จำนวน items ทั้งหมด */
  totalItems: number;
  /** จำนวน items ที่เริ่มแสดง (1-indexed) */
  startItem: number;
  /** จำนวน items สุดท้ายที่แสดง */
  endItem: number;
  /** ตั้งค่าหน้า */
  setPage: (page: number) => void;
  /** ไปหน้าถัดไป */
  nextPage: () => void;
  /** ไปหน้าก่อนหน้า */
  prevPage: () => void;
  /** รีเซ็ตกลับหน้าแรก */
  reset: () => void;
}

export function usePagination<T>(
  data: T[],
  itemsPerPage: number = 10
): UsePaginationResult<T> {
  const [currentPage, setCurrentPage] = useState(1);

  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Reset to page 1 if data changes and current page is out of range
  const safePage = Math.min(currentPage, Math.max(1, totalPages));

  const paginatedData = useMemo(() => {
    const start = (safePage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return data.slice(start, end);
  }, [data, safePage, itemsPerPage]);

  const startItem = totalItems === 0 ? 0 : (safePage - 1) * itemsPerPage + 1;
  const endItem = Math.min(safePage * itemsPerPage, totalItems);

  const setPage = (page: number) => {
    const newPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(newPage);
  };

  const nextPage = () => {
    if (safePage < totalPages) {
      setCurrentPage(safePage + 1);
    }
  };

  const prevPage = () => {
    if (safePage > 1) {
      setCurrentPage(safePage - 1);
    }
  };

  const reset = () => {
    setCurrentPage(1);
  };

  return {
    paginatedData,
    currentPage: safePage,
    totalPages,
    totalItems,
    startItem,
    endItem,
    setPage,
    nextPage,
    prevPage,
    reset,
  };
}

export default usePagination;
