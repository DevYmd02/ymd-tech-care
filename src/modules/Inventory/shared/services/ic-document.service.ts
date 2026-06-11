import api from '@/core/api/api';
import { logger } from '@/shared/utils';

export interface DocLinkOption {
    docu_type_id: string;
    docu_type_code: string;
    docu_name_th: string;
    docu_name_en: string;
    docu_item_no: number;
    stock_effect_ic?: number;
    [key: string]: unknown;
}

export const ICDocumentService = {
    /**
     * ดึงรายการเอกสาร (doc-link-ic) ตาม System Document Code
     * เช่น 'ISSUE_REQ', 'APPV_ISSUE', 'ISSUE_STOCK', 'TRANSFER'
     * 
     * @param systemDocCode รหัสระบบเอกสาร
     * @returns อาเรย์ของรายการเอกสารที่ถูกเรียงลำดับตาม doc_type_no แล้ว
     */
    getDocLinks: async (systemDocCode: string): Promise<DocLinkOption[]> => {
        try {
            const [sysDocs, docLinksRaw] = await Promise.all([
                api.get<unknown[]>('/system-document'),
                api.get<unknown[]>('/doc-link-ic')
            ]);

            const sysDocsList = Array.isArray(sysDocs) ? sysDocs : [];
            const docLinksList = Array.isArray(docLinksRaw) ? docLinksRaw : [];

            // Find system document by code
            const sysDoc = sysDocsList.find(
                (d) => (d as Record<string, unknown>).system_document_code?.toString().trim().toUpperCase() === systemDocCode.trim().toUpperCase()
            ) as Record<string, unknown> | undefined;
            if (!sysDoc) return [];

            // Filter doc-link-ic belonging to system document
            const relatedDocs = docLinksList.filter(
                (item) => Number((item as Record<string, unknown>).system_document_id) === Number(sysDoc.system_document_id) && (item as Record<string, unknown>).is_active !== false
            ) as Record<string, unknown>[];

            // Sort by doc_type_no
            const sortedDocs = [...relatedDocs].sort((a, b) => Number(a.doc_type_no || 0) - Number(b.doc_type_no || 0));

            return sortedDocs.map((item) => {
                const name = (item.doc_type_name || item.docu_name_th || item.docu_desc || item.docu_name_en || '') as string;
                return {
                    docu_type_id: String(item.doc_link_ic_id ?? item.docu_type_id),
                    docu_type_code: '',
                    docu_name_th: name,
                    docu_name_en: (item.docu_name_en as string) || name,
                    docu_item_no: Number(item.doc_type_no || 0),
                    stock_effect_ic: Number(item.stock_effect_ic ?? -1),
                };
            });
        } catch (error) {
            logger.error(`[ICDocumentService] getDocLinks error for ${systemDocCode}:`, error);
            return [];
        }
    },
};
