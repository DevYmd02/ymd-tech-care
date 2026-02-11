import { z } from 'zod';
import type { BaseMasterData } from '@/shared/types/common-master.types';

/**
 * Currency - กำหนดรหัสสกุลเงิน
 */
export interface Currency extends BaseMasterData {
    currency_id: string; // uuid
    currency_code: string; // e.g., USD, THB
    name_th: string;
    name_en: string; // Primary screenshot requires EN name
    is_active: boolean;
}

export const currencySchema = z.object({
    currencyCode: z.string()
        .min(1, 'กรุณากรอกรหัสสกุลเงิน')
        .length(3, 'รหัสสกุลเงินต้องมี 3 ตัวอักษร'),
    nameTh: z.string()
        .min(1, 'กรุณากรอกชื่อสกุลเงิน (ไทย)')
        .max(50, 'ชื่อสกุลเงิน (ไทย) ต้องไม่เกิน 50 ตัวอักษร'),
    nameEn: z.string()
        .min(1, 'กรุณากรอกชื่อสกุลเงิน (EN)')
        .max(25, 'ชื่อสกุลเงิน (EN) ต้องไม่เกิน 25 ตัวอักษร'),
    isActive: z.boolean(),
});

export type CurrencyFormValues = z.infer<typeof currencySchema>;

/**
 * ExchangeRateType - กำหนดรหัสประเภทอัตราแลกเปลี่ยน
 */
export interface ExchangeRateType extends BaseMasterData {
    currency_type_id: string; // uuid
    code: string; // e.g., SPOT, FORWARD
    name_th: string;
    name_en: string;
    is_active: boolean;
}

export const exchangeRateTypeSchema = z.object({
    code: z.string()
        .min(1, 'กรุณากรอกรหัสประเภทอัตราแลกเปลี่ยน')
        .max(30, 'รหัสต้องไม่เกิน 30 ตัวอักษร'),
    nameTh: z.string()
        .min(1, 'กรุณากรอกชื่อประเภท (ไทย)')
        .max(200, 'ชื่อต้องไม่เกิน 200 ตัวอักษร'),
    nameEn: z.string()
        .min(1, 'กรุณากรอกชื่อประเภท (EN)')
        .max(200, 'ชื่อต้องไม่เกิน 200 ตัวอักษร'),
    isActive: z.boolean(),
});

export type ExchangeRateTypeFormValues = z.infer<typeof exchangeRateTypeSchema>;

/**
 * ExchangeRate - กำหนดอัตราแลกเปลี่ยนเงินตรา
 */
export interface ExchangeRate extends BaseMasterData {
    exchange_id: string; // PK
    currency_id: string; // FK -> Currency
    currency_type_id: string; // FK -> ExchangeRateType
    buy_rate: number;
    sale_rate: number;
    rate_date: string; // datetime string
    exchange_round: number; // smallint(2)
    allow_adjust: number; // float(8)
    remark?: string;
    is_active: boolean;
}

export const exchangeRateSchema = z.object({
    currencyId: z.string().min(1, 'กรุณาเลือกสกุลเงิน'),
    currencyTypeId: z.string().min(1, 'กรุณาเลือกประเภทอัตราแลกเปลี่ยน'),
    rateDate: z.string().min(1, 'กรุณาเลือกวันที่อัตรา'),
    buyRate: z.number().min(0, 'อัตราซื้อต้องไม่ติดลบ'),
    saleRate: z.number().min(0, 'อัตราขายต้องไม่ติดลบ'),
    allowAdjust: z.number().min(0, 'อนุญาตปรับต้องไม่ติดลบ'),
    exchangeRound: z.number().min(2).max(6), // Decimal places select
    remark: z.string().max(255).optional(),
    isActive: z.boolean(),
});

export type ExchangeRateFormValues = z.infer<typeof exchangeRateSchema>;
