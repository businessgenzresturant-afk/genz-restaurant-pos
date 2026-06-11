import * as React from "react"
import { cn } from "@/lib/utils"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200",
          className
        )}
        {...props}
      />
    )
  }
)
Card.displayName = "Card"

export { Card }