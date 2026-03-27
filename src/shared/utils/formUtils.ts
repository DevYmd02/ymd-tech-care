import React from 'react';
import type { FieldErrors, FieldValues } from 'react-hook-form';
import { logger } from '@/shared/utils/logger';

/**
 * Recursive extractor for react-hook-form errors.
 * Flattens nested error objects into distinct error messages.
 */
export const extractErrorMessages = (errs: FieldErrors<FieldValues> | Record<string, unknown>): string[] => {
  let messages: string[] = [];
  for (const key in errs) {
    const error = errs[key];
    if (typeof error === 'object' && error !== null) {
      if ('message' in error && typeof (error as { message: unknown }).message === 'string') {
        let msg = (error as { message: string }).message;
        const lowerMsg = msg.toLowerCase();
        // Standardize common Zod/HookForm error messages
        if (lowerMsg.includes('invalid input') || lowerMsg.includes('expected number') || lowerMsg.includes('received string') || lowerMsg.includes('received nan')) {
          msg = 'กรุณาระบุข้อมูลให้ถูกต้อง';
        }
        messages.push(msg);
      } else {
        messages = messages.concat(extractErrorMessages(error as Record<string, unknown>));
      }
    }
  }
  return Array.from(new Set(messages));
};

/**
 * Component for displaying form errors in a Toast.
 */
export const ErrorToastUI = (errorMessages: string[]) => {
  return React.createElement('div', { className: 'flex flex-col gap-1' },
    React.createElement('span', { className: 'font-semibold text-sm' }, 'ตรวจสอบข้อมูลไม่ผ่าน:'),
    React.createElement('ul', { className: 'list-disc pl-4 text-xs' },
      errorMessages.map((msg: string, i: number) => React.createElement('li', { key: i }, msg))
    )
  );
};

/**
 * Standard Form Error Handler for react-hook-form.
 */
export const handleFormErrorWithToast = (errors: FieldErrors<FieldValues>, toast: any) => {
    logger.error('Form Validation Errors:', errors);
    const errorMessages = extractErrorMessages(errors);
    
    if (errorMessages.length > 0) {
      toast(ErrorToastUI(errorMessages), 'error');
    } else {
      toast('กรุณาตรวจสอบข้อมูลให้ถูกต้อง', 'error');
    }
};
