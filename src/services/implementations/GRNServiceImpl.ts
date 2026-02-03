import api, { extractErrorMessage } from '../../services/api'; 
import { logger } from '@utils/logger';
import type { IGRNService } from '../interfaces/IGRNService';
import type { GRNListParams, GRNListResponse, GRNListItem, GRNSummaryCounts, CreateGRNPayload } from '@/types/grn-types';

export class GRNServiceImpl implements IGRNService {
    private readonly BASE_URL = '/procurement/grn';

    async getList(params?: GRNListParams): Promise<GRNListResponse> {
        try {
            const response = await api.get(`${this.BASE_URL}`, { params });
            return response.data;
        } catch (error) {
            logger.error('GRNService.getList error:', extractErrorMessage(error));
            throw error;
        }
    }

    async getById(id: string): Promise<GRNListItem | null> {
        try {
            const response = await api.get(`${this.BASE_URL}/${id}`);
            return response.data;
        } catch (error) {
            logger.error(`GRNService.getById(${id}) error:`, extractErrorMessage(error));
            throw error;
        }
    }

    async getSummaryCounts(): Promise<GRNSummaryCounts> {
        try {
            const response = await api.get(`${this.BASE_URL}/summary-status`);
            return response.data;
        } catch (error) {
            logger.error('GRNService.getSummaryCounts error:', extractErrorMessage(error));
            // Return default 0s on error to prevent UI crash
            return { DRAFT: 0, POSTED: 0, REVERSED: 0, RETURNED: 0 };
        }
    }

    async create(data: CreateGRNPayload): Promise<void> {
        try {
            await api.post(this.BASE_URL, data);
        } catch (error) {
            logger.error('GRNService.create error:', extractErrorMessage(error));
            throw error;
        }
    }
}
