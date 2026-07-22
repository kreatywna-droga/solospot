import type { ReactNode } from 'react'
import { Input } from './Input'

interface FormFieldProps {
  label: string
  error?: string
  children?: ReactNode
  className?: string
}

export function FormField({ label, error, children, className = '' }: FormFieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="block text-sm font-medium text-slate-300">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  )
}

// Convenience: FormField with an Input built-in
interface FormInputProps {
  label: string
  error?: string
  icon?: ReactNode
  className?: string
}

export function FormInput({ label, error, icon, className, ...props }: FormInputProps & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FormField label={label} error={error} className={className}>
      <Input icon={icon} error={error} {...props} />
    </FormField>
  )
}
