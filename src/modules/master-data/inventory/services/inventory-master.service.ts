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
    LotNo, LotNoFormData
} from '../types/inventory-master.types';
import type { ListResponse } from '@/shared/types/common-api.types';
import {
    MOCK_ITEM_GROUPS, MOCK_BRANDS, MOCK_PATTERNS, MOCK_DESIGNS, MOCK_GRADES,
    MOCK_MODELS, MOCK_SIZES, MOCK_COLORS, MOCK_LOCATIONS, MOCK_SHELVES, MOCK_LOT_NUMBERS
} from '../mocks/inventory-master.mock';

// ====================================================================================
// GENERIC SERVICE FACTORY
// ====================================================================================

// ====================================================================================
// GENERIC SERVICE FACTORY
// ====================================================================================

// Base form interface that all form data types must satisfy
interface BaseFormData {
    code: string;
    nameTh: string;
    nameEn?: string;
    isActive: boolean;
    hexCode?: string; // For IColorFormData
}

interface ServiceConfig<T> {
    entityName: string;
    apiPath: string;
    idField: string;
    mockData: T[];
}

function createInventoryService<T extends { id: string }>(
    config: ServiceConfig<T>
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
                // Strict: Trust ApiClient to return ListResponse<T>
                return await api.get<ListResponse<T>>(config.apiPath);
            } catch (error) {
                logger.error(`[${config.entityName}Service] getAll error:`, error);
                return { items: [], total: 0 };
            }
        },

        getById: async (id: string): Promise<T | null> => {
            if (USE_MOCK) {
                const item = localData.find(i => i.id === id);
                if (item) {
                    logger.info(`🎭 [Mock Mode] Serving ${config.entityName}: ${id}`);
                    return item;
                }
                return null;
            }
            try {
                return await api.get<T>(`${config.apiPath}/${id}`);
            } catch (error) {
                logger.error(`[${config.entityName}Service] getById error:`, error);
                return null;
            }
        },

        create: async (data: BaseFormData): Promise<{ success: boolean; data?: T; message?: string }> => {
            if (USE_MOCK) {
                logger.info(`🎭 [Mock Mode] Creating ${config.entityName}`, data);
                const newId = `${config.entityName.toUpperCase()}-${data.code.toUpperCase()}`;
                const newItem = {
                    id: newId,
                    [config.idField]: newId,
                    code: data.code.toUpperCase(),
                    name_th: data.nameTh,
                    name_en: data.nameEn ?? '',
                    hex_code: data.hexCode,
                    is_active: data.isActive,
                    updated_at: new Date().toISOString(),
                };
                
                // MOCK STRICTNESS: Treat as generic object to satisfy T
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const mockItem = newItem as any;
                localData.unshift(mockItem);
                return { success: true, data: mockItem };
            }
            try {
                const response = await api.post<T>(config.apiPath, data);
                return { success: true, data: response };
            } catch (error) {
                logger.error(`[${config.entityName}Service] create error:`, error);
                return { success: false, message: `เกิดข้อผิดพลาดในการสร้าง${config.entityName}` };
            }
        },

        update: async (id: string, data: BaseFormData): Promise<{ success: boolean; data?: T; message?: string }> => {
            if (USE_MOCK) {
                const index = localData.findIndex(i => i.id === id);
                if (index !== -1) {
                    const updatedFields = {
                        code: data.code.toUpperCase(),
                        name_th: data.nameTh,
                        name_en: data.nameEn ?? '',
                        hex_code: data.hexCode,
                        is_active: data.isActive,
                        updated_at: new Date().toISOString(),
                    };
                    const mockItem = localData[index];
                    Object.assign(mockItem, updatedFields);
                    return { success: true, data: mockItem };
                }
                return { success: false, message: `ไม่พบ${config.entityName}` };
            }
            try {
                const response = await api.put<T>(`${config.apiPath}/${id}`, data);
                return { success: true, data: response };
            } catch (error) {
                logger.error(`[${config.entityName}Service] update error:`, error);
                return { success: false, message: `เกิดข้อผิดพลาดในการอัปเดต${config.entityName}` };
            }
        },

        delete: async (id: string): Promise<{ success: boolean; message?: string }> => {
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
                return { success: false, message: `เกิดข้อผิดพลาดในการลบ${config.entityName}` };
            }
        },
    };
}

// ====================================================================================
// SERVICE INSTANCES WITH MOCK DATA
// ====================================================================================

// Type aliases for better readability
type ItemGroupService = ReturnType<typeof createInventoryService<ItemGroup>>;
type BrandService = ReturnType<typeof createInventoryService<Brand>>;
type PatternService = ReturnType<typeof createInventoryService<Pattern>>;
type DesignService = ReturnType<typeof createInventoryService<Design>>;
type GradeService = ReturnType<typeof createInventoryService<Grade>>;
type ModelService = ReturnType<typeof createInventoryService<Model>>;
type SizeService = ReturnType<typeof createInventoryService<Size>>;
type ColorService = ReturnType<typeof createInventoryService<Color>>;
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
export const ItemGroupService = createInventoryService<ItemGroup>({
    entityName: 'ItemGroup',
    apiPath: '/item-groups',
    idField: 'item_group_id',
    mockData: MOCK_ITEM_GROUPS,
});

// Brand Service
export const BrandService = createInventoryService<Brand>({
    entityName: 'Brand',
    apiPath: '/brands',
    idField: 'brand_id',
    mockData: MOCK_BRANDS,
});

// Pattern Service
export const PatternService = createInventoryService<Pattern>({
    entityName: 'Pattern',
    apiPath: '/patterns',
    idField: 'pattern_id',
    mockData: MOCK_PATTERNS,
});

// Design Service
export const DesignService = createInventoryService<Design>({
    entityName: 'Design',
    apiPath: '/designs',
    idField: 'design_id',
    mockData: MOCK_DESIGNS,
});

// Grade Service
export const GradeService = createInventoryService<Grade>({
    entityName: 'Grade',
    apiPath: '/grades',
    idField: 'grade_id',
    mockData: MOCK_GRADES,
});

// Model Service
export const ModelService = createInventoryService<Model>({
    entityName: 'Model',
    apiPath: '/models',
    idField: 'model_id',
    mockData: MOCK_MODELS,
});

// Size Service
export const SizeService = createInventoryService<Size>({
    entityName: 'Size',
    apiPath: '/sizes',
    idField: 'size_id',
    mockData: MOCK_SIZES,
});

// Color Service (with hex_code support)
export const ColorService = createInventoryService<Color>({
    entityName: 'Color',
    apiPath: '/colors',
    idField: 'color_id',
    mockData: MOCK_COLORS,
});

// Location Service
export const LocationService = createInventoryService<Location>({
    entityName: 'Location',
    apiPath: '/locations',
    idField: 'location_id',
    mockData: MOCK_LOCATIONS,
});

// Shelf Service
export const ShelfService = createInventoryService<Shelf>({
    entityName: 'Shelf',
    apiPath: '/shelves',
    idField: 'shelf_id',
    mockData: MOCK_SHELVES,
});

// Lot No Service
export const LotNoService = createInventoryService<LotNo>({
    entityName: 'LotNo',
    apiPath: '/lot-numbers',
    idField: 'lot_no_id',
    mockData: MOCK_LOT_NUMBERS,
});
