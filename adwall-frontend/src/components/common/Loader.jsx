import { cn } from "@/lib/utils";
const Loader = ({ className, size = "md" }) => {
  const s = { sm: "h-5 w-5 border-2", md: "h-10 w-10 border-4", lg: "h-16 w-16 border-4" };
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className={cn("animate-spin rounded-full border-brand-500 border-t-transparent", s[size])} />
    </div>
  );
};
export default Loader;
