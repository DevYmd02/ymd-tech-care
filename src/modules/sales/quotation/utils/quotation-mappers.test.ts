import { describe, it, expect } from 'vitest';
import { mapQuotationFormToDTO } from './quotation-mappers';
import type { QuotationFormValues } from '../schemas/quotation-schemas';

describe('Quotation Mappers', () => {
    describe('mapQuotationFormToDTO', () => {
        const mockFormValues: QuotationFormValues = {
            sq_id: '100',
            sq_no: 'SQ2024-001',
            sq_date: '2024-05-13',
            customer_id: 10,
            branch_id: 1,
            currency_code: 'THB',
            isMulticurrency: false,
            base_currency_code: 'THB',
            quote_currency_code: 'THB',
            exchange_rate: 1,
            exchange_rate_date: '2024-05-13',
            status: 'PENDING',
            valid_until: '2024-06-13',
            remarks: 'Test SQ',
            payment_term_days: 30,
            onhold: 'N',
            tax_code_id: 1,
            sale_area_id: 2,
            emp_sale_id: 12,
            emp_dept_id: 5,
            project_id: 8,
            lead_id: null,
            item_id: null,
            sub_total: 1000,
            discount_expression: '10%',
            discount_amount: 100,
            vat_amount: 63,
            total_amount: 963,
            lines: [
                {
                    sq_line_id: '500',
                    item_id: 200,
                    item_code: 'P001',
                    item_name: 'Product 1',
                    qty: 10,
                    uom_id: 2,
                    unit_price: 100,
                    discount_expression: '5%',
                    line_discount: 50,
                    line_total: 950,
                    note: 'Line note',
                    tax_code_id: 1
                }
            ]
        };

        it('should map header fields correctly', () => {
            const dto = mapQuotationFormToDTO(mockFormValues) as Record<string, unknown>;
            
            expect(dto.status).toBe('PENDING');
            expect(dto.customer_id).toBe(10);
            expect(dto.branch_id).toBe(1);
            expect(dto.remarks).toBe('Test SQ');
            expect(dto.payment_term_days).toBe(30);
            expect(dto.discount_expression).toBe('10%');
        });

        it('should map organization fields correctly', () => {
            const dto = mapQuotationFormToDTO(mockFormValues) as Record<string, unknown>;
            
            expect(dto.emp_sale_id).toBe(12);
            expect(dto.emp_dept_id).toBe(5);
            expect(dto.sale_area_id).toBe(2);
            expect(dto.project_id).toBe(8);
        });

        it('should format dates to ISO string', () => {
            const dto = mapQuotationFormToDTO(mockFormValues) as Record<string, unknown>;
            
            expect(dto.sq_date).toContain('2024-05-13T');
            expect(dto.valid_until).toContain('2024-06-13T');
        });

        it('should map lines correctly', () => {
            const dto = mapQuotationFormToDTO(mockFormValues) as Record<string, unknown>;
            const sq_lines = dto.sq_lines as Record<string, unknown>[];
            
            expect(sq_lines).toHaveLength(1);
            const line = sq_lines[0];
            
            expect(line.item_id).toBe(200);
            expect(line.qty).toBe(10);
            expect(line.uom_id).toBe(2);
            expect(line.unit_price).toBe(100);
            expect(line.discount_expression).toBe('5%');
            expect(line.tax_code_id).toBe(1);
        });

        it('should handle missing optional header fields gracefully', () => {
            const minimalForm: QuotationFormValues = {
                ...mockFormValues,
                remarks: '',
                payment_term_days: 0,
                valid_until: undefined
            };
            const dto = mapQuotationFormToDTO(minimalForm) as Record<string, unknown>;
            
            expect(dto.remarks).toBeUndefined();
            expect(dto.payment_term_days).toBe(0);
            expect(dto.valid_until).toBeUndefined();
        });

        it('should sanitize payload according to KNOWN_SQ_DTO_FIELDS', () => {
            const extendedForm = { 
                ...mockFormValues, 
                extra_junk: 'trash' 
            };
            const dto = mapQuotationFormToDTO(extendedForm as unknown as QuotationFormValues) as Record<string, unknown>;
            expect(dto.extra_junk).toBeUndefined();
        });
    });
});
