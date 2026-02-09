/**
 * @file styles.ts
 * @description Centralized Tailwind style classes
 * @purpose ลดการซ้ำซ้อนของ className และทำให้ design สม่ำเสมอ
 * @usage import { styles } from '@/constants/styles';
 */

// ====================================================================================
// PAGE LAYOUTS
// ====================================================================================

/** Container หลักของทุกหน้า */
export const PAGE_CONTAINER = 'p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-200';

/** Container แบบ compact (สำหรับ list pages) */
export const PAGE_CONTAINER_COMPACT = 'p-6 space-y-4 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-200';

// ====================================================================================
// CARDS
// ====================================================================================

/** Card พื้นฐาน (สีขาว/เทา) */
export const CARD = 'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700';

/** Card แบบ glassmorphism */
export const CARD_GLASS = 'bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm';

/** Card สำหรับ hover effect */
export const CARD_HOVER = 'bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md dark:hover:border-gray-600 transition-all';

// ====================================================================================
// TABLES
// ====================================================================================

/** Table container */
export const TABLE_CONTAINER = 'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden';

/** Table header row */
export const TABLE_HEADER = 'bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600';

/** Table header cell */
export const TABLE_TH = 'px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider';

/** Table body row */
export const TABLE_TR = 'border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors';

/** Table body cell */
export const TABLE_TD = 'px-4 py-3 text-sm text-gray-600 dark:text-gray-300';

/** Table footer */
export const TABLE_FOOTER = 'flex justify-between items-center px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600';

// ====================================================================================
// INPUTS
// ====================================================================================

/** Input พื้นฐาน */
export const INPUT = 'w-full h-10 px-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 dark:text-white placeholder-gray-400';

/** Input แบบ compact */
export const INPUT_SM = 'h-8 px-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-white';

/** Input with flex-1 for form rows */
export const INPUT_FLEX = 'flex-1 min-w-0 h-9 px-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500';

/** Input disabled state */
export const INPUT_DISABLED = 'flex-1 min-w-0 h-9 px-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-600';

/** Select dropdown */
export const INPUT_SELECT = 'flex-1 h-10 px-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500';

/** Textarea */
export const TEXTAREA = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500';

/** Label สำหรับ input */
export const LABEL = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

// ====================================================================================
// BUTTONS
// ====================================================================================

/** Button Primary (สีน้ำเงิน) */
export const BTN_PRIMARY = 'px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-md';

/** Button Success (สีเขียว) */
export const BTN_SUCCESS = 'px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors';

/** Button Danger (สีแดง) */
export const BTN_DANGER = 'px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors';

/** Button Secondary (สีเทา) */
export const BTN_SECONDARY = 'px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-semibold transition-colors';

/** Button Icon (ปุ่มกลม) */
export const BTN_ICON = 'p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors';

// ====================================================================================
// TEXT
// ====================================================================================

/** Page title */
export const TEXT_TITLE = 'text-2xl font-bold text-gray-800 dark:text-white';

/** Section title */
export const TEXT_SECTION = 'text-lg font-semibold text-gray-800 dark:text-white';

/** Body text */
export const TEXT_BODY = 'text-sm text-gray-600 dark:text-gray-300';

/** Muted text */
export const TEXT_MUTED = 'text-xs text-gray-500 dark:text-gray-400';

// ====================================================================================
// MODALS
// ====================================================================================

/** Modal overlay */
export const MODAL_OVERLAY = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm';

/** Modal content box */
export const MODAL_CONTENT = 'bg-white dark:bg-gray-800 rounded-xl shadow-2xl';

// ====================================================================================
// UTILITY
// ====================================================================================

/** Flex row with gap */
export const FLEX_ROW = 'flex items-center gap-2';

/** Flex column with gap */
export const FLEX_COL = 'flex flex-col gap-2';

/** Grid 2 columns */
export const GRID_2 = 'grid grid-cols-1 md:grid-cols-2 gap-4';

/** Grid 3 columns */
export const GRID_3 = 'grid grid-cols-1 md:grid-cols-3 gap-4';

/** Grid 4 columns */
export const GRID_4 = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4';

// ====================================================================================
// COMBINED EXPORTS (for convenience)
// ====================================================================================

export const styles = {
    // Pages
    pageContainer: PAGE_CONTAINER,
    pageContainerCompact: PAGE_CONTAINER_COMPACT,

    // Cards
    card: CARD,
    cardGlass: CARD_GLASS,
    cardHover: CARD_HOVER,

    // Tables
    tableContainer: TABLE_CONTAINER,
    tableHeader: TABLE_HEADER,
    tableTh: TABLE_TH,
    tableTr: TABLE_TR,
    tableTd: TABLE_TD,
    tableFooter: TABLE_FOOTER,

    // Inputs
    input: INPUT,
    inputSm: INPUT_SM,
    inputFlex: INPUT_FLEX,
    inputDisabled: INPUT_DISABLED,
    inputSelect: INPUT_SELECT,
    textarea: TEXTAREA,
    label: LABEL,

    // Buttons
    btnPrimary: BTN_PRIMARY,
    btnSuccess: BTN_SUCCESS,
    btnDanger: BTN_DANGER,
    btnSecondary: BTN_SECONDARY,
    btnIcon: BTN_ICON,

    // Text
    title: TEXT_TITLE,
    sectionTitle: TEXT_SECTION,
    body: TEXT_BODY,
    muted: TEXT_MUTED,

    // Modals
    modalOverlay: MODAL_OVERLAY,
    modalContent: MODAL_CONTENT,

    // Utility
    flexRow: FLEX_ROW,
    flexCol: FLEX_COL,
    grid2: GRID_2,
    grid3: GRID_3,
    grid4: GRID_4,
};
