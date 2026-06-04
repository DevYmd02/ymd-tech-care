import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '@/core/api/api';
import { ReservationService } from '@/modules/sales/reservation/services/reservation.service';
import type { ReservationFormData } from '@/modules/sales/reservation/types/reservation.types';

const createMockReservationFormData = (
  overrides: Partial<ReservationFormData> = {}
): ReservationFormData => {
  const defaults: ReservationFormData = {
    reservation_id: null,
    version: null,
    reservation_no: '',
    reservation_date: new Date().toISOString().split('T')[0],
    lead_id: null,
    customer_id: '',
    branch_id: '',
    sq_id: null,
    sq_no: null,
    aq_id: null,
    aq_no: null,
    so_id: null,
    so_no: null,
    currency_code: 'THB',
    isMulticurrency: false,
    base_currency_code: 'THB',
    quote_currency_code: 'THB',
    exchange_rate: 1,
    exchange_rate_date: new Date().toISOString().split('T')[0],
    ship_days: 0,
    status: 'DRAFT',
    remarks: '',
    payment_term_days: 0,
    sub_total: 0,
    discount_input: '',
    discount_amount: 0,
    vat_amount: 0,
    total_amount: 0,
    onhold: 'N',
    tax_code_id: null,
    item_id: null,
    sale_area_id: '',
    emp_sale_id: '',
    emp_dept_id: '',
    job_id: null,
    status_remark: '',
    lines: [],
  };

  return {
    ...defaults,
    ...overrides,
  };
};


// Mock the API Client
vi.mock('@/core/api/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('ReservationService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('getList', () => {
    it('should fetch reservations list with params', async () => {
      const mockList = [
        { reservation_id: 1, reservation_no: 'RES-01', status: 'DRAFT' }
      ];
      vi.mocked(api.get).mockResolvedValue(mockList);

      const params = { reservation_no: 'RES-01', limit: 10 };
      const result = await ReservationService.getList(params);

      expect(api.get).toHaveBeenCalledWith('/sale-reservation', { params });
      expect(result.data).toEqual(mockList);
      expect(result.total).toEqual(1);
    });
  });

  describe('sanitizeData', () => {
    const mockFormData = createMockReservationFormData({
      reservation_date: '2026-05-20',
      sq_id: '12',
      aq_id: '34',
      customer_id: '56',
      branch_id: '1',
      status: 'DRAFT',
      ship_days: 7,
      remarks: 'Test sanitization',
      payment_term_days: 30,
      onhold: 'N',
      emp_sale_id: '7',
      sale_area_id: '3',
      emp_dept_id: '2',
      job_id: '9', // maps to project_id
      status_remark: '',
      currency_code: 'THB',
      exchange_rate: 1,
      exchange_rate_date: '2026-05-20',
      tax_code_id: 1,
      discount_input: '5%',
      lines: [
        {
          id: '1',
          item_id: '101',
          warehouse_id: '10',
          location_id: '20',
          lot_id: 5,
          lot_no: 'LOT-999',
          lot_balance_id: 5,
          note: 'Line note',
          qty_reserved: 5,
          uom_id: '2',
          unit_price: 100,
          line_discount_input: '10%',
          line_discount: 50,
          line_total: 450
        }
      ]
    });

    it('should sanitize data correctly in create mode (isUpdate = false)', () => {
      const sanitized = ReservationService.sanitizeData(mockFormData, false);
      
      expect(sanitized.reservation_date).toBe(new Date(2026, 4, 20).toISOString());
      expect(sanitized.sq_id).toBe(12);
      expect(sanitized.aq_id).toBe(34);
      expect(sanitized.customer_id).toBe(56);
      expect(sanitized.branch_id).toBe(1);
      expect(sanitized.project_id).toBe(9); // job_id mapped to project_id
      
      expect(sanitized['saleReservationLines']).toHaveLength(1);
      const linesList = sanitized['saleReservationLines'] as Array<Record<string, unknown>>;
      const line = linesList[0];
      expect(line.item_id).toBe(101);
      expect(line.qty).toBe(5);
      expect(line.discount_expression).toBe('10%');
      expect(line.reservation_line_id).toBeUndefined(); // Should not have line ID in create mode
    });

    it('should preserve line IDs in update mode (isUpdate = true)', () => {
      const sanitized = ReservationService.sanitizeData(mockFormData, true);
      
      expect(sanitized['saleReservationLines']).toHaveLength(1);
      const linesList = sanitized['saleReservationLines'] as Array<Record<string, unknown>>;
      const line = linesList[0];
      expect(line.reservation_line_id).toBe(1); // Should preserve line ID as number
    });
  });

  describe('getById', () => {
    it('should fetch reservation, resolve SQ/AQ references, and enrich lines with batch master data', async () => {
      const mockRawReservation = {
        reservation_id: 1001,
        reservation_no: 'RES-2026-001',
        reservation_date: '2026-05-20T00:00:00.000Z',
        customer_id: 50,
        sq_id: 2001, // sq_no is missing, triggers lookup
        aq_id: 3001, // aq_no is missing, triggers lookup
        quote_currency_code: 'USD',
        base_currency_code: 'THB',
        exchange_rate: 35.5,
        lines: [
          {
            reservation_line_id: 88,
            item_id: 101,
            qty: 10,
            uom_id: 1,
            warehouse_id: 2,
            location_id: 3,
            lot_id: 5
          }
        ]
      };

      vi.mocked(api.get).mockImplementation((url) => {
        if (url === '/sale-reservation/1001') {
          return Promise.resolve(mockRawReservation);
        }
        if (url === '/sale-quotation/2001') {
          return Promise.resolve({
            data: { sq_no: 'SQ-2026-005' }
          });
        }
        if (url === '/sale-reservation/available-approvals') {
          return Promise.resolve([
            {
              aq_id: 3001,
              aq_no: 'AQ-2026-007',
              sq_id: 2001
            }
          ]);
        }
        if (url === '/item-master') {
          return Promise.resolve([
            {
              item_id: 101,
              item_code: 'ITEM-101',
              item_name: 'Premium Widget'
            }
          ]);
        }
        if (url === '/item-lot') {
          return Promise.resolve([
            {
              lot_id: 5,
              lot_no: 'LOT-999'
            }
          ]);
        }
        return Promise.resolve(null);
      });

      const result = await ReservationService.getById('1001');

      expect(result).not.toBeNull();
      expect(result?.reservation_no).toBe('RES-2026-001');
      expect(result?.reservation_date).toBe('2026-05-20'); // Formatted to YYYY-MM-DD
      
      // Discovery verification
      expect(result?.sq_no).toBe('SQ-2026-005');
      expect(result?.aq_no).toBe('AQ-2026-007');
      expect(result?.isMulticurrency).toBe(true); // USD !== THB
      
      // Lines Enrichment verification
      expect(result?.lines).toHaveLength(1);
      const line = result?.lines[0];
      expect(line?.item_code).toBe('ITEM-101');
      expect(line?.item_name).toBe('Premium Widget');
      expect(line?.lot_no).toBe('LOT-999');
    });
  });

  describe('create', () => {
    it('should post sanitized data to /sale-reservation', async () => {
      const mockPayload = createMockReservationFormData({
        reservation_date: '2026-05-20',
        customer_id: '50',
        branch_id: '1',
        currency_code: 'THB',
        emp_dept_id: '2',
        lines: []
      });
      const mockResponse: { id: number } = { id: 1001 };
      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await ReservationService.create(mockPayload);

      expect(api.post).toHaveBeenCalledWith('/sale-reservation', expect.objectContaining({
        reservation_date: expect.any(String),
        customer_id: 50
      }));
      expect(result).toEqual({ success: true, data: mockResponse });
    });
  });

  describe('update', () => {
    it('should patch sanitized data to /sale-reservation/:id', async () => {
      const mockPayload = createMockReservationFormData({
        reservation_date: '2026-05-20',
        customer_id: '50',
        branch_id: '1',
        currency_code: 'THB',
        emp_dept_id: '2',
        lines: []
      });
      const mockResponse: { success: boolean } = { success: true };
      vi.mocked(api.patch).mockResolvedValue(mockResponse);

      const result = await ReservationService.update('1001', mockPayload);

      expect(api.patch).toHaveBeenCalledWith('/sale-reservation/1001', expect.objectContaining({
        customer_id: 50
      }));
      expect(result).toEqual({ success: true, data: mockResponse });
    });
  });

  describe('delete', () => {
    it('should call delete endpoint and return success', async () => {
      vi.mocked(api.delete).mockResolvedValue({ success: true });

      const result = await ReservationService.delete('1001');

      expect(api.delete).toHaveBeenCalledWith('/sale-reservation/1001');
      expect(result).toEqual({ success: true });
    });
  });

  describe('confirm', () => {
    it('should successfully confirm draft reservation', async () => {
      const mockCurrentDraft = createMockReservationFormData({
        reservation_date: '2026-05-20',
        customer_id: '50',
        branch_id: '1',
        currency_code: 'THB',
        emp_dept_id: '2',
        reservation_id: '1001',
        status: 'DRAFT',
        reservation_no: 'RES-2026-001',
        lines: []
      });

      // Mock getById and update spy
      const getByIdSpy = vi.spyOn(ReservationService, 'getById').mockResolvedValue(mockCurrentDraft);
      const updateSpy = vi.spyOn(ReservationService, 'update').mockResolvedValue({ success: true, data: {} });

      const result = await ReservationService.confirm('1001');

      expect(getByIdSpy).toHaveBeenCalledWith('1001');
      expect(updateSpy).toHaveBeenCalledWith('1001', expect.objectContaining({
        status: 'CONFIRMED'
      }));
      expect(result?.success).toBe(true);
    });

    it('should throw error when confirming non-draft reservation', async () => {
      const mockCurrentConfirmed = createMockReservationFormData({
        reservation_date: '2026-05-20',
        customer_id: '50',
        branch_id: '1',
        currency_code: 'THB',
        emp_dept_id: '2',
        reservation_id: '1001',
        status: 'CONFIRMED',
        reservation_no: 'RES-2026-001',
        lines: []
      });

      vi.spyOn(ReservationService, 'getById').mockResolvedValue(mockCurrentConfirmed);

      await expect(ReservationService.confirm('1001')).rejects.toThrow('ไม่สามารถยืนยันเอกสารได้เนื่องจากเอกสารอยู่ในสถานะ CONFIRMED');
    });
  });
});
