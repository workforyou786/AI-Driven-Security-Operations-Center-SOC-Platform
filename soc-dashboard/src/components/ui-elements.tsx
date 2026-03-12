import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-xl border border-border/50 bg-card/80 backdrop-blur-md shadow-lg shadow-black/20 overflow-hidden", className)} {...props} />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn("font-semibold leading-none tracking-tight text-foreground/90", className)} {...props} />
))
CardTitle.displayName = "CardTitle"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'secondary' | 'cyan', size?: 'default' | 'sm' | 'lg' | 'icon' }>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variants = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)]",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-[0_0_15px_rgba(225,29,72,0.3)]",
      outline: "border border-border bg-transparent hover:bg-accent/10 text-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      ghost: "hover:bg-accent/10 hover:text-accent-foreground text-muted-foreground",
      cyan: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.1)]",
    }
    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-12 rounded-md px-8",
      icon: "h-9 w-9",
    }
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-95",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

const Badge = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'outline' | 'destructive' }>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants = {
      default: "border-transparent bg-primary text-primary-foreground",
      outline: "text-foreground border-border",
      destructive: "border-transparent bg-destructive text-destructive-foreground",
    }
    return (
      <div ref={ref} className={cn("inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring", variants[variant], className)} {...props} />
    )
  }
)
Badge.displayName = "Badge"

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...props }, ref) => {
  return (
    <select
      className={cn(
        "flex h-10 w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 appearance-none",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Select.displayName = "Select"

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto rounded-md border border-border">
    <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b border-border bg-secondary/50", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
))
TableBody.displayName = "TableBody"

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(({ className, ...props }, ref) => (
  <tr ref={ref} className={cn("border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted", className)} {...props} />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(({ className, ...props }, ref) => (
  <th ref={ref} className={cn("h-10 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 uppercase tracking-wider text-xs", className)} {...props} />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(({ className, ...props }, ref) => (
  <td ref={ref} className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0 font-mono text-sm", className)} {...props} />
))
TableCell.displayName = "TableCell"

export { Card, CardHeader, CardTitle, CardContent, Button, Badge, Input, Select, Table, TableHeader, TableBody, TableRow, TableHead, TableCell }
