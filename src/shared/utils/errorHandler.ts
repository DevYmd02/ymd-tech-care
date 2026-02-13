import toast from 'react-hot-toast';
import axios, { AxiosError } from 'axios';

// 1. Define Strict Interface for Backend Error
export interface ApiErrorResponse {
  message: string | string[];
  error?: string;
  statusCode?: number;
}

export const handleError = (error: unknown, context: string = 'Operation') => {
  // 1. Developer Log (Detailed)
  console.error(`❌ [${context}] Failed:`, error);

  // 2. User Feedback (Friendly)
  const message = extractErrorMessage(error);
  
  toast.error(message);
};

const extractErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') return error;
  
  // Check if it's an Axios Error with the specific Response Type
  if (axios.isAxiosError(error)) {
      // Cast the error to the generic type we expect
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const data = axiosError.response?.data;
      
      // Use Type Guard to validate the data structure at runtime
      if (data && isApiErrorResponse(data)) {
          if (Array.isArray(data.message)) {
              return data.message.join(', ');
          }
          return data.message;
      }
      
      // Fallback for Axios errors without standard payload
      if (axiosError.message) return axiosError.message;
  }

  if (error instanceof Error) {
    return error.message;
  }
  
  return 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ กรุณาลองใหม่อีกครั้ง';
};

// 2. Type Guard (Predicate) checks structure at runtime
function isApiErrorResponse(data: unknown): data is ApiErrorResponse {
    return (
        typeof data === 'object' &&
        data !== null &&
        'message' in data &&
        (
            typeof (data as Record<string, unknown>).message === 'string' || 
            Array.isArray((data as Record<string, unknown>).message)
        )
    );
}
