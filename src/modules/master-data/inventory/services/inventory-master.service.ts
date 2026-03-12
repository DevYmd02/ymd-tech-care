/**
 * @file inventory-master.service.ts
 * @description Generic service factory for Inventory Master Data entities
 * @usage Creates CRUD services for all 11 inventory master entities
 */

import api, { USE_MOCK } from '@/core/api/api';
import { logger } from '@/shared/utils/logger';
import type {
    ItemGroup, ItemGroupFormData,
    Brand, BrandFormData,
    Pattern, PatternFormData,
    Design, DesignFormData,
    Grade, GradeFormData,
    Model, ModelFormData,
    Size, SizeFormData,
    Color, ColorFormData,
    Location, LocationFormData,
    Shelf, ShelfFormData,
    LotNo, LotNoFormData,
    IBaseMaster // Import IBaseMaster
} from '../types/inventory-master.types';
import type { ListResponse } from '@/shared/types/common-api.types';
import type { ItemGroupFormValues } from '../hooks/useItemGroupForm';
import type { BrandFormValues } from '../hooks/useBrandForm';
import type { PatternFormValues } from '../hooks/usePatternForm';
import type { DesignFormValues } from '../hooks/useDesignForm';
import type { GradeFormValues } from '../hooks/useGradeForm';
import type { ModelFormValues } from '../hooks/useModelForm';
import type { SizeFormValues } from '../hooks/useSizeForm';
import type { ColorFormValues } from '../hooks/useColorForm';
import {
    MOCK_ITEM_GROUPS, MOCK_BRANDS, MOCK_PATTERNS, MOCK_DESIGNS, MOCK_GRADES,
    MOCK_MODELS, MOCK_SIZES, MOCK_COLORS, MOCK_LOCATIONS, MOCK_SHELVES, MOCK_LOT_NUMBERS
} from '../mocks/inventory-master.mock';

// ====================================================================================
// GENERIC SERVICE FACTORY
// ====================================================================================

interface ServiceConfig<T, F = any> {
    entityName: string;
    apiPath: string;
    idField: string;
    mockData: T[];
    mapToEntity: (data: F, id: number, now: string) => T;
    mapFromApi?: (apiItem: any) => T;
    mapToApi?: (formData: F) => any;
}

function createInventoryService<T extends IBaseMaster, F = any>(
    config: ServiceConfig<T, F>
) {
    let localData: T[] = [...config.mockData];

    return {
        getAll: async (): Promise<ListResponse<T>> => {
            if (USE_MOCK) {
                logger.info(`🎭 [Mock Mode] Serving ${config.entityName} list`);
                return {
                    items: localData,
                    total: localData.length,
                    page: 1,
                    limit: 10
                };
            }
            try {
                const response = await api.get<any>(config.apiPath);
                const rawItems = Array.isArray(response) ? response : (response.items || response.data || []);

                const items = config.mapFromApi
                    ? rawItems.map(config.mapFromApi)
                    : rawItems;

                return {
                    items,
                    total: response.total ?? items.length,
                    page: response.page ?? 1,
                    limit: response.limit ?? 10,
                };
            } catch (error) {
                logger.error(`[${config.entityName}Service] getAll error:`, error);
                return { items: [], total: 0 };
            }
        },

        getById: async (id: number): Promise<T | null> => {
            if (USE_MOCK) {
                const item = localData.find(i => i.id === id);
                if (item) {
                    logger.info(`🎭 [Mock Mode] Serving ${config.entityName}: ${id}`);
                    return item;
                }
                return null;
            }
            try {
                const response = await api.get<any>(`${config.apiPath}/${id}`);
                if (!response) return null;
                const rawItem = response.data || response;
                return config.mapFromApi ? config.mapFromApi(rawItem) : rawItem;
            } catch (error) {
                logger.error(`[${config.entityName}Service] getById error:`, error);
                return null;
            }
        },

        create: async (data: F): Promise<{ success: boolean; data?: T; message?: string }> => {
            if (USE_MOCK) {
                logger.info(`🎭 [Mock Mode] Creating ${config.entityName}`, data);
                const newId = Date.now();
                const now = new Date().toISOString();
                
                // Construct object using the provided mapper for strict type safety
                const mockItem = config.mapToEntity(data, newId, now);
                
                localData.unshift(mockItem);
                return { success: true, data: mockItem };
            }
            try {
              const payload = config.mapToApi ? config.mapToApi(data) : data;
              const response = await api.post<any>(config.apiPath, payload);
              const isSuccess = response?.success ?? true; // Assume success if not specified
              const rawData = response?.data || response;
              const resultData = config.mapFromApi && rawData ? config.mapFromApi(rawData) : rawData;
              return { success: isSuccess, data: resultData as T, message: response?.message };
            } catch (error: any) {
                logger.error(`[${config.entityName}Service] create error:`, error);
                const backendMsg = error?.response?.data?.message || error?.response?.data?.error || error.message;
                return { success: false, message: backendMsg || `เกิดข้อผิดพลาดในการสร้าง ${config.entityName}` };
            }
        },

        update: async (id: number, data: F): Promise<{ success: boolean; data?: T; message?: string }> => {
            if (USE_MOCK) {
                const index = localData.findIndex(i => i.id === id);
                if (index !== -1) {
                    const now = new Date().toISOString();
                    // In mock update, we replace the item or merge.
                    // Using mapToEntity ensures type safety.
                    const updatedItem = config.mapToEntity(data, id, now);
                    
                    // Maintain existing timestamps if needed, or update them
                    const existing = localData[index];
                    localData[index] = {
                        ...updatedItem,
                        created_at: existing.created_at // Keep original creation date for mock consistency
                    };
                    
                    return { success: true, data: localData[index] };
                }
                return { success: false, message: `ไม่พบ${config.entityName}` };
            }
            try {
              const payload = config.mapToApi ? config.mapToApi(data) : data;
              const response = await api.patch<any>(`${config.apiPath}/${id}`, payload);
              const isSuccess = response?.success ?? true; // Assume success if not specified
              const rawData = response?.data || response;
              const resultData = config.mapFromApi && rawData ? config.mapFromApi(rawData) : rawData;
              return { success: isSuccess, data: resultData as T, message: response?.message };
            } catch (error: any) {
                logger.error(`[${config.entityName}Service] update error:`, error);
                const backendMsg = error?.response?.data?.message || error?.response?.data?.error || error.message;
                return { success: false, message: backendMsg || `เกิดข้อผิดพลาดในการอัปเดต ${config.entityName}` };
            }
        },

        delete: async (id: number): Promise<{ success: boolean; message?: string }> => {
            if (USE_MOCK) {
                const initialLength = localData.length;
                localData = localData.filter(i => i.id !== id);
                if (localData.length < initialLength) {
                    return { success: true };
                }
                return { success: false, message: `ไม่พบ${config.entityName}` };
            }
            try {
                await api.delete<T>(`${config.apiPath}/${id}`);
                return { success: true };
            } catch (error: any) {
                logger.error(`[${config.entityName}Service] delete error:`, error);
                const backendMsg = error?.response?.data?.message || error.message;
                return { success: false, message: backendMsg || `เกิดข้อผิดพลาดในการลบ${config.entityName}` };
            }
        },
    };
}

// ====================================================================================
// SERVICE INSTANCES WITH MOCK DATA
// ====================================================================================

// Type aliases for better readability
type ItemGroupService = ReturnType<typeof createInventoryService<ItemGroup, ItemGroupFormValues>>;
type BrandService = ReturnType<typeof createInventoryService<Brand>>;
type PatternService = ReturnType<typeof createInventoryService<Pattern>>;
type DesignService = ReturnType<typeof createInventoryService<Design, DesignFormValues>>;
type GradeService = ReturnType<typeof createInventoryService<Grade, GradeFormValues>>;
type ModelService = ReturnType<typeof createInventoryService<Model>>;
type SizeService = ReturnType<typeof createInventoryService<Size, SizeFormValues>>;
type ColorService = ReturnType<typeof createInventoryService<Color, ColorFormValues>>;
type LocationService = ReturnType<typeof createInventoryService<Location>>;
type ShelfService = ReturnType<typeof createInventoryService<Shelf>>;
type LotNoService = ReturnType<typeof createInventoryService<LotNo>>;

// Suppress unused type warnings by exporting type union
export type InventoryServiceType = 
    ItemGroupService | BrandService | PatternService | DesignService | GradeService |
    ModelService | SizeService | ColorService | LocationService | ShelfService | LotNoService;

// Suppress unused form data type warnings
export type InventoryFormDataType = 
    ItemGroupFormData | BrandFormData | PatternFormData | DesignFormData | GradeFormData |
    ModelFormData | SizeFormData | ColorFormData | LocationFormData | ShelfFormData | LotNoFormData;

// Item Group Service
export const ItemGroupService = createInventoryService<ItemGroup, ItemGroupFormValues>({
    entityName: 'ItemGroup',
    apiPath: '/item-group',
    idField: 'item_group_id',
    mockData: MOCK_ITEM_GROUPS,
    mapToEntity: (data, id, now) => ({
        id,
        item_group_id: id,
        code: data.code.toUpperCase(),
        name_th: data.nameTh,
        name_en: data.nameEn ?? '',
        is_active: data.isActive,
        created_at: now,
        updated_at: now,
    }),
    mapFromApi: (item: any): ItemGroup => ({
        id: item.item_group_id,
        item_group_id: item.item_group_id,
        code: item.item_group_code,
        name_th: item.item_group_name,
        name_en: item.item_group_nameeng || '',
        is_active: item.is_active,
        created_at: item.created_at,
        updated_at: item.updated_at,
    }),
    mapToApi: (data: ItemGroupFormValues) => ({
        item_group_code: data.code,
        item_group_name: data.nameTh,
        item_group_nameeng: data.nameEn,
        is_active: data.isActive,
    }),
});

// Brand Service
export const BrandService = createInventoryService<Brand, BrandFormValues>({
    entityName: 'Brand',
    apiPath: '/item-brand',
    idField: 'brand_id',
    mockData: MOCK_BRANDS,
    mapToEntity: (data, id, now) => ({
        id,
        brand_id: id,
        code: data.code.toUpperCase(),
        name_th: data.nameTh,
        name_en: data.nameEn ?? '',
        is_active: data.isActive,
        created_at: now,
        updated_at: now,
    }),
    mapFromApi: (item: any): Brand => ({
        id: item.item_brand_id,
        brand_id: item.item_brand_id,
        code: item.item_brand_code,
        name_th: item.item_brand_name,
        name_en: item.item_brand_nameeng || '',
        is_active: item.is_active,
        created_at: item.created_at,
        updated_at: item.updated_at,
    }),
    mapToApi: (data: BrandFormValues) => ({
        item_brand_code: data.code?.trim(),
        item_brand_name: data.nameTh?.trim(),
        item_brand_nameeng: data.nameEn?.trim() || '',
        is_active: data.isActive,
    }),
});

// Pattern Service
export const PatternService = createInventoryService<Pattern, PatternFormValues>({
    entityName: 'Pattern',
    apiPath: '/item-pattern',
    idField: 'pattern_id',
    mockData: MOCK_PATTERNS,
    mapToEntity: (data, id, now) => ({
        id,
        pattern_id: id,
        code: data.code.toUpperCase(),
        name_th: data.nameTh,
        name_en: data.nameEn ?? '',
        is_active: data.isActive,
        created_at: now,
        updated_at: now,
    }),
    mapFromApi: (item: any): Pattern => ({
        id: item.item_pattern_id,
        pattern_id: item.item_pattern_id,
        code: item.item_pattern_code,
        name_th: item.item_pattern_name,
        name_en: item.item_pattern_nameeng || '',
        is_active: item.is_active,
        created_at: item.created_at,
        updated_at: item.updated_at,
    }),
    mapToApi: (data: PatternFormValues) => ({
        item_pattern_code: data.code?.trim(),
        item_pattern_name: data.nameTh?.trim(),
        item_pattern_nameeng: data.nameEn?.trim() || '',
        is_active: data.isActive,
    }),
});

// Design Service
export const DesignService = createInventoryService<Design, DesignFormValues>({
    entityName: 'Design',
    apiPath: '/item-design',
    idField: 'design_id',
    mockData: MOCK_DESIGNS,
    mapToEntity: (data, id, now) => ({
        id,
        design_id: id,
        code: data.code.toUpperCase(),
        name_th: data.nameTh,
        name_en: data.nameEn ?? '',
        is_active: data.isActive,
        created_at: now,
        updated_at: now,
    }),
    mapFromApi: (item: any): Design => ({
        id: item.item_design_id,
        design_id: item.item_design_id,
        code: item.item_design_code,
        name_th: item.item_design_name,
        name_en: item.item_design_nameeng || '',
        is_active: item.is_active,
        created_at: item.created_at,
        updated_at: item.updated_at,
    }),
    mapToApi: (data: DesignFormValues) => ({
        item_design_code: data.code?.trim(),
        item_design_name: data.nameTh?.trim(),
        item_design_nameeng: data.nameEn?.trim() || '',
        is_active: data.isActive,
    }),
});

// Grade Service
export const GradeService = createInventoryService<Grade, GradeFormValues>({
    entityName: 'Grade',
    apiPath: '/item-grade',
    idField: 'grade_id',
    mockData: MOCK_GRADES,
    mapToEntity: (data, id, now) => ({
        id,
        grade_id: id,
        code: data.code.toUpperCase(),
        name_th: data.nameTh,
        name_en: data.nameEn ?? '',
        is_active: data.isActive,
        created_at: now,
        updated_at: now,
    }),
    mapFromApi: (item: any): Grade => ({
        id: item.item_grade_id,
        grade_id: item.item_grade_id,
        code: item.item_grade_code,
        name_th: item.item_grade_name,
        name_en: item.item_grade_nameeng || '',
        is_active: item.is_active,
        created_at: item.created_at,
        updated_at: item.updated_at,
    }),
    mapToApi: (data: GradeFormValues) => ({
        item_grade_code: data.code?.trim(),
        item_grade_name: data.nameTh?.trim(),
        item_grade_nameeng: data.nameEn?.trim() || '',
        is_active: data.isActive,
    }),
});

// Model Service
export const ModelService = createInventoryService<Model, ModelFormValues>({
    entityName: 'Model',
    apiPath: '/item-class',
    idField: 'model_id',
    mockData: MOCK_MODELS,
    mapToEntity: (data, id, now) => ({
        id,
        model_id: id,
        code: data.code.toUpperCase(),
        name_th: data.nameTh,
        name_en: data.nameEn ?? '',
        is_active: data.isActive,
        created_at: now,
        updated_at: now,
    }),
    mapFromApi: (item: any): Model => ({
        id: item.item_class_id,
        model_id: item.item_class_id,
        code: item.item_class_code,
        name_th: item.item_class_name,
        name_en: item.item_class_nameeng || '',
        is_active: item.is_active,
        created_at: item.created_at,
        updated_at: item.updated_at,
    }),
    mapToApi: (data: ModelFormValues) => ({
        item_class_code: data.code?.trim(),
        item_class_name: data.nameTh?.trim(),
        item_class_nameeng: data.nameEn?.trim() || '',
        is_active: data.isActive,
    }),
});

// Size Service
export const SizeService = createInventoryService<Size, SizeFormValues>({
    entityName: 'Size',
    apiPath: '/item-size',
    idField: 'size_id',
    mockData: MOCK_SIZES,
    mapToEntity: (data, id, now) => ({
        id,
        size_id: id,
        code: data.code.toUpperCase(),
        name_th: data.nameTh,
        name_en: data.nameEn ?? '',
        is_active: data.isActive,
        created_at: now,
        updated_at: now,
    }),
    mapFromApi: (item: any): Size => ({
        id: item.item_size_id,
        size_id: item.item_size_id,
        code: item.item_size_code,
        name_th: item.item_size_name,
        name_en: item.item_size_nameeng || '',
        is_active: item.is_active,
        created_at: item.created_at,
        updated_at: item.updated_at,
    }),
    mapToApi: (data: SizeFormValues) => ({
        item_size_code: data.code?.trim(),
        item_size_name: data.nameTh?.trim(),
        item_size_nameeng: data.nameEn?.trim() || '',
        is_active: data.isActive,
    }),
});

// Color Service (with hex_code support)
export const ColorService = createInventoryService<Color, ColorFormValues>({
    entityName: 'Color',
    apiPath: '/item-color',
    idField: 'color_id',
    mockData: MOCK_COLORS,
    mapToEntity: (data, id, now) => ({
        id,
        color_id: id,
        code: data.code.toUpperCase(),
        name_th: data.nameTh,
        name_en: data.nameEn ?? '',
        is_active: data.isActive,
        created_at: now,
        updated_at: now,
    }),
    mapFromApi: (item: any): Color => ({
        id: item.item_color_id,
        color_id: item.item_color_id,
        code: item.item_color_code,
        name_th: item.item_color_name,
        name_en: item.item_color_nameeng || '',
        is_active: item.is_active,
        created_at: item.created_at,
        updated_at: item.updated_at,
    }),
    mapToApi: (data: ColorFormValues) => ({
        item_color_code: data.code?.trim(),
        item_color_name: data.nameTh?.trim(),
        item_color_nameeng: data.nameEn?.trim() || '',
        is_active: data.isActive,
    }),
});

// Location Service
export const LocationService = createInventoryService<Location, any>({
    entityName: 'Location',
    apiPath: '/locations',
    idField: 'location_id',
    mockData: MOCK_LOCATIONS,
    mapToEntity: (data, id, now) => ({
        id,
        location_id: id,
        code: data.code.toUpperCase(),
        name_th: data.nameTh,
        name_en: data.nameEn ?? '',
        is_active: data.isActive,
        created_at: now,
        updated_at: now,
    }),
});

// Shelf Service
export const ShelfService = createInventoryService<Shelf, any>({
    entityName: 'Shelf',
    apiPath: '/shelves',
    idField: 'shelf_id',
    mockData: MOCK_SHELVES,
    mapToEntity: (data, id, now) => ({
        id,
        shelf_id: id,
        code: data.code.toUpperCase(),
        name_th: data.nameTh,
        name_en: data.nameEn ?? '',
        is_active: data.isActive,
        created_at: now,
        updated_at: now,
    }),
});

// Lot No Service
export const LotNoService = createInventoryService<LotNo, any>({
    entityName: 'LotNo',
    apiPath: '/lot-numbers',
    idField: 'lot_no_id',
    mockData: MOCK_LOT_NUMBERS,
    mapToEntity: (data, id, now) => ({
        id,
        lot_no_id: id,
        code: data.code.toUpperCase(),
        name_th: data.nameTh,
        name_en: data.nameEn ?? '',
        is_active: data.isActive,
        created_at: now,
        updated_at: now,
    }),
});
