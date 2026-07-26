import { type HTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function Card({
  interactive = false,
  padding = 'md',
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={clsx(
        'bg-surface rounded-xl border border-border shadow-sm',
        interactive && 'hover:shadow-md hover:border-border cursor-pointer transition-all duration-150',
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <div className={clsx('flex items-center justify-between', className)} {...props}>
      {children}
    </div>
  );
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

export function CardTitle({ className, children, ...props }: CardTitleProps) {
  return (
    <h3 className={clsx('text-base font-semibold text-primary', className)} {...props}>
      {children}
    </h3>
  );
}

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export function CardContent({ className, children, ...props }: CardContentProps) {
  return (
    <div className={clsx('mt-3', className)} {...props}>
      {children}
    </div>
  );
}
