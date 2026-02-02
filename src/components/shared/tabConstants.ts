/**
 * @file tabConstants.ts
 * @description Constants for TabPanel component - แยกออกมาเพื่อ Fast Refresh
 */

import type { TabItem } from '@layout/TabPanel';

/** Default tabs for document forms (PR, RFQ, PO, etc.) */
export const DOCUMENT_FORM_TABS: TabItem[] = [
  { id: 'detail', label: 'Detail' },
  { id: 'more', label: 'More' },
  { id: 'rate', label: 'Rate' },
  { id: 'description', label: 'Description' },
  { id: 'history', label: 'History' },
];
