import { type InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-primary"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'w-full px-3 py-2 text-sm rounded-lg border bg-surface transition-colors duration-150',
            'placeholder:text-secondary/60',
            error
              ? 'border-accent-red focus:border-accent-red focus:ring-2 focus:ring-accent-red/20'
              : 'border-border focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-accent-red">{error}</p>}
        {hint && !error && (
          <p className="text-xs text-secondary">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
