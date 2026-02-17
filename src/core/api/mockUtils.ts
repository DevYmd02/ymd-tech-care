/**
 * Generic helper to apply sorting and pagination to mock data arrays
 */
export interface MockFilterOptions<T> {
  searchableFields?: (keyof T)[]; // For 'q' param
  dateField?: keyof T;           // For date_from / date_to
}

/**
 * Generic helper to apply sorting, filtering, and pagination to mock data arrays
 */
/**
 * Generic helper to apply sorting, filtering, and pagination to mock data arrays
 */
/**
 * Primitive types allowed in filter params
 */
export type FilterValue = string | number | boolean | undefined | null;

export const applyMockFilters = <T>(
  data: T[], 
  params: Record<string, FilterValue>, 
  options: MockFilterOptions<T> = {}
) => {
  let processed = [...data];
  
  // 1. Common Filters (q for generic search)
  if (typeof params.q === 'string' && options.searchableFields) {
    const q = params.q.toLowerCase();
    processed = processed.filter(item => 
      options.searchableFields?.some(field => {
        const record = item as Record<string, FilterValue | object>;
        const val = record[field as string];
        return String(val || '').toLowerCase().includes(q);
      })
    );
  }

  // 2. Specific Field Filters
  const excludeKeys = ['page', 'limit', 'sort', 'q', 'date_from', 'date_to', 'total'];
  
  Object.keys(params).forEach(key => {
    if (excludeKeys.includes(key)) return;
    
    const filterValue = params[key];
    if (filterValue === undefined || filterValue === '' || filterValue === 'ALL') return;

    processed = processed.filter(item => {
      // Cast to record for safe string indexing
      const record = item as Record<string, FilterValue | object>;
      
      if (!(key in record)) return true;

      const itemValue = record[key];
      
      // String -> Partial Match (Case Insensitive)
      if (typeof itemValue === 'string' && typeof filterValue === 'string') {
        return itemValue.toLowerCase().includes(filterValue.toLowerCase());
      }
      
      // Strict Equality with String Casting for Robustness (Fixes ID Type Mismatches)
      // We convert both sides to String to ensure '1' matches 1 in loosely typed legacy data
      // but we perform the comparison strictly.
      return String(itemValue) === String(filterValue);
    });
  });

  // 3. Date Range Filtering
  if ((params.date_from || params.date_to) && options.dateField) {
    const dateFromStr = typeof params.date_from === 'string' ? params.date_from : undefined;
    const dateToStr = typeof params.date_to === 'string' ? params.date_to : undefined;

    const from = dateFromStr ? new Date(dateFromStr).getTime() : -Infinity;
    const to = dateToStr ? new Date(dateToStr).getTime() : Infinity;
    
    processed = processed.filter(item => {
      const record = item as Record<string, FilterValue | object>;
      const fieldVal = record[options.dateField as string];
      const dateStr = String(fieldVal);
      const dateVal = new Date(dateStr).getTime();
      return dateVal >= from && dateVal <= to;
    });
  }

  // 4. Sorting
  if (typeof params.sort === 'string') {
    const [key, direction] = params.sort.split(':');
    processed.sort((a, b) => {
      // Access keys dynamically. Since we don't know if key exists on T, we treat as potentially undefined.
      // But for sorting, we assume the key passed is valid or we handle the undefined.
      const valA = (a as Record<string, FilterValue>)[key];
      const valB = (b as Record<string, FilterValue>)[key];
      
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      
      let comparison = 0;
      if (typeof valA === 'string' && typeof valB === 'string') {
        comparison = valA.localeCompare(valB);
      } else if (typeof valA === 'number' && typeof valB === 'number') {
        comparison = valA - valB;
      } else {
        comparison = String(valA).localeCompare(String(valB));
      }
      
      return direction === 'desc' ? -comparison : comparison;
    });
  }
  
  // 5. Pagination
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 20;
  const total = processed.length;
  const startIndex = (page - 1) * limit;
  const items = processed.slice(startIndex, startIndex + limit);
  
  return { items, data: items, total, page, limit };
};

/**
 * Sanitizer: Ensures all IDs are strings
 */
export const sanitizeId = (id: string | number | undefined): string => {
    return id ? String(id) : '';
};