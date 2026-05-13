import { describe, it, expect } from 'vitest';
import { mapSalesOrderFormToDTO } from './sales-order-mappers';
import type { SalesOrderFormValues } from '../schemas/sales-order.schemas';

describe('Sales Order Mappers', () => {
    describe('mapSalesOrderFormToDTO', () => {
        const mockFormValues: SalesOrderFormValues = {
            so_id: '100',
            so_no: 'SO2024-001',
            so_date: '2024-05-13',
            customer_id: '10',
            branch_id: '1',
            currency_code: 'USD',
            isMulticurrency: true,
            base_currency_code: 'USD',
            quote_currency_code: 'THB',
            exchange_rate: 35.5,
            exchange_rate_date: '2024-05-13',
            ship_days: 7,
            status: 'PENDING',
            remarks: 'Test SO',
            payment_term_days: 30,
            sub_total: 1000,
            discount_input: '10%',
            discount_amount: 100,
            vat_amount: 63,
            total_amount: 963,
            onhold: 'N',
            tax_code_id: 1,
            emp_dept_id: '5',
            emp_sale_id: '12',
            emp_area_id: '3',
            job_id: '8',
            ship_date: '2024-05-20',
            lines: [
                {
                    so_line_id: '500',
                    item_id: '200',
                    item_code: 'P001',
                    item_name: 'Product 1',
                    qty_ordered: 10,
                    uom_id: '2',
                    warehouse_id: '1',
                    location_id: '1',
                    unit_price: 100,
                    line_discount_input: '5%',
                    line_discount: 50,
                    line_total: 950,
                    note: 'Line note',
                    tax_code_id: 1
                }
            ]
        };

        it('should map basic header fields correctly', () => {
            const dto = mapSalesOrderFormToDTO(mockFormValues) as Record<string, unknown>;
            
            expect(dto.status).toBe('PENDING');
            expect(dto.customer_id).toBe(10);
            expect(dto.branch_id).toBe(1);
            expect(dto.exchange_rate).toBe(35.5);
            expect(dto.payment_term_days).toBe(30);
            expect(dto.onhold).toBe('N');
            expect(dto.remarks).toBe('Test SO');
            expect(dto.discount_expression).toBe('10%');
        });

        it('should map organization fields correctly (IDs must be numbers)', () => {
            const dto = mapSalesOrderFormToDTO(mockFormValues) as Record<string, unknown>;
            
            expect(dto.emp_sale_id).toBe(12);
            expect(dto.emp_dept_id).toBe(5);
            expect(dto.sale_area_id).toBe(3);
            expect(dto.project_id).toBe(8);
        });

        it('should format dates to ISO string', () => {
            const dto = mapSalesOrderFormToDTO(mockFormValues) as Record<string, unknown>;
            
            expect(dto.so_date).toContain('2024-05-13T');
            expect(dto.ship_date).toContain('2024-05-20T');
        });

        it('should map lines correctly', () => {
            const dto = mapSalesOrderFormToDTO(mockFormValues) as Record<string, unknown>;
            const lines = dto.saleOrderLines as Record<string, unknown>[];
            
            expect(lines).toHaveLength(1);
            const line = lines[0];
            
            expect(line.item_id).toBe(200);
            expect(line.qty).toBe(10);
            expect(line.uom_id).toBe(2);
            expect(line.unit_price).toBe(100);
            expect(line.net_amount).toBe(950);
            expect(line.discount_expression).toBe('5%');
            expect(line.warehouse_id).toBe(1);
            expect(line.location_id).toBe(1);
        });

        it('should include so_line_id only when isUpdate is true', () => {
            const createDto = mapSalesOrderFormToDTO(mockFormValues, false) as Record<string, unknown>;
            const createLines = createDto.saleOrderLines as Record<string, unknown>[];
            expect(createLines[0].so_line_id).toBeUndefined();

            const updateDto = mapSalesOrderFormToDTO(mockFormValues, true) as Record<string, unknown>;
            const updateLines = updateDto.saleOrderLines as Record<string, unknown>[];
            expect(updateLines[0].so_line_id).toBe(500);
        });

        it('should sanitize payload according to KNOWN_SO_DTO_FIELDS', () => {
            const extendedForm = { 
                ...mockFormValues, 
                unknown_field: 'should be removed' 
            };
            const dto = mapSalesOrderFormToDTO(extendedForm as unknown as SalesOrderFormValues) as Record<string, unknown>;
            expect(dto.unknown_field).toBeUndefined();
        });
    });
});
