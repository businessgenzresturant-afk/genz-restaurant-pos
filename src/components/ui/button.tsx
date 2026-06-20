import * as React from 'react';
import { ReactElement, ForwardRefExoticComponent, RefAttributes } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'gradient';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button: ForwardRefExoticComponent<
  ButtonProps & RefAttributes<HTMLButtonElement>
> = React.forwardRef(({ className = '', variant = 'default', size = 'default', ...props }, ref) => {
  // Base classes for smooth micro-animations and structural consistency
  const baseClasses = 'relative inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 ease-out will-change-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed active:scale-[0.97] select-none';

  // 3D & Modern Variants
  const variantClasses = {
    default: 'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white border border-emerald-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_1px_2px_rgba(0,0,0,0.2)] hover:from-emerald-400 hover:to-emerald-500 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_2px_4px_rgba(16,185,129,0.3)] active:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_0px_0px_rgba(0,0,0,0.2)] active:translate-y-[1px]',
    destructive: 'bg-gradient-to-b from-red-500 to-red-600 text-white border border-red-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_1px_2px_rgba(0,0,0,0.2)] hover:from-red-400 hover:to-red-500 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_2px_4px_rgba(220,38,38,0.3)] active:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_0px_0px_rgba(0,0,0,0.2)] active:translate-y-[1px]',
    outline: 'bg-background border-2 border-input text-foreground shadow-sm hover:border-primary hover:text-primary hover:bg-primary/10 hover:shadow-[0_2px_8px_rgba(16,185,129,0.15)] active:translate-y-[1px]',
    secondary: 'bg-secondary text-secondary-foreground border border-border shadow-sm hover:bg-secondary/80 active:translate-y-[1px]',
    ghost: 'text-muted-foreground hover:bg-accent hover:text-accent-foreground active:bg-accent/80',
    link: 'underline-offset-4 hover:underline text-emerald-600 hover:text-emerald-500',
    gradient: 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white border border-emerald-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_10px_rgba(16,185,129,0.3)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_4px_15px_rgba(16,185,129,0.4)] hover:-translate-y-[1px] active:translate-y-[1px] active:shadow-sm',
  };

  const sizeClasses = {
    default: 'h-11 px-5 py-2.5',
    sm: 'h-9 px-4 rounded-lg text-xs font-bold tracking-wide',
    lg: 'h-14 px-8 rounded-2xl text-base font-bold shadow-md',
    icon: 'h-11 w-11 rounded-xl',
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