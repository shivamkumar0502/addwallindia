import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
const badgeVariants = cva("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors", {
  variants: {
    variant: {
      default: "border-transparent bg-brand-500 text-white",
      secondary: "border-transparent bg-secondary text-secondary-foreground",
      destructive: "border-transparent bg-red-500 text-white",
      outline: "text-foreground",
      success: "border-transparent bg-green-100 text-green-700",
      warning: "border-transparent bg-yellow-100 text-yellow-700",
    },
  },
  defaultVariants: { variant: "default" },
});
const Badge = ({ className, variant, ...props }) => <div className={cn(badgeVariants({ variant }), className)} {...props} />;
export { Badge, badgeVariants };
