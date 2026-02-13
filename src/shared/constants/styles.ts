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
// NEW SEMANTIC COLORS
// ====================================================================================

/** Primary background (for cards, inputs, etc.) */
export const BG_SURFACE = 'bg-white dark:bg-gray-800';

/** Alternate background (for pages, subtle areas) */
export const BG_SUBTLE = 'bg-gray-50 dark:bg-gray-800';

/** Active/Hover background (for list items, table rows) */
export const BG_ACTIVE = 'bg-blue-50 dark:bg-gray-700/50';

/** Header background (Table headers, Footers) */
export const BG_HEADER = 'bg-gray-100/80 dark:bg-gray-700';

/** Accent background (for headers, primary actions) */
export const BG_ACCENT = 'bg-blue-600 dark:bg-blue-700';

/** Default border */
export const BORDER_DEFAULT = 'border-gray-200 dark:border-gray-700';

/** Subtle border (for table rows, dividers) */
export const BORDER_SUBTLE = 'border-gray-100 dark:border-gray-800';

/** Ultra-faint border (for modern table rows) */
export const BORDER_TABLE = 'border-transparent dark:border-transparent';

/** Zebra striping for table rows */
export const TABLE_STRIPE = 'even:bg-gray-100/50 dark:even:bg-gray-700/30';

/** Primary text */
export const TEXT_PRIMARY = 'text-gray-900 dark:text-gray-100';

/** Secondary text (e.g., column headers, body text) */
export const TEXT_SECONDARY = 'text-gray-600 dark:text-gray-300';

/** Tertiary text (e.g., placeholders, disabled) */
export const TEXT_TERTIARY = 'text-gray-400 dark:text-gray-500';

/** Accent text (e.g., active links, icons) */
export const TEXT_ACCENT = 'text-blue-600 dark:text-blue-400';

/** Danger text (e.g., error messages) */
export const TEXT_DANGER = 'text-red-500 dark:text-red-400';

/** Success text */
export const TEXT_SUCCESS = 'text-green-600 dark:text-green-400';

// ====================================================================================
// STATES & UTILS
// ====================================================================================

/** Hover state for interactive rows/items */
export const STATE_HOVER = 'hover:bg-blue-50 dark:hover:bg-gray-700/50 transition-colors';

/** Active/Selected state */
export const STATE_ACTIVE = 'bg-blue-100/30 dark:bg-blue-900/20';

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

/** Input error state */
export const INPUT_ERROR = 'w-full h-10 px-3 bg-white dark:bg-gray-700 border border-red-500 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm text-gray-900 dark:text-white placeholder-gray-400';

/** Focus rings for different accents */
export const FOCUS_RINGS = {
    emerald: 'ring-emerald-500 focus:ring-emerald-500',
    blue: 'ring-blue-500 focus:ring-blue-500',
    purple: 'ring-purple-500 focus:ring-purple-500',
    teal: 'ring-teal-500 focus:ring-teal-500',
    indigo: 'ring-indigo-500 focus:ring-indigo-500',
};

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

/** Button Primary Outline */
export const BTN_PRIMARY_OUTLINE = 'px-4 py-2 border-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-500 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white dark:hover:text-white rounded-lg font-semibold transition-all shadow-sm';

/** Button Success Outline */
export const BTN_SUCCESS_OUTLINE = 'px-4 py-2 border-2 border-green-600 text-green-600 dark:text-green-400 dark:border-green-500 hover:bg-green-600 dark:hover:bg-green-600 hover:text-white dark:hover:text-white rounded-lg font-semibold transition-all shadow-sm';

/** Button Danger Outline */
export const BTN_DANGER_OUTLINE = 'px-4 py-2 border-2 border-red-600 text-red-600 dark:text-red-400 dark:border-red-500 hover:bg-red-600 dark:hover:bg-red-600 hover:text-white dark:hover:text-white rounded-lg font-semibold transition-all shadow-sm';

/** Button Secondary Outline */
export const BTN_SECONDARY_OUTLINE = 'px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-semibold transition-all shadow-sm';

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
    inputError: INPUT_ERROR,

    // Buttons
    btnPrimary: BTN_PRIMARY,
    btnSuccess: BTN_SUCCESS,
    btnDanger: BTN_DANGER,
    btnSecondary: BTN_SECONDARY,
    btnIcon: BTN_ICON,
    btnPrimaryOutline: BTN_PRIMARY_OUTLINE,
    btnSuccessOutline: BTN_SUCCESS_OUTLINE,
    btnDangerOutline: BTN_DANGER_OUTLINE,
    btnSecondaryOutline: BTN_SECONDARY_OUTLINE,

    // Text
    title: TEXT_TITLE,
    sectionTitle: TEXT_SECTION,
    body: TEXT_BODY,
    muted: TEXT_MUTED,

    // Modals
    modalOverlay: MODAL_OVERLAY,
    modalContent: MODAL_CONTENT,

    // Semantic Colors (New)
    bg: {
        surface: BG_SURFACE,
        subtle: BG_SUBTLE,
        active: BG_ACTIVE,
        accent: BG_ACCENT,
        header: BG_HEADER
    },
    border: {
        default: BORDER_DEFAULT,
        subtle: BORDER_SUBTLE,
        table: BORDER_TABLE
    },
    tableStripe: TABLE_STRIPE,
    text: {
        primary: TEXT_PRIMARY,
        secondary: TEXT_SECONDARY,
        tertiary: TEXT_TERTIARY,
        accent: TEXT_ACCENT,
        danger: TEXT_DANGER,
        success: TEXT_SUCCESS
    },
    state: {
        hover: STATE_HOVER,
        active: STATE_ACTIVE
    },
    focusRing: FOCUS_RINGS,

    // Utility
    flexRow: FLEX_ROW,
    flexCol: FLEX_COL,
    grid2: GRID_2,
    grid3: GRID_3,
    grid4: GRID_4,
};
