/**
 * @file job.types.ts
 * @description Job (งาน) master data types
 */

import type { BaseMasterData } from '@/shared/types/common-master.types';

export interface JobMaster extends BaseMasterData {
    id: number;
    job_id: number;
    job_code: string;
    job_name: string;
}

export interface JobFormData {
    jobCode: string;
    jobName: string;
    isActive: boolean;
}

export type JobListItem = JobMaster;
