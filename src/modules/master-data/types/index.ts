import type { LucideIcon } from 'lucide-react';

export type TabType = 'vendor' | 'item' | 'branch' | 'warehouse' | 'cost-center' | 'project';

export interface TabConfig {
    id: TabType;
    label: string;
    labelEn: string;
    icon: LucideIcon;
    recordCount: number;
    dbTable: string;
    relations: string[];
    fk: string;
}

export interface TabLabel {
    main: string;
    desc: string;
}
