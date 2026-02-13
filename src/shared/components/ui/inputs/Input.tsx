import React from 'react';
import type { UseFormRegister, Path, FieldValues } from 'react-hook-form';
//import { UseFormRegister, Path, FieldValues } from 'react-hook-form';

// รับ Generic T เพื่อให้ Type Safe กับทุก Form
interface InputProps<T extends FieldValues> extends React.InputHTMLAttributes<HTMLInputElement> {
  name: Path<T>;
  register: UseFormRegister<T>;
}

export const Input = <T extends FieldValues>({ register, name, className, ...props }: InputProps<T>) => (
  <input 
    {...register(name)} 
    className={`w-full border border-gray-400 rounded-sm px-2 py-1 text-sm focus:outline-none focus:border-blue-500 disabled:bg-gray-100 ${className}`}
    {...props}
  />
);
