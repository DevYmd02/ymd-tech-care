/**
 * @file index.ts
 * @description Barrel export สำหรับ Constants
 */

// Export everything from statusConstants (unified file)
export {
  PR_STATUS_COLORS,
  PR_STATUS_LABELS,
  RFQ_STATUS_COLORS,
  RFQ_STATUS_LABELS,
  PR_STATUS,
  DOC_STATUS,
  STATUS_COLORS,
} from './statusConstants';

export type { PRStatus, DocStatus } from './statusConstants';

export { styles } from './styles';
