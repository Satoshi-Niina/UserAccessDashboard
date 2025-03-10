
import * as React from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  heading: string
  description?: string
}

export function PageHeader({
  heading,
  description,
  children,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div className={cn("mb-6", className)} {...props}>
      <h1 className="text-2xl font-bold">{heading}</h1>
      {description && (
        <p className="text-muted-foreground mt-1">{description}</p>
      )}
      {children}
    </div>
  )
}
