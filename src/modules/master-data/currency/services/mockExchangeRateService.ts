export type ExchangeRateType = string; // Used as Target Currency ID

export const MOCK_EXCHANGE_RATES: Record<string, number> = {
    USD: 34.50,
    EUR: 37.50,
    JPY: 0.23,
    GBP: 43.10,
    CNY: 4.85,
    THB: 1.00,
};

export const fetchExchangeRate = async (
    from: string, 
    to: string = 'THB'
): Promise<number> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const fromKey = from.toUpperCase();
    const toKey = to.toUpperCase();
    
    if (fromKey === toKey) return 1.00;

    const fromRate = MOCK_EXCHANGE_RATES[fromKey] || 1.00;
    const toRate = MOCK_EXCHANGE_RATES[toKey] || 1.00;

    // Logic: Source -> THB -> Target
    // If USD -> THB: return 34.50
    // If THB -> USD: return 1 / 34.50
    // If USD -> EUR: return 34.50 / 37.50
    return Number((fromRate / toRate).toFixed(6));
};
