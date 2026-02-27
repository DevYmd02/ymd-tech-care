/**
 * @file MultiEmailInput.tsx
 * @description A reusable "chip/tag" input for managing multiple email addresses.
 * - Chips are created when the user types an email and presses Enter, Space, or ,
 * - Invalid emails are rejected with a red-flash animation (no chip formed)
 * - Each chip has an × remove button (Lucide X)
 * - Fully dark-mode aware, matches the project design system
 */

import React, { useState, useRef, useCallback } from 'react';
import type { KeyboardEvent } from 'react';
import { X, Mail } from 'lucide-react';

// ====================================================================================
// TYPES
// ====================================================================================

interface MultiEmailInputProps {
    /** The current list of confirmed email chips */
    value: string[];
    /** Called when the list changes (chip added or removed) */
    onChange: (emails: string[]) => void;
    /** Placeholder text shown when there are no chips and no draft */
    placeholder?: string;
    /** Whether the entire input should be non-interactive */
    disabled?: boolean;
    /** Optional extra class on the outer wrapper */
    className?: string;
}

// ====================================================================================
// HELPERS
// ====================================================================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidEmail = (email: string): boolean => EMAIL_REGEX.test(email.trim());

// ====================================================================================
// COMPONENT
// ====================================================================================

export const MultiEmailInput: React.FC<MultiEmailInputProps> = ({
    value,
    onChange,
    placeholder = 'พิมพ์อีเมล แล้วกด Enter หรือ ,',
    disabled = false,
    className = '',
}) => {
    const [draft, setDraft] = useState('');
    const [isInvalid, setIsInvalid] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Attempt to commit the current draft as a chip
    const commitDraft = useCallback(() => {
        const trimmed = draft.trim().replace(/,$/,'');
        if (!trimmed) return;

        if (!isValidEmail(trimmed)) {
            // Trigger red-flash animation then reset
            setIsInvalid(true);
            setTimeout(() => setIsInvalid(false), 500);
            return;
        }

        // Avoid exact duplicates (case-insensitive)
        const lower = trimmed.toLowerCase();
        if (value.some(e => e.toLowerCase() === lower)) {
            setDraft('');
            return;
        }

        onChange([...value, trimmed]);
        setDraft('');
    }, [draft, value, onChange]);

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === ',') {
            e.preventDefault();
            commitDraft();
        } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
            // Remove last chip on backspace when draft is empty
            onChange(value.slice(0, -1));
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        // Auto-commit if the user pastes an email ending with comma/space
        if (raw.endsWith(',') || raw.endsWith(' ')) {
            setDraft(raw);
            setTimeout(commitDraft, 0);
        } else {
            setDraft(raw);
            if (isInvalid) setIsInvalid(false);
        }
    };

    const handleBlur = () => {
        // Commit on blur so clicking away with a valid draft doesn't lose it
        commitDraft();
    };

    const handleRemove = (index: number) => {
        onChange(value.filter((_, i) => i !== index));
    };

    const handleWrapperClick = () => {
        inputRef.current?.focus();
    };

    const showPlaceholder = value.length === 0 && draft === '';

    return (
        <div
            onClick={handleWrapperClick}
            className={[
                // Base container — looks like an input field
                'flex flex-wrap gap-1.5 min-h-[40px] w-full px-2.5 py-2',
                'bg-white dark:bg-gray-700/50',
                'border rounded-lg',
                'transition-colors duration-150 cursor-text',
                // Border color: invalid draft = red, focused = emerald, normal = gray
                isInvalid
                    ? 'border-red-400 dark:border-red-500 ring-1 ring-red-400 dark:ring-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus-within:border-emerald-500 dark:focus-within:border-emerald-400 focus-within:ring-1 focus-within:ring-emerald-500 dark:focus-within:ring-emerald-400',
                disabled ? 'opacity-60 cursor-not-allowed pointer-events-none bg-gray-100 dark:bg-gray-800' : '',
                className,
            ].join(' ')}
        >
            {/* ===== CHIPS ===== */}
            {value.map((email, index) => (
                <span
                    key={`${email}-${index}`}
                    className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-md text-xs font-medium
                        bg-emerald-100 dark:bg-emerald-800/40
                        text-emerald-800 dark:text-emerald-200
                        border border-emerald-200 dark:border-emerald-700
                        max-w-full"
                >
                    <Mail size={10} className="shrink-0 opacity-70" />
                    <span className="truncate max-w-[200px]">{email}</span>
                    {!disabled && (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleRemove(index); }}
                            className="shrink-0 ml-0.5 rounded-sm p-0.5
                                text-emerald-600 dark:text-emerald-300
                                hover:text-white hover:bg-emerald-500 dark:hover:bg-emerald-600
                                transition-colors"
                            title={`ลบ ${email}`}
                            aria-label={`Remove ${email}`}
                        >
                            <X size={10} />
                        </button>
                    )}
                </span>
            ))}

            {/* ===== DRAFT INPUT ===== */}
            <input
                ref={inputRef}
                type="text"
                value={draft}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                disabled={disabled}
                placeholder={showPlaceholder ? placeholder : ''}
                className={[
                    'flex-1 min-w-[180px] h-6 bg-transparent outline-none',
                    'text-sm text-gray-900 dark:text-gray-100',
                    'placeholder-gray-400 dark:placeholder-gray-500',
                    // Red text on invalid draft
                    isInvalid ? 'text-red-500 dark:text-red-400' : '',
                ].join(' ')}
            />

            {/* ===== INVALID HINT ===== */}
            {isInvalid && (
                <span className="w-full text-xs text-red-500 dark:text-red-400 mt-0.5 pl-0.5 select-none">
                    รูปแบบอีเมลไม่ถูกต้อง
                </span>
            )}
        </div>
    );
};