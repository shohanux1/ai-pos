import { FieldError, UseFormRegisterReturn } from 'react-hook-form'

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  name: string
  register: UseFormRegisterReturn
  error?: FieldError
  required?: boolean
}

export function FormField({
  label,
  name,
  register,
  error,
  required = false,
  className = '',
  ...props
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={name}
        {...register}
        className={`input-field ${error ? 'border-red-500 focus:border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-500 mt-1">{error.message}</p>
      )}
    </div>
  )
}