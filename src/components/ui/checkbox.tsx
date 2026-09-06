import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

export const Checkbox = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Checkbox({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        type="checkbox"
        className={cn(
          "size-4 shrink-0 cursor-pointer appearance-none rounded border bg-card transition-colors duration-150 checked:border-primary checked:bg-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          "checked:bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3.5'%3E%3Cpath d='M4 12l5 5L20 6'/%3E%3C/svg%3E\")] checked:bg-[length:0.85rem] checked:bg-center checked:bg-no-repeat",
          className,
        )}
        {...props}
      />
    );
  },
);
