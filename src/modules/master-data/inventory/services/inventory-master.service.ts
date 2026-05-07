/**
 * @file inventory-master.service.ts
 * @description Generic service factory for Inventory Master Data entities
 * @usage Creates CRUD services for all 11 inventory master entities
 */

import api, { USE_MOCK } from '@/core/api/api';
import type { AxiosRequestConfig } from 'axios';
import { logger } from '@/shared/utils';
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
import type { ListResponse } from '@/shared/types/api.types';
import type { ItemGroupFormValues } from '../hooks/useItemGroupForm';
import type { BrandFormValues } from '../hooks/useBrandForm';
import type { PatternFormValues } from '../hooks/usePatternForm';
import type { DesignFormValues } from '../hooks/useDesignForm';
import type { GradeFormValues } from '../hooks/useGradeForm';
import type { ModelFormValues } from '../hooks/useModelForm';
import type { SizeFormValues } from '../hooks/useSizeForm';
import type { ColorFormValues } from '../hooks/useColorForm';
import type { ShelfFormValues } from '../hooks/useShelfForm';
import type { LocationFormValues } from '../hooks/useLocationForm';
import {
    MOCK_ITEM_GROUPS, MOCK_BRANDS, MOCK_PATTERNS, MOCK_DESIGNS, MOCK_GRADES,
    MOCK_MODELS, MOCK_SIZES, MOCK_COLORS, MOCK_LOCATIONS, MOCK_SHELVES, MOCK_LOT_NUMBERS
} from '../mocks/inventory-master.mock';

// ====================================================================================
// GENERIC SERVICE FACTORY
// ====================================================================================

interface ServiceConfig<T, F, A, O = Partial<A>> {
    entityName: string;
    apiPath: string;
    idField: string;
    mockData: T[];
    mapToEntity: (data: F, id: number, now: string) => T;
    mapFromApi?: (apiItem: A) => T;
    mapToApi?: (formData: F) => O;
}

function createInventoryService<T extends IBaseMaster, F, A, O = Partial<A>>(
    config: ServiceConfig<T, F, A, O>
) {
    let localData: T[] = [...config.mockData];

    return {
        getAll: async (params?: Record<string, string | number | boolean | undefined>, axiosConfig?: AxiosRequestConfig): Promise<ListResponse<T>> => {
            if (USE_MOCK) {
                logger.info(`🎭 [Mock Mode] Serving ${config.entityName} list`, params);
                let filtered = [...localData];
                
                if (params) {
                    const typedFiltered = filtered as (T & { 
                        item_id?: string | number; 
                        warehouse_id?: string | number; 
                        location_id?: string | number;
                    })[];

                    if (params.q) {
                        const q = String(params.q).toLowerCase();
                        filtered = typedFiltered.filter(i => 
                            String(i.code || '').toLowerCase().includes(q) || 
                            String(i.name_th || '').toLowerCase().includes(q)
                        ) as T[];
                    }
                    if (params.item_id) {
                        filtered = typedFiltered.filter(i => String(i.item_id) === String(params.item_id)) as T[];
                    }
                    if (params.warehouse_id) {
                        filtered = typedFiltered.filter(i => String(i.warehouse_id) === String(params.warehouse_id)) as T[];
                    }
                    if (params.location_id) {
                        filtered = typedFiltered.filter(i => String(i.location_id) === String(params.location_id)) as T[];
                    }
                }

                return {
                    items: filtered,
                    total: filtered.length,
                    page: 1,
                    limit: params?.limit ? Number(params.limit) : 10
                };
            }
            try {
                const response = await api.get<A[] | { items?: A[]; data?: A[]; total?: number; page?: number; limit?: number }>(config.apiPath, { ...axiosConfig, params });
                
                const rawItems = Array.isArray(response) 
                    ? response 
                    : (response.items || response.data || []);

                const items = config.mapFromApi && Array.isArray(rawItems)
                    ? rawItems.map(config.mapFromApi)
                    : rawItems as unknown as T[];

                const meta = typeof response === 'object' && !Array.isArray(response) ? response : {};

                return {
                    items: items || [],
                    total: meta.total ?? (items ? items.length : 0),
                    page: meta.page ?? 1,
                    limit: meta.limit ?? 10,
                };
            } catch (error) {
                logger.error(`[${config.entityName}Service] getAll error:`, error);
                return { items: [], total: 0 };
            }
        },

        getById: async (id: number, axiosConfig?: AxiosRequestConfig): Promise<T | null> => {
            if (USE_MOCK) {
                const item = localData.find(i => i.id === id);
                if (item) {
                    logger.info(`🎭 [Mock Mode] Serving ${config.entityName}: ${id}`);
                    return item;
                }
                return null;
            }
            try {
                const response = await api.get<A | { data?: A } | null>(`${config.apiPath}/${id}`, axiosConfig);
                if (!response) return null;
                const rawItem = typeof response === 'object' && response !== null && 'data' in response && response.data 
                    ? response.data 
                    : response as A;
                return config.mapFromApi ? config.mapFromApi(rawItem) : rawItem as unknown as T;
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
              const payload = config.mapToApi ? config.mapToApi(data) : data as unknown as O;
              const response = await api.post<{ success?: boolean; data?: A; message?: string } | A>(config.apiPath, payload);
              
              const isSuccess = response && typeof response === 'object' && 'success' in response 
                  ? response.success ?? true 
                  : true;
                  
              const rawData = response && typeof response === 'object' && 'data' in response 
                  ? response.data 
                  : response as A;
                  
              const resultData = config.mapFromApi && rawData 
                  ? config.mapFromApi(rawData) 
                  : rawData as unknown as T;
              return { success: isSuccess, data: resultData as T, message: response && typeof response === 'object' && 'message' in response ? response.message as string : undefined };
            } catch (error) {
                logger.error(`[${config.entityName}Service] create error:`, error);
                const err = error as { response?: { data?: { message?: string, error?: string } }, message?: string };
                const backendMsg = err.response?.data?.message || err.response?.data?.error || err.message;
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
              const payload = config.mapToApi ? config.mapToApi(data) : data as unknown as O;
              const response = await api.patch<{ success?: boolean; data?: A; message?: string } | A>(`${config.apiPath}/${id}`, payload);
              
              const isSuccess = response && typeof response === 'object' && 'success' in response 
                  ? response.success ?? true 
                  : true;
                  
              const rawData = response && typeof response === 'object' && 'data' in response 
                  ? response.data 
                  : response as A;
                  
              const resultData = config.mapFromApi && rawData 
                  ? config.mapFromApi(rawData) 
                  : rawData as unknown as T;
              return { success: isSuccess, data: resultData as T, message: response && typeof response === 'object' && 'message' in response ? response.message as string : undefined };
            } catch (error) {
                logger.error(`[${config.entityName}Service] update error:`, error);
                const err = error as { response?: { data?: { message?: string, error?: string } }, message?: string };
                const backendMsg = err.response?.data?.message || err.response?.data?.error || err.message;
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
            } catch (error) {
                logger.error(`[${config.entityName}Service] delete error:`, error);
                const err = error as { response?: { data?: { message?: string } }, message?: string };
                const backendMsg = err.response?.data?.message || err.message;
                return { success: false, message: backendMsg || `เกิดข้อผิดพลาดในการลบ${config.entityName}` };
            }
        },
    };
}

// ====================================================================================
// API RESPONSE INTERFACES (Backend DTOs)
// ====================================================================================

interface ItemGroupApiResponse {
    item_group_id: number;
    item_group_code: string;
    item_group_name: string;
    item_group_nameeng?: string;
    is_active: boolean;
    created_at: string;
    updated_at?: string;
}

interface BrandApiResponse {
    item_brand_id: number;
    item_brand_code: string;
    item_brand_name: string;
    item_brand_nameeng?: string;
    is_active: boolean;
    created_at: string;
    updated_at?: string;
}

interface PatternApiResponse {
    item_pattern_id: number;
    item_pattern_code: string;
    item_pattern_name: string;
    item_pattern_nameeng?: string;
    is_active: boolean;
    created_at: string;
    updated_at?: string;
}

interface DesignApiResponse {
    item_design_id: number;
    item_design_code: string;
    item_design_name: string;
    item_design_nameeng?: string;
    is_active: boolean;
    created_at: string;
    updated_at?: string;
}

interface GradeApiResponse {
    item_grade_id: number;
    item_grade_code: string;
    item_grade_name: string;
    item_grade_nameeng?: string;
    is_active: boolean;
    created_at: string;
    updated_at?: string;
}

interface ModelApiResponse {
    item_class_id: number;
    item_class_code: string;
    item_class_name: string;
    item_class_nameeng?: string;
    is_active: boolean;
    created_at: string;
    updated_at?: string;
}

interface SizeApiResponse {
    item_size_id: number;
    item_size_code: string;
    item_size_name: string;
    item_size_nameeng?: string;
    is_active: boolean;
    created_at: string;
    updated_at?: string;
}

interface ColorApiResponse {
    item_color_id: number;
    item_color_code: string;
    item_color_name: string;
    item_color_nameeng?: string;
    hex_code?: string;
    is_active: boolean;
    created_at: string;
    updated_at?: string;
}

interface LocationApiResponse {
    location_id: number;
    location_code: string;
    location_name: string;
    location_nameeng?: string;
    warehouse_id?: number;
    shelf_id?: number;
    is_active: boolean;
    created_at: string;
    updated_at?: string;
}

interface ShelfApiResponse {
    shelf_id: number;
    shelf_code: string;
    shelf_name: string;
    shelf_nameeng?: string;
    location_id?: number;
    is_active: boolean;
    created_at: string;
    updated_at?: string;
}

interface LotNoApiResponse {
    lot_no_id: number;
    lot_no_code: string;
    lot_no_name: string;
    expiry_date?: string;
    mfg_date?: string;
    supplier_vendor_id?: number | string;
    item_id?: number | string;
    note?: string;
    is_active: boolean;
    created_at: string;
    updated_at?: string;
    balance_qty?: number;
    sale_stock?: number;
    warehouse_id?: number;
    location_id?: number;
}

// ====================================================================================
// SERVICE INSTANCES WITH MOCK DATA
// ====================================================================================

// Type aliases for better readability
type ItemGroupService = ReturnType<typeof createInventoryService<ItemGroup, ItemGroupFormValues, ItemGroupApiResponse>>;
type BrandService = ReturnType<typeof createInventoryService<Brand, BrandFormValues, BrandApiResponse>>;
type PatternService = ReturnType<typeof createInventoryService<Pattern, PatternFormValues, PatternApiResponse>>;
type DesignService = ReturnType<typeof createInventoryService<Design, DesignFormValues, DesignApiResponse>>;
type GradeService = ReturnType<typeof createInventoryService<Grade, GradeFormValues, GradeApiResponse>>;
type ModelService = ReturnType<typeof createInventoryService<Model, ModelFormValues, ModelApiResponse>>;
type SizeService = ReturnType<typeof createInventoryService<Size, SizeFormValues, SizeApiResponse>>;
type ColorService = ReturnType<typeof createInventoryService<Color, ColorFormValues, ColorApiResponse>>;
type LocationService = ReturnType<typeof createInventoryService<Location, LocationFormValues, LocationApiResponse>>;
type ShelfService = ReturnType<typeof createInventoryService<Shelf, ShelfFormValues, ShelfApiResponse>>;
type LotNoService = ReturnType<typeof createInventoryService<LotNo, LotNoFormData, LotNoApiResponse>>;

// Suppress unused type warnings by exporting type union
export type InventoryServiceType = 
    ItemGroupService | BrandService | PatternService | DesignService | GradeService |
    ModelService | SizeService | ColorService | LocationService | ShelfService | LotNoService;

// Suppress unused form data type warnings
export type InventoryFormDataType = 
    ItemGroupFormData | BrandFormData | PatternFormData | DesignFormData | GradeFormData |
    ModelFormData | SizeFormData | ColorFormData | LocationFormData | ShelfFormData | LotNoFormData;

// Item Group Service
export const ItemGroupService = createInventoryService<ItemGroup, ItemGroupFormValues, ItemGroupApiResponse>({
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
    mapFromApi: (item: ItemGroupApiResponse): ItemGroup => ({
        id: item.item_group_id,
        item_group_id: item.item_group_id,
        code: item.item_group_code,
        name_th: item.item_group_name,
        name_en: item.item_group_nameeng || '',
        is_active: item.is_active,
        created_at: item.created_at,
        updated_at: item.updated_at || '',
    }),
    mapToApi: (data: ItemGroupFormValues) => ({
        item_group_code: data.code,
        item_group_name: data.nameTh,
        item_group_nameeng: data.nameEn,
        is_active: data.isActive,
    }),
});

// Brand Service
export const BrandService = createInventoryService<Brand, BrandFormValues, BrandApiResponse>({
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
    mapFromApi: (item: BrandApiResponse): Brand => ({
        id: item.item_brand_id,
        brand_id: item.item_brand_id,
        code: item.item_brand_code,
        name_th: item.item_brand_name,
        name_en: item.item_brand_nameeng || '',
        is_active: item.is_active,
        created_at: item.created_at,
        updated_at: item.updated_at || '',
    }),
    mapToApi: (data: BrandFormValues) => ({
        item_brand_code: data.code?.trim(),
        item_brand_name: data.nameTh?.trim(),
        item_brand_nameeng: data.nameEn?.trim() || '',
        is_active: data.isActive,
    }),
});

// Pattern Service
export const PatternService = createInventoryService<Pattern, PatternFormValues, PatternApiResponse>({
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
    mapFromApi: (item: PatternApiResponse): Pattern => ({
        id: item.item_pattern_id,
        pattern_id: item.item_pattern_id,
        code: item.item_pattern_code,
        name_th: item.item_pattern_name,
        name_en: item.item_pattern_nameeng || '',
        is_active: item.is_active,
        created_at: item.created_at,
        updated_at: item.updated_at || '',
    }),
    mapToApi: (data: PatternFormValues) => ({
        item_pattern_code: data.code?.trim(),
        item_pattern_name: data.nameTh?.trim(),
        item_pattern_nameeng: data.nameEn?.trim() || '',
        is_active: data.isActive,
    }),
});

// Design Service
export const DesignService = createInventoryService<Design, DesignFormValues, DesignApiResponse>({
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
    mapFromApi: (item: DesignApiResponse): Design => ({
        id: item.item_design_id,
        design_id: item.item_design_id,
        code: item.item_design_code,
        name_th: item.item_design_name,
        name_en: item.item_design_nameeng || '',
        is_active: item.is_active,
        created_at: item.created_at,
        updated_at: item.updated_at || '',
    }),
    mapToApi: (data: DesignFormValues) => ({
        item_design_code: data.code?.trim(),
        item_design_name: data.nameTh?.trim(),
        item_design_nameeng: data.nameEn?.trim() || '',
        is_active: data.isActive,
    }),
});

// Grade Service
export const GradeService = createInventoryService<Grade, GradeFormValues, GradeApiResponse>({
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
    mapFromApi: (item: GradeApiResponse): Grade => ({
        id: item.item_grade_id,
        grade_id: item.item_grade_id,
        code: item.item_grade_code,
        name_th: item.item_grade_name,
        name_en: item.item_grade_nameeng || '',
        is_active: item.is_active,
        created_at: item.created_at,
        updated_at: item.updated_at || '',
    }),
    mapToApi: (data: GradeFormValues) => ({
        item_grade_code: data.code?.trim(),
        item_grade_name: data.nameTh?.trim(),
        item_grade_nameeng: data.nameEn?.trim() || '',
        is_active: data.isActive,
    }),
});

// Model Service
export const ModelService = createInventoryService<Model, ModelFormValues, ModelApiResponse>({
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
    mapFromApi: (item: ModelApiResponse): Model => ({
        id: item.item_class_id,
        model_id: item.item_class_id,
        code: item.item_class_code,
        name_th: item.item_class_name,
        name_en: item.item_class_nameeng || '',
        is_active: item.is_active,
        created_at: item.created_at,
        updated_at: item.updated_at || '',
    }),
    mapToApi: (data: ModelFormValues) => ({
        item_class_code: data.code?.trim(),
        item_class_name: data.nameTh?.trim(),
        item_class_nameeng: data.nameEn?.trim() || '',
        is_active: data.isActive,
    }),
});

// Size Service
export const SizeService = createInventoryService<Size, SizeFormValues, SizeApiResponse>({
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
    mapFromApi: (item: SizeApiResponse): Size => ({
        id: item.item_size_id,
        size_id: item.item_size_id,
        code: item.item_size_code,
        name_th: item.item_size_name,
        name_en: item.item_size_nameeng || '',
        is_active: item.is_active,
        created_at: item.created_at,
        updated_at: item.updated_at || '',
    }),
    mapToApi: (data: SizeFormValues) => ({
        item_size_code: data.code?.trim(),
        item_size_name: data.nameTh?.trim(),
        item_size_nameeng: data.nameEn?.trim() || '',
        is_active: data.isActive,
    }),
});

// Color Service (with hex_code support)
export const ColorService = createInventoryService<Color, ColorFormValues, ColorApiResponse>({
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
    mapFromApi: (item: ColorApiResponse): Color => ({
        id: item.item_color_id,
        color_id: item.item_color_id,
        code: item.item_color_code,
        name_th: item.item_color_name,
        name_en: item.item_color_nameeng || '',
        is_active: item.is_active,
        created_at: item.created_at,
        updated_at: item.updated_at || '',
    }),
    mapToApi: (data: ColorFormValues) => ({
        item_color_code: data.code?.trim(),
        item_color_name: data.nameTh?.trim(),
        item_color_nameeng: data.nameEn?.trim() || '',
        is_active: data.isActive,
    }),
});

// Location Service
export const LocationService = createInventoryService<Location, LocationFormValues, LocationApiResponse>({
    entityName: 'Location',
    apiPath: '/location',
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
    mapFromApi: (item: LocationApiResponse): Location => ({
        id: item.location_id,
        location_id: item.location_id,
        code: item.location_code,
        name_th: item.location_name,
        name_en: item.location_nameeng || '',
        is_active: item.is_active,
        created_at: item.created_at,
        updated_at: item.updated_at || '',
        warehouse_id: item.warehouse_id,
        shelf_id: item.shelf_id,
    }),
    mapToApi: (data: LocationFormValues) => ({
        location_code: data.code?.trim(),
        location_name: data.nameTh?.trim(),
        location_nameeng: data.nameEn?.trim() || undefined,
        is_active: data.isActive,
        warehouse_id: data.warehouseId,
        shelf_id: data.shelfId,
    }),
});

// Shelf Service
export const ShelfService = createInventoryService<Shelf, ShelfFormValues, ShelfApiResponse>({
    entityName: 'Shelf',
    apiPath: '/shelf',
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
    mapFromApi: (item: ShelfApiResponse): Shelf => ({
        id: item.shelf_id,
        shelf_id: item.shelf_id,
        code: item.shelf_code,
        name_th: item.shelf_name,
        name_en: item.shelf_nameeng || '',
        is_active: item.is_active,
        created_at: item.created_at,
        updated_at: item.updated_at || '',
    }),
    mapToApi: (data: ShelfFormValues) => ({
        shelf_code: data.code?.trim(),
        shelf_name: data.nameTh?.trim(),
        shelf_nameeng: data.nameEn?.trim() || undefined,
        is_active: data.isActive,
    }),
});

// Lot No Service
export const LotNoService = createInventoryService<LotNo, LotNoFormData, LotNoApiResponse>({
    entityName: 'LotNo',
    apiPath: '/item-lot',
    idField: 'lot_no_id',
    mockData: MOCK_LOT_NUMBERS,
    mapToEntity: (data, id, now) => ({
        id,
        lot_no_id: id,
        code: data.code.toUpperCase(),
        name_th: data.nameTh,
        name_en: data.nameEn ?? '',
        expiry_date: data.expiryDate,
        mfg_date: data.mfgDate,
        supplier_vendor_id: data.supplierVendorId,
        item_id: data.itemId,
        note: data.note,
        is_active: data.isActive,
        created_at: now,
        updated_at: now,
    }),
    mapFromApi: (item: LotNoApiResponse): LotNo => {
        const r = (item as unknown) as Record<string, unknown>;
        return {
            id: item.lot_no_id || (r.lot_id as number) || 0,
            lot_no_id: item.lot_no_id || (r.lot_id as number) || 0,
            code: item.lot_no_code || (r.lot_no as string) || '',
            name_th: item.lot_no_name || (r.lot_no as string) || '',
            name_en: '',
            expiry_date: item.expiry_date,
            mfg_date: item.mfg_date,
            supplier_vendor_id: item.supplier_vendor_id,
            item_id: item.item_id,
            note: item.note,
            is_active: item.is_active,
            created_at: item.created_at,
            updated_at: item.updated_at || '',
            balance_qty: item.balance_qty,
            sale_stock: item.sale_stock,
            warehouse_id: item.warehouse_id,
            location_id: item.location_id,
        };
    },
    mapToApi: (data: LotNoFormData) => ({
        lot_no_code: data.code?.trim().toUpperCase(),
        lot_no_name: data.nameTh?.trim(),
        expiry_date: data.expiryDate,
        mfg_date: data.mfgDate,
        supplier_vendor_id: data.supplierVendorId,
        item_id: data.itemId,
        note: data.note,
        is_active: data.isActive,
    }),
});
