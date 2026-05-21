import api from '@core/api/api';
import { logger } from '@utils';

export interface OptionValidationPayload {
    system_document_code: string;
    context: {
        system_document_code: string;
        item_id?: number | string | null;
        warehouse_id?: number | string | null;
        location_id?: number | string | null;
        uom_id?: number | string | null;
        qty?: number | string;
    };
}

export interface OptionValidationResponse {
    isValid: boolean;
    code?: string;
    message?: string;
    type?: 'error' | 'warning';
}

export const OptionService = {
    /**
     * ตรวจสอบเงื่อนไข IC Options (เช่น สต็อกติดลบ) ผ่าน Backend API
     */
    validate: async (payload: OptionValidationPayload): Promise<OptionValidationResponse> => {
        try {
            // Note: Depending on Axios setup, the prefix might already be '/api', 
            // so '/option/validate' will map to 'http://.../api/option/validate'
            const response = await api.post<OptionValidationResponse | unknown>('/option/validate', payload);
            
            // Handle successful 200 response that might contain validation details
            if (response && typeof response === 'object') {
                const resObj = response as Record<string, unknown>;
                const dataObj = ('data' in resObj && resObj.data) ? resObj.data as Record<string, unknown> : resObj;
                
                // Map Backend Response: { is_valid: boolean, errors: [], warnings: [] }
                if ('is_valid' in dataObj) {
                    const isValid = Boolean(dataObj.is_valid);
                    const errors = Array.isArray(dataObj.errors) ? dataObj.errors : [];
                    const warnings = Array.isArray(dataObj.warnings) ? dataObj.warnings : [];

                    if (!isValid) {
                        const firstErr = errors[0];
                        const msg = firstErr ? (typeof firstErr === 'string' ? firstErr : (firstErr.message || JSON.stringify(firstErr))) : 'ตรวจสอบเงื่อนไขสต็อกไม่ผ่าน (Backend ปฏิเสธ)';
                        return { isValid: false, type: 'error', message: msg };
                    }
                    
                    if (warnings.length > 0) {
                        const firstWarn = warnings[0];
                        const msg = firstWarn ? (typeof firstWarn === 'string' ? firstWarn : (firstWarn.message || JSON.stringify(firstWarn))) : 'สต็อกมีคำเตือน';
                        return { isValid: true, type: 'warning', message: msg };
                    }

                    return { isValid: true };
                }
                
                // Fallback mapping for old isValid format
                if ('isValid' in dataObj) {
                     return dataObj as unknown as OptionValidationResponse;
                }
            }

            return { isValid: true };
        } catch (error: unknown) {
            logger.error('Option Validation API Failed:', error);
            
            // Extract error from 400 Bad Request
            const err = error as { response?: { data?: Record<string, string> } };
            const errorData = err?.response?.data;
            if (errorData && typeof errorData === 'object') {
                return {
                    isValid: false,
                    type: (errorData.type as 'error' | 'warning') || 'error',
                    code: errorData.code || 'VALIDATION_FAILED',
                    message: errorData.message || errorData.error || 'ตรวจสอบเงื่อนไขสต็อกไม่ผ่าน'
                };
            }
            
            return {
                isValid: false,
                type: 'error',
                code: 'API_ERROR',
                message: 'ไม่สามารถติดต่อเซิร์ฟเวอร์เพื่อตรวจสอบสต็อกได้'
            };
        }
    }
};
