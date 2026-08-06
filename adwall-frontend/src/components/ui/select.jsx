import { cn } from "@/lib/utils";
const Select = ({ children, value, onChange, className }) => (
  <select value={value} onChange={onChange} className={cn("flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring", className)}>
    {children}
  </select>
);
export { Select };
