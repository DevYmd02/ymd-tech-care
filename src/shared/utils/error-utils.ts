import React from 'react';
import toast from 'react-hot-toast';
import axios, { AxiosError } from 'axios';
import type { FieldErrors, FieldValues } from 'react-hook-form';
import { logger } from './common-utils';

/**
 * @file error-utils.ts
 * @description Centralized error handling for API and Forms.
 */

// 1. API Error Handling
export interface ApiErrorResponse {
  message: string | string[];
  error?: string;
  statusCode?: number;
}

export const handleError = (error: unknown, context: string = 'Operation') => {
  logger.error(`❌ [${context}] Failed:`, error);
  const message = extractErrorMessage(error);
  toast.error(message);
};

const extractErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') return error;
  
  if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const data = axiosError.response?.data;
      
      if (data && isApiErrorResponse(data)) {
          return Array.isArray(data.message) ? data.message.join(', ') : data.message;
      }
      if (axiosError.message) return axiosError.message;
  }

  if (error instanceof Error) return error.message;
  
  return 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ กรุณาลองใหม่อีกครั้ง';
};

function isApiErrorResponse(data: unknown): data is ApiErrorResponse {
    return (
        typeof data === 'object' &&
        data !== null &&
        'message' in data &&
        (typeof (data as Record<string, unknown>).message === 'string' || Array.isArray((data as Record<string, unknown>).message))
    );
}

// 2. Form Error Handling (React Hook Form)
export const extractFormErrorMessages = (errs: FieldErrors<FieldValues> | Record<string, unknown>): string[] => {
  let messages: string[] = [];
  for (const key in errs) {
    const error = errs[key];
    if (typeof error === 'object' && error !== null) {
      if ('message' in error && typeof (error as { message: unknown }).message === 'string') {
        let msg = (error as { message: string }).message;
        const lowerMsg = msg.toLowerCase();
        if (lowerMsg.includes('invalid input') || lowerMsg.includes('expected number') || lowerMsg.includes('received string')) {
          msg = 'กรุณาระบุข้อมูลให้ถูกต้อง';
        }
        messages.push(msg);
      } else {
        messages = messages.concat(extractFormErrorMessages(error as Record<string, unknown>));
      }
    }
  }
  return Array.from(new Set(messages));
};

export const handleFormErrorWithToast = (errors: FieldErrors<FieldValues>, customToast?: (msg: string | React.ReactNode, type?: string) => void) => {
    logger.error('Form Validation Errors:', errors);
    const errorMessages = extractFormErrorMessages(errors);
    
    const ui = React.createElement('div', { className: 'flex flex-col gap-1' },
      React.createElement('span', { className: 'font-semibold text-sm' }, 'ตรวจสอบข้อมูลไม่ผ่าน:'),
      React.createElement('ul', { className: 'list-disc pl-4 text-xs' },
        errorMessages.map((msg, i) => React.createElement('li', { key: i }, msg))
      )
    );

    if (customToast) {
        customToast(ui, 'error');
    } else {
        toast.error(ui);
    }
};
