/**
 * @file channel.types.ts
 * @description Sales Channel types
 */

import type { BaseMasterData } from '@/shared/types/common-master.types';

export interface SalesChannelMaster extends BaseMasterData {
    channel_id: string; // UUID
    channel_code: string;
    channel_name: string;
    channel_nameeng: string;
    is_active: boolean;
}

export interface SalesChannelFormData {
    channelCode: string;
    channelName: string;
    channelNameEn: string;
    isActive: boolean;
}

export type SalesChannelListItem = SalesChannelMaster;
