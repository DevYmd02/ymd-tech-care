/**
 * @file dateUtils.test.ts
 * @description Unit tests for dateUtils
 */

import { describe, it, expect } from 'vitest';
import { formatThaiDate, formatThaiDateFull, formatDateTime } from '../dateUtils';

describe('dateUtils', () => {
    describe('formatThaiDate', () => {
        it('should format ISO date to Thai short date correctly', () => {
            const input = '2026-01-15';
            const expected = '15 ม.ค. 2569';
            expect(formatThaiDate(input)).toBe(expected);
        });

        it('should handle different months correctly', () => {
            const input = '2026-12-31';
            const expected = '31 ธ.ค. 2569';
            expect(formatThaiDate(input)).toBe(expected);
        });
    });

    describe('formatThaiDateFull', () => {
        it('should format ISO date to Thai full date correctly', () => {
            const input = '2026-01-15';
            const expected = '15 มกราคม 2569';
            expect(formatThaiDateFull(input)).toBe(expected);
        });
    });

    describe('formatDateTime', () => {
        it('should format datetime string to short format with time', () => {
            const input = '2026-01-15 14:30';
            const expected = '15 ม.ค. 14:30';
            expect(formatDateTime(input)).toBe(expected);
        });
    });
});
