import * as React from 'react';
import { ReactElement, ForwardRefExoticComponent, RefAttributes } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'gradient';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button: ForwardRefExoticComponent<
  ButtonProps & RefAttributes<HTMLButtonElement>
> = React.forwardRef(({ className = '', variant = 'default', size = 'default', ...props }, ref) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background active:scale-95';

  const variantClasses = {
    default: 'bg-gray-900 text-white hover:bg-gray-800',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'border-2 border-gray-300 hover:bg-gray-100 hover:border-gray-400',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    ghost: 'hover:bg-gray-100 hover:text-gray-900',
    link: 'underline-offset-4 hover:underline text-orange-600',
    gradient: 'bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 text-white hover:shadow-lg hover:shadow-orange-500/30 hover:scale-105',
  };

  const sizeClasses = {
    default: 'h-11 px-5 py-2.5',
    sm: 'h-9 px-3.5 rounded-lg text-xs font-bold',
    lg: 'h-13 px-7 rounded-xl font-bold',
    icon: 'h-10 w-10 rounded-xl',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      ref={ref}
      {...props}
    />
  );
});

Button.displayName = 'Button';