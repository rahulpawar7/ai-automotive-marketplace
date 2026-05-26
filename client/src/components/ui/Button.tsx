import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/format';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: ReactNode;
}

const variantClass: Record<Variant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
};

export function Button({
  variant = 'primary',
  icon,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button className={cn(variantClass[variant], className)} {...rest}>
      {icon}
      {children}
    </button>
  );
}
