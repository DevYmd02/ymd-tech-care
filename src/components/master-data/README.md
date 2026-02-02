# Generic Master Data Components

## Overview

This directory contains reusable generic components designed to eliminate code duplication across Master Data modules. These components provide a consistent, type-safe, and maintainable approach to building CRUD interfaces.

## Components

### 1. GenericMasterDataList

A fully-featured list component with built-in support for:

- ✅ Search functionality
- ✅ Status filtering (Active/Inactive/All)
- ✅ Pagination with configurable rows per page
- ✅ CRUD operations (Create, Edit, Delete)
- ✅ Loading states
- ✅ Empty states
- ✅ Responsive design
- ✅ Dark mode support

## Usage Guide

### Basic Implementation

#### Step 1: Define Configuration

```typescript
import { Tag } from 'lucide-react';
import type { GenericMasterDataListConfig } from '@/types/generic-master-data-types';
import type { ProductCategoryListItem } from '@/types/master-data-types';

const config: GenericMasterDataListConfig<ProductCategoryListItem> = {
    title: 'กำหนดรหัสหมวดสินค้า',
    subtitle: 'จัดการข้อมูลหมวดสินค้าทั้งหมด',
    icon: Tag,
    createButtonText: 'เพิ่มหมวดสินค้าใหม่',
    searchPlaceholder: 'ค้นหารหัสหรือชื่อหมวด...',
    emptyMessage: 'ไม่พบข้อมูลหมวดสินค้า',
    deleteConfirmMessage: 'คุณต้องการลบข้อมูลหมวดสินค้านี้หรือไม่?',
    columns: [
        {
            header: 'รหัสหมวด',
            accessor: (item) => item.category_code,
        },
        {
            header: 'ชื่อหมวด',
            accessor: (item) => item.category_name,
        },
        {
            header: 'สถานะ',
            accessor: (item) => <ActiveStatusBadge isActive={item.is_active} />,
            className: 'text-center',
        },
    ],
};
```

#### Step 2: Use the Generic Hook

```typescript
import { useGenericMasterDataList } from "@/hooks/useGenericMasterDataList";

const listState = useGenericMasterDataList<ProductCategoryListItem>({
  fetchData: async () => {
    // Your API call here
    const response = await api.getProductCategories();
    return response.data;
  },
  searchFields: ["category_code", "category_name"],
  initialRowsPerPage: 10,
});
```

#### Step 3: Render the Component

```typescript
import { GenericMasterDataList } from '@/components/master-data';

export default function ProductCategoryList() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const listState = useGenericMasterDataList<ProductCategoryListItem>({
        fetchData: async () => mockProductCategories,
        searchFields: ['category_code', 'category_name'],
    });

    const handleCreate = () => {
        setEditingId(null);
        setIsModalOpen(true);
    };

    const handleEdit = (id: string) => {
        setEditingId(id);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        // Delete logic
        listState.refresh();
    };

    return (
        <>
            <GenericMasterDataList
                config={config}
                items={listState.items}
                isLoading={listState.isLoading}
                searchTerm={listState.searchTerm}
                statusFilter={listState.statusFilter}
                currentPage={listState.currentPage}
                rowsPerPage={listState.rowsPerPage}
                totalItems={listState.totalItems}
                onSearchChange={listState.onSearchChange}
                onStatusFilterChange={listState.onStatusFilterChange}
                onPageChange={listState.onPageChange}
                onRowsPerPageChange={listState.onRowsPerPageChange}
                onCreate={handleCreate}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onRefresh={listState.onRefresh}
                getItemId={(item) => item.category_id}
            />

            <YourFormModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    listState.refresh();
                }}
                editId={editingId}
            />
        </>
    );
}
```

## Advanced Features

### Custom Column Rendering

You can render any React component in columns:

```typescript
columns: [
    {
        header: 'รหัสหมวด',
        accessor: (item) => (
            <span className="font-bold text-blue-600">
                {item.category_code}
            </span>
        ),
    },
    {
        header: 'สถานะ',
        accessor: (item) => (
            <ActiveStatusBadge isActive={item.is_active} />
        ),
        className: 'text-center',
    },
]
```

### Hide Columns on Mobile

```typescript
columns: [
  {
    header: "ชื่อหมวด (EN)",
    accessor: (item) => item.category_name_en || "-",
    hideOnMobile: true, // Hidden on screens < md breakpoint
  },
];
```

### Custom Filter Function

If you need custom filtering logic:

```typescript
const listState = useGenericMasterDataList<ProductCategoryListItem>({
  fetchData: async () => mockProductCategories,
  filterFn: (items, searchTerm, statusFilter) => {
    // Your custom filter logic
    let filtered = items;

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((item) =>
        statusFilter === "ACTIVE" ? item.is_active : !item.is_active,
      );
    }

    if (searchTerm) {
      // Custom search logic
      filtered = filtered.filter(
        (item) =>
          item.category_code.includes(searchTerm) ||
          item.category_name.includes(searchTerm),
      );
    }

    return filtered;
  },
});
```

## API Reference

### GenericMasterDataListConfig<T>

| Property               | Type                      | Description                      |
| ---------------------- | ------------------------- | -------------------------------- |
| `title`                | `string`                  | Module title displayed in header |
| `subtitle`             | `string`                  | Module description/subtitle      |
| `icon`                 | `LucideIcon`              | Icon component from lucide-react |
| `createButtonText`     | `string`                  | Text for create button           |
| `searchPlaceholder`    | `string`                  | Placeholder for search input     |
| `emptyMessage`         | `string`                  | Message shown when no data       |
| `deleteConfirmMessage` | `string`                  | Confirmation message for delete  |
| `columns`              | `GenericTableColumn<T>[]` | Column definitions               |

### GenericTableColumn<T>

| Property       | Type                     | Description                     |
| -------------- | ------------------------ | ------------------------------- |
| `header`       | `string`                 | Column header text              |
| `accessor`     | `(item: T) => ReactNode` | Function to render cell content |
| `className`    | `string?`                | Optional CSS classes            |
| `hideOnMobile` | `boolean?`               | Hide on mobile devices          |

### useGenericMasterDataList Hook

#### Parameters

```typescript
{
    fetchData: () => Promise<T[]> | T[];
    filterFn?: (items: T[], searchTerm: string, statusFilter: string) => T[];
    searchFields?: Array<keyof T>;
    initialRowsPerPage?: number;
}
```

#### Returns

```typescript
{
    // Data
    items: T[];                    // Paginated items for current page
    totalItems: number;            // Total filtered items
    allItems: T[];                 // All items (unfiltered)
    filteredItems: T[];            // Filtered items (before pagination)

    // State
    isLoading: boolean;
    searchTerm: string;
    statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE';
    currentPage: number;
    rowsPerPage: number;
    totalPages: number;

    // Handlers
    onSearchChange: (term: string) => void;
    onStatusFilterChange: (status: string) => void;
    onPageChange: (page: number) => void;
    onRowsPerPageChange: (rows: number) => void;
    onRefresh: () => void;
    refresh: () => Promise<void>;
}
```

## Benefits

### Code Reduction

- **~60% less code** per module
- **Eliminates duplication** across 8+ master data modules
- **Faster development** of new modules

### Consistency

- **Uniform UX** across all master data screens
- **Standardized behavior** for search, filter, pagination
- **Consistent styling** and responsive design

### Maintainability

- **Single source of truth** for list functionality
- **Fix once, apply everywhere**
- **Type-safe** with full TypeScript support

### Quality

- **Well-tested** generic components
- **Fewer bugs** through code reuse
- **Better performance** with optimized rendering

## Migration Guide

To migrate an existing master data list:

1. **Backup** the original file
2. **Create configuration** object with columns
3. **Replace state management** with `useGenericMasterDataList` hook
4. **Replace JSX** with `<GenericMasterDataList />` component
5. **Test** all functionality (CRUD, search, pagination)

See [`ProductCategoryList.tsx`](../../pages/master-data/product-category/ProductCategoryList.tsx) for a complete example.

## Examples

### Complete Examples

- ✅ **Product Category** - [`ProductCategoryList.tsx`](../../pages/master-data/product-category/ProductCategoryList.tsx)
- ⏳ **Unit** - Coming soon
- ⏳ **Branch** - Coming soon
- ⏳ **Warehouse** - Coming soon

### Comparison

See [`docs/refactoring-comparison.md`](../../../docs/refactoring-comparison.md) for a detailed before/after comparison.

## Troubleshooting

### Issue: Items not filtering correctly

**Solution**: Ensure `searchFields` includes all fields you want to search:

```typescript
searchFields: ["category_code", "category_name", "category_name_en"];
```

### Issue: Pagination not working

**Solution**: Make sure you're using `listState.items` (paginated) not `listState.allItems`:

```typescript
<GenericMasterDataList
    items={listState.items}  // ✅ Correct
    // items={listState.allItems}  // ❌ Wrong
/>
```

### Issue: Custom styling not applied

**Solution**: Use the `className` property in column configuration:

```typescript
{
    header: 'Status',
    accessor: (item) => <Badge />,
    className: 'text-center font-bold'  // ✅ Add custom classes
}
```

## Future Enhancements

- [ ] GenericMasterDataForm component
- [ ] Bulk operations (select multiple, bulk delete)
- [ ] Export functionality (CSV, Excel)
- [ ] Advanced filtering (date ranges, multiple filters)
- [ ] Column sorting
- [ ] Column visibility toggle
- [ ] Saved filter presets

## Support

For questions or issues:

1. Check this README
2. Review example implementations
3. Check [`docs/refactoring-comparison.md`](../../../docs/refactoring-comparison.md)
4. Contact the development team

---

**Last Updated**: 2026-01-21  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
