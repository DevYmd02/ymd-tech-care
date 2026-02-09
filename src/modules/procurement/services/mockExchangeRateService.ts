export const fetchExchangeRate = async (currency: string): Promise<number> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    switch (currency) {
        case 'USD': return 34.50;
        case 'EUR': return 37.80;
        case 'JPY': return 0.23;
        case 'CNY': return 4.80;
        case 'THB': return 1.00;
        default: return 1.00;
    }
};
