import type { BaseMasterData } from '@/shared/types/common-master.types';

/**
 * Currency - กำหนดรหัสสกุลเงิน
 */
export interface Currency extends BaseMasterData {
    currency_id: string; // uuid
    currency_code: string; // e.g., USD, THB
    name_th: string;
    name_en?: string;
    symbol?: string;
    exchange_round?: number; // Linked to rounding in exchange_rate
}

/**
 * ExchangeRateType - กำหนดรหัสประเภทอัตราแลกเปลี่ยน
 */
export interface ExchangeRateType extends BaseMasterData {
    currency_type_id: string; // uuid
    name_th: string;
    name_en?: string;
}

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
    allow_adjust: number; // float(8) - Adjustment limit?
    remark: string;
}

/**
 * Form Data equivalents for the above
 */
export interface CurrencyFormData {
    currencyCode: string;
    nameTh: string;
    nameEn?: string;
    symbol?: string;
    isActive: boolean;
}

export interface ExchangeRateTypeFormData {
    nameTh: string;
    nameEn?: string;
    isActive: boolean;
}

export interface ExchangeRateFormData {
    currencyId: string;
    currencyTypeId: string;
    buyRate: number;
    saleRate: number;
    rateDate: string;
    exchangeRound: number;
    allowAdjust: number;
    remark: string;
    isActive: boolean;
}
