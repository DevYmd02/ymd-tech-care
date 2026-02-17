/**
 * Generic helper to apply sorting and pagination to mock data arrays
 */
export const applyMockFilters = <T>(data: T[], params: Record<string, string | number | boolean | undefined>) => {
  const processed = [...data];
  
  // 1. Sorting
  if (typeof params.sort === 'string') {
    const [key, direction] = params.sort.split(':');
    processed.sort((a, b) => {
      const valA = a[key as keyof T];
      const valB = b[key as keyof T];
      
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      
      let comparison = 0;
      if (typeof valA === 'string' && typeof valB === 'string') {
        comparison = valA.localeCompare(valB);
      } else if (typeof valA === 'number' && typeof valB === 'number') {
        comparison = valA - valB;
      } else if (typeof valA === 'boolean' && typeof valB === 'boolean') {
        comparison = valA === valB ? 0 : (valA ? 1 : -1);
      } else {
        // Fallback for mixed or other types
        comparison = String(valA).localeCompare(String(valB));
      }
      
      return direction === 'desc' ? -comparison : comparison;
    });
  }
  
  // 2. Pagination
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
