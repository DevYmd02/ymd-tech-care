/**
 * @file channel.types.ts
 * @description Sales Channel types
 */

import type { BaseMasterData } from '@/shared/types/common-master.types';

export interface SalesChannelMaster extends BaseMasterData {
    id: number;
    channel_id: number;
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
