import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "relative text-primary-foreground shadow-[0_6px_20px_-6px_color-mix(in_oklab,var(--primary)_60%,transparent)] transition-all hover:shadow-[0_10px_28px_-8px_color-mix(in_oklab,var(--primary)_70%,transparent)] hover:-translate-y-[1px] bg-[linear-gradient(180deg,color-mix(in_oklab,var(--primary)_92%,white_8%)_0%,var(--primary)_45%,color-mix(in_oklab,var(--primary)_85%,black_15%)_100%)] before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-1/2 before:rounded-t-[inherit] before:bg-[linear-gradient(180deg,rgba(255,255,255,0.28),rgba(255,255,255,0))]",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background/60 backdrop-blur shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        brand: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors",
        glass:
          "border border-border bg-background text-foreground hover:bg-accent transition-colors",
      },
      size: {
        default: "min-h-[44px] h-11 px-4",
        sm: "min-h-[44px] h-10 rounded-md px-3 text-sm",
        lg: "min-h-[44px] h-12 rounded-md px-6",
        icon: "min-h-[44px] h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
