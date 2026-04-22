import { useState } from 'react';
import type { QuotationFormValues } from '../schemas/quotation-schemas';

/**
 * Custom hook to manage all modal states for the Quotation Form
 * Extracted from useQuotationForm to reduce complexity.
 */
export const useQuotationModals = () => {
  // Search Modals State
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
  const [isLeadSearchOpen, setIsLeadSearchOpen] = useState(false);
  const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);
  const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);

  // Confirmation Modal State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingData, setPendingData] = useState<QuotationFormValues | null>(null);

  const openCustomerSearch = () => setIsCustomerSearchOpen(true);
  const closeCustomerSearch = () => setIsCustomerSearchOpen(false);

  const openLeadSearch = () => setIsLeadSearchOpen(true);
  const closeLeadSearch = () => setIsLeadSearchOpen(false);

  const openProductSearch = (lineIndex: number | null = null) => {
    setActiveLineIndex(lineIndex);
    setIsProductSearchOpen(true);
  };
  const closeProductSearch = () => {
    setIsProductSearchOpen(false);
    setActiveLineIndex(null);
  };

  const openConfirm = (data: QuotationFormValues) => {
    setPendingData(data);
    setIsConfirmOpen(true);
  };
  const closeConfirm = () => {
    setIsConfirmOpen(false);
    setPendingData(null);
  };

  return {
    isCustomerSearchOpen,
    isLeadSearchOpen,
    isProductSearchOpen,
    activeLineIndex,
    isConfirmOpen,
    pendingData,
    openCustomerSearch,
    closeCustomerSearch,
    openLeadSearch,
    closeLeadSearch,
    openProductSearch,
    closeProductSearch,
    openConfirm,
    closeConfirm,
    setIsCustomerSearchOpen,
    setIsLeadSearchOpen,
    setIsProductSearchOpen,
    setIsConfirmOpen,
    setActiveLineIndex,
    setPendingData
  };
};
