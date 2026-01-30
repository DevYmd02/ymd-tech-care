/**
 * @file item-master.mock.ts
 * @description Mock data and helpers for Item Master Form
 */

export const MOCK_CLASSES = [ { id: 'CL01', name: 'Standard' }, { id: 'CL02', name: 'Premium' } ];
export const MOCK_BRANDS = [ { id: 'BR01', name: 'Freshtime' }, { id: 'BR02', name: 'Double A' }, { id: 'BR03', name: '3M' } ];
export const MOCK_PATTERNS = [ { id: 'PT01', name: 'Solid' }, { id: 'PT02', name: 'Gradient' } ];
export const MOCK_DESIGNS = [ { id: 'DS01', name: 'Classic' }, { id: 'DS02', name: 'Modern' } ];
export const MOCK_SIZES = [ { id: 'SZ01', name: 'Small' }, { id: 'SZ02', name: 'Medium' }, { id: 'SZ03', name: 'Large' }, { id: 'SZ04', name: '180g' } ];
export const MOCK_MODELS = [ { id: 'MD01', name: '2024 Model' }, { id: 'MD02', name: 'Legacy Model' } ];
export const MOCK_GRADES = [ { id: 'GR01', name: 'A' }, { id: 'GR02', name: 'B' } ];
export const MOCK_COLORS = [ { id: 'CO01', name: 'White' }, { id: 'CO02', name: 'Black' }, { id: 'CO03', name: 'Red' } ];

/**
 * Helper to get name from ID
 * Safe for both string and number IDs
 */
export const getName = (
    id: string | number, 
    source: Array<Record<string, string | number | boolean>>, 
    idField = 'id', 
    nameField = 'name'
): string => {
    // Convert both to string for comparison to be safe
    const found = source.find(item => String(item[idField]) === String(id));
    return found ? String(found[nameField]) : '';
};
