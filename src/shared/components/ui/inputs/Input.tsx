import React from 'react';
import type { UseFormRegister, Path, FieldValues } from 'react-hook-form';
import { styles } from '@/shared/constants/styles';

// รับ Generic T เพื่อให้ Type Safe กับทุก Form
interface InputProps<T extends FieldValues> extends React.InputHTMLAttributes<HTMLInputElement> {
  name: Path<T>;
  register: UseFormRegister<T>;
  error?: boolean;
}

export const Input = <T extends FieldValues>({ register, name, className, error, ...props }: InputProps<T>) => (
  <input 
    {...register(name)} 
    id={props.id || String(name)}
    aria-invalid={error ? "true" : "false"}
    aria-describedby={error ? `${String(name)}-error` : undefined}
    className={`${error ? styles.inputError : styles.input} ${className || ''}`}
    {...props}
  />
);
