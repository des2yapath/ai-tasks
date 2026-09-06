import { cn } from "@/lib/utils/cn";

type BadgeVariant = "default" | "secondary" | "outline" | "destructive";

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-primary/10 text-primary border-transparent",
  secondary: "bg-secondary text-secondary-foreground border-transparent",
  outline: "text-foreground border-border",
  destructive: "bg-destructive/10 text-destructive border-transparent",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
