/**
 * @file sales-structure.types.ts
 * @description Sales organizational structure types (Zone, Channel, Target)
 */

import type { BaseMasterData } from '@/shared/types/common-master.types';

// ====================================================================================
// SALES ZONE (เขตการขาย)
// ====================================================================================

export interface SalesZoneMaster extends BaseMasterData {
    zone_id: string;
    zone_code: string;
    zone_name: string;
    zone_name_en?: string;
}

export interface SalesZoneFormData {
    zoneCode: string;
    zoneName: string;
    zoneNameEn: string;
    isActive: boolean;
}

export type SalesZoneListItem = SalesZoneMaster;

// ====================================================================================
// SALES CHANNEL (ช่องทางการขาย)
// ====================================================================================

export interface SalesChannelMaster extends BaseMasterData {
    channel_id: string;
    channel_code: string;
    channel_name: string;
    channel_name_en?: string;
}

export interface SalesChannelFormData {
    channelCode: string;
    channelName: string;
    channelNameEn: string;
    isActive: boolean;
}

export type SalesChannelListItem = SalesChannelMaster;

// ====================================================================================
// SALES TARGET (เป้าการขาย)
// ====================================================================================

export interface SalesTargetMaster extends BaseMasterData {
    target_id: string;
    target_code: string;
    target_name: string;
    amount: number;
    year: number;
    period: number;
}

export interface SalesTargetFormData {
    targetCode: string;
    targetName: string;
    amount: number;
    year: number;
    period: number;
    isActive: boolean;
}

export type SalesTargetListItem = SalesTargetMaster;
