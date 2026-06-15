import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helpText?: string
}

export function Input({ label, error, helpText, className = '', id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-[#111827]"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          w-full px-3 py-2 text-sm text-[#111827] bg-white
          border rounded-[8px] transition-colors
          placeholder:text-[#9CA3AF]
          focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[#F9FAFB]
          ${error ? 'border-[#DC2626]' : 'border-[#E5E3DF]'}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-[#DC2626]">{error}</p>}
      {helpText && !error && <p className="text-xs text-[#6B7280]">{helpText}</p>}
    </div>
  )
}
