import { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: ReactNode;
}

export const Card = ({ className = '', children, ...props }: CardProps) => {
  // Premium glassmorphic / modern card design supporting Dark Mode
  const baseClasses = 'rounded-2xl bg-card text-card-foreground backdrop-blur-sm shadow-sm border border-border/50 hover:shadow-md transition-all duration-300';

  return (
    <div className={`${baseClasses} ${className}`} {...props}>
      {children}
    </div>
  );
};

Card.displayName = 'Card';