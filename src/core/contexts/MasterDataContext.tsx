import { createContext, useContext } from 'react';

/**
 * @file MasterDataContext.tsx
 * @description Context and Hook definition for Master Data to satisfy Fast Refresh rules.
 */

export interface MasterDataContextType {
    units: Record<string, unknown>[];
    branches: Record<string, unknown>[];
    warehouses: Record<string, unknown>[];
    isLoading: boolean;
    refetchAll: () => void;
}

export const MasterDataContext = createContext<MasterDataContextType | undefined>(undefined);

export function useMasterData() {
    const context = useContext(MasterDataContext);
    if (context === undefined) {
        throw new Error('useMasterData must be used within a MasterDataProvider');
    }
    return context;
}
